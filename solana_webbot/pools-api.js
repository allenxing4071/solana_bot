/**
 * Solana MEV机器人 - 流动性池API服务
 * 提供流动性池相关的API接口，供前端调用
 * 
 * 版本: v1.0.0 - 2023年4月13日创建
 */

// 引入依赖
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const os = require('os');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 8090;

// 启用CORS
app.use(cors());

// 请求日志中间件
app.use(morgan('dev'));

// JSON解析中间件
app.use(express.json());

// 静态文件服务
app.use(express.static(path.join(__dirname, '.')));

// API路径修正中间件
app.use((req, res, next) => {
  // 修正API路径，处理掉误写的情况
  if (req.path.includes('apisystem_status.json')) {
    req.url = req.url.replace('apisystem_status.json', 'api/system_status.json');
  } else if (req.path.includes('apipools')) {
    req.url = req.url.replace('apipools', 'api/pools');
  }
  next();
});

// 服务器启动时间
const startTime = Date.now();

// 模拟数据 - 在实际项目中应从数据库或其他服务获取
const mockPoolsData = generateMockPoolsData();
const mockExchanges = ['Raydium', 'Orca', 'Jupiter', 'Meteora', 'Saber'];

// 健康检查接口
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// API健康检查接口
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000)
  });
});

// 系统状态接口
app.get('/api/system_status.json', (req, res) => {
  // 模拟系统状态信息
  const systemStatus = {
    success: true,
    data: {
      status: 'running', // running or stopped
      uptime: Math.floor((Date.now() - startTime) / 1000),
      currentTime: new Date().toISOString(),
      system: {
        totalMemory: os.totalmem() / (1024 * 1024 * 1024), // GB
        freeMemory: os.freemem() / (1024 * 1024 * 1024), // GB
        cpuLoad: os.loadavg(),
        hostname: os.hostname(),
        platform: os.platform(),
        release: os.release()
      },
      services: {
        api: 'running',
        monitoring: 'running',
        trading: 'running',
        database: 'running'
      }
    }
  };

  res.json(systemStatus);
});

// 获取池子列表接口
app.get('/api/pools/list', (req, res) => {
  // 模拟延迟，模拟网络延迟
  setTimeout(() => {
    res.json({
      success: true,
      data: {
        pools: mockPoolsData,
        stats: {
          totalPools: mockPoolsData.length,
          totalValue: mockPoolsData.reduce((sum, pool) => sum + pool.liquidity, 0),
          avgVolume: mockPoolsData.reduce((sum, pool) => sum + pool.volume24h, 0) / mockPoolsData.length,
          mostActiveDex: getMostActiveDex(mockPoolsData)
        },
        exchanges: mockExchanges
      }
    });
  }, 300);
});

// 获取池子详情接口
app.get('/api/pools/detail/:poolId', (req, res) => {
  const { poolId } = req.params;
  
  // 查找匹配的池子
  const pool = mockPoolsData.find(p => p.id === poolId);
  
  if (!pool) {
    return res.status(404).json({
      success: false,
      message: `找不到ID为 ${poolId} 的流动性池`
    });
  }
  
  // 添加更多详细信息
  const detailedPool = {
    ...pool,
    lastUpdated: new Date().toISOString(),
    swapFee: (Math.random() * 0.5).toFixed(2),
    totalTrades24h: Math.floor(Math.random() * 1000),
    averageTradeSize: Math.floor(Math.random() * 1000),
    createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    recentTrades: generateMockTrades(pool.id),
    description: `${pool.name} 是一个由 ${pool.dex} 提供的流动性池，包含 ${pool.token0.symbol} 和 ${pool.token1.symbol} 代币对。`
  };
  
  res.json({
    success: true,
    data: detailedPool
  });
});

// 系统启动接口
app.post('/api/system/start', (req, res) => {
  // 模拟系统启动操作
  console.log('系统启动请求已接收');
  
  // 在实际项目中，这里应该调用实际的启动逻辑
  
  res.json({
    success: true,
    message: '系统已成功启动',
    timestamp: new Date().toISOString()
  });
});

