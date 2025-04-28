import { PublicKey, Connection } from '@solana/web3.js';
import { PoolInfo, LiquidityData, DexType, LogLevel } from '../../core/types.js';
import type { Logger } from 'winston';
import { EventEmitter } from 'events';
import BN from 'bn.js';
import fs from 'fs';
import path from 'path';

interface JupiterPoolInfo {
  address: string;
  dex: DexType;
  tokenA: string;
  tokenB: string;
  liquidity: string;
  volume24h: string;
  price: number;
  lastUpdate: number;
  firstDetectedAt: number;
  timestamp: number;
}

interface AlertData {
  type: string;
  timestamp: number;
  [key: string]: any;
}

interface ConsistencyThresholds {
  price: number;
  volume: number;
  liquidity: number;
  maxRetries: number;
  retryDelay: number;
}

/**
 * Jupiter 客户端类
 * 负责与 Jupiter DEX 进行交互
 */
export class JupiterClient extends EventEmitter {
  private readonly MODULE_NAME = 'JupiterClient';
  private readonly connection: Connection;
  private readonly logger: Logger;
  private pools: Map<string, JupiterPoolInfo> = new Map();
  private crossDexPools: Map<string, JupiterPoolInfo[]> = new Map();
  private metrics: {
    requestCount: number;
    errorCount: number;
    totalResponseTime: number;
    avgResponseTime: number;
    cacheHits: number;
    cacheMisses: number;
    consistencyChecks: number;
    consistencyErrors: number;
    crossDexChecks: number;
    crossDexErrors: number;
    lastError: Error | null;
    lastErrorTime: number;
    startTime: number;
    backupCount: number;
    lastBackupTime: number;
    cacheHitRate: number;
    errorRate: number;
    consistencyErrorRate: number;
    crossDexErrorRate: number;
    successRate: number;
    lastAlertTime: number;
    performanceAlerts: number;
    dataInconsistencies: number;
    inconsistencyEvents: Array<{
      timestamp: number;
      poolAddress: string;
      differences: {
        price: number;
        volume: number;
        liquidity: number;
      };
    }>;
    averageResponseTime: number;
  } = {
    requestCount: 0,
    errorCount: 0,
    totalResponseTime: 0,
    avgResponseTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    consistencyChecks: 0,
    consistencyErrors: 0,
    crossDexChecks: 0,
    crossDexErrors: 0,
    lastError: null,
    lastErrorTime: 0,
    startTime: Date.now(),
    backupCount: 0,
    lastBackupTime: 0,
    cacheHitRate: 0,
    errorRate: 0,
    consistencyErrorRate: 0,
    crossDexErrorRate: 0,
    successRate: 0,
    lastAlertTime: 0,
    performanceAlerts: 0,
    dataInconsistencies: 0,
    inconsistencyEvents: [],
    averageResponseTime: 0
  };
  private config: any;
  private monitoringInterval: NodeJS.Timeout | null;
  private lastUpdateTime: number;
  private readonly MAX_RETRIES: number = 3;
  private readonly CACHE_TTL: number = 5 * 60 * 1000; // 5分钟缓存过期
  private readonly ERROR_COOLDOWN: number = 1000; // 错误冷却时间（毫秒）
  private readonly CONSISTENCY_CHECK_INTERVAL: number = 60 * 1000; // 一致性检查间隔（毫秒）
  private readonly ALERT_THRESHOLDS = {
    errorRate: 0.1,
    responseTime: 1000,
    cacheHitRate: 0.7,
    consistencyErrorRate: 0.1
  };
  private readonly CROSS_DEX_CHECK_INTERVAL: number = 5 * 60 * 1000; // 5分钟跨DEX检查间隔
  private readonly BACKUP_INTERVAL: number = 30 * 60 * 1000; // 30分钟备份间隔
  private readonly BACKUP_RETENTION: number = 7 * 24 * 60 * 60 * 1000; // 7天备份保留期
  private readonly BACKUP_DIR: string = 'data/backups/jupiter';
  private backupTimer: NodeJS.Timeout | null = null;
  private readonly MIN_BATCH_SIZE: number = 5;
  private readonly MAX_BATCH_SIZE: number = 20;
  private readonly BATCH_ADJUSTMENT_INTERVAL: number = 5 * 60 * 1000; // 5分钟调整一次
  private currentBatchSize: number = 10;
  private batchAdjustmentTimer: NodeJS.Timeout | null = null;
  private readonly ALERT_COOLDOWN = 5 * 60 * 1000; // 5分钟冷却时间

  private readonly API_RATE_LIMIT = {
    maxRequests: 100,
    timeWindow: 60 * 1000, // 1分钟
    currentRequests: 0,
    lastReset: Date.now()
  };

