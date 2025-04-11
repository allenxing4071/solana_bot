"use strict";
/**
 * 系统状态API路由 - 真实数据版本
 * 提供系统状态、内存使用、性能指标等信息
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
const express_1 = __importDefault(require("express"));
const os = __importStar(require("node:os"));
const v8 = __importStar(require("node:v8"));
const logger_1 = __importDefault(require("../../core/logger"));
const pool_monitor_1 = require("../../modules/listener/pool_monitor");
const trader_module_1 = require("../../modules/trader/trader_module");
const db_service_1 = require("../../services/db_service");
const router = express_1.default.Router();
const MODULE_NAME = 'SystemApi';
// 全局应用实例检查
function isSystemRunning() {
    try {
        // 检查实际服务运行状态
        return pool_monitor_1.poolMonitor?.isRunning() || false;
    }
    catch (error) {
        logger_1.default.error('检查系统状态失败', MODULE_NAME, { error });
        return false;
    }
}
// 获取系统状态数据
router.get('/status', async (_req, res) => {
    try {
        // 获取内存使用情况
        const memoryUsage = process.memoryUsage();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const memoryPercentage = ((totalMem - freeMem) / totalMem) * 100;
        // 获取CPU使用情况
        const cpuUsage = os.loadavg()[0] * 10; // 转换为百分比
        // 获取系统运行时间
        const uptime = process.uptime();
        // 获取应用状态
        const isRunning = isSystemRunning();
        // 获取实际池和代币数据
        const activePools = pool_monitor_1.poolMonitor ? await pool_monitor_1.poolMonitor.getActivePools() : [];
        const monitoredTokens = await db_service_1.db.getMonitoredTokenCount();
        // 获取内存历史数据
        const memoryHistory = await db_service_1.db.getMemoryHistory() || [];
        // 获取总收益数据
        const profit = await trader_module_1.traderModule?.getTotalProfit() || 0;
        const executedTrades = await db_service_1.db.getExecutedTradeCount() || 0;
        // 返回真实系统状态数据
        return res.json({
            success: true,
            data: {
                status: isRunning ? 'running' : 'stopped',
                cpu: Math.min(100, cpuUsage),
                memory: memoryPercentage,
                uptime: uptime,
                profit: profit,
                activePools: activePools.length,
                monitoredTokens: monitoredTokens,
                executedTrades: executedTrades,
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
                }
            }
        });
    }
    catch (error) {
        logger_1.default.error('获取系统状态失败', MODULE_NAME, {
            error: error instanceof Error ? error.message : String(error)
        });
        return res.status(500).json({
            success: false,
            error: '获取系统状态失败'
        });
    }
});
// 启动系统
router.post('/start', async (_req, res) => {
    try {
        logger_1.default.info('通过API触发系统启动', MODULE_NAME);
        // 实际启动系统
        if (pool_monitor_1.poolMonitor && !pool_monitor_1.poolMonitor.isRunning()) {
            await pool_monitor_1.poolMonitor.start();
            if (trader_module_1.traderModule && !trader_module_1.traderModule.isRunning()) {
                await trader_module_1.traderModule.start();
            }
            return res.json({
                success: true,
                message: '系统已成功启动'
            });
        }
        else {
            return res.json({
                success: true,
                message: '系统已经在运行中'
            });
        }
    }
    catch (error) {
        logger_1.default.error('启动系统失败', MODULE_NAME, {
            error: error instanceof Error ? error.message : String(error)
        });
        return res.status(500).json({
            success: false,
            error: '启动系统失败'
        });
    }
});
// 停止系统
router.post('/stop', async (_req, res) => {
    try {
        logger_1.default.info('通过API触发系统停止', MODULE_NAME);
        // 实际停止系统
        if (trader_module_1.traderModule && trader_module_1.traderModule.isRunning()) {
            await trader_module_1.traderModule.stop();
        }
        if (pool_monitor_1.poolMonitor && pool_monitor_1.poolMonitor.isRunning()) {
            await pool_monitor_1.poolMonitor.stop();
        }
        return res.json({
            success: true,
            message: '系统已成功停止'
        });
    }
    catch (error) {
        logger_1.default.error('停止系统失败', MODULE_NAME, {
            error: error instanceof Error ? error.message : String(error)
        });
        return res.status(500).json({
            success: false,
            error: '停止系统失败'
        });
    }
});
// 优化内存
router.post('/optimize-memory', (_req, res) => {
    try {
        logger_1.default.info('通过API触发内存优化', MODULE_NAME);
        // 强制执行垃圾回收
        if (global.gc) {
            global.gc();
            logger_1.default.info('手动触发垃圾回收完成', MODULE_NAME);
        }
        return res.json({
            success: true,
            message: '内存优化已执行'
        });
    }
    catch (error) {
        logger_1.default.error('内存优化失败', MODULE_NAME, {
            error: error instanceof Error ? error.message : String(error)
        });
        return res.status(500).json({
            success: false,
            error: '内存优化失败'
        });
    }
});
exports.default = router;
//# sourceMappingURL=system_routes_real.js.map