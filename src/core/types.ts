/**
 * 核心类型定义文件
 * 定义了整个系统中使用的基本数据类型和接口
 */

import type { PublicKey } from '@solana/web3.js';

/**
 * DEX交易所类型
 */
export enum DexType {
  RAYDIUM = 'raydium',
  ORCA = 'orca',
  JUPITER = 'jupiter'
}

/**
 * 交易池信息接口
 */
export interface PoolInfo {
  address: PublicKey;          // 池子地址
  dex: DexType;                // 所属DEX
  tokenAMint: PublicKey;       // 代币A的Mint地址
  tokenBMint: PublicKey;       // 代币B的Mint地址
  tokenASymbol?: string;       // 代币A的符号
  tokenBSymbol?: string;       // 代币B的符号
  lpMint?: PublicKey;          // LP代币的Mint地址
  createdAt: number;           // 创建时间
  firstDetectedAt: number;     // 首次检测到时间
  reserves?: {               // 储备金额
    tokenA?: bigint;
    tokenB?: bigint;
  };
}

/**
 * 代币信息接口
 */
export interface TokenInfo {
  mint: PublicKey;             // 代币的Mint地址
  symbol?: string;             // 代币符号
  name?: string;               // 代币名称
  decimals?: number;           // 精度
  logo?: string;               // 图标URL
  totalSupply?: bigint;        // 总供应量
  metadata?: TokenMetadata;    // 代币元数据
  isVerified?: boolean;        // 是否已验证
  isTrusted?: boolean;         // 是否可信
  isBlacklisted?: boolean;     // 是否黑名单
}

/**
 * 代币元数据接口
 */
export interface TokenMetadata {
  name: string;                // 名称
  symbol: string;              // 符号
  uri?: string;                // 元数据URI
  image?: string;              // 图片URL
  description?: string;        // 描述
}

/**
 * 交易机会接口
 */
export interface TradingOpportunity {
  pool: PoolInfo;              // 交易池信息
  targetToken: TokenInfo;      // 目标代币信息
  baseToken: TokenInfo;        // 基础代币信息(通常是SOL或USDC)
  estimatedPriceUsd?: number;  // 估计美元价格
  estimatedOutAmount?: bigint; // 估计输出数量
  estimatedSlippage?: number;  // 估计滑点
  liquidityUsd?: number;       // 流动性(美元)
  confidence: number;          // 信心度(0-1)
  action: 'buy' | 'sell';      // 交易行为
  priorityScore: number;       // 优先级分数
  timestamp: number;           // 时间戳
  sellAmount?: bigint;         // 卖出金额(仅在action=sell时使用)
}

/**
 * 交易结果接口
 */
export interface TradeResult {
  success: boolean;            // 是否成功
  signature?: string;          // 交易签名
  txid?: string;               // 交易ID
  tokenAmount?: bigint;        // 代币数量
  baseTokenAmount?: bigint;    // 基础代币数量
  price?: number;              // 价格
  priceImpact?: number;        // 价格影响
  fee?: number;                // 交易费用
  timestamp: number;           // 时间戳
  error?: string;              // 错误信息
  errorCode?: string;          // 错误代码
}

/**
 * 持仓信息接口
 */
export interface Position {
  token: TokenInfo;            // 代币信息
  amount: bigint;              // 持有数量
  avgBuyPrice?: number;        // 平均买入价格
  costBasis?: number;          // 成本基础
  currentPrice?: number;       // 当前价格
  profitLoss?: number;         // 盈亏
  profitLossPercentage?: number; // 盈亏百分比
  lastUpdated: number;         // 最后更新时间
}

/**
 * 策略类型枚举
 */
export enum StrategyType {
  TAKE_PROFIT = 'take_profit',   // 止盈
  STOP_LOSS = 'stop_loss',       // 止损
  TRAILING_STOP = 'trailing_stop', // 追踪止损
  TIME_LIMIT = 'time_limit'      // 时间限制
}

/**
 * 策略条件接口
 */
export interface StrategyCondition {
  type: StrategyType;              // 策略类型
  percentage?: number;             // 百分比
  timeSeconds?: number;            // 时间(秒)
  enabled: boolean;                // 是否启用
}

/**
 * 交易策略配置接口
 */
