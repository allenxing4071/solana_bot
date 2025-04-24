"use strict";
/**
 * 系统状态API路由
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
const logger_1 = __importDefault(require("../../core/logger"));
const systemController = __importStar(require("../controllers/system_controller"));
const router = express_1.default.Router();
const MODULE_NAME = 'SystemApi';
// 使用控制器方法处理请求 - 仅使用新标准路径
router.get('/status', systemController.getSystemStatus);
router.get('/memory', systemController.getMemory);
router.get('/start', systemController.startSystem);
router.get('/stop', systemController.stopSystem);
router.get('/optimize', systemController.optimizeMemory);
// 直接返回CPU数据 - 简化版
router.get('/cpu', (req, res) => {
    logger_1.default.debug('CPU使用率请求', MODULE_NAME);
    try {
        // 获取CPU信息
        const cpuInfo = os.cpus();
        const loadAvg = os.loadavg();
        // 计算CPU使用率
        const cpuUsage = loadAvg[0] * 10; // 将loadavg转换为大致的百分比
        // 构建响应
        res.status(200).json({
            success: true,
            data: {
                usage: Number(cpuUsage.toFixed(1)),
                cores: cpuInfo.length,
                model: cpuInfo.length > 0 ? cpuInfo[0].model : '未知',
                loadAverage: loadAvg,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.default.error(`获取CPU数据失败: ${error instanceof Error ? error.message : String(error)}`, MODULE_NAME);
        res.status(500).json({
            success: false,
            error: '获取CPU数据失败'
        });
    }
});
// 直接返回内存数据 - 简化版
router.get('/memory/simple', (req, res) => {
    logger_1.default.debug('简单内存数据请求', MODULE_NAME);
    try {
        // 获取系统内存
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memoryPercentage = (usedMem / totalMem) * 100;
        // 获取进程内存
        const processMemory = process.memoryUsage();
        // 构建响应
        res.status(200).json({
            success: true,
            data: {
                system: {
                    total: totalMem,
                    free: freeMem,
                    used: usedMem,
                    usage: Number(memoryPercentage.toFixed(1)) // 百分比
                },
                process: {
                    rss: processMemory.rss,
                    heapTotal: processMemory.heapTotal,
                    heapUsed: processMemory.heapUsed,
                    external: processMemory.external
                },
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.default.error(`获取内存数据失败: ${error instanceof Error ? error.message : String(error)}`, MODULE_NAME);
        res.status(500).json({
            success: false,
            error: '获取内存数据失败'
        });
    }
});
// 健康检查接口 - 用于快速检测API服务状态
router.get('/health', (_req, res) => {
    logger_1.default.debug('健康检查请求', MODULE_NAME);
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});
// 兼容旧路径的健康检查接口
router.get('/system/health', (_req, res) => {
    logger_1.default.debug('健康检查请求(旧路径)', MODULE_NAME);
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});
exports.default = router;
