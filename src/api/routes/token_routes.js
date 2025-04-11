"use strict";
/**
 * 代币路由模块
 * 定义与代币操作相关的所有API路由
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var express_1 = __importDefault(require("express"));
var tokenController = __importStar(require("../controllers/token_controller"));
var router = express_1["default"].Router();
/**
 * @route   GET /api/tokens/blacklist
 * @desc    获取所有黑名单代币
 * @access  Public
 */
router.get('/blacklist', tokenController.getBlacklist);
/**
 * @route   POST /api/tokens/blacklist
 * @desc    添加代币到黑名单
 * @access  Public
 */
router.post('/blacklist', tokenController.addToBlacklist);
/**
 * @route   DELETE /api/tokens/blacklist/:mint
 * @desc    从黑名单中移除代币
 * @access  Public
 */
router["delete"]('/blacklist/:mint', tokenController.removeFromBlacklist);
/**
 * @route   GET /api/tokens/whitelist
 * @desc    获取所有白名单代币
 * @access  Public
 */
router.get('/whitelist', tokenController.getWhitelist);
/**
 * @route   POST /api/tokens/whitelist
 * @desc    添加代币到白名单
 * @access  Public
 */
router.post('/whitelist', tokenController.addToWhitelist);
/**
 * @route   DELETE /api/tokens/whitelist/:mint
 * @desc    从白名单中移除代币
 * @access  Public
 */
router["delete"]('/whitelist/:mint', tokenController.removeFromWhitelist);
/**
 * @route   GET /api/tokens/validate/:mint
 * @desc    验证代币是否在白名单或黑名单中
 * @access  Public
 */
router.get('/validate/:mint', tokenController.validateToken);
exports["default"] = router;
