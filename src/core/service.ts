/**
 * 基础服务接口
 * 定义了所有服务都应该实现的基本功能
 */
export interface Service {
  start?(): Promise<void>;
  stop?(): Promise<void>;
  startMonitoring?(): Promise<void>;
  startTrading?(): Promise<void>;
  isConnectionHealthy?(): Promise<boolean>;
  on?(event: string, handler: (...args: unknown[]) => void): void;
  handleNewPool?(poolInfo: unknown): void;
}

/**
 * RPC服务接口
 */
export interface RPCService extends Service {
  initialize(): Promise<void>;
  isConnectionHealthy(): Promise<boolean>;
  reconnect(): Promise<boolean>;
}

/**
 * 风险管理器接口
 */
export interface RiskManager extends Service {
  checkRisk(): Promise<boolean>;
}

/**
 * 性能监控器接口
 */
export interface PerformanceMonitor extends Service {
  collectMetrics(): Promise<void>;
} 