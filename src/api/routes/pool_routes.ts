/**
 * 流动性池路由模块
 * 定义与流动性池操作相关的所有API路由
 */

import express from 'express';
import * as poolController from '../controllers/pool_controller.js';

const router = express.Router();

/**
 * @route   GET /api/pools
 * @desc    获取所有流动性池
 */
router.get('/', poolController.getAllPools);

/**
 * @route   GET /api/pools/:address
 * @desc    获取单个流动性池详情
 */
router.get('/:address', poolController.getPoolDetails);

/**
 * @route   GET /api/pools/dex/:dexName
 * @desc    获取指定DEX的所有流动性池
 */
router.get('/dex/:dexName', poolController.getPoolsByDex);

/**
 * @route   GET /api/pools/token/:mint
 * @desc    获取包含指定代币的所有流动性池
 */
router.get('/token/:mint', poolController.getPoolsByToken);

/**
 * @route   GET /api/pools/stats
 * @desc    获取所有池子的统计信息
 */
router.get('/stats', poolController.getPoolStats);

export default router; 