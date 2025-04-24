"use strict";
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
exports.MemoryOptimizer = void 0;
const v8 = __importStar(require("v8"));
const node_events_1 = __importDefault(require("node:events"));
const logger_1 = __importDefault(require("../../core/logger"));
const os_1 = __importDefault(require("os"));
// 模块名称
const MODULE_NAME = 'MemoryOptimizer';
/**
 * 内存优化器类
 */
class MemoryOptimizer extends node_events_1.default {
    /**
     * 构造函数
     * @param config 配置
     */
    constructor(config) {
        super();
        // 内存消耗点注册表
        this.consumers = [];
        // 内存统计历史
        this.memoryHistory = [];
        // 清理计时器
        this.cleanupTimer = null;
        // 泄漏检测计时器
        this.leakDetectionTimer = null;
        // 上次清理时间戳
        this.lastCleanupTime = 0;
        // 上次内存使用量
        this.lastMemoryUsage = null;
        // 默认配置
        this.config = {
            cleanupInterval: 60000, // 1分钟
            gcThreshold: 85, // 85%
            historyRetentionHours: 24,
            enableLeakDetection: true,
            leakDetectionInterval: 300000, // 5分钟
            leakThresholdMB: 100, // 100MB增长视为可能泄漏
            memoryWarningThreshold: 80, // 80%
            heapSizeThresholdMB: 1024, // 1GB
            emergencyCleanupThreshold: 90 // 90%
        };
        // 合并自定义配置
        if (config) {
            this.config = { ...this.config, ...config };
        }
        logger_1.default.info('内存优化器初始化完成', MODULE_NAME, {
            gcThreshold: this.config.gcThreshold,
            cleanupInterval: this.config.cleanupInterval
        });
    }
    /**
     * 启动内存优化器
     */
    start() {
        logger_1.default.info('启动内存优化器', MODULE_NAME);
        // 初始检查
        this.checkMemory();
        // 设置定期清理
        this.cleanupTimer = setInterval(() => {
            this.checkMemory();
        }, this.config.cleanupInterval);
        // 设置内存泄漏检测
        if (this.config.enableLeakDetection) {
            this.leakDetectionTimer = setInterval(() => {
                this.detectMemoryLeaks();
            }, this.config.leakDetectionInterval);
        }
    }
    /**
     * 停止内存优化器
     */
    stop() {
        logger_1.default.info('停止内存优化器', MODULE_NAME);
        // 清除计时器
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
        if (this.leakDetectionTimer) {
            clearInterval(this.leakDetectionTimer);
            this.leakDetectionTimer = null;
        }
    }
    /**
     * 注册内存消耗点
     * @param consumer 消耗点信息
     */
    registerConsumer(consumer) {
        this.consumers.push(consumer);
        // 按优先级排序
        this.consumers.sort((a, b) => a.priority - b.priority);
        logger_1.default.debug(`注册内存消耗点: ${consumer.name}`, MODULE_NAME, {
            priority: consumer.priority,
            totalConsumers: this.consumers.length
        });
    }
    /**
     * 取消注册内存消耗点
     * @param name 消耗点名称
     */
    unregisterConsumer(name) {
        const initialLength = this.consumers.length;
        this.consumers = this.consumers.filter(c => c.name !== name);
        if (initialLength !== this.consumers.length) {
            logger_1.default.debug(`移除内存消耗点: ${name}`, MODULE_NAME, {
                totalConsumers: this.consumers.length
            });
        }
    }
    /**
     * 检查内存使用状况
     */
    checkMemory() {
        // 获取当前内存状态
        const stats = this.getMemoryStats();
        // 添加到历史
        this.memoryHistory.push(stats);
        // 清理过老的历史记录
        this.cleanupHistory();
        // 检查是否需要清理
        if (stats.memoryUsage > this.config.memoryWarningThreshold) {
            logger_1.default.warn('内存使用率超过警告阈值', MODULE_NAME, {
                memoryUsage: `${stats.memoryUsage.toFixed(2)}%`,
                threshold: `${this.config.memoryWarningThreshold}%`
            });
            // 执行清理
            this.performCleanup();
        }
        // 检查是否达到GC阈值
        if (stats.heap.usage > this.config.gcThreshold) {
            logger_1.default.warn('堆内存使用率超过GC阈值', MODULE_NAME, {
                heapUsage: `${stats.heap.usage.toFixed(2)}%`,
                threshold: `${this.config.gcThreshold}%`
            });
            // 执行垃圾回收
            this.forceGarbageCollection();
        }
        // 检查是否需要紧急清理
        if (stats.memoryUsage > this.config.emergencyCleanupThreshold) {
            logger_1.default.error('内存使用率超过紧急阈值', MODULE_NAME, {
                memoryUsage: `${stats.memoryUsage.toFixed(2)}%`,
                threshold: `${this.config.emergencyCleanupThreshold}%`
            });
            // 执行紧急清理
            this.performEmergencyCleanup();
        }
        // 更新最后内存使用
        this.lastMemoryUsage = stats;
    }
    /**
     * 获取内存统计
     */
    getMemoryStats() {
        // 系统内存信息
        const totalMemory = Math.round(os_1.default.totalmem() / (1024 * 1024)); // MB
        const freeMemory = Math.round(os_1.default.freemem() / (1024 * 1024)); // MB
        const usedMemory = totalMemory - freeMemory;
        const memoryUsage = (usedMemory / totalMemory) * 100;
        // 堆内存信息
        const heapStats = v8.getHeapStatistics();
        const heapUsed = Math.round(heapStats.used_heap_size / (1024 * 1024)); // MB
        const heapTotal = Math.round(heapStats.total_heap_size / (1024 * 1024)); // MB
        const heapLimit = Math.round(heapStats.heap_size_limit / (1024 * 1024)); // MB
        const heapUsage = (heapUsed / heapTotal) * 100;
        return {
            totalMemory,
            freeMemory,
            usedMemory,
            memoryUsage,
            heap: {
                used: heapUsed,
                total: heapTotal,
                usage: heapUsage,
                limit: heapLimit
            },
            timestamp: Date.now()
        };
    }
    /**
     * 执行内存清理
     */
    performCleanup() {
        const now = Date.now();
        this.lastCleanupTime = now;
        logger_1.default.info('开始执行内存清理', MODULE_NAME);
        // 通知所有消耗点进行清理
        let cleanupCount = 0;
        // 从优先级最低的开始通知清理
        for (const consumer of this.consumers) {
            try {
                consumer.cleanup();
                cleanupCount++;
                // 每清理5个消耗点后，检查内存是否已改善
                if (cleanupCount % 5 === 0) {
                    const currentStats = this.getMemoryStats();
                    if (currentStats.memoryUsage < this.config.memoryWarningThreshold) {
                        logger_1.default.info('内存使用已降至安全水平，停止进一步清理', MODULE_NAME, {
                            memoryUsage: `${currentStats.memoryUsage.toFixed(2)}%`,
                            clearedConsumers: cleanupCount,
                            totalConsumers: this.consumers.length
                        });
                        break;
                    }
                }
            }
            catch (error) {
                logger_1.default.error(`清理消耗点时出错: ${consumer.name}`, MODULE_NAME, {
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
        logger_1.default.info('内存清理完成', MODULE_NAME, {
            clearedConsumers: cleanupCount
        });
        // 完成后发出事件
        this.emit('cleanup:complete', {
            timestamp: now,
            consumersCleared: cleanupCount,
            memoryBefore: this.lastMemoryUsage,
            memoryAfter: this.getMemoryStats()
        });
    }
    /**
     * 强制垃圾回收
     * 注意：这应谨慎使用，因为强制GC会暂停应用执行
     */
    forceGarbageCollection() {
        if (global.gc) {
            logger_1.default.info('执行强制垃圾回收', MODULE_NAME);
            // 记录GC前状态
            const beforeStats = this.getMemoryStats();
            try {
                // 执行垃圾回收
                global.gc();
                // 记录GC后状态
                const afterStats = this.getMemoryStats();
                const freedMemory = beforeStats.heap.used - afterStats.heap.used;
                logger_1.default.info('垃圾回收完成', MODULE_NAME, {
                    freedMemory: `${freedMemory.toFixed(2)} MB`,
                    beforeUsage: `${beforeStats.heap.usage.toFixed(2)}%`,
                    afterUsage: `${afterStats.heap.usage.toFixed(2)}%`
                });
                // 发出事件
                this.emit('gc:complete', {
                    timestamp: Date.now(),
                    freedMemory,
                    beforeStats,
                    afterStats
                });
            }
            catch (error) {
                logger_1.default.error('强制垃圾回收出错', MODULE_NAME, {
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
        else {
            logger_1.default.warn('无法执行强制垃圾回收，需要使用--expose-gc启动选项', MODULE_NAME);
        }
    }
    /**
     * 执行紧急内存清理
     * 在内存使用率极高的情况下调用
     */
    performEmergencyCleanup() {
        logger_1.default.error('执行紧急内存清理', MODULE_NAME);
        // 清理所有消耗点
        for (const consumer of this.consumers) {
            try {
                consumer.cleanup();
            }
            catch (error) {
                logger_1.default.error(`紧急清理消耗点时出错: ${consumer.name}`, MODULE_NAME, {
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
        // 清理内存历史
        this.memoryHistory = [];
        // 强制垃圾回收
        this.forceGarbageCollection();
        // 发出警告事件
        this.emit('memory:critical', {
            timestamp: Date.now(),
            memoryStats: this.getMemoryStats()
        });
    }
    /**
     * 清理旧的历史数据
     */
    cleanupHistory() {
        const now = Date.now();
        const retentionPeriod = this.config.historyRetentionHours * 60 * 60 * 1000; // 小时转毫秒
        const cutoffTime = now - retentionPeriod;
        // 过滤掉过旧的数据
        const initialLength = this.memoryHistory.length;
        this.memoryHistory = this.memoryHistory.filter(stats => stats.timestamp >= cutoffTime);
        const removedCount = initialLength - this.memoryHistory.length;
        if (removedCount > 0) {
            logger_1.default.debug(`清理了${removedCount}条过期内存历史记录`, MODULE_NAME);
        }
    }
    /**
     * 检测内存泄漏
     */
    detectMemoryLeaks() {
        if (!this.lastMemoryUsage) {
            return; // 首次运行，没有比较基准
        }
        const currentStats = this.getMemoryStats();
        const elapsedHours = (currentStats.timestamp - this.lastMemoryUsage.timestamp) / (60 * 60 * 1000);
        // 计算增长率
        const memoryGrowthMB = currentStats.heap.used - this.lastMemoryUsage.heap.used;
        const growthRatePerHour = memoryGrowthMB / elapsedHours;
        if (memoryGrowthMB > this.config.leakThresholdMB && growthRatePerHour > 0) {
            logger_1.default.warn('检测到可能的内存泄漏', MODULE_NAME, {
                growthMB: memoryGrowthMB.toFixed(2),
                growthRatePerHour: `${growthRatePerHour.toFixed(2)} MB/小时`,
                timeElapsed: `${elapsedHours.toFixed(2)} 小时`
            });
            // 发出内存泄漏警告事件
            this.emit('leak:detected', {
                timestamp: currentStats.timestamp,
                memoryGrowthMB,
                growthRatePerHour,
                previousStats: this.lastMemoryUsage,
                currentStats
            });
        }
    }
    /**
     * 获取当前内存状态
     */
    getCurrentStats() {
        return this.getMemoryStats();
    }
    /**
     * 获取内存历史数据
     * @param limit 限制返回数量
     */
    getMemoryHistory(limit) {
        if (limit) {
            return this.memoryHistory.slice(-limit);
        }
        return [...this.memoryHistory];
    }
    /**
     * 生成内存使用报告
     */
    generateReport() {
        const stats = this.getMemoryStats();
        const consumers = this.consumers.length;
        return `
===== 内存使用报告 =====
时间: ${new Date(stats.timestamp).toLocaleString()}

系统内存:
  总内存: ${stats.totalMemory} MB
  已用内存: ${stats.usedMemory} MB (${stats.memoryUsage.toFixed(2)}%)
  空闲内存: ${stats.freeMemory} MB

堆内存:
  已用堆: ${stats.heap.used} MB
  总堆大小: ${stats.heap.total} MB (${stats.heap.usage.toFixed(2)}%)
  堆限制: ${stats.heap.limit} MB

注册的内存消耗点: ${consumers}
最后清理时间: ${this.lastCleanupTime ? new Date(this.lastCleanupTime).toLocaleString() : '未清理'}
=======================
    `.trim();
    }
}
exports.MemoryOptimizer = MemoryOptimizer;
// 创建并导出单例
const memoryOptimizer = new MemoryOptimizer();
exports.default = memoryOptimizer;
