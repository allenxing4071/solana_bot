/**
 * RPC连接测试脚本
 * 测试与Solana RPC节点的连接是否正常
 */

import dotenv from 'dotenv';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { DexType } from '../src/core/types';
import appConfig from '../src/core/config';

// 加载环境变量
dotenv.config();

const TEST_MODULE = '连接测试';

/**
 * 检查RPC连接
 */
async function testRpcConnection(): Promise<void> {
  console.log(`[${TEST_MODULE}] 开始测试RPC连接...`);
  
  const rpcUrl = process.env.SOLANA_RPC_URL || appConfig.network.rpcUrl;
  const wsUrl = process.env.SOLANA_WS_URL || appConfig.network.wsUrl || rpcUrl;
  
  if (!rpcUrl) {
    console.error(`[${TEST_MODULE}] 错误: 未设置RPC URL，请在.env文件中设置SOLANA_RPC_URL`);
    process.exit(1);
  }
  
  try {
    console.log(`[${TEST_MODULE}] 使用RPC URL: ${rpcUrl}`);
    const connection = new Connection(rpcUrl, { commitment: 'confirmed' });
    
    // 测试1: 检查版本
    const version = await connection.getVersion();
    console.log(`[${TEST_MODULE}] 成功获取Solana版本: ${JSON.stringify(version)}`);
    
    // 测试2: 获取最新区块高度
    const slot = await connection.getSlot();
    console.log(`[${TEST_MODULE}] 当前槽位(区块高度): ${slot}`);
    
    // 测试3: 检查交易费用
    const recentBlockhash = await connection.getLatestBlockhash();
    console.log(`[${TEST_MODULE}] 最新区块哈希: ${recentBlockhash.blockhash}, 交易费率: ${recentBlockhash.feeCalculator.lamportsPerSignature} lamports`);
    
    console.log(`[${TEST_MODULE}] HTTP RPC连接测试成功 ✅`);
  } catch (error) {
    console.error(`[${TEST_MODULE}] HTTP RPC连接测试失败 ❌`);
    console.error(error);
    process.exit(1);
  }
  
  // 测试WebSocket连接
  try {
    console.log(`\n[${TEST_MODULE}] 使用WebSocket URL: ${wsUrl}`);
    const wsConnection = new Connection(wsUrl, { commitment: 'confirmed' });
    
    console.log(`[${TEST_MODULE}] 测试账户订阅...`);
    const subId = await wsConnection.onAccountChange(
      new PublicKey('11111111111111111111111111111111'), // 系统程序ID
      (accountInfo) => {
        console.log(`[${TEST_MODULE}] 收到账户变更通知`);
      }
    );
    
    // 等待一些时间，然后取消订阅
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const unsubResult = await wsConnection.removeAccountChangeListener(subId);
    console.log(`[${TEST_MODULE}] 取消订阅结果: ${unsubResult}`);
    
    console.log(`[${TEST_MODULE}] WebSocket连接测试成功 ✅`);
  } catch (error) {
    console.error(`[${TEST_MODULE}] WebSocket连接测试失败 ❌`);
    console.error(error);
    // 不退出进程，因为即使WebSocket失败，HTTP连接可能仍然有效
    console.warn(`[${TEST_MODULE}] 警告: WebSocket连接失败，但系统仍可以使用HTTP连接继续运行`);
  }
}

/**
 * 检查DEX程序可访问性
 */
async function testDexPrograms(): Promise<void> {
  console.log(`\n[${TEST_MODULE}] 开始测试DEX程序可访问性...`);
  
  const rpcUrl = process.env.SOLANA_RPC_URL || appConfig.network.rpcUrl;
  if (!rpcUrl) {
    console.error(`[${TEST_MODULE}] 错误: 未设置RPC URL`);
    return;
  }
  
  const connection = new Connection(rpcUrl, { commitment: 'confirmed' });
  
  const dexes = [
    {
      name: DexType.RAYDIUM,
      programId: process.env.RAYDIUM_PROGRAM_ID || '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'
    },
    {
      name: DexType.ORCA,
      programId: process.env.ORCA_PROGRAM_ID || '9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP'
    }
  ];
  
  for (const dex of dexes) {
    try {
      console.log(`[${TEST_MODULE}] 测试 ${dex.name} 程序可访问性...`);
      const programId = new PublicKey(dex.programId);
      
      // 获取程序账户
      const programInfo = await connection.getAccountInfo(programId);
      
      if (programInfo) {
        console.log(`[${TEST_MODULE}] ${dex.name} 程序账户存在 ✅, 数据大小: ${programInfo.data.length} 字节`);
      } else {
        console.warn(`[${TEST_MODULE}] ${dex.name} 程序账户不存在或无法访问 ⚠️`);
      }
      
      // 尝试获取几个程序账户作为示例
      console.log(`[${TEST_MODULE}] 尝试获取 ${dex.name} 的前5个程序账户...`);
      const accounts = await connection.getProgramAccounts(
        programId,
        { commitment: 'confirmed', dataSlice: { offset: 0, length: 0 }, limit: 5 }
      );
      
      console.log(`[${TEST_MODULE}] 成功获取到 ${accounts.length} 个 ${dex.name} 程序账户 ✅`);
      
    } catch (error) {
      console.error(`[${TEST_MODULE}] ${dex.name} 程序可访问性测试失败 ❌`);
      console.error(error);
    }
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  console.log(`=============== Solana MEV 机器人连接测试 ===============`);
  
  try {
    // 测试RPC连接
    await testRpcConnection();
    
    // 测试DEX程序
    await testDexPrograms();
    
    console.log(`\n[${TEST_MODULE}] 所有测试完成`);
    console.log(`=============== 连接测试结束 ===============`);
  } catch (error) {
    console.error(`[${TEST_MODULE}] 测试过程中发生错误`);
    console.error(error);
    process.exit(1);
  }
}

// 执行测试
main().catch(error => {
  console.error('测试失败:', error);
  process.exit(1);
}); 