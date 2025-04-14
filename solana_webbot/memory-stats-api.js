/**
 * 内存统计API服务器
 * 提供专门的内存统计数据API
 */

const express = require('express');
const cors = require('cors');
const os = require('node:os');

// 创建Express应用
const app = express();
const PORT = 8090; // 使用不同的端口

// 允许所有跨域请求
app.use(cors({
  origin: '*',
  methods: ['GET'],
  allowedHeaders: ['Content-Type']
}));

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
  next();
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 添加API健康检查端点
app.get('/api/health', (req, res) => {
  console.log('处理API健康检查请求');
  res.json({ 
    status: 'ok',
    message: '内存统计API服务器正常运行' 
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

// 添加系统状态端点 (兼容版本)
app.get('/api/status', (req, res) => {
  console.log('处理系统状态请求 (兼容端点)');
  res.json({
    success: true,
    status: "running",
    services: {
      api: "active",
      bot: "active",
      database: "active"
    },
    uptime: Math.round(os.uptime()),
    version: "1.0.0",
    currentTime: new Date().toISOString()
  });
});

// 内存统计API端点
app.get('/api/memory_stats.json', (req, res) => {
  console.log('处理内存统计请求 - 独立服务器');
  
  // 获取当前系统内存信息
  const totalMem = Math.round(os.totalmem() / (1024 * 1024)); // MB
  const freeMem = Math.round(os.freemem() / (1024 * 1024)); // MB
  const usedMem = totalMem - freeMem;
  const memoryUsedPercent = Number.parseFloat((usedMem / totalMem * 100).toFixed(1));
  const memoryFreePercent = Number.parseFloat((freeMem / totalMem * 100).toFixed(1));
  
  // 模拟进程内存堆统计
  const heapTotal = Math.round(totalMem * 0.6); // 假设堆内存占总内存的60%
  const heapUsed = Math.round(usedMem * 0.65); // 假设使用的堆内存占使用内存的65%
  const heapFree = heapTotal - heapUsed;
  const heapPercentage = Number.parseFloat((heapUsed / heapTotal * 100).toFixed(1));
  
  // 确保堆内存使用不超过总堆内存
  const adjustedHeapUsed = Math.min(heapUsed, heapTotal);
  const adjustedHeapPercentage = Number.parseFloat((adjustedHeapUsed / heapTotal * 100).toFixed(1));
  
  // 获取当前时间
  const now = new Date();
  
  // 生成更丰富的内存趋势数据
  const memoryTrend = [];
  
  // 生成过去24小时的数据点，间隔分别为10分钟、30分钟和60分钟，可支持1小时、6小时和24小时的展示
  // 1小时 - 10分钟一个点，共6个点
  // 6小时 - 30分钟一个点，共12个点
  // 24小时 - 60分钟一个点，共24个点
  
  // 生成最近1小时的数据，每10分钟一个点
  for (let i = 0; i < 6; i++) {
    const timeDiff = i * 10 * 60 * 1000; // 10分钟
    const timestamp = new Date(now.getTime() - timeDiff).toISOString();
    // 微小波动模拟最近一小时的数据
    const variation = Math.random() * 3 - 1.5; // -1.5到+1.5之间的随机波动
    const memoryPercent = Number.parseFloat((memoryUsedPercent + variation).toFixed(1));
    const memoryUsage = Math.round(totalMem * memoryPercent / 100);
    
    memoryTrend.push({
      timestamp: timestamp,
      used: memoryUsage,
      heap: Math.round(memoryUsage * 0.65)
    });
  }
  
  // 生成1小时到6小时的数据，每30分钟一个点
  for (let i = 1; i < 12; i++) {
    const timeDiff = 60 * 60 * 1000 + (i * 30 * 60 * 1000); // 从1小时后开始，每30分钟一个点
    const timestamp = new Date(now.getTime() - timeDiff).toISOString();
    // 中等波动模拟1-6小时的数据
    const variation = Math.random() * 6 - 3; // -3到+3之间的随机波动
    const memoryPercent = Number.parseFloat((memoryUsedPercent + variation).toFixed(1));
    const memoryUsage = Math.round(totalMem * memoryPercent / 100);
    
    memoryTrend.push({
      timestamp: timestamp,
      used: memoryUsage,
      heap: Math.round(memoryUsage * 0.65)
    });
  }
  
  // 生成6小时到24小时的数据，每1小时一个点
  for (let i = 7; i <= 24; i++) {
    const timeDiff = i * 60 * 60 * 1000; // 每小时一个点
    const timestamp = new Date(now.getTime() - timeDiff).toISOString();
    // 较大波动模拟6-24小时的数据
    const variation = Math.random() * 10 - 5; // -5到+5之间的随机波动
    const memoryPercent = Number.parseFloat((memoryUsedPercent + variation).toFixed(1));
    const memoryUsage = Math.round(totalMem * memoryPercent / 100);
    
    memoryTrend.push({
      timestamp: timestamp,
      used: memoryUsage,
      heap: Math.round(memoryUsage * 0.65)
    });
  }
  
  // 按时间从旧到新排序
  memoryTrend.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
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
  
  console.log('准备返回内存统计数据');
  
  // 返回内存统计数据
  res.json({
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
      externalMemory: externalMemory,
      memoryTrend: memoryTrend,
      consumptionPoints: consumptionPoints,
      optimizationSuggestions: optimizationSuggestions,
      memoryLogs: memoryLogs,
      memoryLeaks: memoryLeaks,
      lastUpdated: now.toISOString()
    }
  });
});

// 处理404错误
app.use((req, res) => {
  console.log(`404错误: ${req.method} ${req.url}`);
  res.status(404).json({ 
    error: '未找到请求的资源', 
    path: req.url,
    message: '内存统计API服务器中不存在此端点'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`内存统计API服务器已启动，监听端口 ${PORT}`);
  console.log(`可以通过 http://localhost:${PORT}/api/memory_stats.json 获取内存统计数据`);
  console.log(`可以通过 http://localhost:${PORT}/api/system_status.json 获取系统状态数据`);
  console.log(`可以通过 http://localhost:${PORT}/api/health 检查服务健康状态`);
}); 