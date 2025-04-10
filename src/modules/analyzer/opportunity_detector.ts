/**
 * 机会检测器
 * 负责分析新池子，评估交易机会，计算价格和滑点
 */

import { PublicKey } from '@solana/web3.js';
import logger from '../../core/logger';
import { PoolInfo, TokenInfo, TradingOpportunity } from '../../core/types';
import tokenValidator from './token_validator';
import appConfig from '../../core/config';

const MODULE_NAME = 'OpportunityDetector';

/**
 * 池子分析结果接口
 */
interface PoolAnalysisResult {
  isValid: boolean;
  tokenInfo?: TokenInfo;
  estimatedPriceUsd?: number;
  liquidityUsd?: number;
  confidenceScore: number;
  reason?: string;
}

/**
 * 机会检测器类
 * 负责检测并分析交易机会
 */
export class OpportunityDetector {
  // 基础交易代币(SOL或USDC)
  private baseTokens: TokenInfo[] = [];
  // 最小要求流动性(美元)
  private minLiquidityUsd: number;
  // 最大初始价格(美元)
  private maxInitialPriceUsd: number;
  
  /**
   * 构造函数
   */
  constructor() {
    try {
      // 从配置中加载设置
      this.minLiquidityUsd = appConfig.security.tokenValidation.minLiquidityUsd || 1000;
      this.maxInitialPriceUsd = appConfig.security.tokenValidation.maxInitialPriceUsd || 0.01;
      
      // 记录配置加载信息
      logger.debug('加载机会检测器配置', MODULE_NAME, {
        minLiquidityUsd: this.minLiquidityUsd,
        maxInitialPriceUsd: this.maxInitialPriceUsd
      });
    } catch (err) {
      // 配置加载出错时使用默认值
      logger.warn('加载配置时出错，使用默认值', MODULE_NAME, { error: err instanceof Error ? err.message : String(err) });
      this.minLiquidityUsd = 1000;
      this.maxInitialPriceUsd = 0.01;
    }
    
    // 初始化基础代币列表 (通常是SOL和USDC)
    this.initializeBaseTokens();
    
    logger.info('机会检测器初始化完成', MODULE_NAME);
  }
  
  /**
   * 初始化基础代币列表
   */
  private initializeBaseTokens(): void {
    // SOL代币信息
    this.baseTokens.push({
      mint: new PublicKey('So11111111111111111111111111111111111111112'), // 包装后的SOL地址
      symbol: 'SOL',
      name: 'Solana',
      decimals: 9,
      isVerified: true,
      isTrusted: true
    });
    
    // USDC代币信息
    this.baseTokens.push({
      mint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC地址
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      isVerified: true,
      isTrusted: true
    });
  }
  
