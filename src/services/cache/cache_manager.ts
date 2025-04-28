import logger from '../../core/logger.js';
import { RedisCache } from './redis_cache.js';

const MODULE_NAME = 'CacheManager';

interface CacheOptions {
  ttl?: number;
  priority?: 'memory' | 'redis' | 'both';
}

interface CacheMetrics {
  memorySize: number;
  redisSize: number;
  hitRate: number;
  missRate: number;
  errorRate: number;
  lastSyncTime: number;
  syncStatus: 'success' | 'failed' | 'pending';
}

export class CacheManager {
  private memoryCache: Map<string, { data: any; timestamp: number }>;
  private redisCache: RedisCache | null;
  private defaultTtl: number;
  private defaultPriority: 'memory' | 'redis' | 'both';
  private metrics: CacheMetrics;
  private syncInterval: NodeJS.Timeout | null;
  private isDegraded: boolean;

  constructor(redisConfig?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  }) {
    this.memoryCache = new Map();
    this.defaultTtl = 3600; // 默认1小时
    this.defaultPriority = 'both';
    this.isDegraded = false;

    this.metrics = {
      memorySize: 0,
      redisSize: 0,
      hitRate: 0,
      missRate: 0,
      errorRate: 0,
      lastSyncTime: 0,
      syncStatus: 'pending'
    };

    if (redisConfig) {
      this.redisCache = new RedisCache(redisConfig);
      this.redisCache.connect().catch(error => {
        logger.error('Redis 连接失败，将使用内存缓存', MODULE_NAME, { error });
        this.redisCache = null;
        this.isDegraded = true;
      });
    } else {
      this.redisCache = null;
    }

    // 启动定期同步
    this.startSync();
  }

  private startSync(): void {
    if (this.redisCache) {
      this.syncInterval = setInterval(async () => {
        try {
          await this.syncWithRedis();
          this.metrics.syncStatus = 'success';
          this.metrics.lastSyncTime = Date.now();
        } catch (error) {
          logger.error('缓存同步失败', MODULE_NAME, { error });
          this.metrics.syncStatus = 'failed';
          this.metrics.errorRate += 1;
        }
      }, 300000); // 每5分钟同步一次
    }
  }

  private async syncWithRedis(): Promise<void> {
    if (!this.redisCache) return;

    try {
      // 同步内存缓存到Redis
      for (const [key, value] of this.memoryCache.entries()) {
        await this.redisCache.set(key, value.data, this.defaultTtl);
      }

      // 从Redis同步到内存
      const redisKeys = await this.redisCache.keys('*');
      for (const key of redisKeys) {
        const value = await this.redisCache.get(key);
        if (value) {
          this.memoryCache.set(key, {
            data: value,
            timestamp: Date.now()
          });
        }
      }

      this.updateMetrics();
    } catch (error) {
      logger.error('缓存同步失败', MODULE_NAME, { error });
      throw error;
    }
  }

  private updateMetrics(): void {
    this.metrics.memorySize = this.memoryCache.size;
    if (this.redisCache) {
      this.redisCache.keys('*').then(keys => {
        this.metrics.redisSize = keys.length;
      });
    }
  }

  async preloadCache(data: Record<string, any>): Promise<void> {
    try {
      for (const [key, value] of Object.entries(data)) {
        await this.set(key, value, { priority: 'both' });
      }
      logger.info('缓存预热完成', MODULE_NAME, { 
        preloadedKeys: Object.keys(data).length 
      });
    } catch (error) {
      logger.error('缓存预热失败', MODULE_NAME, { error });
      throw error;
    }
  }

  async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    const ttl = options?.ttl || this.defaultTtl;
    const priority = options?.priority || this.defaultPriority;

    try {
      // 设置内存缓存
      if (priority === 'memory' || priority === 'both') {
        this.memoryCache.set(key, {
          data: value,
          timestamp: Date.now()
        });
      }

      // 设置 Redis 缓存
      if ((priority === 'redis' || priority === 'both') && this.redisCache && !this.isDegraded) {
        await this.redisCache.set(key, value, ttl);
      }
    } catch (error) {
      logger.error('设置缓存失败', MODULE_NAME, { key, error });
      this.metrics.errorRate += 1;
      throw error;
    }
  }

  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    const priority = options?.priority || this.defaultPriority;

    try {
      // 从内存缓存获取
      if (priority === 'memory' || priority === 'both') {
        const cached = this.memoryCache.get(key);
        if (cached) {
          const ttl = options?.ttl || this.defaultTtl;
          if (Date.now() - cached.timestamp < ttl * 1000) {
            this.metrics.hitRate += 1;
            return cached.data as T;
          }
          this.memoryCache.delete(key);
        }
      }

      // 从 Redis 缓存获取
      if ((priority === 'redis' || priority === 'both') && this.redisCache && !this.isDegraded) {
        const value = await this.redisCache.get<T>(key);
        if (value) {
          // 如果 Redis 有值，同时更新内存缓存
          if (priority === 'both') {
            this.memoryCache.set(key, {
              data: value,
              timestamp: Date.now()
            });
          }
          this.metrics.hitRate += 1;
          return value;
        }
      }

      this.metrics.missRate += 1;
      return null;
    } catch (error) {
      logger.error('获取缓存失败', MODULE_NAME, { key, error });
      this.metrics.errorRate += 1;
      throw error;
    }
  }

  async delete(key: string, options?: CacheOptions): Promise<void> {
    const priority = options?.priority || this.defaultPriority;

    try {
      // 删除内存缓存
      if (priority === 'memory' || priority === 'both') {
        this.memoryCache.delete(key);
      }

      // 删除 Redis 缓存
      if ((priority === 'redis' || priority === 'both') && this.redisCache && !this.isDegraded) {
        await this.redisCache.delete(key);
      }
    } catch (error) {
      logger.error('删除缓存失败', MODULE_NAME, { key, error });
      this.metrics.errorRate += 1;
      throw error;
    }
  }

  async clear(options?: CacheOptions): Promise<void> {
    const priority = options?.priority || this.defaultPriority;

    try {
      // 清空内存缓存
      if (priority === 'memory' || priority === 'both') {
        this.memoryCache.clear();
      }

      // 清空 Redis 缓存
      if ((priority === 'redis' || priority === 'both') && this.redisCache && !this.isDegraded) {
        await this.redisCache.clear();
      }
    } catch (error) {
      logger.error('清空缓存失败', MODULE_NAME, { error });
      this.metrics.errorRate += 1;
      throw error;
    }
  }

  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    const priority = options?.priority || this.defaultPriority;

    try {
      // 检查内存缓存
      if (priority === 'memory' || priority === 'both') {
        const cached = this.memoryCache.get(key);
        if (cached) {
          const ttl = options?.ttl || this.defaultTtl;
          if (Date.now() - cached.timestamp < ttl * 1000) {
            return true;
          }
          this.memoryCache.delete(key);
        }
      }

      // 检查 Redis 缓存
      if ((priority === 'redis' || priority === 'both') && this.redisCache && !this.isDegraded) {
        return await this.redisCache.exists(key);
      }

      return false;
    } catch (error) {
      logger.error('检查缓存存在失败', MODULE_NAME, { key, error });
      this.metrics.errorRate += 1;
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    try {
      const now = Date.now();
      let clearedCount = 0;

      // 清理内存缓存
      for (const [key, value] of this.memoryCache.entries()) {
        if (now - value.timestamp > this.defaultTtl * 1000) {
          this.memoryCache.delete(key);
          clearedCount++;
        }
      }

      if (clearedCount > 0) {
        logger.info('清理过期内存缓存', MODULE_NAME, { clearedCount });
      }
    } catch (error) {
      logger.error('清理缓存失败', MODULE_NAME, { error });
      this.metrics.errorRate += 1;
      throw error;
    }
  }

  getMemoryCacheSize(): number {
    return this.memoryCache.size;
  }

  async getRedisCacheSize(): Promise<number> {
    if (!this.redisCache || this.isDegraded) {
      return 0;
    }

    try {
      const keys = await this.redisCache.keys('*');
      return keys.length;
    } catch (error) {
      logger.error('获取 Redis 缓存大小失败', MODULE_NAME, { error });
      this.metrics.errorRate += 1;
      return 0;
    }
  }

  getMetrics(): CacheMetrics {
    return {
      ...this.metrics,
      memorySize: this.memoryCache.size
    };
  }

  isInDegradedMode(): boolean {
    return this.isDegraded;
  }

  async disconnect(): Promise<void> {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.redisCache) {
      await this.redisCache.disconnect();
    }
  }
} 