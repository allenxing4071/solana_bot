/**
 * 设置API路由
 * 处理系统配置和设置相关的所有请求
 */

import express from 'express';
import * as settingsController from '../controllers/settings_controller';

const router = express.Router();

/**
 * @route   GET /api/settings
 * @desc    获取系统设置
 * @access  Public
 */
router.get('/', settingsController.getSettings);

/**
 * @route   POST /api/settings
 * @desc    保存系统设置
 * @access  Public
 */
router.post('/', settingsController.saveSettings);

/**
 * @route   POST /api/settings/apply
 * @desc    应用系统设置
 * @access  Public
 */
router.post('/apply', settingsController.applySettings);

export default router; 