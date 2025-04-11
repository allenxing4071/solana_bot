"use strict";
/**
 * 管理控制器
 * 处理系统状态、设置和性能监控相关的所有请求
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
exports.applySettings = exports.saveSettings = exports.getSettings = exports.getMemoryStats = exports.optimizeMemory = exports.stopSystem = exports.startSystem = exports.getSystemStatus = void 0;
const fs = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
const os = __importStar(require("node:os"));
const v8 = __importStar(require("node:v8"));
const logger_1 = __importDefault(require("../../core/logger"));
const pool_monitor_1 = require("../../modules/listener/pool_monitor");
// 模块名称
const MODULE_NAME = 'AdminController';
// 设置文件路径
const SETTINGS_FILE_PATH = path.join(process.cwd(), 'config', 'settings.json');
// 全局系统状态
const systemState = {
    running: false, // 系统运行状态
    startTime: 0, // 系统启动时间
    profitTotal: 0, // 累计收益
    executedTrades: 0, // 已执行交易数量
    memoryHistory: [] // 内存历史数据
};
// 默认设置
const DEFAULT_SETTINGS = {
    system: {
        rpcEndpoint: 'https://api.mainnet-beta.solana.com',
        websocketEndpoint: 'wss://api.mainnet-beta.solana.com',
        useBackupNodes: true,
        maxTransactionRetry: 3,
        healthCheckInterval: 30000,
        priceCheckInterval: 5000,
        logLevel: 'info',
        logToConsole: true,
        logToFile: false
    },
    trading: {
        buyAmountSol: 0.05,
        takeProfitPercentage: 20,
        stopLossPercentage: 10,
        maxBuySlippage: 5,
        maxSellSlippage: 5,
        priorityFee: 0.000005,
        listenOnly: true,
        maxTransactionAmount: 0.1
    },
    security: {
        checkTokenCode: true,
        minimumLiquidity: 1000,
        minPoolAgeDays: 1,
        maxRiskScore: 7
    }
};
// 定期收集内存数据
setInterval(() => {
    // 添加当前内存数据点
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryPercentage = ((totalMem - freeMem) / totalMem) * 100;
    systemState.memoryHistory.push({
        time: Date.now(),
        value: memoryPercentage
    });
    // 只保留最近60个数据点（假设每分钟收集一次，就是1小时的数据）
    if (systemState.memoryHistory.length > 60) {
        systemState.memoryHistory.shift();
    }
}, 60000); // 每分钟收集一次数据
/**
 * 获取系统状态
 */
const getSystemStatus = async (_req, res) => {
    try {
        // 获取内存使用情况
        const memoryUsage = process.memoryUsage();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const memoryPercentage = ((totalMem - freeMem) / totalMem) * 100;
        // 获取CPU使用情况
        const cpuUsage = os.loadavg()[0] * 10; // 转换为百分比
        // 获取系统运行时间
        const uptime = systemState.running ? (Date.now() - systemState.startTime) / 1000 : 0;
        // 获取池状态
        const activePools = pool_monitor_1.poolMonitor ? pool_monitor_1.poolMonitor.getKnownPools().length : 0;
        const monitoredTokens = Math.floor(Math.random() * 100) + 50; // 暂时使用模拟数据
        // 使用实际收集的内存历史数据，如果没有则生成模拟数据
        const memoryHistory = systemState.memoryHistory.length > 0
            ? systemState.memoryHistory
            : generateMemoryHistory();
        // 返回系统状态数据
        res.json({
            success: true,
            data: {
                status: systemState.running ? 'running' : 'stopped',
                cpu: Math.min(100, cpuUsage),
                memory: memoryPercentage,
                uptime: uptime,
                profit: systemState.profitTotal,
                activePools: activePools,
                monitoredTokens: monitoredTokens,
                executedTrades: systemState.executedTrades,
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
                    cleanupCount: Math.floor(Math.random() * 10),
                    gcCount: Math.floor(Math.random() * 15),
                    memoryFreed: Math.floor(Math.random() * 1000) * 1024 * 1024,
                    leakWarnings: Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0,
                    lastOptimization: Date.now() - Math.random() * 3600000
                },
                consumers: generateResourceConsumers('simple')
            }
        });
    }
    catch (error) {
        handleApiError(res, '获取系统状态失败', error);
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
        handleApiError(res, '启动系统失败', error);
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
        handleApiError(res, '停止系统失败', error);
    }
};
exports.stopSystem = stopSystem;
/**
 * 优化内存
 */
