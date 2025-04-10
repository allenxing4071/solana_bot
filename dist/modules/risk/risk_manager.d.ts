/**
 * 风险控制与资金管理系统
 * 负责管理交易风险，控制资金分配，确保系统安全运行
 */
import { PublicKey } from '@solana/web3.js';
import { Position, TokenInfo, TradeResult, TradingOpportunity } from '../../core/types';
/**
 * 风险级别枚举
 */
export declare enum RiskLevel {
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
    maxDailyTrades: number;
    maxDailyInvestment: number;
    maxSingleTradeAmount: number;
    minSingleTradeAmount: number;
    maxOpenPositions: number;
    maxTotalExposure: number;
    maxExposurePerToken: number;
    emergencyStopLoss: number;
}
/**
 * 风险评分标准接口
 */
export interface RiskScoringCriteria {
    liquidityWeight: number;
    volatilityWeight: number;
    ageWeight: number;
    marketCapWeight: number;
    holderCountWeight: number;
    devActivityWeight: number;
    socialMediaWeight: number;
}
/**
 * 风险报告接口
 */
export interface RiskReport {
    overallRisk: RiskLevel;
    tokenRisk: RiskLevel;
    marketRisk: RiskLevel;
    liquidityRisk: RiskLevel;
    exposureRisk: RiskLevel;
    details: {
        [key: string]: number | string;
    };
    timestamp: number;
    recommendation: string;
}
/**
 * 资金分配结果接口
 */
export interface AllocationResult {
    approved: boolean;
    allocatedAmount: number;
    maxAmount: number;
    remainingDailyBudget: number;
    remainingTotalBudget: number;
    reason: string;
}
/**
 * 每日交易统计接口
 */
export interface DailyStats {
    date: string;
    tradeCount: number;
    totalInvested: number;
    successfulTrades: number;
    failedTrades: number;
    profit: number;
}
/**
 * 风险控制与资金管理系统类
 * 负责控制交易风险和资金分配
 */
export declare class RiskManager {
    private tradingLimits;
    private scoringCriteria;
    private dailyStats;
    private riskReportCache;
    private emergencyStop;
    private blacklistedTokens;
    /**
     * 构造函数
     */
    constructor();
    /**
     * 初始化每日统计数据
     */
    private initializeDailyStats;
    /**
     * 获取当前日期字符串(YYYY-MM-DD)
     */
    private getDateString;
    /**
     * 加载代币黑名单
     */
    private loadBlacklist;
    /**
     * 检查是否存在紧急停止状态
     * @returns 是否处于紧急停止状态
     */
    isEmergencyStopped(): boolean;
    /**
     * 触发紧急停止
     * @param reason 停止原因
     */
    triggerEmergencyStop(reason: string): void;
    /**
     * 解除紧急停止状态
     */
    clearEmergencyStop(): void;
    /**
     * 验证是否可以交易
     * @param positions 当前持仓列表
     * @returns 是否允许继续交易
     */
    canTrade(positions: Position[]): boolean;
    /**
     * 计算当前总风险敞口
     * @param positions 持仓列表
     * @returns 总风险敞口(USD)
     */
    private calculateTotalExposure;
    /**
     * 计算代币风险评分
     * @param token 代币信息
     * @param opportunity 交易机会
     * @returns 风险评分(1-5，1最低风险)
     */
    calculateTokenRisk(token: TokenInfo, opportunity: TradingOpportunity): RiskLevel;
    /**
     * 生成完整风险报告
     * @param token 代币信息
     * @param opportunity 交易机会
     * @param positions 当前持仓列表
     * @returns 风险报告
     */
    generateRiskReport(token: TokenInfo, opportunity: TradingOpportunity, positions: Position[]): RiskReport;
    /**
     * 计算交易资金分配
     * @param token 代币信息
     * @param opportunity 交易机会
     * @param positions 当前持仓列表
     * @returns 分配结果
     */
    allocateFunds(token: TokenInfo, opportunity: TradingOpportunity, positions: Position[]): AllocationResult;
    /**
     * 获取剩余每日预算
     * @returns 剩余预算(USD)
     */
    private getRemainingDailyBudget;
    /**
     * 记录交易结果
     * @param result 交易结果
     * @param amount 交易金额(USD)
     */
    recordTradeResult(result: TradeResult, amount: number): void;
    /**
     * 检查是否触发紧急条件
     * @param stats 每日统计数据
     */
    private checkEmergencyConditions;
    /**
     * 获取交易限额配置
     * @returns 交易限额配置
     */
    getTradingLimits(): TradingLimits;
    /**
     * 更新交易限额配置
     * @param limits 新的限额配置
     */
    updateTradingLimits(limits: Partial<TradingLimits>): void;
    /**
     * 获取今日交易统计
     * @returns 今日统计数据
     */
    getTodayStats(): DailyStats;
    /**
     * 检查代币是否在黑名单中
     * @param mintAddress 代币Mint地址
     * @returns 是否在黑名单中
     */
    isBlacklisted(mintAddress: string | PublicKey): boolean;
    /**
     * 添加代币到黑名单
     * @param mintAddress 代币Mint地址
     * @param reason 添加原因
     */
    addToBlacklist(mintAddress: string | PublicKey, reason: string): void;
    /**
     * 从黑名单移除代币
     * @param mintAddress 代币Mint地址
     */
    removeFromBlacklist(mintAddress: string | PublicKey): void;
}
declare const riskManager: RiskManager;
export default riskManager;
