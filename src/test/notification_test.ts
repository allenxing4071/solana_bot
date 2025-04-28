import { NotificationEvent } from '../types/notification.js';
import { NotificationPriority } from '../types/notification.js';
import { initializeConfig } from '../core/config.js';
import { NotificationService } from '../services/notification.js';
import { telegramService } from '../services/telegram.js';
import { DexType, StrategyCondition, StrategyType } from '../core/types.js';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import logger from '../core/logger.js';
import { NotificationHistoryDB, NotificationFilterDB, NotificationGroupDB } from '../utils/database.js';
import { NotificationHistory } from '../models/database.js';
import { format } from 'date-fns';
import type { Mock } from 'vitest';
import { getTemplate } from '../templates/notification.js';

// Mock database operations
vi.mock('../utils/database', () => ({
  NotificationHistoryDB: {
    save: vi.fn().mockResolvedValue(1)
  },
  NotificationFilterDB: {
    getAll: vi.fn().mockResolvedValue([
      {
        id: 1,
        name: 'Critical Errors',
        enabled: true,
        event_type: 'error',
        priority: NotificationPriority.HIGH,
        conditions: [
          {
            field: 'content',
            operator: 'contains',
            value: 'critical'
          }
        ],
        action: 'allow',
        created_at: new Date(),
        updated_at: new Date()
      }
    ])
  },
  NotificationGroupDB: {
    getAll: vi.fn().mockResolvedValue([
      {
        id: 'admin',
        name: 'Administrators',
        description: 'System administrators group',
        chatId: 'test-admin-chat-id',
        rules: ['error:*', 'startup:*', 'shutdown:*'],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'traders',
        name: 'Traders',
        description: 'Active traders group',
        chatId: 'test-trader-chat-id',
        rules: ['trade:*', 'position:*', 'performance:*', 'price:*'],
        created_at: new Date(),
        updated_at: new Date()
      }
    ])
  }
}));

// Mock Telegram service
vi.mock('../services/telegram', () => ({
  telegramService: {
    sendMessage: vi.fn().mockResolvedValue(true),
    config: {
      chatId: 'test-chat-id',
      adminChatId: 'test-admin-chat-id'
    }
  }
}));

// Mock configuration
vi.mock('../core/config', () => ({
  __esModule: true,
  default: {
    notification: {
      telegram: {
        enabled: true,
        botToken: 'test_token',
        chatId: 'test_chat_id',
        adminChatId: 'test_admin_chat_id',
        events: {
          startup: { enabled: true, level: 'info' },
          shutdown: { enabled: true, level: 'info' },
          trade: { enabled: true, level: 'info' },
          error: { enabled: true, level: 'error' },
          position: { enabled: true, level: 'info' },
          performance: { enabled: true, level: 'info' },
          price: { enabled: true, level: 'info' },
          balance: { enabled: true, level: 'warning' },
          alert: { enabled: true, level: 'warning' }
        },
        commands: {
          enabled: true,
          allowedUsers: ['*'],
          adminOnly: false
        },
        formatting: {
          useEmoji: true,
          useMarkdown: true,
          useHTML: true
        },
        rateLimit: {
          messagesPerMinute: 20,
          burstSize: 5
        }
      }
    }
  },
  initializeConfig: vi.fn().mockResolvedValue(undefined)
}));

const testConfig = {
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
    poolMonitorInterval: 1000,
    priceCheckInterval: 1000,
    healthCheckInterval: 1000
  },
  trading: {
    enabled: true,
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
      conditions: [{
        type: StrategyType.TAKE_PROFIT,
        percentage: 10,
        enabled: true
      }],
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
    enabled: true,
    telegram: {
      enabled: true,
      botToken: 'test-bot-token',
      chatId: 'test-chat-id',
      adminChatId: 'test-chat-id',
      events: {
        trade: true,
        error: true,
        startup: true,
        shutdown: true,
        position: true,
        price: true
      }
    },
    filters: [
      {
        name: 'errors',
        events: ['error'],
        priority: ['high']
      }
    ],
    groups: [
      {
        name: 'admin',
        chatId: 'test-chat-id',
        filters: ['errors']
      }
    ]
  },
  jitoMev: {
    enabled: false,
    tipPercent: 0,
    authKeypair: null
  }
};

