interface RateLimit {
  messages: number;
  window: number; // 时间窗口（秒）
}

interface RateLimitConfig {
  [key: string]: RateLimit;
}

export class RateLimiter {
  private limits: Map<string, RateLimitConfig> = new Map();
  private counters: Map<string, { count: number; resetTime: number }> = new Map();

  constructor() {
    // 设置默认速率限制
    this.setDefaultLimits();
  }

  private setDefaultLimits(): void {
    const defaultLimits: RateLimitConfig = {
      normal: { messages: 20, window: 60 },  // 20条/分钟
      high: { messages: 30, window: 60 },    // 30条/分钟
      urgent: { messages: 50, window: 60 }   // 50条/分钟
    };

    this.limits.set('message', defaultLimits);
  }

  async checkLimit(key: string, priority: string = 'normal'): Promise<boolean> {
    const limitConfig = this.limits.get(key);
    if (!limitConfig) {
      throw new Error(`No rate limit configuration found for key: ${key}`);
    }

    const limit = limitConfig[priority];
    if (!limit) {
      throw new Error(`No rate limit configuration found for priority: ${priority}`);
    }

    const counterKey = `${key}:${priority}`;
    const now = Date.now();
    const counter = this.counters.get(counterKey);

    if (!counter || now >= counter.resetTime) {
      // 重置计数器
      this.counters.set(counterKey, {
        count: 1,
        resetTime: now + (limit.window * 1000)
      });
      return true;
    }

    if (counter.count >= limit.messages) {
      return false;
    }

    // 增加计数
    counter.count++;
    return true;
  }

  setLimit(key: string, priority: string, limit: RateLimit): void {
    const limitConfig = this.limits.get(key) || {};
    limitConfig[priority] = limit;
    this.limits.set(key, limitConfig);
  }

  getLimit(key: string, priority: string): RateLimit | undefined {
    return this.limits.get(key)?.[priority];
  }

  resetCounter(key: string, priority: string): void {
    const counterKey = `${key}:${priority}`;
    this.counters.delete(counterKey);
  }

  getCounter(key: string, priority: string): { count: number; resetTime: number } | undefined {
    return this.counters.get(`${key}:${priority}`);
  }
} 