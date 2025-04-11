/**
 * Solana MEV机器人主入口文件
 * 负责初始化和启动所有系统模块
 * 
 * 【编程基础概念通俗比喻】
 * 1. 程序入口 = 渔船启航仪式：
 *    就像渔船启航前的准备仪式，确保所有系统正常工作
 *    例如：app.start() 就是船长下达的"起航"命令
 *    
 * 2. 进程事件 = 海上突发状况：
 *    程序运行中可能遇到的各种意外情况，需要妥善处理
 *    例如：SIGINT 就像是"暴风雨预警"，需要紧急返航
 *    
 * 3. 应用程序类 = 整艘渔船：
 *    包含了所有功能部件和操作方法的完整渔船
 *    例如：Application类就是整艘渔船的设计图和操作手册
 *    
 * 4. 系统状态 = 渔船航行状态：
 *    记录渔船当前所处的工作状态
 *    例如：RUNNING状态就像"正常航行中"，ERROR状态就像"船只故障"
 * 
 * 【比喻解释】
 * 这个模块就像渔船的指挥舱：
 * - 船长在这里发布起航命令（启动应用程序）
 * - 各系统的启动状态在这里汇总（状态管理）
 * - 接收各种信号并作出反应（进程处理器）
 * - 负责整体协调和安全返航（生命周期管理）
 */

import dotenv from 'dotenv';
// 加载环境变量后再导入其他模块
dotenv.config();

import { Connection, PublicKey } from '@solana/web3.js';
import fs from 'fs-extra';
import path from 'node:path';
import logger from './core/logger';
import appConfig from './core/config';
import rpcService from './services/rpc_service';
import tokenValidator from './modules/analyzer/token_validator';
import poolMonitor from './modules/listener/pool_monitor';
import riskManager from './modules/risk/risk_manager';
import performanceMonitor from './modules/monitor/performance_monitor';
import apiServer from './api/server';
import { EventType } from './core/types';
import type { SystemEvent, PoolInfo } from './core/types';
import type { Service, RPCService, RiskManager, PerformanceMonitor } from './core/service';
import traderModule from './modules/trader/trader_module';

// 定义警报接口
interface Alert {
  message: string;
  level: string;
  metric: string;
  value: number;
  threshold: number;
}

// 类型断言
const asService = (obj: unknown): Service => obj as Service;
const asRPCService = (obj: unknown): RPCService => obj as RPCService;
const asRiskManager = (obj: unknown): RiskManager => obj as RiskManager;
const asPerformanceMonitor = (obj: unknown): PerformanceMonitor => obj as PerformanceMonitor;

// 程序名称
const MODULE_NAME = 'App';

// 系统状态常量
enum SystemStatus {
  INITIALIZING = 'initializing',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error'
}

// 是否处于仅监听模式
const LISTEN_ONLY_MODE = process.argv.includes('--listen-only') || 
                         process.env.LISTEN_ONLY === 'true';

/**
 * 应用程序类
 * 管理整个系统的生命周期
 * 
 * 【比喻解释】
 * 这就像一艘完整的渔船：
 * - 有明确的启航和返航流程（启动和关闭）
 * - 船上各系统相互配合工作（模块协调）
 * - 能应对各种海上状况（错误处理）
 * - 随时记录航行状态（状态管理）
 */
class Application {
  // 系统状态，初始为启动中
  // 就像渔船的航行状态指示牌
  private systemStatus: SystemStatus = SystemStatus.INITIALIZING;

  /**
   * 构造函数
   * 创建并初始化应用程序实例
   * 
   * 【比喻解释】
   * 这就像渔船的建造和下水过程：
   * - 安装必要的安全系统（进程处理器）
   * - 确保船体结构完整（初始化）
   * - 为首次航行做好准备（系统状态设置）
   * 
   * 【编程语法通俗翻译】
   * constructor = 建造仪式：创建这艘渔船的过程
   * this = 自己：指代这艘渔船自身
   */
  constructor() {
    // 设置进程退出处理
    // 就像安装船只紧急处理系统
    this.setupProcessHandlers();
    
    // 设置事件监听
    this.setupEventListeners();
  }

