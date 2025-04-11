"use strict";
/**
 * 交易控制器
 * 处理与交易相关的所有请求
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentTransactions = exports.getTransactionById = exports.getTransactions = void 0;
const logger_1 = __importDefault(require("../../core/logger"));
// 模块名称
const MODULE_NAME = 'TransactionController';
// 模拟交易数据存储
const mockTransactions = [
    {
        id: 'Tx5g3e4f2',
        pair: 'SOL/USDC',
        amount: '12.5',
        profit: '0.0082',
        time: '10:45:32',
        status: 'success',
        timestamp: Date.now() - 3600000,
        txDetails: {
            signature: 'Tx5g3e4f2abcd1234567890',
            blockTime: Date.now() - 3600000,
            blockExplorerUrl: 'https://solscan.io/tx/Tx5g3e4f2abcd1234567890',
            fee: '0.000005',
            type: 'swap',
            route: 'Orca',
            inputToken: 'SOL',
            outputToken: 'USDC',
            inputAmount: '12.5',
            outputAmount: '275.32',
            slippage: '0.1%'
        }
    },
    {
        id: 'Txc7ba3d1',
        pair: 'JUP/SOL',
        amount: '55.2',
        profit: '0.0045',
        time: '10:42:18',
        status: 'success',
        timestamp: Date.now() - 4800000,
        txDetails: {
            signature: 'Txc7ba3d1efgh5678901234',
            blockTime: Date.now() - 4800000,
            blockExplorerUrl: 'https://solscan.io/tx/Txc7ba3d1efgh5678901234',
            fee: '0.000005',
            type: 'swap',
            route: 'Jupiter',
            inputToken: 'JUP',
            outputToken: 'SOL',
            inputAmount: '55.2',
            outputAmount: '0.148',
            slippage: '0.15%'
        }
    },
    {
        id: 'Txf4eb9c2',
        pair: 'BONK/SOL',
        amount: '1250000',
        profit: '0.0037',
        time: '10:38:05',
        status: 'success',
        timestamp: Date.now() - 6000000,
        txDetails: {
            signature: 'Txf4eb9c2ijkl9012345678',
            blockTime: Date.now() - 6000000,
            blockExplorerUrl: 'https://solscan.io/tx/Txf4eb9c2ijkl9012345678',
            fee: '0.000005',
            type: 'swap',
            route: 'Raydium',
            inputToken: 'BONK',
            outputToken: 'SOL',
            inputAmount: '1250000',
            outputAmount: '0.092',
            slippage: '0.2%'
        }
    },
    {
        id: 'Tx2a1d8e5',
        pair: 'RAY/SOL',
        amount: '84.3',
        profit: '0.0028',
        time: '10:35:57',
        status: 'pending',
        timestamp: Date.now() - 7200000,
        txDetails: {
            signature: 'Tx2a1d8e5mnop3456789012',
            blockTime: Date.now() - 7200000,
            blockExplorerUrl: 'https://solscan.io/tx/Tx2a1d8e5mnop3456789012',
            fee: '0.000005',
            type: 'swap',
            route: 'Raydium',
            inputToken: 'RAY',
            outputToken: 'SOL',
            inputAmount: '84.3',
            outputAmount: '0.076',
            slippage: '0.1%'
        }
    },
    {
        id: 'Tx9d3c6f1',
        pair: 'SAMO/USDC',
        amount: '320.7',
        profit: '0.0014',
        time: '10:31:42',
        status: 'failed',
        timestamp: Date.now() - 8400000,
        txDetails: {
            signature: 'Tx9d3c6f1qrst7890123456',
            blockTime: Date.now() - 8400000,
            blockExplorerUrl: 'https://solscan.io/tx/Tx9d3c6f1qrst7890123456',
            fee: '0.000005',
            type: 'swap',
            route: 'Orca',
            inputToken: 'SAMO',
            outputToken: 'USDC',
            inputAmount: '320.7',
            outputAmount: '0',
            slippage: '0.1%',
            errorReason: '流动性不足'
        }
    }
];
/**
 * 获取交易列表
 */
const getTransactions = async (req, res) => {
    try {
        // 获取分页参数
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        // 获取过滤参数
        const status = req.query.status;
        const pair = req.query.pair;
        // 过滤交易
        let filteredTransactions = [...mockTransactions];
        if (status) {
            filteredTransactions = filteredTransactions.filter(tx => tx.status === status);
        }
        if (pair) {
            filteredTransactions = filteredTransactions.filter(tx => tx.pair.includes(pair));
        }
        // 计算总数和分页
        const total = filteredTransactions.length;
        const transactions = filteredTransactions.slice(offset, offset + limit);
        res.json({
            success: true,
            data: {
                transactions,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    }
    catch (error) {
        logger_1.default.error('获取交易列表失败', MODULE_NAME, {
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            success: false,
            error: '获取交易列表失败'
        });
    }
};
exports.getTransactions = getTransactions;
/**
 * 获取交易详情
 */
const getTransactionById = async (req, res) => {
    try {
        const transactionId = req.params.id;
        if (!transactionId) {
            return res.status(400).json({
                success: false,
                error: '交易ID不能为空'
            });
        }
        // 查找交易
        const transaction = mockTransactions.find(tx => tx.id === transactionId);
        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: '交易不存在'
            });
        }
        res.json({
            success: true,
            data: transaction
        });
    }
    catch (error) {
        logger_1.default.error('获取交易详情失败', MODULE_NAME, {
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            success: false,
            error: '获取交易详情失败'
        });
    }
};
exports.getTransactionById = getTransactionById;
/**
 * 获取最近交易
 */
const getRecentTransactions = async (req, res) => {
    try {
        const limit = Number(req.query.limit) || 5;
        // 按时间戳排序，取最近的几条
        const recentTransactions = [...mockTransactions]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
        res.json({
            success: true,
            data: recentTransactions
        });
    }
    catch (error) {
        logger_1.default.error('获取最近交易失败', MODULE_NAME, {
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            success: false,
            error: '获取最近交易失败'
        });
    }
};
exports.getRecentTransactions = getRecentTransactions;
//# sourceMappingURL=transaction_controller.js.map