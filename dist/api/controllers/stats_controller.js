"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokenStats = exports.getTransactionStats = exports.getSystemStats = exports.getProfitSummary = exports.getTokenTrend = exports.getProfitTrend = void 0;
const logger_1 = __importDefault(require("../../core/logger"));
const os = __importStar(require("node:os"));
const MODULE_NAME = 'StatsController';
// 模拟数据 - 正式环境应从数据库获取
const statsData = {
    // 交易统计
    transactions: {
        total: 456,
        success: 432,
        failed: 24,
        pending: 8,
        avgProfit: 2.75
    },
    // 代币统计
    tokens: {
        total: 635,
        todayNew: 12,
        monitored: 125,
        highRisk: 34,
        lowRisk: 86
    },
    // 内存使用历史
    memoryHistory: Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        value: 25 + Math.random() * 20
    })).reverse(),
    // CPU使用历史
    cpuHistory: Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        value: 15 + Math.random() * 25
    })).reverse()
};
// 最近一次更新时间
let lastUpdated = Date.now();
/**
 * 获取利润趋势数据
 * @param req 请求对象，可包含period参数（小时）
 * @param res 响应对象
 */
const getProfitTrend = (req, res) => {
    try {
        const period = req.query.period ? Number(req.query.period) : 24; // 默认24小时
        logger_1.default.info(`获取${period}小时的利润趋势数据`, MODULE_NAME);
        const trendData = generateTrendData(period, 'profit');
        res.json({
            success: true,
            data: trendData,
            period: period,
            unit: 'SOL'
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.default.error(`获取利润趋势数据失败: ${error}`, MODULE_NAME, {
            error: errorMessage
        });
        res.status(500).json({
            success: false,
            message: '获取利润趋势数据失败',
            error: errorMessage
        });
    }
};
exports.getProfitTrend = getProfitTrend;
/**
 * 获取代币趋势数据
 * @param req 请求对象，可包含period参数（小时）
 * @param res 响应对象
 */
const getTokenTrend = (req, res) => {
    try {
        const period = req.query.period ? Number(req.query.period) : 24; // 默认24小时
        logger_1.default.info(`获取${period}小时的代币趋势数据`, MODULE_NAME);
        const trendData = generateTrendData(period, 'token');
        res.json({
            success: true,
            data: trendData,
            period: period,
            unit: '代币数量'
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.default.error(`获取代币趋势数据失败: ${error}`, MODULE_NAME, {
            error: errorMessage
        });
        res.status(500).json({
            success: false,
            message: '获取代币趋势数据失败',
            error: errorMessage
        });
    }
};
exports.getTokenTrend = getTokenTrend;
/**
 * 获取利润摘要数据
 * @param req 请求对象
 * @param res 响应对象
 */
const getProfitSummary = (req, res) => {
    try {
        logger_1.default.info('获取利润摘要数据', MODULE_NAME);
        // 模拟数据
        const summary = {
            total: 1250.85,
            today: 42.65,
            week: 178.32,
            month: 652.18,
            unit: 'SOL',
            growth: 12.5, // 百分比增长率
            lastUpdated: new Date().toISOString()
        };
        res.json({
            success: true,
            data: summary
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.default.error(`获取利润摘要数据失败: ${error}`, MODULE_NAME, {
            error: errorMessage
        });
        res.status(500).json({
            success: false,
            message: '获取利润摘要数据失败',
            error: errorMessage
        });
    }
};
exports.getProfitSummary = getProfitSummary;
/**
 * 获取系统性能统计数据
 * @param req 请求对象
 * @param res 响应对象
 */
const getSystemStats = (req, res) => {
    try {
        logger_1.default.info('获取系统性能统计数据', MODULE_NAME);
        // 获取实际的CPU和内存使用情况
        const cpuUsage = os.loadavg()[0] * 10; // 转换为百分比
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const memoryPercentage = ((totalMem - freeMem) / totalMem) * 100;
        // 获取CPU信息
        const cpuInfo = os.cpus();
        const cpuCores = cpuInfo.length;
        const cpuModel = cpuInfo.length > 0 ? cpuInfo[0].model : '未知处理器';
        // 构建响应数据
        const statsResponse = {
            cpu: {
                usage: Number(cpuUsage.toFixed(1)),
                model: cpuModel,
                cores: cpuCores,
                history: statsData.cpuHistory.slice(0, 24) // 最近24小时的数据
            },
            memory: {
                usage: Number(memoryPercentage.toFixed(1)),
                total: totalMem,
                free: freeMem,
                used: totalMem - freeMem,
                history: statsData.memoryHistory.slice(0, 24) // 最近24小时的数据
            },
            uptime: process.uptime(),
            lastUpdated: new Date().toISOString()
        };
        res.json({
            success: true,
            data: statsResponse
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.default.error(`获取系统性能统计数据失败: ${error}`, MODULE_NAME, {
            error: errorMessage
        });
        res.status(500).json({
            success: false,
            message: '获取系统性能统计数据失败',
            error: errorMessage
        });
    }
};
exports.getSystemStats = getSystemStats;
/**
 * 获取交易统计数据
 * @param req 请求对象
 * @param res 响应对象
 */
const getTransactionStats = (req, res) => {
    try {
        logger_1.default.info('获取交易统计数据', MODULE_NAME);
        // 更新部分模拟数据以提供变化
        const now = Date.now();
        if (now - lastUpdated > 60000) { // 每分钟更新一次模拟数据
            statsData.transactions.total += Math.floor(Math.random() * 3);
            statsData.transactions.success += Math.floor(Math.random() * 2);
            statsData.transactions.pending = Math.max(0, statsData.transactions.pending + (Math.random() > 0.7 ? 1 : -1));
            lastUpdated = now;
        }
        // 计算成功率
        const successRate = statsData.transactions.total > 0
            ? ((statsData.transactions.success / statsData.transactions.total) * 100).toFixed(1)
            : '0.0';
        const statsResponse = {
            ...statsData.transactions,
            successRate: Number(successRate),
            avgProfit: Number(statsData.transactions.avgProfit.toFixed(2)),
            lastTransaction: new Date(Date.now() - Math.floor(Math.random() * 300000)).toISOString(), // 最近5分钟内
            lastUpdated: new Date().toISOString()
        };
        res.json({
            success: true,
            data: statsResponse
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.default.error(`获取交易统计数据失败: ${error}`, MODULE_NAME, {
            error: errorMessage
        });
        res.status(500).json({
            success: false,
            message: '获取交易统计数据失败',
            error: errorMessage
        });
    }
};
exports.getTransactionStats = getTransactionStats;
/**
 * 获取代币统计数据
 * @param req 请求对象
 * @param res 响应对象
 */
const getTokenStats = (req, res) => {
    try {
        logger_1.default.info('获取代币统计数据', MODULE_NAME);
        // 更新部分模拟数据以提供变化
        const now = Date.now();
        if (now - lastUpdated > 60000) { // 每分钟更新一次模拟数据
            statsData.tokens.total += Math.floor(Math.random() * 2);
            statsData.tokens.monitored = Math.min(statsData.tokens.total, statsData.tokens.monitored + (Math.random() > 0.5 ? 1 : 0));
            lastUpdated = now;
        }
        const statsResponse = {
            ...statsData.tokens,
            riskDistribution: {
                high: statsData.tokens.highRisk,
                medium: statsData.tokens.monitored - statsData.tokens.highRisk - statsData.tokens.lowRisk,
                low: statsData.tokens.lowRisk
            },
            lastDiscovered: new Date(Date.now() - Math.floor(Math.random() * 1800000)).toISOString(), // 最近30分钟内
            lastUpdated: new Date().toISOString()
        };
        res.json({
            success: true,
            data: statsResponse
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger_1.default.error(`获取代币统计数据失败: ${error}`, MODULE_NAME, {
            error: errorMessage
        });
        res.status(500).json({
            success: false,
            message: '获取代币统计数据失败',
            error: errorMessage
        });
    }
};
exports.getTokenStats = getTokenStats;
/**
 * 生成趋势数据
 * @param period 时间段（小时）
 * @param type 类型（'profit'或'token'）
 * @returns 趋势数据数组
 */
function generateTrendData(period, type) {
    const now = new Date();
    const data = [];
    // 根据period决定数据点间隔
    let interval;
    switch (period) {
        case 1: // 1小时，每5分钟一个点
            interval = 5 * 60 * 1000;
            break;
        case 6: // 6小时，每15分钟一个点
            interval = 15 * 60 * 1000;
            break;
        case 24: // 24小时，每小时一个点
            interval = 60 * 60 * 1000;
            break;
        default: // 超过24小时，每天一个点
            interval = 24 * 60 * 60 * 1000;
    }
    const pointCount = Math.ceil(period * 60 * 60 * 1000 / interval);
    // 生成模拟数据
    for (let i = 0; i < pointCount; i++) {
        const timestamp = new Date(now.getTime() - (pointCount - i) * interval);
        let value;
        if (type === 'profit') {
            // 利润波动模拟
            value = Math.random() * 2 + (i / pointCount) * 5; // 逐渐增长的趋势
            value = Number(value.toFixed(2));
        }
        else {
            // 代币数量波动模拟
            value = Math.floor(Math.random() * 5) + (i / pointCount) * 10 + 5;
        }
        data.push({
            timestamp: timestamp.toISOString(),
            value: value
        });
    }
    return data;
}
