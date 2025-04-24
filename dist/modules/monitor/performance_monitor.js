"use strict";
/**
 * 性能监控系统（渔船航行状态监测中心）
 * 负责监控系统性能指标，自动分析系统瓶颈，提供优化建议
 *
 * 【编程基础概念通俗比喻】
 * 1. 性能监控(Performance Monitor) = 船舶仪表盘:
 *    就像船长的控制台，实时显示船只各部分的工作状态
 *    例如：CPU使用率就像引擎的转速表
 *
 * 2. 资源指标(Metrics) = 航行指标:
 *    船舶航行中需要关注的各种数据
 *    例如：内存使用率就像船舱的载重量
 *
 * 3. 性能警报(Alert) = 船舶警告信号:
 *    当某些指标超出安全范围时发出的警告
 *    例如：CPU过高警报就像引擎过热警告灯
 *
 * 4. 瓶颈分析(Bottleneck Analysis) = 航行障碍检测:
 *    找出限制船只速度的因素
 *    例如：网络延迟瓶颈就像船只遇到了强逆流
 *
 * 5. 响应时间(Response Time) = 操作反应时间:
 *    从发出指令到执行完成所需的时间
 *    例如：交易延迟就像从下达捕鱼指令到网具完全展开的时间
 *
 * 【比喻解释】
 * 这个模块就像渔船的导航控制室：
 * - 监测渔船各系统的工作状态(监控系统性能)
 * - 及时发现引擎过热或燃油不足等问题(检测性能瓶颈)
 * - 当风浪过大或设备异常时发出警报(性能警报系统)
 * - 记录航行过程中的各项数据供日后分析(指标历史记录)
 * - 向船长提供最佳航线和渔场建议(优化建议)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMonitor = exports.AlertLevel = void 0;
const node_os_1 = __importDefault(require("node:os"));
const node_events_1 = require("node:events");
const logger_1 = __importDefault(require("../../core/logger"));
// 模块名称
// 就像船舶控制中心的门牌
const MODULE_NAME = 'PerformanceMonitor';
/**
 * 性能警报级别枚举
 *
 * 【比喻解释】
 * 就像船舶警报的紧急程度：
 * - 信息(INFO)：值得注意但不紧急的情况
 * - 警告(WARNING)：需要关注的潜在问题
 * - 严重(CRITICAL)：需要立即处理的紧急情况
 */
var AlertLevel;
(function (AlertLevel) {
    AlertLevel["INFO"] = "info";
    AlertLevel["WARNING"] = "warning";
    AlertLevel["CRITICAL"] = "critical"; // 严重级别，就像船体进水警报
})(AlertLevel || (exports.AlertLevel = AlertLevel = {}));
/**
 * 性能监控系统类
 *
 * 【比喻解释】
 * 这就像渔船的航行状态监控室：
 * - 不断检查船只各部分的工作情况(收集指标)
 * - 记录航行过程中的各种数据(保存历史)
 * - 在出现异常时及时发出警报(触发警报)
 * - 计算捕鱼效率和资源消耗(分析性能)
 * - 向船长提供航行建议(生成报告)
 *
 * 【编程语法通俗翻译】
 * class = 专业系统：船上的一套完整设备
 * private = 内部组件：只有系统内部才能使用的部分
 * extends = 升级版：在基础设备上增加新功能
 */
