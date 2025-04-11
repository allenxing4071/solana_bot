/**
 * 系统状态API路由 - 真实数据版本
 * 提供系统状态、内存使用、性能指标等信息
 */

import express from 'express';
import * as os from 'node:os';
import * as v8 from 'node:v8';
import logger from '../../core/logger';
import { poolMonitor } from '../../modules/listener/pool_monitor';
import { traderModule } from '../../modules/trader/trader_module';
import { db } from '../../services/db_service';

const router = express.Router();
const MODULE_NAME = 'SystemApi';

// 全局应用实例检查
function isSystemRunning(): boolean {
    try {
        // 检查实际服务运行状态
        return poolMonitor?.isRunning() || false;
    } catch (error) {
        logger.error('检查系统状态失败', MODULE_NAME, { error });
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
        const activePools = poolMonitor ? await poolMonitor.getActivePools() : [];
        const monitoredTokens = await db.getMonitoredTokenCount();
        
        // 获取内存历史数据
        const memoryHistory = await db.getMemoryHistory() || [];
        
        // 获取总收益数据
        const profit = await traderModule?.getTotalProfit() || 0;
        const executedTrades = await db.getExecutedTradeCount() || 0;
        
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
    } catch (error) {
        logger.error('获取系统状态失败', MODULE_NAME, { 
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
        logger.info('通过API触发系统启动', MODULE_NAME);
        
        // 实际启动系统
        if (poolMonitor && !poolMonitor.isRunning()) {
            await poolMonitor.start();
            
            if (traderModule && !traderModule.isRunning()) {
                await traderModule.start();
            }
            
            return res.json({
                success: true,
                message: '系统已成功启动'
            });
        } else {
            return res.json({
                success: true,
                message: '系统已经在运行中'
            });
        }
    } catch (error) {
        logger.error('启动系统失败', MODULE_NAME, { 
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
        logger.info('通过API触发系统停止', MODULE_NAME);
        
        // 实际停止系统
        if (traderModule && traderModule.isRunning()) {
            await traderModule.stop();
        }
        
        if (poolMonitor && poolMonitor.isRunning()) {
            await poolMonitor.stop();
        }
        
        return res.json({
            success: true,
            message: '系统已成功停止'
        });
    } catch (error) {
        logger.error('停止系统失败', MODULE_NAME, { 
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
        logger.info('通过API触发内存优化', MODULE_NAME);
        
        // 强制执行垃圾回收
        if (global.gc) {
            global.gc();
            logger.info('手动触发垃圾回收完成', MODULE_NAME);
        }
        
        return res.json({
            success: true,
            message: '内存优化已执行'
        });
    } catch (error) {
        logger.error('内存优化失败', MODULE_NAME, { 
            error: error instanceof Error ? error.message : String(error) 
        });
        return res.status(500).json({
            success: false,
            error: '内存优化失败'
        });
    }
});

export default router; 