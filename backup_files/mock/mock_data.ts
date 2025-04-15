/**
 * 模拟数据模块
 * 提供测试和开发环境使用的模拟数据
 */

import { PublicKey } from '@solana/web3.js';

// 模拟池子数据
export const mockPools = [
  {
    name: 'SOL/USDC',
    dex: 'Raydium',
    address: 'poolSOLUSDC72g645G',
    id: 'poolSOLUSDC72g645G',
    token0: {
      symbol: 'SOL',
      name: 'Solana',
      address: 'So11111111111111111111111111111111111111112'
    },
    token1: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
    },
    liquidity: 5000000,
    volume24h: 250000,
    price: 100.5,
    priceChange24h: 2.5,
    apy: 12.5,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  },
  {
    name: 'SOL/BONK',
    dex: 'Orca',
    address: 'poolSOLBONK92h367f',
    id: 'poolSOLBONK92h367f',
    token0: {
      symbol: 'SOL',
      name: 'Solana',
      address: 'So11111111111111111111111111111111111111112'
    },
    token1: {
      symbol: 'BONK',
      name: 'Bonk',
      address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'
    },
    liquidity: 2500000,
    volume24h: 180000,
    price: 0.00000035,
    priceChange24h: 8.5,
    apy: 35.2,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  },
  {
    name: 'SOL/JitoSOL',
    dex: 'Raydium',
    address: 'poolSOLJITO46k986d',
    id: 'poolSOLJITO46k986d',
    token0: {
      symbol: 'SOL',
      name: 'Solana',
      address: 'So11111111111111111111111111111111111111112'
    },
    token1: {
      symbol: 'JitoSOL',
      name: 'Jito Staked SOL',
      address: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn'
    },
    liquidity: 3500000,
    volume24h: 210000,
    price: 102.8,
    priceChange24h: 1.2,
    apy: 8.7,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  }
];

// 模拟代币数据
export const mockTokens = [
  {
    symbol: 'SOL',
    name: 'Solana',
    address: 'So11111111111111111111111111111111111111112',
    mint: new PublicKey('So11111111111111111111111111111111111111112'),
    decimals: 9,
    type: '白名单',
    riskScore: 1.0,
    price: 100 + (Math.random() * 40 - 20),
    priceChange24h: Math.random() * 20 - 10,
    liquidity: 5000000,
    marketCap: 20000000000 + (Math.random() * 4000000000),
    volume24h: 250000,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    mint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
    decimals: 6,
    type: '白名单',
    riskScore: 1.5,
    price: 0.99 + (Math.random() * 0.02),
    priceChange24h: Math.random() * 2 - 1,
    liquidity: 4500000,
    marketCap: 15000000000,
    volume24h: 350000,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  },
  {
    symbol: 'BONK',
    name: 'Bonk',
    address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    mint: new PublicKey('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'),
    decimals: 5,
    type: '未分类',
    riskScore: 5.0,
    price: 0.00000035,
    priceChange24h: Math.random() * 30 - 15,
    liquidity: 2000000,
    marketCap: 500000000,
    volume24h: 180000,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  }
];

// 生成系统状态数据
export function getSystemStatus() {
  const uptime = Math.floor(Math.random() * 86400) + 3600; // 1小时到1天
  const startTime = new Date(Date.now() - uptime * 1000).toISOString();
  
  return {
    status: "running",
    cpu: Math.floor(Math.random() * 40) + 10, // 10-50%
    memory: Math.floor(Math.random() * 30) + 40, // 40-70%
    uptime: uptime,
    profit: 12.5,
    activePools: 32,
    monitoredTokens: 156,
    executedTrades: 483,
    memoryDetails: {
      heapTotal: 154140672,
      heapUsed: 149556336,
      external: 7604491,
      arrayBuffers: 4667143,
      rss: 271384576
    },
    version: "1.0.0",
    startTime: startTime,
    currentTime: new Date().toISOString(),
    services: [
      { name: "代币监控服务", status: "运行中" },
      { name: "交易执行引擎", status: "运行中" },
      { name: "流动性池监控", status: "运行中" },
      { name: "套利策略引擎", status: "运行中" },
      { name: "价格预测模型", status: "运行中" }
    ]
  };
} 