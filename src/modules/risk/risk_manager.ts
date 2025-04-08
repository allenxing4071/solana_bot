/**
 * 风险控制与资金管理系统
 * 负责管理交易风险，控制资金分配，确保系统安全运行
 */

import { PublicKey } from '@solana/web3.js';
import logger from '../../core/logger';
import { 
  Position, 
  TokenInfo, 
  TradeResult, 
  TradingOpportunity 
} from '../../core/types';
import appConfig from '../../core/config';

// 模块名称
const MODULE_NAME = 'RiskManager';

/**
 * 风险级别枚举
 */
export enum RiskLevel {
  VERY_LOW = 1,
  LOW = 2,
  MEDIUM = 3,
  HIGH = 4,
  VERY_HIGH = 5
}

/**
 * 交易限额配置接口
 */
export interface TradingLimits {
  maxDailyTrades: number;           // 每日最大交易次数
  maxDailyInvestment: number;       // 每日最大投资金额(USD)
  maxSingleTradeAmount: number;     // 单笔最大交易金额(USD)
  minSingleTradeAmount: number;     // 单笔最小交易金额(USD)
  maxOpenPositions: number;         // 最大同时持仓数量
  maxTotalExposure: number;         // 最大总风险敞口(USD)
  maxExposurePerToken: number;      // 单个代币最大风险敞口(USD)
  emergencyStopLoss: number;        // 紧急止损阈值(%)
}

/**
 * 风险评分标准接口
 */
export interface RiskScoringCriteria {
  liquidityWeight: number;          // 流动性权重
  volatilityWeight: number;         // 波动性权重
  ageWeight: number;                // 代币年龄权重
  marketCapWeight: number;          // 市值权重
  holderCountWeight: number;        // 持有人数量权重
  devActivityWeight: number;        // 开发活动权重
  socialMediaWeight: number;        // 社交媒体权重
}

/**
 * 风险报告接口
 */
export interface RiskReport {
  overallRisk: RiskLevel;           // 总体风险级别
  tokenRisk: RiskLevel;             // 代币风险级别
  marketRisk: RiskLevel;            // 市场风险级别
  liquidityRisk: RiskLevel;         // 流动性风险级别
  exposureRisk: RiskLevel;          // 敞口风险级别
  details: {                        // 详细信息
    [key: string]: number | string;
  };
  timestamp: number;                // 时间戳
  recommendation: string;           // 建议
}

/**
 * 资金分配结果接口
 */
export interface AllocationResult {
  approved: boolean;                // 是否批准
  allocatedAmount: number;          // 分配金额(USD)
  maxAmount: number;                // 最大允许金额(USD)
  remainingDailyBudget: number;     // 剩余日预算(USD)
  remainingTotalBudget: number;     // 剩余总预算(USD)
  reason: string;                   // 原因
}

/**
 * 每日交易统计接口
 */
export interface DailyStats {
  date: string;                     // 日期(YYYY-MM-DD)
  tradeCount: number;               // 交易次数
  totalInvested: number;            // 总投资金额(USD)
  successfulTrades: number;         // 成功交易次数
  failedTrades: number;             // 失败交易次数
  profit: number;                   // 利润(USD)
}

/**
 * 风险控制与资金管理系统类
 * 负责控制交易风险和资金分配
 */
export class RiskManager {
  // 交易限额配置
  private tradingLimits: TradingLimits;
  
  // 风险评分标准
  private scoringCriteria: RiskScoringCriteria;
  
  // 每日统计数据
  private dailyStats: Map<string, DailyStats> = new Map();
  
  // 风险报告缓存
  private riskReportCache: Map<string, RiskReport> = new Map();
  
  // 紧急停止标志
  private emergencyStop: boolean = false;
  
  // 黑名单代币
  private blacklistedTokens: Set<string> = new Set();

  /**
   * 构造函数
   */
  constructor() {
    // 初始化默认交易限额
    this.tradingLimits = {
      maxDailyTrades: 20,
      maxDailyInvestment: 1000,
      maxSingleTradeAmount: 100,
      minSingleTradeAmount: 10,
      maxOpenPositions: 5,
      maxTotalExposure: 2000,
      maxExposurePerToken: 300,
      emergencyStopLoss: 15
    };
    
    // 初始化风险评分标准
    this.scoringCriteria = {
      liquidityWeight: 0.25,
      volatilityWeight: 0.15,
      ageWeight: 0.15,
      marketCapWeight: 0.15,
      holderCountWeight: 0.1,
      devActivityWeight: 0.1,
      socialMediaWeight: 0.1
    };
    
    // 初始化当日统计
    this.initializeDailyStats();
    
    // 加载黑名单
    this.loadBlacklist();
    
    logger.info('风险控制与资金管理系统初始化完成', MODULE_NAME);
  }
  
