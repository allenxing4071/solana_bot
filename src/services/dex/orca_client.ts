import { PublicKey, Connection } from '@solana/web3.js';
import { PoolInfo, LiquidityData, DexType } from '../../core/types.js';
import logger from '../../core/logger.js';
import { EventEmitter } from 'events';
import BN from 'bn.js';

/**
 * Orca 客户端类
 * 负责与 Orca DEX 进行交互
 */
export class OrcaClient extends EventEmitter {
  private connection: Connection;
  private config: any;
  private knownPools: Map<string, PoolInfo>;
  private monitoringInterval: NodeJS.Timeout | null;
  private lastUpdateTime: number;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1秒
  private readonly ERROR_COOLDOWN = 5000; // 5秒
  private lastErrorTime: number = 0;
  private readonly CONSISTENCY_CHECK_INTERVAL = 60000; // 1分钟
  private consistencyCheckInterval: NodeJS.Timeout | null = null;
  private lastConsistencyCheck: number = 0;
  private readonly ALERT_THRESHOLDS = {
    errorRate: 0.1, // 10% 错误率
    responseTime: 5000, // 5秒
    cacheMissRate: 0.2, // 20% 缓存未命中率
    consistencyErrors: 3 // 3次一致性错误
  };

  private metrics = {
    requestCount: 0,
    errorCount: 0,
    totalResponseTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    consistencyErrors: 0,
    lastAlertTime: 0
  };

  constructor(connection: Connection, config: any) {
    super();
    this.connection = connection;
    this.config = config;
    this.knownPools = new Map();
    this.monitoringInterval = null;
    this.lastUpdateTime = Date.now();
    this.startConsistencyCheck();
  }

