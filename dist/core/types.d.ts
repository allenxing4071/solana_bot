/**
 * 核心类型定义文件
 * 定义了整个系统中使用的基本数据类型和接口
 */
import type { PublicKey } from '@solana/web3.js';
/**
 * DEX交易所类型
 */
export declare enum DexType {
    RAYDIUM = "raydium",
    ORCA = "orca",
    JUPITER = "jupiter"
}
/**
 * 交易池信息接口
 */
export interface PoolInfo {
    address: PublicKey;
    dex: DexType;
    tokenAMint: PublicKey;
    tokenBMint: PublicKey;
    tokenASymbol?: string;
    tokenBSymbol?: string;
    lpMint?: PublicKey;
    createdAt: number;
    firstDetectedAt: number;
    reserves?: {
        tokenA?: bigint;
        tokenB?: bigint;
    };
}
/**
 * 代币信息接口
 */
export interface TokenInfo {
    mint: PublicKey;
    symbol?: string;
    name?: string;
    decimals?: number;
    logo?: string;
    totalSupply?: bigint;
    metadata?: TokenMetadata;
    isVerified?: boolean;
    isTrusted?: boolean;
    isBlacklisted?: boolean;
}
/**
 * 代币元数据接口
 */
export interface TokenMetadata {
    name: string;
    symbol: string;
    uri?: string;
    image?: string;
    description?: string;
}
/**
 * 交易机会接口
 */
export interface TradingOpportunity {
    pool: PoolInfo;
    targetToken: TokenInfo;
    baseToken: TokenInfo;
    estimatedPriceUsd?: number;
    estimatedOutAmount?: bigint;
    estimatedSlippage?: number;
    liquidityUsd?: number;
    confidence: number;
    action: 'buy' | 'sell';
    priorityScore: number;
    timestamp: number;
    sellAmount?: bigint;
}
/**
 * 交易结果接口
 */
export interface TradeResult {
    success: boolean;
    signature?: string;
    txid?: string;
    tokenAmount?: bigint;
    baseTokenAmount?: bigint;
    price?: number;
    priceImpact?: number;
    fee?: number;
    timestamp: number;
    error?: string;
    errorCode?: string;
}
/**
 * 持仓信息接口
 */
export interface Position {
    token: TokenInfo;
    amount: bigint;
    avgBuyPrice?: number;
    costBasis?: number;
    currentPrice?: number;
    profitLoss?: number;
    profitLossPercentage?: number;
    lastUpdated: number;
}
/**
 * 策略类型枚举
 */
export declare enum StrategyType {
    TAKE_PROFIT = "take_profit",// 止盈
    STOP_LOSS = "stop_loss",// 止损
    TRAILING_STOP = "trailing_stop",// 追踪止损
    TIME_LIMIT = "time_limit"
}
/**
 * 策略条件接口
 */
export interface StrategyCondition {
    type: StrategyType;
    percentage?: number;
    timeSeconds?: number;
    enabled: boolean;
}
/**
 * 交易策略配置接口
 */
export interface StrategyConfig {
    buyStrategy: {
        enabled: boolean;
        maxAmountPerTrade: number;
        maxSlippage: number;
        minConfidence: number;
        priorityFee: {
            enabled: boolean;
            multiplier: number;
            baseFee: number;
            maxFee: number;
        };
    };
    sellStrategy: {
        enabled: boolean;
        conditions: StrategyCondition[];
        maxSlippage: number;
    };
    txRetryCount: number;
    txConfirmTimeout: number;
}
/**
 * 余额信息接口
 */
export interface BalanceInfo {
    token: TokenInfo;
    balance: bigint;
    usdValue?: number;
}
/**
 * 系统状态枚举
 */
export declare enum SystemStatus {
    STARTING = "starting",// 启动中
    RUNNING = "running",// 运行中
    PAUSED = "paused",// 暂停
    ERROR = "error",// 错误
    SHUTDOWN = "shutdown",// 关闭
    STOPPING = "stopping",// 正在停止
    STOPPED = "stopped"
}
/**
 * 事件类型枚举
 */
export declare enum EventType {
    POOL_CREATED = "pool_created",
    NEW_POOL_DETECTED = "new_pool_detected",
    TRADE_EXECUTED = "trade_executed",
    POSITION_UPDATED = "position_updated",
    PRICE_UPDATED = "price_updated",
    ERROR_OCCURRED = "error_occurred"
}
/**
 * 系统事件数据类型
 */
export type EventData = PoolInfo | TokenInfo | TradeResult | Position | StrategyCondition | Error | SystemStatus;
/**
 * 系统事件接口
 */
export interface SystemEvent {
    type: EventType;
    data: EventData;
    timestamp: number;
}
/**
 * 通知级别枚举
 */
export declare enum NotificationLevel {
    INFO = "info",// 信息
    WARNING = "warning",// 警告
    SUCCESS = "success",// 成功
    ERROR = "error"
}
/**
 * 通知数据类型
 */
export type NotificationData = TokenInfo | TradeResult | Position | Error | Record<string, unknown>;
/**
 * 通知接口
 */
export interface Notification {
    level: NotificationLevel;
    title: string;
    message: string;
    timestamp: number;
    data?: NotificationData;
}
/**
 * 监控指标接口
 */
export interface MonitoringMetrics {
    startTime: number;
    uptime: number;
    totalOpportunities: number;
    successfulTrades: number;
    failedTrades: number;
    totalProfit: number;
    activePositions: number;
    avgResponseTime: number;
    lastUpdated: number;
}
/**
 * 日志级别枚举
 */
export declare enum LogLevel {
    DEBUG = "debug",// 调试
    INFO = "info",// 信息
    WARN = "warn",// 警告
    ERROR = "error"
}
/**
 * 日志数据类型
 */
export type LogData = string | number | boolean | null | undefined | Record<string, unknown>;
/**
 * 日志记录接口
 */
export interface LogEntry {
    timestamp: number;
    level: LogLevel;
    message: string;
    module: string;
    data?: LogData;
}
/**
 * 安全配置接口
 */
export interface SecurityConfig {
    tokenValidation: {
        useWhitelist: boolean;
        useBlacklist: boolean;
        whitelistPath: string;
        blacklistPath: string;
        minLiquidityUsd: number;
        minPoolBalanceToken: number;
        requireMetadata: boolean;
        maxInitialPriceUsd?: number;
    };
    transactionSafety: {
        simulateBeforeSend: boolean;
        maxRetryCount: number;
        maxPendingTx: number;
    };
}
/**
 * 配置文件接口
 */
export interface AppConfig {
    network: {
        cluster: string;
        rpcUrl: string;
        wsUrl: string;
        connection?: {
            commitment: string;
            confirmTransactionInitialTimeout: number;
        };
    };
    wallet: {
        privateKey: string;
        maxTransactionAmount: number;
    };
    dexes: Array<{
        name: DexType;
        programId: string;
        enabled: boolean;
    }>;
    monitoring: {
        poolMonitorInterval: number;
        priceCheckInterval: number;
        healthCheckInterval: number;
    };
    trading: StrategyConfig;
    security: SecurityConfig;
    notification: {
        telegram: {
            enabled: boolean;
            botToken: string | null;
            chatId: string | null;
            events: Record<string, boolean>;
        };
    };
    logging: {
        level: string;
        console: boolean;
        file: boolean;
        filename: string;
        maxFiles: number;
        maxSize: string;
    };
    jitoMev: {
        enabled: boolean;
        tipPercent: number;
        authKeypair: string | null;
    };
}
