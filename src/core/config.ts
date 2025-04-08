/**
 * 配置管理模块
 * 负责加载、解析和提供系统配置参数
 */

import config from 'config';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs-extra';
import { DexType, StrategyConfig, StrategyType } from './types';

// 加载环境变量
dotenv.config();

/**
 * 网络配置接口
 */
interface NetworkConfig {
  cluster: string;
  rpcUrl: string;
  wsUrl: string;
}

/**
 * 钱包配置接口
 */
interface WalletConfig {
  privateKey: string;
  maxTransactionAmount: number;
}

/**
 * DEX配置接口
 */
interface DexConfig {
  name: DexType;
  programId: string;
  enabled: boolean;
}

/**
 * 监控配置接口
 */
interface MonitoringConfig {
  poolMonitorInterval: number;
  priceCheckInterval: number;
  healthCheckInterval: number;
}

/**
 * 通知配置接口
 */
interface NotificationConfig {
  telegram: {
    enabled: boolean;
    botToken: string | null;
    chatId: string | null;
    events: Record<string, boolean>;
  };
}

/**
 * 日志配置接口
 */
interface LoggingConfig {
  level: string;
  console: boolean;
  file: boolean;
  filename: string;
  maxFiles: number;
  maxSize: string;
}

/**
 * Jito MEV配置接口
 */
interface JitoConfig {
  enabled: boolean;
  tipPercent: number;
  authKeypair: string | null;
}

/**
 * 安全配置接口
 */
interface SecurityConfig {
  tokenValidation: {
    useWhitelist: boolean;
    useBlacklist: boolean;
    whitelistPath: string;
    blacklistPath: string;
    minLiquidityUsd: number;
    minPoolBalanceToken: number;
    requireMetadata: boolean;
  };
  transactionSafety: {
    simulateBeforeSend: boolean;
    maxRetryCount: number;
    maxPendingTx: number;
  };
}

/**
 * 完整配置接口
 */
export interface AppConfig {
  network: NetworkConfig;
  wallet: WalletConfig;
  dexes: DexConfig[];
  monitoring: MonitoringConfig;
  trading: StrategyConfig;
  security: SecurityConfig;
  notification: NotificationConfig;
  logging: LoggingConfig;
  jitoMev: JitoConfig;
}

/**
 * 获取网络配置
 */
function getNetworkConfig(): NetworkConfig {
  return {
    cluster: process.env.SOLANA_NETWORK || config.get<string>('network.cluster'),
    rpcUrl: process.env.SOLANA_RPC_URL || '',
    wsUrl: process.env.SOLANA_WS_URL || '',
  };
}

/**
 * 获取钱包配置
 */
function getWalletConfig(): WalletConfig {
  return {
    privateKey: process.env.WALLET_PRIVATE_KEY || '',
    maxTransactionAmount: parseFloat(process.env.MAX_TRANSACTION_AMOUNT || '1.0'),
  };
}

/**
 * 获取DEX配置列表
 */
function getDexesConfig(): DexConfig[] {
  const dexes: DexConfig[] = [];
  
  // 从config文件获取DEX列表
  if (config.has('monitoring.poolMonitor.targets')) {
    const targets = config.get<any[]>('monitoring.poolMonitor.targets');
    targets.forEach(target => {
      dexes.push({
        name: target.name.toLowerCase() as DexType,
        programId: target.programId,
        enabled: target.enabled
      });
    });
  }
  
  // 添加环境变量中的DEX(如果有)
  if (process.env.RAYDIUM_PROGRAM_ID) {
    dexes.push({
      name: DexType.RAYDIUM,
      programId: process.env.RAYDIUM_PROGRAM_ID,
      enabled: true
    });
  }
  
  if (process.env.ORCA_PROGRAM_ID) {
    dexes.push({
      name: DexType.ORCA,
      programId: process.env.ORCA_PROGRAM_ID,
      enabled: true
    });
  }
  
  return dexes;
}

/**
 * 获取监控配置
 */
