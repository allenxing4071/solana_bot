import { Telegraf } from 'telegraf';
import logger from '../core/logger';
import * as os from 'os';
import * as process from 'process';

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    temperature?: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    connectionsCount: number;
  };
  system: {
    uptime: number;
    loadAverage: number[];
    platform: string;
  };
}

// 格式化字节大小
function formatBytes(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

// 格式化时间
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  return `${days}天 ${hours}小时 ${minutes}分钟`;
}

// 获取系统指标
function getSystemMetrics(): SystemMetrics {
  const cpuUsage = os.loadavg()[0] / os.cpus().length * 100;
  const totalMemory = 24 * 1024 * 1024 * 1024; // 24GB
  const freeMemory = 289.50 * 1024 * 1024; // 289.50MB
  const usedMemory = totalMemory - freeMemory;

  return {
    cpu: {
      usage: 26.77,
      cores: 10,
      temperature: 45.5
    },
    memory: {
      total: totalMemory,
      used: usedMemory,
      free: freeMemory,
      usagePercent: 98.82
    },
    disk: {
      total: 931.32 * 1024 * 1024 * 1024, // 931.32GB
      used: 558.79 * 1024 * 1024 * 1024,  // 558.79GB
      free: 372.53 * 1024 * 1024 * 1024,  // 372.53GB
      usagePercent: 60
    },
    network: {
      bytesIn: 1.43 * 1024 * 1024,    // 1.43MB/s
      bytesOut: 781.25 * 1024,        // 781.25KB/s
      connectionsCount: 42
    },
    system: {
      uptime: 4 * 24 * 60 * 60 + 1 * 60 * 60 + 20 * 60, // 4天1小时20分钟
      loadAverage: [2.68, 2.46, 2.43],
      platform: 'darwin'
    }
  };
}

// 生成状态图标
function getStatusIcon(value: number, thresholds: { warning: number; critical: number }): string {
  if (value >= thresholds.critical) return '🔴';
  if (value >= thresholds.warning) return '🟡';
  return '🟢';
}

async function testMonitoringNotifications() {
  try {
    const botToken = '7368714077:AAHXATYrFT8uOibqYNG6UuGWJQVAq3RyixQ';
    const chatId = '7395950412';
    
    logger.info('开始测试监控系统通知...');
    
    // 创建 bot 实例
    const bot = new Telegraf(botToken);
    
    // 获取系统指标
    const metrics = getSystemMetrics();
    
    // 构建通知消息
    const messages = [
      // CPU状态通知
      {
        type: 'CPU状态',
        icon: '💻',
        content: `CPU监控报告\n\n` +
                `使用率: ${getStatusIcon(metrics.cpu.usage, { warning: 70, critical: 90 })} ${metrics.cpu.usage}%\n` +
                `核心数: ${metrics.cpu.cores}\n` +
                `温度: ${getStatusIcon(metrics.cpu.temperature || 0, { warning: 70, critical: 85 })} ${metrics.cpu.temperature}°C\n` +
                `平均负载: ${metrics.system.loadAverage.map(load => load.toFixed(2)).join(', ')}`
      },
      
      // 内存状态通知
      {
        type: '内存状态',
        icon: '🧠',
        content: `内存监控报告\n\n` +
                `使用率: ${getStatusIcon(metrics.memory.usagePercent, { warning: 80, critical: 90 })} ${metrics.memory.usagePercent}%\n` +
                `总内存: ${formatBytes(metrics.memory.total)}\n` +
                `已使用: ${formatBytes(metrics.memory.used)}\n` +
                `空闲: ${formatBytes(metrics.memory.free)}`
      },
      
      // 磁盘状态通知
      {
        type: '磁盘状态',
        icon: '💾',
        content: `磁盘监控报告\n\n` +
                `使用率: ${getStatusIcon(metrics.disk.usagePercent, { warning: 80, critical: 90 })} ${metrics.disk.usagePercent}%\n` +
                `总空间: ${formatBytes(metrics.disk.total)}\n` +
                `已使用: ${formatBytes(metrics.disk.used)}\n` +
                `空闲: ${formatBytes(metrics.disk.free)}`
      },
      
      // 网络状态通知
      {
        type: '网络状态',
        icon: '🌐',
        content: `网络监控报告\n\n` +
                `入站流量: ${formatBytes(metrics.network.bytesIn)}/s\n` +
                `出站流量: ${formatBytes(metrics.network.bytesOut)}/s\n` +
                `活动连接: ${metrics.network.connectionsCount}`
      },
      
      // 系统状态通知
      {
        type: '系统状态',
        icon: '🖥️',
        content: `系统监控报告\n\n` +
                `运行时间: ${formatUptime(metrics.system.uptime)}\n` +
                `平台: ${metrics.system.platform}\n` +
                `系统负载: ${metrics.system.loadAverage[0].toFixed(2)}\n` +
                `运行状态: ${getStatusIcon(metrics.cpu.usage, { warning: 70, critical: 90 })} 正常`
      }
    ];

    // 逐个发送消息
    for (const msg of messages) {
      logger.info(`发送 ${msg.type} 消息...`);
      const formattedMessage = `${msg.icon} ${msg.type}\n\n${msg.content}\n\n发送时间: ${new Date().toLocaleString()}`;
      
      const result = await bot.telegram.sendMessage(chatId, formattedMessage);
      logger.info(`${msg.type} 消息发送成功:`, result.message_id);
      
      // 等待 2 秒再发送下一条
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    logger.info('监控系统通知测试完成！');
    
  } catch (error) {
    logger.error('测试失败:', error);
    throw error;
  }
}

// 运行测试
logger.info('开始运行监控系统通知测试...');
testMonitoringNotifications().catch(error => {
  logger.error('测试执行失败:', error);
  process.exit(1);
}); 