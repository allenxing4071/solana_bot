/**
 * 简易内存监控API服务器
 */

const express = require('express');
const cors = require('cors');
const os = require('node:os');
const v8 = require('node:v8');

// 创建应用
const app = express();
const PORT = 3030;

// 中间件
app.use(express.json());
app.use(cors());

// 添加请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// 路由 - 健康检查
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 路由 - 获取内存统计数据
app.get('/memory-stats', (req, res) => {
  try {
    // 获取内存使用情况
    const memoryUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    // 获取V8堆统计
    const heapStats = v8.getHeapStatistics();
    
    // 生成模拟内存消耗点数据
    const memoryConsumptionPoints = [
      { 
        module: "区块链连接管理", 
        consumption: Math.round(Math.random() * 50 + 20) * 1024 * 1024, 
        status: "MEDIUM",
        lastUpdated: new Date().toLocaleTimeString("zh-CN")
      },
      { 
        module: "交易数据缓存", 
        consumption: Math.round(Math.random() * 40 + 15) * 1024 * 1024, 
        status: "LOW",
        lastUpdated: new Date().toLocaleTimeString("zh-CN")
      },
      { 
        module: "策略执行引擎", 
        consumption: Math.round(Math.random() * 100 + 30) * 1024 * 1024, 
        status: "HIGH",
        lastUpdated: new Date().toLocaleTimeString("zh-CN")
      },
      { 
        module: "历史数据存储", 
        consumption: Math.round(Math.random() * 70 + 20) * 1024 * 1024, 
        status: "MEDIUM",
        lastUpdated: new Date().toLocaleTimeString("zh-CN")
      },
      { 
        module: "实时价格监控", 
        consumption: Math.round(Math.random() * 60 + 25) * 1024 * 1024, 
        status: "MEDIUM",
        lastUpdated: new Date().toLocaleTimeString("zh-CN")
      },
      { 
        module: "用户界面渲染", 
        consumption: Math.round(Math.random() * 20 + 10) * 1024 * 1024, 
        status: "LOW",
        lastUpdated: new Date().toLocaleTimeString("zh-CN")
      },
      { 
        module: "日志记录系统", 
        consumption: Math.round(Math.random() * 15 + 5) * 1024 * 1024, 
        status: "LOW",
        lastUpdated: new Date().toLocaleTimeString("zh-CN")
      },
      { 
        module: "MEV策略分析", 
        consumption: Math.round(Math.random() * 120 + 40) * 1024 * 1024, 
        status: "HIGH",
        lastUpdated: new Date().toLocaleTimeString("zh-CN")
      }
    ];
    
    // 生成内存历史数据
    const memoryHistory = [];
    const now = Date.now();
    
    // 生成过去10分钟的数据，每分钟一个点
    for (let i = 9; i >= 0; i--) {
      const timestamp = now - (i * 60 * 1000);
      const usedMemoryValue = Math.round(Math.random() * 500 + 200) * 1024 * 1024;
      const heapUsedValue = Math.round(Math.random() * 300 + 100) * 1024 * 1024;
      
      memoryHistory.push({
        timestamp,
        usedMemory: usedMemoryValue,
        heapUsed: heapUsedValue
      });
    }
    
    // 返回内存统计数据
    return res.json({
      totalMemory: totalMem,
      usedMemory: usedMem,
      freeMemory: freeMem,
      heapTotal: heapStats.total_heap_size,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external || 0,
      peakMemory: heapStats.peak_heap_size || memoryUsage.heapUsed * 1.2,
      memoryHistory: memoryHistory,
      memoryConsumptionPoints: memoryConsumptionPoints,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error(`获取内存统计失败: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: `获取内存统计失败: ${error.message}`
    });
  }
});

// 路由 - 内存优化
app.post('/memory-optimize', (req, res) => {
  try {
    console.log("执行内存优化...");
    
    // 强制执行垃圾回收
    if (global.gc) {
      global.gc();
      console.log("手动触发垃圾回收完成");
    }
    
    // 模拟释放的内存大小
    const freedMemory = Math.round(Math.random() * 200 + 50) * 1024 * 1024;
    
    // 返回优化结果
    return res.json({
      success: true,
      message: "内存优化已完成",
      freedMemory: freedMemory,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error(`内存优化失败: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: `内存优化失败: ${error.message}`
    });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`内存监控API服务器已启动，监听端口 ${PORT}`);
}); 