export interface StrategyConfig {
  buyStrategy: {
    enabled: boolean;
    maxAmountPerTrade: number;     // 每笔交易最大金额
    maxSlippage: number;           // 最大滑点
    minConfidence: number;
    priorityFee: {
      enabled: boolean;            // 是否启用优先费
      multiplier: number;
    }
  };
  sellStrategy: {
    enabled: boolean;
    conditions: StrategyCondition[]; // 卖出条件
  };
  tokenValidation: {
    enabled: boolean;
    minLiquidityUsd: number;
    maxInitialPriceUsd: number;
    requiresMetadata: boolean;
    blacklistEnabled: boolean;
    whitelistEnabled: boolean;
  };
  txRetryCount: number;
  txConfirmTimeout: number;
}

/**
 * 余额信息接口
 */
export interface BalanceInfo {
  token: TokenInfo;                // 代币信息
  balance: bigint;                 // 余额
  usdValue?: number;               // 美元价值
}

/**
 * 系统状态枚举
 */
export enum SystemStatus {
  STARTING = 'starting',            // 启动中
  RUNNING = 'running',              // 运行中
  PAUSED = 'paused',                // 暂停
  ERROR = 'error',                  // 错误
  SHUTDOWN = 'shutdown'             // 关闭
}

/**
 * 事件类型枚举
 */
export enum EventType {
  POOL_CREATED = 'pool_created',
  TRADE_EXECUTED = 'trade_executed',
  POSITION_UPDATED = 'position_updated',
  PRICE_UPDATED = 'price_updated',
  ERROR_OCCURRED = 'error_occurred'
}

/**
 * 系统事件数据类型
 */
export type EventData = 
  | PoolInfo 
  | TokenInfo 
  | TradeResult 
  | Position 
  | StrategyCondition 
  | Error 
  | SystemStatus;

/**
 * 系统事件接口
 */
export interface SystemEvent {
  type: EventType;                  // 事件类型
  data: EventData;                  // 事件数据
  timestamp: number;                // 时间戳
}

/**
 * 通知级别枚举
 */
export enum NotificationLevel {
  INFO = 'info',                    // 信息
  WARNING = 'warning',              // 警告
  SUCCESS = 'success',              // 成功
  ERROR = 'error'                   // 错误
}

/**
 * 通知数据类型
 */
export type NotificationData = 
  | TokenInfo 
  | TradeResult 
  | Position 
  | Error 
  | Record<string, unknown>;

/**
 * 通知接口
 */
export interface Notification {
  level: NotificationLevel;         // 通知级别
  title: string;                    // 标题
  message: string;                  // 消息
  timestamp: number;                // 时间戳
  data?: NotificationData;          // 附加数据
}

/**
 * 监控指标接口
 */
export interface MonitoringMetrics {
  startTime: number;                // 启动时间
  uptime: number;                   // 运行时间
  totalOpportunities: number;       // 总机会数
  successfulTrades: number;         // 成功交易数
  failedTrades: number;             // 失败交易数
  totalProfit: number;              // 总利润
  activePositions: number;          // 活跃持仓数
  avgResponseTime: number;          // 平均响应时间
  lastUpdated: number;              // 最后更新时间
}

/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 'debug',                  // 调试
  INFO = 'info',                    // 信息
  WARN = 'warn',                    // 警告
  ERROR = 'error'                   // 错误
}

/**
 * 日志数据类型
 */
export type LogData = 
  | string 
  | number 
  | boolean 
  | null 
  | undefined 
  | Record<string, unknown>;

/**
 * 日志记录接口
 */
export interface LogEntry {
  timestamp: number;                // 时间戳
  level: LogLevel;                  // 日志级别
  message: string;                  // 消息
  module: string;                   // 模块
  data?: LogData;                   // 附加数据
}

/**
 * 配置文件接口
 */
export interface AppConfig {
  // RPC配置
  rpc: {
    endpoints: Array<{
      url: string;
      weight: number;
      name?: string;
      enabled?: boolean;
    }>;
    reconnectInterval: number;
    maxRetries: number;
  };
  
  // DEX配置
  dexes: Array<{
    name: string;
    programId: string;
    enabled: boolean;
    poolAddressFilter?: string;
  }>;
  
  // 日志配置
  logging: {
    level: string;
    file?: string;
    console: boolean;
  };
  
  // 系统配置
  system: {
    pollInterval: number;
    priceCheckInterval: number;
    monitoringEnabled: boolean;
  };
  
  // 交易策略配置
  trading: StrategyConfig;
} 