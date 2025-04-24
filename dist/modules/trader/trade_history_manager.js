"use strict";
/**
 * 交易历史管理器
 * 用于保存和查询交易历史记录
 *
 * 【比喻解释】
 * 这就像渔船的捕捞日志系统：
 * - 记录每次出海的渔获情况（交易记录）
 * - 可以查询历史渔获记录（历史交易）
 * - 支持按各种条件筛选渔获记录（过滤查询）
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradeHistoryManager = void 0;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const logger_1 = __importDefault(require("../../core/logger"));
// 模块名称常量
const MODULE_NAME = 'TradeHistoryManager';
/**
 * 交易历史管理器类
 * 管理系统的交易历史记录
 */
class TradeHistoryManager {
    /**
     * 构造函数
     * @param dataPath 数据存储路径
     */
    constructor(dataPath = './data/trades') {
        this.trades = [];
        this.isLoaded = false;
        this.dataPath = dataPath;
        this.loadTrades().catch(error => {
            logger_1.default.error('加载交易历史失败', MODULE_NAME, {
                error: error instanceof Error ? error.message : String(error)
            });
        });
    }
    /**
     * 加载交易历史
     * 从文件系统加载保存的交易记录
     */
    async loadTrades() {
        try {
            // 确保数据目录存在
            await promises_1.default.mkdir(this.dataPath, { recursive: true });
            // 尝试读取交易历史文件
            const filePath = node_path_1.default.join(this.dataPath, 'trade_history.json');
            try {
                const data = await promises_1.default.readFile(filePath, 'utf8');
                this.trades = JSON.parse(data);
                logger_1.default.info(`已加载${this.trades.length}条交易记录`, MODULE_NAME);
            }
            catch (error) {
                // 如果文件不存在或格式不正确，初始化为空数组
                if (error.code === 'ENOENT') {
                    logger_1.default.info('交易历史文件不存在，初始化为空记录', MODULE_NAME);
                    this.trades = [];
                }
                else {
                    throw error;
                }
            }
            this.isLoaded = true;
        }
        catch (error) {
            logger_1.default.error('加载交易历史时出错', MODULE_NAME, {
                error: error instanceof Error ? error.message : String(error)
            });
            this.trades = [];
            throw error;
        }
    }
    /**
     * 保存交易历史
     * 将当前的交易记录保存到文件系统
     */
    async saveTrades() {
        try {
            const filePath = node_path_1.default.join(this.dataPath, 'trade_history.json');
            await promises_1.default.writeFile(filePath, JSON.stringify(this.trades, null, 2), 'utf8');
            logger_1.default.debug(`已保存${this.trades.length}条交易记录`, MODULE_NAME);
        }
        catch (error) {
            logger_1.default.error('保存交易历史时出错', MODULE_NAME, {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    /**
     * 添加交易记录
     * @param trade 交易记录对象
     */
    async addTrade(trade) {
        // 确保数据已加载
        if (!this.isLoaded) {
            await this.loadTrades();
        }
        this.trades.push(trade);
        await this.saveTrades();
        logger_1.default.info(`已添加新交易记录: ${trade.id}`, MODULE_NAME, {
            type: trade.type,
            token: trade.tokenSymbol,
            amount: trade.amount,
            value: trade.value
        });
    }
    /**
     * 更新交易记录
     * @param tradeId 交易ID
     * @param updates 要更新的字段
     */
    async updateTrade(tradeId, updates) {
        // 确保数据已加载
        if (!this.isLoaded) {
            await this.loadTrades();
        }
        const index = this.trades.findIndex(t => t.id === tradeId);
        if (index === -1) {
            logger_1.default.warn(`更新交易记录失败: 找不到ID为${tradeId}的交易`, MODULE_NAME);
            return false;
        }
        // 合并更新
        this.trades[index] = { ...this.trades[index], ...updates };
        await this.saveTrades();
        logger_1.default.info(`已更新交易记录: ${tradeId}`, MODULE_NAME, {
            updates: Object.keys(updates)
        });
        return true;
    }
    /**
     * 获取所有交易记录
     * @returns 所有交易记录数组
     */
    async getAllTrades() {
        // 确保数据已加载
        if (!this.isLoaded) {
            await this.loadTrades();
        }
        // 按时间戳降序排序，最新的交易排在前面
        return [...this.trades].sort((a, b) => b.timestamp - a.timestamp);
    }
    /**
     * 获取指定代币的交易记录
     * @param tokenAddress 代币地址
     * @returns 该代币的交易记录数组
     */
    async getTradesByToken(tokenAddress) {
        // 确保数据已加载
        if (!this.isLoaded) {
            await this.loadTrades();
        }
        return this.trades
            .filter(trade => trade.tokenAddress === tokenAddress)
            .sort((a, b) => b.timestamp - a.timestamp);
    }
    /**
     * 获取指定类型的交易记录
     * @param type 交易类型
     * @returns 指定类型的交易记录数组
     */
    async getTradesByType(type) {
        // 确保数据已加载
        if (!this.isLoaded) {
            await this.loadTrades();
        }
        return this.trades
            .filter(trade => trade.type === type)
            .sort((a, b) => b.timestamp - a.timestamp);
    }
    /**
     * 获取指定时间范围内的交易记录
     * @param startTime 开始时间戳
     * @param endTime 结束时间戳
     * @returns 时间范围内的交易记录数组
     */
    async getTradesByTimeRange(startTime, endTime) {
        // 确保数据已加载
        if (!this.isLoaded) {
            await this.loadTrades();
        }
        return this.trades
            .filter(trade => trade.timestamp >= startTime && trade.timestamp <= endTime)
            .sort((a, b) => b.timestamp - a.timestamp);
    }
    /**
     * 获取交易统计信息
     * @returns 交易统计数据
     */
    async getTradeStats() {
        // 确保数据已加载
        if (!this.isLoaded) {
            await this.loadTrades();
        }
        const buyTrades = this.trades.filter(t => t.type === 'buy').length;
        const sellTrades = this.trades.filter(t => t.type === 'sell').length;
        const successfulTrades = this.trades.filter(t => t.status === 'completed').length;
        const failedTrades = this.trades.filter(t => t.status === 'failed').length;
        const pendingTrades = this.trades.filter(t => t.status === 'pending').length;
        const totalProfit = this.trades
            .filter(t => t.type === 'sell' && t.profit !== undefined)
            .reduce((sum, t) => sum + (t.profit || 0), 0);
        const totalFees = this.trades
            .filter(t => t.fee !== undefined)
            .reduce((sum, t) => sum + (t.fee || 0), 0);
        return {
            totalTrades: this.trades.length,
            buyTrades,
            sellTrades,
            successfulTrades,
            failedTrades,
            pendingTrades,
            totalProfit,
            totalFees
        };
    }
}
exports.TradeHistoryManager = TradeHistoryManager;
