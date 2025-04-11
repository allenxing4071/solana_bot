/**
 * 简易API服务器启动脚本
 * 用于启动一个简单的Express服务器，提供静态文件和API接口
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const v8 = require('v8');
const fs = require('fs');
const dotenv = require('dotenv');

// 创建应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(cors());

// 添加请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(express.static('public'));

// 路由 - 健康检查
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 路由 - 系统状态
app.get('/api/system/status', (_req, res) => {
  try {
    // 获取内存使用情况
    const memoryUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryPercentage = ((totalMem - freeMem) / totalMem) * 100;
    
    // 获取CPU使用情况
    const cpuUsage = os.loadavg()[0] * 10; // 转换为百分比
    
    // 获取系统运行时间
    const uptime = process.uptime();
    
    // 获取应用状态
    const isRunning = uptime > 10;
    
    // 获取内存历史数据（模拟）
    const memoryHistory = generateMemoryHistory();
    
    // 返回系统状态数据
    return res.json({
      success: true,
      data: {
        status: isRunning ? 'running' : 'stopped',
        cpu: Math.min(100, cpuUsage),
        memory: memoryPercentage,
        uptime: uptime,
        profit: Math.random() * 0.5,
        activePools: Math.floor(Math.random() * 100),
        monitoredTokens: Math.floor(Math.random() * 50),
        executedTrades: Math.floor(Math.random() * 20),
        memoryDetails: {
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external,
          arrayBuffers: memoryUsage.arrayBuffers || 0,
          rss: memoryUsage.rss
        },
        memoryHistory: memoryHistory,
        v8Stats: {
          heapSizeLimit: v8.getHeapStatistics().heap_size_limit,
          totalHeapSize: v8.getHeapStatistics().total_heap_size,
          usedHeapSize: v8.getHeapStatistics().used_heap_size
        },
        optimization: {
          cleanupCount: Math.floor(Math.random() * 10),
          gcCount: Math.floor(Math.random() * 15),
          memoryFreed: Math.floor(Math.random() * 1000) * 1024 * 1024,
          leakWarnings: Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0,
          lastOptimization: Date.now() - Math.random() * 3600000
        },
        consumers: generateMockConsumers()
      }
    });
  } catch (error) {
    console.error('获取系统状态失败', error);
    return res.status(500).json({
      success: false,
      error: '获取系统状态失败'
    });
  }
});

// 路由 - 启动系统
app.post('/api/system/start', (_req, res) => {
  console.log('通过API触发系统启动');
  
  return res.json({
    success: true,
    message: '系统启动指令已发送'
  });
});

// 路由 - 停止系统
app.post('/api/system/stop', (_req, res) => {
  console.log('通过API触发系统停止');
  
  return res.json({
    success: true,
    message: '系统停止指令已发送'
  });
});

// 路由 - 优化内存
app.post('/api/system/optimize-memory', (_req, res) => {
  console.log('通过API触发内存优化');
  
  // 强制执行垃圾回收
  if (global.gc) {
    global.gc();
    console.log('手动触发垃圾回收完成');
  }
  
  return res.json({
    success: true,
    message: '内存优化已执行'
  });
});

// 添加代币API路由
app.get('/api/tokens/whitelist', (_req, res) => {
  // 返回模拟白名单代币数据
  return res.json({
    success: true,
    data: generateMockTokens(10, 'whitelist')
  });
});

app.get('/api/tokens/blacklist', (_req, res) => {
  // 返回模拟黑名单代币数据
  return res.json({
    success: true,
    data: generateMockTokens(8, 'blacklist')
  });
});

app.get('/api/tokens/monitored', (_req, res) => {
  // 返回模拟监控代币数据
  return res.json({
    success: true,
    data: generateMockTokens(15, 'monitored')
  });
});

app.get('/api/tokens/:mint', (req, res) => {
  // 返回特定代币的详细信息
  const mint = req.params.mint;
  const tokenType = Math.random() > 0.7 ? 'whitelist' : Math.random() > 0.5 ? 'blacklist' : 'monitored';
  
  return res.json({
    success: true,
    data: generateMockToken(mint, tokenType)
  });
});

// 添加交易API路由
app.get('/api/transactions', (_req, res) => {
  return res.json({
    success: true,
    data: generateMockTransactions(20)
  });
});

app.get('/api/transactions/:id', (req, res) => {
  const id = req.params.id;
  return res.json({
    success: true,
    data: {
      id: id,
      hash: id,
      status: Math.random() > 0.8 ? 'failed' : Math.random() > 0.2 ? 'success' : 'pending',
      amount: (Math.random() * 100).toFixed(2),
      pair: ['SOL/USDC', 'JUP/SOL', 'BONK/SOL', 'RAY/SOL'][Math.floor(Math.random() * 4)],
      profit: (Math.random() * 0.01).toFixed(4),
      timestamp: Date.now() - Math.floor(Math.random() * 3600000)
    }
  });
});

// 添加池API路由
app.get('/api/pools', (_req, res) => {
  return res.json({
    success: true,
    data: generateMockPools(25)
  });
});

// 路由 - 主页
app.get('/', (_req, res) => {
  console.log('访问主页');
  try {
    res.sendFile(path.resolve(__dirname, 'public/index.html'));
  } catch (error) {
    console.error('加载主页失败', error);
    res.status(500).send('加载主页失败');
  }
});

// 路由 - 内存监控页面
app.get('/memory.html', (_req, res) => {
  console.log('访问内存监控页面');
  try {
    res.sendFile(path.resolve(__dirname, 'public/memory.html'));
  } catch (error) {
    console.error('加载内存监控页面失败', error);
    res.status(500).send('加载内存监控页面失败');
  }
});

// 设置路由 - 保存设置
app.post('/api/settings', (req, res) => {
  console.log('接收到保存设置请求:', req.body);
  try {
    const settings = req.body;
    
    // 获取环境变量文件路径
    const envPath = path.resolve(process.cwd(), '.env');
    
    // 读取当前的.env文件
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // 更新RPC相关的设置
    if (settings.primaryRpc) {
      envContent = updateEnvVariable(envContent, 'SOLANA_RPC_URL', settings.primaryRpc);
    }
    
    if (settings.backupRpc) {
      envContent = updateEnvVariable(envContent, 'BACKUP_RPC_ENDPOINTS', settings.backupRpc);
    }
    
    if (settings.wsEndpoint) {
      envContent = updateEnvVariable(envContent, 'SOLANA_WS_URL', settings.wsEndpoint);
    }
    
    // 保存更新后的.env文件
    fs.writeFileSync(envPath, envContent);
    
    console.log('设置已保存');
    res.json({ success: true, message: '设置已保存' });
  } catch (error) {
    console.error('保存设置失败:', error);
    res.status(500).json({ success: false, message: '保存设置失败: ' + error.message });
  }
});

// 设置路由 - 应用设置
app.post('/api/settings/apply', (req, res) => {
  console.log('接收到应用设置请求:', req.body);
  try {
    const settings = req.body;
    
    // 重新加载环境变量
    dotenv.config({
      path: path.resolve(process.cwd(), '.env'),
      override: true
    });
    
    console.log('设置已应用, 需要重启服务器来生效');
    res.json({ 
      success: true, 
      message: '设置已应用，但需要重启服务器来完全生效',
      needRestart: true
    });
  } catch (error) {
    console.error('应用设置失败:', error);
    res.status(500).json({ success: false, message: '应用设置失败: ' + error.message });
  }
});

// 设置路由 - 获取当前设置
app.get('/api/settings', (_req, res) => {
  try {
    // 设置响应类型为JSON
    res.setHeader('Content-Type', 'application/json');
    
    // 获取环境变量中的设置
    const settings = {
      primaryRpc: process.env.SOLANA_RPC_URL || '',
      backupRpc: process.env.BACKUP_RPC_ENDPOINTS || '',
      wsEndpoint: process.env.SOLANA_WS_URL || '',
      connectionTimeout: process.env.TX_CONFIRM_TIMEOUT || '60000',
      useJitoRelay: process.env.USE_JITO_RELAY === 'true',
      jitoRelayUrl: process.env.JITO_RELAY_URL || '',
      // 其他设置...
    };
    
    res.json(settings);
  } catch (error) {
    console.error('获取设置失败:', error);
    // 确保错误响应也是JSON格式
    res.status(500).json({ success: false, message: `获取设置失败: ${error.message}` });
  }
});

/**
 * 更新环境变量
 * @param {string} content .env文件内容
 * @param {string} key 变量名
 * @param {string} value 变量值
 * @returns {string} 更新后的内容
 */
