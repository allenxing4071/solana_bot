/**
 * 系统状态API路由
 * 提供系统状态、内存使用、性能指标等信息
 */

import express from 'express';
import * as systemController from '../controllers/system_controller';

const router = express.Router();

// 获取系统状态数据
router.get('/status', systemController.getSystemStatus);

// 启动系统
router.post('/start', systemController.startSystem);

// 停止系统
router.post('/stop', systemController.stopSystem);

// 优化内存
router.post('/optimize-memory', systemController.optimizeMemory);

// 获取内存统计数据
router.get('/memory-stats', systemController.getMemoryStats);

export default router; 