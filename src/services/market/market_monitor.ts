import { MarketData, MarketConfig } from '../../types/market.js';
import { MarketNotification } from '../../types/notifications.js';
import { NotificationService } from '../notification/notification_service.js';
import logger from '../../core/logger.js';

export class MarketMonitor {
  private static instance: MarketMonitor;
  private notificationService: NotificationService;
  private config: MarketConfig;
  private lastData: MarketData | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private historicalData: MarketData[] = [];
  private performanceMetrics: {
    lastCheckTime: number;
    processingTime: number;
    dataPoints: number;
  } = {
    lastCheckTime: 0,
    processingTime: 0,
    dataPoints: 0
  };

  private constructor(config: MarketConfig) {
    this.notificationService = NotificationService.getInstance();
    this.config = config;
  }

  public static getInstance(config: MarketConfig): MarketMonitor {
    if (!MarketMonitor.instance) {
      MarketMonitor.instance = new MarketMonitor(config);
    }
    return MarketMonitor.instance;
  }

  public start(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      const startTime = Date.now();
      this.checkMarketChanges();
      this.performanceMetrics.processingTime = Date.now() - startTime;
      this.performanceMetrics.lastCheckTime = Date.now();
    }, this.config.checkInterval);
  }

  public stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  public updateMarketData(newData: MarketData): void {
    const startTime = Date.now();
    
    if (!this.lastData) {
      this.lastData = newData;
      this.historicalData.push(newData);
      return;
    }

    // 计算变化率
    const priceChange = Math.abs((newData.price - this.lastData.price) / this.lastData.price);
    const volumeChange = Math.abs((newData.volume - this.lastData.volume) / this.lastData.volume);

    // 检查价格异常
    if (this.isPriceAnomaly(newData)) {
      const notification: MarketNotification = {
        type: 'price_alert',
        token: this.config.token,
        change: priceChange,
        currentValue: newData.price,
        previousValue: this.lastData.price,
        timestamp: new Date(),
        metadata: {
          threshold: this.config.priceChangeThreshold,
          direction: priceChange > 0 ? 'up' : 'down',
          anomaly: true
        }
      };
      this.notify(notification);
    } else if (priceChange >= this.config.priceChangeThreshold) {
      const notification: MarketNotification = {
        type: 'price_alert',
        token: this.config.token,
        change: priceChange,
        currentValue: newData.price,
        previousValue: this.lastData.price,
        timestamp: new Date(),
        metadata: {
          threshold: this.config.priceChangeThreshold,
          direction: priceChange > 0 ? 'up' : 'down'
        }
      };
      this.notify(notification);
    }

    // 检查交易量异常
    if (this.isVolumeAnomaly(newData)) {
      const notification: MarketNotification = {
        type: 'volume_alert',
        token: this.config.token,
        change: volumeChange,
        currentValue: newData.volume,
        previousValue: this.lastData.volume,
        timestamp: new Date(),
        metadata: {
          threshold: this.config.volumeChangeThreshold,
          direction: volumeChange > 0 ? 'up' : 'down',
          anomaly: true
        }
      };
      this.notify(notification);
    } else if (volumeChange >= this.config.volumeChangeThreshold) {
      const notification: MarketNotification = {
        type: 'volume_alert',
        token: this.config.token,
        change: volumeChange,
        currentValue: newData.volume,
        previousValue: this.lastData.volume,
        timestamp: new Date(),
        metadata: {
          threshold: this.config.volumeChangeThreshold,
          direction: volumeChange > 0 ? 'up' : 'down'
        }
      };
      this.notify(notification);
    }

    // 更新历史数据
    this.historicalData.push(newData);
    if (this.historicalData.length > 1000) { // 保持最近1000个数据点
      this.historicalData.shift();
    }

    // 分析趋势
    this.analyzeTrends();

    this.lastData = newData;
    this.performanceMetrics.dataPoints++;
    this.performanceMetrics.processingTime = Date.now() - startTime;
  }

  private isPriceAnomaly(newData: MarketData): boolean {
    if (this.historicalData.length < 10) return false;
    
    const recentPrices = this.historicalData.slice(-10).map(d => d.price);
    const mean = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
    const stdDev = Math.sqrt(
      recentPrices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / recentPrices.length
    );
    
    return Math.abs(newData.price - mean) > 3 * stdDev;
  }

  private isVolumeAnomaly(newData: MarketData): boolean {
    if (this.historicalData.length < 10) return false;
    
    const recentVolumes = this.historicalData.slice(-10).map(d => d.volume);
    const mean = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
    const stdDev = Math.sqrt(
      recentVolumes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / recentVolumes.length
    );
    
    return Math.abs(newData.volume - mean) > 3 * stdDev;
  }

  private analyzeTrends(): void {
    if (this.historicalData.length < 20) return;

    const recentData = this.historicalData.slice(-20);
    const priceTrend = this.calculateTrend(recentData.map(d => d.price));
    const volumeTrend = this.calculateTrend(recentData.map(d => d.volume));

    if (Math.abs(priceTrend) > 0.1 || Math.abs(volumeTrend) > 0.1) {
      const notification: MarketNotification = {
        type: 'trend_change',
        token: this.config.token,
        change: priceTrend,
        currentValue: this.lastData?.price || 0,
        timestamp: new Date(),
        metadata: {
          priceTrend,
          volumeTrend,
          period: '20 points'
        }
      };
      this.notify(notification);
    }
  }

  private calculateTrend(data: number[]): number {
    const n = data.length;
    const xMean = (n - 1) / 2;
    const yMean = data.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = i - xMean;
      const yDiff = data[i] - yMean;
      numerator += xDiff * yDiff;
      denominator += xDiff * xDiff;
    }
    
    return numerator / denominator;
  }

  private checkMarketChanges(): void {
    if (this.lastData) {
      const currentTime = Date.now();
      const timeDiff = currentTime - this.lastData.timestamp;
      
      if (timeDiff > this.config.checkInterval * 2) {
        const notification: MarketNotification = {
          type: 'market_summary',
          token: this.config.token,
          change: 0,
          currentValue: this.lastData.price,
          timestamp: new Date(),
          metadata: {
            lastUpdate: this.lastData.timestamp,
            staleThreshold: this.config.staleDataThreshold,
            performance: this.performanceMetrics
          }
        };
        this.notify(notification);
      }
    }
  }

  private notify(notification: MarketNotification): void {
    this.notificationService.notify(notification);
    logger.info(`Market notification sent: ${notification.type}`, 'MarketMonitor', {
      token: notification.token,
      change: notification.change
    });
  }

  public getPerformanceMetrics() {
    return this.performanceMetrics;
  }
} 