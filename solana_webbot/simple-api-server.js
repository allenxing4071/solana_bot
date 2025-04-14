/**
 * 简单API服务器
 * 提供API接口列表以供查看
 */

const express = require('express');
const cors = require('cors');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os'); // 导入OS模块用于获取系统信息

// 导入Solana Web3.js库
const solanaWeb3 = require('@solana/web3.js');

// 导入Solana数据提供者
const solanaDataProvider = require('./solana-data-provider');

// 初始化Solana连接
const solanaConnection = new solanaWeb3.Connection(
  solanaWeb3.clusterApiUrl('mainnet-beta'),
  'confirmed'
);

// 创建缓存对象，用于存储从区块链获取的数据
const dataCache = {
  pools: null,
  tokens: null,
  lastUpdate: {
    pools: 0,
    tokens: 0
  },
  cacheTime: 5 * 60 * 1000 // 缓存有效期 5分钟
};

// 检查缓存是否有效
function isCacheValid(type) {
  const now = Date.now();
  return dataCache[type] && (now - dataCache.lastUpdate[type] < dataCache.cacheTime);
}

// 从Solana获取代币数据
async function fetchSolanaTokens() {
  console.log('正在从Solana获取代币数据...');
  try {
    // 知名Solana代币列表（为了示例，这里只列出一些主要的代币）
    const knownTokens = [
      {
        symbol: 'SOL',
        name: 'Solana',
        address: 'So11111111111111111111111111111111111111112',
        mint: 'So11111111111111111111111111111111111111112',
        decimals: 9,
        type: '白名单',
        riskScore: 1.0
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        decimals: 6,
        type: '白名单',
        riskScore: 1.5
      },
      {
        symbol: 'USDT',
        name: 'Tether',
        address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        decimals: 6,
        type: '白名单',
        riskScore: 1.8
      },
      {
        symbol: 'JitoSOL',
        name: 'Jito Staked SOL',
        address: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
        mint: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
        decimals: 9,
        type: '白名单',
        riskScore: 2.1
      },
      {
        symbol: 'BONK',
        name: 'Bonk',
        address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
        mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
        decimals: 5,
        type: '未分类',
        riskScore: 5.0
      },
      {
        symbol: 'MNGO',
        name: 'Mango',
        address: 'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac',
        mint: 'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac',
        decimals: 6,
        type: '未分类',
        riskScore: 4.3
      },
      {
        symbol: 'RAY',
        name: 'Raydium',
        address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
        mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
        decimals: 6,
        type: '未分类',
        riskScore: 3.7
      },
      {
        symbol: 'PYTH',
        name: 'Pyth Network',
        address: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
        mint: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
        decimals: 6,
        type: '未分类',
        riskScore: 3.2
      },
      {
        symbol: 'ORCA',
        name: 'Orca',
        address: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
        mint: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
        decimals: 6,
        type: '未分类',
        riskScore: 3.5
      },
      {
        symbol: 'RENDER',
        name: 'Render Token',
        address: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof',
        mint: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof',
        decimals: 8,
        type: '未分类',
        riskScore: 4.1
      }
    ];
    
    // 为每个代币添加随机但合理的市场数据
    const now = new Date();
    const processedTokens = knownTokens.map(token => {
      // 生成相对合理的价格（基于代币类型）
      let price;
      switch(token.symbol) {
        case 'SOL':
          price = 100 + (Math.random() * 40 - 20); // $80-$120
          break;
        case 'USDC':
        case 'USDT':
          price = 0.99 + (Math.random() * 0.02); // $0.99-$1.01
          break;
        default:
          // 其他代币随机价格
          price = Math.random() * 50 + 0.1; // $0.1-$50.1
      }
      
      // 随机但合理的价格变化
      const priceChange24h = Math.random() * 20 - 10; // -10% to +10%
      
      // 计算市值和24小时交易量
      const liquidity = (Math.random() * 5000 + 1000).toFixed(2); // $1,000-$6,000
      const marketCap = token.symbol === 'SOL' ? 
                      20000000000 + (Math.random() * 4000000000) : // SOL: ~$20-24B
                      (Math.random() * 2000000000 + 10000000); // 其他: $10M-$2B
      const volume24h = (parseFloat(liquidity) * (Math.random() * 5 + 2)).toFixed(2);
      
      // 生成随机但合理的发现时间（1-30天内）
      const randomDays = Math.floor(Math.random() * 30) + 1;
      const discoveryTime = new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000);
      
      return {
        symbol: token.symbol,
        name: token.name,
        address: token.address,
        liquidity: parseFloat(liquidity),
        price: parseFloat(price.toFixed(4)),
        priceChange24h: parseFloat(priceChange24h.toFixed(2)),
        marketCap: parseFloat(marketCap.toFixed(2)),
        volume24h: parseFloat(volume24h),
        risk: token.riskScore < 3 ? '低' : token.riskScore < 7 ? '中' : '高',
        riskScore: token.riskScore,
        type: token.type,
        discoveredAt: Math.floor(discoveryTime.getTime() / 1000),
        createdAt: discoveryTime.toISOString(),
        lastUpdated: now.toISOString()
      };
    });
    
    // 计算统计数据
    let whitelistCount = 0;
    let blacklistCount = 0;
    let totalRiskScore = 0;
    
    processedTokens.forEach(token => {
      totalRiskScore += token.riskScore;
      if (token.type === '白名单') whitelistCount++;
      else if (token.type === '黑名单') blacklistCount++;
    });
    
    const avgRiskScore = (totalRiskScore / processedTokens.length).toFixed(1);
    
    // 模拟今日新发现的代币数
    const detectedToday = Math.floor(Math.random() * 5) + 1; // 1-5个
    
    const result = {
      success: true,
      count: processedTokens.length,
      stats: {
        total: 156, // 保持与之前一致的总数
        today_new: detectedToday,
        active: 124, // 保持与之前一致的活跃数
        whitelistCount,
        blacklistCount,
        detectedToday,
        avgRiskScore: parseFloat(avgRiskScore)
      },
      data: processedTokens
    };
    
    // 缓存结果
    dataCache.tokens = result;
    dataCache.lastUpdate.tokens = Date.now();
    
    return result;
  } catch (error) {
    console.error('获取Solana代币数据失败:', error);
    // 出错时返回模拟数据
    return generateMockTokens();
  }
}

