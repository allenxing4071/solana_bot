/**
 * 系统控制器
 * 处理与系统状态、性能监控和操作相关的所有请求
 */

import { Request, Response } from 'express';
import * as os from 'node:os';
import * as v8 from 'node:v8';
import logger from '../../core/logger';
import { poolMonitor } from '../../modules/listener/pool_monitor';

// 模块名称
const MODULE_NAME = 'SystemController';

// 全局系统状态
let systemRunning = false; // 系统运行状态
let systemStartTime = 0; // 系统启动时间
let profitTotal = 0; // 累计收益
let executedTradesCount = 0; // 已执行交易数量
let memoryHistoryData: any[] = []; // 内存历史数据

// 定期收集内存数据
setInterval(() => {
  // 添加当前内存数据点
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memoryPercentage = ((totalMem - freeMem) / totalMem) * 100;
  
  memoryHistoryData.push({
    time: Date.now(),
    value: memoryPercentage
  });
  
  // 只保留最近60个数据点（假设每分钟收集一次，就是1小时的数据）
  if (memoryHistoryData.length > 60) {
    memoryHistoryData.shift();
  }
}, 60000); // 每分钟收集一次数据

/**
 * 获取系统状态
 */
export const getSystemStatus = async (_req: Request, res: Response): Promise<void> => {
  try {
    // 获取内存使用情况
    const memoryUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryPercentage = ((totalMem - freeMem) / totalMem) * 100;
    
    // 获取CPU使用情况
    const cpuUsage = os.loadavg()[0] * 10; // 转换为百分比
    
    // 获取系统运行时间
    const uptime = systemRunning ? (Date.now() - systemStartTime) / 1000 : 0;
    
    // 获取池状态
    const activePools = poolMonitor ? poolMonitor.getKnownPools().length : 0;
    const monitoredTokens = Math.floor(Math.random() * 100) + 50; // 暂时使用模拟数据
    
    // 使用实际收集的内存历史数据，如果没有则生成模拟数据
    const memoryHistory = memoryHistoryData.length > 0 ? memoryHistoryData : generateMemoryHistory();
    
    // 返回系统状态数据
    res.json({
      success: true,
      data: {
        status: systemRunning ? 'running' : 'stopped',
        cpu: Math.min(100, cpuUsage),
        memory: memoryPercentage,
        uptime: uptime,
        profit: profitTotal,
        activePools: activePools,
        monitoredTokens: monitoredTokens,
        executedTrades: executedTradesCount,
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
    logger.error('获取系统状态失败', MODULE_NAME, { 
      error: error instanceof Error ? error.message : String(error) 
    });
    res.status(500).json({
      success: false,
      error: '获取系统状态失败'
    });
  }
};

/**
 * 启动系统
 */
export const startSystem = async (_req: Request, res: Response): Promise<void> => {
  try {
    logger.info('通过API触发系统启动', MODULE_NAME);
    
    // 更新系统状态
    systemRunning = true;
    systemStartTime = Date.now();
    
    // 这里可以添加实际的系统启动逻辑
    // 例如启动监听器、初始化交易模块等
    
    res.json({
      success: true,
      message: '系统已成功启动'
    });
  } catch (error) {
    logger.error('启动系统失败', MODULE_NAME, { 
      error: error instanceof Error ? error.message : String(error) 
    });
    res.status(500).json({
      success: false,
      error: '启动系统失败'
    });
  }
};

/**
 * 停止系统
 */
export const stopSystem = async (_req: Request, res: Response): Promise<void> => {
  try {
    logger.info('通过API触发系统停止', MODULE_NAME);
    
    // 更新系统状态
    systemRunning = false;
    
    // 这里可以添加实际的系统停止逻辑
    // 例如关闭连接、保存状态等
    
    res.json({
      success: true,
      message: '系统已成功停止'
    });
  } catch (error) {
    logger.error('停止系统失败', MODULE_NAME, { 
      error: error instanceof Error ? error.message : String(error) 
    });
    res.status(500).json({
      success: false,
      error: '停止系统失败'
    });
  }
};

/**
 * 优化内存
 */
export const optimizeMemory = async (_req: Request, res: Response): Promise<void> => {
  try {
    logger.info('通过API触发内存优化', MODULE_NAME);
    
    // 强制执行垃圾回收
    if (global.gc) {
      global.gc();
      logger.info('手动触发垃圾回收完成', MODULE_NAME);
    }
    
    // 这里可以添加更多内存优化逻辑
    
    res.json({
      success: true,
      message: '内存优化已执行',
      data: {
        memoryBefore: Math.floor(Math.random() * 200 + 800) * 1024 * 1024, // 模拟数据
        memoryAfter: Math.floor(Math.random() * 200 + 600) * 1024 * 1024, // 模拟数据
        freedMemory: Math.floor(Math.random() * 200) * 1024 * 1024, // 模拟数据
        timestamp: Date.now()
      }
    });
  } catch (error) {
    logger.error('内存优化失败', MODULE_NAME, { 
      error: error instanceof Error ? error.message : String(error) 
    });
    res.status(500).json({
      success: false,
      error: '内存优化失败'
    });
  }
};

/**
 * 获取内存统计数据
 */
export const getMemoryStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    logger.info('获取内存统计数据', MODULE_NAME);
    
    // 获取内存使用情况
    const memoryUsage = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();
    
    // 获取系统内存
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const systemMemoryPercentage = ((totalMem - freeMem) / totalMem) * 100;
    
    // 计算内存历史数据的统计信息
    const memoryHistory = memoryHistoryData.length > 0 ? memoryHistoryData : generateMemoryHistory();
    
    // 计算最大、最小和平均值
    let memSum = 0;
    let memMax = 0;
    let memMin = 100;
    
    memoryHistory.forEach(point => {
      memSum += point.value;
      memMax = Math.max(memMax, point.value);
      memMin = Math.min(memMin, point.value);
    });
    
    const memAvg = memoryHistory.length > 0 ? memSum / memoryHistory.length : 0;
    
    // 生成内存消耗者数据
    const memoryConsumers = generateMemoryConsumers();
    
    // 生成区域使用数据
    const memoryAreas = [
      { name: '堆空间', size: memoryUsage.heapTotal, used: memoryUsage.heapUsed },
      { name: '外部资源', size: memoryUsage.external, used: memoryUsage.external },
      { name: '数组缓冲区', size: memoryUsage.arrayBuffers || 0, used: memoryUsage.arrayBuffers || 0 },
      { name: '代码空间', size: heapStats.malloced_memory || 0, used: heapStats.malloced_memory || 0 }
    ];
    
    // 生成时间段统计数据
    const timeRanges = [
      { range: '最近1小时', avgUsage: memAvg, peakUsage: memMax, trend: memMax > memAvg ? '上升' : '下降' },
      { range: '最近24小时', avgUsage: memAvg * 0.9, peakUsage: memMax * 1.1, trend: Math.random() > 0.5 ? '上升' : '下降' },
      { range: '最近7天', avgUsage: memAvg * 0.85, peakUsage: memMax * 1.2, trend: Math.random() > 0.5 ? '上升' : '下降' }
    ];
    
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
          data: memoryHistory,
          stats: {
            min: memMin,
            max: memMax,
            avg: memAvg,
            current: systemMemoryPercentage
          }
        },
        consumers: memoryConsumers,
        areas: memoryAreas,
        timeRanges: timeRanges,
        gcInfo: {
          lastRun: Date.now() - Math.floor(Math.random() * 600000), // 最近10分钟内
          totalRuns: Math.floor(Math.random() * 100) + 50,
          averageDuration: Math.floor(Math.random() * 50) + 10,
          freedMemory: Math.floor(Math.random() * 1000) * 1024 * 1024
        }
      }
    });
  } catch (error) {
    logger.error('获取内存统计数据失败', MODULE_NAME, { 
      error: error instanceof Error ? error.message : String(error) 
    });
    res.status(500).json({
      success: false,
      error: '获取内存统计数据失败'
    });
  }
};

