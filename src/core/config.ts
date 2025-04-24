/**
 * @file config.ts
 * @description 配置处理模块，读取和验证应用配置
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { DexType } from './types';

// 载入.env文件
dotenv.config();

/**
 * DEX配置接口
 */
export interface DexConfig {
  name: DexType;
  programId: string;
  enabled: boolean;
}

/**
 * API配置接口
 */
export interface ApiConfig {
  port: number;
  useMockData: boolean;
  enableAuth: boolean;
  apiKey: string;
  cors: {
    origin: string;
    methods: string[];
    allowedHeaders: string[];
  };
  staticDir: string;
}

/**
 * 日志配置接口
 */
export interface LoggingConfig {
  level: string;
  console: boolean;
  file: boolean;
  filename: string;
  maxFiles: number;
  maxSize: string;
}

/**
 * 应用配置接口
 */
export interface AppConfig {
  environment: string;
  api: ApiConfig;
  logging: LoggingConfig;
  
  // 网络配置
  network: {
    cluster: string;
    rpcUrl: string;
    wsUrl: string;
    connection: {
      commitment: string;
      confirmTransactionInitialTimeout: number;
    }
  };
  
  // 钱包配置
  wallet: {
    privateKey: string;
    maxTransactionAmount: number;
  };
  
  // DEX配置
  dexes: DexConfig[];
  
  // 监控配置
  monitoring: {
    poolMonitorInterval: number;
    priceCheckInterval: number;
    healthCheckInterval: number;
  };
  
  // 交易策略配置
  trading: {
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
      }
    };
    sellStrategy: {
      enabled: boolean;
      conditions: any[];
      maxSlippage: number;
    };
    maxTransactionAmount: number;
    buyAmountSol: number;
    maxBuySlippage: number;
    maxSellSlippage: number;
    txRetryCount: number;
    txConfirmTimeout: number;
    txPriorityFee: number;
  };
  
  // 安全配置
  security: {
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
  };
  
  // 通知配置
  notification: {
    telegram: {
      enabled: boolean;
      botToken: string | null;
      chatId: string | null;
      events: Record<string, boolean>;
    }
  };
  
  // Jito MEV配置
  jitoMev: {
    enabled: boolean;
    tipPercent: number;
    authKeypair: string | null;
  };
}

// 默认值
const defaultConfig: AppConfig = {
  environment: 'development',
  api: {
    port: 3000,
    useMockData: false,
    enableAuth: false,
    apiKey: '',
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'x-api-key']
    },
    staticDir: path.join(__dirname, '../public')
  },
  logging: {
    level: 'info',
    console: true,
    file: false,
    filename: 'app.log',
    maxFiles: 5,
    maxSize: '10m'
  },
  network: {
    cluster: 'mainnet-beta',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    wsUrl: 'wss://api.mainnet-beta.solana.com',
    connection: {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000
    }
  },
  wallet: {
    privateKey: '',
    maxTransactionAmount: 0.1
  },
  dexes: [
    {
      name: DexType.RAYDIUM,
      programId: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
      enabled: true
    },
    {
      name: DexType.ORCA,
      programId: '9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP',
      enabled: true
    },
    {
      name: DexType.JUPITER,
      programId: 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB',
      enabled: true
    }
  ],
  monitoring: {
    poolMonitorInterval: 5000,
    priceCheckInterval: 5000,
    healthCheckInterval: 30000
  },
  trading: {
    buyStrategy: {
      enabled: true,
      maxAmountPerTrade: 0.1,
      maxSlippage: 5,
      minConfidence: 0.8,
      priorityFee: {
        enabled: true,
        multiplier: 1.5,
        baseFee: 0.000005,
        maxFee: 0.0001
      }
    },
    sellStrategy: {
      enabled: true,
      conditions: [],
      maxSlippage: 5
    },
    maxTransactionAmount: 0.1,
    buyAmountSol: 0.05,
    maxBuySlippage: 5,
    maxSellSlippage: 5,
    txRetryCount: 3,
    txConfirmTimeout: 60000,
    txPriorityFee: 0.000005
  },
  security: {
    tokenValidation: {
      useWhitelist: false,
      useBlacklist: true,
      whitelistPath: './config/whitelist.json',
      blacklistPath: './config/blacklist.json',
      minLiquidityUsd: 1000,
      minPoolBalanceToken: 1000,
      requireMetadata: true,
      maxInitialPriceUsd: 0.01
    },
    transactionSafety: {
      simulateBeforeSend: true,
      maxRetryCount: 3,
      maxPendingTx: 5
    }
  },
  notification: {
    telegram: {
      enabled: false,
      botToken: null,
      chatId: null,
      events: {}
    }
  },
  jitoMev: {
    enabled: false,
    tipPercent: 90,
    authKeypair: null
  }
};

