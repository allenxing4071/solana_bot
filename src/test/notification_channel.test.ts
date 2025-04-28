import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NotificationService } from '../services/notification.js';
import { NotificationPriority } from '../types/notification.js';
import { telegramService } from '../services/telegram.js';

// 保存原始sendMessage方法
const realSendMessage = telegramService.sendMessage;

// Mock Telegram sendMessage
const telegramMock = vi.fn().mockResolvedValue(true);

// 假设未来有 EmailChannel/WebhookChannel，可用同样方式 mock

describe('通知分级与多渠道推送', () => {
  let notificationService: NotificationService;

  beforeAll(() => {
    notificationService = NotificationService.getInstance();
    notificationService.enable();
    // 默认用mock
    telegramService.sendMessage = telegramMock;
  });

  afterAll(() => {
    // 恢复真实方法
    telegramService.sendMessage = realSendMessage;
  });

  it('应能按优先级推送到 Telegram（mock）', async () => {
    await notificationService.sendNotification(
      'info',
      '测试 info 通知',
      NotificationPriority.LOW
    );
    await notificationService.sendNotification(
      'warning',
      '测试 warning 通知',
      NotificationPriority.HIGH
    );
    expect(telegramMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('测试 info 通知'),
      'info'
    );
    expect(telegramMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('测试 warning 通知'),
      'warning'
    );
  });

  it('禁用后不应推送通知（mock）', async () => {
    notificationService.disable();
    await notificationService.sendNotification(
      'error',
      '测试 error 通知',
      NotificationPriority.HIGH
    );
    expect(telegramMock).not.toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('测试 error 通知'),
      'error'
    );
    notificationService.enable();
  });

  // 可扩展：模拟多通道推送
  // it('应能推送到多个通道', async () => {
  //   // 假设有 EmailChannel/WebhookChannel
  //   // ...
  // });
}); 