import TelegramBot from 'node-telegram-bot-api';
import { MessageQueue } from './message_queue.js';
import { RateLimiter } from './rate_limiter.js';
import { MessageOptions, Alert, TradeNotification, SystemNotification, MarketNotification, RiskNotification } from '../../types/notifications.js';

export interface ITelegramService {
  initialize(botToken: string, chatId: string): Promise<void>;
  sendMessage(message: string, options?: MessageOptions): Promise<void>;
  sendAlert(alert: Alert): Promise<void>;
  sendTradeNotification(trade: TradeNotification): Promise<void>;
  sendSystemNotification(system: SystemNotification): Promise<void>;
  sendMarketNotification(market: MarketNotification): Promise<void>;
  sendRiskNotification(risk: RiskNotification): Promise<void>;
  shutdown(): Promise<void>;
}

export class TelegramService implements ITelegramService {
  private bot: TelegramBot | null = null;
  private chatId: string | null = null;
  private messageQueue: MessageQueue;
  private rateLimiter: RateLimiter;
  private isInitialized: boolean = false;

  constructor() {
    this.messageQueue = new MessageQueue();
    this.rateLimiter = new RateLimiter();
  }

  async initialize(botToken: string, chatId: string): Promise<void> {
    if (this.isInitialized) {
      throw new Error('TelegramService already initialized');
    }

    try {
      this.bot = new TelegramBot(botToken, { polling: false });
      this.chatId = chatId;
      
      // 测试连接
      await this.bot.getMe();
      
      this.isInitialized = true;
      console.log('TelegramService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize TelegramService:', error);
      throw error;
    }
  }

  async sendMessage(message: string, options: MessageOptions = {}): Promise<void> {
    if (!this.isInitialized || !this.bot || !this.chatId) {
      throw new Error('TelegramService not initialized');
    }

    try {
      // 检查速率限制
      const canSend = await this.rateLimiter.checkLimit(
        'message',
        options.priority || 'normal'
      );

      if (!canSend) {
        // 如果超过限制，将消息加入队列
        await this.messageQueue.enqueue(message, options);
        return;
      }

      // 发送消息
      await this.bot.sendMessage(this.chatId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      // 发送失败时加入队列重试
      await this.messageQueue.enqueue(message, options);
    }
  }

  async sendAlert(alert: Alert): Promise<void> {
    const message = this.formatAlertMessage(alert);
    await this.sendMessage(message, { priority: 'high' });
  }

  async sendTradeNotification(trade: TradeNotification): Promise<void> {
    const message = this.formatTradeMessage(trade);
    await this.sendMessage(message, { priority: 'normal' });
  }

  async sendSystemNotification(system: SystemNotification): Promise<void> {
    const message = this.formatSystemMessage(system);
    await this.sendMessage(message, { 
      priority: system.type === 'error' ? 'high' : 'normal'
    });
  }

  async sendMarketNotification(market: MarketNotification): Promise<void> {
    const message = this.formatMarketMessage(market);
    await this.sendMessage(message, { 
      priority: market.type === 'price_alert' ? 'high' : 'normal'
    });
  }

  private formatAlertMessage(alert: Alert): string {
    return `
⚠️ *${alert.title}*
${alert.message}
时间: ${alert.timestamp.toLocaleString()}
${alert.metadata ? `\n详情: ${JSON.stringify(alert.metadata)}` : ''}
    `.trim();
  }

  private formatTradeMessage(trade: TradeNotification): string {
    return `
🎯 *交易${trade.status === 'confirmed' ? '成功' : '失败'}*
类型: ${trade.type === 'buy' ? '买入' : '卖出'}
代币: ${trade.token}
数量: ${trade.amount}
价格: ${trade.price}
状态: ${trade.status}
${trade.txHash ? `交易哈希: ${trade.txHash}` : ''}
时间: ${trade.timestamp.toLocaleString()}
    `.trim();
  }

  private formatSystemMessage(system: SystemNotification): string {
    const emoji = {
      startup: '🚀',
      shutdown: '🛑',
      error: '❌',
      warning: '⚠️'
    }[system.type];

    return `
${emoji} *系统通知 - ${system.component}*
类型: ${system.type}
消息: ${system.message}
时间: ${system.timestamp.toLocaleString()}
${system.metadata ? `\n详情: ${JSON.stringify(system.metadata)}` : ''}
    `.trim();
  }

  private formatMarketMessage(market: MarketNotification): string {
    const emoji = {
      price_alert: '💰',
      volume_alert: '📊',
      trend_change: '📈',
      market_summary: '📊'
    }[market.type];

    const changeEmoji = market.change > 0 ? '📈' : '📉';
    const changeText = Math.abs(market.change).toFixed(2);

    return `${emoji} *${market.type.replace('_', ' ').toUpperCase()}*\n\n` +
           `Token: ${market.token}\n` +
           `Change: ${changeEmoji} ${changeText}%\n` +
           `Current Value: ${market.currentValue.toFixed(2)}\n` +
           `${market.previousValue ? `Previous Value: ${market.previousValue.toFixed(2)}\n` : ''}` +
           `Time: ${market.timestamp.toLocaleString()}\n` +
           `${market.metadata ? `\nAdditional Info:\n${JSON.stringify(market.metadata, null, 2)}` : ''}`;
  }

  private formatRiskMessage(risk: RiskNotification): string {
    const emoji = {
      slippage: '📊',
      balance: '💰',
      limit: '⚠️'
    }[risk.type];

    const levelEmoji = {
      low: '🟢',
      medium: '🟡',
      high: '🔴'
    }[risk.level];

    return `${emoji} *风险警告*\n\n` +
           `类型: ${risk.type.toUpperCase()}\n` +
           `级别: ${levelEmoji} ${risk.level.toUpperCase()}\n` +
           `消息: ${risk.message}\n` +
           `当前值: ${risk.value}\n` +
           `阈值: ${risk.threshold}\n` +
           `时间: ${risk.timestamp.toLocaleString()}\n` +
           `${risk.metadata ? `\n详情:\n${JSON.stringify(risk.metadata, null, 2)}` : ''}`;
  }

  async sendRiskNotification(risk: RiskNotification): Promise<void> {
    const message = this.formatRiskMessage(risk);
    await this.sendMessage(message, { 
      priority: risk.level === 'high' ? 'high' : 'normal'
    });
  }

  async shutdown(): Promise<void> {
    if (this.bot) {
      await this.bot.close();
      this.bot = null;
    }
    this.isInitialized = false;
  }
} 