function getMonitoringConfig(): MonitoringConfig {
  return {
    poolMonitorInterval: parseInt(process.env.POOL_MONITOR_INTERVAL || '5000'),
    priceCheckInterval: parseInt(process.env.PRICE_CHECK_INTERVAL || '3000'),
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000')
  };
}

/**
 * 获取交易策略配置
 */
function getTradingConfig(): StrategyConfig {
  const tradingConfig = config.has('trading') 
    ? config.get<any>('trading') 
    : {};
  
  return {
    buyStrategy: {
      maxAmountPerTrade: parseFloat(process.env.BUY_AMOUNT_SOL || tradingConfig.buyStrategy?.maxAmountPerTrade || '0.1'),
      maxSlippage: parseFloat(process.env.MAX_BUY_SLIPPAGE || tradingConfig.buyStrategy?.maxSlippage || '5'),
      priorityFee: {
        enabled: process.env.TX_PRIORITY_FEE ? true : (tradingConfig.buyStrategy?.priorityFee?.enabled || false),
        baseFee: parseFloat(process.env.TX_PRIORITY_FEE || tradingConfig.buyStrategy?.priorityFee?.baseFee || '0.000005'),
        maxFee: parseFloat(process.env.TX_MAX_PRIORITY_FEE || tradingConfig.buyStrategy?.priorityFee?.maxFee || '0.00005')
      }
    },
    sellStrategy: {
      conditions: [
        {
          type: StrategyType.TAKE_PROFIT,
          percentage: parseFloat(process.env.TAKE_PROFIT_PERCENTAGE || tradingConfig.sellStrategy?.takeProfit?.percentage || '20'),
          enabled: process.env.TAKE_PROFIT_PERCENTAGE ? true : (tradingConfig.sellStrategy?.takeProfit?.enabled || true)
        },
        {
          type: StrategyType.STOP_LOSS,
          percentage: parseFloat(process.env.STOP_LOSS_PERCENTAGE || tradingConfig.sellStrategy?.stopLoss?.percentage || '10'),
          enabled: process.env.STOP_LOSS_PERCENTAGE ? true : (tradingConfig.sellStrategy?.stopLoss?.enabled || true)
        },
        {
          type: StrategyType.TRAILING_STOP,
          percentage: parseFloat(process.env.TRAILING_STOP_PERCENTAGE || tradingConfig.sellStrategy?.trailingStop?.percentage || '5'),
          enabled: process.env.TRAILING_STOP_PERCENTAGE ? true : (tradingConfig.sellStrategy?.trailingStop?.enabled || false)
        },
        {
          type: StrategyType.TIME_LIMIT,
          timeSeconds: parseInt(process.env.TIME_LIMIT_SECONDS || tradingConfig.sellStrategy?.timeLimit?.seconds || '300'),
          enabled: process.env.TIME_LIMIT_SECONDS ? true : (tradingConfig.sellStrategy?.timeLimit?.enabled || false)
        }
      ],
      maxSlippage: parseFloat(process.env.MAX_SELL_SLIPPAGE || tradingConfig.sellStrategy?.maxSlippage || '5')
    }
  };
}

/**
 * 获取安全配置
 */
function getSecurityConfig(): SecurityConfig {
  const securityConfig = config.has('security') 
    ? config.get<any>('security') 
    : {};
  
  return {
    tokenValidation: {
      useWhitelist: process.env.USE_WHITELIST === 'true' || securityConfig.tokenValidation?.useWhitelist || false,
      useBlacklist: process.env.USE_BLACKLIST !== 'false', // 默认启用黑名单
      whitelistPath: process.env.TOKEN_WHITELIST_PATH || './config/whitelist.json',
      blacklistPath: process.env.TOKEN_BLACKLIST_PATH || './config/blacklist.json',
      minLiquidityUsd: parseFloat(process.env.MIN_LIQUIDITY_USD || securityConfig.tokenValidation?.minLiquidityUsd || '1000'),
      minPoolBalanceToken: parseFloat(process.env.MIN_POOL_BALANCE_TOKEN || securityConfig.tokenValidation?.minPoolBalanceToken || '100'),
      requireMetadata: process.env.REQUIRE_METADATA === 'true' || securityConfig.tokenValidation?.requireMetadata || true
    },
    transactionSafety: {
      simulateBeforeSend: process.env.SIMULATE_BEFORE_SEND !== 'false',
      maxRetryCount: parseInt(process.env.TX_RETRY_COUNT || securityConfig.transactionSafety?.maxRetryCount || '3'),
      maxPendingTx: parseInt(process.env.MAX_PENDING_TX || securityConfig.transactionSafety?.maxPendingTx || '5')
    }
  };
}

