/**
 * 自适应交易策略框架
 * 提供动态调整交易策略的能力，根据市场情况自动优化交易参数和决策
 */
import { StrategyCondition, TradingOpportunity, Position } from '../../core/types';
/**
 * 市场状态枚举
 * 描述当前市场环境
 */
export declare enum MarketState {
    BULL = "bull",// 牛市
    BEAR = "bear",// 熊市
    VOLATILE = "volatile",// 高波动
    STABLE = "stable",// 稳定
    UNKNOWN = "unknown"
}
/**
 * 策略配置接口
 */
export interface StrategyProfile {
    id: string;
    name: string;
    description: string;
    marketStatePreference: MarketState[];
    riskLevel: number;
    buyConditions: {
        minConfidence: number;
        maxSlippage: number;
        priorityThreshold: number;
    };
    sellConditions: StrategyCondition[];
    active: boolean;
}
/**
 * 市场分析结果接口
 */
export interface MarketAnalysis {
    currentState: MarketState;
    volatility: number;
    trend: number;
    sentiment: number;
    timestamp: number;
}
/**
 * 策略性能指标接口
 */
export interface StrategyPerformance {
    strategyId: string;
    successRate: number;
    avgROI: number;
    avgHoldingTime: number;
    winLossRatio: number;
    totalTrades: number;
    profitableTrades: number;
    timestamp: number;
}
/**
 * 策略推荐结果接口
 */
export interface StrategyRecommendation {
    recommendedStrategy: StrategyProfile;
    confidence: number;
    reasons: string[];
    alternativeStrategies: StrategyProfile[];
    timestamp: number;
}
/**
 * 自适应策略框架类
 * 负责管理、评估和自动切换交易策略
 */
export declare class AdaptiveStrategyFramework {
    private strategies;
    private activeStrategy;
    private performanceRecords;
    private latestMarketAnalysis;
    private marketDataHistory;
    /**
     * 构造函数
     */
    constructor();
    /**
     * 初始化预定义策略
     */
    private initializeStrategies;
    /**
     * 加载历史性能数据
     */
    private loadPerformanceData;
    /**
     * 分析当前市场状态
     * @returns 市场分析结果
     */
    analyzeMarketState(): MarketAnalysis;
    /**
     * 推荐最佳策略
     * @returns 策略推荐结果
     */
    recommendStrategy(): StrategyRecommendation;
    /**
     * 应用推荐的策略
     * @param recommendation 策略推荐结果
     * @returns 是否成功切换
     */
    applyRecommendedStrategy(recommendation: StrategyRecommendation): boolean;
    /**
     * 自动选择并应用最佳策略
     * @returns 应用的策略
     */
    autoSelectStrategy(): StrategyProfile;
    /**
     * 获取当前激活的策略
     * @returns 当前激活的策略
     */
    getActiveStrategy(): StrategyProfile | null;
    /**
     * 获取所有可用策略
     * @returns 所有策略列表
     */
    getAllStrategies(): StrategyProfile[];
    /**
     * 根据ID获取策略
     * @param id 策略ID
     * @returns 策略配置或null
     */
    getStrategyById(id: string): StrategyProfile | null;
    /**
     * 添加自定义策略
     * @param strategy 策略配置
     * @returns 是否成功添加
     */
    addCustomStrategy(strategy: StrategyProfile): boolean;
    /**
     * 更新策略性能数据
     * @param strategyId 策略ID
     * @param performance 性能数据
     */
    updatePerformanceData(strategyId: string, performance: Partial<StrategyPerformance>): void;
    /**
     * 生成买入决策建议
     * @param opportunity 交易机会
     * @returns 是否应该买入
     */
    shouldBuy(opportunity: TradingOpportunity): boolean;
    /**
     * 生成卖出决策建议
     * @param position 持仓
     * @param currentPrice 当前价格
     * @returns 是否应该卖出及理由
     */
    shouldSell(position: Position, currentPrice: number): {
        shouldSell: boolean;
        reason?: string;
    };
}
declare const adaptiveStrategyFramework: AdaptiveStrategyFramework;
export default adaptiveStrategyFramework;
