import { NotificationEvent } from '../types/notification.js';

type Severity = 'high' | 'medium' | 'low';

interface TemplateData {
  timestamp?: number;
  [key: string]: any;
}

export function getTemplate(type: NotificationEvent, data: TemplateData): string {
  const timestamp = new Date(data.timestamp || Date.now()).toLocaleString();
  
  switch (type) {
    case 'trade':
      return `💰 *交易执行*\n\n类型: ${data.type}\n代币: ${data.tokenSymbol}\n数量: ${data.amount}\n价格: $${data.price}\n时间: ${timestamp}`;
    case 'error':
      return `❌ *错误警报*\n\n消息: ${data.message}\n代码: ${data.code}\n时间: ${timestamp}`;
    case 'info':
      return `ℹ️ *信息*\n\n消息: ${data.message}\n时间: ${timestamp}`;
    case 'warning':
      return `⚠️ *警告*\n\n消息: ${data.message}\n时间: ${timestamp}`;
    // 其它类型已移除或注释
    // case 'position':
    // case 'performance':
    // case 'price':
    // case 'balance':
    // case 'alert':
    // case 'startup':
    // case 'shutdown':
    default:
      return `${type}: ${JSON.stringify(data)}`;
  }
} 