  /**
   * 初始化每日统计数据
   */
  private initializeDailyStats(): void {
    const today = this.getDateString();
    
    if (!this.dailyStats.has(today)) {
      this.dailyStats.set(today, {
        date: today,
        tradeCount: 0,
        totalInvested: 0,
        successfulTrades: 0,
        failedTrades: 0,
        profit: 0
      });
    }
    
    logger.debug('每日交易统计初始化完成', MODULE_NAME);
  }
  
  /**
   * 获取当前日期字符串(YYYY-MM-DD)
   */
  private getDateString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  
  /**
   * 加载代币黑名单
   */
  private loadBlacklist(): void {
    // 这里应该从配置或数据库加载黑名单
    // 简化示例:
    
    // 添加一些示例黑名单代币
    // 实际应用中应从配置加载
    this.blacklistedTokens.add('FakeSolana1111111111111111111111111111111');
    this.blacklistedTokens.add('ScamToken22222222222222222222222222222222');
    
    logger.info(`已加载 ${this.blacklistedTokens.size} 个黑名单代币`, MODULE_NAME);
  }
  
  /**
   * 检查是否存在紧急停止状态
   * @returns 是否处于紧急停止状态
   */
  public isEmergencyStopped(): boolean {
    return this.emergencyStop;
  }
  
  /**
   * 触发紧急停止
   * @param reason 停止原因
   */
  public triggerEmergencyStop(reason: string): void {
    this.emergencyStop = true;
    
    logger.warn(`触发紧急停止: ${reason}`, MODULE_NAME);
    
    // 这里应该添加紧急通知逻辑
    // 例如发送邮件或短信通知
  }
  
  /**
   * 解除紧急停止状态
   */
  public clearEmergencyStop(): void {
    this.emergencyStop = false;
    
    logger.info('已解除紧急停止状态', MODULE_NAME);
  }
  
  /**
   * 验证是否可以交易
   * @param positions 当前持仓列表
   * @returns 是否允许继续交易
   */
  public canTrade(positions: Position[]): boolean {
    // 检查紧急停止状态
    if (this.isEmergencyStopped()) {
      logger.warn('交易被禁止: 系统处于紧急停止状态', MODULE_NAME);
      return false;
    }
    
    // 检查今日交易次数限制
    const today = this.getDateString();
    const stats = this.dailyStats.get(today);
    
    if (!stats) {
      this.initializeDailyStats();
      return true;
    }
    
    if (stats.tradeCount >= this.tradingLimits.maxDailyTrades) {
      logger.warn('交易被禁止: 已达到每日最大交易次数', MODULE_NAME, {
        current: stats.tradeCount,
        limit: this.tradingLimits.maxDailyTrades
      });
      return false;
    }
    
    // 检查持仓数量限制
    if (positions.length >= this.tradingLimits.maxOpenPositions) {
      logger.warn('交易被禁止: 已达到最大持仓数量', MODULE_NAME, {
        current: positions.length,
        limit: this.tradingLimits.maxOpenPositions
      });
      return false;
    }
    
    // 检查每日投资额度限制
    if (stats.totalInvested >= this.tradingLimits.maxDailyInvestment) {
      logger.warn('交易被禁止: 已达到每日最大投资额度', MODULE_NAME, {
        current: stats.totalInvested,
        limit: this.tradingLimits.maxDailyInvestment
      });
      return false;
    }
    
    // 检查总风险敞口
    const totalExposure = this.calculateTotalExposure(positions);
    if (totalExposure >= this.tradingLimits.maxTotalExposure) {
      logger.warn('交易被禁止: 已达到最大风险敞口', MODULE_NAME, {
        current: totalExposure,
        limit: this.tradingLimits.maxTotalExposure
      });
      return false;
    }
    
    return true;
  }
  
  /**
   * 计算当前总风险敞口
   * @param positions 持仓列表
   * @returns 总风险敞口(USD)
   */
  private calculateTotalExposure(positions: Position[]): number {
    let totalExposure = 0;
    
    for (const position of positions) {
      const price = position.currentPrice || position.avgBuyPrice || 0;
      const amount = Number(position.amount) / Math.pow(10, position.token.decimals || 0);
      totalExposure += price * amount;
    }
    
    return totalExposure;
  }
  