describe('Notification Service', () => {
  let notificationService: NotificationService;

  beforeEach(() => {
    process.env.TELEGRAM_ADMIN_CHAT_ID = 'test-admin-chat-id';
    process.env.TELEGRAM_TRADER_CHAT_ID = 'test-trader-chat-id';
    notificationService = NotificationService.getInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Test All Notification Types', () => {
    // 注释或移除所有'startup'、'shutdown'、'position'、'performance'、'price'、'balance'、'alert'等非主线事件类型相关测试
    // it('should send startup notification', async () => {
    //   await notificationService.sendNotification(
    //     'startup',
    //     '系统启动成功',
    //     NotificationPriority.LOW
    //   );
    //   expect(telegramService.sendMessage).toHaveBeenCalledWith(
    //     'test-admin-chat-id',
    //     expect.stringContaining('🚀 *系统启动*'),
    //     'startup'
    //   );
    // });

    it('should send trade notification', async () => {
      const tradeData = {
        symbol: 'SOL/USD',
        side: 'buy',
        amount: 1.5,
        price: 100
      };
      await notificationService.sendNotification(
        'trade',
        JSON.stringify(tradeData),
        NotificationPriority.LOW
      );
      expect(telegramService.sendMessage).toHaveBeenCalledWith(
        'test-trader-chat-id',
        expect.stringContaining('💰 *交易通知*'),
        'trade'
      );
    });

    it('should send error notification', async () => {
      const errorData = {
        name: 'CriticalError',
        message: 'Critical system error'
      };
      await notificationService.sendNotification(
        'error',
        JSON.stringify(errorData),
        NotificationPriority.HIGH
      );
      expect(telegramService.sendMessage).toHaveBeenCalledWith(
        'test-admin-chat-id',
        expect.stringContaining('❗️❌ *错误警报*'),
        'error'
      );
    });

    // it('should send position notification', async () => {
    //   const positionData = {
    //     symbol: 'SOL/USD',
    //     amount: 1.5,
    //     entryPrice: 100,
    //     currentPrice: 105,
    //     pnl: 5
    //   };
    //   await notificationService.sendNotification(
    //     'position',
    //     JSON.stringify(positionData),
    //     NotificationPriority.LOW
    //   );
    //   expect(telegramService.sendMessage).toHaveBeenCalledWith(
    //     'test-trader-chat-id',
    //     expect.stringContaining('📊 *持仓更新*'),
    //     'position'
    //   );
    // });

    // it('should send performance notification', async () => {
    //   const performanceData = {
    //     totalTrades: 10,
    //     winRate: 0.65,
    //     totalPnl: 100
    //   };
    //   await notificationService.sendNotification(
    //     'performance',
    //     JSON.stringify(performanceData),
    //     NotificationPriority.LOW
    //   );
    //   expect(telegramService.sendMessage).toHaveBeenCalledWith(
    //     'test-trader-chat-id',
    //     expect.stringContaining('📈 *性能报告*'),
    //     'performance'
    //   );
    // });

    // it('should send price notification', async () => {
    //   const priceData = {
    //     symbol: 'SOL/USD',
    //     price: 100,
    //     change24h: 5
    //   };
    //   await notificationService.sendNotification(
    //     'price',
    //     JSON.stringify(priceData),
    //     NotificationPriority.LOW
    //   );
    //   expect(telegramService.sendMessage).toHaveBeenCalledWith(
    //     'test-trader-chat-id',
    //     expect.stringContaining('💹 *价格更新*'),
    //     'price'
    //   );
    // });

    // it('should send balance notification', async () => {
    //   const balanceData = {
    //     totalBalance: 1000,
    //     availableBalance: 500,
    //     lockedBalance: 500
    //   };
    //   await notificationService.sendNotification(
    //     'balance',
    //     JSON.stringify(balanceData),
    //     NotificationPriority.LOW
    //   );
    //   expect(telegramService.sendMessage).toHaveBeenCalledWith(
    //     'test-trader-chat-id',
    //     expect.stringContaining('💰 *余额更新*'),
    //     'balance'
    //   );
    // });

    // it('should send alert notification', async () => {
    //   const alertData = {
    //     type: 'price_alert',
    //     symbol: 'SOL/USD',
    //     condition: 'above',
    //     price: 100
    //   };
    //   await notificationService.sendNotification(
    //     'alert',
    //     JSON.stringify(alertData),
    //     NotificationPriority.HIGH
    //   );
    //   expect(telegramService.sendMessage).toHaveBeenCalledWith(
    //     'test-admin-chat-id',
    //     expect.stringContaining('⚠️ *警报通知*'),
    //     'alert'
    //   );
    // });
  });
}); 