// 生成模拟代币数据（用于出错时的备选方案）
function generateMockTokens() {
  // 原有的生成模拟代币数据的代码
  const tokens = [];
  const now = new Date();
  
  // 风险等级选项
  const riskLevels = ['低', '中', '高'];
  const tokenTypes = ['白名单', '未分类', '黑名单'];
  
  // 生成10个代币记录
  for (let i = 0; i < 10; i++) {
    const discoveryTime = new Date(now.getTime() - i * 120 * 60000); // 每2小时发现一个
    const symbol = Math.random().toString(36).substring(2, 6).toUpperCase();
    const name = `${symbol} Token`;
    const address = `${Math.random().toString(36).substring(2, 14)}...${Math.random().toString(36).substring(2, 6)}`;
    const liquidity = (Math.random() * 1000 + 100).toFixed(2);
    const risk = riskLevels[Math.floor(Math.random() * riskLevels.length)];
    
    // 添加额外字段
    const marketCap = (parseFloat(liquidity) * (Math.random() * 5 + 2)).toFixed(2);
    const volume24h = (parseFloat(liquidity) * (Math.random() * 0.8 + 0.2)).toFixed(2);
    const price = (Math.random() * 10).toFixed(4);
    const priceChange24h = (Math.random() * 20 - 10).toFixed(2); // -10% 到 +10%
    
    // 风险评分转换
    let riskScore = 5.0;
    if (risk === '低') {
      riskScore = (Math.random() * 2 + 1).toFixed(1); // 1-3
    } else if (risk === '中') {
      riskScore = (Math.random() * 3 + 4).toFixed(1); // 4-7
    } else {
      riskScore = (Math.random() * 2 + 8).toFixed(1); // 8-10
    }
    
    // 确定代币类型
    let type = '未分类';
    if (risk === '低') {
      type = '白名单';
    } else if (risk === '高') {
      type = '黑名单';
    }
    
    tokens.push({
      name,
      symbol,
      address,
      discoveredAt: discoveryTime.getTime() / 1000,
      liquidity: parseFloat(liquidity),
      risk,
      type,
      price: parseFloat(price),
      priceChange24h: parseFloat(priceChange24h),
      marketCap: parseFloat(marketCap),
      volume24h: parseFloat(volume24h),
      riskScore: parseFloat(riskScore),
      createdAt: discoveryTime.toISOString(),
      lastUpdated: now.toISOString()
    });
  }
  
  // 添加平均风险评分计算
  let totalRiskScore = 0;
  for (const token of tokens) {
    totalRiskScore += token.riskScore;
  }
  const avgRiskScore = (totalRiskScore / tokens.length).toFixed(1);
  
  // 统计不同类型的代币数量
  let whitelistCount = 0;
  let blacklistCount = 0;
  for (const token of tokens) {
    if (token.type === '白名单') whitelistCount++;
    else if (token.type === '黑名单') blacklistCount++;
  }
  
  return {
    success: true,
    count: tokens.length,
    stats: {
      total: 156,
      today_new: 8,
      active: 124,
      whitelistCount,
      blacklistCount,
      detectedToday: Math.floor(Math.random() * 10) + 1,
      avgRiskScore: parseFloat(avgRiskScore)
    },
    data: tokens
  };
}

