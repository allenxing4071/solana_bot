"use strict";
/**
 * 代币路由模块
 * 处理与代币黑/白名单和详情相关的所有请求
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
const tokenController = __importStar(require("../controllers/token_controller"));
const tokenDetailsController = __importStar(require("../controllers/token_details_controller"));
const router = express_1.default.Router();
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
exports.default = router;
