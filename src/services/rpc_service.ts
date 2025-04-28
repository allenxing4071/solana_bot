/**
 * RPC连接服务
 * 管理与Solana节点的连接
 * 
 * 【编程基础概念通俗比喻】
 * 这个模块就像渔船的无线电通讯系统：
 * - 与岸上（区块链节点）保持稳定通信
 * - 发送指令（交易）并接收反馈
 * - 在通信不稳定时自动重新连接
 * 
 * 【比喻解释】
 * 这个服务就像船上的通讯官：
 * - 管理与陆地的多种通讯方式（HTTP和WebSocket）
 * - 确保命令能可靠传达（重试机制）
 * - 处理各类信息的接收和解析（账户数据、日志等）
 */

import {
  Connection,
  ConnectionConfig,
  Commitment,
  PublicKey,
  Transaction,
  SendOptions,
  Keypair,
  VersionedTransaction,
  AccountInfo,
  LogsFilter,
  Signer,
  KeyedAccountInfo
} from '@solana/web3.js';
import appConfig from '../core/config.js';
import logger from '../core/logger.js';
import { WebSocket } from 'ws';
import fs from 'fs';

const MODULE_NAME = 'RPCService';

/**
 * 基本RPC服务接口定义
 */
export interface IRPCService {
  initialize(): Promise<void>;
  getConnection(): Promise<Connection>;
  getAccountInfo(address: PublicKey, commitment?: Commitment): Promise<AccountInfo<Buffer> | null>;
  getProgramAccounts(programId: PublicKey, filters?: any[]): Promise<Array<{pubkey: PublicKey, account: AccountInfo<Buffer>}>>;
  subscribeAccount(address: PublicKey, callback: (accountInfo: AccountInfo<Buffer>) => void, commitment?: Commitment): Promise<number>;
  subscribeLogs(filter: LogsFilter, callback: (logs: any) => void): Promise<number>;
  subscribeProgram(programId: PublicKey, callback: (accountInfo: AccountInfo<Buffer>) => void, commitment?: Commitment): Promise<number>;
  unsubscribe(subscriptionId: number): Promise<boolean>;
  unsubscribeAll(): Promise<void>;
  sendTransaction(transaction: Transaction | VersionedTransaction, signers: Signer[], options?: SendOptions): Promise<string>;
  withRetry<T>(fn: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T>;
}

/**
 * 缓存账户信息类型
 */
interface CachedAccountInfo {
  data: any;
  timestamp: number;
}

/**
 * 订阅信息类型
 */
interface SubscriptionInfo {
  address?: PublicKey;
  programId?: PublicKey;
  filter?: LogsFilter;
  callback?: (...args: any[]) => void;
  commitment?: Commitment;
}

/**
 * 重试配置接口
 */
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  exponentialFactor: number;
  jitter: boolean;
}

/**
 * 断路器状态
 */
enum CircuitBreakerState {
  CLOSED = 'CLOSED',    // 正常状态
  OPEN = 'OPEN',       // 断开状态
  HALF_OPEN = 'HALF_OPEN'  // 半开状态
}

/**
 * 断路器配置接口
 */
interface CircuitBreakerConfig {
  failureThreshold: number;    // 触发断路器的失败次数阈值
  resetTimeout: number;        // 重置时间（毫秒）
  halfOpenMaxCalls: number;    // 半开状态下允许的最大调用次数
}

/**
 * 连接池配置接口
 */
interface ConnectionPoolConfig {
  minSize: number;
  maxSize: number;
  idleTimeout: number;
  acquireTimeout: number;
  healthCheckInterval: number;
}

/**
 * 连接包装器接口
 */
interface ConnectionWrapper {
  connection: Connection;
  lastUsed: number;
  isHealthy: boolean;
  endpoint: string;
  metrics: {
    totalRequests: number;
    failedRequests: number;
    averageLatency: number;
    lastLatencyCheck: number;
  };
}

/**
 * 性能指标接口
 */
