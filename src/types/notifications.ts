export interface MessageOptions {
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  format?: 'text' | 'markdown' | 'html';
  retryCount?: number;
  timeout?: number;
}

export interface Alert {
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface TradeNotification {
  type: 'buy' | 'sell';
  token: string;
  amount: number;
  price: number;
  status: 'pending' | 'confirmed' | 'failed';
  txHash?: string;
  timestamp: Date;
}

export interface SystemNotification {
  type: 'startup' | 'shutdown' | 'error' | 'warning';
  component: string;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface MarketNotification {
  type: 'price_alert' | 'volume_alert' | 'trend_change' | 'market_summary';
  token: string;
  change: number;
  currentValue: number;
  previousValue?: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface RiskNotification {
  type: 'slippage' | 'balance' | 'limit';
  level: 'low' | 'medium' | 'high';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  metadata?: Record<string, any>;
} 