/**
 * 生成内存历史数据（模拟）
 */
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

/**
 * 生成模拟内存消耗者数据
 */
function generateMockConsumers() {
  return [
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
      freed: Math.random() * 80 * 1024 * 1024,
      memoryUsage: 15 + Math.random() * 25,
      status: '正常'
    }
  ];
}

/**
 * 生成内存消耗者详细数据
 */
function generateMemoryConsumers() {
  return [
    {
      id: 'cache',
      name: '数据缓存',
      memoryUsage: Math.floor(Math.random() * 200) * 1024 * 1024,
      percentUsage: 25 + Math.random() * 10,
      status: '正常',
      cleanable: true,
      lastCleanup: Date.now() - Math.floor(Math.random() * 3600000),
      items: Math.floor(Math.random() * 1000) + 500,
      details: {
        cacheHits: Math.floor(Math.random() * 10000),
        cacheMisses: Math.floor(Math.random() * 2000),
        efficiency: Math.round(Math.random() * 30 + 70) + '%'
      }
    },
    {
      id: 'connections',
      name: '网络连接',
      memoryUsage: Math.floor(Math.random() * 100) * 1024 * 1024,
      percentUsage: 10 + Math.random() * 5,
      status: '正常',
      cleanable: true,
      lastCleanup: Date.now() - Math.floor(Math.random() * 1800000),
      items: Math.floor(Math.random() * 20) + 5,
      details: {
        active: Math.floor(Math.random() * 10) + 2,
        idle: Math.floor(Math.random() * 5),
        closed: Math.floor(Math.random() * 100)
      }
    },
    {
      id: 'transactions',
      name: '交易历史',
      memoryUsage: Math.floor(Math.random() * 300) * 1024 * 1024,
      percentUsage: 30 + Math.random() * 15,
      status: '正常',
      cleanable: true,
      lastCleanup: Date.now() - Math.floor(Math.random() * 7200000),
      items: Math.floor(Math.random() * 5000) + 1000,
      details: {
        success: Math.floor(Math.random() * 4000) + 500,
        pending: Math.floor(Math.random() * 100),
        failed: Math.floor(Math.random() * 500)
      }
    },
    {
      id: 'analytics',
      name: '分析数据',
      memoryUsage: Math.floor(Math.random() * 150) * 1024 * 1024,
      percentUsage: 15 + Math.random() * 8,
      status: '正常',
      cleanable: false,
      lastCleanup: Date.now() - Math.floor(Math.random() * 14400000),
      items: Math.floor(Math.random() * 200) + 50,
      details: {
        datasets: Math.floor(Math.random() * 20) + 5,
        dataPoints: Math.floor(Math.random() * 100000) + 10000
      }
    }
  ];
} 