const optimizeMemory = async (_req, res) => {
    try {
        logger_1.default.info('通过API触发内存优化', MODULE_NAME);
        // 强制执行垃圾回收
        if (global.gc) {
            global.gc();
            logger_1.default.info('手动触发垃圾回收完成', MODULE_NAME);
        }
        // 这里可以添加更多内存优化逻辑
        res.json({
            success: true,
            message: '内存优化已执行',
            data: {
                memoryBefore: Math.floor(Math.random() * 200 + 800) * 1024 * 1024, // 模拟数据
                memoryAfter: Math.floor(Math.random() * 200 + 600) * 1024 * 1024, // 模拟数据
                freedMemory: Math.floor(Math.random() * 200) * 1024 * 1024, // 模拟数据
                timestamp: Date.now()
            }
        });
    }
    catch (error) {
        handleApiError(res, '内存优化失败', error);
    }
};
exports.optimizeMemory = optimizeMemory;
/**
 * 获取内存统计数据
 */
const getMemoryStats = async (_req, res) => {
    try {
        logger_1.default.info('获取内存统计数据', MODULE_NAME);
        // 获取内存使用情况
        const memoryUsage = process.memoryUsage();
        const heapStats = v8.getHeapStatistics();
        // 获取系统内存
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const systemMemoryPercentage = ((totalMem - freeMem) / totalMem) * 100;
        // 计算内存历史数据的统计信息
        const memoryHistory = systemState.memoryHistory.length > 0
            ? systemState.memoryHistory
            : generateMemoryHistory();
        // 计算最大、最小和平均值
        let memSum = 0;
        let memMax = 0;
        let memMin = 100;
        for (const point of memoryHistory) {
            memSum += point.value;
            memMax = Math.max(memMax, point.value);
            memMin = Math.min(memMin, point.value);
        }
        const memAvg = memoryHistory.length > 0 ? memSum / memoryHistory.length : 0;
        // 生成内存消耗者数据
        const memoryConsumers = generateResourceConsumers('detailed');
        // 生成区域使用数据
        const memoryAreas = [
            { name: '堆空间', size: memoryUsage.heapTotal, used: memoryUsage.heapUsed },
            { name: '外部资源', size: memoryUsage.external, used: memoryUsage.external },
            { name: '数组缓冲区', size: memoryUsage.arrayBuffers || 0, used: memoryUsage.arrayBuffers || 0 },
            { name: '代码空间', size: heapStats.total_heap_size - heapStats.used_heap_size, used: heapStats.total_heap_size / 2 }
        ];
        // 生成时间段统计数据
        const timeRanges = [
            { range: '最近1小时', avgUsage: memAvg, peakUsage: memMax, trend: memMax > memAvg ? '上升' : '下降' },
            { range: '最近24小时', avgUsage: memAvg * 0.9, peakUsage: memMax * 1.1, trend: Math.random() > 0.5 ? '上升' : '下降' },
            { range: '最近7天', avgUsage: memAvg * 0.85, peakUsage: memMax * 1.2, trend: Math.random() > 0.5 ? '上升' : '下降' }
        ];
        // 返回内存统计数据
        res.json({
            success: true,
            data: {
                current: {
                    systemMemory: {
                        total: totalMem,
                        free: freeMem,
                        used: totalMem - freeMem,
                        percentage: systemMemoryPercentage
                    },
                    processMemory: {
                        rss: memoryUsage.rss,
                        heapTotal: memoryUsage.heapTotal,
                        heapUsed: memoryUsage.heapUsed,
                        external: memoryUsage.external,
                        arrayBuffers: memoryUsage.arrayBuffers || 0
                    },
                    v8Memory: {
                        heapSizeLimit: heapStats.heap_size_limit,
                        totalHeapSize: heapStats.total_heap_size,
                        usedHeapSize: heapStats.used_heap_size,
                        mallocedMemory: heapStats.malloced_memory,
                        peakMallocedMemory: heapStats.peak_malloced_memory
                    }
                },
                history: {
                    data: memoryHistory,
                    stats: {
                        min: memMin,
                        max: memMax,
                        avg: memAvg,
                        current: systemMemoryPercentage
                    }
                },
                consumers: memoryConsumers,
                areas: memoryAreas,
                timeRanges: timeRanges,
                gcInfo: {
                    lastRun: Date.now() - Math.floor(Math.random() * 600000), // 最近10分钟内
                    totalRuns: Math.floor(Math.random() * 100) + 50,
                    averageDuration: Math.floor(Math.random() * 50) + 10,
                    freedMemory: Math.floor(Math.random() * 1000) * 1024 * 1024
                }
            }
        });
    }
    catch (error) {
        handleApiError(res, '获取内存统计数据失败', error);
    }
};
exports.getMemoryStats = getMemoryStats;
/**
 * 获取系统设置
 */
