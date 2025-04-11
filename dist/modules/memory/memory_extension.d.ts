/**
 * 内存优化扩展模块
 * 用于将内存优化器集成到现有系统模块中
 *
 * 【比喻解释】
 * 就像船舶各个部门与空间管理专员的对接人员:
 * - 帮助各部门了解如何更有效地利用空间
 * - 对接各系统到空间管理中心
 * - 提供一系列船舱使用的最佳实践
 */
import { EventEmitter } from 'node:events';
/**
 * 内存扩展配置
 */
export interface MemoryExtensionConfig {
    optimizePriceCache: boolean;
    optimizeConnectionPool: boolean;
    optimizeOpportunityQueue: boolean;
    enableHealthCheck: boolean;
    healthCheckInterval: number;
}
/**
 * 内存扩展类
 * 用于扩展现有模块，提供内存优化支持
 */
export declare class MemoryExtension extends EventEmitter {
    private config;
    private isInitialized;
    private healthCheckTimer;
    /**
     * 构造函数
     * @param config 配置
     */
    constructor(config?: Partial<MemoryExtensionConfig>);
    /**
     * 初始化内存扩展
     */
    initialize(): Promise<void>;
    /**
     * 停止内存扩展
     */
    stop(): void;
    /**
     * 注册价格缓存消耗点
     */
    private registerPriceCacheConsumer;
    /**
     * 注册连接池消耗点
     */
    private registerConnectionPoolConsumer;
    /**
     * 注册机会队列消耗点
     */
    private registerOpportunityQueueConsumer;
    /**
     * 启动健康检查
     */
    private startHealthCheck;
    /**
     * 执行健康检查
     */
    private performHealthCheck;
    /**
     * 设置事件监听器
     */
    private setupEventListeners;
    /**
     * 按需优化内存
     * 提供给外部模块调用的接口，用于主动触发内存优化
     */
    optimizeOnDemand(): void;
    /**
     * 获取内存报告
     * 提供给外部模块调用的接口，用于获取当前内存使用报告
     */
    getMemoryReport(): string;
}
declare const memoryExtension: MemoryExtension;
export default memoryExtension;
