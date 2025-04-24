"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adaptiveStrategyFramework = exports.AdaptiveStrategyFramework = exports.MarketState = void 0;
const logger_1 = __importDefault(require("../../core/logger"));
const types_1 = require("../../core/types");
// 模块名称
const MODULE_NAME = 'AdaptiveStrategyFramework';
/**
 * 海洋状态枚举
 * 描述当前数字海洋的环境状况，不同的海况需要不同的捕鱼策略
 */
var MarketState;
(function (MarketState) {
    MarketState["BULL"] = "bull";
    MarketState["BEAR"] = "bear";
    MarketState["VOLATILE"] = "volatile";
    MarketState["STABLE"] = "stable";
    MarketState["UNKNOWN"] = "unknown"; // 未知海况 - 缺乏足够的环境数据，需要先侦察
})(MarketState || (exports.MarketState = MarketState = {}));
/**
 * 智能渔法选择系统类
 *
 * 就像一位经验丰富的捕鱼队长，这个系统能够：
 * 1. 管理多种捕鱼方案 - 从保守的近岸小网捕捞到激进的深海大型捕鱼作业
 * 2. 实时分析海况 - 评估当前海洋环境适合什么样的捕鱼方式
 * 3. 自动切换最佳捕鱼策略 - 根据环境变化调整作业方案
 * 4. 记录每种策略的效果 - 长期优化捕鱼方法
 */
