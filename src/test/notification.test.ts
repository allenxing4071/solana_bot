import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NotificationEvent, NotificationPriority } from '../types/notification.js';
import config, { initializeConfig } from '../core/config.js';
import { telegramService } from '../services/telegram.js';
import logger from '../core/logger.js';
import { NotificationService } from '../services/notification.js';
import { NotificationHistoryDB, NotificationFilterDB, NotificationGroupDB } from '../utils/database.js';
import { NotificationHistory } from '../models/database.js';
import { format } from 'date-fns';
import { DexType, StrategyType } from '../core/types.js';
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

// Mock logger
vi.mock('../core/logger', () => ({
  __esModule: true,
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

describe('NotificationService', () => {
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
    it('should send startup notification', async () => {
      await notificationService.sendNotification(
        'startup' as NotificationEvent,
        '系统启动成功',
        NotificationPriority.LOW
      );
      expect(telegramService.sendMessage).toHaveBeenCalledWith(
        'test-admin-chat-id',
        expect.stringContaining('🚀 *系统启动*'),
        'startup'
      );
    });

    it('should send trade notification', async () => {
      const tradeData = {
        symbol: 'SOL/USD',
        side: 'buy',
        amount: 1.5,
        price: 100
      };
      await notificationService.sendNotification('trade', JSON.stringify(tradeData));
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
      await notificationService.sendNotification('error', JSON.stringify(errorData));
      expect(telegramService.sendMessage).toHaveBeenCalledWith(
        'test-admin-chat-id',
        expect.stringContaining('❗️❌ *错误警报*'),
        'error'
      );
    });

    it('should send position notification', async () => {
      const positionData = {
        symbol: 'SOL/USD',
        amount: 1.5,
        entryPrice: 100,
        currentPrice: 105,
        pnl: 5
      };
      await notificationService.sendNotification(
        'position' as NotificationEvent,
        JSON.stringify(positionData),
        NotificationPriority.LOW
      );
      expect(telegramService.sendMessage).toHaveBeenCalledWith(
        'test-trader-chat-id',
        expect.stringContaining('📊 *持仓更新*'),
        'position'
      );
    });

    it('should send performance notification', async () => {
      const performanceData = {
        totalTrades: 10,
        winRate: 0.65,
        totalPnl: 100
      };
      await notificationService.sendNotification(
        'performance' as NotificationEvent,
        JSON.stringify(performanceData),
        NotificationPriority.LOW
      );
      expect(telegramService.sendMessage).toHaveBeenCalledWith(
        'test-trader-chat-id',
        expect.stringContaining('📈 *性能报告*'),
        'performance'
      );
    });

    it('should send price notification', async () => {
      const priceData = {
        symbol: 'SOL/USD',
        price: 100,
        change24h: 5
      };
      await notificationService.sendNotification(
        'price' as NotificationEvent,
        JSON.stringify(priceData),
        NotificationPriority.LOW
      );
      expect(telegramService.sendMessage).toHaveBeenCalledWith(
        'test-trader-chat-id',
        expect.stringContaining('💹 *价格更新*'),
        'price'
      );
    });

    it('should send balance notification', async () => {
      const balanceData = {
        totalBalance: 1000,
        availableBalance: 500,
        lockedBalance: 500
      };
      await notificationService.sendNotification(
        'balance' as NotificationEvent,
        JSON.stringify(balanceData),
        NotificationPriority.LOW
      );
      expect(telegramService.sendMessage).toHaveBeenCalledWith(
        'test-trader-chat-id',
        expect.stringContaining('💰 *余额更新*'),
        'balance'
      );
    });

    it('should send alert notification', async () => {
      const alertData = {
        type: 'price_alert',
        symbol: 'SOL/USD',
        condition: 'above',
        price: 100
      };
      await notificationService.sendNotification(
        'alert' as NotificationEvent,
        JSON.stringify(alertData),
        NotificationPriority.HIGH
      );
      expect(telegramService.sendMessage).toHaveBeenCalledWith(
        'test-admin-chat-id',
        expect.stringContaining('⚠️ *警报通知*'),
        'alert'
      );
    });
  });

  describe('Service Management', () => {
    it('should not send notifications when disabled', async () => {
      notificationService.disable();
      await notificationService.sendNotification(
        'trade' as NotificationEvent,
        '测试交易',
        NotificationPriority.LOW
      );

      expect(telegramService.sendMessage).not.toHaveBeenCalled();
      expect(NotificationHistoryDB.save).not.toHaveBeenCalled();
    });

    it('should resume sending notifications when enabled', async () => {
      notificationService.disable();
      notificationService.enable();
      await notificationService.sendNotification(
        'trade' as NotificationEvent,
        '测试交易',
        NotificationPriority.LOW
      );

      expect(telegramService.sendMessage).toHaveBeenCalledWith(
        'test-trader-chat-id',
        expect.stringContaining('💰 *交易通知*'),
        'trade'
      );
      expect(NotificationHistoryDB.save).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'trade',
          message: '测试交易',
          chat_id: 'test-trader-chat-id',
          status: 'sent',
          priority: 0,
          group_id: 'trader'
        })
      );
    });
  });

  it('should respect notification filters', async () => {
    const errorData = {
      name: 'CriticalError',
      message: 'Critical system error'
    };

    await notificationService.sendNotification(
      'error' as NotificationEvent,
      JSON.stringify(errorData),
      NotificationPriority.HIGH
    );

    expect(telegramService.sendMessage).toHaveBeenCalledWith(
      'test-admin-chat-id',
      expect.stringContaining('❗️❌ *错误警报*'),
      'error'
    );
    expect(NotificationHistoryDB.save).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'error',
        message: JSON.stringify(errorData),
        chat_id: 'test-admin-chat-id',
        status: 'sent',
        priority: 1,
        group_id: 'admin'
      })
    );
  });
}); 