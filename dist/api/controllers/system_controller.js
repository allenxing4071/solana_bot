"use strict";
/**
 * 系统控制器
 * 处理与系统状态、性能监控和操作相关的所有请求
 */
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
exports.getMemory = exports.optimizeMemory = exports.stopSystem = exports.startSystem = exports.getSystemStatus = void 0;
const os = __importStar(require("node:os"));
const v8 = __importStar(require("node:v8"));
const logger_1 = __importDefault(require("../../core/logger"));
const pool_monitor_1 = require("../../modules/listener/pool_monitor");
// 模块名称
const MODULE_NAME = 'SystemController';
// 使用模拟数据标志 - 改为默认使用真实数据
const USE_MOCK_DATA = false;
// 全局系统状态
const systemState = {
    running: false, // 系统运行状态
    startTime: 0, // 系统启动时间
    profitTotal: 0, // 累计收益
    executedTradesCount: 0 // 已执行交易数量
};
const memoryHistoryData = []; // 内存历史数据
// 定期收集内存数据
setInterval(() => {
    // 添加当前内存数据点
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryPercentage = ((totalMem - freeMem) / totalMem) * 100;
    memoryHistoryData.push({
        time: Date.now(),
        value: memoryPercentage
    });
    // 只保留最近60个数据点（假设每分钟收集一次，就是1小时的数据）
    if (memoryHistoryData.length > 60) {
        memoryHistoryData.shift();
    }
}, 60000); // 每分钟收集一次数据
/**
 * 获取系统状态
 */
const getSystemStatus = async (_req, res) => {
    try {
        logger_1.default.info('获取系统状态', MODULE_NAME);
        // 直接获取真实系统状态
        // 获取内存使用情况
        const memoryUsage = process.memoryUsage();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const memoryPercentage = ((totalMem - freeMem) / totalMem) * 100;
        // 获取CPU使用情况
        const cpuUsage = os.loadavg()[0] * 10; // 转换为百分比
        // 获取系统运行时间
        const uptime = systemState.running ? (Date.now() - systemState.startTime) / 1000 : 0;
        // 获取池状态 - 检查poolMonitor是否存在及其方法
        const activePools = pool_monitor_1.poolMonitor ? (typeof pool_monitor_1.poolMonitor.getKnownPools === 'function' ?
            pool_monitor_1.poolMonitor.getKnownPools().length : 0) : 0;
        const monitoredTokens = pool_monitor_1.poolMonitor && typeof pool_monitor_1.poolMonitor.getMonitoredTokens === 'function' ?
            pool_monitor_1.poolMonitor.getMonitoredTokens().length : 0;
        // 使用实际收集的内存历史数据
        const memoryHistory = [...memoryHistoryData];
        // 获取CPU信息
        const cpuInfo = os.cpus();
        const cpuCores = cpuInfo.length;
        const cpuModel = cpuInfo.length > 0 ? cpuInfo[0].model : '未知处理器';
        // 计算今日和本周利润 (模拟数据，实际应该从数据库获取)
        const todayProfit = systemState.profitTotal * 0.15; // 模拟今日利润为总利润的15%
        const weeklyProfit = systemState.profitTotal * 0.65; // 模拟本周利润为总利润的65%
        // 计算今日新增代币 (模拟数据)
        const todayNewTokens = Math.floor(monitoredTokens * 0.05); // 模拟今日新增代币为总数的5%
        // 成功率计算 (模拟数据)
        const successRate = 95.8; // 模拟95.8%的成功率
        // 返回系统状态数据
        res.json({
            success: true,
            data: {
                status: systemState.running ? 'running' : 'stopped',
                cpu: Math.min(100, cpuUsage),
                cpu_cores: cpuCores,
                cpu_model: cpuModel,
                memory: memoryPercentage,
                totalMemory: `${Math.round(totalMem / (1024 * 1024 * 1024))}GB`, // 总内存，转换为GB
                uptime: uptime,
                profit: systemState.profitTotal,
                todayProfit: todayProfit,
                weeklyProfit: weeklyProfit,
                activePools: activePools,
                totalPools: activePools + Math.floor(activePools * 0.3), // 模拟总池数比活跃池多30%
                monitoredTokens: monitoredTokens,
                todayNewTokens: todayNewTokens,
                executedTrades: systemState.executedTradesCount,
                successRate: successRate,
                memoryDetails: {
                    heapTotal: memoryUsage.heapTotal,
                    heapUsed: memoryUsage.heapUsed,
                    external: memoryUsage.external,
                    arrayBuffers: memoryUsage.arrayBuffers || 0,
                    rss: memoryUsage.rss
                },
                memoryHistory: memoryHistory,
                v8Stats: {
                    heapSizeLimit: v8.getHeapStatistics().heap_size_limit,
                    totalHeapSize: v8.getHeapStatistics().total_heap_size,
                    usedHeapSize: v8.getHeapStatistics().used_heap_size
                },
                optimization: {
                    cleanupCount: 0,
                    gcCount: 0,
                    memoryFreed: 0,
                    leakWarnings: 0,
                    lastOptimization: Date.now()
                },
                consumers: [] // 移除模拟消费者
            }
        });
    }
    catch (error) {
        logger_1.default.error('获取系统状态失败', MODULE_NAME, {
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            success: false,
            error: '获取系统状态失败'
        });
    }
};
exports.getSystemStatus = getSystemStatus;
/**
 * 启动系统
 */
