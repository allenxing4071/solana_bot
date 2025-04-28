/**
 * @file config.ts
 * @description 配置处理模块，读取和验证应用配置
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { DexType } from './types.js';
import { PublicKey } from '@solana/web3.js';
// 导入配置加载器
import { loadDefaultConfig } from '../utils/config_loader.js';
import { StrategyCondition } from '../core/types.js';
import { NotificationEvent, NotificationEventConfig, TelegramConfig } from '../types/notification.js';
import logger from './logger.js';
import { ConfigLoader } from '../utils/config_loader.js';

// 载入.env文件
dotenv.config();

/**
 * 交易条件类型
 */
export interface TradingCondition {
  type: 'price' | 'time' | 'volume';
  operator: '>' | '<' | '==' | '>=' | '<=';
  value: number;
  unit?: string;
}

/**
 * DEX配置接口
 */
export interface DexConfig {
  name: DexType;
  programId: string;
  enabled: boolean;
}

/**
 * API配置接口
 */
export interface ApiConfig {
  port: number;
  host: string;
  useMockData: boolean;
  enableAuth: boolean;
  apiKey: string;
  cors: {
    origin: string;
    methods: string[];
    allowedHeaders: string[];
  };
  staticDir: string;
}

/**
 * 日志配置接口
 */
export interface LoggingConfig {
  level: string;
  console: boolean;
  file: boolean;
  directory: string;
  maxFileSize: number;
  maxFiles: number;
  includeTimestamp: boolean;
}

/**
 * 应用配置接口
 */
export interface AppConfig {
  environment: string;
  api: {
    port: number;
    useMockData: boolean;
    enableAuth: boolean;
    apiKey: string;
    cors: {
      origin: string;
      methods: string[];
      allowedHeaders: string[];
    };
    staticDir: string;
  };
  logging: {
    level: string;
    console: boolean;
    file: boolean;
    filename: string;
    maxFiles: number;
    maxSize: string;
  };
  network: {
    cluster: string;
    rpcUrl: string;
    wsUrl: string;
    connection: {
      commitment: string;
      confirmTransactionInitialTimeout: number;
    }
  };
  wallet: {
    privateKey: string;
    maxTransactionAmount: number;
  };
  dexes: Array<{
    name: DexType;
    programId: string;
    enabled: boolean;
  }>;
  monitoring: {
    poolMonitorInterval: number;
    priceCheckInterval: number;
    healthCheckInterval: number;
  };
  trading: {
    buyStrategy: {
      enabled: boolean;
      maxAmountPerTrade: number;
      maxSlippage: number;
      minConfidence: number;
      priorityFee: {
        enabled: boolean;
        multiplier: number;
        baseFee: number;
        maxFee: number;
      }
    };
    sellStrategy: {
      enabled: boolean;
      conditions: StrategyCondition[];
      maxSlippage: number;
    };
    maxTransactionAmount: number;
    buyAmountSol: number;
    maxBuySlippage: number;
    maxSellSlippage: number;
    txRetryCount: number;
    txConfirmTimeout: number;
    txPriorityFee: number;
  };
  security: {
    tokenValidation: {
      useWhitelist: boolean;
      useBlacklist: boolean;
      whitelistPath: string;
      blacklistPath: string;
      minLiquidityUsd: number;
      minPoolBalanceToken: number;
      requireMetadata: boolean;
      maxInitialPriceUsd?: number;
    };
    transactionSafety: {
      simulateBeforeSend: boolean;
      maxRetryCount: number;
      maxPendingTx: number;
    };
  };
  notification: {
    telegram: {
      enabled: boolean;
      botToken: string | null;
      chatId: string | null;
      events: Record<string, boolean>;
    }
  };
  jitoMev: {
    enabled: boolean;
    tipPercent: number;
    authKeypair: string | null;
  };
}

/**
 * 配置版本信息接口
 */
export interface ConfigVersion {
  version: string;
  timestamp: number;
  description: string;
  hash: string;
  changes: {
    path: string;
    oldValue: any;
    newValue: any;
  }[];
}

/**
 * 带版本的配置接口
 */
export interface VersionedConfig extends AppConfig {
  _version: ConfigVersion;
}

let appConfig: AppConfig | null = null;
let configReady = false;
let configInitPromise: Promise<void> | null = null;

/**
 * 初始化应用配置
 */
