/**
 * 交易模块
 * 整合机会检测、交易执行和策略管理，作为交易系统的主入口
 */

import { EventEmitter } from 'events';
import { PublicKey } from '@solana/web3.js';
import logger from '../../core/logger';
import { 
  PoolInfo, 
  TradingOpportunity, 
  TradeResult, 
  SystemEvent, 
  EventType,
  Position
} from '../../core/types';
import opportunityDetector from '../analyzer/opportunity_detector';
import tokenValidator from '../analyzer/token_validator';
import traderExecutor from './trader_executor';
import strategyManager from './strategy_manager';
import appConfig from '../../core/config';

const MODULE_NAME = 'TraderModule';

/**
 * 交易模块类
 * 处理交易相关的核心业务逻辑
 */
export class TraderModule extends EventEmitter {
  // 是否启用交易功能
  private isEnabled: boolean = false;
  // 是否已初始化
  private isInitialized: boolean = false;
  // 当前正在处理的机会（防止重复处理）
  private activeOpportunities: Map<string, TradingOpportunity> = new Map();
  // 当前进行中的交易（防止重复交易）
  private pendingTrades: Set<string> = new Set();
  // 价格检查计时器
  private priceCheckTimer: NodeJS.Timeout | null = null;
  // 价格检查间隔(毫秒)
  private priceCheckInterval: number;
  
  /**
   * 构造函数
   */
  constructor() {
    super();
    this.priceCheckInterval = appConfig.system.priceCheckInterval || 5000;
  }
  
  /**
   * 初始化交易模块
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    try {
      logger.info('初始化交易模块...', MODULE_NAME);
      
      // 如果在配置中禁用了交易功能
      if (process.env.LISTEN_ONLY === 'true') {
        logger.info('交易功能已禁用，将仅监听新池子', MODULE_NAME);
        this.isEnabled = false;
      } else {
        this.isEnabled = true;
      }
      
      // 初始化完成
      this.isInitialized = true;
      logger.info('交易模块初始化完成', MODULE_NAME);
    } catch (error) {
      logger.error('初始化交易模块时出错', MODULE_NAME, {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * 启动交易模块
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    logger.info('启动交易模块...', MODULE_NAME);
    
    if (!this.isEnabled) {
      logger.info('交易功能已禁用，将仅监听新池子', MODULE_NAME);
      return;
    }
    
    // 启动价格检查定时器
    this.startPriceChecking();
    
    logger.info('交易模块已启动', MODULE_NAME);
  }
  
  /**
   * 停止交易模块
   */
  async stop(): Promise<void> {
    logger.info('停止交易模块...', MODULE_NAME);
    
    // 停止价格检查定时器
    this.stopPriceChecking();
    
    // 清理状态
    this.activeOpportunities.clear();
    this.pendingTrades.clear();
    
    logger.info('交易模块已停止', MODULE_NAME);
  }
  
