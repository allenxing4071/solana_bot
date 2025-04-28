/**
 * 系统状态API路由
 * 提供系统状态、内存使用、性能指标等信息
 */

import express from 'express';
import * as os from 'node:os';
import * as v8 from 'node:v8';
import logger from '../../core/logger.js';
import * as systemController from '../controllers/system_controller.js';

const router = express.Router();
const MODULE_NAME = 'SystemApi';

// 使用控制器方法处理请求 - 仅使用新标准路径
router.get('/status', systemController.getSystemStatus);
router.get('/memory', systemController.getMemory);
router.get('/start', systemController.startSystem);
router.get('/stop', systemController.stopSystem);
router.get('/optimize', systemController.optimizeMemory);

// 直接返回CPU数据 - 简化版
router.get('/cpu', (req, res) => {
  logger.debug('CPU使用率请求', MODULE_NAME);
  
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
  } catch (error) {
    logger.error(`获取CPU数据失败: ${error instanceof Error ? error.message : String(error)}`, MODULE_NAME);
    res.status(500).json({
      success: false,
      error: '获取CPU数据失败'
    });
  }
});

// 直接返回内存数据 - 简化版
router.get('/memory/simple', (req, res) => {
  logger.debug('简单内存数据请求', MODULE_NAME);
  
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
  } catch (error) {
    logger.error(`获取内存数据失败: ${error instanceof Error ? error.message : String(error)}`, MODULE_NAME);
    res.status(500).json({
      success: false,
      error: '获取内存数据失败'
    });
  }
});

// 健康检查接口 - 用于快速检测API服务状态
router.get('/health', (_req, res) => {
  logger.debug('健康检查请求', MODULE_NAME);
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 兼容旧路径的健康检查接口
router.get('/system/health', (_req, res) => {
  logger.debug('健康检查请求(旧路径)', MODULE_NAME);
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router; 