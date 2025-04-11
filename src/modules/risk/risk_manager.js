"use strict";
/**
 * 风险控制与资金管理系统
 * 负责管理交易风险，控制资金分配，确保系统安全运行
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.RiskManager = exports.RiskLevel = void 0;
var logger_1 = __importDefault(require("../../core/logger"));
// 模块名称
var MODULE_NAME = 'RiskManager';
/**
 * 风险级别枚举
 */
var RiskLevel;
(function (RiskLevel) {
    RiskLevel[RiskLevel["VERY_LOW"] = 1] = "VERY_LOW";
    RiskLevel[RiskLevel["LOW"] = 2] = "LOW";
    RiskLevel[RiskLevel["MEDIUM"] = 3] = "MEDIUM";
    RiskLevel[RiskLevel["HIGH"] = 4] = "HIGH";
    RiskLevel[RiskLevel["VERY_HIGH"] = 5] = "VERY_HIGH";
})(RiskLevel = exports.RiskLevel || (exports.RiskLevel = {}));
/**
 * 风险控制与资金管理系统类
 * 负责控制交易风险和资金分配
 */
var RiskManager = /** @class */ (function () {
    /**
     * 构造函数
     */
    function RiskManager() {
        // 每日统计数据
        this.dailyStats = new Map();
        // 风险报告缓存
        this.riskReportCache = new Map();
        // 紧急停止标志
        this.emergencyStop = false;
        // 黑名单代币
        this.blacklistedTokens = new Set();
        // 初始化默认交易限额
        this.tradingLimits = {
            maxDailyTrades: 20,
            maxDailyInvestment: 1000,
            maxSingleTradeAmount: 100,
            minSingleTradeAmount: 10,
            maxOpenPositions: 5,
            maxTotalExposure: 2000,
            maxExposurePerToken: 300,
            emergencyStopLoss: 15
        };
        // 初始化风险评分标准
        this.scoringCriteria = {
            liquidityWeight: 0.25,
            volatilityWeight: 0.15,
            ageWeight: 0.15,
            marketCapWeight: 0.15,
            holderCountWeight: 0.1,
            devActivityWeight: 0.1,
            socialMediaWeight: 0.1
        };
        // 初始化当日统计
        this.initializeDailyStats();
        // 加载黑名单
        this.loadBlacklist();
        logger_1["default"].info('风险控制与资金管理系统初始化完成', MODULE_NAME);
    }
    /**
     * 初始化每日统计数据
     */
    RiskManager.prototype.initializeDailyStats = function () {
        var today = this.getDateString();
        if (!this.dailyStats.has(today)) {
            this.dailyStats.set(today, {
                date: today,
                tradeCount: 0,
                totalInvested: 0,
                successfulTrades: 0,
                failedTrades: 0,
                profit: 0
            });
        }
        logger_1["default"].debug('每日交易统计初始化完成', MODULE_NAME);
    };
    /**
     * 获取当前日期字符串(YYYY-MM-DD)
     */
    RiskManager.prototype.getDateString = function () {
        var now = new Date();
        return "".concat(now.getFullYear(), "-").concat(String(now.getMonth() + 1).padStart(2, '0'), "-").concat(String(now.getDate()).padStart(2, '0'));
    };
    /**
     * 加载代币黑名单
     */
    RiskManager.prototype.loadBlacklist = function () {
        // 这里应该从配置或数据库加载黑名单
        // 简化示例:
        // 添加一些示例黑名单代币
        // 实际应用中应从配置加载
        this.blacklistedTokens.add('FakeSolana1111111111111111111111111111111');
        this.blacklistedTokens.add('ScamToken22222222222222222222222222222222');
        logger_1["default"].info("\u5DF2\u52A0\u8F7D ".concat(this.blacklistedTokens.size, " \u4E2A\u9ED1\u540D\u5355\u4EE3\u5E01"), MODULE_NAME);
    };
    /**
     * 检查是否存在紧急停止状态
     * @returns 是否处于紧急停止状态
     */
    RiskManager.prototype.isEmergencyStopped = function () {
        return this.emergencyStop;
    };
    /**
     * 触发紧急停止
     * @param reason 停止原因
     */
    RiskManager.prototype.triggerEmergencyStop = function (reason) {
        this.emergencyStop = true;
        logger_1["default"].warn("\u89E6\u53D1\u7D27\u6025\u505C\u6B62: ".concat(reason), MODULE_NAME);
        // 这里应该添加紧急通知逻辑
        // 例如发送邮件或短信通知
    };
    /**
     * 解除紧急停止状态
     */
    RiskManager.prototype.clearEmergencyStop = function () {
        this.emergencyStop = false;
        logger_1["default"].info('已解除紧急停止状态', MODULE_NAME);
    };
    /**
     * 验证是否可以交易
     * @param positions 当前持仓列表
     * @returns 是否允许继续交易
     */
    RiskManager.prototype.canTrade = function (positions) {
        // 检查紧急停止状态
        if (this.isEmergencyStopped()) {
            logger_1["default"].warn('交易被禁止: 系统处于紧急停止状态', MODULE_NAME);
            return false;
        }
        // 检查今日交易次数限制
        var today = this.getDateString();
        var stats = this.dailyStats.get(today);
        if (!stats) {
            this.initializeDailyStats();
            return true;
        }
        if (stats.tradeCount >= this.tradingLimits.maxDailyTrades) {
            logger_1["default"].warn('交易被禁止: 已达到每日最大交易次数', MODULE_NAME, {
                current: stats.tradeCount,
                limit: this.tradingLimits.maxDailyTrades
            });
            return false;
        }
        // 检查持仓数量限制
        if (positions.length >= this.tradingLimits.maxOpenPositions) {
            logger_1["default"].warn('交易被禁止: 已达到最大持仓数量', MODULE_NAME, {
                current: positions.length,
                limit: this.tradingLimits.maxOpenPositions
            });
            return false;
        }
        // 检查每日投资额度限制
        if (stats.totalInvested >= this.tradingLimits.maxDailyInvestment) {
            logger_1["default"].warn('交易被禁止: 已达到每日最大投资额度', MODULE_NAME, {
                current: stats.totalInvested,
                limit: this.tradingLimits.maxDailyInvestment
            });
            return false;
        }
        // 检查总风险敞口
        var totalExposure = this.calculateTotalExposure(positions);
        if (totalExposure >= this.tradingLimits.maxTotalExposure) {
            logger_1["default"].warn('交易被禁止: 已达到最大风险敞口', MODULE_NAME, {
                current: totalExposure,
                limit: this.tradingLimits.maxTotalExposure
            });
            return false;
        }
        return true;
    };
    /**
     * 计算当前总风险敞口
     * @param positions 持仓列表
     * @returns 总风险敞口(USD)
     */
    RiskManager.prototype.calculateTotalExposure = function (positions) {
        var totalExposure = 0;
        for (var _i = 0, positions_1 = positions; _i < positions_1.length; _i++) {
            var position = positions_1[_i];
            var price = position.currentPrice || position.avgBuyPrice || 0;
            var amount = Number(position.amount) / Math.pow(10, position.token.decimals || 0);
            totalExposure += price * amount;
        }
        return totalExposure;
    };
    /**
     * 计算代币风险评分
     * @param token 代币信息
     * @param opportunity 交易机会
     * @returns 风险评分(1-5，1最低风险)
     */
    RiskManager.prototype.calculateTokenRisk = function (token, opportunity) {
        // 默认风险级别
        var riskScore = 3;
        // 检查是否黑名单代币
        if (this.blacklistedTokens.has(token.mint.toBase58())) {
            return RiskLevel.VERY_HIGH; // 黑名单代币直接判定为最高风险
        }
        // 应用各种风险评估标准
        // 1. 流动性风险
        var liquidityUsd = opportunity.liquidityUsd || 0;
        if (liquidityUsd > 100000) {
            riskScore -= 0.5; // 流动性高，风险降低
        }
        else if (liquidityUsd < 10000) {
            riskScore += 1; // 流动性低，风险增加
        }
        // 2. 代币年龄
        var ageInHours = (Date.now() - opportunity.pool.createdAt) / (1000 * 60 * 60);
        if (ageInHours < 1) {
            riskScore += 1; // 新代币风险高
        }
        else if (ageInHours > 48) {
            riskScore -= 0.5; // 存在时间长风险较低
        }
        // 3. 价格影响
        var priceImpact = opportunity.estimatedSlippage || 0;
        if (priceImpact > 5) {
            riskScore += 0.5; // 价格影响大风险增加
        }
        // 4. 代币验证状态
        if (token.isVerified) {
            riskScore -= 1; // 已验证代币风险低
        }
        if (token.isBlacklisted) {
            riskScore += 2; // 黑名单代币高风险
        }
        // 确保评分在1-5范围内
        riskScore = Math.max(1, Math.min(5, riskScore));
        return Math.round(riskScore);
    };
    /**
     * 生成完整风险报告
     * @param token 代币信息
     * @param opportunity 交易机会
     * @param positions 当前持仓列表
     * @returns 风险报告
     */
    RiskManager.prototype.generateRiskReport = function (token, opportunity, positions) {
        // 计算各方面风险
        var tokenRisk = this.calculateTokenRisk(token, opportunity);
        // 市场风险
        var marketRisk = RiskLevel.MEDIUM;
        var volatility = 0.3; // 示例值，实际应从市场数据获取
        if (volatility > 0.5) {
            marketRisk = RiskLevel.HIGH;
        }
        else if (volatility < 0.2) {
            marketRisk = RiskLevel.LOW;
        }
        // 流动性风险
        var liquidityRisk = RiskLevel.MEDIUM;
        var liquidityUsd = opportunity.liquidityUsd || 0;
        if (liquidityUsd > 100000) {
            liquidityRisk = RiskLevel.LOW;
        }
        else if (liquidityUsd < 10000) {
            liquidityRisk = RiskLevel.HIGH;
        }
        // 敞口风险
        var exposureRisk = RiskLevel.LOW;
        var totalExposure = this.calculateTotalExposure(positions);
        var maxExposureRatio = totalExposure / this.tradingLimits.maxTotalExposure;
        if (maxExposureRatio > 0.8) {
            exposureRisk = RiskLevel.HIGH;
        }
        else if (maxExposureRatio > 0.5) {
            exposureRisk = RiskLevel.MEDIUM;
        }
        // 计算整体风险
        var overallRisk = Math.round((tokenRisk * 0.4 +
            marketRisk * 0.2 +
            liquidityRisk * 0.2 +
            exposureRisk * 0.2));
        // 生成建议
        var recommendation = '';
        switch (overallRisk) {
            case RiskLevel.VERY_LOW:
            case RiskLevel.LOW:
                recommendation = '建议正常交易，风险较低';
                break;
            case RiskLevel.MEDIUM:
                recommendation = '建议谨慎交易，使用中等资金比例';
                break;
            case RiskLevel.HIGH:
                recommendation = '建议限制交易规模，使用较小资金比例';
                break;
            case RiskLevel.VERY_HIGH:
                recommendation = '不建议交易，风险过高';
                break;
        }
        // 构建风险报告
        var report = {
            overallRisk: overallRisk,
            tokenRisk: tokenRisk,
            marketRisk: marketRisk,
            liquidityRisk: liquidityRisk,
            exposureRisk: exposureRisk,
            details: {
                tokenAge: (Date.now() - opportunity.pool.createdAt) / (1000 * 60 * 60) + '小时',
                liquidityUsd: liquidityUsd + ' USD',
                totalExposure: totalExposure + ' USD',
                maxExposureRatio: (maxExposureRatio * 100) + '%',
                volatility: (volatility * 100) + '%',
                isVerified: token.isVerified ? '是' : '否',
                isBlacklisted: token.isBlacklisted ? '是' : '否'
            },
            timestamp: Date.now(),
            recommendation: recommendation
        };
        // 缓存风险报告
        this.riskReportCache.set(token.mint.toBase58(), report);
        logger_1["default"].debug("\u5DF2\u751F\u6210\u4EE3\u5E01\u98CE\u9669\u62A5\u544A: ".concat(token.symbol || token.mint.toBase58()), MODULE_NAME, {
            overallRisk: overallRisk,
            tokenRisk: tokenRisk,
            recommendation: recommendation
        });
        return report;
    };
    /**
     * 计算交易资金分配
     * @param token 代币信息
     * @param opportunity 交易机会
     * @param positions 当前持仓列表
     * @returns 分配结果
     */
    RiskManager.prototype.allocateFunds = function (token, opportunity, positions) {
        // 检查交易合法性
        if (!this.canTrade(positions)) {
            return {
                approved: false,
                allocatedAmount: 0,
                maxAmount: 0,
                remainingDailyBudget: 0,
                remainingTotalBudget: 0,
                reason: '交易被系统限制'
            };
        }
        // 获取风险报告
        var riskReport = this.riskReportCache.get(token.mint.toBase58());
        if (!riskReport) {
            riskReport = this.generateRiskReport(token, opportunity, positions);
        }
        // 根据风险级别调整分配金额
        var allocatedAmount = this.tradingLimits.maxSingleTradeAmount;
        switch (riskReport.overallRisk) {
            case RiskLevel.VERY_LOW:
                // 低风险，使用100%的单笔上限
                break;
            case RiskLevel.LOW:
                // 较低风险，使用80%的单笔上限
                allocatedAmount *= 0.8;
                break;
            case RiskLevel.MEDIUM:
                // 中等风险，使用60%的单笔上限
                allocatedAmount *= 0.6;
                break;
            case RiskLevel.HIGH:
                // 高风险，使用30%的单笔上限
                allocatedAmount *= 0.3;
                break;
            case RiskLevel.VERY_HIGH:
                // 极高风险，不分配资金
                return {
                    approved: false,
                    allocatedAmount: 0,
                    maxAmount: this.tradingLimits.maxSingleTradeAmount,
                    remainingDailyBudget: this.getRemainingDailyBudget(),
                    remainingTotalBudget: this.tradingLimits.maxTotalExposure - this.calculateTotalExposure(positions),
                    reason: '风险过高，拒绝分配资金'
                };
        }
        // 确保不超过单笔最大额度
        allocatedAmount = Math.min(allocatedAmount, this.tradingLimits.maxSingleTradeAmount);
        // 确保不超过剩余每日预算
        var remainingDailyBudget = this.getRemainingDailyBudget();
        allocatedAmount = Math.min(allocatedAmount, remainingDailyBudget);
        // 确保不小于最小交易金额
        if (allocatedAmount < this.tradingLimits.minSingleTradeAmount) {
            return {
                approved: false,
                allocatedAmount: 0,
                maxAmount: this.tradingLimits.maxSingleTradeAmount,
                remainingDailyBudget: remainingDailyBudget,
                remainingTotalBudget: this.tradingLimits.maxTotalExposure - this.calculateTotalExposure(positions),
                reason: '分配金额低于最小交易金额'
            };
        }
        // 批准资金分配
        return {
            approved: true,
            allocatedAmount: allocatedAmount,
            maxAmount: this.tradingLimits.maxSingleTradeAmount,
            remainingDailyBudget: remainingDailyBudget,
            remainingTotalBudget: this.tradingLimits.maxTotalExposure - this.calculateTotalExposure(positions),
            reason: '资金分配成功'
        };
    };
    /**
     * 获取剩余每日预算
     * @returns 剩余预算(USD)
     */
    RiskManager.prototype.getRemainingDailyBudget = function () {
        var today = this.getDateString();
        var stats = this.dailyStats.get(today);
        if (!stats) {
            this.initializeDailyStats();
            return this.tradingLimits.maxDailyInvestment;
        }
        return Math.max(0, this.tradingLimits.maxDailyInvestment - stats.totalInvested);
    };
    /**
     * 记录交易结果
     * @param result 交易结果
     * @param amount 交易金额(USD)
     */
    RiskManager.prototype.recordTradeResult = function (result, amount) {
        var today = this.getDateString();
        var stats = this.dailyStats.get(today);
        if (!stats) {
            this.initializeDailyStats();
            stats = this.dailyStats.get(today);
        }
        // 更新统计数据
        stats.tradeCount++;
        stats.totalInvested += amount;
        if (result.success) {
            stats.successfulTrades++;
            // 如果有利润数据，也可以累加
            if (result.price) {
                // 简化处理，实际应该基于买入卖出计算利润
            }
        }
        else {
            stats.failedTrades++;
        }
        // 更新统计数据
        this.dailyStats.set(today, stats);
        logger_1["default"].debug('已记录交易结果', MODULE_NAME, {
            success: result.success,
            amount: amount,
            dailyTotal: stats.totalInvested
        });
        // 检查是否需要紧急止损
        this.checkEmergencyConditions(stats);
    };
    /**
     * 检查是否触发紧急条件
     * @param stats 每日统计数据
     */
    RiskManager.prototype.checkEmergencyConditions = function (stats) {
        // 检查失败率
        if (stats.tradeCount > 5 && stats.failedTrades / stats.tradeCount > 0.5) {
            this.triggerEmergencyStop('交易失败率过高，超过50%');
        }
        // 检查亏损率
        if (stats.profit < 0 && Math.abs(stats.profit) / stats.totalInvested > this.tradingLimits.emergencyStopLoss / 100) {
            this.triggerEmergencyStop("\u65E5\u4E8F\u635F\u7387\u8D85\u8FC7\u8BBE\u5B9A\u9608\u503C".concat(this.tradingLimits.emergencyStopLoss, "%"));
        }
    };
    /**
     * 获取交易限额配置
     * @returns 交易限额配置
     */
    RiskManager.prototype.getTradingLimits = function () {
        return __assign({}, this.tradingLimits);
    };
    /**
     * 更新交易限额配置
     * @param limits 新的限额配置
     */
    RiskManager.prototype.updateTradingLimits = function (limits) {
        this.tradingLimits = __assign(__assign({}, this.tradingLimits), limits);
        logger_1["default"].info('已更新交易限额配置', MODULE_NAME, {
            maxDailyTrades: this.tradingLimits.maxDailyTrades,
            maxDailyInvestment: this.tradingLimits.maxDailyInvestment,
            maxSingleTradeAmount: this.tradingLimits.maxSingleTradeAmount
        });
    };
    /**
     * 获取今日交易统计
     * @returns 今日统计数据
     */
    RiskManager.prototype.getTodayStats = function () {
        var today = this.getDateString();
        var stats = this.dailyStats.get(today);
        if (!stats) {
            this.initializeDailyStats();
            stats = this.dailyStats.get(today);
        }
        return __assign({}, stats);
    };
    /**
     * 检查代币是否在黑名单中
     * @param mintAddress 代币Mint地址
     * @returns 是否在黑名单中
     */
    RiskManager.prototype.isBlacklisted = function (mintAddress) {
        var mintString = typeof mintAddress === 'string' ? mintAddress : mintAddress.toBase58();
        return this.blacklistedTokens.has(mintString);
    };
    /**
     * 添加代币到黑名单
     * @param mintAddress 代币Mint地址
     * @param reason 添加原因
     */
    RiskManager.prototype.addToBlacklist = function (mintAddress, reason) {
        var mintString = typeof mintAddress === 'string' ? mintAddress : mintAddress.toBase58();
        this.blacklistedTokens.add(mintString);
        logger_1["default"].info("\u5DF2\u5C06\u4EE3\u5E01\u6DFB\u52A0\u5230\u9ED1\u540D\u5355: ".concat(mintString), MODULE_NAME, { reason: reason });
        // 这里可以添加持久化存储逻辑
    };
    /**
     * 从黑名单移除代币
     * @param mintAddress 代币Mint地址
     */
    RiskManager.prototype.removeFromBlacklist = function (mintAddress) {
        var mintString = typeof mintAddress === 'string' ? mintAddress : mintAddress.toBase58();
        var removed = this.blacklistedTokens["delete"](mintString);
        if (removed) {
            logger_1["default"].info("\u5DF2\u4ECE\u9ED1\u540D\u5355\u79FB\u9664\u4EE3\u5E01: ".concat(mintString), MODULE_NAME);
            // 这里可以添加持久化存储逻辑
        }
    };
    return RiskManager;
}());
exports.RiskManager = RiskManager;
// 导出单例实例
var riskManager = new RiskManager();
exports["default"] = riskManager;
