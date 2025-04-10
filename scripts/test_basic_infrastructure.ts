/**
 * 基础架构测试脚本
 * 用于测试RPC服务和日志系统的基本功能
 */

import dotenv from 'dotenv';
import logger from '../src/core/logger';
import { rpcService } from '../src/services/rpc_service';
import { PublicKey } from '@solana/web3.js';

// 加载环境变量
dotenv.config();

const MODULE_NAME = 'InfraTest';

/**
 * 测试RPC连接
 */
async function testRpcConnection() {
  try {
    logger.info('开始测试RPC连接...', MODULE_NAME);
    
    // 检查连接健康状态
    const isHealthy = await rpcService.isConnectionHealthy();
    logger.info(`RPC连接状态: ${isHealthy ? '正常' : '异常'}`, MODULE_NAME);
    
    // 获取最新区块高度
    const slot = await rpcService.withRetry(
      async () => await rpcService.connection.getSlot()
    );
    logger.info(`当前区块高度: ${slot}`, MODULE_NAME);
    
    // 获取网络版本
    const version = await rpcService.withRetry(
      async () => await rpcService.connection.getVersion()
    );
    logger.info(`Solana节点版本: ${JSON.stringify(version)}`, MODULE_NAME);
    
    // 测试重试机制
    logger.info('测试重试机制...', MODULE_NAME);
    try {
      // 故意使用无效的公钥来触发错误和重试
      await rpcService.withRetry(
        async () => await rpcService.connection.getAccountInfo(
          new PublicKey('invalidPubkey')
        )
      );
    } catch (error) {
      logger.info('预期中的错误被正确捕获', MODULE_NAME, { 
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    logger.info('RPC连接测试完成', MODULE_NAME);
    return true;
  } catch (error) {
    logger.error('RPC连接测试失败', MODULE_NAME, { 
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

/**
 * 测试日志系统
 */
function testLogger() {
  try {
    logger.info('开始测试日志系统...', MODULE_NAME);
    
    // 测试不同日志级别
    logger.debug('这是一条调试日志', MODULE_NAME, { detail: '包含详细信息' });
    logger.info('这是一条信息日志', MODULE_NAME, { status: 'normal' });
    logger.warn('这是一条警告日志', MODULE_NAME, { warning: 'resource low' });
    logger.error('这是一条错误日志', MODULE_NAME, { error: 'test error' });
    
    logger.info('日志系统测试完成', MODULE_NAME);
    return true;
  } catch (error) {
    console.error('日志系统测试失败:', error);
    return false;
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  logger.info('=== 开始基础架构测试 ===', MODULE_NAME);
  
  // 测试日志系统
  const loggerTestResult = testLogger();
  
  // 测试RPC连接
  const rpcTestResult = await testRpcConnection();
  
  // 输出测试结果
  logger.info('=== 测试结果 ===', MODULE_NAME, {
    logger: loggerTestResult ? '通过' : '失败',
    rpcConnection: rpcTestResult ? '通过' : '失败',
    overall: (loggerTestResult && rpcTestResult) ? '所有测试通过' : '测试存在失败项'
  });
  
  logger.info('基础架构测试完成', MODULE_NAME);
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