  /**
   * 分析新池子并检测交易机会
   * @param poolInfo 池子信息
   * @returns 交易机会或null(如果没有有效机会)
   */
  async detectOpportunity(poolInfo: PoolInfo): Promise<TradingOpportunity | null> {
    logger.debug('分析池子: ' + poolInfo.address.toBase58(), MODULE_NAME, {
      dex: poolInfo.dex,
      tokenA: poolInfo.tokenAMint.toBase58(),
      tokenB: poolInfo.tokenBMint.toBase58()
    });
    
    try {
      // 1. 确定目标代币和基础代币
      const [targetToken, baseToken] = await this.identifyTokens(poolInfo);
      
      if (!targetToken || !baseToken) {
        logger.debug('跳过池子: 无法识别目标代币或基础代币', MODULE_NAME, {
          poolAddress: poolInfo.address.toBase58()
        });
        return null;
      }
      
      // 2. 验证目标代币
      const validationResult = await tokenValidator.validateToken(targetToken);
      
      if (!validationResult.isValid) {
        logger.debug('跳过池子: 代币验证失败 - ' + (validationResult.reason || '未知原因'), MODULE_NAME, {
          token: targetToken.symbol || targetToken.mint.toBase58()
        });
        return null;
      }
      
      // 3. 分析池子
      const analysis = await this.analyzePool(poolInfo, targetToken, baseToken);
      
      if (!analysis.isValid) {
        logger.debug('跳过池子: 分析失败 - ' + (analysis.reason || '未知原因'), MODULE_NAME, {
          token: targetToken.symbol || targetToken.mint.toBase58()
        });
        return null;
      }
      
      // 4. 如果所有检查都通过，创建交易机会
      const priorityScore = this.calculatePriorityScore(analysis, poolInfo, targetToken);
      
      // 获取预估的输出数量
      const estimatedOutAmount = this.estimateOutputAmount(
        poolInfo,
        baseToken,
        targetToken,
        appConfig.trading.buyStrategy.maxAmountPerTrade
      );
      
      // 创建交易机会对象
      const opportunity: TradingOpportunity = {
        pool: poolInfo,
        targetToken,
        baseToken,
        estimatedPriceUsd: analysis.estimatedPriceUsd,
        estimatedSlippage: this.estimateSlippage(poolInfo, analysis.liquidityUsd),
        confidence: analysis.confidenceScore,
        liquidityUsd: analysis.liquidityUsd,
        action: 'buy',
        priorityScore,
        timestamp: Date.now(),
        estimatedOutAmount
      };
      
      logger.info('检测到交易机会: ' + (targetToken.symbol || targetToken.mint.toBase58()), MODULE_NAME, {
        dex: poolInfo.dex,
        price: analysis.estimatedPriceUsd,
        score: priorityScore.toFixed(2),
        liquidity: analysis.liquidityUsd
      });
      
      return opportunity;
    } catch (error) {
      logger.error('分析池子时出错: ' + poolInfo.address.toBase58(), MODULE_NAME, {
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }
  
  /**
   * 识别目标代币和基础代币
   * @param poolInfo 池子信息
   * @returns [目标代币, 基础代币] 或 [null, null]
   */
  private async identifyTokens(poolInfo: PoolInfo): Promise<[TokenInfo | null, TokenInfo | null]> {
    const tokenAIsBase = this.isBaseToken(poolInfo.tokenAMint);
    const tokenBIsBase = this.isBaseToken(poolInfo.tokenBMint);
    
    // 如果两个都是基础代币或两个都不是基础代币，则跳过
    if (tokenAIsBase === tokenBIsBase) {
      return [null, null];
    }
    
    let targetTokenMint: PublicKey;
    let baseTokenMint: PublicKey;
    
    if (tokenAIsBase) {
      baseTokenMint = poolInfo.tokenAMint;
      targetTokenMint = poolInfo.tokenBMint;
    } else {
      baseTokenMint = poolInfo.tokenBMint;
      targetTokenMint = poolInfo.tokenAMint;
    }
    
    // 获取基础代币信息
    const baseToken = this.getBaseTokenInfo(baseTokenMint);
    
    if (!baseToken) {
      return [null, null];
    }
    
    // 获取或加载目标代币信息
    const targetToken: TokenInfo = {
      mint: targetTokenMint,
      symbol: poolInfo.tokenASymbol || poolInfo.tokenBSymbol
    };
    
    // 丰富代币信息
    const enrichedTargetToken = await tokenValidator.enrichTokenInfo(targetToken);
    return [enrichedTargetToken, baseToken];
  }
  
  /**
   * 判断是否为基础代币
   * @param mint 代币Mint地址
   * @returns 是否为基础代币
   */
  private isBaseToken(mint: PublicKey): boolean {
    const mintString = mint.toBase58();
    return this.baseTokens.some(token => token.mint.toBase58() === mintString);
  }
  
  /**
   * 获取基础代币信息
   * @param mint 代币Mint地址
   * @returns 基础代币信息或null
   */
  private getBaseTokenInfo(mint: PublicKey): TokenInfo | null {
    const mintString = mint.toBase58();
    return this.baseTokens.find(token => token.mint.toBase58() === mintString) || null;
  }
  
  /**
   * 分析池子
   * @param poolInfo 池子信息
   * @param targetToken 目标代币
   * @param baseToken 基础代币
   * @returns 池子分析结果
   */
  private async analyzePool(poolInfo: PoolInfo, targetToken: TokenInfo, baseToken: TokenInfo): Promise<PoolAnalysisResult> {
    // 这里实际实现会更复杂，需要查询池子数据、分析流动性等
    // 以下为简化实现
    
    // 预估价格(美元)
    const estimatedPriceUsd = await this.estimateTokenPrice(poolInfo, targetToken, baseToken);
    
    // 预估流动性(美元)
    const liquidityUsd = await this.estimateLiquidity(poolInfo, targetToken, baseToken);
    
    // 检查价格是否在合理范围内
    if (estimatedPriceUsd > this.maxInitialPriceUsd) {
      return {
        isValid: false,
        confidenceScore: 0,
        reason: '价格过高: $' + estimatedPriceUsd + ' > $' + this.maxInitialPriceUsd
      };
    }
    
    // 检查流动性是否足够
    if (liquidityUsd < this.minLiquidityUsd) {
      return {
        isValid: false,
        confidenceScore: 0,
        reason: '流动性不足: $' + liquidityUsd + ' < $' + this.minLiquidityUsd
      };
    }
    
    // 计算信心分数
    const confidenceScore = this.calculateConfidenceScore(poolInfo, targetToken, estimatedPriceUsd, liquidityUsd);
    
    return {
      isValid: true,
      tokenInfo: targetToken,
      estimatedPriceUsd,
      liquidityUsd,
      confidenceScore
    };
  }
  
  /**
   * 估算代币价格(美元)
   * @param poolInfo 池子信息
   * @param targetToken 目标代币
   * @param baseToken 基础代币
   * @returns 估算价格(美元)
   */
  private async estimateTokenPrice(poolInfo: PoolInfo, targetToken: TokenInfo, baseToken: TokenInfo): Promise<number> {
    // 这里实际实现会更复杂，需要查询池子数据、计算价格等
    // 以下为简化实现，假设随机价格
    return Math.random() * 0.005 + 0.0001; // 0.0001 - 0.0051 USD范围内
  }
  
  /**
   * 估算流动性(美元)
   * @param poolInfo 池子信息
   * @param targetToken 目标代币
   * @param baseToken 基础代币
   * @returns 估算流动性(美元)
   */
  private async estimateLiquidity(poolInfo: PoolInfo, targetToken: TokenInfo, baseToken: TokenInfo): Promise<number> {
    // 这里实际实现会更复杂，需要查询池子数据、计算流动性等
    // 以下为简化实现，假设随机流动性
    return Math.random() * 10000 + 500; // 500 - 10500 USD范围内
  }
  
  /**
   * 计算信心分数
   * @param poolInfo 池子信息
   * @param targetToken 目标代币
   * @param price 价格(美元)
   * @param liquidity 流动性(美元)
   * @returns 信心分数(0-1)
   */
  private calculateConfidenceScore(
    poolInfo: PoolInfo, 
    targetToken: TokenInfo, 
    price: number | undefined, 
    liquidity: number | undefined
  ): number {
    // 这里实际实现会更复杂，综合考虑多种因素
    // 以下为简化实现
    
    // 基础分数
    let score = 0.5;
    
    // 价格影响
    if (price && price < 0.001) {
      score += 0.2; // 低价代币加分
    }
    
    // 流动性影响
    if (liquidity) {
      if (liquidity > 5000) {
        score += 0.2; // 高流动性加分
      } else if (liquidity < 2000) {
        score -= 0.1; // 低流动性减分
      }
    }
    
    // 池子年龄影响
    const ageSeconds = (Date.now() - poolInfo.firstDetectedAt) / 1000;
    if (ageSeconds < 60) {
      score += 0.1; // 新池子加分
    }
    
    // 确保分数在0-1范围内
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * 计算优先级分数
   * @param analysis 池子分析结果
   * @param poolInfo 池子信息
   * @param targetToken 目标代币
   * @returns 优先级分数
   */
  private calculatePriorityScore(
    analysis: PoolAnalysisResult, 
    poolInfo: PoolInfo, 
    targetToken: TokenInfo
  ): number {
    // 这里实际实现会更复杂，综合考虑多种因素
    // 以下为简化实现
    
    // 基础分数 = 信心分数 * 100
    let score = analysis.confidenceScore * 100;
    
    // 新池子加分
    const ageSeconds = (Date.now() - poolInfo.firstDetectedAt) / 1000;
    if (ageSeconds < 60) {
      score += 20; // 1分钟内的新池子加20分
    } else if (ageSeconds < 300) {
      score += 10; // 5分钟内的新池子加10分
    }
    
    // 如果是白名单代币，大幅加分
    if (targetToken.isTrusted) {
      score += 50;
    }
    
    return score;
  }
  
  /**
   * 估算滑点
   * @param poolInfo 池子信息
   * @param liquidityUsd 流动性(美元)
   * @returns 估算滑点百分比
   */
  private estimateSlippage(poolInfo: PoolInfo, liquidityUsd: number | undefined): number {
    // 这里实际实现会更复杂，需要考虑交易金额、流动性深度等
    // 以下为简化实现
    
    if (!liquidityUsd || liquidityUsd <= 0) {
      return 10; // 无法确定流动性时，假设10%滑点
    }
    
    // 基于流动性估算滑点
    if (liquidityUsd > 10000) {
      return 1; // 高流动性，低滑点
    } else if (liquidityUsd > 5000) {
      return 2;
    } else if (liquidityUsd > 2000) {
      return 3;
    } else if (liquidityUsd > 1000) {
      return 5;
    } else {
      return 8; // 低流动性，高滑点
    }
  }
  
  /**
   * 估算输出代币数量
   * @param poolInfo 池子信息
   * @param inputToken 输入代币
   * @param outputToken 输出代币
   * @param amountIn 输入数量
   * @returns 估算输出数量
   */
  private estimateOutputAmount(
    poolInfo: PoolInfo,
    inputToken: TokenInfo,
    outputToken: TokenInfo,
    amountIn: number
  ): bigint | undefined {
    // 这里实际实现会更复杂，需要查询池子数据、计算输出等
    // 以下为简化实现，返回空值
    return undefined;
  }
}

// 导出单例实例
const opportunityDetector = new OpportunityDetector();
export default opportunityDetector; 