// 构建最终配置
const appConfig: AppConfig = {
  ...defaultConfig,
  environment: process.env.NODE_ENV || defaultConfig.environment,
  api: {
    ...defaultConfig.api,
    port: parseInt(process.env.API_PORT || defaultConfig.api.port.toString(), 10),
    useMockData: process.env.USE_MOCK_DATA === 'true' || defaultConfig.api.useMockData,
    enableAuth: process.env.API_AUTH_ENABLED === 'true' || defaultConfig.api.enableAuth,
    apiKey: process.env.API_KEY || defaultConfig.api.apiKey,
  },
  logging: {
    ...defaultConfig.logging,
    level: process.env.LOG_LEVEL || defaultConfig.logging.level,
    console: process.env.LOG_TO_CONSOLE === 'true' || defaultConfig.logging.console,
    file: process.env.LOG_TO_FILE === 'true' || defaultConfig.logging.file,
    filename: process.env.LOG_FILENAME || defaultConfig.logging.filename,
    maxFiles: parseInt(process.env.LOG_MAX_FILES || defaultConfig.logging.maxFiles.toString(), 10),
    maxSize: process.env.LOG_MAX_SIZE || defaultConfig.logging.maxSize
  },
  network: {
    ...defaultConfig.network,
    cluster: process.env.SOLANA_CLUSTER || defaultConfig.network.cluster,
    rpcUrl: process.env.SOLANA_RPC_URL || defaultConfig.network.rpcUrl,
    wsUrl: process.env.SOLANA_WS_URL || defaultConfig.network.wsUrl,
    connection: {
      ...defaultConfig.network.connection,
      commitment: process.env.SOLANA_COMMITMENT || defaultConfig.network.connection?.commitment,
      confirmTransactionInitialTimeout: parseInt(process.env.SOLANA_CONFIRM_TIMEOUT || 
        defaultConfig.network.connection?.confirmTransactionInitialTimeout.toString() || '60000', 10)
    }
  },
  wallet: {
    ...defaultConfig.wallet,
    privateKey: process.env.WALLET_PRIVATE_KEY || defaultConfig.wallet.privateKey,
    maxTransactionAmount: parseFloat(process.env.MAX_TRANSACTION_AMOUNT || 
      defaultConfig.wallet.maxTransactionAmount.toString())
  },
  dexes: process.env.DEXES ? process.env.DEXES.split(',').map(dex => {
    const [name, programId] = dex.split(':');
    return {
      name: name.toLowerCase() === 'raydium' ? DexType.RAYDIUM :
            name.toLowerCase() === 'orca' ? DexType.ORCA :
            name.toLowerCase() === 'jupiter' ? DexType.JUPITER :
            DexType.RAYDIUM,
      programId,
      enabled: true
    };
  }) : defaultConfig.dexes,
  monitoring: {
    ...defaultConfig.monitoring,
    poolMonitorInterval: parseInt(process.env.POOL_MONITOR_INTERVAL || 
      defaultConfig.monitoring.poolMonitorInterval.toString(), 10),
    priceCheckInterval: parseInt(process.env.PRICE_CHECK_INTERVAL || 
      defaultConfig.monitoring.priceCheckInterval.toString(), 10),
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || 
      defaultConfig.monitoring.healthCheckInterval.toString(), 10)
  },
  trading: {
    ...defaultConfig.trading,
    buyStrategy: {
      ...defaultConfig.trading.buyStrategy,
      enabled: process.env.BUY_STRATEGY_ENABLED === 'true' || defaultConfig.trading.buyStrategy.enabled,
      maxAmountPerTrade: parseFloat(process.env.BUY_STRATEGY_MAX_AMOUNT_PER_TRADE || 
        defaultConfig.trading.buyStrategy.maxAmountPerTrade.toString()),
      maxSlippage: parseInt(process.env.BUY_STRATEGY_MAX_SLIPPAGE || 
        defaultConfig.trading.buyStrategy.maxSlippage.toString(), 10),
      minConfidence: parseFloat(process.env.BUY_STRATEGY_MIN_CONFIDENCE || 
        defaultConfig.trading.buyStrategy.minConfidence.toString()),
      priorityFee: {
        ...defaultConfig.trading.buyStrategy.priorityFee,
        enabled: process.env.BUY_STRATEGY_PRIORITY_FEE_ENABLED === 'true' || defaultConfig.trading.buyStrategy.priorityFee.enabled,
        multiplier: parseFloat(process.env.BUY_STRATEGY_PRIORITY_FEE_MULTIPLIER || 
          defaultConfig.trading.buyStrategy.priorityFee.multiplier.toString()),
        baseFee: parseFloat(process.env.BUY_STRATEGY_PRIORITY_FEE_BASE_FEE || 
          defaultConfig.trading.buyStrategy.priorityFee.baseFee.toString()),
        maxFee: parseFloat(process.env.BUY_STRATEGY_PRIORITY_FEE_MAX_FEE || 
          defaultConfig.trading.buyStrategy.priorityFee.maxFee.toString())
      }
    },
    sellStrategy: {
      ...defaultConfig.trading.sellStrategy,
      enabled: process.env.SELL_STRATEGY_ENABLED === 'true' || defaultConfig.trading.sellStrategy.enabled,
      conditions: process.env.SELL_STRATEGY_CONDITIONS ? 
        JSON.parse(process.env.SELL_STRATEGY_CONDITIONS) : defaultConfig.trading.sellStrategy.conditions,
      maxSlippage: parseInt(process.env.SELL_STRATEGY_MAX_SLIPPAGE || 
        defaultConfig.trading.sellStrategy.maxSlippage.toString(), 10)
    },
    maxTransactionAmount: parseFloat(process.env.MAX_TRANSACTION_AMOUNT || 
      defaultConfig.trading.maxTransactionAmount.toString()),
    buyAmountSol: parseFloat(process.env.BUY_AMOUNT_SOL || 
      defaultConfig.trading.buyAmountSol.toString()),
    maxBuySlippage: parseInt(process.env.MAX_BUY_SLIPPAGE || 
      defaultConfig.trading.maxBuySlippage.toString(), 10),
    maxSellSlippage: parseInt(process.env.MAX_SELL_SLIPPAGE || 
      defaultConfig.trading.maxSellSlippage.toString(), 10),
    txRetryCount: parseInt(process.env.TX_RETRY_COUNT || 
      defaultConfig.trading.txRetryCount.toString(), 10),
    txConfirmTimeout: parseInt(process.env.TX_CONFIRM_TIMEOUT || 
      defaultConfig.trading.txConfirmTimeout.toString(), 10),
    txPriorityFee: parseFloat(process.env.TX_PRIORITY_FEE || 
      defaultConfig.trading.txPriorityFee.toString())
  },
  security: {
    ...defaultConfig.security,
    tokenValidation: {
      ...defaultConfig.security.tokenValidation,
      useWhitelist: process.env.TOKEN_WHITELIST_ENABLED === 'true' || defaultConfig.security.tokenValidation.useWhitelist,
      useBlacklist: process.env.TOKEN_BLACKLIST_ENABLED === 'true' || defaultConfig.security.tokenValidation.useBlacklist,
      whitelistPath: process.env.TOKEN_WHITELIST_PATH || defaultConfig.security.tokenValidation.whitelistPath,
      blacklistPath: process.env.TOKEN_BLACKLIST_PATH || defaultConfig.security.tokenValidation.blacklistPath,
      minLiquidityUsd: parseFloat(process.env.MIN_LIQUIDITY_USD || 
        defaultConfig.security.tokenValidation.minLiquidityUsd.toString()),
      minPoolBalanceToken: parseInt(process.env.MIN_POOL_BALANCE_TOKEN || 
        defaultConfig.security.tokenValidation.minPoolBalanceToken.toString(), 10),
      requireMetadata: process.env.TOKEN_METADATA_REQUIRED === 'true' || defaultConfig.security.tokenValidation.requireMetadata,
      maxInitialPriceUsd: process.env.MAX_INITIAL_PRICE_USD ? 
        parseFloat(process.env.MAX_INITIAL_PRICE_USD) : defaultConfig.security.tokenValidation.maxInitialPriceUsd
    },
    transactionSafety: {
      ...defaultConfig.security.transactionSafety,
      simulateBeforeSend: process.env.TRANSACTION_SAFETY_SIMULATE === 'true' || defaultConfig.security.transactionSafety.simulateBeforeSend,
      maxRetryCount: parseInt(process.env.TRANSACTION_SAFETY_MAX_RETRY_COUNT || 
        defaultConfig.security.transactionSafety.maxRetryCount.toString(), 10),
      maxPendingTx: parseInt(process.env.TRANSACTION_SAFETY_MAX_PENDING_TX || 
        defaultConfig.security.transactionSafety.maxPendingTx.toString(), 10)
    }
  },
  notification: {
    ...defaultConfig.notification,
    telegram: {
      ...defaultConfig.notification.telegram,
      enabled: process.env.TELEGRAM_NOTIFICATION_ENABLED === 'true' || defaultConfig.notification.telegram.enabled,
      botToken: process.env.TELEGRAM_BOT_TOKEN || defaultConfig.notification.telegram.botToken,
      chatId: process.env.TELEGRAM_CHAT_ID || defaultConfig.notification.telegram.chatId,
      events: process.env.TELEGRAM_EVENTS ? 
        JSON.parse(process.env.TELEGRAM_EVENTS) : defaultConfig.notification.telegram.events
    }
  },
  jitoMev: {
    ...defaultConfig.jitoMev,
    enabled: process.env.JITO_MEV_ENABLED === 'true' || defaultConfig.jitoMev.enabled,
    tipPercent: parseInt(process.env.JITO_MEV_TIP_PERCENT || 
      defaultConfig.jitoMev.tipPercent.toString(), 10),
    authKeypair: process.env.JITO_MEV_AUTH_KEYPAIR || defaultConfig.jitoMev.authKeypair
  }
};

