"use strict";
/**
 * 自适应交易策略框架
 * 提供动态调整交易策略的能力，根据市场情况自动优化交易参数和决策
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdaptiveStrategyFramework = exports.MarketState = void 0;
const logger_1 = __importDefault(require("../../core/logger"));
const types_1 = require("../../core/types");
// 模块名称
const MODULE_NAME = 'AdaptiveStrategyFramework';
/**
 * 市场状态枚举
 * 描述当前市场环境
 */
var MarketState;
(function (MarketState) {
    MarketState["BULL"] = "bull";
    MarketState["BEAR"] = "bear";
    MarketState["VOLATILE"] = "volatile";
    MarketState["STABLE"] = "stable";
    MarketState["UNKNOWN"] = "unknown"; // 未知
})(MarketState || (exports.MarketState = MarketState = {}));
/**
 * 自适应策略框架类
 * 负责管理、评估和自动切换交易策略
 */
class AdaptiveStrategyFramework {
    /**
     * 构造函数
     */
    constructor() {
        // 所有可用策略列表
        this.strategies = new Map();
        // 当前激活的策略
        this.activeStrategy = null;
        // 策略性能记录
        this.performanceRecords = new Map();
        // 最新市场分析结果
        this.latestMarketAnalysis = null;
        // 市场数据历史记录(用于分析)
        this.marketDataHistory = [];
        this.initializeStrategies();
        this.loadPerformanceData();
        logger_1.default.info('自适应交易策略框架初始化完成', MODULE_NAME);
    }
    /**
     * 初始化预定义策略
     */
    initializeStrategies() {
        // 创建默认策略配置
        // 1. 保守策略 - 适合熊市或高波动市场
        const conservativeStrategy = {
            id: 'conservative',
            name: '保守策略',
            description: '低风险策略，较小止盈点，严格止损，适合熊市和高波动环境',
            marketStatePreference: [MarketState.BEAR, MarketState.VOLATILE],
            riskLevel: 2,
            buyConditions: {
                minConfidence: 0.7,
                maxSlippage: 1.0,
                priorityThreshold: 0.7
            },
            sellConditions: [
                { type: types_1.StrategyType.TAKE_PROFIT, percentage: 10, enabled: true },
                { type: types_1.StrategyType.STOP_LOSS, percentage: 5, enabled: true },
                { type: types_1.StrategyType.TRAILING_STOP, percentage: 3, enabled: true },
                { type: types_1.StrategyType.TIME_LIMIT, timeSeconds: 1800, enabled: true }
            ],
            active: false
        };
        // 2. 平衡策略 - 适合正常或稳定市场
        const balancedStrategy = {
            id: 'balanced',
            name: '平衡策略',
            description: '平衡风险和收益，适合大多数市场环境',
            marketStatePreference: [MarketState.STABLE, MarketState.BULL],
            riskLevel: 3,
            buyConditions: {
                minConfidence: 0.6,
                maxSlippage: 2.0,
                priorityThreshold: 0.6
            },
            sellConditions: [
                { type: types_1.StrategyType.TAKE_PROFIT, percentage: 20, enabled: true },
                { type: types_1.StrategyType.STOP_LOSS, percentage: 10, enabled: true },
                { type: types_1.StrategyType.TRAILING_STOP, percentage: 5, enabled: true },
                { type: types_1.StrategyType.TIME_LIMIT, timeSeconds: 3600, enabled: true }
            ],
            active: true
        };
        // 3. 激进策略 - 适合牛市
        const aggressiveStrategy = {
            id: 'aggressive',
            name: '激进策略',
            description: '高风险高收益策略，较大止盈点，宽松止损，适合牛市环境',
            marketStatePreference: [MarketState.BULL],
            riskLevel: 4,
            buyConditions: {
                minConfidence: 0.5,
                maxSlippage: 3.0,
                priorityThreshold: 0.5
            },
            sellConditions: [
                { type: types_1.StrategyType.TAKE_PROFIT, percentage: 40, enabled: true },
                { type: types_1.StrategyType.STOP_LOSS, percentage: 15, enabled: true },
                { type: types_1.StrategyType.TRAILING_STOP, percentage: 10, enabled: true },
                { type: types_1.StrategyType.TIME_LIMIT, timeSeconds: 7200, enabled: true }
            ],
            active: false
        };
        // 添加到策略列表
        this.strategies.set(conservativeStrategy.id, conservativeStrategy);
        this.strategies.set(balancedStrategy.id, balancedStrategy);
        this.strategies.set(aggressiveStrategy.id, aggressiveStrategy);
        // 设置初始激活策略
        this.activeStrategy = balancedStrategy;
        logger_1.default.info(`已初始化 ${this.strategies.size} 个预定义策略`, MODULE_NAME);
    }
    /**
     * 加载历史性能数据
     */
    loadPerformanceData() {
        // 这里应该从持久化存储加载历史性能数据
        // 简化示例:
        const defaultPerformance = {
            strategyId: 'balanced',
            successRate: 0.65,
            avgROI: 15.2,
            avgHoldingTime: 2450,
            winLossRatio: 1.8,
            totalTrades: 100,
            profitableTrades: 65,
            timestamp: Date.now()
        };
        this.performanceRecords.set('balanced', defaultPerformance);
        logger_1.default.debug('已加载策略性能数据', MODULE_NAME);
    }
    /**
     * 分析当前市场状态
     * @returns 市场分析结果
     */
    analyzeMarketState() {
        // 这里应该包含复杂的市场分析逻辑
        // 简化示例:
        // 模拟市场分析结果
        const analysis = {
            currentState: MarketState.STABLE,
            volatility: 0.3, // 30%波动率
            trend: 0.2, // 轻微上升趋势
            sentiment: 0.1, // 轻微正面情绪
            timestamp: Date.now()
        };
        // 保存分析结果
        this.latestMarketAnalysis = analysis;
        this.marketDataHistory.push(analysis);
        // 限制历史记录长度
        if (this.marketDataHistory.length > 100) {
            this.marketDataHistory.shift();
        }
        logger_1.default.debug('市场状态分析完成', MODULE_NAME, {
            state: analysis.currentState,
            volatility: analysis.volatility,
            trend: analysis.trend
        });
        return analysis;
    }
    /**
     * 推荐最佳策略
     * @returns 策略推荐结果
     */
    recommendStrategy() {
        // 确保有市场分析结果
        if (!this.latestMarketAnalysis) {
            this.analyzeMarketState();
        }
        const marketState = this.latestMarketAnalysis.currentState;
        // 匹配最佳策略
        let bestStrategy = null;
        let bestScore = -1;
        let alternativeStrategies = [];
        // 为每个策略评分
        for (const strategy of this.strategies.values()) {
            let score = 0;
            // 检查市场状态匹配
            if (strategy.marketStatePreference.includes(marketState)) {
                score += 2;
            }
            // 检查性能记录
            const performance = this.performanceRecords.get(strategy.id);
            if (performance) {
                score += performance.successRate * 3;
                score += performance.winLossRatio;
            }
            // 根据波动率调整评分
            if (this.latestMarketAnalysis.volatility > 0.5 && strategy.riskLevel < 3) {
                score += 1; // 高波动时倾向于低风险策略
            }
            // 更新最佳策略
            if (score > bestScore) {
                if (bestStrategy) {
                    alternativeStrategies.unshift(bestStrategy);
                }
                bestStrategy = strategy;
                bestScore = score;
            }
            else if (score > bestScore * 0.8) {
                alternativeStrategies.push(strategy);
            }
            // 限制备选策略数量
            if (alternativeStrategies.length > 2) {
                alternativeStrategies.pop();
            }
        }
        // 如果没有找到合适策略，使用平衡策略
        if (!bestStrategy) {
            bestStrategy = this.strategies.get('balanced');
        }
        // 生成推荐理由
        const reasons = [];
        reasons.push(`当前市场状态为 ${marketState}，与该策略匹配度高`);
        if (this.latestMarketAnalysis.volatility > 0.5) {
            reasons.push(`市场波动率较高 (${(this.latestMarketAnalysis.volatility * 100).toFixed(0)}%)，需要合适的风险控制`);
        }
        const performance = this.performanceRecords.get(bestStrategy.id);
        if (performance) {
            reasons.push(`该策略历史成功率为 ${(performance.successRate * 100).toFixed(0)}%`);
        }
        // 创建推荐结果
        const recommendation = {
            recommendedStrategy: bestStrategy,
            confidence: bestScore / 10, // 归一化到0-1区间
            reasons,
            alternativeStrategies,
            timestamp: Date.now()
        };
        logger_1.default.info(`策略推荐完成: ${bestStrategy.name}`, MODULE_NAME, {
            strategyId: bestStrategy.id,
            confidence: recommendation.confidence,
            marketState
        });
        return recommendation;
    }
    /**
     * 应用推荐的策略
     * @param recommendation 策略推荐结果
     * @returns 是否成功切换
     */
    applyRecommendedStrategy(recommendation) {
        const strategy = recommendation.recommendedStrategy;
        // 更新激活状态
        for (const [id, strat] of this.strategies.entries()) {
            strat.active = (id === strategy.id);
        }
        // 更新当前激活策略
        this.activeStrategy = strategy;
        logger_1.default.info(`已切换到新策略: ${strategy.name}`, MODULE_NAME, {
            strategyId: strategy.id,
            riskLevel: strategy.riskLevel
        });
        return true;
    }
    /**
     * 自动选择并应用最佳策略
     * @returns 应用的策略
     */
    autoSelectStrategy() {
        const recommendation = this.recommendStrategy();
        this.applyRecommendedStrategy(recommendation);
        return recommendation.recommendedStrategy;
    }
    /**
     * 获取当前激活的策略
     * @returns 当前激活的策略
     */
    getActiveStrategy() {
        return this.activeStrategy;
    }
    /**
     * 获取所有可用策略
     * @returns 所有策略列表
     */
    getAllStrategies() {
        return Array.from(this.strategies.values());
    }
    /**
     * 根据ID获取策略
     * @param id 策略ID
     * @returns 策略配置或null
     */
    getStrategyById(id) {
        return this.strategies.get(id) || null;
    }
    /**
     * 添加自定义策略
     * @param strategy 策略配置
     * @returns 是否成功添加
     */
    addCustomStrategy(strategy) {
        if (this.strategies.has(strategy.id)) {
            logger_1.default.warn(`无法添加策略: ID '${strategy.id}' 已存在`, MODULE_NAME);
            return false;
        }
        this.strategies.set(strategy.id, strategy);
        logger_1.default.info(`已添加新策略: ${strategy.name}`, MODULE_NAME, {
            strategyId: strategy.id
        });
        return true;
    }
    /**
     * 更新策略性能数据
     * @param strategyId 策略ID
     * @param performance 性能数据
     */
    updatePerformanceData(strategyId, performance) {
        const existingData = this.performanceRecords.get(strategyId);
        if (existingData) {
            // 更新现有记录
            Object.assign(existingData, performance, { timestamp: Date.now() });
        }
        else {
            // 创建新记录
            const newRecord = {
                strategyId,
                successRate: performance.successRate || 0,
                avgROI: performance.avgROI || 0,
                avgHoldingTime: performance.avgHoldingTime || 0,
                winLossRatio: performance.winLossRatio || 0,
                totalTrades: performance.totalTrades || 0,
                profitableTrades: performance.profitableTrades || 0,
                timestamp: Date.now()
            };
            this.performanceRecords.set(strategyId, newRecord);
        }
        logger_1.default.debug(`已更新策略性能数据: ${strategyId}`, MODULE_NAME);
    }
    /**
     * 生成买入决策建议
     * @param opportunity 交易机会
     * @returns 是否应该买入
     */
    shouldBuy(opportunity) {
        // 确保有激活的策略
        if (!this.activeStrategy) {
            this.autoSelectStrategy();
        }
        const strategy = this.activeStrategy;
        // 检查买入条件
        const minConfidence = strategy.buyConditions.minConfidence;
        const maxSlippage = strategy.buyConditions.maxSlippage;
        const priorityThreshold = strategy.buyConditions.priorityThreshold;
        // 基本检查
        if (opportunity.confidence < minConfidence) {
            logger_1.default.debug('跳过买入: 信心度低于策略要求', MODULE_NAME, {
                actual: opportunity.confidence,
                required: minConfidence,
                token: opportunity.targetToken.symbol || opportunity.targetToken.mint.toBase58()
            });
            return false;
        }
        if ((opportunity.estimatedSlippage || 0) > maxSlippage) {
            logger_1.default.debug('跳过买入: 预估滑点高于策略允许', MODULE_NAME, {
                actual: opportunity.estimatedSlippage,
                max: maxSlippage,
                token: opportunity.targetToken.symbol || opportunity.targetToken.mint.toBase58()
            });
            return false;
        }
        if (opportunity.priorityScore < priorityThreshold) {
            logger_1.default.debug('跳过买入: 优先级低于策略阈值', MODULE_NAME, {
                actual: opportunity.priorityScore,
                threshold: priorityThreshold,
                token: opportunity.targetToken.symbol || opportunity.targetToken.mint.toBase58()
            });
            return false;
        }
        // 通过所有检查
        logger_1.default.debug('买入决策: 符合策略条件', MODULE_NAME, {
            strategyId: strategy.id,
            token: opportunity.targetToken.symbol || opportunity.targetToken.mint.toBase58()
        });
        return true;
    }
    /**
     * 生成卖出决策建议
     * @param position 持仓
     * @param currentPrice 当前价格
     * @returns 是否应该卖出及理由
     */
    shouldSell(position, currentPrice) {
        // 确保有激活的策略
        if (!this.activeStrategy) {
            this.autoSelectStrategy();
        }
        const strategy = this.activeStrategy;
        // 获取所有启用的卖出条件
        const sellConditions = strategy.sellConditions.filter(condition => condition.enabled);
        // 计算盈亏百分比
        const buyPrice = position.avgBuyPrice || 0;
        if (buyPrice <= 0)
            return { shouldSell: false, reason: '无法获取买入价格' };
        const profitPercentage = ((currentPrice - buyPrice) / buyPrice) * 100;
        // 检查所有卖出条件
        for (const condition of sellConditions) {
            switch (condition.type) {
                case types_1.StrategyType.TAKE_PROFIT:
                    if (profitPercentage >= (condition.percentage || 0)) {
                        return {
                            shouldSell: true,
                            reason: `达到止盈条件: ${profitPercentage.toFixed(2)}% >= ${condition.percentage}%`
                        };
                    }
                    break;
                case types_1.StrategyType.STOP_LOSS:
                    if (profitPercentage <= -(condition.percentage || 0)) {
                        return {
                            shouldSell: true,
                            reason: `达到止损条件: ${profitPercentage.toFixed(2)}% <= -${condition.percentage}%`
                        };
                    }
                    break;
                case types_1.StrategyType.TIME_LIMIT:
                    const holdingTimeSeconds = (Date.now() - position.lastUpdated) / 1000;
                    if (holdingTimeSeconds >= (condition.timeSeconds || 0)) {
                        return {
                            shouldSell: true,
                            reason: `达到时间限制: 持有 ${(holdingTimeSeconds / 60).toFixed(0)} 分钟 >= ${(condition.timeSeconds || 0) / 60} 分钟`
                        };
                    }
                    break;
            }
        }
        // 未触发任何条件
        return { shouldSell: false };
    }
}
exports.AdaptiveStrategyFramework = AdaptiveStrategyFramework;
// 导出单例实例
const adaptiveStrategyFramework = new AdaptiveStrategyFramework();
exports.default = adaptiveStrategyFramework;
//# sourceMappingURL=adaptive_strategy_framework.js.map