  /**
   * 设置进程处理器
   * 处理各种系统信号和异常情况
   * 
   * 【比喻解释】
   * 这就像渔船的安全预警系统：
   * - 接收紧急停船信号（SIGINT/SIGTERM）
   * - 处理引擎故障警报（未捕获异常）
   * - 记录所有异常情况（错误日志）
   * - 确保在任何情况下都能安全返航（优雅关闭）
   * 
   * 【编程语法通俗翻译】
   * process.on = 设置监听器：就像安装特定警报器，监听特定紧急情况
   * async () => = 紧急预案：收到信号后执行的一系列步骤
   */
  private setupProcessHandlers(): void {
    // 处理CTRL+C和其他终止信号
    // 就像处理"紧急返航"信号
    process.on('SIGINT', async () => {
      logger.info('收到SIGINT信号，正在优雅关闭...', MODULE_NAME);
      await this.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('收到SIGTERM信号，正在优雅关闭...', MODULE_NAME);
      await this.shutdown();
      process.exit(0);
    });

    // 处理未捕获的异常
    // 就像处理"船体意外损坏"警报
    process.on('uncaughtException', (error) => {
      logger.error('捕获到未处理的异常', MODULE_NAME, { error: error instanceof Error ? error.toString() : String(error) });
      this.setSystemStatus(SystemStatus.ERROR);
    });

    // 处理未处理的Promise拒绝
    // 就像处理"潜在隐患"警告
    process.on('unhandledRejection', (reason) => {
      logger.error('捕获到未处理的Promise拒绝', MODULE_NAME, { reason: reason instanceof Error ? reason.toString() : String(reason) });
    });
  }
  
  /**
   * 设置事件监听器
   * 处理系统内部事件
   */
  private setupEventListeners(): void {
    // 监听池子监控器的新池子事件
    const poolMonitorObj = asService(poolMonitor);
    const traderModuleObj = asService(traderModule);
    const performanceMonitorObj = asService(performanceMonitor);

    if (poolMonitorObj.on && traderModuleObj.handleNewPool) {
      poolMonitorObj.on('newPool', (poolInfo: PoolInfo) => {
        traderModuleObj.handleNewPool?.(poolInfo);
      });
    }
    
    // 监听系统事件
    if (traderModuleObj.on) {
      traderModuleObj.on('event', (event: SystemEvent) => {
        // 处理交易模块发出的事件
        switch (event.type) {
          case EventType.TRADE_EXECUTED:
            // 交易执行事件
            logger.info('交易已执行', MODULE_NAME, { event });
            break;
            
          case EventType.POSITION_UPDATED:
            // 持仓更新事件
            logger.info('持仓已更新', MODULE_NAME, { event });
            break;
            
          case EventType.ERROR_OCCURRED:
            // 错误事件
            logger.error('发生错误', MODULE_NAME, { event });
            break;
        }
      });
    }
    
    // 监听性能监控系统警报
    if (performanceMonitorObj.on) {
      performanceMonitorObj.on('alert', (alert: Alert) => {
        logger.warn(`性能警报: ${alert.message}`, MODULE_NAME, {
          level: alert.level,
          metric: alert.metric,
          value: alert.value,
          threshold: alert.threshold
        });
      });
    }
  }

  /**
   * 启动应用程序
   */
  async start(): Promise<void> {
    try {
      this.setSystemStatus(SystemStatus.STARTING);
      logger.info('正在启动Solana MEV机器人...', MODULE_NAME);
      
      if (LISTEN_ONLY_MODE) {
        logger.info('仅监听模式已启用 - 只会监听新池子/代币，不会执行交易', MODULE_NAME);
      }
      
      // 初始化和启动各系统模块
      await this.initializeModules();
      
      // 启动业务逻辑
      await this.startBusinessLogic();
      
      this.setSystemStatus(SystemStatus.RUNNING);
      logger.info('Solana MEV机器人启动完成', MODULE_NAME);
    } catch (error) {
      this.setSystemStatus(SystemStatus.ERROR);
      logger.error('启动失败', MODULE_NAME, error);
      throw error;
    }
  }

  /**
   * 优雅关闭应用程序
   * 按相反顺序停止所有系统模块
   * 
   * 【比喻解释】
   * 这就像渔船的返航程序：
   * - 有序收起各种设备（按顺序关闭模块）
   * - 确保所有系统安全关闭（状态检查）
   * - 最终安全停泊（完成关闭）
   * 
   * @returns {Promise<void>} - 关闭完成的信号
   */
  async shutdown(): Promise<void> {
    try {
      this.setSystemStatus(SystemStatus.STOPPING);
      logger.info('正在关闭Solana MEV机器人...', MODULE_NAME);
      
      // 关闭各个模块
      const serviceModules = [
        poolMonitor,
        traderModule,
        performanceMonitor,
        apiServer
      ];
      
      for (const service of serviceModules) {
        const serviceObj = asService(service);
        if (serviceObj.start) {
          try {
            await serviceObj.start();
            logger.info(`已关闭服务: ${service.constructor.name}`, MODULE_NAME);
          } catch (error) {
            logger.error(`关闭服务失败: ${service.constructor.name}`, MODULE_NAME, error);
          }
        }
      }
      
      this.setSystemStatus(SystemStatus.STOPPED);
      logger.info('Solana MEV机器人已关闭', MODULE_NAME);
    } catch (error) {
      this.setSystemStatus(SystemStatus.ERROR);
      logger.error('关闭失败', MODULE_NAME, error);
      throw error;
    }
  }

