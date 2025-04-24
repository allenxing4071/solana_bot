"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTradeHistory = void 0;
const logger_1 = __importDefault(require("../../core/logger"));
const trade_history_manager_1 = require("../../modules/trader/trade_history_manager");
// 模块名称常量
const MODULE_NAME = 'TradeController';
// 创建交易历史管理器实例
const tradeHistoryManager = new trade_history_manager_1.TradeHistoryManager();
/**
 * 获取交易历史记录
 * @param req 请求对象
 * @param res 响应对象
 */
const getTradeHistory = async (req, res) => {
    try {
        // 获取分页和搜索参数
        const page = Number.parseInt(req.query.page) || 1;
        const limit = Number.parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        const status = req.query.status || 'all';
        const type = req.query.type || 'all';
        // 获取所有交易
        let trades = await tradeHistoryManager.getAllTrades();
        // 应用搜索过滤
        if (search) {
            trades = trades.filter(trade => {
                var _a, _b;
                return ((_a = trade.tokenSymbol) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(search.toLowerCase())) ||
                    trade.id.toLowerCase().includes(search.toLowerCase()) ||
                    ((_b = trade.txid) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(search.toLowerCase()));
            });
        }
        // 按状态过滤
        if (status !== 'all') {
            trades = trades.filter(trade => trade.status === status);
        }
        // 按类型过滤
        if (type !== 'all') {
            trades = trades.filter(trade => trade.type === type);
        }
        // 计算总数据量和总页数
        const totalItems = trades.length;
        const totalPages = Math.ceil(totalItems / limit);
        // 分页处理
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedTrades = trades.slice(startIndex, endIndex);
        res.status(200).json({
            success: true,
            count: totalItems,
            page,
            totalPages,
            limit,
            data: paginatedTrades
        });
    }
    catch (error) {
        logger_1.default.error('获取交易历史记录失败', MODULE_NAME, {
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            success: false,
            error: '获取交易历史记录失败'
        });
    }
};
exports.getTradeHistory = getTradeHistory;
