/**
 * 系统状态API路由
 * 提供系统状态、内存使用、性能指标等信息
 */

import express from 'express';
import * as os from 'node:os';
import * as v8 from 'node:v8';
import logger from '../../core/logger';
import * as systemController from '../controllers/system_controller';

const router = express.Router();
const MODULE_NAME = 'SystemApi';

// 使用控制器方法处理请求
router.get('/status', systemController.getSystemStatus);
router.post('/start', systemController.startSystem);
router.post('/stop', systemController.stopSystem);
router.post('/optimize-memory', systemController.optimizeMemory);
router.get('/memory-stats', systemController.getMemoryStats);

export default router; 