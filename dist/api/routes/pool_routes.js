"use strict";
/**
 * 流动性池路由模块
 * 定义与流动性池操作相关的所有API路由
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
const poolController = __importStar(require("../controllers/pool_controller"));
const router = express_1.default.Router();
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
exports.default = router;
