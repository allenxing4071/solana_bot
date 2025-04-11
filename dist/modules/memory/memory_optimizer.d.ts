/**
 * 内存优化模块
 * 负责自动监控和管理系统内存使用，防止内存泄漏和资源过度占用
 *
 * 【编程基础概念通俗比喻】
 * 1. 内存优化器(Memory Optimizer) = 船舱空间管理员：
 *    管理渔船有限空间，确保高效利用而不过度拥挤
 *
 * 2. 内存清理(Memory Cleanup) = 船舱整理：
 *    定期清理不再需要的物品，腾出空间给新物品
 *
 * 3. 内存泄漏检测(Leak Detection) = 漏水检查：
 *    检查船舱是否有水在不断积累而没有排出去
 *
 * 4. 资源限制(Resource Limits) = 装载限制：
 *    设定船舱各区域最大承重，防止局部过载导致整船不稳
 */
import EventEmitter from 'node:events';
export interface MemoryOptimizerConfig {
    cleanupInterval: number;
    gcThreshold: number;
    historyRetentionHours: number;
    enableLeakDetection: boolean;
    leakDetectionInterval: number;
    leakThresholdMB: number;
    memoryWarningThreshold: number;
    heapSizeThresholdMB: number;
    emergencyCleanupThreshold: number;
}
/**
 * 内存使用统计
 */
export interface MemoryStats {
    totalMemory: number;
    freeMemory: number;
    usedMemory: number;
    memoryUsage: number;
    heap: {
        used: number;
        total: number;
        usage: number;
        limit: number;
    };
    timestamp: number;
}
/**
 * 内存消耗点
 */
export interface MemoryConsumer {
    name: string;
    cleanup: () => void;
    priority: number;
}
/**
 * 内存优化器类
 */
export declare class MemoryOptimizer extends EventEmitter {
    private config;
    private consumers;
    private memoryHistory;
    private cleanupTimer;
    private leakDetectionTimer;
    private lastCleanupTime;
    private lastMemoryUsage;
    /**
     * 构造函数
     * @param config 配置
     */
    constructor(config?: Partial<MemoryOptimizerConfig>);
    /**
     * 启动内存优化器
     */
    start(): void;
    /**
     * 停止内存优化器
     */
    stop(): void;
    /**
     * 注册内存消耗点
     * @param consumer 消耗点信息
     */
    registerConsumer(consumer: MemoryConsumer): void;
    /**
     * 取消注册内存消耗点
     * @param name 消耗点名称
     */
    unregisterConsumer(name: string): void;
    /**
     * 检查内存使用状况
     */
    private checkMemory;
    /**
     * 获取内存统计
     */
    private getMemoryStats;
    /**
     * 执行内存清理
     */
    private performCleanup;
    /**
     * 强制垃圾回收
     * 注意：这应谨慎使用，因为强制GC会暂停应用执行
     */
    private forceGarbageCollection;
    /**
     * 执行紧急内存清理
     * 在内存使用率极高的情况下调用
     */
    private performEmergencyCleanup;
    /**
     * 清理旧的历史数据
     */
    private cleanupHistory;
    /**
     * 检测内存泄漏
     */
    private detectMemoryLeaks;
    /**
     * 获取当前内存状态
     */
    getCurrentStats(): MemoryStats;
    /**
     * 获取内存历史数据
     * @param limit 限制返回数量
     */
    getMemoryHistory(limit?: number): MemoryStats[];
    /**
     * 生成内存使用报告
     */
    generateReport(): string;
}
declare const memoryOptimizer: MemoryOptimizer;
export default memoryOptimizer;