export async function initializeConfig(customConfig?: AppConfig): Promise<void> {
  try {
    const defaultConfig = await loadDefaultConfig();
    let config = { ...defaultConfig, ...customConfig };
    config.environment = config.environment || process.env.NODE_ENV || 'production';
    // 插入 debug 日志
    console.log('DEBUG config.network:', config.network);
    console.log('DEBUG config.wallet:', config.wallet);
    validateConfig(config as AppConfig);
    appConfig = config as AppConfig;
    configReady = true;
  } catch (error) {
    throw new Error(`Failed to initialize config: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 新增：异步初始化配置
 */
export async function initAppConfig() {
  if (configReady) return;
  const loaded = await loadDefaultConfig();
  await initializeConfig(loaded as AppConfig);
}

/**
 * 等待配置就绪
 */
export async function waitForConfigReady(): Promise<void> {
  if (configReady) return;
  if (!configInitPromise) {
    configInitPromise = (async () => {
      await initAppConfig();
    })();
  }
  await configInitPromise;
}

/**
 * 验证配置
 * @param config 待验证的配置对象
 * @throws Error 如果配置验证失败
 */
function validateConfig(config: AppConfig): void {
  // 1. 基础配置验证
  if (!config) {
    throw new Error('配置对象不能为空');
  }

  // 2. 环境配置验证
  if (!config.environment || !['development', 'production', 'test'].includes(config.environment)) {
    throw new Error('无效的环境配置');
  }

  // 3. API配置验证
  if (!config.api) {
    throw new Error('API配置不能为空');
  }
  if (typeof config.api.port !== 'number' || config.api.port < 1 || config.api.port > 65535) {
    throw new Error('无效的API端口配置');
  }
  if (config.api.enableAuth && !config.api.apiKey) {
    throw new Error('启用API认证时必须配置API密钥');
  }

  // 4. 网络配置验证
  if (!config.network) {
    throw new Error('网络配置不能为空');
  }
  if (!config.network.rpcUrl) {
    throw new Error('RPC URL不能为空');
  }
  if (!config.network.wsUrl) {
    throw new Error('WebSocket URL不能为空');
  }
  if (!config.network.connection || !config.network.connection.commitment) {
    throw new Error('网络连接配置不完整');
  }

  // 5. 钱包配置验证
  if (!config.wallet) {
    throw new Error('钱包配置不能为空');
  }
  if (!config.wallet.privateKey) {
    throw new Error('钱包私钥不能为空');
  }
  if (typeof config.wallet.maxTransactionAmount !== 'number' || config.wallet.maxTransactionAmount <= 0) {
    throw new Error('无效的交易金额上限配置');
  }

  // 6. DEX配置验证
  if (!config.dexes || !Array.isArray(config.dexes)) {
    throw new Error('DEX配置必须是一个数组');
  }
  for (const dex of config.dexes) {
    if (!dex.name || !dex.programId) {
      throw new Error('DEX配置缺少必要字段');
    }
    if (typeof dex.enabled !== 'boolean') {
      throw new Error('DEX启用状态必须为布尔值');
    }
  }

  // 7. 监控配置验证
  if (!config.monitoring) {
    throw new Error('监控配置不能为空');
  }
  if (typeof config.monitoring.poolMonitorInterval !== 'number' || config.monitoring.poolMonitorInterval <= 0) {
    throw new Error('无效的池子监控间隔配置');
  }
  if (typeof config.monitoring.priceCheckInterval !== 'number' || config.monitoring.priceCheckInterval <= 0) {
    throw new Error('无效的价格检查间隔配置');
  }

  // 8. 交易配置验证
  if (!config.trading) {
    throw new Error('交易配置不能为空');
  }
  if (!config.trading.buyStrategy || !config.trading.sellStrategy) {
    throw new Error('交易策略配置不完整');
  }
  if (typeof config.trading.maxTransactionAmount !== 'number' || config.trading.maxTransactionAmount <= 0) {
    throw new Error('无效的最大交易金额配置');
  }

  // 9. 安全配置验证
  if (!config.security) {
    throw new Error('安全配置不能为空');
  }
  if (!config.security.tokenValidation || !config.security.transactionSafety) {
    throw new Error('安全配置不完整');
  }
  if (config.security.tokenValidation.useWhitelist && !config.security.tokenValidation.whitelistPath) {
    throw new Error('启用白名单时必须配置白名单路径');
  }
  if (config.security.tokenValidation.useBlacklist && !config.security.tokenValidation.blacklistPath) {
    throw new Error('启用黑名单时必须配置黑名单路径');
  }

  // 10. 通知配置验证
  if (!config.notification) {
    throw new Error('通知配置不能为空');
  }
  if (config.notification.telegram.enabled) {
    if (!config.notification.telegram.botToken) {
      throw new Error('启用Telegram通知时必须配置Bot Token');
    }
    if (!config.notification.telegram.chatId) {
      throw new Error('启用Telegram通知时必须配置Chat ID');
    }
  }

  // 11. Jito MEV配置验证
  if (config.jitoMev.enabled) {
    if (typeof config.jitoMev.tipPercent !== 'number' || config.jitoMev.tipPercent < 0) {
      throw new Error('无效的Jito MEV小费比例配置');
    }
    if (!config.jitoMev.authKeypair) {
      throw new Error('启用Jito MEV时必须配置认证密钥对');
    }
  }

  // 12. 配置依赖关系验证
  if (config.trading.buyStrategy.enabled && !config.network.rpcUrl) {
    throw new Error('启用买入策略时必须配置RPC URL');
  }
  if (config.trading.sellStrategy.enabled && !config.wallet.privateKey) {
    throw new Error('启用卖出策略时必须配置钱包私钥');
  }
  if (config.monitoring.poolMonitorInterval < config.monitoring.priceCheckInterval) {
    throw new Error('池子监控间隔不能小于价格检查间隔');
  }
}

/**
 * 确保JSON文件存在
 */
  function ensureJsonFileExists(filePath: string, defaultContent: any): void {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);

  if (!fs.existsSync(absolutePath)) {
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(absolutePath, JSON.stringify(defaultContent, null, 2));
  }
}

// 导出配置对象作为默认导出
export default appConfig;

/**
 * 配置管理器类
 * 负责配置的动态更新和验证
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: VersionedConfig;
  private configWatchers: Map<string, Set<(newValue: any) => void>>;
  private configFile: string;
  private fileWatcher: fs.FSWatcher | null;
  private configHistory: VersionedConfig[];
  private readonly MAX_HISTORY_SIZE = 10;
  private versionFile: string;

  private constructor(config: AppConfig, configFile: string) {
    this.configFile = configFile;
    this.versionFile = path.join(path.dirname(configFile), 'versions.json');
    this.configWatchers = new Map();
    this.fileWatcher = null;
    this.configHistory = [];
    
    // 初始化版本信息
    const initialVersion: ConfigVersion = {
      version: '1.0.0',
      timestamp: Date.now(),
      description: '初始配置',
      hash: this.calculateConfigHash(config),
      changes: []
    };
    
    this.config = {
      ...config,
      _version: initialVersion
    };
    
    // 确保版本文件存在
    this.ensureVersionFile();
  }

  public static getInstance(config: AppConfig, configFile: string): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager(config, configFile);
    }
    return ConfigManager.instance;
  }

  /**
   * 计算配置的哈希值
   */
  private calculateConfigHash(config: AppConfig): string {
    const configStr = JSON.stringify(config);
    return require('crypto').createHash('sha256').update(configStr).digest('hex');
  }

  /**
   * 确保版本文件存在
   */
  private ensureVersionFile(): void {
    if (!fs.existsSync(this.versionFile)) {
      fs.writeFileSync(this.versionFile, JSON.stringify({
        versions: [this.config._version],
        current: this.config._version.version
      }, null, 2));
    }
  }

  /**
   * 生成新版本号
   */
  private generateNewVersion(oldVersion: string): string {
    const [major, minor, patch] = oldVersion.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }

  /**
   * 记录配置变更
   */
  private async recordConfigChange(oldConfig: VersionedConfig, newConfig: Partial<VersionedConfig> & AppConfig, description: string): Promise<void> {
    const changes = this.diffConfig(oldConfig, {
      ...newConfig,
      _version: oldConfig._version
    });
    const newVersion: ConfigVersion = {
      version: this.generateNewVersion(oldConfig._version.version),
      timestamp: Date.now(),
      description,
      hash: this.calculateConfigHash(newConfig),
      changes
    };

    // 更新版本信息
    (newConfig as VersionedConfig)._version = newVersion;

    // 保存版本记录
    const versionHistory = JSON.parse(fs.readFileSync(this.versionFile, 'utf-8'));
    versionHistory.versions.push(newVersion);
    versionHistory.current = newVersion.version;
    
    await fs.promises.writeFile(this.versionFile, JSON.stringify(versionHistory, null, 2));
  }

  /**
   * 比较配置差异
   */
  private diffConfig(oldConfig: VersionedConfig, newConfig: VersionedConfig): ConfigVersion['changes'] {
    const changes: ConfigVersion['changes'] = [];
    const stack = [{ path: '', oldObj: oldConfig as Record<string, any>, newObj: newConfig as Record<string, any> }];

    while (stack.length > 0) {
      const { path, oldObj, newObj } = stack.pop()!;

      for (const key in newObj) {
        if (key === '_version') continue;
        
        const newValue = newObj[key];
        const oldValue = oldObj[key];
        const currentPath = path ? `${path}.${key}` : key;

        if (typeof newValue === 'object' && newValue !== null) {
          stack.push({
            path: currentPath,
            oldObj: oldValue || {},
            newObj: newValue
          });
        } else if (newValue !== oldValue) {
          changes.push({
            path: currentPath,
            oldValue,
            newValue
          });
        }
      }
    }

    return changes;
  }

  /**
   * 获取指定版本的配置
   */
  async getConfigVersion(version: string): Promise<VersionedConfig | null> {
    const versionHistory = JSON.parse(fs.readFileSync(this.versionFile, 'utf-8'));
    const targetVersion = versionHistory.versions.find((v: ConfigVersion) => v.version === version);
    
    if (!targetVersion) {
      return null;
    }

    // 从历史记录中查找
    const historyConfig = this.configHistory.find(c => c._version.version === version);
    if (historyConfig) {
      return historyConfig;
    }

    // 从文件中加载
    try {
      const backupFile = path.join(
        path.dirname(this.configFile),
        `backup-${version}.json`
      );
      if (fs.existsSync(backupFile)) {
        return JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
      }
    } catch (error) {
      logger.error('加载历史版本配置失败:', error instanceof Error ? error.message : String(error));
    }

    return null;
  }

  /**
   * 切换到指定版本
   */
  async switchVersion(version: string): Promise<boolean> {
    const targetConfig = await this.getConfigVersion(version);
    if (!targetConfig) {
      return false;
    }

    try {
      await this.updateConfig(targetConfig);
      return true;
    } catch (error) {
      logger.error('切换配置版本失败:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  /**
   * 获取版本历史
   */
  async getVersionHistory(): Promise<ConfigVersion[]> {
    try {
      const versionHistory = JSON.parse(fs.readFileSync(this.versionFile, 'utf-8'));
      return versionHistory.versions;
    } catch (error) {
      logger.error('读取版本历史失败:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  /**
   * 启动配置监听
   */
  public startWatching(): void {
    if (this.fileWatcher) {
      return;
    }

    this.fileWatcher = fs.watch(this.configFile, async (eventType) => {
      if (eventType === 'change') {
        try {
          const newConfig = await this.loadConfigFile();
          this.updateConfig(newConfig);
        } catch (error) {
          logger.error('配置更新失败', 'ConfigManager', error);
        }
      }
    });
  }

  /**
   * 停止配置监听
   */
  public stopWatching(): void {
    if (this.fileWatcher) {
      this.fileWatcher.close();
      this.fileWatcher = null;
    }
  }

  /**
   * 注册配置变更监听器
   */
  public watchConfig(key: string, callback: (newValue: any) => void): void {
    if (!this.configWatchers.has(key)) {
      this.configWatchers.set(key, new Set());
    }
    this.configWatchers.get(key)?.add(callback);
  }

  /**
   * 移除配置变更监听器
   */
  public unwatchConfig(key: string, callback: (newValue: any) => void): void {
    this.configWatchers.get(key)?.delete(callback);
  }

  /**
   * 更新配置
   */
  private async updateConfig(newConfig: VersionedConfig | AppConfig, description: string = '更新配置'): Promise<void> {
    try {
      // 验证新配置
      validateConfig(newConfig);
      
      const oldConfig = this.config;
      let versionedConfig: VersionedConfig;
      
      // 如果是普通配置对象，需要添加版本信息
      if (!('_version' in newConfig)) {
        const baseConfig = newConfig as AppConfig;
        versionedConfig = {
          ...baseConfig,
          _version: {
            version: this.generateNewVersion(oldConfig._version.version),
            timestamp: Date.now(),
            description,
            hash: this.calculateConfigHash(baseConfig),
            changes: []
          }
        };
        await this.recordConfigChange(oldConfig, baseConfig, description);
      } else {
        versionedConfig = newConfig as VersionedConfig;
      }
      
      // 保存当前配置到历史记录
      this.configHistory.push({ ...oldConfig });
      if (this.configHistory.length > this.MAX_HISTORY_SIZE) {
        this.configHistory.shift();
      }
      
      // 更新配置
      this.config = versionedConfig;
      
      // 通知监听器
      for (const [key, watchers] of this.configWatchers) {
        const newValue = this.getConfigValue(key);
        for (const watcher of watchers) {
          try {
            watcher(newValue);
          } catch (error) {
            logger.error(`配置监听器执行失败: ${key}`, error instanceof Error ? error.message : String(error));
          }
        }
      }
      
      // 保存配置到文件
      await this.saveConfig();
      
      logger.info('配置更新成功', JSON.stringify({
        version: this.config._version.version,
        description: this.config._version.description
      }));
    } catch (error) {
      logger.error('配置更新失败:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * 获取配置值
   */
  public getConfigValue(key: string): any {
    const keys = key.split('.');
    let value: any = this.config;
    
    for (const k of keys) {
      if (value === undefined || value === null) {
        return undefined;
      }
      value = value[k];
    }
    
    return value;
  }

  /**
   * 设置配置值
   */
  public async setConfigValue(key: string, value: any): Promise<void> {
    const keys = key.split('.');
    let current: any = this.config;
    
    // 遍历到最后一个键
    for (let i = 0; i < keys.length - 1; i++) {
      if (current[keys[i]] === undefined) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    // 设置值
    current[keys[keys.length - 1]] = value;
    
    // 保存配置
    await this.saveConfig();
    
    // 通知监听器
    const watchers = this.configWatchers.get(key);
    if (watchers) {
      for (const watcher of watchers) {
        try {
          watcher(value);
        } catch (error) {
          logger.error(`配置监听器执行失败: ${key}`, 'ConfigManager', error);
        }
      }
    }
  }

  /**
   * 加载配置文件
   */
  private async loadConfigFile(): Promise<VersionedConfig> {
    try {
      const content = await fs.promises.readFile(this.configFile, 'utf-8');
      const config = JSON.parse(content);
      return config as VersionedConfig;
    } catch (error) {
      throw new Error(`Failed to load config file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 保存配置到文件
   */
  private async saveConfig(): Promise<void> {
    try {
      // 保存当前配置
      await fs.promises.writeFile(
        this.configFile,
        JSON.stringify(this.config, null, 2)
      );

      // 保存版本备份
      const backupFile = path.join(
        path.dirname(this.configFile),
        `backup-${this.config._version.version}.json`
      );
      await fs.promises.writeFile(backupFile, JSON.stringify(this.config, null, 2));
    } catch (error) {
      throw new Error(`Failed to save config file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): VersionedConfig {
    return this.config;
  }

  /**
   * 获取配置历史
   */
  getConfigHistory(): VersionedConfig[] {
    return [...this.configHistory];
  }

  /**
   * 回滚到上一个配置版本
   * @returns 是否回滚成功
   */
  rollback(): boolean {
    if (this.configHistory.length === 0) {
      return false;
    }

    const previousConfig = this.configHistory.pop();
    if (!previousConfig) {
      return false;
    }

    try {
      this.updateConfig(previousConfig);
      return true;
    } catch (error) {
      logger.error('配置回滚失败:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  /**
   * 原子性更新配置
   * @param updater 配置更新函数
   * @returns 是否更新成功
   */
  atomicUpdate(updater: (config: VersionedConfig) => VersionedConfig): boolean {
    const oldConfig = this.config;
    let newConfig: VersionedConfig;

    try {
      newConfig = updater({ ...oldConfig });
      validateConfig(newConfig);
    } catch (error) {
      logger.error('配置更新验证失败:', error instanceof Error ? error.message : String(error));
      return false;
    }

    try {
      this.updateConfig(newConfig);
      return true;
} catch (error) {
      logger.error('配置更新失败:', error instanceof Error ? error.message : String(error));
      this.config = oldConfig;
      return false;
    }
  }
}

// 导出配置管理器实例
export const configManager = ConfigManager.getInstance(appConfig!, path.join(process.cwd(), 'config', 'config.json')); 