  /**
   * 计算代币风险评分
   * @param token 代币信息
   * @param opportunity 交易机会
   * @returns 风险评分(1-5，1最低风险)
   */
  public calculateTokenRisk(token: TokenInfo, opportunity: TradingOpportunity): RiskLevel {
    // 默认风险级别
    let riskScore = 3;
    
    // 检查是否黑名单代币
    if (this.blacklistedTokens.has(token.mint.toBase58())) {
      return RiskLevel.VERY_HIGH; // 黑名单代币直接判定为最高风险
    }
    
    // 应用各种风险评估标准
    
    // 1. 流动性风险
    const liquidityUsd = opportunity.liquidityUsd || 0;
    if (liquidityUsd > 100000) {
      riskScore -= 0.5; // 流动性高，风险降低
    } else if (liquidityUsd < 10000) {
      riskScore += 1; // 流动性低，风险增加
    }
    
    // 2. 代币年龄
    const ageInHours = (Date.now() - opportunity.pool.createdAt) / (1000 * 60 * 60);
    if (ageInHours < 1) {
      riskScore += 1; // 新代币风险高
    } else if (ageInHours > 48) {
      riskScore -= 0.5; // 存在时间长风险较低
    }
    
    // 3. 价格影响
    const priceImpact = opportunity.estimatedSlippage || 0;
    if (priceImpact > 5) {
      riskScore += 0.5; // 价格影响大风险增加
    }
    
    // 4. 代币验证状态
    if (token.isVerified) {
      riskScore -= 1; // 已验证代币风险低
    }
    
    if (token.isBlacklisted) {
      riskScore += 2; // 黑名单代币高风险
    }
    
    // 确保评分在1-5范围内
    riskScore = Math.max(1, Math.min(5, riskScore));
    
    return Math.round(riskScore) as RiskLevel;
  }
  
  /**
   * 生成完整风险报告
   * @param token 代币信息
   * @param opportunity 交易机会
   * @param positions 当前持仓列表
   * @returns 风险报告
   */
  public generateRiskReport(token: TokenInfo, opportunity: TradingOpportunity, positions: Position[]): RiskReport {
    // 计算各方面风险
    const tokenRisk = this.calculateTokenRisk(token, opportunity);
    
    // 市场风险
    let marketRisk = RiskLevel.MEDIUM;
    const volatility = 0.3; // 示例值，实际应从市场数据获取
    if (volatility > 0.5) {
      marketRisk = RiskLevel.HIGH;
    } else if (volatility < 0.2) {
      marketRisk = RiskLevel.LOW;
    }
    
    // 流动性风险
    let liquidityRisk = RiskLevel.MEDIUM;
    const liquidityUsd = opportunity.liquidityUsd || 0;
    if (liquidityUsd > 100000) {
      liquidityRisk = RiskLevel.LOW;
    } else if (liquidityUsd < 10000) {
      liquidityRisk = RiskLevel.HIGH;
    }
    
    // 敞口风险
    let exposureRisk = RiskLevel.LOW;
    const totalExposure = this.calculateTotalExposure(positions);
    const maxExposureRatio = totalExposure / this.tradingLimits.maxTotalExposure;
    if (maxExposureRatio > 0.8) {
      exposureRisk = RiskLevel.HIGH;
    } else if (maxExposureRatio > 0.5) {
      exposureRisk = RiskLevel.MEDIUM;
    }
    
    // 计算整体风险
    const overallRisk = Math.round(
      (tokenRisk * 0.4 + 
       marketRisk * 0.2 + 
       liquidityRisk * 0.2 + 
       exposureRisk * 0.2)
    ) as RiskLevel;
    
    // 生成建议
    let recommendation = '';
    switch (overallRisk) {
      case RiskLevel.VERY_LOW:
      case RiskLevel.LOW:
        recommendation = '建议正常交易，风险较低';
        break;
      case RiskLevel.MEDIUM:
        recommendation = '建议谨慎交易，使用中等资金比例';
        break;
      case RiskLevel.HIGH:
        recommendation = '建议限制交易规模，使用较小资金比例';
        break;
      case RiskLevel.VERY_HIGH:
        recommendation = '不建议交易，风险过高';
        break;
    }
    
    // 构建风险报告
    const report: RiskReport = {
      overallRisk,
      tokenRisk,
      marketRisk,
      liquidityRisk,
      exposureRisk,
      details: {
        tokenAge: (Date.now() - opportunity.pool.createdAt) / (1000 * 60 * 60) + '小时',
        liquidityUsd: liquidityUsd + ' USD',
        totalExposure: totalExposure + ' USD',
        maxExposureRatio: (maxExposureRatio * 100) + '%',
        volatility: (volatility * 100) + '%',
        isVerified: token.isVerified ? '是' : '否',
        isBlacklisted: token.isBlacklisted ? '是' : '否'
      },
      timestamp: Date.now(),
      recommendation
    };
    
    // 缓存风险报告
    this.riskReportCache.set(token.mint.toBase58(), report);
    
    logger.debug(`已生成代币风险报告: ${token.symbol || token.mint.toBase58()}`, MODULE_NAME, {
      overallRisk,
      tokenRisk,
      recommendation
    });
    
    return report;
  }
  
