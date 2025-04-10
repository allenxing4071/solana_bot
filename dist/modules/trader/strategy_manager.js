"use strict";
/**
 * 交易策略管理器
 * 负责管理交易策略，决定何时买入和卖出，跟踪持仓状态
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StrategyManager = void 0;
const logger_1 = __importDefault(require("../../core/logger"));
const types_1 = require("../../core/types");
const config_1 = __importDefault(require("../../core/config"));
const MODULE_NAME = 'StrategyManager';
/**
 * 交易策略管理器类
 * 负责管理交易策略和持仓状态
 */
class StrategyManager {
    /**
     * 构造函数
     */
    constructor() {
        // 持仓列表 - 键为代币Mint地址
        this.positions = new Map();
        // 策略条件
        this.sellConditions = [];
        // 价格历史 - 键为代币Mint地址
        this.priceHistory = new Map();
        // 追踪止损的最高价格 - 键为代币Mint地址
        this.highestPrices = new Map();
        // 从配置中加载策略条件
        this.loadStrategies();
        logger_1.default.info('交易策略管理器初始化完成', MODULE_NAME);
    }
    /**
     * 从配置中加载策略
     */
    loadStrategies() {
        this.sellConditions = config_1.default.trading.sellStrategy.conditions;
        // 确保至少有一个默认的止盈策略
        if (!this.sellConditions.length) {
            // 添加默认策略
            this.sellConditions.push({
                type: types_1.StrategyType.TAKE_PROFIT,
                percentage: 20, // 20%止盈
                enabled: true
            });
            this.sellConditions.push({
                type: types_1.StrategyType.STOP_LOSS,
                percentage: 10, // 10%止损
                enabled: true
            });
        }
        logger_1.default.info(`已加载 ${this.sellConditions.length} 个交易策略条件`, MODULE_NAME, {
            strategies: this.sellConditions.map(s => `${s.type}:${s.enabled ? '启用' : '禁用'}`)
        });
    }
    /**
     * 是否应该买入
     * @param opportunity 交易机会
     * @returns 是否应该买入
     */
    shouldBuy(opportunity) {
        // 如果禁用了买入策略
        if (!config_1.default.trading.buyStrategy.enabled) {
            return false;
        }
        // 获取目标代币的mint地址字符串
        const mintAddress = opportunity.targetToken.mint.toBase58();
        // 检查是否已持有该代币
        if (this.positions.has(mintAddress)) {
            logger_1.default.debug('跳过买入: 已持有该代币', MODULE_NAME, {
                token: opportunity.targetToken.symbol || mintAddress
            });
            return false;
        }
        // 检查优先级分数
        if (opportunity.priorityScore < 0.5) {
            logger_1.default.debug('跳过买入: 优先级分数过低', MODULE_NAME, {
                token: opportunity.targetToken.symbol || mintAddress,
                score: opportunity.priorityScore
            });
            return false;
        }
        // 检查信心分数
        if (opportunity.confidence < config_1.default.trading.buyStrategy.minConfidence) {
            logger_1.default.debug('跳过买入: 信心分数过低', MODULE_NAME, {
                token: opportunity.targetToken.symbol || mintAddress,
                confidence: opportunity.confidence
            });
            return false;
        }
        // 通过所有检查
        return true;
    }
    /**
     * 处理买入交易结果
     * @param tradeResult 交易结果
     * @param opportunity 交易机会
     * @returns 新建的持仓或null
     */
    handleBuyResult(tradeResult, opportunity) {
        if (!tradeResult.success || !opportunity.targetToken) {
            return null;
        }
        // 计算买入价格
        const buyPrice = opportunity.estimatedPriceUsd || 0;
        // 添加新持仓
        const position = this.addPosition(opportunity.targetToken, tradeResult.tokenAmount || BigInt(0), buyPrice, tradeResult);
        logger_1.default.info(`添加新持仓: ${opportunity.targetToken.symbol || opportunity.targetToken.mint.toBase58()}`, MODULE_NAME, {
            amount: position.amount.toString(),
            buyPrice,
            txid: tradeResult.txid
        });
        return position;
    }
    /**
     * 检查是否应该卖出代币
     * @param mint 代币Mint地址
     * @param currentPrice 当前价格
     * @returns 卖出决策结果
     */
    shouldSell(mint, currentPrice) {
        // 将mint统一为字符串
        const mintString = typeof mint === 'string' ? mint : mint.toBase58();
        // 获取持仓
        const position = this.getPosition(mintString);
        if (!position) {
            return {
                shouldSell: false,
                reason: '未找到持仓'
            };
        }
        // 更新最高价格(用于追踪止损)
        this.updateHighestPrice(mintString, currentPrice);
        // 更新持仓的当前价格
        position.currentPrice = currentPrice;
        // 计算盈亏
        const profit = this.calculateProfit(position, currentPrice);
        position.profitLoss = profit.profit;
        position.profitLossPercentage = profit.percentage;
        // 更新持仓
        this.updatePosition(position);
        // 记录价格更新
        this.recordPriceUpdate({
            mint: position.token.mint,
            price: currentPrice,
            timestamp: Date.now()
        });
        // 检查所有卖出条件
        for (const condition of this.sellConditions) {
            // 跳过未启用的条件
            if (!condition.enabled) {
                continue;
            }
            switch (condition.type) {
                case types_1.StrategyType.TAKE_PROFIT:
                    if (this.checkTakeProfit(position, condition)) {
                        return {
                            shouldSell: true,
                            reason: `达到止盈条件: ${profit.percentage.toFixed(2)}% > ${condition.percentage}%`,
                            triggerType: types_1.StrategyType.TAKE_PROFIT,
                            position,
                            sellPrice: currentPrice,
                            profit: profit.profit,
                            profitPercentage: profit.percentage
                        };
                    }
                    break;
                case types_1.StrategyType.STOP_LOSS:
                    if (this.checkStopLoss(position, condition)) {
                        return {
                            shouldSell: true,
                            reason: `达到止损条件: ${profit.percentage.toFixed(2)}% < -${condition.percentage}%`,
                            triggerType: types_1.StrategyType.STOP_LOSS,
                            position,
                            sellPrice: currentPrice,
                            profit: profit.profit,
                            profitPercentage: profit.percentage
                        };
                    }
                    break;
                case types_1.StrategyType.TRAILING_STOP:
                    if (this.checkTrailingStop(position, condition, mintString)) {
                        return {
                            shouldSell: true,
                            reason: `达到追踪止损条件: 从最高点下跌 ${condition.percentage}%`,
                            triggerType: types_1.StrategyType.TRAILING_STOP,
                            position,
                            sellPrice: currentPrice,
                            profit: profit.profit,
                            profitPercentage: profit.percentage
                        };
                    }
                    break;
                case types_1.StrategyType.TIME_LIMIT:
                    if (this.checkTimeLimit(position, condition)) {
                        return {
                            shouldSell: true,
                            reason: `达到时间限制: 持有超过 ${condition.timeSeconds} 秒`,
                            triggerType: types_1.StrategyType.TIME_LIMIT,
                            position,
                            sellPrice: currentPrice,
                            profit: profit.profit,
                            profitPercentage: profit.percentage
                        };
                    }
                    break;
            }
        }
        // 所有条件都未触发
        return {
            shouldSell: false,
            reason: '未满足任何卖出条件',
            position,
            sellPrice: currentPrice,
            profit: profit.profit,
            profitPercentage: profit.percentage
        };
    }
    /**
     * 处理卖出交易结果
     * @param tradeResult 交易结果
     * @param position 持仓
     * @returns 是否成功处理
     */
    handleSellResult(tradeResult, position) {
        if (!tradeResult.success) {
            return false;
        }
        // 获取代币Mint地址
        const mintString = position.token.mint.toBase58();
        // 更新最后的持仓信息
        position.currentPrice = tradeResult.price;
        position.lastUpdated = Date.now();
        // 计算最终盈亏
        const profit = this.calculateProfit(position, tradeResult.price || 0);
        // 清除相关数据
        this.highestPrices.delete(mintString);
        this.priceHistory.delete(mintString);
        // 移除持仓
        const removed = this.removePosition(mintString);
        logger_1.default.info(`卖出持仓: ${position.token.symbol || mintString}`, MODULE_NAME, {
            amount: position.amount.toString(),
            buyPrice: position.avgBuyPrice,
            sellPrice: tradeResult.price,
            profit: profit.profit,
            profitPercentage: profit.percentage,
            txid: tradeResult.txid
        });
        return removed;
    }
    /**
     * 检查止盈条件
     * @param position 持仓
     * @param condition 策略条件
     * @returns 是否满足条件
     */
    checkTakeProfit(position, condition) {
        if (!position.avgBuyPrice || !position.currentPrice || !condition.percentage) {
            return false;
        }
        // 计算利润百分比
        const profitPercentage = ((position.currentPrice - position.avgBuyPrice) / position.avgBuyPrice) * 100;
        // 检查是否达到止盈条件
        return profitPercentage >= condition.percentage;
    }
    /**
     * 检查止损条件
     * @param position 持仓
     * @param condition 策略条件
     * @returns 是否满足条件
     */
    checkStopLoss(position, condition) {
        if (!position.avgBuyPrice || !position.currentPrice || !condition.percentage) {
            return false;
        }
        // 计算亏损百分比
        const lossPercentage = ((position.avgBuyPrice - position.currentPrice) / position.avgBuyPrice) * 100;
        // 检查是否达到止损条件
        return lossPercentage >= condition.percentage;
    }
    /**
     * 检查追踪止损条件
     * @param position 持仓
     * @param condition 策略条件
     * @param mintString 代币Mint地址
     * @returns 是否满足条件
     */
    checkTrailingStop(position, condition, mintString) {
        if (!position.currentPrice || !condition.percentage) {
            return false;
        }
        // 获取最高价格
        const highestPrice = this.highestPrices.get(mintString) || position.avgBuyPrice || 0;
        if (highestPrice <= 0) {
            return false;
        }
        // 计算从最高点下跌的百分比
        const dropPercentage = ((highestPrice - position.currentPrice) / highestPrice) * 100;
        // 检查是否达到追踪止损条件
        return dropPercentage >= condition.percentage;
    }
    /**
     * 检查时间限制条件
     * @param position 持仓
     * @param condition 策略条件
     * @returns 是否满足条件
     */
    checkTimeLimit(position, condition) {
        if (!condition.timeSeconds) {
            return false;
        }
        // 计算持有时间(秒)
        const holdingTimeSeconds = (Date.now() - position.lastUpdated) / 1000;
        // 检查是否达到时间限制
        return holdingTimeSeconds >= condition.timeSeconds;
    }
    /**
     * 更新最高价格记录
     * @param mintString 代币Mint地址
     * @param currentPrice 当前价格
     */
    updateHighestPrice(mintString, currentPrice) {
        const highestPrice = this.highestPrices.get(mintString) || 0;
        if (currentPrice > highestPrice) {
            this.highestPrices.set(mintString, currentPrice);
        }
    }
    /**
     * 记录价格更新
     * @param update 价格更新数据
     */
    recordPriceUpdate(update) {
        const mintString = update.mint.toBase58();
        // 获取该代币的价格历史
        let history = this.priceHistory.get(mintString);
        if (!history) {
            history = [];
            this.priceHistory.set(mintString, history);
        }
        // 添加新的价格更新
        history.push(update);
        // 仅保留最近100条记录
        if (history.length > 100) {
            history.shift();
        }
    }
    /**
     * 计算利润
     * @param position 持仓
     * @param currentPrice 当前价格
     * @returns 利润信息
     */
    calculateProfit(position, currentPrice) {
        // 确保有买入价格
        if (!position.avgBuyPrice) {
            return { profit: 0, percentage: 0 };
        }
        // 将bigint转换为number计算
        const amount = Number(position.amount) / (10 ** (position.token.decimals || 0));
        // 计算利润
        const profit = (currentPrice - position.avgBuyPrice) * amount;
        // 计算百分比
        const percentage = ((currentPrice / position.avgBuyPrice) - 1) * 100;
        return { profit, percentage };
    }
    // ---- PositionManager接口实现 ----
    /**
     * 添加新持仓
     * @param token 代币信息
     * @param amount 数量
     * @param buyPrice 买入价格
     * @param txInfo 交易信息
     * @returns 新持仓
     */
    addPosition(token, amount, buyPrice, txInfo) {
        const mintString = token.mint.toBase58();
        // 创建新持仓
        const position = {
            token,
            amount,
            avgBuyPrice: buyPrice,
            costBasis: Number(amount) * buyPrice,
            currentPrice: buyPrice,
            profitLoss: 0,
            profitLossPercentage: 0,
            lastUpdated: Date.now()
        };
        // 保存持仓
        this.positions.set(mintString, position);
        // 初始化最高价格
        this.highestPrices.set(mintString, buyPrice);
        return position;
    }
    /**
     * 获取持仓
     * @param mintAddress 代币Mint地址
     * @returns 持仓或null
     */
    getPosition(mintAddress) {
        const mintString = typeof mintAddress === 'string' ? mintAddress : mintAddress.toBase58();
        return this.positions.get(mintString) || null;
    }
    /**
     * 更新持仓
     * @param position 持仓
     */
    updatePosition(position) {
        const mintString = position.token.mint.toBase58();
        this.positions.set(mintString, position);
    }
    /**
     * 移除持仓
     * @param mintAddress 代币Mint地址
     * @returns 是否成功移除
     */
    removePosition(mintAddress) {
        const mintString = typeof mintAddress === 'string' ? mintAddress : mintAddress.toBase58();
        return this.positions.delete(mintString);
    }
    /**
     * 获取所有持仓
     * @returns 持仓列表
     */
    getAllPositions() {
        return Array.from(this.positions.values());
    }
}
exports.StrategyManager = StrategyManager;
// 导出单例实例
const strategyManager = new StrategyManager();
exports.default = strategyManager;
//# sourceMappingURL=strategy_manager.js.map