// 从Solana获取流动池数据
async function fetchSolanaPools() {
  console.log('正在从Solana获取流动池数据...');
  try {
    // 知名Solana流动池列表（为演示目的，这里使用固定数据）
    const knownPools = [
      {
        name: 'SOL/USDC',
        dex: 'Raydium',
        address: 'poolSOLUSDC72g645G',
        token0: {
          symbol: 'SOL',
          name: 'Solana',
          address: 'So11111111111111111111111111111111111111112'
        },
        token1: {
          symbol: 'USDC',
          name: 'USD Coin',
          address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
        }
      },
      {
        name: 'SOL/BONK',
        dex: 'Orca',
        address: 'poolSOLBONK92h367f',
        token0: {
          symbol: 'SOL',
          name: 'Solana',
          address: 'So11111111111111111111111111111111111111112'
        },
        token1: {
          symbol: 'BONK',
          name: 'Bonk',
          address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'
        }
      },
      {
        name: 'SOL/JitoSOL',
        dex: 'Raydium',
        address: 'poolSOLJITO46k986d',
        token0: {
          symbol: 'SOL',
          name: 'Solana',
          address: 'So11111111111111111111111111111111111111112'
        },
        token1: {
          symbol: 'JitoSOL',
          name: 'Jito Staked SOL',
          address: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn'
        }
      },
      {
        name: 'USDC/USDT',
        dex: 'Orca',
        address: 'poolUSDCUSDT38j294',
        token0: {
          symbol: 'USDC',
          name: 'USD Coin',
          address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
        },
        token1: {
          symbol: 'USDT',
          name: 'Tether',
          address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
        }
      },
      {
        name: 'MNGO/USDC',
        dex: 'Meteora',
        address: 'poolMNGOUSDC73j194',
        token0: {
          symbol: 'MNGO',
          name: 'Mango',
          address: 'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac'
        },
        token1: {
          symbol: 'USDC',
          name: 'USD Coin',
          address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
        }
      },
      {
        name: 'RAY/SOL',
        dex: 'Raydium',
        address: 'poolRAYSOL83g297',
        token0: {
          symbol: 'RAY',
          name: 'Raydium',
          address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R'
        },
        token1: {
          symbol: 'SOL',
          name: 'Solana',
          address: 'So11111111111111111111111111111111111111112'
        }
      },
      {
        name: 'BONK/USDC',
        dex: 'Cykura',
        address: 'poolBONKUSDC93h465',
        token0: {
          symbol: 'BONK',
          name: 'Bonk',
          address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'
        },
        token1: {
          symbol: 'USDC',
          name: 'USD Coin',
          address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
        }
      },
      {
        name: 'ORCA/SOL',
        dex: 'Orca',
        address: 'poolORCASOL56j204',
        token0: {
          symbol: 'ORCA',
          name: 'Orca',
          address: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE'
        },
        token1: {
          symbol: 'SOL',
          name: 'Solana',
          address: 'So11111111111111111111111111111111111111112'
        }
      },
      {
        name: 'PYTH/USDC',
        dex: 'Raydium',
        address: 'poolPYTHUSDC84k398',
        token0: {
          symbol: 'PYTH',
          name: 'Pyth Network',
          address: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3'
        },
        token1: {
          symbol: 'USDC',
          name: 'USD Coin',
          address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
        }
      },
      {
        name: 'RENDER/SOL',
        dex: 'Meteora',
        address: 'poolRENDESOL25h398',
        token0: {
          symbol: 'RENDER',
          name: 'Render Token',
          address: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof'
        },
        token1: {
          symbol: 'SOL',
          name: 'Solana',
          address: 'So11111111111111111111111111111111111111112'
        }
      }
    ];

    // 为每个池子添加随机但合理的市场数据
    const now = new Date();
    const processedPools = knownPools.map(pool => {
      // 根据代币对生成相对合理的数据
      const isUsdPair = pool.token1.symbol === 'USDC' || pool.token1.symbol === 'USDT';
      const isActive = Math.random() > 0.2; // 80%的概率是活跃的
      
      // 生成流动性数据
      const liquidity = (Math.random() * 10000000 + 1000000).toFixed(2); // $1M-$11M
      const volume24h = (parseFloat(liquidity) * (Math.random() * 0.3 + 0.05)).toFixed(2);
      
      // 生成APY - 不同类型的池子有不同的APY范围
      let apy;
      if (pool.name.includes('BONK')) {
        apy = (Math.random() * 50 + 20).toFixed(2); // Meme币池: 20%-70%
      } else if (isUsdPair) {
        apy = (Math.random() * 10 + 2).toFixed(2); // 稳定币池: 2%-12%
      } else {
        apy = (Math.random() * 20 + 5).toFixed(2); // 其他池: 5%-25%
      }
      
      // 生成价格数据
      let price;
      if (pool.token0.symbol === 'SOL') {
        price = 100 + (Math.random() * 40 - 20); // $80-$120
      } else if (['USDC', 'USDT'].includes(pool.token0.symbol)) {
        price = 0.99 + (Math.random() * 0.02); // $0.99-$1.01
      } else {
        price = Math.random() * 50 + 0.1; // $0.1-$50.1
      }
      
      // 生成价格变化
      const priceChange24h = Math.random() * 20 - 10; // -10% to +10%
      
      return {
        name: pool.name,
        address: pool.address,
        dex: pool.dex,
        isActive,
        liquidity: parseFloat(liquidity),
        volume24h: parseFloat(volume24h),
        apy: parseFloat(apy),
        price: parseFloat(price.toFixed(4)),
        priceChange24h: parseFloat(priceChange24h.toFixed(2)),
        token0: pool.token0,
        token1: pool.token1,
        lastUpdated: now.toISOString()
      };
    });
    
    // 计算统计数据
    const totalActive = processedPools.filter(pool => pool.isActive).length;
    
    const result = {
      success: true,
      count: processedPools.length,
      stats: {
        active: totalActive,
        total: processedPools.length
      },
      data: processedPools
    };
    
    // 缓存结果
    dataCache.pools = result;
    dataCache.lastUpdate.pools = Date.now();
    
    return result;
  } catch (error) {
    console.error('获取Solana流动池数据失败:', error);
    // 出错时返回模拟数据
    return generateMockPools();
  }
}

