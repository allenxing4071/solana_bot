/**
 * API服务器入口文件
 * 用于启动API服务器，提供系统管理和监控接口
 */

import dotenv from 'dotenv';
// 加载环境变量
dotenv.config();

import apiServer from './api/server.js';
import logger from './core/logger.js';
import appConfig, { initAppConfig } from './core/config.js';

const MODULE_NAME = 'ApiServerEntry';

/**
 * 主函数
 */
async function main() {
  try {
    await initAppConfig();
    logger.info('正在启动API服务器...', MODULE_NAME);
    
    // 启动API服务器
    await apiServer.start();
    
    logger.info(`API服务器已成功启动，访问地址: http://localhost:${(appConfig as any)?.api?.port ?? 3000}`, MODULE_NAME);
    
    // 添加进程退出处理
    process.on('SIGINT', handleShutdown);
    process.on('SIGTERM', handleShutdown);
  } catch (error) {
    logger.error('API服务器启动失败', MODULE_NAME, {
      error: error instanceof Error ? error.message : String(error)
    });
    process.exit(1);
  }
}

/**
 * 处理服务器关闭
 */
async function handleShutdown() {
  try {
    logger.info('正在关闭API服务器...', MODULE_NAME);
    await apiServer.stop();
    logger.info('API服务器已关闭', MODULE_NAME);
    process.exit(0);
  } catch (error) {
    logger.error('关闭API服务器时出错', MODULE_NAME, {
      error: error instanceof Error ? error.message : String(error)
    });
    process.exit(1);
  }
}

// 如果这个文件是直接运行的（而不是被导入的），则执行主函数
if (require.main === module) {
  main();
}

export default apiServer; 