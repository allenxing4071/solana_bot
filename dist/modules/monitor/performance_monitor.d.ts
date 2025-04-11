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
import { EventEmitter } from 'node:events';
import { TradeResult } from '../../core/types';
/**
 * 性能指标接口
 *
 * 【比喻解释】
 * 就像船舶主要航行参数表：
 * - 记录引擎转速(CPU使用率)
 * - 监测载重情况(内存使用)
 * - 跟踪航行时间(运行时间)
 * - 记录各项读数的更新时间
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
 *
 * 【比喻解释】
 * 就像完整的船舶状态报告：
 * - 包含船舶本身的状态(system)
 * - 捕鱼作业的效率数据(application)
 * - 各种资源消耗情况(resources)
 * - 当前航行中的主要问题(bottlenecks)
 * - 报告生成的时间点(timestamp)
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
 *
 * 【比喻解释】
 * 就像船舶警报的紧急程度：
 * - 信息(INFO)：值得注意但不紧急的情况
 * - 警告(WARNING)：需要关注的潜在问题
 * - 严重(CRITICAL)：需要立即处理的紧急情况
 */
export declare enum AlertLevel {
    INFO = "info",// 信息级别，就像天气预报提醒
    WARNING = "warning",// 警告级别，就像风浪加大警告
    CRITICAL = "critical"
}
/**
 * 性能警报接口
 *
 * 【比喻解释】
 * 就像船舶警报通知单：
 * - 标明警报的严重程度(level)
 * - 指出哪个系统出现问题(metric)
 * - 记录当前的异常数值(value)
 * - 说明正常范围的阈值(threshold)
 * - 详细描述问题情况(message)
 * - 提供处理建议(recommendation)
 * - 记录警报发生的时间(timestamp)
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
 *
 * 【比喻解释】
 * 就像船员执行任务的计时记录：
 * - 记录执行的具体任务(operation)
 * - 开始执行的时间点(startTime)
 * - 任务完成的时间点(endTime)
 * - 整个任务花费的时间(duration)
 * - 任务是否成功完成(success)
 * - 如果失败，记录失败原因(error)
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
 *
 * 【比喻解释】
 * 就像船舶监控系统的设置面板：
 * - 设定检查各系统的频率(interval)
 * - 调整各种警报的触发阈值
 * - 配置是否在严重故障时自动采取措施(autoRestart)
 * - 设置是否保存历史航行数据(collectHistory)
 * - 决定保存多少历史记录(historyLength)
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
     *
     * 【比喻解释】
     * 就像启动船舶的仪表监控系统：
     * - 确认系统尚未运行(避免重复启动)
     * - 先进行一次全面的系统检查(初始化测量)
     * - 设置定期巡检的时间间隔(定时监控)
     * - 通知船长监控系统已经开始工作(日志记录)
     */
    start(): void;
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
    stop(): void;
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
    private collectMetrics;
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
    private collectSystemMetrics;
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
    private getCpuUsage;
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