function updateEnvVariable(content, key, value) {
  // 检查变量是否存在
  const regex = new RegExp(`^${key}=.*`, 'm');
  
  if (regex.test(content)) {
    // 如果变量存在，则替换其值
    return content.replace(regex, `${key}=${value}`);
  } else {
    // 如果变量不存在，则添加到文件末尾
    return content + `\n${key}=${value}`;
  }
}

// 处理404错误
app.use((_req, res) => {
  console.log('404 - 页面未找到');
  res.status(404).send('页面未找到');
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`API服务器已启动，监听端口 ${PORT}`);
});

// 辅助函数 - 生成内存历史数据
function generateMemoryHistory() {
  const history = [];
  const now = Date.now();
  
  // 生成过去20分钟的内存使用记录，每分钟一条
  for (let i = 19; i >= 0; i--) {
    const time = now - (i * 60 * 1000);
    const memValue = 40 + Math.random() * 30; // 随机内存使用率40%-70%
    
    history.push({
      time: time,
      value: memValue
    });
  }
  
  return history;
}

// 辅助函数 - 生成模拟内存消耗点
function generateMockConsumers() {
  const consumers = [
    { 
      name: '价格缓存', 
      priority: 1, 
      lastCleanup: Date.now() - Math.random() * 3600000,
      freed: Math.random() * 100 * 1024 * 1024,
      memoryUsage: 30 + Math.random() * 40,
      status: '正常'
    },
    { 
      name: 'RPC连接池', 
      priority: 3, 
      lastCleanup: Date.now() - Math.random() * 7200000,
      freed: Math.random() * 50 * 1024 * 1024,
      memoryUsage: 20 + Math.random() * 30,
      status: '正常'
    },
    { 
      name: '交易机会队列', 
      priority: 2, 
      lastCleanup: Date.now() - Math.random() * 1800000,
      freed: Math.random() * 150 * 1024 * 1024,
      memoryUsage: 40 + Math.random() * 50,
      status: Math.random() > 0.7 ? '需要优化' : '正常'
    }
  ];
  
  // 随机添加一个内存泄漏的组件
  if (Math.random() > 0.7) {
    consumers.push({ 
      name: '订阅管理器', 
      priority: 4, 
      lastCleanup: null,
      freed: 0,
      memoryUsage: 85 + Math.random() * 10,
      status: '可能存在泄漏'
    });
  }
  
  return consumers;
}