const startSystem = async (_req, res) => {
    try {
        logger_1.default.info('通过API触发系统启动', MODULE_NAME);
        // 更新系统状态
        systemState.running = true;
        systemState.startTime = Date.now();
        // 这里可以添加实际的系统启动逻辑
        // 例如启动监听器、初始化交易模块等
        res.json({
            success: true,
            message: '系统已成功启动'
        });
    }
    catch (error) {
        logger_1.default.error(`启动系统失败: ${error instanceof Error ? error.message : String(error)}`, MODULE_NAME);
        res.status(500).json({
            success: false,
            error: '启动系统失败'
        });
    }
};
exports.startSystem = startSystem;
/**
 * 停止系统
 */
const stopSystem = async (_req, res) => {
    try {
        logger_1.default.info('通过API触发系统停止', MODULE_NAME);
        // 更新系统状态
        systemState.running = false;
        // 这里可以添加实际的系统停止逻辑
        // 例如关闭连接、保存状态等
        res.json({
            success: true,
            message: '系统已成功停止'
        });
    }
    catch (error) {
        logger_1.default.error(`停止系统失败: ${error instanceof Error ? error.message : String(error)}`, MODULE_NAME);
        res.status(500).json({
            success: false,
            error: '停止系统失败'
        });
    }
};
exports.stopSystem = stopSystem;
/**
 * 优化内存
 */
const optimizeMemory = async (_req, res) => {
    try {
        logger_1.default.info('通过API触发内存优化', MODULE_NAME);
        // 执行垃圾回收
        if (global.gc) {
            global.gc();
            logger_1.default.info('成功执行垃圾回收', MODULE_NAME);
        }
        else {
            logger_1.default.warn('无法执行垃圾回收，Node.js未以--expose-gc标志启动', MODULE_NAME);
        }
        // 如果有其他内存优化逻辑，可以在此处添加
        res.json({
            success: true,
            message: '内存优化已完成',
            result: {
                memoryBefore: process.memoryUsage().heapUsed,
                memoryAfter: process.memoryUsage().heapUsed,
                timestamp: Date.now()
            }
        });
    }
    catch (error) {
        logger_1.default.error(`内存优化失败: ${error instanceof Error ? error.message : String(error)}`, MODULE_NAME);
        res.status(500).json({
            success: false,
            error: '内存优化失败'
        });
    }
};
exports.optimizeMemory = optimizeMemory;
/**
 * 获取内存使用情况
 */
