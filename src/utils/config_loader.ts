/**
 * 配置加载器（船舶导航图纸阅读器）
 * 负责加载和解析配置文件，支持带注释的JSON
 */

import { NotificationConfig } from '../types/notification.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as _ from 'lodash';

// 动态导入strip-json-comments
async function loadJsonWithComments(filePath: string) {
  // 兼容ESM导入
  const mod = await import('strip-json-comments');
  const stripJsonComments = mod.default || mod;
  const content = fs.readFileSync(filePath, 'utf8');
  const json = stripJsonComments(content);
  return JSON.parse(json);
}

/**
 * Configuration loader that supports JSON with comments
 */
export class ConfigLoader {
  private static instance: ConfigLoader;
  private config: Record<string, any> | null = null;

  public constructor() {}

  public static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  public async loadConfig(configPath: string): Promise<Record<string, any>> {
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found at ${configPath}`);
    }
    const parsedConfig = await loadJsonWithComments(configPath);
    this.config = parsedConfig;
    return parsedConfig;
  }

  public getConfig(): Record<string, any> {
    if (!this.config) {
      throw new Error('Config not loaded');
    }
    return this.config;
  }

  public loadDefaultConfig(): Record<string, any> {
    const defaultConfig: Record<string, any> = {
      telegram: {
        enabled: true,
        botToken: '',
        chatId: '',
        events: {
          trade: {
            enabled: true,
            template: '📊 Trade: {message}'
          },
          error: {
            enabled: true,
            template: '❌ Error: {message}'
          },
          info: {
            enabled: true,
            template: 'ℹ️ Info: {message}'
          },
          warning: {
            enabled: true,
            template: '⚠️ Warning: {message}'
          }
        }
      }
    };
    this.config = defaultConfig;
    return defaultConfig;
  }
}

/**
 * 获取配置路径
 * 
 * 【比喻解释】
 * 就像找出航海图纸存放的位置：
 * - 确定基础目录（项目根目录）
 * - 找到图纸存放的文件柜（config目录）
 * - 根据航行需求选择合适的图纸（环境配置）
 * 
 * @param {string} configName - 配置文件名，就像图纸名称
 * @param {string} [env] - 环境，就像航行海域
 * @returns {string} - 完整的配置文件路径
 */
export function getConfigPath(configName: string, env: string = process.env.NODE_ENV || 'development'): string {
  // ESM 兼容的 __dirname 替代方案
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const rootDir = path.resolve(__dirname, '../../');
  
  if (env && env !== 'development') {
    // 尝试加载特定环境的配置
    const envConfigPath = path.join(rootDir, 'config', `${configName}.${env}.json`);
    if (fs.existsSync(envConfigPath)) {
      return envConfigPath;
    }
    
    // 尝试加载环境命名的配置
    const namedEnvConfig = path.join(rootDir, 'config', `${env}.json`);
    if (fs.existsSync(namedEnvConfig)) {
      return namedEnvConfig;
    }
  }
  
  // 返回默认配置路径
  return path.join(rootDir, 'config', `${configName}.json`);
}

/**
 * 加载默认配置
 * 
 * 【比喻解释】
 * 就像获取标准航行指令：
 * - 找到默认航海图纸（default.json）
 * - 解读图纸内容获取航行指令
 * 
 * @returns {Promise<Record<string, any>>} - 默认配置对象
 */
export async function loadDefaultConfig(): Promise<Record<string, any>> {
  const configLoader = new ConfigLoader();
  const env = process.env.NODE_ENV || 'development';
  try {
    // 先加载 default.json
    let baseConfig: Record<string, any> = {};
    try {
      const jsoncPath = getConfigPath('default', 'development').replace(/\.json$/, '.jsonc');
      baseConfig = await configLoader.loadConfig(jsoncPath);
    } catch (error) {
      const jsonPath = getConfigPath('default', 'development');
      baseConfig = await configLoader.loadConfig(jsonPath);
    }
    // 如果是 production 环境，加载 production.json 并深度合并
    if (env !== 'development') {
      let prodConfig: Record<string, any> = {};
      const envConfigPath = getConfigPath('production', env).replace(/\.json$/, '.jsonc');
      if (fs.existsSync(envConfigPath)) {
        prodConfig = await configLoader.loadConfig(envConfigPath);
      } else {
        const envJsonPath = getConfigPath('production', env);
        if (fs.existsSync(envJsonPath)) {
          prodConfig = await configLoader.loadConfig(envJsonPath);
        }
      }
      // 深度合并，production 配置优先生效
      return _.merge({}, baseConfig, prodConfig);
    }
    return baseConfig;
  } catch (error) {
    console.error('Failed to load configuration:', error);
    throw error;
  }
} 