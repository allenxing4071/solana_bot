/**
 * 数据分析与报告系统
 * 负责收集交易数据，生成分析报告，提供决策支持
 */

import { EventEmitter } from 'events';
import { PublicKey } from '@solana/web3.js';
import logger from '../../core/logger';
import { 
  Position, 
  TokenInfo, 
  TradeResult, 
  TradingOpportunity 
} from '../../core/types';
import appConfig from '../../core/config';
import fs from 'node:fs';
import path from 'node:path';

// 模块名称
const MODULE_NAME = 'DataAnalysisSystem';

/**
 * 交易数据记录接口
 */
export interface TradeRecord {
  id: string;                     // 交易ID
  tokenMint: string;              // 代币Mint地址
  tokenSymbol: string;            // 代币符号
  tokenName: string;              // 代币名称
  buyTimestamp: number;           // 买入时间戳
  buyPrice: number;               // 买入价格
  buyAmount: number;              // 买入数量
  buyCost: number;                // 买入花费(SOL)
  sellTimestamp?: number;         // 卖出时间戳
  sellPrice?: number;             // 卖出价格
  sellAmount?: number;            // 卖出数量
  sellProceeds?: number;          // 卖出所得(SOL)
  profit?: number;                // 盈利(SOL)
  profitPercentage?: number;      // 盈利百分比
  holdingTime?: number;           // 持仓时间(秒)
  status: 'open' | 'closed';      // 交易状态
  executionLatency: number;       // 执行延迟(ms)
  strategy: string;               // 使用的策略
  reason: string;                 // 交易原因
  notes: string[];                // 交易笔记
}

/**
 * 代币绩效接口
 */
export interface TokenPerformance {
  mint: string;                   // 代币Mint地址
  symbol: string;                 // 代币符号
  name: string;                   // 代币名称
  trades: number;                 // 交易次数
  successTrades: number;          // 成功交易次数
  avgProfit: number;              // 平均盈利
  totalProfit: number;            // 总盈利
  avgHoldingTime: number;         // 平均持仓时间
  lastTrade: number;              // 最后交易时间
}

/**
 * 市场趋势分析接口
 */
export interface MarketTrend {
  period: string;                 // 分析周期
  startTime: number;              // 开始时间
  endTime: number;                // 结束时间
  topPerformers: TokenPerformance[]; // 表现最好的代币
  totalTrades: number;            // 总交易次数
  successRate: number;            // 成功率
  avgProfit: number;              // 平均利润
  profitTrend: number[];          // 利润趋势
  tradeVolume: number[];          // 交易量趋势
  volatility: number;             // 波动性指标
  signals: {                      // 市场信号
    bullish: boolean;             // 看涨信号
    bearish: boolean;             // 看跌信号
    sideways: boolean;            // 盘整信号
    volatility: 'high' | 'normal' | 'low'; // 波动性
  };
  opportunities: string[];        // 机会建议
}

/**
 * 策略性能评估接口
 */
export interface StrategyEvaluation {
  strategyId: string;             // 策略ID
  name: string;                   // 策略名称
  trades: number;                 // 使用该策略的交易数
  successRate: number;            // 成功率
  avgProfit: number;              // 平均利润
  avgHoldingTime: number;         // 平均持仓时间
  riskReturnRatio: number;        // 风险回报比
  goodFor: string[];              // 适合的市场条件
  weaknesses: string[];           // 弱点
  improvement: string[];          // 改进建议
}

/**
 * 分析报告接口
 */
export interface AnalysisReport {
  generatedAt: number;            // 生成时间
  period: {                       // 分析周期
    start: number;                // 开始时间
    end: number;                  // 结束时间
    days: number;                 // 天数
  };
  overview: {                     // 概览
    totalTrades: number;          // 总交易次数
    successfulTrades: number;     // 成功交易次数
    failedTrades: number;         // 失败交易次数
    successRate: number;          // 成功率
    totalProfit: number;          // 总利润(SOL)
    avgDailyProfit: number;       // 平均日利润(SOL)
    bestTrade: { profit: number; token: string; }; // 最佳交易
    worstTrade: { profit: number; token: string; }; // 最差交易
  };
  performance: {                  // 表现
    daily: { date: string; profit: number; trades: number; }[]; // 每日表现
    byToken: TokenPerformance[];  // 按代币分析
    byStrategy: StrategyEvaluation[]; // 按策略分析
  };
  marketAnalysis: MarketTrend;    // 市场分析
  recommendations: {              // 建议
    tradingRecommendations: string[]; // 交易建议
    strategyRecommendations: string[]; // 策略建议
    riskManagementRecommendations: string[]; // 风险管理建议
  };
}

