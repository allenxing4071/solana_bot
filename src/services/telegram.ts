// import { Telegraf, Context } from 'telegraf';
import logger from '../core/logger.js';
import config from '../core/config.js';
import type { NotificationEvent, NotificationEventConfig, TelegramConfig } from '../types/notification.js';
// import { getMainMenu, getFeatureDetailMenu, getFeatureDetailText, getOverviewText, features } from './telegram_feature_menu.js';
import { sendTelegramMessage } from '../utils/telegramNotify.js';

class TelegramService {
  // private bot: Telegraf | null = null;
  private config: TelegramConfig;

  constructor() {
    // 默认配置
    const defaultConfig: TelegramConfig = {
      enabled: true,
      botToken: '8199469963:AAE5GKIj-4X_P6DyLaiOaPFUkma-mFxvwdY',
      chatId: '7395950412',
      events: {
        'trade': { enabled: true, template: '📊 Trade: {message}' },
        'error': { enabled: true, template: '❌ Error: {message}' },
        'info': { enabled: true, template: 'ℹ️ Info: {message}' },
        'warning': { enabled: true, template: '⚠️ Warning: {message}' }
      }
    };

    // 从配置文件中获取配置
    const telegramConfig = config?.notification?.telegram;
    logger.info('Loading Telegram configuration:', telegramConfig);
    
    // 合并配置
    this.config = {
      ...defaultConfig,
      ...telegramConfig,
      events: {
        ...defaultConfig.events,
        ...telegramConfig?.events
      }
    } as TelegramConfig;

    logger.info('Final Telegram configuration:', {
      enabled: this.config.enabled,
      botToken: this.config.botToken ? '***' : 'not set',
      chatId: this.config.chatId,
      events: Object.keys(this.config.events)
    });
  }

  public async initialize(): Promise<void> {
    // 仅保留配置初始化，不再启动 telegraf
    if (!this.config.enabled) {
      logger.info('Telegram service is disabled');
      return;
    }
    if (!this.config.botToken) {
      throw new Error('Telegram bot token is not configured');
    }
    logger.info('Telegram service initialized (telegraf skipped)');
  }

  public getConfig(): TelegramConfig {
    return this.config;
  }

  public async sendMessage(
    chatId: string,
    message: string,
    eventType: NotificationEvent
  ): Promise<void> {
    console.log('sendMessage called', chatId, message, eventType); // 调试日志
    try {
      if (!this.config.enabled) {
        logger.debug('Telegram notifications are disabled');
        return;
      }
      if (!this.config.events[eventType]?.enabled) {
        logger.debug(`Telegram notification for event type ${eventType} is disabled`);
        return;
      }
      const template = this.config.events[eventType]?.template || '{message}';
      let formattedMessage = template.replace('{message}', message);
      logger.info(`Sending message to ${chatId}:`, {
        eventType,
        messageLength: formattedMessage.length
      });
      console.log('[DEBUG] 即将调用 sendTelegramMessage', this.config.botToken, chatId, formattedMessage);
      await sendTelegramMessage(this.config.botToken, chatId, formattedMessage);
      console.log('[DEBUG] sendTelegramMessage 调用完成');
      logger.info(`Message sent successfully to ${chatId}`);
    } catch (error) {
      logger.error('Failed to send Telegram message:', error instanceof Error ? error.message : String(error));
      console.error('[DEBUG] sendMessage 捕获到异常:', error);
      throw error;
    }
  }
}

export const telegramService = new TelegramService();

console.log('=== 测试文件已启动 ===');

async function testTelegram() {
  await telegramService.initialize();
  await telegramService.sendMessage(
    '7395950412',
    '测试消息：新 bot 通信链路正常！（仅node-fetch链路）',
    'info'
  );
  console.log('测试消息已发送');
}

testTelegram();