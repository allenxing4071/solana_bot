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

import * as v8 from 'v8';
import EventEmitter from 'node:events';
import logger from '../../core/logger.js';
import os from 'os';

// 模块名称
const MODULE_NAME = 'MemoryOptimizer';

// 内存优化器配置接口
export interface MemoryOptimizerConfig {
  // 清理间隔(毫秒)
  cleanupInterval: number;
  
  // 强制垃圾回收的内存阈值(百分比)
  gcThreshold: number;
  
  // 历史数据保留时长(小时)
  historyRetentionHours: number;
  
  // 是否启用内存泄漏检测
  enableLeakDetection: boolean;
  
  // 内存泄漏检测间隔(毫秒)
  leakDetectionInterval: number;
  
  // 泄漏阈值(兆字节)
  leakThresholdMB: number;
  
  // 内存使用警告阈值(百分比)
  memoryWarningThreshold: number;
  
  // 堆大小阈值(兆字节) - 超过此值触发额外优化
  heapSizeThresholdMB: number;
  
  // 紧急清理阈值(百分比) - 超过此值触发紧急清理
  emergencyCleanupThreshold: number;
}

/**
 * 内存使用统计
 */
export interface MemoryStats {
  // 总内存(MB)
  totalMemory: number;
  
  // 可用内存(MB)
  freeMemory: number;
  
  // 已用内存(MB)
  usedMemory: number;
  
  // 内存使用率(%)
  memoryUsage: number;
  
  // 堆统计
  heap: {
    // 已用堆(MB)
    used: number;
    
    // 总堆(MB)
    total: number;
    
    // 堆使用率(%)
    usage: number;
    
    // 堆限制(MB)
    limit: number;
  };
  
  // 时间戳
  timestamp: number;
}

/**
 * 内存消耗点
 */
export interface MemoryConsumer {
  // 消耗点名称(如"价格缓存","监听器"等)
  name: string;
  
  // 清理函数 - 当需要释放内存时调用
  cleanup: () => void;
  
  // 内存优先级 - 值越小越先被清理
  priority: number;
}

/**
 * 内存优化器类
 */
export class MemoryOptimizer extends EventEmitter {
  // 配置
  private config: MemoryOptimizerConfig;
  
  // 内存消耗点注册表
  private consumers: MemoryConsumer[] = [];
  
  // 内存统计历史
  private memoryHistory: MemoryStats[] = [];
  
  // 清理计时器
  private cleanupTimer: NodeJS.Timeout | null = null;
  
  // 泄漏检测计时器
  private leakDetectionTimer: NodeJS.Timeout | null = null;
  
  // 上次清理时间戳
  private lastCleanupTime = 0;
  
  // 上次内存使用量
  private lastMemoryUsage: MemoryStats | null = null;
  
  /**
   * 构造函数
   * @param config 配置
   */
  constructor(config?: Partial<MemoryOptimizerConfig>) {
    super();
    
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
    
    logger.info('内存优化器初始化完成', MODULE_NAME, { 
      gcThreshold: this.config.gcThreshold,
      cleanupInterval: this.config.cleanupInterval
    });
  }
  
