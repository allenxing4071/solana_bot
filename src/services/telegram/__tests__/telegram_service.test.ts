import { TelegramService } from '../telegram_service.js';
import { TradeNotification, SystemNotification } from '../../../types/notifications.js';

describe('TelegramService', () => {
  let service: TelegramService;
  const mockToken = 'mock-token';
  const mockChatId = 'mock-chat-id';

  beforeEach(() => {
    service = new TelegramService();
  });

  afterEach(async () => {
    await service.shutdown();
  });

  describe('initialization', () => {
    it('should initialize successfully with valid token and chatId', async () => {
      await expect(service.initialize(mockToken, mockChatId)).resolves.not.toThrow();
    });

    it('should throw error when initialized twice', async () => {
      await service.initialize(mockToken, mockChatId);
      await expect(service.initialize(mockToken, mockChatId)).rejects.toThrow();
    });
  });

  describe('trade notifications', () => {
    beforeEach(async () => {
      await service.initialize(mockToken, mockChatId);
    });

    it('should send trade success notification', async () => {
      const trade: TradeNotification = {
        type: 'buy',
        token: 'SOL',
        amount: 1.5,
        price: 100,
        status: 'confirmed',
        txHash: 'mock-tx-hash',
        timestamp: new Date()
      };

      await expect(service.sendTradeNotification(trade)).resolves.not.toThrow();
    });

    it('should send trade failure notification', async () => {
      const trade: TradeNotification = {
        type: 'sell',
        token: 'SOL',
        amount: 2.0,
        price: 95,
        status: 'failed',
        timestamp: new Date()
      };

      await expect(service.sendTradeNotification(trade)).resolves.not.toThrow();
    });
  });

  describe('system notifications', () => {
    beforeEach(async () => {
      await service.initialize(mockToken, mockChatId);
    });

    it('should send system startup notification', async () => {
      const system: SystemNotification = {
        type: 'startup',
        component: 'RPC Service',
        message: 'Service started successfully',
        timestamp: new Date()
      };

      await expect(service.sendSystemNotification(system)).resolves.not.toThrow();
    });

    it('should send system error notification with high priority', async () => {
      const system: SystemNotification = {
        type: 'error',
        component: 'RPC Service',
        message: 'Connection failed',
        timestamp: new Date(),
        metadata: { error: 'Connection timeout' }
      };

      await expect(service.sendSystemNotification(system)).resolves.not.toThrow();
    });

    it('should send system warning notification', async () => {
      const system: SystemNotification = {
        type: 'warning',
        component: 'Memory Monitor',
        message: 'High memory usage detected',
        timestamp: new Date(),
        metadata: { usage: '85%' }
      };

      await expect(service.sendSystemNotification(system)).resolves.not.toThrow();
    });
  });
}); 