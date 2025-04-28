import { createClient } from 'redis';
import logger from '../../core/logger.js';

const MODULE_NAME = 'RedisCache';

interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  ttl?: number;
}

export class RedisCache {
  private client: ReturnType<typeof createClient>;
  private config: CacheConfig;
  private isConnected: boolean = false;

  constructor(config: CacheConfig) {
    this.config = {
      ttl: 3600, // 默认1小时过期
      ...config
    };
    
    this.client = createClient({
      url: `redis://${config.host}:${config.port}`,
      password: config.password,
      database: config.db || 0
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info('Redis 连接成功', MODULE_NAME);
    });

    this.client.on('error', (error) => {
      this.isConnected = false;
      logger.error('Redis 连接错误', MODULE_NAME, { error });
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis 正在重连', MODULE_NAME);
    });
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await this.client.connect();
    } catch (error) {
      logger.error('Redis 连接失败', MODULE_NAME, { error });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.client.quit();
      this.isConnected = false;
    } catch (error) {
      logger.error('Redis 断开连接失败', MODULE_NAME, { error });
      throw error;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Redis 未连接');
    }

    try {
      const serializedValue = JSON.stringify(value);
      await this.client.set(key, serializedValue, {
        EX: ttl || this.config.ttl
      });
    } catch (error) {
      logger.error('Redis 设置缓存失败', MODULE_NAME, { key, error });
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) {
      throw new Error('Redis 未连接');
    }

    try {
      const value = await this.client.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Redis 获取缓存失败', MODULE_NAME, { key, error });
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Redis 未连接');
    }

    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis 删除缓存失败', MODULE_NAME, { key, error });
      throw error;
    }
  }

  async clear(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Redis 未连接');
    }

    try {
      await this.client.flushDb();
    } catch (error) {
      logger.error('Redis 清空缓存失败', MODULE_NAME, { error });
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('Redis 未连接');
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis 检查缓存存在失败', MODULE_NAME, { key, error });
      throw error;
    }
  }

  async ttl(key: string): Promise<number> {
    if (!this.isConnected) {
      throw new Error('Redis 未连接');
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error('Redis 获取缓存过期时间失败', MODULE_NAME, { key, error });
      throw error;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.isConnected) {
      throw new Error('Redis 未连接');
    }

    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error('Redis 获取缓存键失败', MODULE_NAME, { pattern, error });
      throw error;
    }
  }
} 