  /**
   * 处理新的池子事件
   * @param poolInfo 池子信息
   */
  async handleNewPool(poolInfo: PoolInfo): Promise<void> {
    if (!this.isEnabled || !this.isInitialized) {
      return;
    }
    
    try {
      logger.debug(`交易模块收到新池子事件: ${poolInfo.address.toBase58()}`, MODULE_NAME);
      
      // 生成池子ID
      const poolId = `${poolInfo.dex}:${poolInfo.address.toBase58()}`;
      
      // 检查是否已在处理中
      if (this.activeOpportunities.has(poolId) || this.pendingTrades.has(poolId)) {
        logger.debug(`跳过处理: 池子已在处理中`, MODULE_NAME, { poolId });
        return;
      }
      
      // 使用机会检测器分析池子
      const opportunity = await opportunityDetector.detectOpportunity(poolInfo);
      
      if (!opportunity) {
        logger.debug(`池子不符合交易条件`, MODULE_NAME, { poolId });
        return;
      }
      
      // 检查是否应该交易
      const shouldTrade = strategyManager.shouldBuy(opportunity);
      
      if (!shouldTrade) {
        logger.debug(`策略决定不交易`, MODULE_NAME, { 
          poolId,
          token: opportunity.targetToken.symbol || opportunity.targetToken.mint.toBase58() 
        });
        return;
      }
      
      // 标记为正在处理
      this.activeOpportunities.set(poolId, opportunity);
      this.pendingTrades.add(poolId);
      
      // 执行交易
      const tradeResult = await this.executeTrade(opportunity);
      
      // 从处理中列表移除
      this.pendingTrades.delete(poolId);
      
      // 如果交易成功，记录持仓
      if (tradeResult && tradeResult.success) {
        // 处理买入结果
        const position = strategyManager.handleBuyResult(tradeResult, opportunity);
        
        if (position) {
          // 发出持仓更新事件
          this.emitPositionUpdated(position);
        }
      }
      
      // 清理当前机会
      setTimeout(() => {
        this.activeOpportunities.delete(poolId);
      }, 60000); // 1分钟后清理
      
    } catch (error) {
      logger.error(`处理新池子事件时出错: ${poolInfo.address.toBase58()}`, MODULE_NAME, {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * 执行交易
   * @param opportunity 交易机会
   * @returns 交易结果
   */
  private async executeTrade(opportunity: TradingOpportunity): Promise<TradeResult> {
    const targetToken = opportunity.targetToken;
    const baseToken = opportunity.baseToken;
    
    logger.info(`准备执行交易: ${targetToken.symbol || targetToken.mint.toBase58()}`, MODULE_NAME, {
      dex: opportunity.pool.dex,
      price: opportunity.estimatedPriceUsd,
      score: opportunity.priorityScore.toFixed(2)
    });
    
    try {
      // 根据交易类型执行
      if (opportunity.action === 'buy') {
        // 执行买入交易
        const tradeResult = await traderExecutor.executeBuy({ opportunity });
        
        // 发出交易执行事件
        this.emitTradeExecuted(tradeResult, opportunity);
        
        return tradeResult;
      } else if (opportunity.action === 'sell') {
        // 执行卖出交易
        const tradeResult = await traderExecutor.executeSell({ opportunity });
        
        // 发出交易执行事件
        this.emitTradeExecuted(tradeResult, opportunity);
        
        return tradeResult;
      } else {
        throw new Error(`不支持的交易类型: ${opportunity.action}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error(`执行交易失败`, MODULE_NAME, {
        error: errorMessage,
        token: targetToken.symbol || targetToken.mint.toBase58(),
        dex: opportunity.pool.dex
      });
      
      // 创建失败的交易结果
      const failedResult: TradeResult = {
        success: false,
        error: errorMessage,
        timestamp: Date.now()
      };
      
      // 发出交易执行事件
      this.emitTradeExecuted(failedResult, opportunity);
      
      return failedResult;
    }
  }
  
  /**
   * 启动价格检查定时器
   */
  private startPriceChecking(): void {
    // 清除之前的定时器
    this.stopPriceChecking();
    
    // 创建新的定时器
    this.priceCheckTimer = setInterval(() => {
      this.checkPositionPrices();
    }, this.priceCheckInterval);
    
    logger.info(`价格检查定时器已启动，间隔 ${this.priceCheckInterval}ms`, MODULE_NAME);
  }
  
  /**
   * 停止价格检查定时器
   */
  private stopPriceChecking(): void {
    if (this.priceCheckTimer) {
      clearInterval(this.priceCheckTimer);
      this.priceCheckTimer = null;
      logger.info('价格检查定时器已停止', MODULE_NAME);
    }
  }
  
  /**
   * 检查所有持仓的价格
   */
  private async checkPositionPrices(): Promise<void> {
    try {
      // 获取所有持仓
      const positions = strategyManager.getAllPositions();
      
      if (positions.length === 0) {
        return;
      }
      
      logger.debug(`检查 ${positions.length} 个持仓的价格`, MODULE_NAME);
      
      // 遍历所有持仓，检查价格并执行策略
      for (const position of positions) {
        await this.checkPositionPrice(position);
      }
    } catch (error) {
      logger.error('检查持仓价格时出错', MODULE_NAME, {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * 检查单个持仓的价格
   * @param position 持仓
   */
  private async checkPositionPrice(position: Position): Promise<void> {
    try {
      const token = position.token;
      const mintString = token.mint.toBase58();
      
      // 模拟获取最新价格 - 实际实现需要查询价格API或DEX
      // 这里仅作为示例，使用随机波动模拟价格变化
      const currentPrice = this.simulatePrice(position);
      
      // 检查是否应该卖出
      const decision = strategyManager.shouldSell(mintString, currentPrice);
      
      // 如果决定卖出
      if (decision.shouldSell) {
        logger.info(`触发卖出决策: ${token.symbol || mintString}`, MODULE_NAME, {
          reason: decision.reason,
          currentPrice,
          buyPrice: position.avgBuyPrice,
          profitPercentage: decision.profitPercentage?.toFixed(2)
        });
        
        // 创建卖出机会
        const opportunity: TradingOpportunity = {
          pool: this.findPoolForToken(token.mint),
          targetToken: token,
          baseToken: this.getBaseTokenForSymbol('SOL'), // 假设使用SOL作为基础代币
          estimatedPriceUsd: currentPrice,
          confidence: 1, // 高置信度，因为是卖出已有代币
          action: 'sell',
          priorityScore: 1, // 高优先级
          timestamp: Date.now(),
          sellAmount: position.amount
        };
        
        // 执行卖出
        const tradeResult = await this.executeTrade(opportunity);
        
        // 处理卖出结果
        if (tradeResult.success && decision.position) {
          strategyManager.handleSellResult(tradeResult, decision.position);
        }
      } else {
        // 仅更新价格
        if (position.currentPrice !== currentPrice) {
          // 发出价格更新事件
          this.emitPriceUpdated(token.mint, currentPrice);
        }
      }
    } catch (error) {
      logger.error(`检查持仓价格时出错: ${position.token.mint.toBase58()}`, MODULE_NAME, {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * 模拟获取代币价格
   * @param position 持仓
   * @returns 模拟的当前价格
   */
  private simulatePrice(position: Position): number {
    // 这是一个示例实现，实际应该查询实时价格
    // 生成-10%到+20%的随机波动
    const volatility = -0.1 + Math.random() * 0.3;
    const basePrice = position.avgBuyPrice || 0.001;
    
    return basePrice * (1 + volatility);
  }
  
  /**
   * 查找代币对应的池子
   * @param tokenMint 代币Mint地址
   * @returns 池子信息
   */
  private findPoolForToken(tokenMint: PublicKey): PoolInfo {
    // 示例实现，实际应该查询已知池子
    // 这里创建一个假的池子信息
    return {
      address: new PublicKey('11111111111111111111111111111111'),
      dex: appConfig.dexes[0].name,
      tokenAMint: tokenMint,
      tokenBMint: new PublicKey('So11111111111111111111111111111111111111112'), // SOL
      createdAt: Date.now() - 3600000,
      firstDetectedAt: Date.now() - 3600000
    };
  }
  
  /**
   * 获取指定符号的基础代币
   * @param symbol 代币符号
   * @returns 代币信息
   */
  private getBaseTokenForSymbol(symbol: string): any {
    // 示例实现，实际应该查询已知代币
    if (symbol === 'SOL') {
      return {
        mint: new PublicKey('So11111111111111111111111111111111111111112'),
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9
      };
    } else if (symbol === 'USDC') {
      return {
        mint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6
      };
    }
    
    // 默认返回SOL
    return {
      mint: new PublicKey('So11111111111111111111111111111111111111112'),
      symbol: 'SOL',
      name: 'Solana',
      decimals: 9
    };
  }
  
  // ---- 事件发射方法 ----
  
  /**
   * 发出交易执行事件
   * @param tradeResult 交易结果
   * @param opportunity 交易机会
   */
  private emitTradeExecuted(tradeResult: TradeResult, opportunity: TradingOpportunity): void {
    const event: SystemEvent = {
      type: EventType.TRADE_EXECUTED,
      data: tradeResult,
      timestamp: Date.now()
    };
    
    // 发出事件
    this.emit('tradeExecuted', tradeResult, opportunity);
    this.emit('event', event);
  }
  
  /**
   * 发出价格更新事件
   * @param tokenMint 代币Mint地址
   * @param price 价格
   */
  private emitPriceUpdated(tokenMint: PublicKey, price: number): void {
    const event: SystemEvent = {
      type: EventType.PRICE_UPDATED,
      data: {
        mint: tokenMint,
        price,
        timestamp: Date.now()
      },
      timestamp: Date.now()
    };
    
    // 发出事件
    this.emit('priceUpdated', tokenMint, price);
    this.emit('event', event);
  }
  
  /**
   * 发出持仓更新事件
   * @param position 持仓
   */
  private emitPositionUpdated(position: Position): void {
    const event: SystemEvent = {
      type: EventType.POSITION_UPDATED,
      data: position,
      timestamp: Date.now()
    };
    
    // 发出事件
    this.emit('positionUpdated', position);
    this.emit('event', event);
  }
}

// 导出单例实例
const traderModule = new TraderModule();
export default traderModule; 