/**
 * 获取通知配置
 */
function getNotificationConfig(): NotificationConfig {
  const notificationConfig = config.has('notification') 
    ? config.get<any>('notification') 
    : {};
  
  return {
    telegram: {
      enabled: process.env.ENABLE_TELEGRAM_NOTIFICATIONS === 'true' || notificationConfig.telegram?.enabled || false,
      botToken: process.env.TELEGRAM_BOT_TOKEN || null,
      chatId: process.env.TELEGRAM_CHAT_ID || null,
      events: notificationConfig.telegram?.events || {
        startup: true,
        newTokenDetected: true,
        buyExecuted: true,
        sellExecuted: true,
        error: true
      }
    }
  };
}

/**
 * 获取日志配置
 */
function getLoggingConfig(): LoggingConfig {
  const loggingConfig = config.has('logging') 
    ? config.get<any>('logging') 
    : {};
  
  return {
    level: process.env.LOG_LEVEL || loggingConfig.level || 'info',
    console: process.env.LOG_TO_CONSOLE !== 'false',
    file: process.env.LOG_TO_FILE === 'true' || loggingConfig.file || false,
    filename: process.env.LOG_FILE_PATH || loggingConfig.filename || './logs/bot.log',
    maxFiles: parseInt(process.env.LOG_MAX_FILES || loggingConfig.maxFiles || '5'),
    maxSize: process.env.LOG_MAX_SIZE || loggingConfig.maxSize || '10m'
  };
}

/**
 * 获取Jito MEV配置
 */
function getJitoConfig(): JitoConfig {
  const jitoConfig = config.has('jitoMev') 
    ? config.get<any>('jitoMev') 
    : {};
  
  return {
    enabled: process.env.USE_JITO_BUNDLE === 'true' || jitoConfig.enabled || false,
    tipPercent: parseInt(process.env.JITO_TIP_PERCENT || jitoConfig.tipPercent || '80'),
    authKeypair: process.env.JITO_AUTH_KEYPAIR || null
  };
}

/**
 * 构建完整配置
 */
function buildConfig(): AppConfig {
  return {
    network: getNetworkConfig(),
    wallet: getWalletConfig(),
    dexes: getDexesConfig(),
    monitoring: getMonitoringConfig(),
    trading: getTradingConfig(),
    security: getSecurityConfig(),
    notification: getNotificationConfig(),
    logging: getLoggingConfig(),
    jitoMev: getJitoConfig()
  };
}

/**
 * 验证配置是否有效
 */
function validateConfig(config: AppConfig): boolean {
  // 验证必要的网络设置
  if (!config.network.rpcUrl) {
    throw new Error('未设置Solana RPC URL，请在.env文件或配置文件中设置SOLANA_RPC_URL');
  }
  
  // 验证钱包设置
  if (!config.wallet.privateKey) {
    throw new Error('未设置钱包私钥，请在.env文件中设置WALLET_PRIVATE_KEY');
  }
  
  // 创建日志目录(如果不存在)
  if (config.logging.file) {
    const logDir = path.dirname(config.logging.filename);
    fs.ensureDirSync(logDir);
  }
  
  return true;
}

// 构建并导出配置
export const appConfig = buildConfig();

// 验证配置
validateConfig(appConfig);

export default appConfig; 