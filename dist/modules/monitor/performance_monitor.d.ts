/**
 * 性能监控系统
 * 负责监控系统性能指标，自动分析系统瓶颈，提供优化建议
 */
import { EventEmitter } from 'events';
import { TradeResult } from '../../core/types';
/**
 * 性能指标接口
 */
export interface PerformanceMetrics {
    cpuUsage: number;
    memoryUsage: number;
    totalMemory: number;
    usedMemory: number;
    uptime: number;
    lastUpdateTime: number;
}
/**
 * 系统性能接口
 */
export interface SystemPerformance {
    system: PerformanceMetrics;
    application: {
        rpcResponseTime: number;
        avgTradeLatency: number;
        transactionsPerSecond: number;
        successRate: number;
        poolsMonitored: number;
        tradesExecuted: number;
        errorRate: number;
    };
    resources: {
        diskUsage: number;
        networkIn: number;
        networkOut: number;
        openHandles: number;
    };
    bottlenecks: string[];
    timestamp: number;
}
/**
 * 性能警报级别枚举
 */
export declare enum AlertLevel {
    INFO = "info",
    WARNING = "warning",
    CRITICAL = "critical"
}
/**
 * 性能警报接口
 */
export interface PerformanceAlert {
    level: AlertLevel;
    metric: string;
    value: number;
    threshold: number;
    message: string;
    recommendation: string;
    timestamp: number;
}
/**
 * 响应时间记录接口
 */
export interface ResponseTimeRecord {
    operation: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    success?: boolean;
    error?: string;
}
/**
 * 性能监控配置接口
 */
export interface PerformanceMonitorConfig {
    interval: number;
    memoryWarningThreshold: number;
    cpuWarningThreshold: number;
    tradeLatencyWarningThreshold: number;
    errorRateWarningThreshold: number;
    autoRestart: boolean;
    collectHistory: boolean;
    historyLength: number;
}
/**
 * 性能监控系统类
 */
export declare class PerformanceMonitor extends EventEmitter {
    private config;
    private monitorInterval;
    private metricsHistory;
    private responseTimeRecords;
    private operationCounters;
    private lastNetworkStats;
    private activeRequests;
    /**
     * 构造函数
     * @param config 监控配置
     */
    constructor(config?: Partial<PerformanceMonitorConfig>);
    /**
     * 启动监控
     */
    start(): void;
    /**
     * 停止监控
     */
    stop(): void;
    /**
     * 收集性能指标
     */
    private collectMetrics;
    /**
     * 收集系统性能指标
     */
    private collectSystemMetrics;
    /**
     * 获取CPU使用率
     */
    private getCpuUsage;
    /**
     * 收集应用性能指标
     */
    private collectApplicationMetrics;
    /**
     * 收集资源使用指标
     */
    private collectResourceMetrics;
    /**
     * 获取网络流量统计
     */
    private getNetworkStats;
    /**
     * 分析系统瓶颈
     */
    private analyzeBottlenecks;
    /**
     * 检查是否需要发出警报
     */
    private checkAlerts;
    /**
     * 触发警报
     */
    private triggerAlert;
    /**
     * 建议重启系统
     */
    private recommendRestart;
    /**
     * 开始监控操作响应时间
     * @param operation 操作名称
     * @param id 操作ID（可选）
     * @returns 操作ID
     */
    startOperation(operation: string, id?: string): string;
    /**
     * 结束监控操作
     * @param operation 操作名称
     * @param id 操作ID
     * @param success 是否成功
     * @param error 错误信息
     */
    endOperation(operation: string, id: string, success: boolean, error?: string): void;
    /**
     * 记录交易结果
     * @param result 交易结果
     * @param duration 交易持续时间(ms)
     */
    recordTradeResult(result: TradeResult, duration: number): void;
    /**
     * 计算平均响应时间
     * @param operation 操作名称
     * @returns 平均响应时间(ms)
     */
    private calculateAverageResponseTime;
    /**
     * 计算错误率
     * @returns 错误率(%)
     */
    private calculateErrorRate;
    /**
     * 计算每秒交易数
     * @returns 每秒交易数
     */
    private calculateTransactionsPerSecond;
    /**
     * 获取监控的池子数量
     * @returns 池子数量
     */
    private getMonitoredPoolCount;
    /**
     * 获取当前性能指标
     * @returns 系统性能数据
     */
    getCurrentMetrics(): SystemPerformance | null;
    /**
     * 获取性能历史数据
     * @param limit 限制返回记录数
     * @returns 历史性能数据
     */
    getMetricsHistory(limit?: number): SystemPerformance[];
    /**
     * 生成性能摘要报告
     * @returns 性能摘要
     */
    generateSummaryReport(): string;
    /**
     * 格式化运行时间
     * @param seconds 秒数
     * @returns 格式化的时间字符串
     */
    private formatUptime;
}
declare const performanceMonitor: PerformanceMonitor;
export default performanceMonitor;