interface PerformanceMetrics {
  requestCount: number;
  successCount: number;
  errorCount: number;
  averageLatency: number;
  maxLatency: number;
  minLatency: number;
  lastError?: Error;
  lastErrorTime?: number;
  lastSuccessTime?: number;
  totalBytesTransferred: number;
  activeConnections: number;
  connectionPoolSize: number;
  circuitBreakerState: CircuitBreakerState;
  requestRate: number;           // 每秒请求数
  errorRate: number;            // 错误率
  successRate: number;          // 成功率
  connectionUtilization: number; // 连接池利用率
  responseTimeDistribution: {   // 响应时间分布
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
  recentErrors: Error[];        // 最近错误列表
  endpointPerformance: {        // 各端点性能
    [endpoint: string]: {
      requestCount: number;
      successCount: number;
      errorCount: number;
      averageLatency: number;
      lastError?: Error;
      lastErrorTime?: number;
    };
  };
}

/**
 * 性能监控配置接口
 */
interface PerformanceMonitorConfig {
  metricsInterval: number;  // 指标收集间隔（毫秒）
  alertThresholds: {
    latency: number;       // 延迟阈值（毫秒）
    errorRate: number;     // 错误率阈值（百分比）
    connectionPool: {
      minSize: number;     // 最小连接池大小
      maxSize: number;     // 最大连接池大小
    };
  };
  retentionPeriod: number; // 指标保留时间（毫秒）
}

/**
 * 性能指标时间窗口接口
 */
interface MetricsTimeWindow {
  window: number;        // 时间窗口（毫秒）
  metrics: PerformanceMetrics[];
}

/**
 * 性能分析结果接口
 */
interface PerformanceAnalysis {
  timeWindow: number;    // 分析时间窗口（毫秒）
  averageLatency: number;
  p95Latency: number;    // 95分位延迟
  p99Latency: number;    // 99分位延迟
  errorRate: number;
  successRate: number;
  throughput: number;    // 每秒请求数
  connectionUtilization: number;  // 连接池利用率
  healthScore: number;   // 综合健康评分(0-100)
  recommendations: string[];  // 优化建议
}

interface PerformanceAlert {
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: number;
  metrics: Partial<PerformanceMetrics>;
  recommendations: string[];
}

interface AlertConfig {
  thresholds: {
    latency: {
      warning: number;
      error: number;
      critical: number;
    };
    errorRate: {
      warning: number;
      error: number;
      critical: number;
    };
    connectionUtilization: {
      warning: number;
      error: number;
      critical: number;
    };
    requestRate: {
      warning: number;
      error: number;
      critical: number;
    };
  };
  cooldownPeriod: number; // 告警冷却时间（毫秒）
  maxAlertsPerPeriod: number; // 每个时间窗口最大告警数
}

interface PerformanceReport {
  timestamp: number;
  timeWindow: number;
  summary: {
    totalRequests: number;
    successRate: number;
    averageLatency: number;
    errorRate: number;
    connectionUtilization: number;
    requestRate: number;
  };
  metrics: PerformanceMetrics;
  alerts: PerformanceAlert[];
  recommendations: string[];
  endpointStats: {
    [endpoint: string]: {
      requestCount: number;
      successRate: number;
      averageLatency: number;
      errorRate: number;
    };
  };
}

// 连接重试配置
const MAX_CONN_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

/**
 * 获取备用RPC端点
 * 从环境变量中解析备用RPC端点列表
 * 
 * @returns 备用RPC端点数组
 */
function getBackupRPCEndpoints(): string[] {
  const backupEndpoints = process.env.BACKUP_RPC_ENDPOINTS || '';
  if (!backupEndpoints) return [];
  
  return backupEndpoints.split(',').filter(url => url.trim().startsWith('http'));
}

/**
 * RPC服务类
 * 负责管理与Solana RPC节点的通信
 */
export class RPCService implements IRPCService {
  private _connection: Connection | null = null;
  private _subscriptions = new Map<number, SubscriptionInfo>();
  private readonly retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    exponentialFactor: 2,
    jitter: true
  };
  private readonly circuitBreakerConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    resetTimeout: 30000,
    halfOpenMaxCalls: 3
  };
  private circuitBreakerState: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private halfOpenCallCount: number = 0;
  private connectionConfig: ConnectionConfig = {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000
  };
  private rpcUrl: string | null = null;
  private connectionPool: Map<string, ConnectionWrapper> = new Map();
  private readonly poolConfig: ConnectionPoolConfig = {
    minSize: 2,
    maxSize: 5,
    idleTimeout: 300000, // 5分钟
    acquireTimeout: 5000, // 5秒
    healthCheckInterval: 30000 // 30秒
  };
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private endpoints: string[] = [];
  private endpointIndex: number = 0;
  
  private performanceMetrics: PerformanceMetrics = {
    requestCount: 0,
    successCount: 0,
    errorCount: 0,
    averageLatency: 0,
    maxLatency: 0,
    minLatency: Infinity,
    totalBytesTransferred: 0,
    activeConnections: 0,
    connectionPoolSize: 0,
    circuitBreakerState: CircuitBreakerState.CLOSED,
    requestRate: 0,
    errorRate: 0,
    successRate: 0,
    connectionUtilization: 0,
    responseTimeDistribution: {
      p50: 0,
      p75: 0,
      p90: 0,
      p95: 0,
      p99: 0
    },
    recentErrors: [],
    endpointPerformance: {}
  };

  private readonly performanceConfig: PerformanceMonitorConfig = {
    metricsInterval: 60000, // 1分钟
    alertThresholds: {
      latency: 1000,       // 1秒
      errorRate: 5,        // 5%
      connectionPool: {
        minSize: 2,
        maxSize: 10
      }
    },
    retentionPeriod: 86400000 // 24小时
  };

  private metricsHistory: PerformanceMetrics[] = [];
  private metricsTimer: NodeJS.Timeout | null = null;
  
  private metricsWindows: MetricsTimeWindow[] = [
    { window: 60000, metrics: [] },    // 1分钟
    { window: 300000, metrics: [] },   // 5分钟
    { window: 900000, metrics: [] },   // 15分钟
    { window: 3600000, metrics: [] }   // 1小时
  ];
  
  private readonly alertConfig: AlertConfig = {
    thresholds: {
      latency: {
        warning: 500,    // 500ms
        error: 1000,     // 1s
        critical: 2000   // 2s
      },
      errorRate: {
        warning: 5,      // 5%
        error: 10,       // 10%
        critical: 20     // 20%
      },
      connectionUtilization: {
        warning: 80,     // 80%
        error: 90,       // 90%
        critical: 95     // 95%
      },
      requestRate: {
        warning: 50,     // 50 req/s
        error: 100,      // 100 req/s
        critical: 200    // 200 req/s
      }
    },
    cooldownPeriod: 300000, // 5分钟
    maxAlertsPerPeriod: 3
  };

  private alerts: PerformanceAlert[] = [];
  private lastAlertTime: number = 0;
  private alertCountInPeriod: number = 0;
  
  /**
   * 构造函数
   */
  constructor() {
    // 构造函数不再直接访问appConfig，延迟到initialize
    
    // 初始化RPC端点列表
    this.endpoints = [
      process.env.PRIMARY_RPC_URL || '',
      ...(process.env.BACKUP_RPC_ENDPOINTS?.split(',') || [])
    ].filter(url => url.trim().startsWith('http'));
  }
  
  /**
   * 初始化连接池
   */
  private async initializeConnectionPool(): Promise<void> {
    // 确保至少有一个可用端点
    if (this.endpoints.length === 0) {
      throw new Error('未配置有效的RPC端点');
    }

    // 初始化最小连接数
    for (let i = 0; i < this.poolConfig.minSize; i++) {
      const endpoint = this.getNextEndpoint();
      await this.createConnection(endpoint);
    }

    // 启动健康检查
    this.startHealthCheck();
  }

  /**
   * 获取下一个端点（轮询策略）
   */
  private getNextEndpoint(): string {
    const endpoint = this.endpoints[this.endpointIndex];
    this.endpointIndex = (this.endpointIndex + 1) % this.endpoints.length;
    return endpoint;
  }

  /**
   * 创建新连接
   */
  private async createConnection(endpoint: string): Promise<ConnectionWrapper> {
    const connection = new Connection(endpoint, this.connectionConfig);
    
    // 验证连接
    try {
      await connection.getVersion();
    } catch (error) {
      logger.error(`无法连接到端点 ${endpoint}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }

    const wrapper: ConnectionWrapper = {
      connection,
      lastUsed: Date.now(),
      isHealthy: true,
      endpoint,
      metrics: {
        totalRequests: 0,
        failedRequests: 0,
        averageLatency: 0,
        lastLatencyCheck: Date.now()
      }
    };

    this.connectionPool.set(endpoint, wrapper);
    return wrapper;
  }

  /**
   * 获取最佳可用连接
   */
  private async getBestConnection(): Promise<Connection> {
    // 按性能指标排序所有健康的连接
    const healthyConnections = Array.from(this.connectionPool.values())
      .filter(wrapper => wrapper.isHealthy)
      .sort((a, b) => {
        // 计算成功率
        const aSuccessRate = (a.metrics.totalRequests - a.metrics.failedRequests) / Math.max(a.metrics.totalRequests, 1);
        const bSuccessRate = (b.metrics.totalRequests - b.metrics.failedRequests) / Math.max(b.metrics.totalRequests, 1);
        
        // 综合考虑成功率和延迟
        return (bSuccessRate / b.metrics.averageLatency) - (aSuccessRate / a.metrics.averageLatency);
      });

    if (healthyConnections.length === 0) {
      // 如果没有健康的连接，尝试创建新连接
      if (this.connectionPool.size < this.poolConfig.maxSize) {
        const endpoint = this.getNextEndpoint();
        const wrapper = await this.createConnection(endpoint);
        return wrapper.connection;
      }
      throw new Error('没有可用的健康连接');
    }

    // 返回性能最好的连接
    return healthyConnections[0].connection;
  }

  /**
   * 更新连接指标
   */
  private updateConnectionMetrics(endpoint: string, latency: number, success: boolean): void {
    const wrapper = this.connectionPool.get(endpoint);
    if (wrapper) {
      wrapper.metrics.totalRequests++;
      if (!success) {
        wrapper.metrics.failedRequests++;
      }
      
      // 更新平均延迟
      const oldAverage = wrapper.metrics.averageLatency;
      const totalRequests = wrapper.metrics.totalRequests;
      wrapper.metrics.averageLatency = (oldAverage * (totalRequests - 1) + latency) / totalRequests;
      wrapper.metrics.lastLatencyCheck = Date.now();
    }
  }

  /**
   * 健康检查
   */
  private async checkConnectionHealth(wrapper: ConnectionWrapper): Promise<boolean> {
    try {
      const startTime = Date.now();
      await wrapper.connection.getVersion();
      const latency = Date.now() - startTime;
      
      this.updateConnectionMetrics(wrapper.endpoint, latency, true);
      wrapper.isHealthy = true;
      return true;
      } catch (error) {
      logger.error(`连接健康检查失败 ${wrapper.endpoint}: ${error instanceof Error ? error.message : String(error)}`);
      wrapper.isHealthy = false;
      this.updateConnectionMetrics(wrapper.endpoint, 0, false);
      return false;
    }
  }

  /**
   * 启动健康检查定时器
   */
  private startHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(async () => {
      for (const wrapper of this.connectionPool.values()) {
        await this.checkConnectionHealth(wrapper);
      }

      // 清理空闲连接
      this.cleanIdleConnections();
    }, this.poolConfig.healthCheckInterval);
  }

  /**
   * 清理空闲连接
   */
  private cleanIdleConnections(): void {
    const now = Date.now();
    const minConnections = this.poolConfig.minSize;
    let activeConnections = this.connectionPool.size;

    for (const [endpoint, wrapper] of this.connectionPool.entries()) {
      if (activeConnections <= minConnections) {
        break;
      }

      if (now - wrapper.lastUsed > this.poolConfig.idleTimeout) {
        this.connectionPool.delete(endpoint);
        activeConnections--;
        logger.info(`关闭空闲连接: ${endpoint}`);
      }
    }
  }
  
  /**
   * 获取连接池状态
   */
  getPoolStatus(): {
    activeConnections: number;
    healthyConnections: number;
    endpoints: string[];
  } {
    const healthyConnections = Array.from(this.connectionPool.values())
      .filter(wrapper => wrapper.isHealthy).length;

    return {
      activeConnections: this.connectionPool.size,
      healthyConnections,
      endpoints: this.endpoints
    };
  }

  /**
   * 初始化RPC服务
   */
  async initialize(): Promise<void> {
    try {
      if (!appConfig || !appConfig.network) {
        throw new Error('appConfig未初始化或缺少network配置');
      }

      this.connectionConfig = {
        commitment: appConfig.network.cluster === 'mainnet-beta' ? 'confirmed' : 'processed',
        confirmTransactionInitialTimeout: 60000
      };

      // 初始化连接池
      await this.initializeConnectionPool();
      
      logger.info('RPC服务初始化完成', JSON.stringify({
        endpoints: this.endpoints,
        poolSize: this.connectionPool.size
      }));

      this.initializePerformanceMonitor();
    } catch (error) {
      logger.error(`RPC服务初始化失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * 获取连接实例
   */
  public async getConnection(): Promise<Connection> {
    try {
      return await this.getBestConnection();
    } catch (error) {
      logger.error(`获取连接失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 停止服务
   */
  async stop(): Promise<void> {
    // 停止健康检查
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    // 关闭所有连接
    this.connectionPool.clear();
    logger.info('RPC服务已停止');

    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = null;
    }
  }
  
  /**
   * 获取账户信息
   */
  async getAccountInfo(address: PublicKey, commitment?: Commitment): Promise<AccountInfo<Buffer> | null> {
    if (!this._connection) {
      throw new Error('RPC连接未初始化');
    }
    
    try {
      return await this._connection.getAccountInfo(address, commitment);
    } catch (error) {
      logger.error(`获取账户信息失败: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
  
  /**
   * 获取程序账户
   */
  async getProgramAccounts(programId: PublicKey, filters?: any[]): Promise<Array<{pubkey: PublicKey, account: AccountInfo<Buffer>}>> {
    if (!this._connection) {
      throw new Error('RPC连接未初始化');
    }
    
    try {
      const config: any = {};
      if (filters && filters.length > 0) {
        config.filters = filters;
      }
      
      const response = await this._connection.getProgramAccounts(programId, config);
      const result: Array<{pubkey: PublicKey, account: AccountInfo<Buffer>}> = [];
      
      if (response && Array.isArray(response)) {
        for (const item of response) {
          result.push({
            pubkey: item.pubkey,
            account: item.account
          });
        }
      }
      
      return result;
    } catch (error) {
      logger.error(`获取程序账户失败: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
  
  /**
   * 订阅账户变更
   */
  async subscribeAccount(address: PublicKey, callback: (accountInfo: AccountInfo<Buffer>) => void, commitment?: Commitment): Promise<number> {
    if (!this._connection) {
      throw new Error('RPC连接未初始化');
    }
    
    try {
      const subscriptionId = this._connection.onAccountChange(address, callback, commitment);
      this._subscriptions.set(subscriptionId, { address, callback });
      return subscriptionId;
    } catch (error) {
      logger.error(`订阅账户变更失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * 订阅程序账户变更
   */
  async subscribeProgram(programId: PublicKey, callback: (accountInfo: AccountInfo<Buffer>) => void, commitment?: Commitment): Promise<number> {
    if (!this._connection) {
      throw new Error('RPC连接未初始化');
    }
    
    try {
      const subscriptionId = this._connection.onProgramAccountChange(
        programId,
        (keyedAccountInfo) => {
          callback(keyedAccountInfo.accountInfo);
        },
        commitment
      );
      this._subscriptions.set(subscriptionId, { programId, callback });
      return subscriptionId;
    } catch (error) {
      logger.error(`订阅程序账户变更失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * 订阅日志
   */
  async subscribeLogs(filter: LogsFilter, callback: (logs: any) => void): Promise<number> {
    if (!this._connection) {
      throw new Error('RPC连接未初始化');
    }
    
    try {
      const subscriptionId = this._connection.onLogs(filter, callback);
      this._subscriptions.set(subscriptionId, { filter, callback });
      return subscriptionId;
    } catch (error) {
      logger.error(`订阅日志失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * 取消订阅
   */
  async unsubscribe(subscriptionId: number): Promise<boolean> {
    if (!this._connection) {
      return false;
    }
    
    try {
      // 尝试不同类型的取消订阅方法
      let success = false;
      
      try {
        await this._connection.removeAccountChangeListener(subscriptionId);
        success = true;
      } catch (e) {
        // 可能不是账户变更监听器，尝试其他类型
      }
      
      if (!success) {
        try {
          await this._connection.removeProgramAccountChangeListener(subscriptionId);
          success = true;
        } catch (e) {
          // 可能不是程序账户监听器，尝试其他类型
        }
      }
      
      if (!success) {
        try {
          await this._connection.removeOnLogsListener(subscriptionId);
          success = true;
        } catch (e) {
          // 可能不是日志监听器
          logger.debug(`无法移除监听器: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
      
      if (success) {
        this._subscriptions.delete(subscriptionId);
      } else {
        logger.warn(`无法识别订阅类型，订阅ID: ${subscriptionId}`);
      }
      
      return success;
    } catch (error) {
      logger.error(`取消订阅失败: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
  
  /**
   * 取消所有订阅
   */
  async unsubscribeAll(): Promise<void> {
    if (!this._connection) {
      return;
    }
    
    for (const subscriptionId of this._subscriptions.keys()) {
      try {
        await this._connection.removeAccountChangeListener(subscriptionId);
      } catch (error) {
        logger.error(`取消订阅失败 (ID: ${subscriptionId}): ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    this._subscriptions.clear();
  }
  
  /**
   * 发送交易
   */
  async sendTransaction(transaction: Transaction | VersionedTransaction, signers: Signer[], options?: SendOptions): Promise<string> {
    if (!this._connection) {
      throw new Error('RPC连接未初始化');
    }
    
    try {
      // 处理不同类型的交易
      if (transaction instanceof Transaction) {
        // 标准交易
        return await this._connection.sendTransaction(transaction, signers, options);
      } else {
        // 版本化交易
        return await this._connection.sendTransaction(transaction, options);
      }
    } catch (error) {
      logger.error(`发送交易失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 计算重试延迟时间
   */
  private calculateRetryDelay(attempt: number): number {
    const { baseDelay, maxDelay, exponentialFactor, jitter } = this.retryConfig;
    
    // 计算指数退避延迟
    let delay = Math.min(
      baseDelay * Math.pow(exponentialFactor, attempt),
      maxDelay
    );
    
    // 添加随机抖动
    if (jitter) {
      const jitterFactor = 0.2; // 20%的随机抖动
      const randomJitter = Math.random() * delay * jitterFactor;
      delay += randomJitter;
    }
    
    return Math.min(delay, maxDelay);
  }

  /**
   * 更新断路器状态
   */
  private updateCircuitBreakerState(success: boolean): void {
    const now = Date.now();
    
    if (success) {
      // 成功请求，重置失败计数
      if (this.circuitBreakerState === CircuitBreakerState.HALF_OPEN) {
        this.halfOpenCallCount++;
        if (this.halfOpenCallCount >= this.circuitBreakerConfig.halfOpenMaxCalls) {
          // 半开状态下的成功调用达到阈值，关闭断路器
          this.circuitBreakerState = CircuitBreakerState.CLOSED;
          this.failureCount = 0;
          this.halfOpenCallCount = 0;
          logger.info('断路器已关闭，服务恢复正常');
        }
      } else {
        this.failureCount = 0;
      }
    } else {
      // 失败请求
      this.failureCount++;
      this.lastFailureTime = now;
      
      if (this.circuitBreakerState === CircuitBreakerState.CLOSED &&
          this.failureCount >= this.circuitBreakerConfig.failureThreshold) {
        // 失败次数达到阈值，打开断路器
        this.circuitBreakerState = CircuitBreakerState.OPEN;
        logger.warn('断路器已打开，暂停服务调用');
      }
    }
    
    // 检查是否需要从打开状态转为半开状态
    if (this.circuitBreakerState === CircuitBreakerState.OPEN &&
        now - this.lastFailureTime >= this.circuitBreakerConfig.resetTimeout) {
      this.circuitBreakerState = CircuitBreakerState.HALF_OPEN;
      this.halfOpenCallCount = 0;
      logger.info('断路器进入半开状态，允许有限的服务调用');
    }
  }

  /**
   * 检查断路器状态
   */
  private checkCircuitBreaker(): void {
    if (this.circuitBreakerState === CircuitBreakerState.OPEN) {
      throw new Error('断路器打开，服务暂时不可用');
    }
    
    if (this.circuitBreakerState === CircuitBreakerState.HALF_OPEN &&
        this.halfOpenCallCount >= this.circuitBreakerConfig.halfOpenMaxCalls) {
      throw new Error('半开状态下的调用次数已达上限');
    }
  }

  /**
   * 带重试机制的函数执行
   */
  async withRetry<T>(fn: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> {
    const startTime = Date.now();
    let lastError: Error | null = null;
    
    this.checkCircuitBreaker();
    
    for (let attempt = 0; attempt < this.retryConfig.maxRetries; attempt++) {
      try {
        const result = await fn(...args);
        const latency = Date.now() - startTime;
        this.updateMetrics(latency, true, 0, ''); // 假设没有字节传输
        this.updateCircuitBreakerState(true);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const latency = Date.now() - startTime;
        this.updateMetrics(latency, false, 0, '');
        this.updateCircuitBreakerState(false);
        
        logger.warn(`操作失败，准备重试 (${attempt + 1}/${this.retryConfig.maxRetries})`, MODULE_NAME, {
          error: lastError.message,
          circuitBreakerState: this.circuitBreakerState,
          failureCount: this.failureCount
        });
        
        if (attempt < this.retryConfig.maxRetries - 1) {
          const delay = this.calculateRetryDelay(attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('重试次数已达上限');
  }

  /**
   * 获取断路器状态
   */
  getCircuitBreakerState(): CircuitBreakerState {
    return this.circuitBreakerState;
  }

  /**
   * 获取失败计数
   */
  getFailureCount(): number {
    return this.failureCount;
  }

  /**
   * 初始化性能监控
   */
  private initializePerformanceMonitor(): void {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
    }

    this.metricsTimer = setInterval(() => {
      this.collectMetrics();
      this.checkPerformanceAlerts();
      this.cleanupOldMetrics();
    }, this.performanceConfig.metricsInterval);
  }

  /**
   * 收集性能指标
   */
  private collectMetrics(): void {
    const currentMetrics: PerformanceMetrics = {
      ...this.performanceMetrics,
      activeConnections: this.connectionPool.size,
      connectionPoolSize: this.connectionPool.size,
      circuitBreakerState: this.circuitBreakerState
    };

    this.metricsHistory.push(currentMetrics);
    logger.info('性能指标收集完成', MODULE_NAME, {
      metrics: currentMetrics
    });
  }

  /**
   * 检查性能告警
   */
  private checkPerformanceAlerts(): void {
    const currentMetrics = this.performanceMetrics;
    const { thresholds } = this.alertConfig;
    const now = Date.now();

    // 检查冷却期
    if (now - this.lastAlertTime < this.alertConfig.cooldownPeriod) {
      if (this.alertCountInPeriod >= this.alertConfig.maxAlertsPerPeriod) {
        return;
      }
    } else {
      this.alertCountInPeriod = 0;
    }

    const alerts: PerformanceAlert[] = [];

    // 检查延迟
    if (currentMetrics.averageLatency > thresholds.latency.critical) {
      alerts.push(this.createAlert('critical', 'RPC服务延迟严重超标', {
        averageLatency: currentMetrics.averageLatency
      }));
    } else if (currentMetrics.averageLatency > thresholds.latency.error) {
      alerts.push(this.createAlert('error', 'RPC服务延迟过高', {
        averageLatency: currentMetrics.averageLatency
      }));
    } else if (currentMetrics.averageLatency > thresholds.latency.warning) {
      alerts.push(this.createAlert('warning', 'RPC服务延迟偏高', {
        averageLatency: currentMetrics.averageLatency
      }));
    }

    // 检查错误率
    if (currentMetrics.errorRate > thresholds.errorRate.critical) {
      alerts.push(this.createAlert('critical', 'RPC服务错误率严重超标', {
        errorRate: currentMetrics.errorRate
      }));
    } else if (currentMetrics.errorRate > thresholds.errorRate.error) {
      alerts.push(this.createAlert('error', 'RPC服务错误率过高', {
        errorRate: currentMetrics.errorRate
      }));
    } else if (currentMetrics.errorRate > thresholds.errorRate.warning) {
      alerts.push(this.createAlert('warning', 'RPC服务错误率偏高', {
        errorRate: currentMetrics.errorRate
      }));
    }

    // 检查连接池利用率
    if (currentMetrics.connectionUtilization > thresholds.connectionUtilization.critical) {
      alerts.push(this.createAlert('critical', '连接池利用率严重超标', {
        connectionUtilization: currentMetrics.connectionUtilization
      }));
    } else if (currentMetrics.connectionUtilization > thresholds.connectionUtilization.error) {
      alerts.push(this.createAlert('error', '连接池利用率过高', {
        connectionUtilization: currentMetrics.connectionUtilization
      }));
    } else if (currentMetrics.connectionUtilization > thresholds.connectionUtilization.warning) {
      alerts.push(this.createAlert('warning', '连接池利用率偏高', {
        connectionUtilization: currentMetrics.connectionUtilization
      }));
    }

    // 检查请求率
    if (currentMetrics.requestRate > thresholds.requestRate.critical) {
      alerts.push(this.createAlert('critical', '请求率严重超标', {
        requestRate: currentMetrics.requestRate
      }));
    } else if (currentMetrics.requestRate > thresholds.requestRate.error) {
      alerts.push(this.createAlert('error', '请求率过高', {
        requestRate: currentMetrics.requestRate
      }));
    } else if (currentMetrics.requestRate > thresholds.requestRate.warning) {
      alerts.push(this.createAlert('warning', '请求率偏高', {
        requestRate: currentMetrics.requestRate
      }));
    }

    // 处理告警
    alerts.forEach(alert => {
      this.handleAlert(alert);
    });
  }

  /**
   * 创建告警
   */
  private createAlert(
    level: PerformanceAlert['level'],
    message: string,
    metrics: Partial<PerformanceMetrics>
  ): PerformanceAlert {
    return {
      level,
      message,
      timestamp: Date.now(),
      metrics,
      recommendations: this.generateAlertRecommendations(level, metrics)
    };
  }

  /**
   * 处理告警
   */
  private handleAlert(alert: PerformanceAlert): void {
    // 更新告警状态
    this.lastAlertTime = Date.now();
    this.alertCountInPeriod++;
    this.alerts.push(alert);

    // 根据告警级别记录日志
    switch (alert.level) {
      case 'critical':
        logger.error(alert.message, MODULE_NAME, {
          metrics: alert.metrics,
          recommendations: alert.recommendations
        });
        break;
      case 'error':
        logger.error(alert.message, MODULE_NAME, {
          metrics: alert.metrics,
          recommendations: alert.recommendations
        });
        break;
      case 'warning':
        logger.warn(alert.message, MODULE_NAME, {
          metrics: alert.metrics,
          recommendations: alert.recommendations
        });
        break;
      case 'info':
        logger.info(alert.message, MODULE_NAME, {
          metrics: alert.metrics,
          recommendations: alert.recommendations
        });
        break;
    }

    // 清理旧告警
    this.cleanupOldAlerts();
  }

  /**
   * 生成告警建议
   */
  private generateAlertRecommendations(
    level: PerformanceAlert['level'],
    metrics: Partial<PerformanceMetrics>
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.averageLatency && metrics.averageLatency > this.alertConfig.thresholds.latency.warning) {
      recommendations.push('考虑优化RPC请求处理逻辑');
      if (level === 'critical') {
        recommendations.push('建议切换到备用RPC节点');
        recommendations.push('考虑增加连接池大小');
      }
    }

    if (metrics.errorRate && metrics.errorRate > this.alertConfig.thresholds.errorRate.warning) {
      recommendations.push('检查网络连接稳定性');
      if (level === 'critical') {
        recommendations.push('建议启用断路器机制');
        recommendations.push('考虑增加重试次数');
      }
    }

    if (metrics.connectionUtilization && 
        metrics.connectionUtilization > this.alertConfig.thresholds.connectionUtilization.warning) {
      recommendations.push('考虑增加连接池大小');
      if (level === 'critical') {
        recommendations.push('建议立即扩容连接池');
        recommendations.push('考虑负载均衡到其他节点');
      }
    }

    if (metrics.requestRate && metrics.requestRate > this.alertConfig.thresholds.requestRate.warning) {
      recommendations.push('考虑优化请求频率');
      if (level === 'critical') {
        recommendations.push('建议实施请求限流');
        recommendations.push('考虑增加服务实例');
      }
    }

    return recommendations;
  }

  /**
   * 清理旧告警
   */
  private cleanupOldAlerts(): void {
    const cutoffTime = Date.now() - this.alertConfig.cooldownPeriod;
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoffTime);
  }

  /**
   * 获取当前告警
   */
  getCurrentAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  /**
   * 分析性能指标
   */
  private analyzePerformance(windowIndex: number = 0): PerformanceAnalysis {
    const timeWindow = this.metricsWindows[windowIndex];
    const metrics = timeWindow.metrics;
    
    if (metrics.length === 0) {
      return this.createEmptyAnalysis(timeWindow.window);
    }

    // 计算延迟统计
    const latencies = metrics.map(m => m.averageLatency).sort((a, b) => a - b);
    const p95Index = Math.floor(latencies.length * 0.95);
    const p99Index = Math.floor(latencies.length * 0.99);

    // 计算成功率和吞吐量
    const totalRequests = metrics.reduce((sum, m) => sum + m.requestCount, 0);
    const successfulRequests = metrics.reduce((sum, m) => sum + m.successCount, 0);
    const timeSpanSeconds = timeWindow.window / 1000;
    
    // 计算连接池利用率
    const avgConnections = metrics.reduce((sum, m) => sum + m.activeConnections, 0) / metrics.length;
    const utilization = avgConnections / this.poolConfig.maxSize;

    // 计算健康评分
    const healthScore = this.calculateHealthScore({
      errorRate: (totalRequests - successfulRequests) / totalRequests * 100,
      latencyScore: latencies[p95Index] / this.performanceConfig.alertThresholds.latency,
      utilization: utilization
    });

    const analysis: PerformanceAnalysis = {
      timeWindow: timeWindow.window,
      averageLatency: metrics.reduce((sum, m) => sum + m.averageLatency, 0) / metrics.length,
      p95Latency: latencies[p95Index] || 0,
      p99Latency: latencies[p99Index] || 0,
      errorRate: (totalRequests - successfulRequests) / totalRequests * 100,
      successRate: (successfulRequests / totalRequests) * 100,
      throughput: totalRequests / timeSpanSeconds,
      connectionUtilization: utilization * 100,
      healthScore,
      recommendations: this.generateRecommendations(healthScore, {
        errorRate: (totalRequests - successfulRequests) / totalRequests * 100,
        latencyScore: latencies[p95Index] / this.performanceConfig.alertThresholds.latency,
        utilization: utilization
      })
    };

    return analysis;
  }

  /**
   * 计算健康评分
   */
  private calculateHealthScore(metrics: {
    errorRate: number,
    latencyScore: number,
    utilization: number
  }): number {
    // 权重配置
    const weights = {
      errorRate: 0.4,    // 错误率权重
      latency: 0.3,      // 延迟权重
      utilization: 0.3   // 利用率权重
    };

    // 错误率评分 (0-100，错误率越低分数越高)
    const errorScore = Math.max(0, 100 - metrics.errorRate * 2);
    
    // 延迟评分 (0-100，延迟越接近阈值分数越低)
    const latencyScore = Math.max(0, 100 - (metrics.latencyScore * 100));
    
    // 利用率评分 (0-100，最佳利用率在60-80%之间)
    const utilizationScore = metrics.utilization >= 0.6 && metrics.utilization <= 0.8 
      ? 100 
      : Math.max(0, 100 - Math.abs(0.7 - metrics.utilization) * 100);

    // 计算加权总分
    return Math.round(
      errorScore * weights.errorRate +
      latencyScore * weights.latency +
      utilizationScore * weights.utilization
    );
  }

  /**
   * 生成优化建议
   */
  private generateRecommendations(
    healthScore: number,
    metrics: {
      errorRate: number,
      latencyScore: number,
      utilization: number
    }
  ): string[] {
    const recommendations: string[] = [];

    // 基于健康评分的一般建议
    if (healthScore < 60) {
      recommendations.push('系统性能状况需要紧急优化');
    } else if (healthScore < 80) {
      recommendations.push('系统性能有待改善');
    }

    // 基于错误率的建议
    if (metrics.errorRate > 5) {
      recommendations.push('错误率过高，建议检查连接稳定性和错误处理机制');
      if (metrics.errorRate > 10) {
        recommendations.push('考虑增加重试次数或调整断路器阈值');
      }
    }

    // 基于延迟的建议
    if (metrics.latencyScore > 1) {
      recommendations.push('响应延迟较高，建议检查网络状况');
      if (metrics.latencyScore > 2) {
        recommendations.push('考虑增加连接池大小或切换到更快的RPC节点');
      }
    }

    // 基于利用率的建议
    if (metrics.utilization < 0.3) {
      recommendations.push('连接池利用率过低，考虑减少连接池大小');
    } else if (metrics.utilization > 0.8) {
      recommendations.push('连接池利用率过高，考虑增加连接池大小');
    }

    return recommendations;
  }

  /**
   * 创建空的分析结果
   */
  private createEmptyAnalysis(timeWindow: number): PerformanceAnalysis {
    return {
      timeWindow,
      averageLatency: 0,
      p95Latency: 0,
      p99Latency: 0,
      errorRate: 0,
      successRate: 100,
      throughput: 0,
      connectionUtilization: 0,
      healthScore: 100,
      recommendations: ['暂无足够的性能数据进行分析']
    };
  }

  /**
   * 更新性能指标
   */
  private updateMetrics(latency: number, success: boolean, bytesTransferred: number, endpoint: string): void {
    // 更新当前指标
    this.performanceMetrics.requestCount++;
    if (success) {
      this.performanceMetrics.successCount++;
      this.performanceMetrics.lastSuccessTime = Date.now();
    } else {
      this.performanceMetrics.errorCount++;
      this.performanceMetrics.lastErrorTime = Date.now();
    }

    // 更新延迟统计
    this.performanceMetrics.averageLatency = 
      (this.performanceMetrics.averageLatency * (this.performanceMetrics.requestCount - 1) + latency) / 
      this.performanceMetrics.requestCount;
    
    this.performanceMetrics.maxLatency = Math.max(this.performanceMetrics.maxLatency, latency);
    this.performanceMetrics.minLatency = Math.min(this.performanceMetrics.minLatency, latency);
    
    // 更新传输字节数
    this.performanceMetrics.totalBytesTransferred += bytesTransferred;

    // 更新请求率
    const now = Date.now();
    const timeWindow = 1000; // 1秒
    const recentRequests = this.metricsHistory.filter(m => 
      m.lastSuccessTime && now - m.lastSuccessTime <= timeWindow
    ).length;
    this.performanceMetrics.requestRate = recentRequests;

    // 更新错误率和成功率
    this.performanceMetrics.errorRate = 
      (this.performanceMetrics.errorCount / this.performanceMetrics.requestCount) * 100;
    this.performanceMetrics.successRate = 
      (this.performanceMetrics.successCount / this.performanceMetrics.requestCount) * 100;

    // 更新连接池利用率
    this.performanceMetrics.connectionUtilization = 
      (this.performanceMetrics.activeConnections / this.poolConfig.maxSize) * 100;

    // 更新响应时间分布
    const latencies = this.metricsHistory.map(m => m.averageLatency).sort((a, b) => a - b);
    this.performanceMetrics.responseTimeDistribution = {
      p50: this.calculatePercentile(latencies, 50),
      p75: this.calculatePercentile(latencies, 75),
      p90: this.calculatePercentile(latencies, 90),
      p95: this.calculatePercentile(latencies, 95),
      p99: this.calculatePercentile(latencies, 99)
    };

    // 更新端点性能
    if (!this.performanceMetrics.endpointPerformance[endpoint]) {
      this.performanceMetrics.endpointPerformance[endpoint] = {
        requestCount: 0,
        successCount: 0,
        errorCount: 0,
        averageLatency: 0
      };
    }
    const endpointMetrics = this.performanceMetrics.endpointPerformance[endpoint];
    endpointMetrics.requestCount++;
    if (success) {
      endpointMetrics.successCount++;
    } else {
      endpointMetrics.errorCount++;
      endpointMetrics.lastError = this.performanceMetrics.lastError;
      endpointMetrics.lastErrorTime = now;
    }
    endpointMetrics.averageLatency = 
      (endpointMetrics.averageLatency * (endpointMetrics.requestCount - 1) + latency) / 
      endpointMetrics.requestCount;

    // 更新时间窗口指标
    const currentMetrics = { ...this.performanceMetrics };
    this.metricsWindows.forEach(window => {
      // 清理过期指标
      window.metrics = window.metrics.filter(m => 
        m.lastSuccessTime && now - m.lastSuccessTime <= window.window
      );
      // 添加新指标
      window.metrics.push(currentMetrics);
    });

    // 如果性能不佳，生成分析报告
    const analysis = this.analyzePerformance();
    if (analysis.healthScore < 80) {
      logger.warn('性能状况需要注意', MODULE_NAME, {
        analysis,
        recommendations: analysis.recommendations
      });
    }
  }

  /**
   * 计算百分位数
   */
  private calculatePercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[index];
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * 获取性能指标历史
   */
  getPerformanceHistory(): PerformanceMetrics[] {
    return [...this.metricsHistory];
  }

  /**
   * 获取性能分析
   */
  getPerformanceAnalysis(windowIndex: number = 0): PerformanceAnalysis {
    return this.analyzePerformance(windowIndex);
  }

  /**
   * 导出性能报告
   */
  exportPerformanceReport(timeWindow: number = 3600000): PerformanceReport {
    const now = Date.now();
    const cutoffTime = now - timeWindow;
    
    // 获取时间窗口内的指标
    const windowMetrics = this.metricsHistory.filter(m => 
      m.lastSuccessTime && m.lastSuccessTime > cutoffTime
    );

    // 获取时间窗口内的告警
    const windowAlerts = this.alerts.filter(alert => 
      alert.timestamp > cutoffTime
    );

    // 计算汇总统计
    const totalRequests = windowMetrics.reduce((sum, m) => sum + m.requestCount, 0);
    const successfulRequests = windowMetrics.reduce((sum, m) => sum + m.successCount, 0);
    const errorCount = windowMetrics.reduce((sum, m) => sum + m.errorCount, 0);
    const totalLatency = windowMetrics.reduce((sum, m) => sum + m.averageLatency, 0);
    const totalConnections = windowMetrics.reduce((sum, m) => sum + m.activeConnections, 0);

    // 计算端点统计
    const endpointStats: PerformanceReport['endpointStats'] = {};
    Object.entries(this.performanceMetrics.endpointPerformance).forEach(([endpoint, stats]) => {
      endpointStats[endpoint] = {
        requestCount: stats.requestCount,
        successRate: (stats.successCount / stats.requestCount) * 100,
        averageLatency: stats.averageLatency,
        errorRate: (stats.errorCount / stats.requestCount) * 100
      };
    });

    // 生成报告
    const report: PerformanceReport = {
      timestamp: now,
      timeWindow,
      summary: {
        totalRequests,
        successRate: (successfulRequests / totalRequests) * 100,
        averageLatency: totalLatency / windowMetrics.length,
        errorRate: (errorCount / totalRequests) * 100,
        connectionUtilization: (totalConnections / (this.poolConfig.maxSize * windowMetrics.length)) * 100,
        requestRate: totalRequests / (timeWindow / 1000)
      },
      metrics: this.performanceMetrics,
      alerts: windowAlerts,
      recommendations: this.generateReportRecommendations(windowMetrics, windowAlerts),
      endpointStats
    };

    return report;
  }

  /**
   * 生成报告建议
   */
  private generateReportRecommendations(
    metrics: PerformanceMetrics[],
    alerts: PerformanceAlert[]
  ): string[] {
    const recommendations: string[] = [];
    const criticalAlerts = alerts.filter(a => a.level === 'critical');
    const errorAlerts = alerts.filter(a => a.level === 'error');
    const warningAlerts = alerts.filter(a => a.level === 'warning');

    // 基于告警级别的建议
    if (criticalAlerts.length > 0) {
      recommendations.push('系统存在严重性能问题，需要立即处理');
    }
    if (errorAlerts.length > 0) {
      recommendations.push('系统存在性能问题，建议尽快优化');
    }
    if (warningAlerts.length > 0) {
      recommendations.push('系统存在潜在性能问题，建议关注');
    }

    // 基于指标的建议
    const avgLatency = metrics.reduce((sum, m) => sum + m.averageLatency, 0) / metrics.length;
    const avgErrorRate = metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length;
    const avgUtilization = metrics.reduce((sum, m) => sum + m.connectionUtilization, 0) / metrics.length;

    if (avgLatency > this.alertConfig.thresholds.latency.warning) {
      recommendations.push('系统响应延迟偏高，建议优化RPC请求处理');
    }
    if (avgErrorRate > this.alertConfig.thresholds.errorRate.warning) {
      recommendations.push('系统错误率偏高，建议检查网络连接和错误处理机制');
    }
    if (avgUtilization > this.alertConfig.thresholds.connectionUtilization.warning) {
      recommendations.push('连接池利用率偏高，建议考虑扩容');
    }

    // 基于端点性能的建议
    Object.entries(this.performanceMetrics.endpointPerformance).forEach(([endpoint, stats]) => {
      if (stats.errorRate > this.alertConfig.thresholds.errorRate.warning) {
        recommendations.push(`端点 ${endpoint} 错误率偏高，建议检查其稳定性`);
      }
      if (stats.averageLatency > this.alertConfig.thresholds.latency.warning) {
        recommendations.push(`端点 ${endpoint} 响应延迟偏高，建议优化或考虑更换`);
      }
    });

    return recommendations;
  }

  /**
   * 导出性能指标到文件
   */
  async exportMetricsToFile(filePath: string, timeWindow: number = 3600000): Promise<void> {
    try {
      const report = this.exportPerformanceReport(timeWindow);
      const reportStr = JSON.stringify(report, null, 2);
      await fs.promises.writeFile(filePath, reportStr, 'utf-8');
      logger.info('性能指标已导出到文件', MODULE_NAME, { filePath });
    } catch (error) {
      logger.error('导出性能指标失败', MODULE_NAME, {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * 清理旧指标
   */
  private cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - this.performanceConfig.retentionPeriod;
    this.metricsHistory = this.metricsHistory.filter(metrics => 
      metrics.lastSuccessTime && metrics.lastSuccessTime > cutoffTime
    );
  }
}

// 创建单例实例
const rpcService = new RPCService();

// 导出单例实例
export default rpcService; 