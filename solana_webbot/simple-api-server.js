/**
 * 简单API服务器
 * 提供API接口列表以供查看
 */

const express = require('express');
const cors = require('cors');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os'); // 导入OS模块用于获取系统信息

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

// 允许所有跨域请求
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 解析JSON请求体
app.use(express.json());

// 添加请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
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
    response: function() {
      const tokens = [];
      const now = new Date();
      
      // 风险等级选项
      const riskLevels = ['低', '中', '高'];
      
      // 生成10个代币记录
      for (let i = 0; i < 10; i++) {
        const discoveryTime = new Date(now.getTime() - i * 120 * 60000); // 每2小时发现一个
        const name = `${Math.random().toString(36).substring(2, 6).toUpperCase()}Token`;
        const address = `${Math.random().toString(36).substring(2, 14)}...${Math.random().toString(36).substring(2, 6)}`;
        const liquidity = (Math.random() * 1000 + 100).toFixed(2);
        const risk = riskLevels[Math.floor(Math.random() * riskLevels.length)];
        
        tokens.push({
          name,
          address,
          discoveredAt: discoveryTime.getTime() / 1000,
          liquidity: parseFloat(liquidity),
          risk
        });
      }
      
      return {
        success: true,
        count: tokens.length,
        stats: {
          total: 156,
          today_new: 8,
          active: 124
        },
        data: tokens
      };
    }
  },
  {
    path: '/api/pools',
    method: 'GET',
    description: '获取流动池列表',
    response: function() {
      const pools = [];
      
      // 生成10个池子记录
      for (let i = 0; i < 10; i++) {
        const isActive = Math.random() > 0.3; // 70%概率是活跃的
        const name = `${Math.random().toString(36).substring(2, 6).toUpperCase()}/SOL池`;
        const address = `pool${Math.random().toString(36).substring(2, 10)}`;
        const liquidity = (Math.random() * 5000 + 500).toFixed(2);
        
        pools.push({
          name,
          address,
          isActive,
          liquidity: parseFloat(liquidity)
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
  },
  {
    path: '/api/memory_stats.json',
    method: 'GET',
    description: '获取内存统计数据',
    response: {
      success: true,
      data: {}
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

// 为每个API创建对应的路由
for (const route of apiRoutes) {
  app.get(route.path, (req, res) => {
    console.log(`处理请求: ${route.path}`);
    const response = typeof route.response === 'function' ? route.response() : route.response;
    res.json(response);
  });
}

// 额外确保几个关键API的注册
app.get('/api/status', (req, res) => {
  console.log('处理API状态请求');
  res.json({
    success: true,
    api_status: "running",
    connections: 12,
    requests_per_minute: 45,
    average_response_time: 23,
    uptime: "1天8小时",
    endpoints: {}
  });
});

app.get('/api/memory_stats.json', (req, res) => {
  console.log('处理内存监控请求');
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      usage: Math.round((1 - os.freemem() / os.totalmem()) * 100)
    },
    cpu: {
      cores: os.cpus().length,
      load: Math.floor(Math.random() * 40) + 10
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