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

import memoryOptimizer, { MemoryConsumer } from './memory_optimizer';
import logger from '../../core/logger';
import traderModule from '../trader/trader_module';
import rpcService from '../../services/rpc_service';
import { EventEmitter } from 'node:events';

// 模块名称
const MODULE_NAME = 'MemoryExtension';

/**
 * 内存扩展配置
 */
export interface MemoryExtensionConfig {
  // 是否自动优化价格缓存
  optimizePriceCache: boolean;
  
  // 是否自动优化连接池
  optimizeConnectionPool: boolean;
  
  // 是否自动优化机会队列
  optimizeOpportunityQueue: boolean;
  
  // 是否启用定期健康检查
  enableHealthCheck: boolean;
  
  // 健康检查间隔(毫秒)
  healthCheckInterval: number;
}

/**
 * 内存扩展类
 * 用于扩展现有模块，提供内存优化支持
 */
export class MemoryExtension extends EventEmitter {
  // 配置
  private config: MemoryExtensionConfig;
  
  // 是否已初始化
  private isInitialized = false;
  
  // 健康检查定时器
  private healthCheckTimer: NodeJS.Timeout | null = null;
  
  /**
   * 构造函数
   * @param config 配置
   */
  constructor(config?: Partial<MemoryExtensionConfig>) {
    super();
    
    // 默认配置
    this.config = {
      optimizePriceCache: true,
      optimizeConnectionPool: true,
      optimizeOpportunityQueue: true,
      enableHealthCheck: true,
      healthCheckInterval: 300000 // 5分钟
    };
    
    // 合并自定义配置
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    logger.info('内存扩展模块初始化完成', MODULE_NAME);
  }
  
  /**
   * 初始化内存扩展
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('内存扩展模块已经初始化', MODULE_NAME);
      return;
    }
    
    logger.info('开始初始化内存扩展模块', MODULE_NAME);
    
    try {
      // 注册交易模块的消耗点
      if (this.config.optimizePriceCache) {
        this.registerPriceCacheConsumer();
      }
      
      // 注册RPC连接池消耗点
      if (this.config.optimizeConnectionPool) {
        this.registerConnectionPoolConsumer();
      }
      
      // 注册机会队列消耗点
      if (this.config.optimizeOpportunityQueue) {
        this.registerOpportunityQueueConsumer();
      }
      
      // 设置健康检查
      if (this.config.enableHealthCheck) {
        this.startHealthCheck();
      }
      
      // 设置内存事件监听器
      this.setupEventListeners();
      
      // 启动内存优化器
      memoryOptimizer.start();
      
      this.isInitialized = true;
      logger.info('内存扩展模块初始化完成', MODULE_NAME);
    } catch (error) {
      logger.error('初始化内存扩展模块时出错', MODULE_NAME, {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * 停止内存扩展
   */
  public stop(): void {
    if (!this.isInitialized) {
      return;
    }
    
    logger.info('停止内存扩展模块', MODULE_NAME);
    
    // 停止健康检查
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    
    // 停止内存优化器
    memoryOptimizer.stop();
    
    this.isInitialized = false;
  }
  
