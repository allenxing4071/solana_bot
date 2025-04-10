/**
 * 简化版池子监控器测试脚本
 * 用于测试PoolMonitor的基本功能，不加载现有池子
 */

import dotenv from 'dotenv';
import logger from '../src/core/logger';
import { poolMonitor } from '../src/modules/listener/pool_monitor';
import type { PoolInfo } from '../src/core/types';

// 加载环境变量
dotenv.config();

const MODULE_NAME = 'SimplePoolMonitorTest';

/**
 * 测试池子监控器基本功能
 */
async function testSimplePoolMonitor() {
  try {
    logger.info('开始测试池子监控器基本功能...', MODULE_NAME);
    
    // 设置事件监听器
    poolMonitor.on('newPool', (poolInfo: PoolInfo) => {
      logger.info('收到新池子事件', MODULE_NAME, {
        address: poolInfo.address.toBase58(),
        dex: poolInfo.dex,
        firstDetectedAt: new Date(poolInfo.firstDetectedAt).toISOString()
      });
    });
    
    // 测试启动和停止功能
    logger.info('测试池子监控器启动...', MODULE_NAME);
    await poolMonitor.start();
    logger.info('池子监控器已启动', MODULE_NAME);
    
    // 等待3秒
    logger.info('等待3秒...', MODULE_NAME);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 停止池子监控器
    logger.info('测试池子监控器停止...', MODULE_NAME);
    await poolMonitor.stop();
    logger.info('池子监控器已停止', MODULE_NAME);
    
    // 测试成功
    logger.info('池子监控器基本功能测试成功', MODULE_NAME);
    return true;
  } catch (error) {
    logger.error('池子监控器基本功能测试失败', MODULE_NAME, { 
      error: error instanceof Error ? error.message : String(error)
    });
    
    // 确保停止监控器
    try {
      await poolMonitor.stop();
    } catch (stopError) {
      logger.error('停止池子监控器失败', MODULE_NAME, { 
        error: stopError instanceof Error ? stopError.message : String(stopError)
      });
    }
    
    return false;
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  logger.info('=== 开始简化版池子监控器测试 ===', MODULE_NAME);
  
  // 测试池子监控器基本功能
  const poolMonitorTestResult = await testSimplePoolMonitor();
  
  // 输出测试结果
  logger.info('=== 测试结果 ===', MODULE_NAME, {
    poolMonitor: poolMonitorTestResult ? '通过' : '失败'
  });
  
  logger.info('简化版池子监控器测试完成', MODULE_NAME);
}

// 运行测试
runTests()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    logger.error('测试过程中发生未捕获的错误', MODULE_NAME, { 
      error: error instanceof Error ? error.message : String(error)
    });
    process.exit(1);
  }); 