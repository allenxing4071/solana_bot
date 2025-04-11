"use strict";
/**
 * 代币详情控制器
 * 处理与代币详细信息相关的请求
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokensList = exports.getTokenDetails = void 0;
const logger_1 = __importDefault(require("../../core/logger"));
// 模块名称
const MODULE_NAME = 'TokenDetailsController';
// 模拟代币数据
const mockTokens = [
    {
        address: 'SLRf5e2a',
        name: 'Solar Flare',
        symbol: 'SLR',
        logo: 'https://example.com/tokens/slr.png',
        decimals: 9,
        totalSupply: '1000000000',
        marketCap: '15420000',
        price: '0.01542',
        volume24h: '342500',
        liquidity: '15420',
        holders: 2340,
        createdAt: Date.now() - 10 * 86400000, // 10天前
        riskScore: 25, // 低风险
        transactions: [
            { type: 'swap', time: Date.now() - 3600000, amount: '1250', price: '0.01542', value: '19.28' },
            { type: 'swap', time: Date.now() - 7200000, amount: '500', price: '0.01538', value: '7.69' },
            { type: 'swap', time: Date.now() - 10800000, amount: '2000', price: '0.01535', value: '30.7' }
        ],
        priceHistory: Array(24).fill(0).map((_, i) => ({
            time: Date.now() - (23 - i) * 3600000,
            price: 0.015 + (Math.random() * 0.001),
            volume: Math.random() * 10000 + 5000
        }))
    },
    {
        address: 'MRkt7c9d',
        name: 'Moon Rocket',
        symbol: 'MRK',
        logo: 'https://example.com/tokens/mrk.png',
        decimals: 6,
        totalSupply: '500000000',
        marketCap: '8750000',
        price: '0.0175',
        volume24h: '195000',
        liquidity: '8750',
        holders: 1870,
        createdAt: Date.now() - 15 * 86400000, // 15天前
        riskScore: 45, // 中风险
        transactions: [
            { type: 'swap', time: Date.now() - 1800000, amount: '3000', price: '0.0175', value: '52.5' },
            { type: 'swap', time: Date.now() - 5400000, amount: '1200', price: '0.0174', value: '20.88' },
            { type: 'swap', time: Date.now() - 9000000, amount: '800', price: '0.0173', value: '13.84' }
        ],
        priceHistory: Array(24).fill(0).map((_, i) => ({
            time: Date.now() - (23 - i) * 3600000,
            price: 0.017 + (Math.random() * 0.001),
            volume: Math.random() * 8000 + 3000
        }))
    },
    {
        address: 'CSmc4a3b',
        name: 'Cosmic Coin',
        symbol: 'CSM',
        logo: 'https://example.com/tokens/csm.png',
        decimals: 9,
        totalSupply: '10000000000',
        marketCap: '5200000',
        price: '0.00052',
        volume24h: '85000',
        liquidity: '5200',
        holders: 980,
        createdAt: Date.now() - 5 * 86400000, // 5天前
        riskScore: 75, // 高风险
        transactions: [
            { type: 'swap', time: Date.now() - 2700000, amount: '500000', price: '0.00052', value: '260' },
            { type: 'swap', time: Date.now() - 6300000, amount: '200000', price: '0.00051', value: '102' },
            { type: 'swap', time: Date.now() - 9900000, amount: '350000', price: '0.0005', value: '175' }
        ],
        priceHistory: Array(24).fill(0).map((_, i) => ({
            time: Date.now() - (23 - i) * 3600000,
            price: 0.0005 + (Math.random() * 0.00005),
            volume: Math.random() * 12000 + 2000
        }))
    }
];
/**
 * 获取代币详细信息
 */
const getTokenDetails = async (req, res) => {
    try {
        const tokenAddress = req.query.address;
        if (!tokenAddress) {
            return res.status(400).json({
                success: false,
                error: '代币地址参数不能为空'
            });
        }
        // 查找代币
        const token = mockTokens.find(t => t.address.includes(tokenAddress));
        if (!token) {
            return res.status(404).json({
                success: false,
                error: '找不到该代币'
            });
        }
        // 返回代币详情
        res.json({
            success: true,
            data: token
        });
    }
    catch (error) {
        logger_1.default.error('获取代币详情失败', MODULE_NAME, {
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            success: false,
            error: '获取代币详情失败'
        });
    }
};
exports.getTokenDetails = getTokenDetails;
/**
 * 获取代币列表
 */
const getTokensList = async (req, res) => {
    try {
        // 分页参数
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        // 计算分页
        const total = mockTokens.length;
        const tokens = mockTokens.slice(offset, offset + limit);
        // 简化返回的代币信息
        const simplifiedTokens = tokens.map(token => ({
            address: token.address,
            name: token.name,
            symbol: token.symbol,
            price: token.price,
            marketCap: token.marketCap,
            liquidity: token.liquidity,
            riskScore: token.riskScore,
            createdAt: token.createdAt
        }));
        res.json({
            success: true,
            data: {
                tokens: simplifiedTokens,
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
        logger_1.default.error('获取代币列表失败', MODULE_NAME, {
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            success: false,
            error: '获取代币列表失败'
        });
    }
};
exports.getTokensList = getTokensList;
//# sourceMappingURL=token_details_controller.js.map