class AdaptiveStrategyFramework {
    /**
     * 构造函数 - 渔船启航前的准备工作
     */
    constructor() {
        // 渔船上的捕鱼方案手册集合
        this.strategies = new Map();
        // 当前正在使用的捕鱼方案
        this.activeStrategy = null;
        // 各种捕鱼方案的历史效果记录
        this.performanceRecords = new Map();
        // 最新海况分析报告
        this.latestMarketAnalysis = null;
        // 海况历史数据(用于趋势分析)
        this.marketDataHistory = [];
        this.initializeStrategies();
        this.loadPerformanceData();
        logger_1.default.info('智能渔法选择系统初始化完成，渔船已准备出海', MODULE_NAME);
    }
    /**
     * 设置预定义的捕鱼方案
     * 就像准备好各种类型的渔网和钓具，应对不同的鱼群和海况
     */
    initializeStrategies() {
        // 平衡型捕鱼方案 - 适合大多数海况的通用型渔法
        const balancedStrategy = {
            id: 'balanced',
            name: '平衡型捕鱼方案',
            description: '适合各种海况的通用型渔法，风险和收益平衡',
            riskLevel: 3,
            active: true,
            marketStatePreference: [MarketState.STABLE, MarketState.BULL, MarketState.BEAR],
            buyConditions: {
                minConfidence: 0.65,
                maxSlippage: 1.0,
                priorityThreshold: 0.7
            },
            sellConditions: [
                { type: types_1.StrategyType.TAKE_PROFIT, enabled: true, percentage: 3.0 },
                { type: types_1.StrategyType.STOP_LOSS, enabled: true, percentage: 1.5 },
                { type: types_1.StrategyType.TIME_LIMIT, enabled: true, timeSeconds: 60 * 60 } // 1小时
            ]
        };
        // 激进型捕鱼方案 - 适合发现大鱼群时的快速下网策略
        const aggressiveStrategy = {
            id: 'aggressive',
            name: '激进型深海捕捞',
            description: '高风险高回报的深海捕捞方案，适合牛市和突破行情',
            riskLevel: 5,
            active: false,
            marketStatePreference: [MarketState.BULL, MarketState.VOLATILE],
            buyConditions: {
                minConfidence: 0.6,
                maxSlippage: 2.0,
                priorityThreshold: 0.5
            },
            sellConditions: [
                { type: types_1.StrategyType.TAKE_PROFIT, enabled: true, percentage: 5.0 },
                { type: types_1.StrategyType.STOP_LOSS, enabled: true, percentage: 2.5 },
                { type: types_1.StrategyType.TIME_LIMIT, enabled: true, timeSeconds: 30 * 60 } // 30分钟
            ]
        };
        // 保守型捕鱼方案 - 风浪大时的安全捕捞策略
        const conservativeStrategy = {
            id: 'conservative',
            name: '保守型浅滩捕捞',
            description: '低风险低回报的近岸捕捞方案，注重安全性',
            riskLevel: 1,
            active: false,
            marketStatePreference: [MarketState.BEAR, MarketState.VOLATILE, MarketState.UNKNOWN],
            buyConditions: {
                minConfidence: 0.8,
                maxSlippage: 0.5,
                priorityThreshold: 0.85
            },
            sellConditions: [
                { type: types_1.StrategyType.TAKE_PROFIT, enabled: true, percentage: 2.0 },
                { type: types_1.StrategyType.STOP_LOSS, enabled: true, percentage: 0.8 },
                { type: types_1.StrategyType.TIME_LIMIT, enabled: true, timeSeconds: 120 * 60 } // 2小时
            ]
        };
        // 将捕鱼方案添加到系统中
        this.strategies.set(balancedStrategy.id, balancedStrategy);
        this.strategies.set(aggressiveStrategy.id, aggressiveStrategy);
        this.strategies.set(conservativeStrategy.id, conservativeStrategy);
        // 默认使用平衡型捕鱼方案
        this.activeStrategy = balancedStrategy;
        logger_1.default.info(MODULE_NAME, `已初始化 ${this.strategies.size} 种捕鱼策略方案`);
    }
    /**
     * 加载历史捕鱼绩效数据
     * 就像查阅过去几个月的捕鱼日志，了解每种渔法的实际效果
     */
    loadPerformanceData() {
        // 模拟从数据库或文件加载历史绩效数据
        // 实际实现中，这些数据会从持久化存储中加载
        // 为每种策略创建初始绩效记录
        for (const [id, strategy] of this.strategies) {
            const initialPerformance = {
                strategyId: id,
                successRate: 0.7, // 初始成功率设为70%
                avgROI: 2.5, // 初始平均回报率设为2.5%
                avgHoldingTime: 3600, // 初始平均持有时间1小时
                winLossRatio: 1.5, // 初始盈亏比1.5
                totalTrades: 10, // 假设已有10次交易记录
                profitableTrades: 7, // 其中7次盈利
                timestamp: Date.now()
            };
            this.performanceRecords.set(id, initialPerformance);
        }
        logger_1.default.info(MODULE_NAME, `已加载 ${this.performanceRecords.size} 项捕鱼策略绩效数据`);
    }
    /**
     * 分析当前海况状态
     * 就像站在船头观察海面风浪、水温和鱼群活动，预判最佳捕鱼位置
     * @returns 当前海况分析报告
     */
    analyzeMarketState() {
        // 实际实现中，这里会有复杂的市场分析算法
        // 可能会考虑各种指标如成交量、价格走势、市场深度等
        // 此处使用模拟数据演示功能
        const currentMarketAnalysis = {
            currentState: Math.random() > 0.7 ? MarketState.BULL :
                Math.random() > 0.5 ? MarketState.BEAR :
                    Math.random() > 0.3 ? MarketState.VOLATILE :
                        MarketState.STABLE,
            volatility: Math.random(), // 0-1之间的随机数，模拟市场波动率
            trend: Math.random() * 2 - 1, // -1到1之间的随机数，模拟市场趋势
            sentiment: Math.random() * 2 - 1, // -1到1之间的随机数，模拟市场情绪
            timestamp: Date.now()
        };
        // 保存分析结果
        this.latestMarketAnalysis = currentMarketAnalysis;
        // 保存历史数据，最多保留100条
        this.marketDataHistory.push(currentMarketAnalysis);
        if (this.marketDataHistory.length > 100) {
            this.marketDataHistory.shift();
        }
        logger_1.default.debug(MODULE_NAME, `海况分析完成: ${currentMarketAnalysis.currentState}`);
        return currentMarketAnalysis;
    }
    /**
     * 推荐最佳捕鱼策略
     * 就像经验丰富的船长根据当前海况给出最佳捕鱼建议
     * @returns 捕鱼策略推荐结果
     */
    recommendStrategy() {
        // 如果没有最新的市场分析，先进行分析
        if (!this.latestMarketAnalysis) {
            this.analyzeMarketState();
        }
        const marketAnalysis = this.latestMarketAnalysis || this.analyzeMarketState();
        // 为每个策略评分，考虑市场状态匹配度和历史表现
        const strategyScores = new Map();
        for (const [id, strategy] of this.strategies) {
            let score = 0;
            // 考虑市场状态偏好匹配度
            if (strategy.marketStatePreference.includes(marketAnalysis.currentState)) {
                score += 2; // 市场状态匹配加2分
            }
            // 考虑市场波动性与策略风险水平的匹配度
            const volatilityMatch = 5 - Math.abs((marketAnalysis.volatility * 5) - strategy.riskLevel);
            score += volatilityMatch;
            // 考虑历史表现
            const performance = this.performanceRecords.get(id);
            if (performance) {
                score += performance.successRate * 3; // 成功率权重为3
                score += (performance.avgROI / 5) * 2; // 平均回报率权重为2
                score += performance.winLossRatio; // 盈亏比权重为1
            }
            strategyScores.set(id, score);
        }
        // 找出得分最高的策略
        let highestScore = -1;
        let recommendedStrategyId = '';
        for (const [id, score] of strategyScores) {
            if (score > highestScore) {
                highestScore = score;
                recommendedStrategyId = id;
            }
        }
        const recommendedStrategy = this.strategies.get(recommendedStrategyId);
        if (!recommendedStrategy) {
            // 如果找不到推荐的策略，使用默认的平衡型策略
            const defaultStrategy = this.strategies.get('balanced') || Array.from(this.strategies.values())[0];
            if (!defaultStrategy) {
                throw new Error('没有可用的捕鱼策略');
            }
            return {
                recommendedStrategy: defaultStrategy,
                confidence: 0.5,
                reasons: ['使用默认平衡型捕鱼策略'],
                alternativeStrategies: [],
                timestamp: Date.now()
            };
        }
        // 生成推荐原因
        const reasons = [];
        if (recommendedStrategy.marketStatePreference.includes(marketAnalysis.currentState)) {
            reasons.push(`此渔法特别适合当前的${marketAnalysis.currentState}海况`);
        }
        const performance = this.performanceRecords.get(recommendedStrategyId);
        if (performance) {
            reasons.push(`历史成功率${(performance.successRate * 100).toFixed(1)}%，平均收益率${performance.avgROI.toFixed(1)}%`);
        }
        if (Math.abs(recommendedStrategy.riskLevel - (marketAnalysis.volatility * 5)) < 1) {
            reasons.push(`该渔法的风险等级(${recommendedStrategy.riskLevel})与当前海况波动性非常匹配`);
        }
        // 找出得分第二和第三的策略作为备选
        const alternativeStrategies = [];
        const sortedEntries = Array.from(strategyScores.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(1, 3); // 取排序后的第二和第三名
        for (const [id, _] of sortedEntries) {
            const strategy = this.strategies.get(id);
            if (strategy) {
                alternativeStrategies.push(strategy);
            }
        }
        // 计算推荐信心度
        // 如果最高分远高于其他策略，则信心度高
        let maxScore = -1;
        let secondMaxScore = -1;
        for (const score of strategyScores.values()) {
            if (score > maxScore) {
                secondMaxScore = maxScore;
                maxScore = score;
            }
            else if (score > secondMaxScore) {
                secondMaxScore = score;
            }
        }
        // 信心度计算：最高分与第二高分的差距占最高分的比例
        const confidence = secondMaxScore === -1 ? 1 : Math.min(1, (maxScore - secondMaxScore) / maxScore);
        // 生成策略推荐结果
        const recommendation = {
            recommendedStrategy,
            confidence,
            reasons,
            alternativeStrategies,
            timestamp: Date.now()
        };
        logger_1.default.info(MODULE_NAME, `推荐捕鱼策略: ${recommendedStrategy.name}, 信心度: ${(confidence * 100).toFixed(1)}%`);
        return recommendation;
    }
    /**
     * 应用推荐的捕鱼策略
     * 就像根据船长的建议，准备相应的渔具和设定捕捞参数
     * @returns 是否成功应用新策略
     */
    applyRecommendedStrategy() {
        var _a;
        const recommendation = this.recommendStrategy();
        // 只有当推荐信心度较高时才应用新策略
        if (recommendation.confidence < 0.5) {
            logger_1.default.warn(MODULE_NAME, `策略推荐信心度过低(${(recommendation.confidence * 100).toFixed(1)}%)，维持当前策略`);
            return false;
        }
        // 如果推荐的策略与当前策略相同，不需要更改
        if (((_a = this.activeStrategy) === null || _a === void 0 ? void 0 : _a.id) === recommendation.recommendedStrategy.id) {
            logger_1.default.info(MODULE_NAME, `保持当前捕鱼策略: ${this.activeStrategy.name}`);
            return true;
        }
        // 更新激活状态
        if (this.activeStrategy) {
            const currentStrategy = this.strategies.get(this.activeStrategy.id);
            if (currentStrategy) {
                currentStrategy.active = false;
            }
        }
        const newActiveStrategy = this.strategies.get(recommendation.recommendedStrategy.id);
        if (newActiveStrategy) {
            newActiveStrategy.active = true;
            this.activeStrategy = newActiveStrategy;
            logger_1.default.info(MODULE_NAME, `已切换至新捕鱼策略: ${newActiveStrategy.name}`);
            logger_1.default.info(MODULE_NAME, `原因: ${recommendation.reasons.join(', ')}`);
            return true;
        }
        return false;
    }
    /**
     * 自动选择最佳捕鱼策略
     * 定期根据海况自动调整渔法，就像资深船长不断观察海况并调整作业方式
     * @param autoInterval 自动调整的时间间隔(毫秒)
     */
    enableAutoStrategySelection(autoInterval = 60 * 60 * 1000) {
        // 设置定时器，定期检查市场状态并调整策略
        setInterval(() => {
            logger_1.default.debug(MODULE_NAME, '执行定期捕鱼策略评估');
            this.applyRecommendedStrategy();
        }, autoInterval);
        logger_1.default.info(MODULE_NAME, `已启用自动捕鱼策略选择，间隔: ${autoInterval / 1000 / 60} 分钟`);
    }
    /**
     * 获取当前使用的捕鱼策略
     * 查看当前渔船正在使用的渔具和捕捞方式
     * @returns 当前活跃的策略配置
     */
    getActiveStrategy() {
        if (!this.activeStrategy) {
            // 如果没有活跃策略，使用默认的平衡型策略
            this.activeStrategy = this.strategies.get('balanced') ||
                Array.from(this.strategies.values())[0];
        }
        return this.activeStrategy;
    }
    /**
     * 获取所有可用的捕鱼策略
     * 查看渔船上所有准备好的渔具和捕捞方法
     * @returns 所有策略的列表
     */
    getAllStrategies() {
        return Array.from(this.strategies.values());
    }
    /**
     * 获取特定ID的捕鱼策略
     * 找出特定名称的渔具或捕捞方法
     * @param id 策略ID
     * @returns 找到的策略，如果不存在则返回null
     */
    getStrategyById(id) {
        return this.strategies.get(id) || null;
    }
    /**
     * 添加自定义捕鱼策略
     * 在渔船上添加新研发的捕鱼技术或工具
     * @param strategy 新的策略配置
     * @returns 是否成功添加
     */
    addCustomStrategy(strategy) {
        // 检查ID是否已存在
        if (this.strategies.has(strategy.id)) {
            logger_1.default.warn(MODULE_NAME, `无法添加已存在的捕鱼策略ID: ${strategy.id}`);
            return false;
        }
        // 添加新策略
        this.strategies.set(strategy.id, strategy);
        // 创建初始绩效记录
        const initialPerformance = {
            strategyId: strategy.id,
            successRate: 0.5, // 默认成功率为50%
            avgROI: 1.0, // 默认平均回报率为1%
            avgHoldingTime: 3600, // 默认平均持有时间1小时
            winLossRatio: 1.0, // 默认盈亏比1.0
            totalTrades: 0, // 初始无交易记录
            profitableTrades: 0,
            timestamp: Date.now()
        };
        this.performanceRecords.set(strategy.id, initialPerformance);
        logger_1.default.info(MODULE_NAME, `已添加新的捕鱼策略: ${strategy.name}`);
        return true;
    }
    /**
     * 更新策略绩效数据
     * 记录每次捕捞的成效，更新渔法的历史表现数据
     * @param strategyId 策略ID
     * @param successful 是否成功获利
     * @param roi 获得的回报率(%)
     * @param holdingTimeSeconds 持有时间(秒)
     */
    updatePerformanceData(strategyId, successful, roi, holdingTimeSeconds) {
        const performanceRecord = this.performanceRecords.get(strategyId);
        if (!performanceRecord) {
            logger_1.default.warn(MODULE_NAME, `找不到策略ID的绩效记录: ${strategyId}`);
            return;
        }
        // 更新交易次数
        performanceRecord.totalTrades += 1;
        // 更新盈利交易次数
        if (successful) {
            performanceRecord.profitableTrades += 1;
        }
        // 更新成功率
        performanceRecord.successRate = performanceRecord.profitableTrades / performanceRecord.totalTrades;
        // 更新平均ROI (移动平均)
        const weight = 1 / performanceRecord.totalTrades;
        performanceRecord.avgROI = (performanceRecord.avgROI * (1 - weight)) + (roi * weight);
        // 更新平均持有时间 (移动平均)
        performanceRecord.avgHoldingTime = (performanceRecord.avgHoldingTime * (1 - weight))
            + (holdingTimeSeconds * weight);
        // 更新盈亏比
        // 注意：这是一个简化计算，实际应该累计所有盈利和亏损
        if (roi > 0) {
            const averageWin = (performanceRecord.winLossRatio * performanceRecord.avgROI)
                * (performanceRecord.profitableTrades - 1) / performanceRecord.profitableTrades;
            performanceRecord.winLossRatio = (averageWin + roi) / performanceRecord.avgROI;
        }
        // 更新时间戳
        performanceRecord.timestamp = Date.now();
        logger_1.default.debug(MODULE_NAME, `已更新策略绩效数据: ${strategyId}, 成功率: ${(performanceRecord.successRate * 100).toFixed(1)}%, 平均回报: ${performanceRecord.avgROI.toFixed(2)}%`);
    }
    /**
     * 判断是否应该下网捕捞(买入)
     * 根据当前捕鱼策略评估发现的鱼群是否值得捕捞
     * @param opportunity 发现的交易机会(鱼群)
     * @returns 是否应该买入的决策
     */
    shouldBuy(opportunity) {
        var _a, _b;
        const activeStrategy = this.getActiveStrategy();
        // 检查机会的可信度是否达到策略要求
        if (opportunity.confidence < activeStrategy.buyConditions.minConfidence) {
            logger_1.default.debug(MODULE_NAME, `鱼群密度估计不足 (可信度: ${opportunity.confidence.toFixed(2)}, 要求: ${activeStrategy.buyConditions.minConfidence.toFixed(2)})`);
            return false;
        }
        // 检查滑点是否在可接受范围内
        if (opportunity.estimatedSlippage !== undefined && opportunity.estimatedSlippage > activeStrategy.buyConditions.maxSlippage) {
            logger_1.default.debug(MODULE_NAME, `预计网具损耗过大 (滑点: ${((_a = opportunity.estimatedSlippage) === null || _a === void 0 ? void 0 : _a.toFixed(2)) || 'unknown'}%, 最大接受: ${activeStrategy.buyConditions.maxSlippage.toFixed(2)}%)`);
            return false;
        }
        // 检查优先级是否达到策略要求
        if (opportunity.priority < activeStrategy.buyConditions.priorityThreshold) {
            logger_1.default.debug(MODULE_NAME, `鱼群价值评估不足 (优先级: ${opportunity.priority.toFixed(2)}, 要求: ${activeStrategy.buyConditions.priorityThreshold.toFixed(2)})`);
            return false;
        }
        // 如果所有条件都满足，则推荐买入
        logger_1.default.info(MODULE_NAME, `发现值得捕捞的鱼群! 代币: ${opportunity.tokenSymbol}, 预计收益: ${((_b = opportunity.estimatedProfit) === null || _b === void 0 ? void 0 : _b.toFixed(2)) || 'unknown'}%, 策略: ${activeStrategy.name}`);
        return true;
    }
    /**
     * 判断是否应该收网(卖出)
     * 根据当前捕鱼策略和持仓状况，决定是否该收网返航
     * @param position 当前持仓(已捕获的鱼)
     * @returns 是否应该卖出的决策和原因
     */
    shouldSell(position) {
        var _a, _b;
        const activeStrategy = this.getActiveStrategy();
        // 检查各种卖出条件
        for (const condition of activeStrategy.sellConditions) {
            if (!condition.enabled)
                continue;
            switch (condition.type) {
                case types_1.StrategyType.TAKE_PROFIT: {
                    // 检查是否达到目标利润
                    const takeProfitPercentage = condition.percentage || 0;
                    if (position.currentProfitPercentage !== undefined && position.currentProfitPercentage >= takeProfitPercentage) {
                        return {
                            sell: true,
                            reason: `达到目标收益 (${((_a = position.currentProfitPercentage) === null || _a === void 0 ? void 0 : _a.toFixed(2)) || 'unknown'}% >= ${takeProfitPercentage.toFixed(2)}%)`
                        };
                    }
                    break;
                }
                case types_1.StrategyType.STOP_LOSS: {
                    // 检查是否触发止损
                    const stopLossPercentage = condition.percentage || 0;
                    if (position.currentProfitPercentage !== undefined && position.currentProfitPercentage <= -stopLossPercentage) {
                        return {
                            sell: true,
                            reason: `触发安全警报 (${((_b = position.currentProfitPercentage) === null || _b === void 0 ? void 0 : _b.toFixed(2)) || 'unknown'}% <= -${stopLossPercentage.toFixed(2)}%)`
                        };
                    }
                    break;
                }
                case types_1.StrategyType.TIME_LIMIT: {
                    // 检查是否超过持有时间限制
                    const timeLimit = condition.timeSeconds || 0;
                    const holdingTime = (Date.now() - position.entryTimestamp) / 1000; // 转换为秒
                    if (holdingTime >= timeLimit) {
                        return {
                            sell: true,
                            reason: `达到预定作业时间 (${Math.floor(holdingTime / 60)} 分钟 >= ${Math.floor(timeLimit / 60)} 分钟)`
                        };
                    }
                    break;
                }
            }
        }
        // 如果没有触发任何卖出条件，则继续持有
        return { sell: false, reason: '继续监测中，暂未达到收网条件' };
    }
}
exports.AdaptiveStrategyFramework = AdaptiveStrategyFramework;
// 导出自适应策略框架的单例实例
exports.adaptiveStrategyFramework = new AdaptiveStrategyFramework();
