import { MarketNotification } from './notifications.js';

export interface MarketData {
  price: number;
  volume: number;
  timestamp: number;
  trend: 'up' | 'down' | 'stable';
}

export interface MarketConfig {
  token: string;                    // 代币标识符
  priceChangeThreshold: number;     // 价格变化阈值（百分比）
  volumeChangeThreshold: number;    // 成交量变化阈值（百分比）
  checkInterval: number;            // 检查间隔（毫秒）
  staleDataThreshold: number;       // 数据过期阈值（毫秒）
} 