// 生成模拟代币数据
function generateMockTokens(count, type) {
  const tokens = [];
  const symbols = ['SOL', 'JUP', 'BONK', 'RAY', 'SAMO', 'ORCA', 'MNGO', 'SRM', 'FTT', 'MSOL', 'STSOL', 'JSOL'];
  const prefixes = ['Super', 'Mega', 'Hyper', 'Ultra', 'Quantum', 'Cosmic', 'Atomic', 'Solar', 'Lunar', 'Stellar'];
  const suffixes = ['Coin', 'Token', 'Cash', 'Money', 'Finance', 'Capital', 'Swap', 'Exchange', 'Protocol', 'Network'];
  
  for (let i = 0; i < count; i++) {
    const randomSymbol = i < symbols.length 
      ? symbols[i] 
      : prefixes[Math.floor(Math.random() * prefixes.length)].substring(0, 1) + 
        suffixes[Math.floor(Math.random() * suffixes.length)].substring(0, 1) + 
        Math.floor(Math.random() * 1000);
    
    const randomName = i < symbols.length 
      ? symbols[i] + ' Token'
      : prefixes[Math.floor(Math.random() * prefixes.length)] + ' ' + 
        suffixes[Math.floor(Math.random() * suffixes.length)];
    
    // 生成随机地址
    const mint = 'Sol' + [...Array(15)].map(() => Math.floor(Math.random() * 16).toString(16)).join('') + 
                 '...' + [...Array(4)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    
    tokens.push({
      mint: mint,
      symbol: randomSymbol,
      name: randomName,
      type: type,
      riskScore: type === 'blacklist' ? 7 + Math.random() * 3 : type === 'whitelist' ? Math.random() * 3 : 3 + Math.random() * 4,
      price: Math.random() * (type === 'blacklist' ? 0.001 : 10),
      firstDetectedAt: new Date(Date.now() - Math.random() * 7 * 24 * 3600 * 1000).toISOString(),
      liquidity: Math.floor(Math.random() * 100000) * (type === 'blacklist' ? 10 : 100),
      volume: Math.floor(Math.random() * 20000) * (type === 'blacklist' ? 5 : 100)
    });
  }
  
  return tokens;
}

// 生成单个模拟代币
function generateMockToken(mint, type) {
  const prefixes = ['Super', 'Mega', 'Hyper', 'Ultra', 'Quantum', 'Cosmic', 'Atomic', 'Solar', 'Lunar', 'Stellar'];
  const suffixes = ['Coin', 'Token', 'Cash', 'Money', 'Finance', 'Capital', 'Swap', 'Exchange', 'Protocol', 'Network'];
  
  const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  const randomName = randomPrefix + ' ' + randomSuffix;
  const randomSymbol = randomPrefix.substring(0, 1) + randomSuffix.substring(0, 1) + Math.floor(Math.random() * 100);
  
  return {
    mint: mint,
    symbol: randomSymbol,
    name: randomName,
    type: type,
    riskScore: type === 'blacklist' ? 7 + Math.random() * 3 : type === 'whitelist' ? Math.random() * 3 : 3 + Math.random() * 4,
    price: Math.random() * (type === 'blacklist' ? 0.001 : 10),
    firstDetectedAt: new Date(Date.now() - Math.random() * 7 * 24 * 3600 * 1000).toISOString(),
    liquidity: Math.floor(Math.random() * 100000) * (type === 'blacklist' ? 10 : 100),
    volume: Math.floor(Math.random() * 20000) * (type === 'blacklist' ? 5 : 100),
    metadata: {
      image: `https://placehold.co/200x200/5E35B1/FFFFFF?text=${randomSymbol}`,
      description: `${randomName}是一种基于Solana区块链的${type === 'blacklist' ? '高风险' : '创新'}代币，致力于${type === 'blacklist' ? '获取短期收益' : '长期价值创造'}。`
    },
    reason: type === 'blacklist' ? '疑似rug pull风险，流动性不足，合约可疑' : undefined
  };
}

// 生成模拟交易数据
function generateMockTransactions(count) {
  const transactions = [];
  const pairs = ['SOL/USDC', 'JUP/SOL', 'BONK/SOL', 'RAY/SOL', 'SAMO/USDC', 'ORCA/SOL', 'MNGO/USDC'];
  
  for (let i = 0; i < count; i++) {
    const status = Math.random() > 0.8 ? 'failed' : Math.random() > 0.2 ? 'success' : 'pending';
    const profit = status === 'success' ? (Math.random() * 0.01).toFixed(4) : '0.0000';
    
    transactions.push({
      id: 'Tx' + [...Array(4)].map(() => Math.floor(Math.random() * 16).toString(16)).join('') + 
          '...' + [...Array(4)].map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      pair: pairs[Math.floor(Math.random() * pairs.length)],
      amount: (Math.random() * 1000).toFixed(1),
      profit: profit,
      time: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toLocaleTimeString(),
      status: status
    });
  }
  
  return transactions;
}

// 生成模拟池数据
function generateMockPools(count) {
  const pools = [];
  const tokens = ['SOL', 'USDC', 'JUP', 'BONK', 'RAY', 'SAMO', 'ORCA', 'MNGO', 'SRM', 'FTT'];
  
  for (let i = 0; i < count; i++) {
    const token1 = tokens[Math.floor(Math.random() * tokens.length)];
    let token2;
    do {
      token2 = tokens[Math.floor(Math.random() * tokens.length)];
    } while (token2 === token1);
    
    const isActive = Math.random() > 0.2;
    
    pools.push({
      id: 'Pool' + [...Array(6)].map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      name: `${token1}/${token2}`,
      token1: token1,
      token2: token2,
      liquidity: Math.floor(Math.random() * 1000000),
      volume24h: Math.floor(Math.random() * 200000),
      fee: (Math.random() * 0.5).toFixed(2),
      isActive: isActive,
      lastActivity: isActive ? new Date(Date.now() - Math.random() * 3600000).toISOString() : new Date(Date.now() - Math.random() * 7 * 24 * 3600000).toISOString()
    });
  }
  
  return pools;
} 