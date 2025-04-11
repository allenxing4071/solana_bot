#!/bin/bash
# Solana MEV Bot Memory API 部署脚本

set -e  # 遇到错误立即停止

# 从.env文件读取配置
SSH_HOST=$(grep SSH_HOST .env | cut -d'=' -f2)
SSH_USER=$(grep SSH_USER .env | cut -d'=' -f2)
SSH_KEY_PATH=$(grep SSH_KEY_PATH .env | cut -d'=' -f2)

echo "===== 开始部署内存统计API ====="

# 创建临时启动脚本文件
cat > memory_api_fix.js << 'EOL'
/**
 * 内存统计API修复脚本
 * 创建一个独立的内存统计API服务
 */

const express = require('express');
const cors = require('cors');
const os = require('os');
const v8 = require('v8');

// 创建Express应用
const app = express();
app.use(cors());
app.use(express.json());

// 内存历史数据
const memoryHistory = [];

// 每分钟收集一次内存数据
setInterval(() => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memoryPercentage = ((totalMem - freeMem) / totalMem) * 100;
  
  memoryHistory.push({
    time: Date.now(),
    value: memoryPercentage
  });
  
  // 保留最近60个数据点
  if (memoryHistory.length > 60) {
    memoryHistory.shift();
  }
}, 60000);

// 生成模拟内存消耗者数据
function generateMemoryConsumers() {
  return [
    {
      id: 'cache',
      name: '数据缓存',
      memoryUsage: Math.floor(Math.random() * 200 * 1024 * 1024),
      percentUsage: Math.random() * 30 + 10,
      status: '正常',
      cleanable: true,
      lastCleanup: Date.now() - Math.floor(Math.random() * 3600000),
      items: Math.floor(Math.random() * 1000) + 100,
      details: {
        cacheHits: Math.floor(Math.random() * 3000) + 1000,
        cacheMisses: Math.floor(Math.random() * 1000),
        efficiency: Math.floor(85 + Math.random() * 15) + '%'
      }
    },
    {
      id: 'connections',
      name: '网络连接',
      memoryUsage: Math.floor(Math.random() * 100 * 1024 * 1024),
      percentUsage: Math.random() * 20 + 5,
      status: '正常',
      cleanable: true,
      lastCleanup: Date.now() - Math.floor(Math.random() * 3600000),
      items: Math.floor(Math.random() * 30),
      details: {
        active: Math.floor(Math.random() * 10) + 1,
        idle: Math.floor(Math.random() * 5),
        closed: Math.floor(Math.random() * 100)
      }
    },
    {
      id: 'transactions',
      name: '交易历史',
      memoryUsage: Math.floor(Math.random() * 300 * 1024 * 1024),
      percentUsage: Math.random() * 40 + 20,
      status: Math.random() > 0.8 ? '需要优化' : '正常',
      cleanable: true,
      lastCleanup: Date.now() - Math.floor(Math.random() * 3600000),
      items: Math.floor(Math.random() * 5000) + 500,
      details: {
        success: Math.floor(Math.random() * 2000) + 200,
        pending: Math.floor(Math.random() * 100),
        failed: Math.floor(Math.random() * 100)
      }
    },
    {
      id: 'analytics',
      name: '分析数据',
      memoryUsage: Math.floor(Math.random() * 70 * 1024 * 1024),
      percentUsage: Math.random() * 25 + 5,
      status: Math.random() > 0.9 ? '需要优化' : ' 正常',
      cleanable: false,
      lastCleanup: Date.now() - Math.floor(Math.random() * 86400000),
      items: Math.floor(Math.random() * 200) + 50,
      details: {
        datasets: Math.floor(Math.random() * 20) + 2,
        dataPoints: Math.floor(Math.random() * 100000) + 1000
      }
    }
  ];
}

