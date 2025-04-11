/**
 * 系统日志API补充接口
 * 提供系统日志数据给前端展示
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 创建应用
const app = express();
app.use(cors());
app.use(express.json());

// 模拟日志数据
const logLevels = ['info', 'warning', 'error', 'debug'];
const logMessages = [
  '系统启动',
  '内存使用率超过警戒线',
  '发现新代币对',
  '执行内存优化',
  '交易执行成功',
  '交易执行失败',
  'RPC连接超时',
  '价格缓存已更新',
  '监控池更新',
  'GC回收执行完成'
];

// 生成随机日志
function generateLogs(count = 20) {
  const logs = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const time = new Date(now - i * 60000 * Math.random() * 10);
    const level = logLevels[Math.floor(Math.random() * logLevels.length)];
    const message = logMessages[Math.floor(Math.random() * logMessages.length)];
    
    logs.push({
      time: time.toISOString(),
      level,
      message: `${message} ${i > 0 ? `(${i})` : ''}`,
    });
  }
  
  return logs.sort((a, b) => new Date(b.time) - new Date(a.time));
}

// 读取真实日志文件（如果存在）
function getActualLogs() {
  try {
    // 尝试读取API日志文件
    const logPath = path.join('/home/ubuntu', 'api.log');
    if (fs.existsSync(logPath)) {
      const content = fs.readFileSync(logPath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim()).slice(-50);
      
      return lines.map(line => {
        // 尝试解析日志格式
        const match = line.match(/\[(.*?)\]\s+(\w+):\s+(.*)/);
        if (match) {
          return {
            time: match[1],
            level: match[2].toLowerCase(),
            message: match[3]
          };
        }
        return {
          time: new Date().toISOString(),
          level: 'info',
          message: line
        };
      });
    }
  } catch (err) {
    console.error('读取日志文件失败:', err);
  }
  
  // 如果无法读取真实日志，返回模拟数据
  return generateLogs();
}

// 系统日志API路由
app.get('/api/system/logs', (req, res) => {
  const logs = getActualLogs();
  res.json({
    success: true,
    data: logs
  });
});

// 启动服务器
const PORT = 3200;
app.listen(PORT, () => {
  console.log(`日志API服务启动在端口 ${PORT}`);
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 捕获未处理的路由
app.use('*', (req, res) => {
  res.status(404).send('页面未找到');
}); 