  /**
   * 启动内存优化器
   */
  public start(): void {
    logger.info('启动内存优化器', MODULE_NAME);
    
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
  public stop(): void {
    logger.info('停止内存优化器', MODULE_NAME);
    
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
  public registerConsumer(consumer: MemoryConsumer): void {
    this.consumers.push(consumer);
    
    // 按优先级排序
    this.consumers.sort((a, b) => a.priority - b.priority);
    
    logger.debug(`注册内存消耗点: ${consumer.name}`, MODULE_NAME, {
      priority: consumer.priority,
      totalConsumers: this.consumers.length
    });
  }
  
  /**
   * 取消注册内存消耗点
   * @param name 消耗点名称
   */
  public unregisterConsumer(name: string): void {
    const initialLength = this.consumers.length;
    this.consumers = this.consumers.filter(c => c.name !== name);
    
    if (initialLength !== this.consumers.length) {
      logger.debug(`移除内存消耗点: ${name}`, MODULE_NAME, {
        totalConsumers: this.consumers.length
      });
    }
  }
  
  /**
   * 检查内存使用状况
   */
  private checkMemory(): void {
    // 获取当前内存状态
    const stats = this.getMemoryStats();
    
    // 添加到历史
    this.memoryHistory.push(stats);
    
    // 清理过老的历史记录
    this.cleanupHistory();
    
    // 检查是否需要清理
    if (stats.memoryUsage > this.config.memoryWarningThreshold) {
      logger.warn('内存使用率超过警告阈值', MODULE_NAME, {
        memoryUsage: `${stats.memoryUsage.toFixed(2)}%`,
        threshold: `${this.config.memoryWarningThreshold}%`
      });
      
      // 执行清理
      this.performCleanup();
    }
    
    // 检查是否达到GC阈值
    if (stats.heap.usage > this.config.gcThreshold) {
      logger.warn('堆内存使用率超过GC阈值', MODULE_NAME, {
        heapUsage: `${stats.heap.usage.toFixed(2)}%`,
        threshold: `${this.config.gcThreshold}%`
      });
      
      // 执行垃圾回收
      this.forceGarbageCollection();
    }
    
    // 检查是否需要紧急清理
    if (stats.memoryUsage > this.config.emergencyCleanupThreshold) {
      logger.error('内存使用率超过紧急阈值', MODULE_NAME, {
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
  private getMemoryStats(): MemoryStats {
    // 系统内存信息
    const totalMemory = Math.round(os.totalmem() / (1024 * 1024)); // MB
    const freeMemory = Math.round(os.freemem() / (1024 * 1024)); // MB
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
  private performCleanup(): void {
    const now = Date.now();
    this.lastCleanupTime = now;
    
    logger.info('开始执行内存清理', MODULE_NAME);
    
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
            logger.info('内存使用已降至安全水平，停止进一步清理', MODULE_NAME, {
              memoryUsage: `${currentStats.memoryUsage.toFixed(2)}%`,
              clearedConsumers: cleanupCount,
              totalConsumers: this.consumers.length
            });
            break;
          }
        }
      } catch (error) {
        logger.error(`清理消耗点时出错: ${consumer.name}`, MODULE_NAME, {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    logger.info('内存清理完成', MODULE_NAME, {
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
  private forceGarbageCollection(): void {
    if (global.gc) {
      logger.info('执行强制垃圾回收', MODULE_NAME);
      
      // 记录GC前状态
      const beforeStats = this.getMemoryStats();
      
      try {
        // 执行垃圾回收
        global.gc();
        
        // 记录GC后状态
        const afterStats = this.getMemoryStats();
        const freedMemory = beforeStats.heap.used - afterStats.heap.used;
        
        logger.info('垃圾回收完成', MODULE_NAME, {
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
      } catch (error) {
        logger.error('强制垃圾回收出错', MODULE_NAME, {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    } else {
      logger.warn('无法执行强制垃圾回收，需要使用--expose-gc启动选项', MODULE_NAME);
    }
  }
  
  /**
   * 执行紧急内存清理
   * 在内存使用率极高的情况下调用
   */
  private performEmergencyCleanup(): void {
    logger.error('执行紧急内存清理', MODULE_NAME);
    
    // 清理所有消耗点
    for (const consumer of this.consumers) {
      try {
        consumer.cleanup();
      } catch (error) {
        logger.error(`紧急清理消耗点时出错: ${consumer.name}`, MODULE_NAME, {
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
  private cleanupHistory(): void {
    const now = Date.now();
    const retentionPeriod = this.config.historyRetentionHours * 60 * 60 * 1000; // 小时转毫秒
    const cutoffTime = now - retentionPeriod;
    
    // 过滤掉过旧的数据
    const initialLength = this.memoryHistory.length;
    this.memoryHistory = this.memoryHistory.filter(stats => stats.timestamp >= cutoffTime);
    
    const removedCount = initialLength - this.memoryHistory.length;
    if (removedCount > 0) {
      logger.debug(`清理了${removedCount}条过期内存历史记录`, MODULE_NAME);
    }
  }
  
  /**
   * 检测内存泄漏
   */
  private detectMemoryLeaks(): void {
    if (!this.lastMemoryUsage) {
      return; // 首次运行，没有比较基准
    }
    
    const currentStats = this.getMemoryStats();
    const elapsedHours = (currentStats.timestamp - this.lastMemoryUsage.timestamp) / (60 * 60 * 1000);
    
    // 计算增长率
    const memoryGrowthMB = currentStats.heap.used - this.lastMemoryUsage.heap.used;
    const growthRatePerHour = memoryGrowthMB / elapsedHours;
    
    if (memoryGrowthMB > this.config.leakThresholdMB && growthRatePerHour > 0) {
      logger.warn('检测到可能的内存泄漏', MODULE_NAME, {
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
  public getCurrentStats(): MemoryStats {
    return this.getMemoryStats();
  }
  
  /**
   * 获取内存历史数据
   * @param limit 限制返回数量
   */
  public getMemoryHistory(limit?: number): MemoryStats[] {
    if (limit) {
      return this.memoryHistory.slice(-limit);
    }
    return [...this.memoryHistory];
  }
  
  /**
   * 生成内存使用报告
   */
  public generateReport(): string {
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

// 创建并导出单例
const memoryOptimizer = new MemoryOptimizer();
export default memoryOptimizer; 