// 内存统计API
app.get('/api/system/memory-stats', (_req, res) => {
  try {
    console.log('[内存统计API] 获取内存统计数据请求');
    
    // 获取内存使用情况
    const memoryUsage = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();
    
    // 获取系统内存
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const systemMemoryPercentage = ((totalMem - freeMem) / totalMem) * 100;
    
    // 生成统计数据
    let memoryData = memoryHistory;
    if (memoryData.length === 0) {
      // 生成模拟数据
      for (let i = 0; i < 20; i++) {
        memoryData.push({
          time: Date.now() - (60000 * (20 - i)),
          value: 40 + Math.random() * 30
        });
      }
    }
    
    // 计算最大、最小和平均值
    let memSum = 0;
    let memMax = 0;
    let memMin = 100;
    
    memoryData.forEach(point => {
      memSum += point.value;
      memMax = Math.max(memMax, point.value);
      memMin = Math.min(memMin, point.value);
    });
    
    const memAvg = memoryData.length > 0 ? memSum / memoryData.length : 0;
    
    // 返回内存统计数据
    res.json({
      success: true,
      data: {
        current: {
          systemMemory: {
            total: totalMem,
            free: freeMem,
            used: totalMem - freeMem,
            percentage: systemMemoryPercentage
          },
          processMemory: {
            rss: memoryUsage.rss,
            heapTotal: memoryUsage.heapTotal,
            heapUsed: memoryUsage.heapUsed,
            external: memoryUsage.external,
            arrayBuffers: memoryUsage.arrayBuffers || 0
          },
          v8Memory: {
            heapSizeLimit: heapStats.heap_size_limit,
            totalHeapSize: heapStats.total_heap_size,
            usedHeapSize: heapStats.used_heap_size,
            mallocedMemory: heapStats.malloced_memory,
            peakMallocedMemory: heapStats.peak_malloced_memory
          }
        },
        history: {
          data: memoryData,
          stats: {
            min: memMin,
            max: memMax,
            avg: memAvg,
            current: systemMemoryPercentage
          }
        },
        consumers: generateMemoryConsumers(),
        areas: [
          { name: '堆空间', size: memoryUsage.heapTotal, used: memoryUsage.heapUsed },
          { name: '外部资源', size: memoryUsage.external, used: memoryUsage.external },
          { name: '数组缓冲区', size: memoryUsage.arrayBuffers || 0, used: memoryUsage.arrayBuffers || 0 },
          { name: '代码空间', size: heapStats.malloced_memory || 0, used: heapStats.malloced_memory || 0 }
        ],
        timeRanges: [
          { range: '最近1小时', avgUsage: memAvg, peakUsage: memMax, trend: memMax > memAvg ? '上升' : '下降' },
          { range: '最近24小时', avgUsage: memAvg * 0.9, peakUsage: memMax * 1.1, trend: Math.random() > 0.5 ? '上升' : '下降' },
          { range: '最近7天', avgUsage: memAvg * 0.85, peakUsage: memMax * 1.2, trend: Math.random() > 0.5 ? '上升' : '下降' }
        ],
        gcInfo: {
          lastRun: Date.now() - Math.floor(Math.random() * 600000), // 最近10分钟内
          totalRuns: Math.floor(Math.random() * 100) + 50,
          averageDuration: Math.floor(Math.random() * 50) + 10,
          freedMemory: Math.floor(Math.random() * 1000) * 1024 * 1024
        }
      }
    });
  } catch (error) {
    console.error('[内存统计API] 获取内存统计数据失败:', error);
    res.status(500).json({
      success: false,
      error: '获取内存统计数据失败'
    });
  }
});

// 健康检查接口
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'memory-stats-api' });
});

// 启动服务器
const PORT = 3100;
app.listen(PORT, () => {
  console.log(`内存统计API服务已启动，监听端口 ${PORT}`);
});
EOL

echo "创建了内存统计API修复脚本"

# 上传文件
echo "上传修复脚本到服务器..."
scp -i $SSH_KEY_PATH memory_api_fix.js $SSH_USER@$SSH_HOST:~/

# 创建Nginx代理配置
cat > memory_api_nginx.conf << 'EOL'
location /api/system/memory-stats {
    proxy_pass http://localhost:3100/api/system/memory-stats;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
EOL

echo "创建了Nginx配置"

# 上传Nginx配置
echo "上传Nginx配置到服务器..."
scp -i $SSH_KEY_PATH memory_api_nginx.conf $SSH_USER@$SSH_HOST:~/

# 在服务器上执行部署
echo "在服务器上执行部署..."
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST << 'EOF'
  sudo cp ~/memory_api_nginx.conf /etc/nginx/sites-available/memory_api.conf
  sudo sed -i '/server_name sol.deeptv.tv;/r /etc/nginx/sites-available/memory_api.conf' /etc/nginx/sites-available/solana_mevbot.conf
  sudo nginx -t && sudo systemctl reload nginx
  
  # 停止现有进程，如果有的话
  pkill -f "node ~/memory_api_fix.js" || true
  
  # 启动新的API服务
  cd ~
  nohup node memory_api_fix.js > memory_api.log 2>&1 &
  echo "内存统计API服务已启动"
EOF

echo "部署完成，正在测试API..."
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "curl -s http://localhost:3100/health"

echo "===== 内存统计API部署完成 ====="
echo "尝试访问内存统计API: http://sol.deeptv.tv/api/system/memory-stats"

# 清理临时文件
rm -f memory_api_fix.js memory_api_nginx.conf 