  /**
   * 计算交易资金分配
   * @param token 代币信息
   * @param opportunity 交易机会
   * @param positions 当前持仓列表
   * @returns 分配结果
   */
  public allocateFunds(token: TokenInfo, opportunity: TradingOpportunity, positions: Position[]): AllocationResult {
    // 检查交易合法性
    if (!this.canTrade(positions)) {
      return {
        approved: false,
        allocatedAmount: 0,
        maxAmount: 0,
        remainingDailyBudget: 0,
        remainingTotalBudget: 0,
        reason: '交易被系统限制'
      };
    }
    
    // 获取风险报告
    let riskReport = this.riskReportCache.get(token.mint.toBase58());
    if (!riskReport) {
      riskReport = this.generateRiskReport(token, opportunity, positions);
    }
    
    // 根据风险级别调整分配金额
    let allocatedAmount = this.tradingLimits.maxSingleTradeAmount;
    
    switch (riskReport.overallRisk) {
      case RiskLevel.VERY_LOW:
        // 低风险，使用100%的单笔上限
        break;
      case RiskLevel.LOW:
        // 较低风险，使用80%的单笔上限
        allocatedAmount *= 0.8;
        break;
      case RiskLevel.MEDIUM:
        // 中等风险，使用60%的单笔上限
        allocatedAmount *= 0.6;
        break;
      case RiskLevel.HIGH:
        // 高风险，使用30%的单笔上限
        allocatedAmount *= 0.3;
        break;
      case RiskLevel.VERY_HIGH:
        // 极高风险，不分配资金
        return {
          approved: false,
          allocatedAmount: 0,
          maxAmount: this.tradingLimits.maxSingleTradeAmount,
          remainingDailyBudget: this.getRemainingDailyBudget(),
          remainingTotalBudget: this.tradingLimits.maxTotalExposure - this.calculateTotalExposure(positions),
          reason: '风险过高，拒绝分配资金'
        };
    }
    
    // 确保不超过单笔最大额度
    allocatedAmount = Math.min(allocatedAmount, this.tradingLimits.maxSingleTradeAmount);
    
    // 确保不超过剩余每日预算
    const remainingDailyBudget = this.getRemainingDailyBudget();
    allocatedAmount = Math.min(allocatedAmount, remainingDailyBudget);
    
    // 确保不小于最小交易金额
    if (allocatedAmount < this.tradingLimits.minSingleTradeAmount) {
      return {
        approved: false,
        allocatedAmount: 0,
        maxAmount: this.tradingLimits.maxSingleTradeAmount,
        remainingDailyBudget,
        remainingTotalBudget: this.tradingLimits.maxTotalExposure - this.calculateTotalExposure(positions),
        reason: '分配金额低于最小交易金额'
      };
    }
    
    // 批准资金分配
    return {
      approved: true,
      allocatedAmount,
      maxAmount: this.tradingLimits.maxSingleTradeAmount,
      remainingDailyBudget,
      remainingTotalBudget: this.tradingLimits.maxTotalExposure - this.calculateTotalExposure(positions),
      reason: '资金分配成功'
    };
  }
  
  /**
   * 获取剩余每日预算
   * @returns 剩余预算(USD)
   */
  private getRemainingDailyBudget(): number {
    const today = this.getDateString();
    const stats = this.dailyStats.get(today);
    
    if (!stats) {
      this.initializeDailyStats();
      return this.tradingLimits.maxDailyInvestment;
    }
    
    return Math.max(0, this.tradingLimits.maxDailyInvestment - stats.totalInvested);
  }
  
