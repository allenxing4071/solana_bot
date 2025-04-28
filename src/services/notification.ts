import { NotificationEvent, NotificationMessage, NotificationPriority, NotificationGroup } from '../types/notification.js';
import { NotificationHistory } from '../models/database.js';
import { telegramService } from './telegram.js';
import { NotificationHistoryDB } from '../utils/database.js';
import logger from '../core/logger.js';

export class NotificationService {
  private static instance: NotificationService;
  private enabled: boolean = true;
  private groups: NotificationGroup[] = [
    {
      id: 'admin',
      name: '管理员组',
      chatId: '7395950412',
      events: ['error', 'warning']
    },
    {
      id: 'trader',
      name: '交易员组',
      chatId: '7395950412',
      events: ['trade', 'info']
    }
  ];

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async sendNotification(
    type: NotificationEvent,
    content: string,
    priority: NotificationPriority = NotificationPriority.LOW
  ): Promise<void> {
    if (!this.enabled) {
      logger.warn('Notification service is disabled');
      return;
    }

    const message: NotificationMessage = {
      type,
      content,
      priority,
      timestamp: Date.now()
    };

    try {
      // 根据事件类型找到对应的组
      const targetGroups = this.groups.filter(group => group.events.includes(type));
      
      if (targetGroups.length === 0) {
        logger.warn(`No groups configured for event type: ${type}`);
        return;
      }

      // 向每个组的聊天ID发送消息
      for (const group of targetGroups) {
        const chatId = group.chatId;
        if (!chatId) continue;
        try {
          await telegramService.sendMessage(chatId, message.content, type);
          logger.info(`Message sent successfully to ${chatId}`);
        } catch (error) {
          logger.error(`Failed to send notification to chat ${chatId}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error in sendNotification:', error);
      throw error;
    }
  }

  public enable(): void {
    this.enabled = true;
    logger.info('Notification service enabled');
  }

  public disable(): void {
    this.enabled = false;
    logger.info('Notification service disabled');
  }
} 