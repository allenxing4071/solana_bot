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
import appConfig from './core/config';
import logger from './core/logger';
import { poolMonitor } from './modules/listener/pool_monitor';
import traderModule from './modules/trader/trader_module';
import { SystemStatus, EventType, SystemEvent } from './core/types';
import dataAnalysisSystem from './modules/analyzer/data_analysis_system';
import performanceMonitor from './modules/monitor/performance_monitor';

// 加载环境变量
// 就像出海前查看天气预报和海图
dotenv.config();

// 模块名称
// 就像渔船的识别标志
const MODULE_NAME = 'Main';

// 仅监听模式标志
// 就像设置"观察模式"，只观察鱼群不实际捕捞
const LISTEN_ONLY_MODE = process.argv.includes('--listen-only') || process.env.LISTEN_ONLY === 'true';

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
  private systemStatus: SystemStatus = SystemStatus.STARTING;

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
    poolMonitor.on('newPool', (poolInfo) => {
      // 将新池子事件转发给交易模块
      traderModule.handleNewPool(poolInfo);
    });
    
    // 监听系统事件
    traderModule.on('event', (event: SystemEvent) => {
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
    
    // 监听数据分析系统事件
    dataAnalysisSystem.on('analysisComplete', (result) => {
      logger.info('数据分析完成', MODULE_NAME, {
        timestamp: new Date(result.timestamp).toISOString(),
        reportGenerated: result.report !== null
      });
      
      // 可以在此处添加对分析结果的处理逻辑
    });
    
    // 监听性能监控系统警报
    performanceMonitor.on('alert', (alert) => {
      logger.warn(`性能警报: ${alert.message}`, MODULE_NAME, {
        level: alert.level,
        metric: alert.metric,
        value: alert.value,
        threshold: alert.threshold
      });
      
      // 可以在这里添加对性能警报的处理逻辑
    });
  }

  /**
   * 启动应用程序
   * 按顺序初始化并启动所有系统模块
   * 
   * 【比喻解释】
   * 这就像渔船的完整启航流程：
   * - 检查天气和海况（初始配置）
   * - 按顺序启动各个系统（监控器、交易模块）
   * - 确认所有系统正常工作（状态检查）
   * - 正式开始航行（设置运行状态）
   * - 向船员广播航行信息（日志记录）
   * 
   * 【编程语法通俗翻译】
   * async = 耐心等待：启航不是一蹴而就的，需要等待各系统准备就绪
   * try/catch = 安全航行：时刻警惕可能的危险，出现问题立即处理
   * await = 等待确认：某个操作完成后才能进行下一步
   * 
   * @returns {Promise<void>} - 启动完成的信号
   */
  async start(): Promise<void> {
    try {
      logger.info('=== 正在启动 Solana MEV 机器人 ===', MODULE_NAME);
      
      if (LISTEN_ONLY_MODE) {
        // 仅监听模式提示
        // 就像告诉船员"这次只是观察鱼群，不实际捕捞"
        logger.info('仅监听模式已启用 - 只会监听新池子/代币，不会执行交易', MODULE_NAME);
      }

      // 1. 设置系统状态
      // 就像改变船只航行状态旗帜为"准备中"
      this.setSystemStatus(SystemStatus.STARTING);

      // 2. 启动池子监听器
      // 就像启动鱼群探测雷达
      logger.info('正在启动池子监听器...', MODULE_NAME);
      await poolMonitor.start();
      logger.info('池子监听器启动成功', MODULE_NAME);
      
      // 3. 启动交易模块
      // 就像准备捕鱼网和绞盘
      logger.info('正在启动交易模块...', MODULE_NAME);
      await traderModule.start(!LISTEN_ONLY_MODE);
      logger.info('交易模块启动成功', MODULE_NAME, {
        executionEnabled: !LISTEN_ONLY_MODE
      });
      
      // 4. 启动性能监控系统
      // 就像启动船只状态监控系统
      logger.info('正在启动性能监控系统...', MODULE_NAME);
      performanceMonitor.start();
      logger.info('性能监控系统启动成功', MODULE_NAME);
      
      // 5. 启动数据分析系统
      // 就像启动数据分析和决策支持系统
      logger.info('正在启动数据分析系统...', MODULE_NAME);
      dataAnalysisSystem.start();
      logger.info('数据分析系统启动成功', MODULE_NAME);

      // 6. 设置系统状态为运行中
      // 就像宣布"船只已进入正常航行状态"
      this.setSystemStatus(SystemStatus.RUNNING);
      
      logger.info('=== Solana MEV 机器人启动完成 ===', MODULE_NAME);
      
    } catch (error) {
      // 处理启动过程中的错误
      logger.error('启动过程出错', MODULE_NAME, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      this.setSystemStatus(SystemStatus.ERROR);
      
      // 尝试关闭已启动的模块
      await this.shutdown();
      
      // 继续抛出错误，允许外部处理
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
    logger.info('正在关闭系统...', MODULE_NAME);
    
    // 设置系统状态为关闭中
    this.setSystemStatus(SystemStatus.STOPPING);
    
    try {
      // 按照与启动相反的顺序关闭各模块
      
      // 1. 关闭数据分析系统
      logger.info('正在关闭数据分析系统...', MODULE_NAME);
      dataAnalysisSystem.stop();
      
      // 2. 关闭性能监控系统
      logger.info('正在关闭性能监控系统...', MODULE_NAME);
      performanceMonitor.stop();
      
      // 3. 关闭交易模块
      logger.info('正在关闭交易模块...', MODULE_NAME);
      await traderModule.stop();
      
      // 4. 关闭池子监听器
      logger.info('正在关闭池子监听器...', MODULE_NAME);
      await poolMonitor.stop();
      
      // 设置系统状态为已停止
      this.setSystemStatus(SystemStatus.STOPPED);
      
      logger.info('系统已完全关闭', MODULE_NAME);
    } catch (error) {
      logger.error('系统关闭过程中出错', MODULE_NAME, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      // 即使出错，也将状态标记为已停止
      this.setSystemStatus(SystemStatus.STOPPED);
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
}

// 创建应用程序实例
const app = new Application();

// 启动应用程序
app.start().catch(error => {
  logger.error('应用程序启动失败，程序将退出', MODULE_NAME, {
    error: error instanceof Error ? error.message : String(error)
  });
  process.exit(1);
});

// 导出应用程序实例
// 方便其他模块引用
export default app; 