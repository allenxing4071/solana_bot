/**
 * 数据源配置接口
 */
export interface DataSourceConfig {
  // Solana 链上数据
  solana: {
    rpcUrl: string;
    wsUrl: string;
    commitment: 'processed' | 'confirmed' | 'finalized';
  };
  
  // DEX 数据源
  dexes: {
    raydium: {
      enabled: boolean;
      apiUrl: string;
      programId: string;
    };
    orca: {
      enabled: boolean;
      apiUrl: string;
      programId: string;
    };
    jupiter: {
      enabled: boolean;
      apiUrl: string;
    };
  };
  
  // 市场数据源
  markets: {
    coingecko: {
      enabled: boolean;
      apiUrl: string;
      apiKey?: string;
    };
    coinmarketcap: {
      enabled: boolean;
      apiUrl: string;
      apiKey?: string;
    };
  };
  
  // 社交媒体数据源
  social: {
    twitter: {
      enabled: boolean;
      apiKey?: string;
      apiSecret?: string;
    };
    telegram: {
      enabled: boolean;
      channels: string[];
    };
  };
}

/**
 * 数据源接口
 */
export interface IDataSource {
  // 初始化数据源
  initialize(config: DataSourceConfig): Promise<void>;
  
  // 获取链上数据
  getOnChainData(params: {
    type: 'account' | 'transaction' | 'program';
    address: string;
    options?: Record<string, any>;
  }): Promise<any>;
  
  // 获取市场数据
  getMarketData(params: {
    type: 'price' | 'volume' | 'liquidity';
    token: string;
    timeframe: string;
  }): Promise<any>;
  
  // 获取社交媒体数据
  getSocialData(params: {
    platform: 'twitter' | 'telegram';
    query: string;
    timeframe: string;
  }): Promise<any>;
  
  // 数据源健康检查
  healthCheck(): Promise<boolean>;
}

/**
 * 数据缓存配置
 */
export interface DataCacheConfig {
  enabled: boolean;
  type: 'memory' | 'redis' | 'file';
  ttl: number; // 缓存过期时间（秒）
  maxSize: number; // 最大缓存大小
  path?: string; // 文件缓存路径
  redis?: {
    host: string;
    port: number;
    password?: string;
  };
} 