// 验证配置
function validateConfig(config: AppConfig): void {
  // 检查RPC端点
  if (!config.network.rpcUrl) {
    throw new Error('缺少RPC端点配置 (SOLANA_RPC_URL)');
  }
  
  // 检查WebSocket端点
  if (!config.network.wsUrl) {
    throw new Error('缺少WebSocket端点配置 (SOLANA_WS_URL)');
  }
  
  // 非只读模式需要钱包私钥
  if (!config.network.connection?.commitment) {
    throw new Error('非只读模式需要确认交易初始超时配置 (SOLANA_COMMITMENT)');
  }
  
  // 启用API认证需要API密钥
  if (config.api.enableAuth && !config.api.apiKey) {
    throw new Error('启用API认证需要设置API密钥 (API_KEY)');
  }
}

// 初始化配置（如果需要创建文件夹等）
function initializeConfig(config: AppConfig): void {
  // 确保日志目录存在
  const logDir = './logs';
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  // 确保配置目录存在
  const configDir = './config';
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // 确保黑白名单文件存在
  function ensureJsonFileExists(filePath: string, defaultContent: any): void {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2));
      console.log(`创建默认配置文件: ${filePath}`);
    }
  }
  
  // 创建默认的白名单文件
  ensureJsonFileExists(config.security.tokenValidation.whitelistPath, { tokens: [] });
  
  // 创建默认的黑名单文件
  ensureJsonFileExists(config.security.tokenValidation.blacklistPath, { tokens: [], patterns: [], creators: [] });
}

// 验证并初始化配置
try {
  validateConfig(appConfig);
  initializeConfig(appConfig);
  console.log(`配置加载完成，环境: ${appConfig.environment}`);
} catch (error) {
  console.error('配置错误:', error instanceof Error ? error.message : error);
  process.exit(1);
}

export { appConfig };
export default appConfig; 