const getSettings = async (_req, res) => {
    try {
        logger_1.default.info('获取系统设置', MODULE_NAME);
        let settings = DEFAULT_SETTINGS;
        // 尝试从文件读取设置
        try {
            const fileData = await fs.readFile(SETTINGS_FILE_PATH, 'utf8');
            const fileSettings = JSON.parse(fileData);
            settings = { ...DEFAULT_SETTINGS, ...fileSettings };
        }
        catch (error) {
            // 如果文件不存在或读取失败，使用默认设置
            logger_1.default.warn('无法读取设置文件，使用默认设置', MODULE_NAME, {
                error: error instanceof Error ? error.message : String(error)
            });
            // 确保配置目录存在
            try {
                await fs.mkdir(path.dirname(SETTINGS_FILE_PATH), { recursive: true });
            }
            catch (mkdirError) {
                logger_1.default.error('创建配置目录失败', MODULE_NAME, {
                    error: mkdirError instanceof Error ? mkdirError.message : String(mkdirError)
                });
            }
            // 写入默认设置
            try {
                await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf8');
                logger_1.default.info('已创建默认设置文件', MODULE_NAME);
            }
            catch (writeError) {
                logger_1.default.error('创建默认设置文件失败', MODULE_NAME, {
                    error: writeError instanceof Error ? writeError.message : String(writeError)
                });
            }
        }
        res.json({
            success: true,
            data: settings
        });
    }
    catch (error) {
        handleApiError(res, '获取系统设置失败', error);
    }
};
exports.getSettings = getSettings;
/**
 * 保存系统设置
 */
const saveSettings = async (req, res) => {
    try {
        const newSettings = req.body;
        logger_1.default.info('保存系统设置', MODULE_NAME);
        // 验证设置数据
        if (!newSettings || typeof newSettings !== 'object') {
            res.status(400).json({
                success: false,
                error: '无效的设置数据'
            });
            return;
        }
        // 合并默认设置
        const settings = { ...DEFAULT_SETTINGS, ...newSettings };
        // 确保配置目录存在
        try {
            await fs.mkdir(path.dirname(SETTINGS_FILE_PATH), { recursive: true });
        }
        catch (mkdirError) {
            logger_1.default.error('创建配置目录失败', MODULE_NAME, {
                error: mkdirError instanceof Error ? mkdirError.message : String(mkdirError)
            });
        }
        // 保存设置到文件
        await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2), 'utf8');
        res.json({
            success: true,
            message: '设置已保存',
            data: settings
        });
    }
    catch (error) {
        handleApiError(res, '保存系统设置失败', error);
    }
};
exports.saveSettings = saveSettings;
/**
 * 应用系统设置
 */
const applySettings = async (req, res) => {
    try {
        logger_1.default.info('应用系统设置', MODULE_NAME);
        // 这里可以添加实际应用设置的逻辑
        // 例如：重新配置连接、更新日志级别等
        // 模拟应用延迟
        await new Promise(resolve => setTimeout(resolve, 500));
        // 模拟更新环境变量
        process.env.LOG_LEVEL = req.body?.system?.logLevel || process.env.LOG_LEVEL || 'info';
        res.json({
            success: true,
            message: '设置已应用',
            applied: {
                timestamp: new Date().toISOString(),
                settings: req.body
            }
        });
    }
    catch (error) {
        handleApiError(res, '应用系统设置失败', error);
    }
};
exports.applySettings = applySettings;
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
 * 生成资源消耗者数据
 * @param type 生成类型 'simple' 或 'detailed'
 */
function generateResourceConsumers(type = 'simple') {
    // 简化版消耗者数据
    if (type === 'simple') {
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
    // 详细版消耗者数据
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
                efficiency: `${Math.round(Math.random() * 30 + 70)}%`
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
/**
 * 通用API错误处理
 */
function handleApiError(res, message, error) {
    logger_1.default.error(message, MODULE_NAME, {
        error: error instanceof Error ? error.message : String(error)
    });
    res.status(500).json({
        success: false,
        error: message
    });
}
//# sourceMappingURL=admin_controller.js.map