  /**
   * 记录交易结果
   * @param result 交易结果
   * @param amount 交易金额(USD)
   */
  public recordTradeResult(result: TradeResult, amount: number): void {
    const today = this.getDateString();
    let stats = this.dailyStats.get(today);
    
    if (!stats) {
      this.initializeDailyStats();
      stats = this.dailyStats.get(today)!;
    }
    
    // 更新统计数据
    stats.tradeCount++;
    stats.totalInvested += amount;
    
    if (result.success) {
      stats.successfulTrades++;
      // 如果有利润数据，也可以累加
      if (result.price) {
        // 简化处理，实际应该基于买入卖出计算利润
      }
    } else {
      stats.failedTrades++;
    }
    
    // 更新统计数据
    this.dailyStats.set(today, stats);
    
    logger.debug('已记录交易结果', MODULE_NAME, {
      success: result.success,
      amount,
      dailyTotal: stats.totalInvested
    });
    
    // 检查是否需要紧急止损
    this.checkEmergencyConditions(stats);
  }
  
  /**
   * 检查是否触发紧急条件
   * @param stats 每日统计数据
   */
  private checkEmergencyConditions(stats: DailyStats): void {
    // 检查失败率
    if (stats.tradeCount > 5 && stats.failedTrades / stats.tradeCount > 0.5) {
      this.triggerEmergencyStop('交易失败率过高，超过50%');
    }
    
    // 检查亏损率
    if (stats.profit < 0 && Math.abs(stats.profit) / stats.totalInvested > this.tradingLimits.emergencyStopLoss / 100) {
      this.triggerEmergencyStop(`日亏损率超过设定阈值${this.tradingLimits.emergencyStopLoss}%`);
    }
  }
  
  /**
   * 获取交易限额配置
   * @returns 交易限额配置
   */
  public getTradingLimits(): TradingLimits {
    return { ...this.tradingLimits };
  }
  
  /**
   * 更新交易限额配置
   * @param limits 新的限额配置
   */
  public updateTradingLimits(limits: Partial<TradingLimits>): void {
    this.tradingLimits = { ...this.tradingLimits, ...limits };
    
    logger.info('已更新交易限额配置', MODULE_NAME, {
      maxDailyTrades: this.tradingLimits.maxDailyTrades,
      maxDailyInvestment: this.tradingLimits.maxDailyInvestment,
      maxSingleTradeAmount: this.tradingLimits.maxSingleTradeAmount
    });
  }
  
  /**
   * 获取今日交易统计
   * @returns 今日统计数据
   */
  public getTodayStats(): DailyStats {
    const today = this.getDateString();
    let stats = this.dailyStats.get(today);
    
    if (!stats) {
      this.initializeDailyStats();
      stats = this.dailyStats.get(today)!;
    }
    
    return { ...stats };
  }
  
  /**
   * 检查代币是否在黑名单中
   * @param mintAddress 代币Mint地址
   * @returns 是否在黑名单中
   */
  public isBlacklisted(mintAddress: string | PublicKey): boolean {
    const mintString = typeof mintAddress === 'string' ? mintAddress : mintAddress.toBase58();
    return this.blacklistedTokens.has(mintString);
  }
  
  /**
   * 添加代币到黑名单
   * @param mintAddress 代币Mint地址
   * @param reason 添加原因
   */
  public addToBlacklist(mintAddress: string | PublicKey, reason: string): void {
    const mintString = typeof mintAddress === 'string' ? mintAddress : mintAddress.toBase58();
    
    this.blacklistedTokens.add(mintString);
    
    logger.info(`已将代币添加到黑名单: ${mintString}`, MODULE_NAME, { reason });
    
    // 这里可以添加持久化存储逻辑
  }
  
  /**
   * 从黑名单移除代币
   * @param mintAddress 代币Mint地址
   */
  public removeFromBlacklist(mintAddress: string | PublicKey): void {
    const mintString = typeof mintAddress === 'string' ? mintAddress : mintAddress.toBase58();
    
    const removed = this.blacklistedTokens.delete(mintString);
    
    if (removed) {
      logger.info(`已从黑名单移除代币: ${mintString}`, MODULE_NAME);
      
      // 这里可以添加持久化存储逻辑
    }
  }
}

// 导出单例实例
const riskManager = new RiskManager();
export default riskManager; 