/**
 * 数据分析系统配置接口
 */
export interface DataAnalysisConfig {
  recordRetentionDays: number;    // 数据保留天数
  autoAnalysisInterval: number;   // 自动分析间隔(小时)
  minTradesForAnalysis: number;   // 最小分析所需交易数
  reportGenerationTime: string;   // 报告生成时间(HH:MM)
  persistData: boolean;           // 是否持久化数据
  detailedReporting: boolean;     // 是否生成详细报告
}

/**
 * 数据分析与报告系统类
 */
export class DataAnalysisSystem extends EventEmitter {
  // 配置
  private config: DataAnalysisConfig;
  
  // 交易记录
  private tradeRecords: TradeRecord[] = [];
  
  // 代币绩效记录
  private tokenPerformance: Map<string, TokenPerformance> = new Map();
  
  // 策略评估记录
  private strategyEvaluations: Map<string, StrategyEvaluation> = new Map();
  
  // 最新市场趋势分析
  private latestMarketTrend: MarketTrend | null = null;
  
  // 最新报告
  private latestReport: AnalysisReport | null = null;
  
  // 分析计时器
  private analysisTimer: NodeJS.Timeout | null = null;

  /**
   * 构造函数
   * @param config 配置参数
   */
  constructor(config?: Partial<DataAnalysisConfig>) {
    super();
    
    // 默认配置
    this.config = {
      recordRetentionDays: 90,      // 保留3个月的数据
      autoAnalysisInterval: 6,       // 每6小时分析一次
      minTradesForAnalysis: 10,      // 至少需要10笔交易才能分析
      reportGenerationTime: '00:00', // 每天0点生成报告
      persistData: true,             // 默认持久化数据
      detailedReporting: false       // 默认不生成详细报告
    };
    
    // 合并自定义配置
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    // 加载历史数据
    this.loadData();
    
    logger.info('数据分析与报告系统初始化完成', MODULE_NAME);
  }

  /**
   * 启动分析系统
   */
  public start(): void {
    // 启动自动分析计时器
    if (!this.analysisTimer) {
      this.analysisTimer = setInterval(
        () => this.runPeriodicAnalysis(),
        this.config.autoAnalysisInterval * 60 * 60 * 1000 // 转换为毫秒
      );
      
      // 立即执行一次分析
      this.runPeriodicAnalysis();
      
      logger.info('数据分析系统已启动', MODULE_NAME, {
        interval: `${this.config.autoAnalysisInterval}小时`
      });
    }
  }
  
