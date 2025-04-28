import { DataSourceConfig, IDataSource, DataCacheConfig } from './data_sources.js';
import { SolanaDataSource } from './solana_data_source.js';
import logger from '../../core/logger.js';

export class DataSourceManager implements IDataSource {
  private config: DataSourceConfig;
  private cache: Map<string, { data: any; timestamp: number }>;
  private cacheConfig: DataCacheConfig;
  private solanaDataSource: SolanaDataSource | null = null;

  constructor(config: DataSourceConfig, cacheConfig: DataCacheConfig) {
    this.config = config;
    this.cacheConfig = cacheConfig;
    this.cache = new Map();
  }

  async initialize(config: DataSourceConfig): Promise<void> {
    this.config = config;
    logger.info('Initializing data sources...');
    
    // 初始化各个数据源
    if (this.config.solana) {
      await this.initializeSolana();
    }
    
    if (this.config.dexes) {
      await this.initializeDexes();
    }
    
    if (this.config.markets) {
      await this.initializeMarkets();
    }
    
    if (this.config.social) {
      await this.initializeSocial();
    }
    
    logger.info('Data sources initialized successfully');
  }

  private async initializeSolana(): Promise<void> {
    // 初始化 Solana 连接
    logger.info('Initializing Solana connection...');
    this.solanaDataSource = new SolanaDataSource(this.config.solana);
    await this.solanaDataSource.initialize(this.config.solana);
  }

  private async initializeDexes(): Promise<void> {
    // 初始化 DEX 连接
    logger.info('Initializing DEX connections...');
    // TODO: 实现 DEX 连接初始化
  }

  private async initializeMarkets(): Promise<void> {
    // 初始化市场数据源
    logger.info('Initializing market data sources...');
    // TODO: 实现市场数据源初始化
  }

  private async initializeSocial(): Promise<void> {
    // 初始化社交媒体数据源
    logger.info('Initializing social media data sources...');
    // TODO: 实现社交媒体数据源初始化
  }

  async getOnChainData(params: {
    type: 'account' | 'transaction' | 'program';
    address: string;
    options?: Record<string, any>;
  }): Promise<any> {
    const cacheKey = `onchain_${params.type}_${params.address}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      if (!this.solanaDataSource) {
        throw new Error('Solana data source not initialized');
      }

      const data = await this.solanaDataSource.getOnChainData(params);
      this.setCache(cacheKey, data);
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`Failed to fetch on-chain data: ${error.message}`);
      } else {
        logger.error('Failed to fetch on-chain data: Unknown error');
      }
      throw error;
    }
  }

  async getMarketData(params: {
    type: 'price' | 'volume' | 'liquidity';
    token: string;
    timeframe: string;
  }): Promise<any> {
    const cacheKey = `market_${params.type}_${params.token}_${params.timeframe}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // TODO: 实现市场数据获取逻辑
      const data = await this.fetchMarketData(params);
      this.setCache(cacheKey, data);
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`Failed to fetch market data: ${error.message}`);
      } else {
        logger.error('Failed to fetch market data: Unknown error');
      }
      throw error;
    }
  }

  async getSocialData(params: {
    platform: 'twitter' | 'telegram';
    query: string;
    timeframe: string;
  }): Promise<any> {
    const cacheKey = `social_${params.platform}_${params.query}_${params.timeframe}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // TODO: 实现社交媒体数据获取逻辑
      const data = await this.fetchSocialData(params);
      this.setCache(cacheKey, data);
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`Failed to fetch social data: ${error.message}`);
      } else {
        logger.error('Failed to fetch social data: Unknown error');
      }
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // 检查各个数据源的健康状态
      const checks = [
        this.checkSolanaHealth(),
        this.checkDexesHealth(),
        this.checkMarketsHealth(),
        this.checkSocialHealth()
      ];

      const results = await Promise.all(checks);
      return results.every(result => result);
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`Health check failed: ${error.message}`);
      } else {
        logger.error('Health check failed: Unknown error');
      }
      return false;
    }
  }

  private async checkSolanaHealth(): Promise<boolean> {
    if (!this.solanaDataSource) {
      return false;
    }
    return await this.solanaDataSource.healthCheck();
  }

  private async checkDexesHealth(): Promise<boolean> {
    // TODO: 实现 DEX 健康检查
    return true;
  }

  private async checkMarketsHealth(): Promise<boolean> {
    // TODO: 实现市场数据源健康检查
    return true;
  }

  private async checkSocialHealth(): Promise<boolean> {
    // TODO: 实现社交媒体数据源健康检查
    return true;
  }

  private getFromCache(key: string): any {
    if (!this.cacheConfig.enabled) {
      return null;
    }

    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.timestamp > this.cacheConfig.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any): void {
    if (!this.cacheConfig.enabled) {
      return;
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // 清理过期缓存
    this.cleanupCache();
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheConfig.ttl * 1000) {
        this.cache.delete(key);
      }
    }

    // 如果缓存大小超过限制，删除最旧的条目
    if (this.cache.size > this.cacheConfig.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toDelete = entries.slice(0, entries.length - this.cacheConfig.maxSize);
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  private async fetchOnChainData(params: any): Promise<any> {
    // TODO: 实现具体的链上数据获取逻辑
    throw new Error('Not implemented');
  }

  private async fetchMarketData(params: any): Promise<any> {
    // TODO: 实现具体的市场数据获取逻辑
    throw new Error('Not implemented');
  }

  private async fetchSocialData(params: any): Promise<any> {
    // TODO: 实现具体的社交媒体数据获取逻辑
    throw new Error('Not implemented');
  }
} 