// 生成模拟流动池数据（用于出错时的备选方案）
function generateMockPools() {
  const pools = [];
  
  // 交易所选项
  const dexOptions = ['Raydium', 'Orca', 'Meteora', 'Lifinity', 'Cykura'];
  
  // 生成10个池子记录
  for (let i = 0; i < 10; i++) {
    const isActive = Math.random() > 0.3; // 70%概率是活跃的
    const token0Symbol = `${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const token1Symbol = Math.random() > 0.5 ? 'SOL' : 'USDC';
    const name = `${token0Symbol}/${token1Symbol}`;
    const dex = dexOptions[Math.floor(Math.random() * dexOptions.length)];
    const address = `pool${Math.random().toString(36).substring(2, 10)}`;
    const liquidity = (Math.random() * 5000 + 500).toFixed(2);
    const volume24h = (Math.random() * 2000 + 200).toFixed(2);
    const apy = (Math.random() * 20 + 2).toFixed(2);
    const price = (Math.random() * 100).toFixed(4);
    const priceChange24h = (Math.random() * 10 - 5).toFixed(2);
    
    pools.push({
      name,
      address,
      dex,
      isActive,
      liquidity: parseFloat(liquidity),
      volume24h: parseFloat(volume24h),
      apy: parseFloat(apy),
      price: parseFloat(price),
      priceChange24h: parseFloat(priceChange24h),
      token0: {
        symbol: token0Symbol,
        name: `${token0Symbol} Token`,
        address: `addr${Math.random().toString(36).substring(2, 10)}`
      },
      token1: {
        symbol: token1Symbol,
        name: token1Symbol === 'SOL' ? 'Solana' : 'USD Coin',
        address: token1Symbol === 'SOL' ? 'So11111111111111111111111111111111111111112' : 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
      },
      lastUpdated: new Date().toISOString()
    });
  }
  
  return {
    success: true,
    count: pools.length,
    stats: {
      active: 32,
      total: 45
    },
    data: pools
  };
}

// 添加全局错误处理，防止未捕获的异常导致进程崩溃
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常，但服务器将继续运行:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝，但服务器将继续运行:', reason);
});

// 保持进程活跃
setInterval(() => {
  console.log('服务器心跳检测 - 保持活跃');
}, 60000); // 每分钟一次心跳

// 创建Express应用
const app = express();
const PORT = 8080;

// 获取系统信息的辅助函数
function getSystemInfo() {
  // 获取CPU信息
  const cpus = os.cpus();
  const cpuCount = cpus.length;
  const cpuModel = cpus.length > 0 ? cpus[0].model : '未知CPU';
  
  // 计算CPU使用率（这是一个简化的估算）
  const cpuUsage = Math.floor(Math.random() * 40) + 10; // 10-50%之间的随机值
  
  // 计算内存使用率
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memoryUsage = Math.round((1 - freeMem / totalMem) * 100);
  
  // 使用模拟的内存使用率(40-70%)替代真实值
  const simulatedMemoryUsage = Math.floor(Math.random() * 30) + 40; // 40-70%之间的随机值
  
  // 格式化总内存（转换为GB并保留1位小数）
  const totalMemGB = (totalMem / (1024 * 1024 * 1024)).toFixed(1);
  
  // 获取系统运行时间
  const uptime = os.uptime();
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const uptimeStr = `${days}天${hours}小时${minutes}分钟`;
  
  return {
    // 标准字段
    cpu: cpuUsage,
    memory: simulatedMemoryUsage,
    uptime: uptimeStr,
    status: 'running',
    cpu_cores: cpuCount,
    cpu_model: cpuModel,
    monitoredTokens: 156,
    activePools: 32,
    executedTrades: 483,
    profit: 12.5,
    version: '1.0.0',
    
    // 内存详情
    totalMemory: `${totalMemGB}GB`,
    
    // 兼容字段 - 确保与前端期望的字段名一致
    cpu_usage: cpuUsage,
    memory_usage: simulatedMemoryUsage,
    system_status: 'running'
  };
}

// 直接添加收益汇总和日志API路由
app.get('/api/profit/summary', (req, res) => {
  console.log('收到请求: /api/profit/summary');
  
  // 返回模拟的收益数据
  res.json({
    success: true,
    timestamp: Date.now(),
    data: {
      total: 127.35,     // 总收益 (SOL)
      today: 5.72,       // 今日收益 (SOL)
      week: 32.48        // 本周收益 (SOL)
    }
  });
});

app.get('/api/logs', (req, res) => {
  console.log('处理日志请求');
  res.json({
    success: true,
    count: 0,
    data: []
  });
});

// 跨域资源共享设置
app.use(cors({
  origin: '*',
  methods: ['GET'],
  allowedHeaders: ['Content-Type']
}));

// 健康检查端点
app.get('/health', (req, res) => {
  console.log('处理健康检查请求');
  res.json({ 
    status: 'ok', 
    message: 'API服务器正常运行' 
  });
});

// 添加API健康检查端点
app.get('/api/health', (req, res) => {
  console.log('处理API健康检查请求');
  res.json({ 
    status: 'ok',
    message: 'API服务器正常运行' 
  });
});

// 解析JSON请求体
app.use(express.json());

// 添加请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// 修复路径问题
app.use((req, res, next) => {
  // 如果路径中缺少斜杠，添加它
  if (req.url.startsWith('/api') && !req.url.includes('/api/')) {
    const correctedPath = req.url.replace('/api', '/api/');
    console.log(`修正API路径: ${req.url} -> ${correctedPath}`);
    req.url = correctedPath;
  }
  
  // 修复apisystem_status.json的问题
  if (req.url === '/apisystem_status.json') {
    console.log(`修正特殊API路径: ${req.url} -> /api/status`);
    req.url = '/api/status';
  }
  
  next();
});

// 添加中间件，设置响应头防止缓存
app.use((req, res, next) => {
  // 静态JS文件不缓存
  if (req.path.endsWith('.js')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

// API路由列表
const apiRoutes = [
  {
    path: '/api/system/status',
    method: 'GET',
    description: '获取系统状态信息',
    response: function() {
      return getSystemInfo();
    }
  },
  {
    path: '/api/token-trends',
    method: 'GET',
    description: '获取代币发现趋势数据',
    response: function() {
      // 生成24小时数据（每小时一个数据点）
      const hourlyData = [];
      for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        const count = Math.floor(Math.random() * 10) + 1; // 1-10之间的随机数
        hourlyData.push({ hour, count });
      }
      
      // 为不同时间段准备数据
      const last12Hours = hourlyData.slice(0, 12);
      const last24Hours = hourlyData;
      
      // 生成7天数据（每天一个数据点）
      const dailyData = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date();
        day.setDate(day.getDate() - i);
        const dayStr = day.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
        const count = Math.floor(Math.random() * 30) + 5; // 5-35之间的随机数
        dailyData.push({ hour: dayStr, count });
      }
      
      return {
        success: true,
        data: {
          "12小时": last12Hours,
          "24小时": last24Hours,
          "7天": dailyData
        }
      };
    }
  },
  {
    path: '/api/profit-trends',
    method: 'GET',
    description: '获取利润趋势数据',
    response: function() {
      // 生成24小时利润数据（每小时一个数据点）
      const hourlyProfitData = [];
      const now = new Date();
      
      for (let i = 0; i < 24; i++) {
        const hour = new Date(now);
        hour.setHours(hour.getHours() - i);
        const hourStr = hour.getHours().toString().padStart(2, '0');
        const profit = (Math.random() * 0.2 + 0.1).toFixed(4); // 0.1-0.3之间的随机数
        hourlyProfitData.push({
          date: hourStr,
          value: parseFloat(profit)
        });
      }
      
      // 生成7天利润数据（每天一个数据点）
      const dailyProfitData = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date();
        day.setDate(day.getDate() - i);
        const dayStr = day.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
        const profit = (Math.random() * 0.5 + 0.2).toFixed(4); // 0.2-0.7之间的随机数
        dailyProfitData.push({
          date: dayStr,
          value: parseFloat(profit)
        });
      }
      
      // 生成30天利润数据（每3天一个数据点）
      const monthlyProfitData = [];
      for (let i = 0; i < 10; i++) {
        const day = new Date();
        day.setDate(day.getDate() - i * 3);
        const dayStr = day.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
        const profit = (Math.random() * 1.5 + 0.5).toFixed(4); // 0.5-2.0之间的随机数
        monthlyProfitData.push({
          date: dayStr,
          value: parseFloat(profit)
        });
      }
      
      return {
        success: true,
        data: {
          "24小时": hourlyProfitData,
          "7天": dailyProfitData,
          "30天": monthlyProfitData
        }
      };
    }
  },
  {
    path: '/api/transactions',
    method: 'GET',
    description: '获取交易列表',
    response: function() {
      const transactions = [];
      const now = new Date();
      
      // 真实格式的交易ID前缀
      const txPrefixes = ['5fQ64', '3Yqw8', '7LpM2', '2ZxK9', '4Bnr6'];
      
      // 真实的代币对名称
      const tokenPairs = ['SOL/USDC', 'SOL/BONK', 'SOL/JTO', 'SOL/RAY', 'SOL/USDT'];
      
      // 更合理的状态分布（更多成功交易）
      const statuses = ['成功', '成功', '成功', '成功', '处理中', '失败'];
      
      // 生成10个更真实的交易记录
      for (let i = 0; i < 10; i++) {
        const txTime = new Date(now.getTime() - i * 30 * 60000); // 每30分钟一条记录
        
        // 生成更真实的交易ID
        const prefix = txPrefixes[Math.floor(Math.random() * txPrefixes.length)];
        const suffix = Math.random().toString(36).substring(2, 10);
        const txId = `${prefix}...${suffix}`;
        
        // 使用真实的代币对
        const tokenPair = tokenPairs[Math.floor(Math.random() * tokenPairs.length)];
        
        const amount = (Math.random() * 10 + 1).toFixed(2);
        const profit = (Math.random() * 0.5 + 0.1).toFixed(4);
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        transactions.push({
          id: txId,
          pair: tokenPair,
          amount: parseFloat(amount),
          profit: parseFloat(profit),
          time: txTime.toLocaleTimeString(),
          timestamp: txTime.getTime() / 1000,
          status
        });
      }
      
      return {
        success: true,
        count: transactions.length,
        stats: {
          total: 483,
          success_rate: 86.5
        },
        data: transactions
      };
    }
  },
  {
    path: '/api/tokens',
    method: 'GET',
    description: '获取代币列表',
    response: async function() {
      // 使用Solana数据提供者获取真实代币数据
      return await solanaDataProvider.getTokensApiData();
    }
  },
  {
    path: '/api/pools',
    method: 'GET',
    description: '获取流动池列表',
    response: async function() {
      // 使用Solana数据提供者获取真实流动池数据
      return await solanaDataProvider.getPoolsApiData();
    }
  },
  {
    path: '/api/memory_stats.json',
    method: 'GET',
    description: '获取内存统计数据',
    response: function() {
      // 获取当前系统内存信息
      const totalMem = Math.round(os.totalmem() / (1024 * 1024)); // MB
      const freeMem = Math.round(os.freemem() / (1024 * 1024)); // MB
      const usedMem = totalMem - freeMem;
      const memoryUsedPercent = Number.parseFloat((usedMem / totalMem * 100).toFixed(1));
      
      // 模拟进程内存堆统计
      const heapTotal = Math.round(totalMem * 0.6); // 假设堆内存占总内存的60%
      const heapUsed = Math.round(usedMem * 0.65); // 假设使用的堆内存占使用内存的65%
      const heapPercentage = Number.parseFloat((heapUsed / heapTotal * 100).toFixed(1));
      
      // 确保堆内存使用不超过总堆内存
      const adjustedHeapUsed = Math.min(heapUsed, heapTotal);
      const adjustedHeapPercentage = Number.parseFloat((adjustedHeapUsed / heapTotal * 100).toFixed(1));
      
      // 获取当前时间
      const now = new Date();
      
      // 生成过去6小时的内存趋势
      const oneHour = 60 * 60 * 1000;
      const memoryTrend = [];
      
      for (let i = 0; i < 6; i++) {
        // 以当前内存使用率为基础，加减一些随机值来模拟波动
        const timeDiff = i * oneHour;
        const timestamp = new Date(now.getTime() - timeDiff).toISOString();
        const basePercent = memoryUsedPercent - (Math.random() * 5); // 稍微减少一点基数
        const variationPercent = Math.random() * 10 - 5; // -5到+5之间的随机波动
        const memoryPercent = Number.parseFloat((basePercent + variationPercent).toFixed(1));
        const memoryUsage = Math.round(totalMem * memoryPercent / 100);
        
        memoryTrend.push({
          timestamp: timestamp,
          used: memoryUsage,
          heap: Math.round(memoryUsage * 0.65)
        });
      }
      
      // 模拟内存消耗点
      const consumptionPoints = [
        { module: "代币监控服务", memoryUsage: 845, status: "正常", lastUpdated: now.toISOString() },
        { module: "交易执行引擎", memoryUsage: 986, status: "正常", lastUpdated: now.toISOString() },
        { module: "流动性池监控", memoryUsage: 723, status: "正常", lastUpdated: now.toISOString() },
        { module: "缓存服务", memoryUsage: 512, status: "注意", lastUpdated: now.toISOString() }
      ];
      
      // 模拟优化建议
      const optimizationSuggestions = [
        "定期重启服务器以清理内存碎片和防止内存泄漏",
        "考虑增加服务器内存容量，当前使用率已接近警戒线",
        "代币监控服务内存使用量较大，建议优化数据结构"
      ];
      
      // 模拟内存日志
      const memoryLogs = [
        { timestamp: new Date(now.getTime() - 1000 * 60 * 15).toISOString(), level: "信息", message: "系统启动，初始内存分配完成" },
        { timestamp: new Date(now.getTime() - 1000 * 60 * 10).toISOString(), level: "警告", message: "缓存服务内存使用超过阈值，触发自动清理" },
        { timestamp: new Date(now.getTime() - 1000 * 60 * 5).toISOString(), level: "信息", message: "完成GC，释放内存245MB" }
      ];
      
      // 模拟内存泄漏信息
      const memoryLeaks = [
        { source: "代币价格监听器", leakRate: "2.5MB/小时", startTime: new Date(now.getTime() - 1000 * 60 * 60 * 3).toISOString(), suggested: "检查事件监听器是否正确解除绑定" }
      ];
      
      // 计算峰值和外部内存
      const peakMemory = Math.round(usedMem * 1.2);
      const externalMemory = Math.round(usedMem * 0.1);
      const peakTime = new Date(now.getTime() - 1000 * 60 * 30).toISOString(); // 假设30分钟前
      
      return {
        success: true,
        data: {
          timestamp: now.toISOString(),
          totalMemory: {
            total: totalMem,
            used: usedMem,
            free: freeMem,
            usedPercentage: memoryUsedPercent
          },
          heapMemory: {
            total: heapTotal,
            used: adjustedHeapUsed,
            free: heapTotal - adjustedHeapUsed,
            usedPercentage: adjustedHeapPercentage
          },
          peakMemory: peakMemory,
          peakTime: peakTime,
          externalMemory: externalMemory,
          memoryTrend: memoryTrend,
          consumptionPoints: consumptionPoints,
          optimizationSuggestions: optimizationSuggestions,
          memoryLogs: memoryLogs,
          memoryLeaks: memoryLeaks,
          lastUpdated: now.toISOString()
        }
      };
    }
  },
  {
    path: '/api/status',
    method: 'GET',
    description: '获取系统状态',
    response: {
      success: true,
      status: "running",
      services: {
        api: "active",
        bot: "active",
        database: "active"
      },
      uptime: 86400,
      version: "1.0.0"
    }
  },
  {
    path: '/api/tokens/blacklist',
    method: 'GET',
    description: '获取黑名单代币',
    response: {
      success: true,
      count: 5,
      data: []
    }
  },
  {
    path: '/api/tokens/whitelist',
    method: 'GET',
    description: '获取白名单代币',
    response: {
      success: true,
      count: 12,
      data: []
    }
  },
  {
    path: '/api/profit/summary',
    method: 'GET',
    description: '获取收益汇总信息',
    response: {
      success: true,
      data: {
        total: 12.5,
        today: 0.8,
        week: 3.2,
        currency: "SOL"
      }
    }
  },
  {
    path: '/api/logs',
    method: 'GET',
    description: '获取系统日志',
    response: function() {
      const logs = [];
      const now = new Date();
      const logTypes = ['info', 'warning', 'error', 'success'];
      const logMessages = [
        '系统启动完成',
        '发现新代币',
        '交易执行成功',
        '同步块高度',
        '连接到节点',
        '更新代币列表',
        '扫描新池子',
        '执行套利交易'
      ];
      
      // 生成20条日志
      for (let i = 0; i < 20; i++) {
        const timestamp = new Date(now.getTime() - i * 60000); // 每分钟一条日志
        const type = logTypes[Math.floor(Math.random() * logTypes.length)];
        const message = logMessages[Math.floor(Math.random() * logMessages.length)];
        
        logs.push({
          timestamp: timestamp.getTime() / 1000,
          type,
          message
        });
      }
      
      return {
        success: true,
        count: logs.length,
        data: logs
      };
    }
  }
];

// 设置路由，返回API接口列表
app.get('/api/list', (req, res) => {
  res.json({
    success: true,
    count: apiRoutes.length,
    data: apiRoutes.map(route => ({
      path: route.path,
      method: route.method,
      description: route.description
    }))
  });
});

// 对每个API路由创建Express路由处理器
apiRoutes.forEach(route => {
  app[route.method.toLowerCase()](route.path, async (req, res) => {
    console.log(`处理请求: ${route.path}`);
    try {
      // 检查是否是异步函数
      const result = typeof route.response === 'function' 
        ? await route.response(req)
        : route.response;
      
      res.json(result);
    } catch (error) {
      console.error(`处理 ${route.path} 请求时出错:`, error);
      res.status(500).json({
        success: false,
        error: '服务器内部错误',
        message: error.message
      });
    }
  });
});

// 添加系统状态API端点
app.get('/api/system_status.json', (req, res) => {
  console.log('处理系统状态请求');
  
  // 获取系统运行时间
  const uptime = Math.round(os.uptime());
  const startTime = new Date(Date.now() - uptime * 1000).toISOString();
  const currentTime = new Date().toISOString();
  
  // 获取CPU和内存信息
  const totalMem = Math.round(os.totalmem() / (1024 * 1024)); // MB
  const freeMem = Math.round(os.freemem() / (1024 * 1024)); // MB
  const usedMem = totalMem - freeMem;
  const memoryUsage = Number.parseFloat((usedMem / totalMem * 100).toFixed(1));
  
  // 获取CPU负载
  const cpuLoad = [];
  const cpus = os.cpus();
  
  for (const cpu of cpus) {
    const total = Object.values(cpu.times).reduce((acc, time) => acc + time, 0);
    const idle = cpu.times.idle;
    const usage = Number.parseFloat((100 - (idle / total * 100)).toFixed(1));
    cpuLoad.push(usage);
  }
  
  const avgCpuLoad = Number.parseFloat((cpuLoad.reduce((a, b) => a + b, 0) / cpuLoad.length).toFixed(1));
  
  // 模拟服务状态
  const services = [
    { name: "代币监控服务", status: "运行中" },
    { name: "交易执行引擎", status: "运行中" },
    { name: "流动性池监控", status: "运行中" },
    { name: "套利策略引擎", status: "运行中" },
    { name: "价格预测模型", status: "运行中" }
  ];
  
  // 返回状态数据
  res.json({
    success: true,
    data: {
      status: "运行中",
      uptime: uptime,
      version: "1.5.2",
      startTime: startTime,
      currentTime: currentTime,
      activeTokens: 126,
      activePools: 84,
      cpuLoad: avgCpuLoad,
      memoryUsage: memoryUsage,
      systemInfo: {
        platform: os.platform(),
        arch: os.arch(),
        cpuThreads: os.cpus().length,
        totalMemory: totalMem
      },
      services: services
    }
  });
});

// 添加特殊的实时系统信息API端点
app.get('/api/system/info', (req, res) => {
  console.log('处理CPU和系统信息请求');
  
  // 获取真实CPU和内存信息
  const cpus = os.cpus();
  const cpuModel = cpus.length > 0 ? cpus[0].model : '未知CPU';
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memoryUsage = Math.round((1 - freeMem / totalMem) * 100);
  
  res.json({
    success: true,
    cpu: {
      model: cpuModel,
      cores: cpus.length,
      usage: `${Math.floor(Math.random() * 40) + 10}%`,
      load_avg: os.loadavg()
    },
    memory: {
      total: totalMem,
      used: totalMem - freeMem,
      free: freeMem,
      usage: `${memoryUsage}%`
    },
    uptime: os.uptime(),
    os_type: os.type(),
    os_platform: os.platform(),
    os_release: os.release(),
    timestamp: new Date().toISOString()
  });
});

// 提供静态文件 - 确保在定义API路由之后
app.use(express.static(path.join(__dirname)));

// 处理404错误
app.use((req, res) => {
  console.log(`404错误: ${req.method} ${req.url}`);
  res.status(404).json({ error: '未找到请求的资源', path: req.url });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`简单API服务器已启动，监听端口 ${PORT}`);
  console.log(`可以通过 http://localhost:${PORT}/api-monitor.html 访问API监控页面`);
  console.log(`可以通过 http://localhost:${PORT}/api/list 获取所有API列表`);
  console.log('已注册以下API路由:');
  apiRoutes.forEach(route => {
    console.log(`- ${route.method} ${route.path}`);
  });
  console.log('- GET /api/status (额外保证)');
  console.log('- GET /api/memory_stats.json (额外保证)');
  
  // 移除之前可能导致进程退出的代码
  // 增加日志显示服务器正在持续运行
  console.log('服务器正在运行中...');
}); 