class PerformanceMonitor extends node_events_1.EventEmitter {
    /**
     * 构造函数
     * @param config 监控配置
     */
    constructor(config) {
        super();
        // 监控定时器
        this.monitorInterval = null;
        // 性能历史数据
        this.metricsHistory = [];
        // 响应时间记录
        this.responseTimeRecords = new Map();
        // 操作计数器
        this.operationCounters = new Map();
        // 最后测量的网络流量
        this.lastNetworkStats = {
            in: 0,
            out: 0,
            timestamp: Date.now()
        };
        // 活跃请求计数
        this.activeRequests = 0;
        // 默认配置
        this.config = {
            interval: 5000, // 5秒监控一次
            memoryWarningThreshold: 80, // 80%内存使用率警告
            cpuWarningThreshold: 70, // 70%CPU使用率警告
            tradeLatencyWarningThreshold: 1000, // 1秒交易延迟警告
            errorRateWarningThreshold: 10, // 10%错误率警告
            autoRestart: false, // 默认不自动重启
            collectHistory: true, // 默认收集历史数据
            historyLength: 100 // 默认保存100条历史记录
        };
        // 合并自定义配置
        if (config) {
            this.config = { ...this.config, ...config };
        }
        logger_1.default.info('性能监控系统初始化完成', MODULE_NAME, {
            interval: this.config.interval,
            autoRestart: this.config.autoRestart
        });
    }
    /**
     * 启动监控
     *
     * 【比喻解释】
     * 就像启动船舶的仪表监控系统：
     * - 确认系统尚未运行(避免重复启动)
     * - 先进行一次全面的系统检查(初始化测量)
     * - 设置定期巡检的时间间隔(定时监控)
     * - 通知船长监控系统已经开始工作(日志记录)
     */
    start() {
        if (this.monitorInterval) {
            logger_1.default.warn('性能监控系统已在运行中', MODULE_NAME);
            return;
        }
        // 初始化指标测量
        this.collectMetrics();
        // 设置定时监控
        this.monitorInterval = setInterval(() => {
            this.collectMetrics();
        }, this.config.interval);
        logger_1.default.info('性能监控系统已启动', MODULE_NAME, {
            interval: this.config.interval
        });
    }
    /**
     * 停止监控
     *
     * 【比喻解释】
     * 就像关闭船舶的仪表监控系统：
     * - 确认监控系统正在运行(避免误操作)
     * - 停止定期的系统检查(清除定时器)
     * - 确认监控停止状态(重置变量)
     * - 通知船长监控系统已经停止工作(日志记录)
     */
    stop() {
        if (!this.monitorInterval) {
            logger_1.default.warn('性能监控系统未在运行', MODULE_NAME);
            return;
        }
        clearInterval(this.monitorInterval);
        this.monitorInterval = null;
        logger_1.default.info('性能监控系统已停止', MODULE_NAME);
    }
    /**
     * 收集性能指标
     *
     * 【比喻解释】
     * 就像船舶工程师巡检整艘船的状态：
     * - 检查船体各个系统的运行状况(收集系统指标)
     * - 评估捕鱼作业的效率数据(收集应用指标)
     * - 监测各种资源的消耗情况(收集资源指标)
     * - 分析当前航行中的主要问题(分析瓶颈)
     * - 记录完整的航行状态报告(创建性能报告)
     * - 检查是否有需要提醒船长的问题(检查警报)
     * - 保存数据到航行日志中(保存历史记录)
     *
     * 【编程语法通俗翻译】
     * try/catch = 安全操作：像是戴着安全装备检查船舱，防止意外事故
     */
    collectMetrics() {
        try {
            // 收集系统指标
            const systemMetrics = this.collectSystemMetrics();
            // 收集应用指标
            const applicationMetrics = this.collectApplicationMetrics();
            // 收集资源使用
            const resourceMetrics = this.collectResourceMetrics();
            // 分析瓶颈
            const bottlenecks = this.analyzeBottlenecks(systemMetrics, applicationMetrics, resourceMetrics);
            // 创建完整性能报告
            const performanceData = {
                system: systemMetrics,
                application: applicationMetrics,
                resources: resourceMetrics,
                bottlenecks,
                timestamp: Date.now()
            };
            // 保存到历史记录
            if (this.config.collectHistory) {
                this.metricsHistory.push(performanceData);
                // 限制历史记录长度
                if (this.metricsHistory.length > this.config.historyLength) {
                    this.metricsHistory.shift();
                }
            }
            // 检查是否需要发出警报
            this.checkAlerts(performanceData);
            // 发出事件
            this.emit('metrics', performanceData);
        }
        catch (error) {
            logger_1.default.error('收集性能指标时出错', MODULE_NAME, {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    /**
     * 收集系统性能指标
     *
     * 【比喻解释】
     * 就像船舶工程师检查船体基础系统：
     * - 检查引擎的运转状况(获取CPU使用率)
     * - 计算船舱的载重情况(获取内存使用)
     * - 记录船只航行的持续时间(获取运行时间)
     * - 整理成一份船体状态报告(返回指标集合)
     */
    collectSystemMetrics() {
        // 获取CPU使用率
        const cpuUsage = this.getCpuUsage();
        // 获取内存使用情况
        const totalMemory = Math.round(node_os_1.default.totalmem() / (1024 * 1024)); // MB
        const freeMemory = Math.round(node_os_1.default.freemem() / (1024 * 1024)); // MB
        const usedMemory = totalMemory - freeMemory;
        const memoryUsage = Math.round((usedMemory / totalMemory) * 100);
        // 获取系统运行时间
        const uptime = Math.round(process.uptime());
        return {
            cpuUsage,
            memoryUsage,
            totalMemory,
            usedMemory,
            uptime,
            lastUpdateTime: Date.now()
        };
    }
    /**
     * 获取CPU使用率
     *
     * 【比喻解释】
     * 就像测量船舶引擎的工作负荷：
     * - 检查每个引擎气缸的运行情况(遍历所有CPU核心)
     * - 记录每个气缸的工作时间和空闲时间(获取CPU时间)
     * - 计算整个引擎组的平均负荷水平(计算使用率)
     * - 将负荷水平转换为百分比格式(格式化结果)
     */
    getCpuUsage() {
        const cpus = node_os_1.default.cpus();
        let totalIdle = 0;
        let totalTick = 0;
        // 计算所有CPU核心的使用率
        for (const cpu of cpus) {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        }
        // 计算使用率
        const idle = totalIdle / cpus.length;
        const total = totalTick / cpus.length;
        const usage = Math.round(100 - (idle / total) * 100);
        return usage;
    }
    /**
     * 收集应用性能指标
     *
     * 【比喻解释】
     * 就像评估船上捕鱼作业的效率：
     * - 测量雷达响应的速度(计算RPC响应时间)
     * - 评估从投网到收网的平均时间(计算交易延迟)
     * - 记录捕捞的成功率(计算交易成功率)
     * - 统计每小时捕获的鱼量(计算交易处理速度)
     * - 监测正在观察的渔场数量(获取监控池数)
     * - 分析作业中出现问题的频率(计算错误率)
     * - 整理成一份捕鱼效率报告(返回应用指标)
     */
    collectApplicationMetrics() {
        // 计算平均响应时间
        const rpcResponseTime = this.calculateAverageResponseTime('rpc');
        // 计算平均交易延迟
        const avgTradeLatency = this.calculateAverageResponseTime('trade');
        // 计算交易成功率
        const tradeCounter = this.operationCounters.get('trade') || { total: 0, success: 0, failed: 0 };
        const successRate = tradeCounter.total > 0
            ? Math.round((tradeCounter.success / tradeCounter.total) * 100)
            : 100;
        // 计算错误率
        const errorRate = this.calculateErrorRate();
        // 获取当前监控的池子数量
        const poolsMonitored = this.getMonitoredPoolCount();
        // 获取已执行的交易数量
        const tradesExecuted = tradeCounter.total;
        // 计算每秒交易数
        const transactionsPerSecond = this.calculateTransactionsPerSecond();
        return {
            rpcResponseTime,
            avgTradeLatency,
            transactionsPerSecond,
            successRate,
            poolsMonitored,
            tradesExecuted,
            errorRate
        };
    }
    /**
     * 收集资源使用指标
     */
    collectResourceMetrics() {
        // 获取磁盘使用率 (简化示例)
        const diskUsage = 50; // 实际应该使用文件系统API
        // 获取网络流量 (简化示例)
        const networkStats = this.getNetworkStats();
        // 获取打开的句柄数 (简化示例)
        const openHandles = this.activeRequests;
        return {
            diskUsage,
            networkIn: networkStats.in,
            networkOut: networkStats.out,
            openHandles
        };
    }
    /**
     * 获取网络流量统计
     */
    getNetworkStats() {
        // 简化示例，实际应该使用网络接口API
        const now = Date.now();
        const timeDiff = (now - this.lastNetworkStats.timestamp) / 1000; // 秒
        // 模拟一些网络活动
        const inTraffic = Math.random() * 100; // KB/s
        const outTraffic = Math.random() * 50; // KB/s
        // 保存当前统计
        this.lastNetworkStats = {
            in: inTraffic,
            out: outTraffic,
            timestamp: now
        };
        return {
            in: inTraffic,
            out: outTraffic
        };
    }
    /**
     * 分析系统瓶颈
     */
    analyzeBottlenecks(system, application, resources) {
        const bottlenecks = [];
        // 检查CPU使用率
        if (system.cpuUsage > this.config.cpuWarningThreshold) {
            bottlenecks.push(`CPU使用率过高: ${system.cpuUsage}%`);
        }
        // 检查内存使用率
        if (system.memoryUsage > this.config.memoryWarningThreshold) {
            bottlenecks.push(`内存使用率过高: ${system.memoryUsage}%`);
        }
        // 检查交易延迟
        if (application.avgTradeLatency > this.config.tradeLatencyWarningThreshold) {
            bottlenecks.push(`交易延迟过高: ${application.avgTradeLatency}ms`);
        }
        // 检查错误率
        if (application.errorRate > this.config.errorRateWarningThreshold) {
            bottlenecks.push(`错误率过高: ${application.errorRate}%`);
        }
        // 检查网络活动
        if (resources.networkOut > 500) { // 如果网络出流量超过500KB/s
            bottlenecks.push(`网络出流量较大: ${resources.networkOut}KB/s`);
        }
        return bottlenecks;
    }
    /**
     * 检查是否需要发出警报
     */
    checkAlerts(performance) {
        // 检查CPU使用率
        if (performance.system.cpuUsage > this.config.cpuWarningThreshold) {
            this.triggerAlert({
                level: performance.system.cpuUsage > 90 ? AlertLevel.CRITICAL : AlertLevel.WARNING,
                metric: 'cpuUsage',
                value: performance.system.cpuUsage,
                threshold: this.config.cpuWarningThreshold,
                message: `CPU使用率过高: ${performance.system.cpuUsage}%`,
                recommendation: 'CPU使用率过高可能导致系统响应缓慢。建议检查是否有资源密集型操作，考虑优化或减少并发任务。',
                timestamp: Date.now()
            });
        }
        // 检查内存使用率
        if (performance.system.memoryUsage > this.config.memoryWarningThreshold) {
            this.triggerAlert({
                level: performance.system.memoryUsage > 90 ? AlertLevel.CRITICAL : AlertLevel.WARNING,
                metric: 'memoryUsage',
                value: performance.system.memoryUsage,
                threshold: this.config.memoryWarningThreshold,
                message: `内存使用率过高: ${performance.system.memoryUsage}%`,
                recommendation: '内存使用率过高可能导致系统不稳定或崩溃。建议检查内存泄漏，减少缓存大小，或增加系统内存。',
                timestamp: Date.now()
            });
        }
        // 检查交易延迟
        if (performance.application.avgTradeLatency > this.config.tradeLatencyWarningThreshold) {
            this.triggerAlert({
                level: performance.application.avgTradeLatency > 2000 ? AlertLevel.CRITICAL : AlertLevel.WARNING,
                metric: 'tradeLatency',
                value: performance.application.avgTradeLatency,
                threshold: this.config.tradeLatencyWarningThreshold,
                message: `交易延迟过高: ${performance.application.avgTradeLatency}ms`,
                recommendation: '交易延迟过高会影响抢占交易机会。建议检查网络连接，优化交易执行流程，或使用更快的RPC节点。',
                timestamp: Date.now()
            });
        }
        // 检查错误率
        if (performance.application.errorRate > this.config.errorRateWarningThreshold) {
            this.triggerAlert({
                level: performance.application.errorRate > 20 ? AlertLevel.CRITICAL : AlertLevel.WARNING,
                metric: 'errorRate',
                value: performance.application.errorRate,
                threshold: this.config.errorRateWarningThreshold,
                message: `错误率过高: ${performance.application.errorRate}%`,
                recommendation: '错误率过高表明系统运行不稳定。建议检查日志，修复错误原因，或考虑回滚到稳定版本。',
                timestamp: Date.now()
            });
        }
    }
    /**
     * 触发警报
     */
    triggerAlert(alert) {
        logger_1.default.warn(`性能警报: ${alert.message}`, MODULE_NAME, {
            level: alert.level,
            metric: alert.metric,
            value: alert.value,
            threshold: alert.threshold
        });
        // 发出警报事件
        this.emit('alert', alert);
        // 如果配置了自动重启且是严重警报
        if (this.config.autoRestart && alert.level === AlertLevel.CRITICAL) {
            this.recommendRestart(alert.message);
        }
    }
    /**
     * 建议重启系统
     */
    recommendRestart(reason) {
        logger_1.default.error(`建议重启系统: ${reason}`, MODULE_NAME);
        // 发出重启建议事件
        this.emit('restartRecommended', {
            reason,
            timestamp: Date.now()
        });
    }
    /**
     * 开始监控操作响应时间
     * @param operation 操作名称
     * @param id 操作ID（可选）
     * @returns 操作ID
     */
    startOperation(operation, id) {
        const operationId = id || `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // 创建新的响应时间记录
        const record = {
            operation,
            startTime: Date.now()
        };
        // 获取该操作的记录列表
        let records = this.responseTimeRecords.get(operation);
        if (!records) {
            records = [];
            this.responseTimeRecords.set(operation, records);
        }
        // 添加新记录
        records.push(record);
        // 增加活跃请求计数
        this.activeRequests++;
        return operationId;
    }
    /**
     * 结束监控操作
     * @param operation 操作名称
     * @param id 操作ID
     * @param success 是否成功
     * @param error 错误信息
     */
    endOperation(operation, id, success, error) {
        // 获取操作记录
        const records = this.responseTimeRecords.get(operation);
        if (!records) {
            return;
        }
        // 查找最后一条匹配的记录
        const recordIndex = records.findIndex(r => !r.endTime);
        if (recordIndex === -1) {
            return;
        }
        const record = records[recordIndex];
        // 更新记录
        record.endTime = Date.now();
        record.duration = record.endTime - record.startTime;
        record.success = success;
        record.error = error;
        // 减少活跃请求计数
        this.activeRequests--;
        // 更新操作计数器
        let counter = this.operationCounters.get(operation);
        if (!counter) {
            counter = { total: 0, success: 0, failed: 0 };
            this.operationCounters.set(operation, counter);
        }
        counter.total++;
        if (success) {
            counter.success++;
        }
        else {
            counter.failed++;
        }
        // 限制记录数量
        if (records.length > 100) {
            records.shift();
        }
    }
    /**
     * 记录交易结果
     * @param result 交易结果
     * @param duration 交易持续时间(ms)
     */
    recordTradeResult(result, duration) {
        const operation = 'trade';
        // 创建响应时间记录
        const record = {
            operation,
            startTime: Date.now() - duration,
            endTime: Date.now(),
            duration,
            success: result.success,
            error: result.error
        };
        // 获取该操作的记录列表
        let records = this.responseTimeRecords.get(operation);
        if (!records) {
            records = [];
            this.responseTimeRecords.set(operation, records);
        }
        // 添加新记录
        records.push(record);
        // 更新操作计数器
        let counter = this.operationCounters.get(operation);
        if (!counter) {
            counter = { total: 0, success: 0, failed: 0 };
            this.operationCounters.set(operation, counter);
        }
        counter.total++;
        if (result.success) {
            counter.success++;
        }
        else {
            counter.failed++;
        }
        // 限制记录数量
        if (records.length > 100) {
            records.shift();
        }
        logger_1.default.debug(`记录交易结果: ${result.success ? '成功' : '失败'}`, MODULE_NAME, {
            duration,
            error: result.error
        });
    }
    /**
     * 计算平均响应时间
     * @param operation 操作名称
     * @returns 平均响应时间(ms)
     */
    calculateAverageResponseTime(operation) {
        const records = this.responseTimeRecords.get(operation);
        if (!records || records.length === 0) {
            return 0;
        }
        // 只计算已完成的记录
        const completedRecords = records.filter(r => r.duration !== undefined);
        if (completedRecords.length === 0) {
            return 0;
        }
        // 计算平均值
        const totalDuration = completedRecords.reduce((sum, record) => sum + (record.duration || 0), 0);
        return Math.round(totalDuration / completedRecords.length);
    }
    /**
     * 计算错误率
     * @returns 错误率(%)
     */
    calculateErrorRate() {
        let totalOperations = 0;
        let totalFailures = 0;
        // 汇总所有操作的错误率
        for (const counter of this.operationCounters.values()) {
            totalOperations += counter.total;
            totalFailures += counter.failed;
        }
        if (totalOperations === 0) {
            return 0;
        }
        return Math.round((totalFailures / totalOperations) * 100);
    }
    /**
     * 计算每秒交易数
     * @returns 每秒交易数
     */
    calculateTransactionsPerSecond() {
        const tradeRecords = this.responseTimeRecords.get('trade');
        if (!tradeRecords || tradeRecords.length < 2) {
            return 0;
        }
        // 获取最近的记录
        const recentRecords = tradeRecords.slice(-20);
        // 如果记录太少，返回0
        if (recentRecords.length < 2) {
            return 0;
        }
        // 计算时间跨度(秒)
        const timeSpan = (recentRecords[recentRecords.length - 1].startTime - recentRecords[0].startTime) / 1000;
        // 防止除以零
        if (timeSpan <= 0) {
            return 0;
        }
        // 计算每秒交易数
        return Math.round(recentRecords.length / timeSpan);
    }
    /**
     * 获取监控的池子数量
     * @returns 池子数量
     */
    getMonitoredPoolCount() {
        // 这里应该从池子监控服务获取实际数量
        // 简化示例:
        return 100;
    }
    /**
     * 获取当前性能指标
     * @returns 系统性能数据
     */
    getCurrentMetrics() {
        if (this.metricsHistory.length === 0) {
            return null;
        }
        return this.metricsHistory[this.metricsHistory.length - 1];
    }
    /**
     * 获取性能历史数据
     * @param limit 限制返回记录数
     * @returns 历史性能数据
     */
    getMetricsHistory(limit) {
        if (limit) {
            return this.metricsHistory.slice(-limit);
        }
        return [...this.metricsHistory];
    }
    /**
     * 生成性能摘要报告
     * @returns 性能摘要
     */
    generateSummaryReport() {
        const currentMetrics = this.getCurrentMetrics();
        if (!currentMetrics) {
            return '无可用性能数据';
        }
        const { system, application, resources, bottlenecks } = currentMetrics;
        let report = '系统性能摘要报告\n';
        report += '==================\n\n';
        report += `CPU使用率: ${system.cpuUsage}%\n`;
        report += `内存使用率: ${system.memoryUsage}% (${system.usedMemory}/${system.totalMemory} MB)\n`;
        report += `系统运行时间: ${this.formatUptime(system.uptime)}\n\n`;
        report += `平均RPC响应时间: ${application.rpcResponseTime}ms\n`;
        report += `平均交易延迟: ${application.avgTradeLatency}ms\n`;
        report += `交易成功率: ${application.successRate}%\n`;
        report += `监控池数量: ${application.poolsMonitored}\n`;
        report += `已执行交易: ${application.tradesExecuted}\n`;
        report += `每秒交易数: ${application.transactionsPerSecond}\n\n`;
        if (bottlenecks.length > 0) {
            report += '当前系统瓶颈:\n';
            bottlenecks.forEach(b => report += `- ${b}\n`);
            report += '\n';
        }
        return report;
    }
    /**
     * 格式化运行时间
     * @param seconds 秒数
     * @returns 格式化的时间字符串
     */
    formatUptime(seconds) {
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        return `${days}天 ${hours}小时 ${minutes}分钟 ${remainingSeconds}秒`;
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
// 导出单例实例
const performanceMonitor = new PerformanceMonitor();
exports.default = performanceMonitor;
