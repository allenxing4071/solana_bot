/**
 * 代币路由模块
 * 处理与代币黑/白名单和详情相关的所有请求
 */

import express from 'express';
import * as tokenController from '../controllers/token_controller';
import * as tokenDetailsController from '../controllers/token_details_controller';

const router = express.Router();

/**
 * @route   GET /api/tokens/blacklist
 * @desc    获取所有黑名单代币
 */
router.get('/blacklist', tokenController.getBlacklist);

/**
 * @route   POST /api/tokens/blacklist
 * @desc    添加代币到黑名单
 */
router.post('/blacklist', tokenController.addToBlacklist);

/**
 * @route   DELETE /api/tokens/blacklist/:mint
 * @desc    从黑名单中移除代币
 */
router.delete('/blacklist/:mint', tokenController.removeFromBlacklist);

/**
 * @route   GET /api/tokens/whitelist
 * @desc    获取所有白名单代币
 */
router.get('/whitelist', tokenController.getWhitelist);

/**
 * @route   POST /api/tokens/whitelist
 * @desc    添加代币到白名单
 */
router.post('/whitelist', tokenController.addToWhitelist);

/**
 * @route   DELETE /api/tokens/whitelist/:mint
 * @desc    从白名单中移除代币
 */
router.delete('/whitelist/:mint', tokenController.removeFromWhitelist);

/**
 * @route   GET /api/tokens/validate/:mint
 * @desc    验证代币是否在白名单或黑名单中
 */
router.get('/validate/:mint', tokenController.validateToken);

/**
 * @route   GET /api/tokens/all
 * @desc    获取所有代币
 */
router.get('/all', tokenController.getAllTokens);

/**
 * @route   GET /api/tokens/details
 * @desc    获取代币详情
 */
router.get('/details', tokenDetailsController.getTokenDetails);

/**
 * @route   GET /api/tokens
 * @desc    获取代币列表
 */
router.get('/', tokenDetailsController.getTokensList);

export default router; 