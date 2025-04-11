/**
 * 自适应渔法策略系统 (Adaptive Strategy Framework)
 * -----------------------------------------------
 * 这个模块是我们渔船的"智慧大脑"，负责根据不同的海洋环境(市场状态)动态调整捕鱼策略。
 *
 * 就像一位经验丰富的老渔长，能够通过分析海水温度、风向、洋流和鱼群动态来决定：
 * - 何时出海(入场时机)
 * - 使用什么渔具(交易策略)
 * - 在哪片海域下网(选择交易对象)
 * - 何时收网返航(退出策略)
 *
 * 这套系统通过记录每次捕鱼的结果，不断学习和优化捕鱼策略，确保在各种海况下都能获得最佳渔获。
 * 系统内置了多种预定义的捕鱼方案，从保守型(低风险)到激进型(高风险)，每种方案都针对特定的海况优化。
 *
 * 核心功能:
 * - 海况分析：评估当前市场状态(牛市/熊市/震荡等)
 * - 策略推荐：根据海况和历史表现推荐最佳捕鱼方案
 * - 入场决策：判断发现的鱼群是否值得下网捕捞
 * - 出场决策：判断何时收网，防止鱼群逃跑或渔获损失
 * - 绩效追踪：记录每种策略的成功率、平均收益等数据
 */
import type { StrategyCondition, TradingOpportunity, Position } from '../../core/types';
/**
 * 海洋状态枚举
 * 描述当前数字海洋的环境状况，不同的海况需要不同的捕鱼策略
 */
export declare enum MarketState {
    BULL = "bull",// 丰收期（牛市）- 鱼群活跃，容易捕获大量优质鱼种
    BEAR = "bear",// 荒芜期（熊市）- 优质鱼种稀少，需谨慎捕捞避免亏损
    VOLATILE = "volatile",// 风暴期（高波动）- 海况不稳，需要特殊的捕鱼技巧
    STABLE = "stable",// 平静期（稳定）- 海面平静，适合常规捕鱼作业
    UNKNOWN = "unknown"
}
/**
 * 捕鱼方案接口
 * 定义了一种完整的捕鱼策略方案，包含各种参数和条件
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
 * 海况分析报告接口
 * 记录对当前数字海洋环境的全面分析结果
 */
export interface MarketAnalysis {
    currentState: MarketState;
    volatility: number;
    trend: number;
    sentiment: number;
    timestamp: number;
}
/**
 * 捕鱼方案效率报告接口
 * 记录每种捕鱼方案的历史表现数据
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
 * 捕鱼方案推荐结果接口
 * 系统分析后给出的最佳捕鱼方案建议
 */
export interface StrategyRecommendation {
    recommendedStrategy: StrategyProfile;
    confidence: number;
    reasons: string[];
    alternativeStrategies: StrategyProfile[];
    timestamp: number;
}
/**
 * 智能渔法选择系统类
 *
 * 就像一位经验丰富的捕鱼队长，这个系统能够：
 * 1. 管理多种捕鱼方案 - 从保守的近岸小网捕捞到激进的深海大型捕鱼作业
 * 2. 实时分析海况 - 评估当前海洋环境适合什么样的捕鱼方式
 * 3. 自动切换最佳捕鱼策略 - 根据环境变化调整作业方案
 * 4. 记录每种策略的效果 - 长期优化捕鱼方法
 */
export declare class AdaptiveStrategyFramework {
    private strategies;
    private activeStrategy;
    private performanceRecords;
    private latestMarketAnalysis;
    private marketDataHistory;
    /**
     * 构造函数 - 渔船启航前的准备工作
     */
    constructor();
    /**
     * 设置预定义的捕鱼方案
     * 就像准备好各种类型的渔网和钓具，应对不同的鱼群和海况
     */
    private initializeStrategies;
    /**
     * 加载历史捕鱼绩效数据
     * 就像查阅过去几个月的捕鱼日志，了解每种渔法的实际效果
     */
    private loadPerformanceData;
    /**
     * 分析当前海况状态
     * 就像站在船头观察海面风浪、水温和鱼群活动，预判最佳捕鱼位置
     * @returns 当前海况分析报告
     */
    analyzeMarketState(): MarketAnalysis;
    /**
     * 推荐最佳捕鱼策略
     * 就像经验丰富的船长根据当前海况给出最佳捕鱼建议
     * @returns 捕鱼策略推荐结果
     */
    recommendStrategy(): StrategyRecommendation;
    /**
     * 应用推荐的捕鱼策略
     * 就像根据船长的建议，准备相应的渔具和设定捕捞参数
     * @returns 是否成功应用新策略
     */
    applyRecommendedStrategy(): boolean;
    /**
     * 自动选择最佳捕鱼策略
     * 定期根据海况自动调整渔法，就像资深船长不断观察海况并调整作业方式
     * @param autoInterval 自动调整的时间间隔(毫秒)
     */
    enableAutoStrategySelection(autoInterval?: number): void;
    /**
     * 获取当前使用的捕鱼策略
     * 查看当前渔船正在使用的渔具和捕捞方式
     * @returns 当前活跃的策略配置
     */
    getActiveStrategy(): StrategyProfile;
    /**
     * 获取所有可用的捕鱼策略
     * 查看渔船上所有准备好的渔具和捕捞方法
     * @returns 所有策略的列表
     */
    getAllStrategies(): StrategyProfile[];
    /**
     * 获取特定ID的捕鱼策略
     * 找出特定名称的渔具或捕捞方法
     * @param id 策略ID
     * @returns 找到的策略，如果不存在则返回null
     */
    getStrategyById(id: string): StrategyProfile | null;
    /**
     * 添加自定义捕鱼策略
     * 在渔船上添加新研发的捕鱼技术或工具
     * @param strategy 新的策略配置
     * @returns 是否成功添加
     */
    addCustomStrategy(strategy: StrategyProfile): boolean;
    /**
     * 更新策略绩效数据
     * 记录每次捕捞的成效，更新渔法的历史表现数据
     * @param strategyId 策略ID
     * @param successful 是否成功获利
     * @param roi 获得的回报率(%)
     * @param holdingTimeSeconds 持有时间(秒)
     */
    updatePerformanceData(strategyId: string, successful: boolean, roi: number, holdingTimeSeconds: number): void;
    /**
     * 判断是否应该下网捕捞(买入)
     * 根据当前捕鱼策略评估发现的鱼群是否值得捕捞
     * @param opportunity 发现的交易机会(鱼群)
     * @returns 是否应该买入的决策
     */
    shouldBuy(opportunity: TradingOpportunity): boolean;
    /**
     * 判断是否应该收网(卖出)
     * 根据当前捕鱼策略和持仓状况，决定是否该收网返航
     * @param position 当前持仓(已捕获的鱼)
     * @returns 是否应该卖出的决策和原因
     */
    shouldSell(position: Position): {
        sell: boolean;
        reason: string;
    };
}
export declare const adaptiveStrategyFramework: AdaptiveStrategyFramework;
