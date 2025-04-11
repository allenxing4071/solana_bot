/**
 * 配置管理模块
 * 负责加载、解析和提供系统配置参数
 */

import config from 'config';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'fs-extra';
import { DexType, StrategyConfig, StrategyType, SecurityConfig } from './types';

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
 * 交易策略配置接口
 */
interface SellStrategyConfig {
  takeProfit?: {
    percentage: string;
    enabled: boolean;
  };
  stopLoss?: {
    percentage: string;
    enabled: boolean;
  };
  trailingStop?: {
    percentage: string;
    enabled: boolean;
  };
  timeLimit?: {
    seconds: string;
    enabled: boolean;
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
  // 获取主RPC节点
  let rpcUrl = process.env.SOLANA_RPC_URL || '';
  let wsUrl = process.env.SOLANA_WS_URL || '';
  
  // 如果主RPC节点为空，或者明确标记为使用备用节点，则使用备用节点
  const useBackup = !rpcUrl || process.env.USE_BACKUP_RPC === 'true';
  
  if (useBackup) {
    // 从环境变量中获取备用节点列表
    const backupEndpoints = process.env.BACKUP_RPC_ENDPOINTS?.split(',') || [];
    
    // 如果有备用节点，使用第一个可用的备用节点
    if (backupEndpoints.length > 0) {
      rpcUrl = backupEndpoints[0].trim();
      // 对于WebSocket，我们尝试将http替换为ws，https替换为wss
      wsUrl = rpcUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    }
  }
  
  return {
    cluster: process.env.SOLANA_NETWORK || config.get<string>('network.cluster'),
    rpcUrl,
    wsUrl,
  };
}

/**
 * 获取钱包配置
 */
function getWalletConfig(): WalletConfig {
  return {
    privateKey: process.env.WALLET_PRIVATE_KEY || '',
    maxTransactionAmount: Number.parseFloat(process.env.MAX_TRANSACTION_AMOUNT || '1.0'),
  };
}

/**
 * 获取DEX配置列表
 */
function getDexesConfig(): DexConfig[] {
  const dexes: DexConfig[] = [];
  
  // 从config文件获取DEX列表
  if (config.has('monitoring.poolMonitor.targets')) {
    const targets = config.get<Record<string, unknown>[]>('monitoring.poolMonitor.targets');
    
    for (const target of targets) {
      if (typeof target === 'object' && target && 'name' in target && 'programId' in target) {
        dexes.push({
          name: (target.name as string).toLowerCase() as DexType,
          programId: target.programId as string,
          enabled: 'enabled' in target ? Boolean(target.enabled) : true
        });
      }
    }
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
    ? config.get<Record<string, unknown>>('trading') 
    : {};
  
  return {
    buyStrategy: {
      enabled: process.env.ENABLE_BUY_STRATEGY !== 'false',
      maxAmountPerTrade: Number.parseFloat(process.env.BUY_AMOUNT_SOL || 
        (tradingConfig.buyStrategy as Record<string, unknown>)?.maxAmountPerTrade as string || '0.1'),
      maxSlippage: Number.parseFloat(process.env.MAX_BUY_SLIPPAGE || 
        (tradingConfig.buyStrategy as Record<string, unknown>)?.maxSlippage as string || '5'),
      minConfidence: Number.parseFloat(process.env.MIN_CONFIDENCE || 
        (tradingConfig.buyStrategy as Record<string, unknown>)?.minConfidence as string || '0.7'),
      priorityFee: {
        enabled: process.env.TX_PRIORITY_FEE ? true : 
          ((tradingConfig.buyStrategy as Record<string, unknown>)?.priorityFee as Record<string, unknown>)?.enabled as boolean || false,
        multiplier: Number.parseFloat(process.env.TX_PRIORITY_FEE_MULTIPLIER || 
          ((tradingConfig.buyStrategy as Record<string, unknown>)?.priorityFee as Record<string, unknown>)?.multiplier as string || '1.5'),
        baseFee: Number.parseFloat(process.env.TX_PRIORITY_FEE || 
          ((tradingConfig.buyStrategy as Record<string, unknown>)?.priorityFee as Record<string, unknown>)?.baseFee as string || '0.000005'),
        maxFee: Number.parseFloat(process.env.TX_MAX_PRIORITY_FEE || 
          ((tradingConfig.buyStrategy as Record<string, unknown>)?.priorityFee as Record<string, unknown>)?.maxFee as string || '0.00005')
      }
    },
    sellStrategy: {
      enabled: process.env.ENABLE_SELL_STRATEGY !== 'false',
      conditions: [
        {
          type: StrategyType.TAKE_PROFIT,
          percentage: Number(
            (tradingConfig.sellStrategy as SellStrategyConfig)?.takeProfit?.percentage || '20'
          ),
          enabled: (tradingConfig.sellStrategy as SellStrategyConfig)?.takeProfit?.enabled ?? true
        },
        {
          type: StrategyType.STOP_LOSS,
          percentage: Number(
            (tradingConfig.sellStrategy as SellStrategyConfig)?.stopLoss?.percentage || '10'
          ),
          enabled: (tradingConfig.sellStrategy as SellStrategyConfig)?.stopLoss?.enabled ?? true
        },
        {
          type: StrategyType.TRAILING_STOP,
          percentage: Number(
            (tradingConfig.sellStrategy as SellStrategyConfig)?.trailingStop?.percentage || '5'
          ),
          enabled: (tradingConfig.sellStrategy as SellStrategyConfig)?.trailingStop?.enabled ?? false
        },
        {
          type: StrategyType.TIME_LIMIT,
          timeSeconds: Number(
            (tradingConfig.sellStrategy as SellStrategyConfig)?.timeLimit?.seconds || '300'
          ),
          enabled: (tradingConfig.sellStrategy as SellStrategyConfig)?.timeLimit?.enabled ?? false
        }
      ],
      maxSlippage: Number.parseFloat(process.env.MAX_SELL_SLIPPAGE || 
        (tradingConfig.sellStrategy as Record<string, unknown>)?.maxSlippage as string || '5')
    },
    txRetryCount: parseInt(process.env.TX_RETRY_COUNT || tradingConfig.txRetryCount as string || '3'),
    txConfirmTimeout: parseInt(process.env.TX_CONFIRM_TIMEOUT || tradingConfig.txConfirmTimeout as string || '60000')
  };
}

/**
 * 获取安全配置
 */
function getSecurityConfig(): SecurityConfig {
  const securityConfig = config.has('security') 
    ? config.get<Record<string, unknown>>('security') 
    : {};
  
  return {
    tokenValidation: {
      useWhitelist: process.env.USE_WHITELIST === 'true' || 
        (securityConfig.tokenValidation as Record<string, unknown>)?.useWhitelist as boolean || false,
      useBlacklist: process.env.USE_BLACKLIST !== 'false', // 默认启用黑名单
      whitelistPath: process.env.TOKEN_WHITELIST_PATH || './config/whitelist.json',
      blacklistPath: process.env.TOKEN_BLACKLIST_PATH || './config/blacklist.json',
      minLiquidityUsd: Number.parseFloat(process.env.MIN_LIQUIDITY_USD || 
        (securityConfig.tokenValidation as Record<string, unknown>)?.minLiquidityUsd as string || '1000'),
      minPoolBalanceToken: Number.parseFloat(process.env.MIN_POOL_BALANCE_TOKEN || 
        (securityConfig.tokenValidation as Record<string, unknown>)?.minPoolBalanceToken as string || '100'),
      requireMetadata: process.env.REQUIRE_METADATA === 'true' || 
        (securityConfig.tokenValidation as Record<string, unknown>)?.requireMetadata as boolean || true,
      maxInitialPriceUsd: Number.parseFloat(process.env.MAX_INITIAL_PRICE_USD || 
        (securityConfig.tokenValidation as Record<string, unknown>)?.maxInitialPriceUsd as string || '0.01')
    },
    transactionSafety: {
      simulateBeforeSend: process.env.SIMULATE_BEFORE_SEND !== 'false',
      maxRetryCount: parseInt(process.env.TX_RETRY_COUNT || 
        (securityConfig.transactionSafety as Record<string, unknown>)?.maxRetryCount as string || '3'),
      maxPendingTx: parseInt(process.env.MAX_PENDING_TX || 
        (securityConfig.transactionSafety as Record<string, unknown>)?.maxPendingTx as string || '5')
    }
  };
}

/**
 * 获取通知配置
 */
function getNotificationConfig(): NotificationConfig {
  const notificationConfig = config.has('notification') 
    ? config.get<Record<string, unknown>>('notification') 
    : {};
  
  return {
    telegram: {
      enabled: process.env.ENABLE_TELEGRAM_NOTIFICATIONS === 'true' || 
        (notificationConfig.telegram as Record<string, unknown>)?.enabled as boolean || false,
      botToken: process.env.TELEGRAM_BOT_TOKEN || null,
      chatId: process.env.TELEGRAM_CHAT_ID || null,
      events: ((notificationConfig.telegram as Record<string, unknown>)?.events as Record<string, boolean>) || {
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
    ? config.get<Record<string, unknown>>('logging') 
    : {};
  
  return {
    level: process.env.LOG_LEVEL || loggingConfig.level as string || 'info',
    console: process.env.LOG_TO_CONSOLE !== 'false',
    file: process.env.LOG_TO_FILE === 'true' || loggingConfig.file as boolean || false,
    filename: process.env.LOG_FILE_PATH || loggingConfig.filename as string || './logs/bot.log',
    maxFiles: parseInt(process.env.LOG_MAX_FILES || loggingConfig.maxFiles as string || '5'),
    maxSize: process.env.LOG_MAX_SIZE || loggingConfig.maxSize as string || '10m'
  };
}

/**
 * 获取Jito MEV配置
 */
function getJitoConfig(): JitoConfig {
  const jitoConfig = config.has('jitoMev') 
    ? config.get<Record<string, unknown>>('jitoMev') 
    : {};
  
  return {
    enabled: process.env.USE_JITO_BUNDLE === 'true' || jitoConfig.enabled as boolean || false,
    tipPercent: parseInt(process.env.JITO_TIP_PERCENT || jitoConfig.tipPercent as string || '80'),
    authKeypair: process.env.JITO_AUTH_KEYPAIR || null
  };
}

/**
 * 构建完整配置
 */
function buildConfig() {
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
function validateConfig(config: ReturnType<typeof buildConfig>): boolean {
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