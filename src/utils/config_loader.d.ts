/**
 * 加载配置文件
 * @param configPath - 配置文件路径
 * @returns 解析后的配置对象
 */
export function loadConfig(configPath: string): any;

/**
 * 获取配置路径
 * @param configName - 配置文件名
 * @param env - 环境
 * @returns 完整的配置文件路径
 */
export function getConfigPath(configName: string, env?: string): string;

/**
 * 加载默认配置
 * @returns 默认配置对象
 */
export function loadDefaultConfig(): any; 