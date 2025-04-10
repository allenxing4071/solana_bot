/**
 * 交易池监控器测试脚本
 * 用于测试PoolMonitor的基本功能
 */

import dotenv from 'dotenv';
import logger from '../src/core/logger';
import { poolMonitor } from '../src/modules/listener/pool_monitor';
import type { PoolInfo } from '../src/core/types';
import { EventType, DexType } from '../src/core/types';

// 加载环境变量
dotenv.config();

const MODULE_NAME = 'PoolMonitorTest';

/**
 * 测试池子监控器
 */
async function testPoolMonitor() {
  try {
    logger.info('开始测试池子监控器...', MODULE_NAME);
    
    // 设置事件监听器
    poolMonitor.on('newPool', (poolInfo: PoolInfo) => {
      logger.info('收到新池子事件', MODULE_NAME, {
        address: poolInfo.address.toBase58(),
        dex: poolInfo.dex,
        firstDetectedAt: new Date(poolInfo.firstDetectedAt).toISOString()
      });
    });
    
    poolMonitor.on('event', (event) => {
      if (event.type === EventType.NEW_POOL_DETECTED) {
        logger.info('收到系统事件: 新池子检测', MODULE_NAME, {
          type: event.type,
          timestamp: new Date(event.timestamp).toISOString()
        });
      }
    });
    
    // 启动池子监控器
    logger.info('启动池子监控器...', MODULE_NAME);
    await poolMonitor.start();
    logger.info('池子监控器已启动，开始监听...', MODULE_NAME);
    
    // 获取当前已知池子数量
    const knownPools = poolMonitor.getKnownPools();
    logger.info(`当前已知池子数量: ${knownPools.length}`, MODULE_NAME);
    
    // 输出每个DEX的池子数量
    const raydiumCount = poolMonitor.getPoolCountByDex(DexType.RAYDIUM);
    const orcaCount = poolMonitor.getPoolCountByDex(DexType.ORCA);
    
    logger.info('各DEX池子数量', MODULE_NAME, {
      raydium: raydiumCount,
      orca: orcaCount,
      total: raydiumCount + orcaCount
    });
    
    // 运行10秒，查看是否能检测到新池子
    logger.info('监听10秒，等待新池子事件...', MODULE_NAME);
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // 再次获取池子数量，查看是否有变化
    const updatedKnownPools = poolMonitor.getKnownPools();
    logger.info(`10秒后已知池子数量: ${updatedKnownPools.length}`, MODULE_NAME);
    
    // 停止池子监控器
    logger.info('停止池子监控器...', MODULE_NAME);
    await poolMonitor.stop();
    logger.info('池子监控器已停止', MODULE_NAME);
    
    return true;
  } catch (error) {
    logger.error('池子监控器测试失败', MODULE_NAME, { 
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
  logger.info('=== 开始池子监控器测试 ===', MODULE_NAME);
  
  // 测试池子监控器
  const poolMonitorTestResult = await testPoolMonitor();
  
  // 输出测试结果
  logger.info('=== 测试结果 ===', MODULE_NAME, {
    poolMonitor: poolMonitorTestResult ? '通过' : '失败'
  });
  
  logger.info('池子监控器测试完成', MODULE_NAME);
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