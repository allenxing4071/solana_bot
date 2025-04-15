/**
 * Solana节点延迟测试工具
 * 用于测量本地到Solana RPC节点的网络延迟
 */

import { Connection, PublicKey } from '@solana/web3.js';
import axios from 'axios';

// 节点信息
const RPC_ENDPOINTS = [
  { name: '当前配置节点', url: process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com' },
  { name: 'Helius RPC', url: 'https://mainnet.helius-rpc.com/?api-key=97ca0bfd-3b50-42e0-8422-078e4cb4a80a' },
  { name: 'Solana主网', url: 'https://api.mainnet-beta.solana.com' },
  { name: 'GenesysGo', url: 'https://ssc-dao.genesysgo.net' },
  { name: 'Serum', url: 'https://solana-api.projectserum.com' },
  { name: 'QuickNode', url: 'https://solana-mainnet.rpc.extrnode.com' },
];

/**
 * 测量RPC调用延迟
 * @param endpoint RPC节点信息
 */
async function measureRpcLatency(endpoint: { name: string; url: string }) {
  console.log(`\n测试节点: ${endpoint.name} (${endpoint.url})`);
  
  try {
    // 创建连接
    const connection = new Connection(endpoint.url);
    
    // 测试1: 获取最新区块高度
    console.log('测试1: 获取最新区块高度');
    const start1 = Date.now();
    await connection.getSlot();
    const latency1 = Date.now() - start1;
    console.log(`延迟: ${latency1}ms`);
    
    // 测试2: 获取近期区块哈希
    console.log('测试2: 获取近期区块哈希');
    const start2 = Date.now();
    await connection.getLatestBlockhash();
    const latency2 = Date.now() - start2;
    console.log(`延迟: ${latency2}ms`);
    
    // 测试3: 获取余额查询
    console.log('测试3: 获取余额查询');
    const testWallet = new PublicKey('So11111111111111111111111111111111111111112'); // SOL代币地址
    const start3 = Date.now();
    await connection.getBalance(testWallet);
    const latency3 = Date.now() - start3;
    console.log(`延迟: ${latency3}ms`);
    
    // 测试4: PING测试 (简单HTTP请求)
    console.log('测试4: PING测试');
    const start4 = Date.now();
    await axios.post(endpoint.url, { jsonrpc: '2.0', id: 1, method: 'getHealth' });
    const latency4 = Date.now() - start4;
    console.log(`延迟: ${latency4}ms`);
    
    // 平均延迟
    const avgLatency = (latency1 + latency2 + latency3 + latency4) / 4;
    console.log(`平均延迟: ${avgLatency.toFixed(2)}ms`);
    
    return { 
      name: endpoint.name, 
      url: endpoint.url, 
      latencies: { slot: latency1, blockhash: latency2, balance: latency3, ping: latency4 },
      average: avgLatency
    };
  } catch (error) {
    console.error(`测试失败: ${error instanceof Error ? error.message : String(error)}`);
    return { 
      name: endpoint.name, 
      url: endpoint.url, 
      latencies: { slot: -1, blockhash: -1, balance: -1, ping: -1 },
      average: -1, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('===== Solana节点延迟测试 =====');
  console.log('测试环境：本地机器到各Solana RPC节点的网络延迟');
  console.log('测试项目：区块高度查询、区块哈希查询、余额查询、简单PING');
  
  const results = [];
  
  // 逐个测试节点
  for (const endpoint of RPC_ENDPOINTS) {
    const result = await measureRpcLatency(endpoint);
    results.push(result);
  }
  
  // 结果汇总
  console.log('\n===== 测试结果汇总 =====');
  results.sort((a, b) => a.average - b.average);
  
  for (const result of results) {
    if (result.average > 0) {
      console.log(`${result.name}: 平均延迟 ${result.average.toFixed(2)}ms`);
    } else {
      console.log(`${result.name}: 连接失败 (${result.error})`);
    }
  }
  
  // 评估
  const bestResult = results.find(r => r.average > 0);
  if (bestResult) {
    console.log(`\n最佳节点: ${bestResult.name} (${bestResult.url}), 平均延迟: ${bestResult.average.toFixed(2)}ms`);
    
    if (bestResult.average < 100) {
      console.log('延迟评估: 极佳 - 适合高频MEV操作');
    } else if (bestResult.average < 200) {
      console.log('延迟评估: 良好 - 适合一般MEV操作，但高频场景可能落后');
    } else if (bestResult.average < 500) {
      console.log('延迟评估: 一般 - 可能会错过部分MEV机会');
    } else {
      console.log('延迟评估: 较高 - 不建议用于MEV操作，建议更换节点或服务器位置');
    }
  }
}

// 执行测试
main().catch(error => {
  console.error('测试过程中出现错误:', error);
  process.exit(1);
}); 