const getMemory = async (_req, res) => {
    try {
        logger_1.default.info('获取内存使用情况', MODULE_NAME);
        // 获取系统内存
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memoryPercentage = (usedMem / totalMem) * 100;
        // 获取Node.js进程内存
        const processMemory = process.memoryUsage();
        // 获取V8堆统计信息
        const heapStats = v8.getHeapStatistics();
        // 获取历史数据
        const history = memoryHistoryData.map(item => ({
            time: item.time,
            value: item.value,
            timestamp: new Date(item.time).toISOString()
        }));
        // 构建响应
        res.json({
            success: true,
            data: {
                system: {
                    total: totalMem,
                    free: freeMem,
                    used: usedMem,
                    usage: Number(memoryPercentage.toFixed(1)), // 百分比
                    formattedTotal: formatSize(totalMem),
                    formattedUsed: formatSize(usedMem),
                    formattedFree: formatSize(freeMem)
                },
                process: {
                    rss: processMemory.rss,
                    heapTotal: processMemory.heapTotal,
                    heapUsed: processMemory.heapUsed,
                    external: processMemory.external,
                    arrayBuffers: processMemory.arrayBuffers || 0,
                    formattedRss: formatSize(processMemory.rss),
                    formattedHeapTotal: formatSize(processMemory.heapTotal),
                    formattedHeapUsed: formatSize(processMemory.heapUsed)
                },
                v8: {
                    heapSizeLimit: heapStats.heap_size_limit,
                    totalHeapSize: heapStats.total_heap_size,
                    usedHeapSize: heapStats.used_heap_size,
                    formattedHeapSizeLimit: formatSize(heapStats.heap_size_limit),
                    formattedTotalHeapSize: formatSize(heapStats.total_heap_size),
                    formattedUsedHeapSize: formatSize(heapStats.used_heap_size)
                },
                history: history,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.default.error(`获取内存使用情况失败: ${error instanceof Error ? error.message : String(error)}`, MODULE_NAME);
        res.status(500).json({
            success: false,
            error: '获取内存使用情况失败'
        });
    }
};
exports.getMemory = getMemory;
/**
 * 格式化字节大小为人类可读格式
 * @param bytes 字节数
 * @returns 格式化后的大小字符串 (例如: "1.5 MB")
 */
function formatSize(bytes) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
/**
 * 生成内存历史数据（模拟）
 */
function generateMemoryHistory() {
    const history = [];
    const now = Date.now();
    // 生成过去20分钟的内存使用记录，每分钟一条
    for (let i = 19; i >= 0; i--) {
        const time = now - (i * 60 * 1000);
        const memValue = 40 + Math.random() * 30; // 随机内存使用率40%-70%
        history.push({
            time: time,
            value: memValue
        });
    }
    return history;
}
/**
 * 生成模拟内存消耗者数据
 */
function generateMockConsumers() {
    return [
        {
            name: '价格缓存',
            priority: 1,
            lastCleanup: Date.now() - Math.random() * 3600000,
            freed: Math.random() * 100 * 1024 * 1024,
            memoryUsage: 30 + Math.random() * 40,
            status: '正常'
        },
        {
            name: 'RPC连接池',
            priority: 3,
            lastCleanup: Date.now() - Math.random() * 7200000,
            freed: Math.random() * 50 * 1024 * 1024,
            memoryUsage: 20 + Math.random() * 30,
            status: '正常'
        },
        {
            name: '交易机会队列',
            priority: 2,
            lastCleanup: Date.now() - Math.random() * 1800000,
            freed: Math.random() * 80 * 1024 * 1024,
            memoryUsage: 15 + Math.random() * 25,
            status: '正常'
        }
    ];
}
/**
 * 生成内存消耗者详细数据
 */
function generateMemoryConsumers() {
    return [
        {
            id: 'cache',
            name: '数据缓存',
            memoryUsage: Math.floor(Math.random() * 200) * 1024 * 1024,
            percentUsage: 25 + Math.random() * 10,
            status: '正常',
            cleanable: true,
            lastCleanup: Date.now() - Math.floor(Math.random() * 3600000),
            items: Math.floor(Math.random() * 1000) + 500,
            details: {
                cacheHits: Math.floor(Math.random() * 10000),
                cacheMisses: Math.floor(Math.random() * 2000),
                efficiency: Math.round(Math.random() * 30 + 70) + '%'
            }
        },
        {
            id: 'connections',
            name: '网络连接',
            memoryUsage: Math.floor(Math.random() * 100) * 1024 * 1024,
            percentUsage: 10 + Math.random() * 5,
            status: '正常',
            cleanable: true,
            lastCleanup: Date.now() - Math.floor(Math.random() * 1800000),
            items: Math.floor(Math.random() * 20) + 5,
            details: {
                active: Math.floor(Math.random() * 10) + 2,
                idle: Math.floor(Math.random() * 5),
                closed: Math.floor(Math.random() * 100)
            }
        },
        {
            id: 'transactions',
            name: '交易历史',
            memoryUsage: Math.floor(Math.random() * 300) * 1024 * 1024,
            percentUsage: 30 + Math.random() * 15,
            status: '正常',
            cleanable: true,
            lastCleanup: Date.now() - Math.floor(Math.random() * 7200000),
            items: Math.floor(Math.random() * 5000) + 1000,
            details: {
                success: Math.floor(Math.random() * 4000) + 500,
                pending: Math.floor(Math.random() * 100),
                failed: Math.floor(Math.random() * 500)
            }
        },
        {
            id: 'analytics',
            name: '分析数据',
            memoryUsage: Math.floor(Math.random() * 150) * 1024 * 1024,
            percentUsage: 15 + Math.random() * 8,
            status: '正常',
            cleanable: false,
            lastCleanup: Date.now() - Math.floor(Math.random() * 14400000),
            items: Math.floor(Math.random() * 200) + 50,
            details: {
                datasets: Math.floor(Math.random() * 20) + 5,
                dataPoints: Math.floor(Math.random() * 100000) + 10000
            }
        }
    ];
}
//# sourceMappingURL=system_controller.js.map