  private async withRetry<T>(operation: () => Promise<T>, retries: number = this.MAX_RETRIES): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0) {
        const now = Date.now();
        if (now - this.lastErrorTime < this.ERROR_COOLDOWN) {
          await new Promise(resolve => setTimeout(resolve, this.ERROR_COOLDOWN));
        }
        
        logger.warn(`操作失败，正在重试 (剩余重试次数: ${retries})`, 'OrcaClient', {
          error: error instanceof Error ? error.message : String(error)
        });
        
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        this.lastErrorTime = now;
        return this.withRetry(operation, retries - 1);
      }
      throw error;
    }
  }

  async getTokenPrice(mint: PublicKey): Promise<number> {
    return this.withRetry(async () => {
      try {
        // 获取代币池信息
        const poolInfo = await this.getPoolInfo(mint);
        if (!poolInfo) {
          throw new Error(`No pool found for token ${mint.toString()}`);
        }

        // 计算代币价格
        const price = this.calculatePrice(poolInfo);
        logger.debug(`Token price for ${mint.toString()}: ${price}`);
        return price;
      } catch (error) {
        logger.error(`Failed to get token price: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    });
  }

  async getTokenVolume(mint: PublicKey, timeframe: string): Promise<number> {
    return this.withRetry(async () => {
      try {
        const poolInfo = await this.getPoolInfo(mint);
        if (!poolInfo) {
          throw new Error(`No pool found for token ${mint.toString()}`);
        }

        // 解析24小时交易量
        const volume = parseFloat(poolInfo.volume24h);
        return isNaN(volume) ? 0 : volume;
      } catch (error) {
        logger.error(`Failed to get token volume: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    });
  }

  async getTokenLiquidity(mint: PublicKey): Promise<LiquidityData> {
    return this.withRetry(async () => {
      try {
        const poolInfo = await this.getPoolInfo(mint);
        if (!poolInfo) {
          throw new Error(`No pool found for token ${mint.toString()}`);
        }

        // 计算美元价值
        const liquidityUsd = await this.calculateLiquidityUsd(poolInfo);

        // 检查流动性变化
        const liquidityChange = await this.checkLiquidityChange(poolInfo);
        if (liquidityChange.percentage > this.config.liquidityChangeThreshold) {
          this.emit('liquidityChange', {
            pool: poolInfo,
            change: liquidityChange,
            timestamp: Date.now()
          });
        }

        // 检查流动性健康度
        const healthStatus = this.checkLiquidityHealth(poolInfo);
        if (healthStatus !== 'healthy') {
          this.emit('liquidityHealth', {
            pool: poolInfo,
            status: healthStatus,
            timestamp: Date.now()
          });
        }

        return {
          totalLiquidity: poolInfo.liquidity,
          liquidityUsd,
          poolAddress: poolInfo.address.toString(),
          dex: DexType.ORCA,
          timestamp: Date.now()
        };
      } catch (error) {
        logger.error(`Failed to get token liquidity: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    });
  }

  private async calculateLiquidityUsd(poolInfo: PoolInfo): Promise<string> {
    try {
      // 获取代币价格
      const tokenAPrice = await this.getTokenPrice(poolInfo.tokenAMint);
      const tokenBPrice = await this.getTokenPrice(poolInfo.tokenBMint);

      // 计算代币A的美元价值
      const tokenABalance = new BN(poolInfo.liquidity).div(new BN(2));
      const tokenAUsd = tokenABalance.mul(new BN(tokenAPrice * 100)).div(new BN(100));

      // 计算代币B的美元价值
      const tokenBBalance = new BN(poolInfo.liquidity).div(new BN(2));
      const tokenBUsd = tokenBBalance.mul(new BN(tokenBPrice * 100)).div(new BN(100));

      // 计算总美元价值
      const totalUsd = tokenAUsd.add(tokenBUsd);
      return totalUsd.toString();
    } catch (error) {
      logger.error(`计算流动性美元价值失败`, 'OrcaClient', {
        error: error instanceof Error ? error.message : String(error)
      });
      return '0';
    }
  }

  private async checkLiquidityChange(poolInfo: PoolInfo): Promise<{ amount: string; percentage: number }> {
    try {
      const poolKey = `${DexType.ORCA}:${poolInfo.address.toString()}`;
      const oldPool = this.knownPools.get(poolKey);
      
      if (!oldPool) {
        return { amount: '0', percentage: 0 };
      }

      const oldLiquidity = new BN(oldPool.liquidity);
      const newLiquidity = new BN(poolInfo.liquidity);
      
      const changeAmount = newLiquidity.sub(oldLiquidity);
      const changePercentage = (changeAmount.mul(new BN(100)).div(oldLiquidity)).toNumber();

      return {
        amount: changeAmount.toString(),
        percentage: changePercentage
      };
    } catch (error) {
      logger.error(`检查流动性变化失败`, 'OrcaClient', {
        error: error instanceof Error ? error.message : String(error)
      });
      return { amount: '0', percentage: 0 };
    }
  }

  private checkLiquidityHealth(poolInfo: PoolInfo): 'healthy' | 'warning' | 'critical' {
    try {
      const liquidity = new BN(poolInfo.liquidity);
      const volume24h = new BN(poolInfo.volume24h);

      // 检查流动性是否过低
      if (liquidity.lt(new BN(this.config.minLiquidityThreshold))) {
        return 'critical';
      }

      // 检查24小时交易量是否异常
      const volumeToLiquidityRatio = volume24h.mul(new BN(100)).div(liquidity).toNumber();
      if (volumeToLiquidityRatio > this.config.maxVolumeToLiquidityRatio) {
        return 'warning';
      }

      return 'healthy';
    } catch (error) {
      logger.error(`检查流动性健康度失败`, 'OrcaClient', {
        error: error instanceof Error ? error.message : String(error)
      });
      return 'critical';
    }
  }

  private async getPoolInfo(mint: PublicKey): Promise<PoolInfo | null> {
    try {
      // 检查已知池子
      const poolKey = `${DexType.ORCA}:${mint.toString()}`;
      const knownPool = this.knownPools.get(poolKey);
      if (knownPool) {
        return knownPool;
      }

      // TODO: 实现从链上获取池子信息
      // 这里先返回一个模拟数据
      const poolInfo: PoolInfo = {
        address: new PublicKey('11111111111111111111111111111111'),
        dex: DexType.ORCA,
        tokenAMint: mint,
        tokenBMint: new PublicKey('11111111111111111111111111111111'),
        tokenA: mint.toString(),
        tokenB: '11111111111111111111111111111111',
        liquidity: '0',
        volume24h: '0',
        timestamp: Date.now(),
        firstDetectedAt: Date.now()
      };

      // 缓存池子信息
      this.knownPools.set(poolKey, poolInfo);
      return poolInfo;
    } catch (error) {
      logger.error(`Failed to get pool info: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private calculatePrice(poolInfo: PoolInfo): number {
    try {
      // 从池子信息中获取代币余额
      const tokenABalance = parseFloat(poolInfo.liquidity) / 2;
      const tokenBBalance = parseFloat(poolInfo.liquidity) / 2;

      // 计算价格（假设 tokenB 是计价货币）
      const price = tokenBBalance / tokenABalance;
      return price;
    } catch (error) {
      logger.error(`价格计算失败`, 'OrcaClient', {
        error: error instanceof Error ? error.message : String(error)
      });
      return 0;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // 检查连接状态
      const slot = await this.connection.getSlot();
      if (slot === 0) {
        throw new Error('Failed to get current slot');
      }

      // 检查 API 端点
      const response = await fetch(this.config.apiEndpoint);
      if (!response.ok) {
        throw new Error(`API endpoint returned ${response.status}`);
      }

      return true;
    } catch (error) {
      logger.error(`Orca health check failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  // 新增方法：获取所有已知池子
  getKnownPools(): PoolInfo[] {
    return Array.from(this.knownPools.values());
  }

  // 新增方法：更新池子信息
  updatePoolInfo(poolKey: string, updates: Partial<PoolInfo>): void {
    const pool = this.knownPools.get(poolKey);
    if (!pool) {
      logger.warn(`尝试更新不存在的池子: ${poolKey}`);
      return;
    }

    // 更新池子信息
    const updatedPool = { ...pool, ...updates };
    this.knownPools.set(poolKey, updatedPool);

    logger.debug(`池子信息已更新: ${poolKey}`, 'OrcaClient', {
      updates: Object.keys(updates)
    });
  }

  /**
   * 启动池子监控
   * @param interval 监控间隔（毫秒）
   */
  startMonitoring(interval: number = 5000): void {
    if (this.monitoringInterval) {
      logger.warn('池子监控已经在运行中', 'OrcaClient');
      return;
    }

    logger.info('启动 Orca 池子监控', 'OrcaClient', { interval });
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.updateAllPools();
      } catch (error) {
        logger.error('池子监控更新失败', 'OrcaClient', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }, interval);
  }

  /**
   * 停止池子监控
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('停止 Orca 池子监控', 'OrcaClient');
    }
    this.stopConsistencyCheck();
  }

  /**
   * 更新所有池子信息
   */
  private async updateAllPools(): Promise<void> {
    const pools = this.getKnownPools();
    const currentTime = Date.now();

    for (const pool of pools) {
      try {
        const updatedPool = await this.fetchPoolInfo(pool.address);
        if (updatedPool) {
          const poolKey = `${DexType.ORCA}:${pool.address.toString()}`;
          this.updatePoolInfo(poolKey, updatedPool);
          
          // 检查价格变化
          const priceChange = this.calculatePriceChange(pool, updatedPool);
          if (Math.abs(priceChange) > this.config.priceChangeThreshold) {
            this.emit('priceChange', {
              pool: updatedPool,
              priceChange,
              timestamp: currentTime
            });
          }

          // 检查交易量变化
          const volumeChange = this.calculateVolumeChange(pool, updatedPool);
          if (Math.abs(volumeChange) > this.config.volumeChangeThreshold) {
            this.emit('volumeChange', {
              pool: updatedPool,
              volumeChange,
              timestamp: currentTime
            });
          }
        }
      } catch (error) {
        logger.error(`更新池子信息失败: ${pool.address.toString()}`, 'OrcaClient', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    this.lastUpdateTime = currentTime;
  }

  /**
   * 获取24小时交易量
   */
  private async get24HourVolume(poolAddress: PublicKey): Promise<string> {
    try {
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      // 获取最近的签名
      const signatures = await this.connection.getSignaturesForAddress(
        poolAddress,
        { limit: 1000 }
      );

      // 过滤24小时内的交易
      const recentSignatures = signatures.filter(sig => 
        sig.blockTime && sig.blockTime * 1000 > oneDayAgo
      );

      // 获取交易详情
      let totalVolume = new BN(0);
      let totalTransactions = 0;
      let volumeByHour: { [key: number]: BN } = {};
      let lastHour = -1;

      for (const sig of recentSignatures) {
        try {
          const tx = await this.connection.getTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0
          });

          if (tx && tx.meta) {
            // 解析交易中的代币转移
            const preBalances = tx.meta.preBalances;
            const postBalances = tx.meta.postBalances;
            
            // 计算代币A的变化
            const tokenAChange = new BN(Math.abs(postBalances[0] - preBalances[0]));
            // 计算代币B的变化
            const tokenBChange = new BN(Math.abs(postBalances[1] - preBalances[1]));
            
            // 累加交易量
            const txVolume = tokenAChange.add(tokenBChange);
            totalVolume = totalVolume.add(txVolume);
            totalTransactions++;

            // 按小时统计交易量
            if (sig.blockTime) {
              const hour = Math.floor(sig.blockTime / 3600);
              if (hour !== lastHour) {
                volumeByHour[hour] = new BN(0);
                lastHour = hour;
              }
              volumeByHour[hour] = volumeByHour[hour].add(txVolume);
            }
          }
        } catch (error) {
          logger.warn(`解析交易失败: ${sig.signature}`, 'OrcaClient', {
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      // 记录统计信息
      logger.info('24小时交易量统计', 'OrcaClient', {
        poolAddress: poolAddress.toString(),
        totalVolume: totalVolume.toString(),
        totalTransactions,
        volumeByHour: Object.entries(volumeByHour).map(([hour, volume]) => ({
          hour,
          volume: volume.toString()
        }))
      });

      return totalVolume.toString();
    } catch (error) {
      logger.error(`获取24小时交易量失败: ${poolAddress.toString()}`, 'OrcaClient', {
        error: error instanceof Error ? error.message : String(error)
      });
      return '0';
    }
  }

  /**
   * 从链上获取池子信息
   */
  private async fetchPoolInfo(poolAddress: PublicKey): Promise<PoolInfo | null> {
    try {
      // 获取账户信息
      const accountInfo = await this.connection.getAccountInfo(poolAddress);
      if (!accountInfo) {
        logger.warn(`池子账户不存在: ${poolAddress.toString()}`, 'OrcaClient');
        return null;
      }

      // 解析账户数据
      const data = accountInfo.data;
      
      // 解析代币信息
      const tokenAMint = new PublicKey(data.slice(8, 40));
      const tokenBMint = new PublicKey(data.slice(40, 72));
      
      // 解析流动性信息
      const tokenABalance = new BN(data.slice(72, 80), 'le');
      const tokenBBalance = new BN(data.slice(80, 88), 'le');
      
      // 计算总流动性
      const totalLiquidity = tokenABalance.add(tokenBBalance).toString();
      
      // 获取24小时交易量
      const volume24h = await this.get24HourVolume(poolAddress);

      return {
        address: poolAddress,
        dex: DexType.ORCA,
        tokenAMint,
        tokenBMint,
        tokenA: tokenAMint.toString(),
        tokenB: tokenBMint.toString(),
        liquidity: totalLiquidity,
        volume24h,
        timestamp: Date.now(),
        firstDetectedAt: Date.now()
      };
    } catch (error) {
      logger.error(`获取池子信息失败: ${poolAddress.toString()}`, 'OrcaClient', {
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * 计算价格变化
   */
  private calculatePriceChange(oldPool: PoolInfo, newPool: PoolInfo): number {
    const oldPrice = this.calculatePrice(oldPool);
    const newPrice = this.calculatePrice(newPool);
    return ((newPrice - oldPrice) / oldPrice) * 100;
  }

  /**
   * 计算交易量变化
   */
  private calculateVolumeChange(oldPool: PoolInfo, newPool: PoolInfo): number {
    const oldVolume = parseFloat(oldPool.volume24h);
    const newVolume = parseFloat(newPool.volume24h);
    return ((newVolume - oldVolume) / oldVolume) * 100;
  }

  private startConsistencyCheck(): void {
    if (this.consistencyCheckInterval) {
      logger.warn('一致性检查已经在运行中', 'OrcaClient');
      return;
    }

    logger.info('启动 Orca 数据一致性检查', 'OrcaClient');
    this.consistencyCheckInterval = setInterval(async () => {
      try {
        await this.checkDataConsistency();
      } catch (error) {
        logger.error('数据一致性检查失败', 'OrcaClient', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }, this.CONSISTENCY_CHECK_INTERVAL);
  }

  private stopConsistencyCheck(): void {
    if (this.consistencyCheckInterval) {
      clearInterval(this.consistencyCheckInterval);
      this.consistencyCheckInterval = null;
      logger.info('停止 Orca 数据一致性检查', 'OrcaClient');
    }
  }

  private async checkDataConsistency(): Promise<void> {
    const currentTime = Date.now();
    if (currentTime - this.lastConsistencyCheck < this.CONSISTENCY_CHECK_INTERVAL) {
      return;
    }

    logger.info('开始数据一致性检查', 'OrcaClient');
    const pools = this.getKnownPools();
    let inconsistencies = 0;

    for (const pool of pools) {
      try {
        const freshData = await this.fetchPoolInfo(pool.address);
        if (!freshData) {
          continue;
        }

        const isConsistent = this.validatePoolConsistency(pool, freshData);
        if (!isConsistent) {
          inconsistencies++;
          logger.warn('发现数据不一致', 'OrcaClient', {
            poolAddress: pool.address.toString(),
            oldData: {
              liquidity: pool.liquidity,
              volume24h: pool.volume24h
            },
            newData: {
              liquidity: freshData.liquidity,
              volume24h: freshData.volume24h
            }
          });

          // 更新池子信息
          const poolKey = `${DexType.ORCA}:${pool.address.toString()}`;
          this.updatePoolInfo(poolKey, freshData);
        }
      } catch (error) {
        logger.error(`检查池子数据一致性失败: ${pool.address.toString()}`, 'OrcaClient', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    if (inconsistencies > 0) {
      this.emit('dataInconsistency', {
        count: inconsistencies,
        timestamp: currentTime
      });
    }

    this.lastConsistencyCheck = currentTime;
  }

  private validatePoolConsistency(oldPool: PoolInfo, newPool: PoolInfo): boolean {
    try {
      // 检查流动性变化
      const oldLiquidity = new BN(oldPool.liquidity);
      const newLiquidity = new BN(newPool.liquidity);
      const liquidityDiff = oldLiquidity.sub(newLiquidity).abs();
      const liquidityThreshold = oldLiquidity.div(new BN(100)); // 1% 阈值

      if (liquidityDiff.gt(liquidityThreshold)) {
        logger.warn('流动性数据不一致', 'OrcaClient', {
          poolAddress: oldPool.address.toString(),
          oldLiquidity: oldPool.liquidity,
          newLiquidity: newPool.liquidity
        });
        return false;
      }

      // 检查交易量变化
      const oldVolume = new BN(oldPool.volume24h);
      const newVolume = new BN(newPool.volume24h);
      const volumeDiff = oldVolume.sub(newVolume).abs();
      const volumeThreshold = oldVolume.div(new BN(100)); // 1% 阈值

      if (volumeDiff.gt(volumeThreshold)) {
        logger.warn('交易量数据不一致', 'OrcaClient', {
          poolAddress: oldPool.address.toString(),
          oldVolume: oldPool.volume24h,
          newVolume: newPool.volume24h
        });
        return false;
      }

      return true;
    } catch (error) {
      logger.error(`验证池子数据一致性失败`, 'OrcaClient', {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }
} 