  /**
   * 注册价格缓存消耗点
   */
  private registerPriceCacheConsumer(): void {
    const consumer: MemoryConsumer = {
      name: '价格缓存',
      priority: 1, // 优先级较低，会优先清理
      cleanup: () => {
        // 通过TraderModule提供的forceCleanupCache方法清理价格缓存
        try {
          // 使用any类型规避类型检查，因为forceCleanupCache是私有方法
          // 实际生产环境中应该定义适当的接口
          const trader = traderModule as any;
          if (trader && typeof trader.forceCleanupCache === 'function') {
            trader.forceCleanupCache(0.2); // 保留20%最新数据
            logger.info('已清理价格缓存', MODULE_NAME);
          }
        } catch (error) {
          logger.error('清理价格缓存时出错', MODULE_NAME, {
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    };
    
    memoryOptimizer.registerConsumer(consumer);
    logger.info('已注册价格缓存到内存优化器', MODULE_NAME);
  }
  
  /**
   * 注册连接池消耗点
   */
  private registerConnectionPoolConsumer(): void {
    const consumer: MemoryConsumer = {
      name: 'RPC连接池',
      priority: 3, // 优先级较高，不会轻易清理
      cleanup: () => {
        try {
          // 使用any类型规避类型检查
          const rpc = rpcService as any;
          if (rpc && typeof rpc.cleanupConnections === 'function') {
            rpc.cleanupConnections();
            logger.info('已清理RPC连接池', MODULE_NAME);
          }
        } catch (error) {
          logger.error('清理RPC连接池时出错', MODULE_NAME, {
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    };
    
    memoryOptimizer.registerConsumer(consumer);
    logger.info('已注册RPC连接池到内存优化器', MODULE_NAME);
  }
  
  /**
   * 注册机会队列消耗点
   */
  private registerOpportunityQueueConsumer(): void {
    const consumer: MemoryConsumer = {
      name: '交易机会队列',
      priority: 2, // 中等优先级
      cleanup: () => {
        try {
          // 使用any类型规避类型检查
          const trader = traderModule as any;
          if (trader && trader.opportunityQueue && Array.isArray(trader.opportunityQueue)) {
            // 只保留高优先级的前20%
            if (trader.opportunityQueue.length > 10) {
              // 先按优先级排序
              trader.opportunityQueue.sort((a: any, b: any) => b.priority - a.priority);
              
              // 计算要保留的数量
              const keepCount = Math.max(1, Math.floor(trader.opportunityQueue.length * 0.2));
              
              // 截取数组
              const originalLength = trader.opportunityQueue.length;
              trader.opportunityQueue = trader.opportunityQueue.slice(0, keepCount);
              
              logger.info('已清理交易机会队列', MODULE_NAME, {
                before: originalLength,
                after: trader.opportunityQueue.length
              });
            }
          }
        } catch (error) {
          logger.error('清理交易机会队列时出错', MODULE_NAME, {
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    };
    
    memoryOptimizer.registerConsumer(consumer);
    logger.info('已注册交易机会队列到内存优化器', MODULE_NAME);
  }
  
  /**
   * 启动健康检查
   */
  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
    
    logger.info('已启动内存健康检查', MODULE_NAME, {
      interval: this.config.healthCheckInterval
    });
  }
  
  /**
   * 执行健康检查
   */
  private performHealthCheck(): void {
    try {
      const stats = memoryOptimizer.getCurrentStats();
      
      logger.debug('内存健康检查', MODULE_NAME, {
        memoryUsage: `${stats.memoryUsage.toFixed(2)}%`,
        heapUsage: `${stats.heap.usage.toFixed(2)}%`,
        heapSize: `${stats.heap.used}/${stats.heap.total} MB`
      });
      
      // 如果内存使用率超过70%，主动执行一次垃圾回收
      if (stats.heap.usage > 70) {
        logger.info('内存使用率较高，主动优化内存', MODULE_NAME);
        this.optimizeOnDemand();
      }
      
      // 发出健康状态事件
      this.emit('health:check', {
        timestamp: Date.now(),
        memoryStats: stats,
        status: stats.memoryUsage < 70 ? 'healthy' : 'warning'
      });
    } catch (error) {
      logger.error('执行内存健康检查时出错', MODULE_NAME, {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听内存泄漏事件
    memoryOptimizer.on('leak:detected', (data) => {
      logger.warn('内存扩展模块接收到内存泄漏警告', MODULE_NAME, {
        growthMB: data.memoryGrowthMB,
        growthRate: `${data.growthRatePerHour} MB/小时`
      });
      
      // 发出全局事件
      this.emit('memory:leak', data);
    });
    
    // 监听紧急内存事件
    memoryOptimizer.on('memory:critical', (data) => {
      logger.error('内存扩展模块接收到紧急内存警告', MODULE_NAME, {
        memoryUsage: `${data.memoryStats.memoryUsage.toFixed(2)}%`,
        heapUsage: `${data.memoryStats.heap.usage.toFixed(2)}%`
      });
      
      // 发出全局事件
      this.emit('memory:critical', data);
    });
  }
  
  /**
   * 按需优化内存
   * 提供给外部模块调用的接口，用于主动触发内存优化
   */
  public optimizeOnDemand(): void {
    logger.info('接收到内存优化请求', MODULE_NAME);
    
    // 先获取当前内存状态
    const statsBefore = memoryOptimizer.getCurrentStats();
    
    // 清理各消耗点
    if (this.config.optimizePriceCache) {
      const consumer = memoryOptimizer['consumers'].find(c => c.name === '价格缓存');
      if (consumer) {
        consumer.cleanup();
      }
    }
    
    // 强制进行一次垃圾回收
    try {
      if (global.gc) {
        global.gc();
        logger.info('已执行按需垃圾回收', MODULE_NAME);
      }
    } catch (error) {
      logger.error('按需垃圾回收时出错', MODULE_NAME, {
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // 获取优化后的内存状态
    const statsAfter = memoryOptimizer.getCurrentStats();
    const freedMemory = statsBefore.heap.used - statsAfter.heap.used;
    
    logger.info('按需内存优化完成', MODULE_NAME, {
      freedMemory: `${freedMemory.toFixed(2)} MB`,
      beforeUsage: `${statsBefore.memoryUsage.toFixed(2)}%`,
      afterUsage: `${statsAfter.memoryUsage.toFixed(2)}%`
    });
    
    // 发出优化完成事件
    this.emit('optimize:complete', {
      timestamp: Date.now(),
      freedMemory,
      statsBefore,
      statsAfter
    });
  }
  
  /**
   * 获取内存报告
   * 提供给外部模块调用的接口，用于获取当前内存使用报告
   */
  public getMemoryReport(): string {
    return memoryOptimizer.generateReport();
  }
}

// 创建并导出单例
const memoryExtension = new MemoryExtension();
export default memoryExtension; 