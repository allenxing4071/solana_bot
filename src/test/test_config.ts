import { AppConfig } from '../core/config.js';
import { DexType, StrategyType } from '../core/types.js';

export const testConfig: AppConfig = {
  environment: 'test',
  api: {
    port: 3000,
    useMockData: true,
    enableAuth: false,
    apiKey: 'test-api-key',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    staticDir: './static'
  },
  logging: {
    level: 'info',
    console: true,
    file: false,
    filename: 'test.log',
    maxFiles: 5,
    maxSize: '10m'
  },
  network: {
    cluster: 'devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    wsUrl: 'wss://api.devnet.solana.com',
    connection: {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000
    }
  },
  wallet: {
    privateKey: 'test-private-key',
    maxTransactionAmount: 1000
  },
  dexes: [
    {
      name: DexType.JUPITER,
      programId: 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB',
      enabled: true
    }
  ],
  monitoring: {
    poolMonitorInterval: 1000,
    priceCheckInterval: 1000,
    healthCheckInterval: 1000
  },
  trading: {
    buyStrategy: {
      enabled: true,
      maxAmountPerTrade: 1,
      maxSlippage: 1,
      minConfidence: 0.95,
      priorityFee: {
        enabled: true,
        multiplier: 1.5,
        baseFee: 100000,
        maxFee: 1000000
      }
    },
    sellStrategy: {
      enabled: true,
      conditions: [
        { type: StrategyType.TAKE_PROFIT, percentage: 10, enabled: true }
      ],
      maxSlippage: 1
    },
    maxTransactionAmount: 1,
    buyAmountSol: 0.1,
    maxBuySlippage: 1,
    maxSellSlippage: 1,
    txRetryCount: 3,
    txConfirmTimeout: 30000,
    txPriorityFee: 100000
  },
  security: {
    tokenValidation: {
      useWhitelist: true,
      useBlacklist: true,
      whitelistPath: './config/whitelist.json',
      blacklistPath: './config/blacklist.json',
      minLiquidityUsd: 10000,
      minPoolBalanceToken: 1000,
      requireMetadata: true,
      maxInitialPriceUsd: 1
    },
    transactionSafety: {
      simulateBeforeSend: true,
      maxRetryCount: 3,
      maxPendingTx: 5
    }
  },
  notification: {
    telegram: {
      enabled: true,
      botToken: '7368714077:AAHXATYrFT8uOibqYNG6UuGWJQVAq3RyixQ',
      chatId: '7395950412',
      events: { trade: true, error: true, info: true, warning: true }
    }
  },
  jitoMev: {
    enabled: false,
    tipPercent: 90,
    authKeypair: null
  }
}; 