  /**
   * 停止分析系统
   */
  public stop(): void {
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
      this.analysisTimer = null;
      
      logger.info('数据分析系统已停止', MODULE_NAME);
    }
  }
  
  /**
   * 加载历史数据
   */
  private loadData(): void {
    try {
      // 检查数据目录
      const dataDir = path.join(process.cwd(), 'data');
      const tradeRecordsFile = path.join(dataDir, 'trade_records.json');
      
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        logger.info('创建数据目录', MODULE_NAME, { path: dataDir });
      }
      
      // 加载交易记录
      if (fs.existsSync(tradeRecordsFile)) {
        const rawData = fs.readFileSync(tradeRecordsFile, 'utf8');
        this.tradeRecords = JSON.parse(rawData);
        
        // 清理过期数据
        this.cleanupOldData();
        
        // 重建性能指标
        this.rebuildPerformanceData();
        
        logger.info('已加载历史交易数据', MODULE_NAME, { 
          recordCount: this.tradeRecords.length 
        });
      } else {
        logger.info('未找到历史交易数据，将创建新的记录', MODULE_NAME);
      }
    } catch (error) {
      logger.error('加载历史数据失败', MODULE_NAME, { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }
  
  /**
   * 保存数据到文件
   */
  private saveData(): void {
    if (!this.config.persistData) {
      return;
    }
    
    try {
      const dataDir = path.join(process.cwd(), 'data');
      const tradeRecordsFile = path.join(dataDir, 'trade_records.json');
      
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      fs.writeFileSync(tradeRecordsFile, JSON.stringify(this.tradeRecords, null, 2));
      
      logger.debug('已保存交易数据', MODULE_NAME, { 
        recordCount: this.tradeRecords.length 
      });
    } catch (error) {
      logger.error('保存数据失败', MODULE_NAME, { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }
  
  /**
   * 清理过期数据
   */
  private cleanupOldData(): void {
    const now = Date.now();
    const retentionPeriod = this.config.recordRetentionDays * 24 * 60 * 60 * 1000; // 转换为毫秒
    const cutoffTime = now - retentionPeriod;
    
    // 过滤掉过期的交易记录
    const initialCount = this.tradeRecords.length;
    this.tradeRecords = this.tradeRecords.filter(record => 
      record.buyTimestamp >= cutoffTime || record.status === 'open'
    );
    
    const removedCount = initialCount - this.tradeRecords.length;
    if (removedCount > 0) {
      logger.info('已清理过期交易数据', MODULE_NAME, { removedCount });
    }
  }
  
  /**
   * 重建性能数据
   */
  private rebuildPerformanceData(): void {
    // 清空现有性能数据
    this.tokenPerformance.clear();
    this.strategyEvaluations.clear();
    
    // 根据交易记录重建代币绩效数据
    for (const record of this.tradeRecords) {
      this.updateTokenPerformance(record);
      this.updateStrategyEvaluation(record);
    }
    
    logger.debug('已重建性能数据', MODULE_NAME, {
      tokens: this.tokenPerformance.size,
      strategies: this.strategyEvaluations.size
    });
  }
  
  /**
   * 记录买入交易
   */
  public recordBuy(
    token: TokenInfo,
    amount: number,
    price: number,
    cost: number,
    strategy: string,
    latency: number,
    reason: string
  ): string {
    // 生成唯一交易ID
    const id = `trade_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    // 创建新的交易记录
    const record: TradeRecord = {
      id,
      tokenMint: token.mint.toString(),
      tokenSymbol: token.symbol || '未知',
      tokenName: token.name || '未知代币',
      buyTimestamp: Date.now(),
      buyPrice: price,
      buyAmount: amount,
      buyCost: cost,
      status: 'open',
      executionLatency: latency,
      strategy,
      reason,
      notes: []
    };
    
    // 添加到记录列表
    this.tradeRecords.push(record);
    
    // 保存数据
    this.saveData();
    
    logger.info('已记录买入交易', MODULE_NAME, {
      id,
      token: token.symbol || token.mint.toString(),
      amount,
      cost
    });
    
    return id;
  }
  
  /**
   * 记录卖出交易
   */
  public recordSell(
    tradeId: string,
    price: number,
    amount: number,
    proceeds: number
  ): boolean {
    // 查找对应的买入交易
    const recordIndex = this.tradeRecords.findIndex(r => r.id === tradeId);
    
    if (recordIndex === -1) {
      logger.warn('卖出交易记录失败：找不到对应的买入交易', MODULE_NAME, { tradeId });
      return false;
    }
    
    const record = this.tradeRecords[recordIndex];
    
    // 更新交易记录
    record.sellTimestamp = Date.now();
    record.sellPrice = price;
    record.sellAmount = amount;
    record.sellProceeds = proceeds;
    record.status = 'closed';
    
    // 计算盈利
    record.profit = proceeds - record.buyCost;
    record.profitPercentage = (record.profit / record.buyCost) * 100;
    
    // 计算持仓时间
    record.holdingTime = (record.sellTimestamp - record.buyTimestamp) / 1000; // 转换为秒
    
    // 更新交易记录
    this.tradeRecords[recordIndex] = record;
    
    // 更新性能数据
    this.updateTokenPerformance(record);
    this.updateStrategyEvaluation(record);
    
    // 保存数据
    this.saveData();
    
    logger.info('已记录卖出交易', MODULE_NAME, {
      id: tradeId,
      token: record.tokenSymbol,
      profit: record.profit,
      profitPercentage: record.profitPercentage
    });
    
    return true;
  }
  
  /**
   * 添加交易笔记
   */
  public addTradeNote(tradeId: string, note: string): boolean {
    const record = this.tradeRecords.find(r => r.id === tradeId);
    
    if (!record) {
      logger.warn('添加交易笔记失败：找不到交易记录', MODULE_NAME, { tradeId });
      return false;
    }
    
    record.notes.push(`[${new Date().toISOString()}] ${note}`);
    
    // 保存数据
    this.saveData();
    
    return true;
  }
  
  /**
   * 更新代币绩效数据
   */
  private updateTokenPerformance(record: TradeRecord): void {
    if (!record.sellTimestamp) {
      // 仅处理已完成的交易
      return;
    }
    
    let performance = this.tokenPerformance.get(record.tokenMint);
    
    if (!performance) {
      // 创建新的代币绩效记录
      performance = {
        mint: record.tokenMint,
        symbol: record.tokenSymbol,
        name: record.tokenName,
        trades: 0,
        successTrades: 0,
        avgProfit: 0,
        totalProfit: 0,
        avgHoldingTime: 0,
        lastTrade: 0
      };
    }
    
    // 更新统计数据
    performance.trades++;
    performance.lastTrade = record.sellTimestamp;
    
    if (record.profit! > 0) {
      performance.successTrades++;
    }
    
    // 更新总利润
    performance.totalProfit += record.profit!;
    
    // 更新平均利润
    performance.avgProfit = performance.totalProfit / performance.trades;
    
    // 更新平均持仓时间
    const totalHoldingTime = (performance.avgHoldingTime * (performance.trades - 1)) + record.holdingTime!;
    performance.avgHoldingTime = totalHoldingTime / performance.trades;
    
    // 保存更新后的绩效数据
    this.tokenPerformance.set(record.tokenMint, performance);
  }
  
  /**
   * 更新策略评估数据
   */
  private updateStrategyEvaluation(record: TradeRecord): void {
    if (!record.sellTimestamp) {
      // 仅处理已完成的交易
      return;
    }
    
    let evaluation = this.strategyEvaluations.get(record.strategy);
    
    if (!evaluation) {
      // 创建新的策略评估记录
      evaluation = {
        strategyId: record.strategy,
        name: record.strategy, // 可以从策略模块获取更友好的名称
        trades: 0,
        successRate: 0,
        avgProfit: 0,
        avgHoldingTime: 0,
        riskReturnRatio: 0,
        goodFor: [],
        weaknesses: [],
        improvement: []
      };
    }
    
    // 更新统计数据
    evaluation.trades++;
    
    // 更新成功率
    const successTrades = record.profit! > 0 ? 1 : 0;
    const totalSuccessTrades = (evaluation.successRate * (evaluation.trades - 1) / 100) + successTrades;
    evaluation.successRate = (totalSuccessTrades / evaluation.trades) * 100;
    
    // 更新平均利润
    const totalProfit = (evaluation.avgProfit * (evaluation.trades - 1)) + record.profit!;
    evaluation.avgProfit = totalProfit / evaluation.trades;
    
    // 更新平均持仓时间
    const totalHoldingTime = (evaluation.avgHoldingTime * (evaluation.trades - 1)) + record.holdingTime!;
    evaluation.avgHoldingTime = totalHoldingTime / evaluation.trades;
    
    // 更新风险回报比
    evaluation.riskReturnRatio = evaluation.avgProfit / (1 - evaluation.successRate / 100);
    if (!isFinite(evaluation.riskReturnRatio)) {
      evaluation.riskReturnRatio = 0;
    }
    
    // 保存更新后的评估数据
    this.strategyEvaluations.set(record.strategy, evaluation);
    
    // TODO: 分析策略优势和劣势，生成改进建议
  }
  
  /**
   * 执行周期性分析
   */
  private runPeriodicAnalysis(): void {
    try {
      // 确保有足够的数据进行分析
      if (this.tradeRecords.length < this.config.minTradesForAnalysis) {
        logger.info('交易数据不足，跳过分析', MODULE_NAME, {
          currentTrades: this.tradeRecords.length,
          required: this.config.minTradesForAnalysis
        });
        return;
      }
      
      // 分析市场趋势
      this.analyzeMarketTrend();
      
      // 生成分析报告
      this.generateReport();
      
      logger.info('已完成周期性分析', MODULE_NAME, {
        tradeCount: this.tradeRecords.length,
        tokenCount: this.tokenPerformance.size
      });
      
      // 触发分析完成事件
      this.emit('analysisComplete', {
        timestamp: Date.now(),
        report: this.latestReport
      });
    } catch (error) {
      logger.error('周期性分析失败', MODULE_NAME, {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * 分析市场趋势
   * 分析最近交易数据，识别市场模式和趋势
   */
  private analyzeMarketTrend(): void {
    // 确保有足够的已完成交易
    const completedTrades = this.tradeRecords.filter(r => r.status === 'closed');
    
    if (completedTrades.length < this.config.minTradesForAnalysis) {
      logger.debug('已完成交易数据不足，跳过市场趋势分析', MODULE_NAME);
      return;
    }
    
    // 按时间顺序排序
    completedTrades.sort((a, b) => (a.sellTimestamp || 0) - (b.sellTimestamp || 0));
    
    // 确定分析周期
    const startTime = completedTrades[0].buyTimestamp;
    const endTime = Date.now();
    const periodDays = Math.ceil((endTime - startTime) / (24 * 60 * 60 * 1000));
    
    // 计算总体指标
    const totalTrades = completedTrades.length;
    const successTrades = completedTrades.filter(r => (r.profit || 0) > 0).length;
    const successRate = (successTrades / totalTrades) * 100;
    const totalProfit = completedTrades.reduce((sum, r) => sum + (r.profit || 0), 0);
    const avgProfit = totalProfit / totalTrades;
    
    // 收集利润和交易量趋势
    const profitTrend: number[] = [];
    const tradeVolume: number[] = [];
    
    // 如果有足够的数据，按天收集趋势数据
    if (periodDays >= 7) {
      // 按天分组计算平均利润和交易量
      const dayGroups = new Map<string, { profits: number[], count: number }>();
      
      for (const trade of completedTrades) {
        const date = new Date(trade.sellTimestamp || 0).toISOString().split('T')[0];
        
        if (!dayGroups.has(date)) {
          dayGroups.set(date, { profits: [], count: 0 });
        }
        
        const group = dayGroups.get(date);
        if (group) {
          group.profits.push(trade.profit || 0);
          group.count++;
        }
      }
      
      // 排序日期并计算每日平均利润和交易量
      const sortedDates = Array.from(dayGroups.keys()).sort();
      
      for (const date of sortedDates) {
        const group = dayGroups.get(date);
        if (group) {
          const dayAvgProfit = group.profits.reduce((sum, p) => sum + p, 0) / group.profits.length;
          profitTrend.push(dayAvgProfit);
          tradeVolume.push(group.count);
        }
      }
    } else {
      // 数据不足时，直接使用各交易的利润作为趋势
      profitTrend.push(...completedTrades.map(t => t.profit || 0));
      // 简化交易量为每交易一次
      tradeVolume.push(...Array(completedTrades.length).fill(1));
    }
    
    // 计算波动性指标 - 使用利润的标准差
    const profitMean = profitTrend.reduce((sum, p) => sum + p, 0) / profitTrend.length;
    const profitVariance = profitTrend.reduce((sum, p) => sum + Math.pow(p - profitMean, 2), 0) / profitTrend.length;
    const volatility = Math.sqrt(profitVariance);
    
    // 分析市场信号
    const recentTrend = profitTrend.slice(-5); // 最近5个数据点
    const trendSlope = this.calculateTrendSlope(recentTrend);
    
    const signals = {
      bullish: trendSlope > 0.1,           // 正向趋势
      bearish: trendSlope < -0.1,          // 负向趋势
      sideways: Math.abs(trendSlope) <= 0.1, // 盘整
      volatility: volatility > 1 ? 'high' : volatility < 0.3 ? 'low' : 'normal'
    };
    
    // 获取表现最好的代币
    const topTokens = Array.from(this.tokenPerformance.values())
      .filter(t => t.trades >= 3) // 至少有3次交易
      .sort((a, b) => b.avgProfit - a.avgProfit)
      .slice(0, 5); // 取前5名
    
    // 生成机会建议
    const opportunities: string[] = [];
    
    if (signals.bullish) {
      opportunities.push('市场呈上升趋势，考虑增加交易规模。');
      opportunities.push('上升市场环境，适合使用更激进的策略。');
    } else if (signals.bearish) {
      opportunities.push('市场呈下降趋势，建议降低风险敞口。');
      opportunities.push('熊市环境下更应关注风险管理和止损设置。');
    } else if (signals.sideways) {
      opportunities.push('市场处于盘整阶段，宜采用范围交易策略。');
      opportunities.push('波动较小，建议关注短期价格突破机会。');
    }
    
    if (signals.volatility === 'high') {
      opportunities.push('市场波动较大，应提高止损水平来管理风险。');
    } else if (signals.volatility === 'low') {
      opportunities.push('市场波动较小，可适当降低止损以避免频繁触发。');
    }
    
    // 构建市场趋势分析结果
    this.latestMarketTrend = {
      period: `过去${periodDays}天`,
      startTime,
      endTime,
      topPerformers: topTokens,
      totalTrades,
      successRate,
      avgProfit,
      profitTrend,
      tradeVolume,
      volatility,
      signals,
      opportunities
    };
    
    logger.info('市场趋势分析完成', MODULE_NAME, {
      period: `${periodDays}天`,
      successRate: successRate.toFixed(2) + '%',
      signal: signals.bullish ? '看涨' : signals.bearish ? '看跌' : '盘整'
    });
  }
  
  /**
   * 计算趋势斜率
   * 使用简单线性回归计算斜率
   * @param data 数据点数组
   * @returns 趋势斜率
   */
  private calculateTrendSlope(data: number[]): number {
    if (data.length < 2) return 0;
    
    // 线性回归计算
    const n = data.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    const sumX = indices.reduce((sum, x) => sum + x, 0);
    const sumY = data.reduce((sum, y) => sum + y, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * data[i], 0);
    const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);
    
    // 计算斜率: (n*sumXY - sumX*sumY) / (n*sumX2 - sumX*sumX)
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    // 处理分母为零的情况
    return isNaN(slope) ? 0 : slope;
  }
  
  /**
   * 生成分析报告
   */
  private generateReport(): void {
    // 确保有市场趋势分析结果
    if (!this.latestMarketTrend) {
      logger.warn('缺少市场趋势分析结果，无法生成报告', MODULE_NAME);
      return;
    }
    
    // 统计数据
    const completedTrades = this.tradeRecords.filter(r => r.status === 'closed');
    const totalTrades = completedTrades.length;
    const successfulTrades = completedTrades.filter(r => (r.profit || 0) > 0).length;
    const failedTrades = totalTrades - successfulTrades;
    const successRate = totalTrades > 0 ? (successfulTrades / totalTrades) * 100 : 0;
    
    // 计算总利润
    const totalProfit = completedTrades.reduce((sum, r) => sum + (r.profit || 0), 0);
    
    // 计算每日平均利润
    const daysSpan = (this.latestMarketTrend.endTime - this.latestMarketTrend.startTime) / (24 * 60 * 60 * 1000);
    const avgDailyProfit = totalProfit / Math.max(1, daysSpan);
    
    // 查找最佳和最差交易
    let bestTrade = { profit: 0, token: '' };
    let worstTrade = { profit: 0, token: '' };
    
    if (totalTrades > 0) {
      const maxProfitTrade = completedTrades.reduce((max, trade) => 
        ((trade.profit || 0) > (max.profit || 0)) ? trade : max, completedTrades[0]);
      
      const minProfitTrade = completedTrades.reduce((min, trade) => 
        ((trade.profit || 0) < (min.profit || 0)) ? trade : min, completedTrades[0]);
      
      bestTrade = { 
        profit: maxProfitTrade.profit || 0, 
        token: maxProfitTrade.tokenSymbol 
      };
      
      worstTrade = { 
        profit: minProfitTrade.profit || 0, 
        token: minProfitTrade.tokenSymbol 
      };
    }
    
    // 收集每日表现数据
    const dailyPerformance: { date: string; profit: number; trades: number; }[] = [];
    
    // 按日期分组统计
    const dailyGroups = new Map<string, { profit: number; trades: number; }>();
    
    for (const trade of completedTrades) {
      const date = new Date(trade.sellTimestamp || 0).toISOString().split('T')[0];
      
      if (!dailyGroups.has(date)) {
        dailyGroups.set(date, { profit: 0, trades: 0 });
      }
      
      const group = dailyGroups.get(date);
      if (group) {
        group.profit += (trade.profit || 0);
        group.trades++;
      }
    }
    
    // 转换为数组并按日期排序
    for (const [date, data] of dailyGroups.entries()) {
      dailyPerformance.push({
        date,
        profit: data.profit,
        trades: data.trades
      });
    }
    
    dailyPerformance.sort((a, b) => a.date.localeCompare(b.date));
    
    // 获取代币绩效数据
    const tokenPerformanceArray = Array.from(this.tokenPerformance.values())
      .filter(t => t.trades >= 2) // 至少有2次交易
      .sort((a, b) => b.totalProfit - a.totalProfit);
    
    // 获取策略评估数据
    const strategyEvaluationArray = Array.from(this.strategyEvaluations.values())
      .sort((a, b) => b.successRate - a.successRate);
    
    // 生成交易建议
    const tradingRecommendations: string[] = [];
    
    // 根据市场趋势添加建议
    tradingRecommendations.push(...this.latestMarketTrend.opportunities);
    
    // 添加基于表现的代币建议
    if (tokenPerformanceArray.length > 0) {
      const topToken = tokenPerformanceArray[0];
      tradingRecommendations.push(
        `${topToken.symbol}表现最好，总利润${topToken.totalProfit.toFixed(4)} SOL，考虑增加关注。`
      );
    }
    
    if (tokenPerformanceArray.length > 1) {
      const worstToken = tokenPerformanceArray[tokenPerformanceArray.length - 1];
      if (worstToken.totalProfit < 0) {
        tradingRecommendations.push(
          `${worstToken.symbol}表现较差，总亏损${Math.abs(worstToken.totalProfit).toFixed(4)} SOL，考虑减少交易。`
        );
      }
    }
    
    // 生成策略建议
    const strategyRecommendations: string[] = [];
    
    if (strategyEvaluationArray.length > 0) {
      const bestStrategy = strategyEvaluationArray[0];
      strategyRecommendations.push(
        `${bestStrategy.name}策略表现最佳，成功率${bestStrategy.successRate.toFixed(2)}%，平均利润${bestStrategy.avgProfit.toFixed(4)} SOL。`
      );
      
      // 添加策略特定建议
      if (bestStrategy.goodFor.length > 0) {
        strategyRecommendations.push(`${bestStrategy.name}策略特别适合: ${bestStrategy.goodFor.join(', ')}。`);
      }
      
      if (bestStrategy.improvement.length > 0) {
        strategyRecommendations.push(`${bestStrategy.name}策略可改进: ${bestStrategy.improvement.join(', ')}。`);
      }
    }
    
    // 如果有多个策略，比较它们的表现
    if (strategyEvaluationArray.length > 1) {
      const bestStrategy = strategyEvaluationArray[0];
      const secondStrategy = strategyEvaluationArray[1];
      
      if (bestStrategy.avgProfit > secondStrategy.avgProfit * 1.5) {
        strategyRecommendations.push(
          `${bestStrategy.name}策略的平均利润明显高于${secondStrategy.name}策略，建议增加使用频率。`
        );
      }
    }
    
    // 生成风险管理建议
    const riskManagementRecommendations: string[] = [];
    
    // 基于成功率的建议
    if (successRate < 40) {
      riskManagementRecommendations.push('当前成功率较低，建议调整止损水平并减小单笔交易金额。');
    } else if (successRate > 70) {
      riskManagementRecommendations.push('当前成功率较高，可以考虑增加单笔交易金额来提高总收益。');
    }
    
    // 基于波动性的建议
    if (this.latestMarketTrend.volatility > 1) {
      riskManagementRecommendations.push('市场波动性较高，建议收紧止损幅度并减小单笔交易规模。');
    }
    
    // 构建完整的分析报告
    this.latestReport = {
      generatedAt: Date.now(),
      period: {
        start: this.latestMarketTrend.startTime,
        end: this.latestMarketTrend.endTime,
        days: Math.max(1, Math.round(daysSpan))
      },
      overview: {
        totalTrades,
        successfulTrades,
        failedTrades,
        successRate,
        totalProfit,
        avgDailyProfit,
        bestTrade,
        worstTrade
      },
      performance: {
        daily: dailyPerformance,
        byToken: tokenPerformanceArray,
        byStrategy: strategyEvaluationArray
      },
      marketAnalysis: this.latestMarketTrend,
      recommendations: {
        tradingRecommendations,
        strategyRecommendations,
        riskManagementRecommendations
      }
    };
    
    logger.info('分析报告生成完成', MODULE_NAME, {
      reportDate: new Date().toISOString().split('T')[0],
      tradeCount: totalTrades
    });
    
    // 保存报告
    this.saveReport();
  }
  
  /**
   * 保存报告到文件
   */
  private saveReport(): void {
    if (!this.config.persistData || !this.latestReport) {
      return;
    }
    
    try {
      const dataDir = path.join(process.cwd(), 'data', 'reports');
      
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // 使用日期作为文件名
      const date = new Date().toISOString().split('T')[0];
      const reportFile = path.join(dataDir, `report_${date}.json`);
      
      fs.writeFileSync(reportFile, JSON.stringify(this.latestReport, null, 2));
      
      logger.debug('已保存分析报告', MODULE_NAME, { file: reportFile });
    } catch (error) {
      logger.error('保存分析报告失败', MODULE_NAME, { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }
  
  /**
   * 获取最新分析报告
   */
  public getLatestReport(): AnalysisReport | null {
    return this.latestReport;
  }
  
  /**
   * 获取代币绩效数据
   */
  public getTokenPerformance(mintAddress?: string): TokenPerformance[] | TokenPerformance | null {
    if (mintAddress) {
      return this.tokenPerformance.get(mintAddress) || null;
    }
    
    return Array.from(this.tokenPerformance.values());
  }
  
  /**
   * 获取策略评估数据
   */
  public getStrategyEvaluation(strategyId?: string): StrategyEvaluation[] | StrategyEvaluation | null {
    if (strategyId) {
      return this.strategyEvaluations.get(strategyId) || null;
    }
    
    return Array.from(this.strategyEvaluations.values());
  }
  
  /**
   * 获取市场趋势分析
   */
  public getMarketTrend(): MarketTrend | null {
    return this.latestMarketTrend;
  }
  
  /**
   * 获取交易记录
   */
  public getTradeRecords(
    status?: 'open' | 'closed',
    startTime?: number,
    endTime?: number
  ): TradeRecord[] {
    let records = [...this.tradeRecords];
    
    // 根据状态过滤
    if (status) {
      records = records.filter(r => r.status === status);
    }
    
    // 根据时间范围过滤
    if (startTime) {
      records = records.filter(r => r.buyTimestamp >= startTime);
    }
    
    if (endTime) {
      records = records.filter(r => r.buyTimestamp <= endTime);
    }
    
    // 按时间倒序排列
    return records.sort((a, b) => b.buyTimestamp - a.buyTimestamp);
  }
  
  /**
   * 获取交易统计数据
   */
  public getTradeStatistics(): {
    total: number;
    open: number;
    closed: number;
    successful: number;
    failed: number;
    totalProfit: number;
    successRate: number;
    avgProfit: number;
  } {
    const total = this.tradeRecords.length;
    const open = this.tradeRecords.filter(r => r.status === 'open').length;
    const closed = total - open;
    
    const completedTrades = this.tradeRecords.filter(r => r.status === 'closed');
    const successful = completedTrades.filter(r => (r.profit || 0) > 0).length;
    const failed = closed - successful;
    
    const totalProfit = completedTrades.reduce((sum, r) => sum + (r.profit || 0), 0);
    const successRate = closed > 0 ? (successful / closed) * 100 : 0;
    const avgProfit = closed > 0 ? totalProfit / closed : 0;
    
    return {
      total,
      open,
      closed,
      successful,
      failed,
      totalProfit,
      successRate,
      avgProfit
    };
  }
}

// 创建单例导出
const dataAnalysisSystem = new DataAnalysisSystem();
export default dataAnalysisSystem; 