  /**
   * 设置系统状态
   * 更新系统当前运行状态
   * 
   * 【比喻解释】
   * 这就像更新船只航行状态旗帜：
   * - 清晰标识当前状态（设置新状态）
   * - 通知所有船员（记录日志）
   * - 可能触发相应的操作程序（未来可添加状态变化响应）
   * 
   * @param {SystemStatus} status - 新的系统状态
   */
  private setSystemStatus(status: SystemStatus): void {
    // 记录状态变化
    const previousStatus = this.systemStatus;
    this.systemStatus = status;
    
    // 日志记录状态变化
    if (previousStatus !== status) {
      logger.info('系统状态变化', MODULE_NAME, {
        from: previousStatus,
        to: status
      });
    }
    
    // 这里可以添加状态变化的响应逻辑
    // 例如在状态变为ERROR时发送通知
  }

  /**
   * 获取当前系统状态
   * 
   * @returns {SystemStatus} - 当前系统状态
   */
  getSystemStatus(): SystemStatus {
    return this.systemStatus;
  }

  /**
   * 初始化系统模块
   * 按顺序初始化各个功能模块
   */
  private async initializeModules(): Promise<void> {
    try {
      logger.info('开始初始化系统模块...', MODULE_NAME);

      // 检查RPC连接
      const rpcServiceObj = asService(rpcService);
      if (rpcServiceObj.isConnectionHealthy) {
        const isHealthy = await rpcServiceObj.isConnectionHealthy();
        if (!isHealthy) {
          throw new Error('RPC连接不健康');
        }
        logger.info('RPC服务连接正常', MODULE_NAME);
      }

      // 启动其他服务
      const riskManagerObj = asService(riskManager);
      if (riskManagerObj.start) {
        await riskManagerObj.start();
        logger.info('风险管理器启动完成', MODULE_NAME);
      }

      const performanceMonitorObj = asService(performanceMonitor);
      if (performanceMonitorObj.start) {
        await performanceMonitorObj.start();
        logger.info('性能监控器启动完成', MODULE_NAME);
      }

      // 启动池子监控器
      const poolMonitorObj = asService(poolMonitor);
      if (poolMonitorObj.start) {
        await poolMonitorObj.start();
        logger.info('池子监控器启动完成', MODULE_NAME);
      }

      // 启动交易模块
      const traderModuleObj = asService(traderModule);
      if (traderModuleObj.start) {
        await traderModuleObj.start();
        logger.info('交易模块启动完成', MODULE_NAME);
      }

      // 启动API服务器
      const apiServerObj = asService(apiServer);
      if (apiServerObj.start) {
        await apiServerObj.start();
        logger.info('API服务器启动完成', MODULE_NAME);
      }

      logger.info('所有系统模块初始化完成', MODULE_NAME);
    } catch (error) {
      logger.error('系统模块初始化失败', MODULE_NAME, error);
      throw error;
    }
  }
  
  /**
   * 启动业务逻辑
   */
  private async startBusinessLogic(): Promise<void> {
    try {
      // 启动池子监控
      const poolMonitorObj = asService(poolMonitor);
      if (poolMonitorObj.startMonitoring) {
        await poolMonitorObj.startMonitoring();
        logger.info('池子监控已启动', MODULE_NAME);
      }

      // 启动交易模块
      const traderModuleObj = asService(traderModule);
      if (traderModuleObj.startTrading && !LISTEN_ONLY_MODE) {
        await traderModuleObj.startTrading();
        logger.info('交易模块已启动', MODULE_NAME);
      }

      // 启动性能监控
      const performanceMonitorObj = asService(performanceMonitor);
      if (performanceMonitorObj.startMonitoring) {
        await performanceMonitorObj.startMonitoring();
        logger.info('性能监控已启动', MODULE_NAME);
      }

      logger.info('所有业务逻辑已启动', MODULE_NAME);
    } catch (error) {
      logger.error('业务逻辑启动失败', MODULE_NAME, error);
      throw error;
    }
  }
}

// 创建应用实例
const app = new Application();

// 启动应用程序并处理错误
app.start().catch(error => {
  logger.error('应用程序启动失败', MODULE_NAME, { error: error instanceof Error ? error.toString() : String(error) });
  process.exit(1);
});

// 导出应用程序实例
// 方便其他模块引用
export default app; 