  private readonly RETRY_STRATEGY = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2
  };

  private readonly CONSISTENCY_THRESHOLDS = {
    price: 0.05, // 5% 价格差异
    volume: 0.1, // 10% 交易量差异
    liquidity: 0.15, // 15% 流动性差异
    maxRetries: 3,
    retryDelay: 1000
  };

  constructor(connection: Connection, config: any, logger: Logger) {
    super();
    this.connection = connection;
    this.config = config;
    this.logger = logger;
    this.monitoringInterval = null;
    this.lastUpdateTime = Date.now();
    
    this.logger.info('JupiterClient initialized', this.MODULE_NAME);
    
    // 确保备份目录存在
    this.ensureBackupDir();
    
    // 启动各种检查
    this.startConsistencyCheck();
    this.startCrossDexComparison();
    this.startBackup();
    
    // 启动批量大小调整
    this.startBatchSizeAdjustment();
  }

  /**
   * 确保备份目录存在
   */
  private ensureBackupDir(): void {
    if (!fs.existsSync(this.BACKUP_DIR)) {
      fs.mkdirSync(this.BACKUP_DIR, { recursive: true });
    }
  }

  /**
   * 启动数据备份
   */
  private startBackup(): void {
    this.backupTimer = setInterval(async () => {
      try {
        await this.backupData();
      } catch (error) {
        this.handleError('数据备份失败', error);
      }
    }, this.BACKUP_INTERVAL);
  }

  /**
   * 备份数据
   */
  private async backupData(): Promise<void> {
    const timestamp = Date.now();
    const backupFile = path.join(this.BACKUP_DIR, `backup_${timestamp}.json`);
    
    const backupData = {
      timestamp,
      pools: Array.from(this.pools.entries()),
      crossDexData: Array.from(this.crossDexPools.entries()),
      metrics: this.metrics
    };

    try {
      await fs.promises.writeFile(
        backupFile,
        JSON.stringify(backupData, null, 2)
      );

      this.metrics.backupCount++;
      this.metrics.lastBackupTime = timestamp;
      
      this.logger.info('数据备份成功', this.MODULE_NAME, {
        backupFile,
        poolCount: this.pools.size,
        crossDexDataCount: this.crossDexPools.size
      });

      // 清理旧备份
      await this.cleanupOldBackups();
    } catch (error) {
      this.handleError('数据备份写入失败', error);
    }
  }

  /**
   * 清理旧备份
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.BACKUP_DIR);
      const now = Date.now();

      for (const file of files) {
        if (!file.startsWith('backup_') || !file.endsWith('.json')) continue;

        const filePath = path.join(this.BACKUP_DIR, file);
        const stats = await fs.promises.stat(filePath);
        
        if (now - stats.mtimeMs > this.BACKUP_RETENTION) {
          await fs.promises.unlink(filePath);
          this.logger.info('清理旧备份', this.MODULE_NAME, { file });
        }
      }
    } catch (error) {
      this.handleError('清理旧备份失败', error);
    }
  }

  /**
   * 恢复数据
   */
  private async restoreData(backupFile?: string): Promise<boolean> {
    try {
      let fileToRestore = backupFile;
      if (!fileToRestore) {
        const files = await fs.promises.readdir(this.BACKUP_DIR);
        if (files.length === 0) {
          this.logger.warn('No backup files found', this.MODULE_NAME);
          return false;
        }
        fileToRestore = path.join(this.BACKUP_DIR, files[files.length - 1]);
      }

      const backupContent = await fs.promises.readFile(fileToRestore, 'utf-8');
      const backupData = JSON.parse(backupContent);
      await this.restoreFromBackup(backupData);

      this.logger.info('数据恢复成功', this.MODULE_NAME, {
        backupFile: fileToRestore,
        poolCount: this.pools.size,
        crossDexDataCount: this.crossDexPools.size
      });

      return true;
    } catch (error) {
      this.handleError('restoreData', error);
      return false;
    }
  }

  /**
   * 导出数据
   */
  private async exportData(options: {
    format?: 'json' | 'csv';
    includeMetrics?: boolean;
    timeRange?: { start: number; end: number };
  } = {}): Promise<string> {
    try {
      const { format = 'json', includeMetrics = true } = options;
      const exportData = {
        timestamp: Date.now(),
        pools: Array.from(this.pools.entries()),
        crossDexData: Array.from(this.crossDexPools.entries())
      };

      if (includeMetrics) {
        Object.assign(exportData, { metrics: this.metrics });
      }

      let result: string;
      if (format === 'json') {
        result = JSON.stringify(exportData, null, 2);
      } else {
        // 实现 CSV 格式导出
        result = ''; // TODO: 实现 CSV 转换
      }

      this.logger.info('数据导出成功', this.MODULE_NAME, {
        format,
        poolCount: exportData.pools.length,
        size: result.length
      });

      return result;
    } catch (error) {
      this.handleError('exportData', error);
      return '';
    }
  }

  /**
   * 停止服务
   */
  async stop(): Promise<void> {
    // 停止所有定时器
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }

    if (this.batchAdjustmentTimer) {
      clearInterval(this.batchAdjustmentTimer);
      this.batchAdjustmentTimer = null;
    }

    // 执行最后一次备份
    try {
      await this.backupData();
    } catch (error) {
      this.handleError('停止服务时备份失败', error);
    }

    this.logger.info('Jupiter客户端已停止', this.MODULE_NAME, {
      metrics: this.getMetrics(),
      finalBatchSize: this.currentBatchSize
    });
  }

  /**
   * 启动一致性检查
   */
  private startConsistencyCheck(): void {
    setInterval(async () => {
      try {
        await this.validateDataConsistency();
      } catch (error) {
        this.handleError('一致性检查失败', error);
      }
    }, this.CONSISTENCY_CHECK_INTERVAL);
  }

  /**
   * 增强数据一致性验证
   */
  private async validateDataConsistency(): Promise<void> {
    try {
      const pools = this.getKnownPools();
      const inconsistencies: string[] = [];
      
      for (const pool of pools) {
        const key = `${DexType.JUPITER}:${pool.address.toString()}`;
        const cachedPool = this.pools.get(key);
        
        if (!cachedPool) continue;
        
        // 获取最新数据
        const latestPool = await this.fetchPoolInfoWithRetry(new PublicKey(pool.address));
        if (!latestPool) continue;
        
        // 验证数据一致性
        const isConsistent = this.validatePoolConsistency(cachedPool, latestPool);
        if (!isConsistent) {
          inconsistencies.push(pool.address.toString());
          this.handleInconsistency(key, cachedPool, latestPool);
        }
      }
      
      // 更新一致性检查指标
      this.metrics.consistencyChecks++;
      this.metrics.consistencyErrors += inconsistencies.length;
      
      // 触发告警
      if (inconsistencies.length > 0) {
        this.emit('consistencyAlert', {
          type: 'dataInconsistency',
          message: `发现 ${inconsistencies.length} 个数据不一致的池子`,
          details: inconsistencies,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      this.handleError('数据一致性验证失败', error);
    }
  }

  /**
   * 验证池子数据一致性
   */
  private validatePoolConsistency(cached: JupiterPoolInfo, latest: JupiterPoolInfo): boolean {
    if (!cached.price || !latest.price) {
      return false;
    }
    const priceDiff = Math.abs(cached.price - latest.price) / cached.price;
    const volumeDiff = Math.abs(parseFloat(cached.volume24h) - parseFloat(latest.volume24h)) / parseFloat(cached.volume24h);
    
    return priceDiff <= this.CONSISTENCY_THRESHOLDS.price && volumeDiff <= this.CONSISTENCY_THRESHOLDS.volume;
  }

  /**
   * 处理数据不一致
   */
  private handleInconsistency(key: string, cached: JupiterPoolInfo, latest: JupiterPoolInfo): void {
    // 更新缓存
    this.pools.set(key, latest);
    
    // 记录不一致事件
    this.metrics.inconsistencyEvents.push({
      timestamp: Date.now(),
      poolAddress: cached.address.toString(),
      differences: {
        price: Math.abs(cached.price - latest.price),
        volume: Math.abs(parseFloat(cached.volume24h) - parseFloat(latest.volume24h)),
        liquidity: Math.abs(parseFloat(cached.liquidity) - parseFloat(latest.liquidity))
      }
    });
    
    // 触发告警
    this.emit('inconsistency', {
      type: 'poolDataInconsistency',
      poolAddress: cached.address.toString(),
      differences: {
        price: Math.abs(cached.price - latest.price),
        volume: Math.abs(parseFloat(cached.volume24h) - parseFloat(latest.volume24h)),
        liquidity: Math.abs(parseFloat(cached.liquidity) - parseFloat(latest.liquidity))
      },
      timestamp: Date.now()
    });
  }

  /**
   * 启动跨DEX数据比对
   */
  private startCrossDexComparison(): void {
    setInterval(async () => {
      try {
        await this.compareCrossDexData();
      } catch (error) {
        this.handleError('跨DEX数据比对失败', error);
      }
    }, this.CROSS_DEX_CHECK_INTERVAL);
  }

  /**
   * 比较跨DEX数据
   */
  private async compareCrossDexData(): Promise<void> {
    try {
      const pools = this.getKnownPools();
      const crossDexData = new Map<string, JupiterPoolInfo[]>();
      
      for (const pool of pools) {
        const data = await this.fetchCrossDexData(pool.address.toString());
        if (data.length > 0) {
          crossDexData.set(pool.address.toString(), data);
        }
      }
      
      for (const pool of pools) {
        const crossDexPool = crossDexData.get(pool.address.toString());
        if (!crossDexPool) continue;
        
        const priceDiff = Math.abs(pool.price - crossDexPool[0].price) / pool.price;
        const volumeDiff = Math.abs(parseFloat(pool.volume24h) - parseFloat(crossDexPool[0].volume24h)) / parseFloat(pool.volume24h);
        
        if (priceDiff > this.CONSISTENCY_THRESHOLDS.price) {
          this.handleCrossDexInconsistency(pool, crossDexPool[0], 'price', priceDiff);
        }
        
        if (volumeDiff > this.CONSISTENCY_THRESHOLDS.volume) {
          this.handleCrossDexInconsistency(pool, crossDexPool[0], 'volume', volumeDiff);
        }
      }
      
      // 更新跨 DEX 比较指标
      this.metrics.crossDexChecks++;
    } catch (error) {
      this.handleError('跨 DEX 数据比较失败', error);
    }
  }

  /**
   * 处理跨 DEX 数据不一致
   */
  private handleCrossDexInconsistency(
    localPool: JupiterPoolInfo,
    crossDexPool: JupiterPoolInfo,
    type: 'price' | 'volume',
    diff: number
  ): void {
    this.metrics.crossDexErrors++;
    
    this.emit('crossDexInconsistency', {
      type: 'crossDexDataInconsistency',
      poolAddress: localPool.address.toString(),
      dataType: type,
      localValue: type === 'price' ? localPool.price : parseFloat(localPool.volume24h),
      crossDexValue: type === 'price' ? crossDexPool.price : parseFloat(crossDexPool.volume24h),
      difference: diff,
      timestamp: Date.now()
    });
    
    this.logger.warn(`跨 DEX ${type} 不一致: ${localPool.address.toString()}`, {
      local: type === 'price' ? localPool.price : parseFloat(localPool.volume24h),
      crossDex: type === 'price' ? crossDexPool.price : parseFloat(crossDexPool.volume24h),
      diff
    });
  }

  /**
   * 获取跨DEX数据
   */
  private getCrossDexData(poolAddress: string, options: { validate?: boolean } = {}): JupiterPoolInfo[] {
    const data = this.crossDexPools.get(poolAddress);
    if (!data) {
      this.logger.debug(`No cross-DEX data found for pool: ${poolAddress}`, this.MODULE_NAME);
      return [];
    }
    return data;
  }

  /**
   * 获取性能指标
   */
  private getMetrics(): typeof this.metrics {
    const totalRequests = this.metrics.requestCount;
    const totalChecks = this.metrics.consistencyChecks;
    const totalCrossDexChecks = this.metrics.crossDexChecks;

    const metrics = {
      ...this.metrics,
      cacheHitRate: totalRequests > 0 
        ? this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)
        : 0,
      errorRate: totalRequests > 0 ? this.metrics.errorCount / totalRequests : 0,
      consistencyErrorRate: totalChecks > 0 
        ? this.metrics.consistencyErrors / totalChecks
        : 0,
      crossDexErrorRate: totalCrossDexChecks > 0
        ? this.metrics.crossDexErrors / totalCrossDexChecks
        : 0,
      successRate: totalRequests > 0 
        ? (totalRequests - this.metrics.errorCount) / totalRequests
        : 0
    };

    return metrics;
  }

  async getTokenPrice(mint: PublicKey): Promise<number> {
    try {
      // 获取代币池信息
      const poolInfo = await this.getPoolInfo(mint.toString());
      if (!poolInfo) {
        throw new Error(`No pool found for token ${mint.toString()}`);
      }

      // 计算代币价格
      const price = this.calculatePrice(poolInfo);
      this.logger.debug(`Token price for ${mint.toString()}: ${price}`);
      return price;
    } catch (error) {
      this.logger.error(`Failed to get token price: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async getTokenVolume(mint: PublicKey, timeframe: string): Promise<number> {
    try {
      const poolInfo = await this.getPoolInfo(mint.toString());
      if (!poolInfo) {
        throw new Error(`No pool found for token ${mint.toString()}`);
      }

      // 解析24小时交易量
      const volume = parseFloat(poolInfo.volume24h);
      return isNaN(volume) ? 0 : volume;
    } catch (error) {
      this.logger.error(`Failed to get token volume: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async getTokenLiquidity(mint: PublicKey): Promise<LiquidityData> {
    try {
      const poolInfo = await this.getPoolInfo(mint.toString());
      if (!poolInfo) {
        throw new Error(`No pool found for token ${mint.toString()}`);
      }

      return {
        totalLiquidity: poolInfo.liquidity,
        liquidityUsd: '0', // TODO: 实现美元价值计算
        poolAddress: poolInfo.address.toString(),
        dex: DexType.JUPITER,
        timestamp: Date.now()
      };
    } catch (error) {
      this.logger.error(`Failed to get token liquidity: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 启动池子监控
   * @param interval 监控间隔（毫秒）
   */
  startMonitoring(interval: number = 5000): void {
    if (this.monitoringInterval) {
      this.logger.warn('池子监控已经在运行中', this.MODULE_NAME);
      return;
    }

    this.logger.info('启动 Jupiter 池子监控', this.MODULE_NAME, { interval });
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.updateAllPools();
      } catch (error) {
        this.logger.error('池子监控更新失败', this.MODULE_NAME, {
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
      this.logger.info('停止 Jupiter 池子监控', this.MODULE_NAME);
    }
  }

  /**
   * 更新所有池子信息
   */
  private async updateAllPools(): Promise<void> {
    const pools = this.getKnownPools();
    const currentTime = Date.now();

    for (const pool of pools) {
      try {
        const updatedPool = await this.fetchPoolInfo(pool.address.toString());
        if (updatedPool) {
          const poolKey = `${DexType.JUPITER}:${pool.address.toString()}`;
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
        this.logger.error(`更新池子信息失败: ${pool.address.toString()}`, this.MODULE_NAME, {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    this.lastUpdateTime = currentTime;
  }

  /**
   * 从链上获取池子信息
   */
  private async fetchPoolInfo(poolAddress: string): Promise<JupiterPoolInfo | null> {
    try {
      const publicKey = new PublicKey(poolAddress);
      // Implementation details...
      return null;
    } catch (error) {
      this.handleError('fetchPoolInfo', error);
      return null;
    }
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
            totalVolume = totalVolume.add(tokenAChange).add(tokenBChange);
          }
        } catch (error) {
          this.logger.warn(`解析交易失败: ${sig.signature}`, this.MODULE_NAME, {
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      return totalVolume.toString();
    } catch (error) {
      this.logger.error(`获取24小时交易量失败: ${poolAddress.toString()}`, this.MODULE_NAME, {
        error: error instanceof Error ? error.message : String(error)
      });
      return '0';
    }
  }

  /**
   * 计算价格变化
   */
  private calculatePriceChange(oldPool: JupiterPoolInfo, newPool: JupiterPoolInfo): number {
    const oldPrice = this.calculatePrice(oldPool);
    const newPrice = this.calculatePrice(newPool);
    return ((newPrice - oldPrice) / oldPrice) * 100;
  }

  /**
   * 计算交易量变化
   */
  private calculateVolumeChange(oldPool: JupiterPoolInfo, newPool: JupiterPoolInfo): number {
    const oldVolume = parseFloat(oldPool.volume24h);
    const newVolume = parseFloat(newPool.volume24h);
    return ((newVolume - oldVolume) / oldVolume) * 100;
  }

  private calculatePrice(poolInfo: JupiterPoolInfo): number {
    try {
      // 从池子信息中获取代币余额
      const tokenABalance = parseFloat(poolInfo.liquidity) / 2;
      const tokenBBalance = parseFloat(poolInfo.liquidity) / 2;

      // 计算价格（假设 tokenB 是计价货币）
      const price = tokenBBalance / tokenABalance;
      return price;
    } catch (error) {
      this.logger.error(`价格计算失败`, this.MODULE_NAME, {
        error: error instanceof Error ? error.message : String(error)
      });
      return 0;
    }
  }

  // 获取所有已知池子
  getKnownPools(): JupiterPoolInfo[] {
    return Array.from(this.pools.values());
  }

  // 更新池子信息
  updatePoolInfo(poolKey: string, updates: Partial<JupiterPoolInfo>): void {
    const pool = this.pools.get(poolKey);
    if (!pool) {
      this.logger.warn(`尝试更新不存在的池子: ${poolKey}`, this.MODULE_NAME);
      return;
    }

    // 更新池子信息
    const updatedPool = { ...pool, ...updates };
    this.pools.set(poolKey, updatedPool);

    this.logger.debug(`池子信息已更新: ${poolKey}`, this.MODULE_NAME, {
      updates: Object.keys(updates)
    });
  }

  /**
   * 健康检查增强版
   */
  async healthCheck(): Promise<boolean> {
    try {
      const startTime = Date.now();
      
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

      // 检查性能指标
      const metrics = this.getMetrics();
      const isHealthy = 
        metrics.successRate > 95 && // 成功率大于95%
        metrics.avgResponseTime < 1000 && // 平均响应时间小于1秒
        Date.now() - this.metrics.lastErrorTime > 60000; // 最近1分钟内无错误

      // 记录健康检查结果
      this.logger.info('Jupiter health check completed', this.MODULE_NAME, {
        duration: Date.now() - startTime,
        metrics,
        isHealthy
      });

      return isHealthy;
    } catch (error) {
      this.handleError('Health check failed', error);
      return false;
    }
  }

  /**
   * 启动批量大小动态调整
   */
  private startBatchSizeAdjustment(): void {
    this.batchAdjustmentTimer = setInterval(() => {
      this.adjustBatchSize();
    }, this.BATCH_ADJUSTMENT_INTERVAL);
  }

  /**
   * 动态调整批量大小
   */
  private adjustBatchSize(): void {
    const metrics = this.getMetrics();
    
    // 根据性能指标调整批量大小
    if (metrics.errorRate > this.ALERT_THRESHOLDS.errorRate) {
      // 错误率过高，减小批量大小
      this.currentBatchSize = Math.max(
        this.MIN_BATCH_SIZE,
        this.currentBatchSize - 2
      );
    } else if (metrics.avgResponseTime < 500) {
      // 响应时间良好，增加批量大小
      this.currentBatchSize = Math.min(
        this.MAX_BATCH_SIZE,
        this.currentBatchSize + 2
      );
    }

    this.logger.info('批量大小已调整', this.MODULE_NAME, {
      newBatchSize: this.currentBatchSize,
      errorRate: metrics.errorRate,
      avgResponseTime: metrics.avgResponseTime
    });
  }

  /**
   * 优化 API 调用
   */
  private async optimizeApiCalls(): Promise<void> {
    try {
      const pools = this.getKnownPools();
      const batchSize = this.calculateOptimalBatchSize();
      
      for (let i = 0; i < pools.length; i += batchSize) {
        const batch = pools.slice(i, i + batchSize);
        await this.processBatch(batch);
        
        // 动态调整请求延迟
        const delay = this.calculateRequestDelay();
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      this.handleError('API 调用优化失败', error);
    }
  }

  /**
   * 处理批次请求
   */
  private async processBatch(batch: JupiterPoolInfo[]): Promise<void> {
    await Promise.all(
      batch.map(async (pool) => {
        try {
          await this.checkRateLimit();
          const startTime = Date.now();
          
          const updatedPool = await this.fetchPoolInfoWithRetry(new PublicKey(pool.address));
          if (updatedPool) {
            this.updatePoolInfo(
              `${DexType.JUPITER}:${pool.address.toString()}`,
              updatedPool
            );
          }
          
          this.updateMetrics(Date.now() - startTime, true);
        } catch (error) {
          this.handleError('批量更新池子信息失败', error);
        }
      })
    );
  }

  /**
   * 检查速率限制
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    
    // 重置计数器
    if (now - this.API_RATE_LIMIT.lastReset > this.API_RATE_LIMIT.timeWindow) {
      this.API_RATE_LIMIT.currentRequests = 0;
      this.API_RATE_LIMIT.lastReset = now;
    }
    
    // 检查是否超过限制
    if (this.API_RATE_LIMIT.currentRequests >= this.API_RATE_LIMIT.maxRequests) {
      const waitTime = this.API_RATE_LIMIT.timeWindow - (now - this.API_RATE_LIMIT.lastReset);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.API_RATE_LIMIT.currentRequests = 0;
      this.API_RATE_LIMIT.lastReset = Date.now();
    }
    
    this.API_RATE_LIMIT.currentRequests++;
  }

  /**
   * 计算最优批次大小
   */
  private calculateOptimalBatchSize(): number {
    const metrics = this.getMetrics();
    let batchSize = this.currentBatchSize;
    
    // 根据错误率调整
    if (metrics.errorRate > this.ALERT_THRESHOLDS.errorRate) {
      batchSize = Math.max(this.MIN_BATCH_SIZE, batchSize - 2);
    } else if (metrics.avgResponseTime < 500) {
      batchSize = Math.min(this.MAX_BATCH_SIZE, batchSize + 2);
    }
    
    // 根据系统负载调整
    const systemLoad = this.calculateSystemLoad();
    if (systemLoad > 0.8) {
      batchSize = Math.max(this.MIN_BATCH_SIZE, batchSize - 1);
    } else if (systemLoad < 0.3) {
      batchSize = Math.min(this.MAX_BATCH_SIZE, batchSize + 1);
    }
    
    return batchSize;
  }

  /**
   * 计算系统负载
   */
  private calculateSystemLoad(): number {
    const metrics = this.getMetrics();
    const requestRate = metrics.requestCount / ((Date.now() - metrics.startTime) / 1000);
    const errorRate = metrics.errorRate;
    const responseTime = metrics.avgResponseTime / 1000;
    
    // 归一化各项指标
    const normalizedRequestRate = Math.min(requestRate / 10, 1);
    const normalizedErrorRate = Math.min(errorRate * 10, 1);
    const normalizedResponseTime = Math.min(responseTime, 1);
    
    // 计算综合负载
    return (normalizedRequestRate + normalizedErrorRate + normalizedResponseTime) / 3;
  }

  /**
   * 计算请求延迟
   */
  private calculateRequestDelay(): number {
    const metrics = this.getMetrics();
    
    // 根据错误率和响应时间动态调整延迟
    let baseDelay = 1000; // 基础延迟1秒
    
    if (metrics.errorRate > this.ALERT_THRESHOLDS.errorRate) {
      // 错误率过高，增加延迟
      baseDelay *= 2;
    } else if (metrics.avgResponseTime < 500) {
      // 响应时间良好，减少延迟
      baseDelay = Math.max(500, baseDelay / 2);
    }
    
    return baseDelay;
  }

  /**
   * 智能告警规则
   */
  private smartAlertRules(): void {
    const metrics = this.getMetrics();
    const now = Date.now();
    
    // 检查错误率趋势
    this.checkErrorRateTrend();
    
    // 检查响应时间趋势
    this.checkResponseTimeTrend();
    
    // 检查数据一致性趋势
    this.checkConsistencyTrend();
    
    // 检查系统负载
    this.checkSystemLoad();
  }

  /**
   * 检查错误率趋势
   */
  private checkErrorRateTrend(): void {
    const currentRate = this.metrics.errorRate;
    const trend = currentRate > this.metrics.errorRate ? 'increasing' : 'decreasing';
    
    this.emitAlert('errorRateTrend', {
      type: 'errorRateTrend',
      timestamp: Date.now(),
      currentRate,
      trend
    });
  }

  /**
   * 检查响应时间趋势
   */
  private checkResponseTimeTrend(): void {
    const currentTime = this.metrics.averageResponseTime;
    const trend = currentTime > this.ALERT_THRESHOLDS.responseTime ? 'increasing' : 'decreasing';
    
    this.emitAlert('responseTimeTrend', {
      type: 'responseTimeTrend',
      timestamp: Date.now(),
      currentTime,
      trend
    });
  }

  /**
   * 检查一致性趋势
   */
  private checkConsistencyTrend(): void {
    const currentRate = this.metrics.consistencyErrorRate;
    const trend = currentRate > this.ALERT_THRESHOLDS.consistencyErrorRate ? 'increasing' : 'decreasing';
    
    this.emitAlert('consistencyTrend', {
      type: 'consistencyTrend',
      timestamp: Date.now(),
      currentRate,
      trend
    });
  }

  /**
   * 检查系统负载
   */
  private checkSystemLoad(): void {
    const requestCount = this.metrics.requestCount;
    const errorRate = this.metrics.errorRate;
    const responseTime = this.metrics.averageResponseTime;
    
    this.emitAlert('systemLoad', {
      type: 'systemLoad',
      timestamp: Date.now(),
      requestCount,
      errorRate,
      responseTime
    });
  }

  /**
   * 增强监控和告警
   */
  private enhanceMonitoring(): void {
    // 错误率监控
    const errorRate = this.metrics.errorRate;
    const errorCount = this.metrics.errorCount;
    const requestCount = this.metrics.requestCount;
    
    if (errorRate > this.ALERT_THRESHOLDS.errorRate) {
      this.emitAlert('highErrorRate', {
        type: 'highErrorRate',
        timestamp: Date.now(),
        errorRate,
        errorCount,
        requestCount
      });
    }

    // 响应时间监控
    const avgResponseTime = this.metrics.averageResponseTime;
    if (avgResponseTime > this.ALERT_THRESHOLDS.responseTime) {
      this.emitAlert('highResponseTime', {
        type: 'highResponseTime',
        timestamp: Date.now(),
        avgResponseTime,
        requestCount
      });
    }

    // 缓存命中率监控
    const cacheMissRate = 1 - this.metrics.cacheHitRate;
    const hits = this.metrics.cacheHits;
    const misses = this.metrics.cacheMisses;
    
    if (cacheMissRate > (1 - this.ALERT_THRESHOLDS.cacheHitRate)) {
      this.emitAlert('lowCacheHitRate', {
        type: 'lowCacheHitRate',
        timestamp: Date.now(),
        cacheMissRate,
        hits,
        misses
      });
    }

    // 一致性错误监控
    const consistencyErrorRate = this.metrics.consistencyErrorRate;
    const errors = this.metrics.consistencyErrors;
    const checks = this.metrics.consistencyChecks;
    
    if (consistencyErrorRate > this.ALERT_THRESHOLDS.consistencyErrorRate) {
      this.emitAlert('highConsistencyErrorRate', {
        type: 'highConsistencyErrorRate',
        timestamp: Date.now(),
        errorRate: consistencyErrorRate,
        errors,
        checks
      });
    }
  }

  /**
   * 生成系统状态报告
   */
  private async generateStatusReport(): Promise<void> {
    try {
      const metrics = this.getMetrics();
      const report = {
        timestamp: Date.now(),
        uptime: Date.now() - this.metrics.startTime,
        pools: {
          total: this.pools.size,
          active: Array.from(this.pools.values()).filter(p => 
            Date.now() - p.lastUpdate < this.CACHE_TTL
          ).length
        },
        performance: {
          requestCount: metrics.requestCount,
          errorRate: metrics.errorRate,
          averageResponseTime: metrics.averageResponseTime,
          cacheHitRate: metrics.cacheHitRate
        },
        consistency: {
          checks: metrics.consistencyChecks,
          errors: metrics.consistencyErrors,
          errorRate: metrics.consistencyErrorRate
        },
        alerts: {
          total: metrics.performanceAlerts,
          lastAlert: new Date(metrics.lastAlertTime).toISOString()
        }
      };

      this.logger.info('System status report generated', this.MODULE_NAME, { report });
    } catch (error) {
      this.handleError('generateStatusReport', error);
    }
  }

  /**
   * 优化数据存储结构
   */
  private async optimizeDataStorage(): Promise<void> {
    try {
      const now = Date.now();
      let optimizedCount = 0;
      
      // 优化池子数据
      for (const [address, pool] of this.pools.entries()) {
        if (now - pool.lastUpdate > this.CACHE_TTL * 2) {
          this.pools.delete(address);
          optimizedCount++;
        }
      }

      // 优化跨DEX数据
      for (const [address, pools] of this.crossDexPools.entries()) {
        const validPools = pools.filter(p => now - p.lastUpdate <= this.CACHE_TTL);
        if (validPools.length === 0) {
          this.crossDexPools.delete(address);
        } else {
          this.crossDexPools.set(address, validPools);
        }
      }

      this.logger.info('Data storage optimized', this.MODULE_NAME, {
        removedPools: optimizedCount,
        currentPoolCount: this.pools.size,
        currentCrossDexPoolCount: this.crossDexPools.size
      });
    } catch (error) {
      this.handleError('optimizeDataStorage', error);
    }
  }

  /**
   * 压缩数字存储
   */
  private compressNumber(value: string): string {
    try {
      const num = new BN(value);
      return num.toString(36); // 使用36进制压缩
    } catch (error) {
      return value; // 压缩失败时返回原值
    }
  }

  /**
   * 解压数字
   */
  private decompressNumber(value: string): string {
    try {
      const num = new BN(value, 36);
      return num.toString();
    } catch (error) {
      return value; // 解压失败时返回原值
    }
  }

  /**
   * 生成优化建议
   */
  private generateOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    
    // 基于性能指标生成优化建议
    if (this.metrics.errorRate > 0.05) {
      suggestions.push('考虑增加重试次数或优化错误处理机制');
    }
    
    if (this.metrics.avgResponseTime > 500) {
      suggestions.push('建议优化API调用频率或增加缓存策略');
    }
    
    if (this.metrics.cacheHitRate < 0.6) {
      suggestions.push('建议增加缓存大小或优化缓存策略');
    }
    
    if (this.metrics.consistencyErrorRate > 0.05) {
      suggestions.push('建议加强数据一致性验证机制');
    }
    
    this.logger.info('生成优化建议', this.MODULE_NAME, { suggestions });
    return suggestions;
  }

  /**
   * 启动服务
   */
  async start(): Promise<void> {
    try {
      // 恢复数据
      await this.restoreData();
      
      // 启动监控
      this.startMonitoring();
      
      this.logger.info('Jupiter client started successfully', this.MODULE_NAME, {
        metrics: this.getMetrics()
      });
    } catch (error) {
      this.handleError('Failed to start Jupiter client', error);
      throw error;
    }
  }

  /**
   * 处理错误并更新指标
   */
  private handleError(context: string, error: unknown): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    this.metrics.errorCount++;
    this.metrics.lastError = errorObj;
    this.metrics.lastErrorTime = Date.now();
    
    this.logger.error(`Error in ${context}: ${errorObj.message}`, this.MODULE_NAME, {
      error: errorObj,
      stack: errorObj.stack
    });
    
    this.emit('error', { context, error: errorObj });
  }

  /**
   * 带重试机制的池子信息获取
   */
  private async fetchPoolInfoWithRetry(mint: PublicKey): Promise<JupiterPoolInfo | null> {
    let retries = 0;
    while (retries < this.CONSISTENCY_THRESHOLDS.maxRetries) {
      try {
        const poolInfo = await this.fetchPoolInfo(mint.toString());
        if (poolInfo) {
          return poolInfo;
        }
        retries++;
      } catch (error) {
        retries++;
        if (retries === this.CONSISTENCY_THRESHOLDS.maxRetries) {
          this.handleError('池子信息获取重试失败', error);
          throw error;
        }
        // 指数退避重试
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * this.CONSISTENCY_THRESHOLDS.retryDelay));
      }
    }
    return null;
  }

  private async fetchCrossDexData(poolAddress: string): Promise<JupiterPoolInfo[]> {
    try {
      const crossDexPools: JupiterPoolInfo[] = [];
      
      // 从 Orca 获取数据
      if (this.config.dexes.orca.enabled) {
        const orcaPool = await this.fetchOrcaPoolData(poolAddress);
        if (orcaPool) {
          crossDexPools.push({
            ...orcaPool,
            dex: DexType.ORCA,
            lastUpdate: Date.now()
          });
        }
      }
      
      // 从 Raydium 获取数据
      if (this.config.dexes.raydium.enabled) {
        const raydiumPool = await this.fetchRaydiumPoolData(poolAddress);
        if (raydiumPool) {
          crossDexPools.push({
            ...raydiumPool,
            dex: DexType.RAYDIUM,
            lastUpdate: Date.now()
          });
        }
      }
      
      return crossDexPools;
    } catch (error) {
      this.handleError('fetchCrossDexData', error);
      return [];
    }
  }

  private async fetchOrcaPoolData(poolAddress: string): Promise<JupiterPoolInfo | null> {
    try {
      // TODO: 实现从 Orca 获取池子数据的具体逻辑
      return null;
    } catch (error) {
      this.handleError('fetchOrcaPoolData', error);
      return null;
    }
  }

  private async fetchRaydiumPoolData(poolAddress: string): Promise<JupiterPoolInfo | null> {
    try {
      // TODO: 实现从 Raydium 获取池子数据的具体逻辑
      return null;
    } catch (error) {
      this.handleError('fetchRaydiumPoolData', error);
      return null;
    }
  }

  public async getPoolInfo(poolAddress: string): Promise<JupiterPoolInfo | null> {
    return this.fetchPoolInfo(poolAddress);
  }

  private updateMetrics(responseTime: number, isSuccess: boolean): void {
    const totalRequests = this.metrics.requestCount;
    if (totalRequests > 0) {
      this.metrics.totalResponseTime += responseTime;
      this.metrics.avgResponseTime = this.metrics.totalResponseTime / totalRequests;
      this.metrics.cacheHits += isSuccess ? 1 : 0;
      this.metrics.cacheMisses += isSuccess ? 0 : 1;
      this.metrics.successRate = isSuccess ? 1 - this.metrics.errorCount / totalRequests : 0;
      this.metrics.errorRate = this.metrics.errorCount / totalRequests;
      this.metrics.consistencyErrorRate = this.metrics.consistencyErrors / this.metrics.consistencyChecks;
      this.metrics.crossDexErrorRate = this.metrics.crossDexErrors / this.metrics.crossDexChecks;
    }
  }

  private emitAlert(alertType: string, data: AlertData): void {
    const now = Date.now();
    if (now - this.metrics.lastAlertTime > this.ALERT_COOLDOWN) {
      this.emit('alert', {
        alertType,
        alertTimestamp: now,
        ...data
      });
      this.metrics.lastAlertTime = now;
      this.metrics.performanceAlerts++;
    }
  }

  private async restoreFromBackup(backupData: {
    pools: Array<[string, JupiterPoolInfo]>;
    crossDexData: Array<[string, JupiterPoolInfo[]]>;
    metrics: typeof this.metrics;
  }, options: { validate?: boolean } = {}): Promise<void> {
    try {
      const poolEntries = backupData.pools.map(([key, value]) => [key, value] as [string, JupiterPoolInfo]);
      const crossDexEntries = backupData.crossDexData.map(([key, value]) => [key, value] as [string, JupiterPoolInfo[]]);
      
      this.pools = new Map<string, JupiterPoolInfo>(poolEntries);
      this.crossDexPools = new Map<string, JupiterPoolInfo[]>(crossDexEntries);
      Object.assign(this.metrics, backupData.metrics);
      
      this.logger.info('Data restored from backup', this.MODULE_NAME, {
        poolCount: this.pools.size,
        crossDexDataCount: this.crossDexPools.size
      });
    } catch (error) {
      this.handleError('restoreFromBackup', error);
    }
  }
} 