// 系统停止接口
app.post('/api/system/stop', (req, res) => {
  // 模拟系统停止操作
  console.log('系统停止请求已接收');
  
  // 在实际项目中，这里应该调用实际的停止逻辑
  
  res.json({
    success: true,
    message: '系统已成功停止',
    timestamp: new Date().toISOString()
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `请求的API路径不存在: ${req.path}`
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`流动性池API服务器已启动，监听端口: ${PORT}`);
  console.log(`流动性池API地址: http://localhost:${PORT}/api/pools/list`);
  console.log(`系统状态API地址: http://localhost:${PORT}/api/system_status.json`);
});

/**
 * 生成模拟流动性池数据
 * @returns {Array} 模拟的流动性池数据数组
 */
function generateMockPoolsData() {
  const pools = [];
  const dexs = ['Raydium', 'Orca', 'Jupiter', 'Meteora', 'Saber'];
  const tokens = [
    { symbol: 'SOL', name: 'Solana', address: '11111111111111111111111111111111' },
    { symbol: 'USDC', name: 'USD Coin', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
    { symbol: 'USDT', name: 'Tether', address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB' },
    { symbol: 'ETH', name: 'Ethereum (Wormhole)', address: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs' },
    { symbol: 'BTC', name: 'Bitcoin (Wormhole)', address: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E' },
    { symbol: 'mSOL', name: 'Marinade Staked SOL', address: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So' },
    { symbol: 'BONK', name: 'Bonk', address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' },
    { symbol: 'RAY', name: 'Raydium', address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R' },
    { symbol: 'ORCA', name: 'Orca', address: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE' },
    { symbol: 'SRM', name: 'Serum', address: 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt' }
  ];
  
  // 生成50个流动性池
  for (let i = 0; i < 50; i++) {
    const dex = dexs[Math.floor(Math.random() * dexs.length)];
    
    // 随机选择两个不同的代币
    let token0Index = Math.floor(Math.random() * tokens.length);
    let token1Index;
    do {
      token1Index = Math.floor(Math.random() * tokens.length);
    } while (token1Index === token0Index);
    
    const token0 = tokens[token0Index];
    const token1 = tokens[token1Index];
    
    // 生成随机值
    const liquidity = Math.random() * 10000000 + 100000;
    const volume24h = Math.random() * liquidity * 0.2;
    const apy = Math.random() * 100;
    const price = token0.symbol === 'BONK' ? Math.random() * 0.00001 : Math.random() * 1000 + 1;
    const priceChange24h = (Math.random() * 20) - 10; // -10% 到 +10%
    
    // 创建池子对象
    const pool = {
      id: `pool_${i}_${Math.random().toString(36).substring(2, 10)}`,
      name: `${token0.symbol}-${token1.symbol}`,
      dex,
      liquidity,
      volume24h,
      apy,
      price,
      priceChange24h,
      token0: { ...token0 },
      token1: { ...token1 }
    };
    
    pools.push(pool);
  }
  
  return pools;
}

/**
 * 获取最活跃的交易所
 * @param {Array} pools 池子数组
 * @returns {string} 最活跃交易所名称
 */
function getMostActiveDex(pools) {
  const dexVolumes = {};
  
  // 计算每个交易所的总交易量
  for (const pool of pools) {
    if (!dexVolumes[pool.dex]) {
      dexVolumes[pool.dex] = 0;
    }
    dexVolumes[pool.dex] += pool.volume24h;
  }
  
  // 找出交易量最大的交易所
  let maxVolume = 0;
  let mostActiveDex = '';
  
  for (const [dex, volume] of Object.entries(dexVolumes)) {
    if (volume > maxVolume) {
      maxVolume = volume;
      mostActiveDex = dex;
    }
  }
  
  return mostActiveDex;
}

/**
 * 生成模拟交易数据
 * @param {string} poolId 池子ID
 * @returns {Array} 模拟交易数组
 */
function generateMockTrades(poolId) {
  const trades = [];
  const types = ['buy', 'sell'];
  
  // 生成5个随机交易
  for (let i = 0; i < 5; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const amount = Math.random() * 1000 + 10;
    const price = Math.random() * 100 + 1;
    
    // 交易时间从现在到24小时前
    const timestamp = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString();
    
    trades.push({
      id: `trade_${Math.random().toString(36).substring(2, 10)}`,
      poolId,
      type,
      amount,
      price,
      value: amount * price,
      timestamp,
      txHash: `${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`
    });
  }
  
  // 按时间排序，最新的在前
  return trades.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
} 