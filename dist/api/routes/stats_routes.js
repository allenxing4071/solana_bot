"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stats_controller_1 = require("../controllers/stats_controller");
const logger_1 = __importDefault(require("../../core/logger"));
const MODULE_NAME = 'StatsRoutes';
const router = (0, express_1.Router)();
// 统计API路由
// 利润趋势接口
router.get('/profit/trend', (req, res) => {
    logger_1.default.debug('收到利润趋势请求', MODULE_NAME);
    (0, stats_controller_1.getProfitTrend)(req, res);
});
// 代币趋势接口
router.get('/token/trend', (req, res) => {
    logger_1.default.debug('收到代币趋势请求', MODULE_NAME);
    (0, stats_controller_1.getTokenTrend)(req, res);
});
// 利润摘要接口
router.get('/profit/summary', (req, res) => {
    logger_1.default.debug('收到利润摘要请求', MODULE_NAME);
    (0, stats_controller_1.getProfitSummary)(req, res);
});
// 系统性能统计接口
router.get('/system', (req, res) => {
    logger_1.default.debug('收到系统性能统计请求', MODULE_NAME);
    (0, stats_controller_1.getSystemStats)(req, res);
});
// 交易统计接口
router.get('/transactions', (req, res) => {
    logger_1.default.debug('收到交易统计请求', MODULE_NAME);
    (0, stats_controller_1.getTransactionStats)(req, res);
});
// 代币统计接口
router.get('/tokens', (req, res) => {
    logger_1.default.debug('收到代币统计请求', MODULE_NAME);
    (0, stats_controller_1.getTokenStats)(req, res);
});
// 兼容旧路径的路由
router.get('/profit_trend', (req, res) => {
    logger_1.default.debug('收到旧路径利润趋势请求', MODULE_NAME);
    (0, stats_controller_1.getProfitTrend)(req, res);
});
router.get('/token_trend', (req, res) => {
    logger_1.default.debug('收到旧路径代币趋势请求', MODULE_NAME);
    (0, stats_controller_1.getTokenTrend)(req, res);
});
router.get('/profit_summary', (req, res) => {
    logger_1.default.debug('收到旧路径利润摘要请求', MODULE_NAME);
    (0, stats_controller_1.getProfitSummary)(req, res);
});
exports.default = router;
