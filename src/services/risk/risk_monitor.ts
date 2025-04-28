import { RiskConfig, RiskData } from '../../types/risk.js';
import { RiskNotification } from '../../types/notifications.js';
import { NotificationService } from '../notification/notification_service.js';

export class RiskMonitor {
  private static instance: RiskMonitor;
  private notificationService: NotificationService;
  private config: RiskConfig;
  private riskData: RiskData = {};
  
  // 监控定时器
  private slippageInterval: NodeJS.Timeout | null = null;
  private balanceInterval: NodeJS.Timeout | null = null;
  private limitResetInterval: NodeJS.Timeout | null = null;

  private constructor(config: RiskConfig) {
    this.notificationService = NotificationService.getInstance();
    this.config = config;
  }

  public static getInstance(config: RiskConfig): RiskMonitor {
    if (!RiskMonitor.instance) {
      RiskMonitor.instance = new RiskMonitor(config);
    }
    return RiskMonitor.instance;
  }

  /**
   * 启动风险监控
   */
  public start(): void {
    this.startSlippageMonitor();
    this.startBalanceMonitor();
    this.startLimitMonitor();
  }

  /**
   * 停止风险监控
   */
  public stop(): void {
    if (this.slippageInterval) {
      clearInterval(this.slippageInterval);
      this.slippageInterval = null;
    }
    if (this.balanceInterval) {
      clearInterval(this.balanceInterval);
      this.balanceInterval = null;
    }
    if (this.limitResetInterval) {
      clearInterval(this.limitResetInterval);
      this.limitResetInterval = null;
    }
  }

  /**
   * 更新滑点数据
   */
  public updateSlippageData(token: string, slippage: number): void {
    this.riskData.slippage = {
      current: slippage,
      token,
      timestamp: Date.now()
    };
    this.checkSlippageRisk();
  }

  /**
   * 更新余额数据
   */
  public updateBalanceData(balance: number): void {
    this.riskData.balance = {
      current: balance,
      timestamp: Date.now()
    };
    this.checkBalanceRisk();
  }

  /**
   * 更新交易限额数据
   */
  public updateLimitData(amount: number): void {
    if (!this.riskData.limit) {
      this.riskData.limit = {
        daily: {
          used: 0,
          remaining: this.config.limit.thresholds.daily
        },
        single: {
          lastAmount: 0,
          timestamp: Date.now()
        }
      };
    }

    // 更新每日使用量
    this.riskData.limit.daily.used += amount;
    this.riskData.limit.daily.remaining = this.config.limit.thresholds.daily - this.riskData.limit.daily.used;

    // 更新单笔交易记录
    this.riskData.limit.single = {
      lastAmount: amount,
      timestamp: Date.now()
    };

    this.checkLimitRisk();
  }

  private startSlippageMonitor(): void {
    if (this.config.slippage.enabled && this.config.slippage.checkInterval > 0) {
      this.slippageInterval = setInterval(() => {
        this.checkSlippageRisk();
      }, this.config.slippage.checkInterval);
    }
  }

  private startBalanceMonitor(): void {
    if (this.config.balance.enabled && this.config.balance.checkInterval > 0) {
      this.balanceInterval = setInterval(() => {
        this.checkBalanceRisk();
      }, this.config.balance.checkInterval);
    }
  }

  private startLimitMonitor(): void {
    if (this.config.limit.enabled && this.config.limit.resetInterval > 0) {
      this.limitResetInterval = setInterval(() => {
        this.resetDailyLimit();
      }, this.config.limit.resetInterval);
    }
  }

  private checkSlippageRisk(): void {
    if (!this.config.slippage.enabled || !this.riskData.slippage) return;

    const { current, token } = this.riskData.slippage;
    const { thresholds } = this.config.slippage;

    let level: 'low' | 'medium' | 'high' | null = null;
    if (current >= thresholds.high) {
      level = 'high';
    } else if (current >= thresholds.medium) {
      level = 'medium';
    } else if (current >= thresholds.low) {
      level = 'low';
    }

    if (level) {
      const notification: RiskNotification = {
        type: 'slippage',
        level,
        message: `Slippage risk for ${token}: ${current}%`,
        value: current,
        threshold: thresholds[level],
        timestamp: new Date(),
        metadata: {
          token,
          thresholds
        }
      };
      this.notify(notification);
    }
  }

  private checkBalanceRisk(): void {
    if (!this.config.balance.enabled || !this.riskData.balance) return;

    const { current } = this.riskData.balance;
    const { thresholds } = this.config.balance;

    let level: 'low' | 'medium' | 'high' | null = null;
    if (current <= thresholds.low) {
      level = 'high';
    } else if (current <= thresholds.medium) {
      level = 'medium';
    } else if (current <= thresholds.high) {
      level = 'low';
    }

    if (level) {
      const notification: RiskNotification = {
        type: 'balance',
        level,
        message: `Balance warning: ${current} SOL`,
        value: current,
        threshold: thresholds[level],
        timestamp: new Date(),
        metadata: {
          thresholds
        }
      };
      this.notify(notification);
    }
  }

  private checkLimitRisk(): void {
    if (!this.config.limit.enabled || !this.riskData.limit) return;

    const { daily, single } = this.riskData.limit;
    const { thresholds } = this.config.limit;

    // 检查每日限额
    if (daily.used >= thresholds.daily * 0.9) { // 90% 警告
      const notification: RiskNotification = {
        type: 'limit',
        level: 'high',
        message: `Daily trading limit near: ${daily.used}/${thresholds.daily} SOL`,
        value: daily.used,
        threshold: thresholds.daily,
        timestamp: new Date(),
        metadata: {
          remaining: daily.remaining,
          type: 'daily'
        }
      };
      this.notify(notification);
    }

    // 检查单笔交易限额
    if (single.lastAmount >= thresholds.single * 0.9) { // 90% 警告
      const notification: RiskNotification = {
        type: 'limit',
        level: 'high',
        message: `Single trade amount warning: ${single.lastAmount} SOL`,
        value: single.lastAmount,
        threshold: thresholds.single,
        timestamp: new Date(),
        metadata: {
          type: 'single'
        }
      };
      this.notify(notification);
    }
  }

  private resetDailyLimit(): void {
    if (this.riskData.limit) {
      this.riskData.limit.daily = {
        used: 0,
        remaining: this.config.limit.thresholds.daily
      };
    }
  }

  private notify(notification: RiskNotification): void {
    this.notificationService.notify(notification);
  }
} 