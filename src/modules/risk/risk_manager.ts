/**
 * 风险控制与资金管理系统（渔船安全与资源调度中心）
 * 负责管理交易风险，控制资金分配，确保系统安全运行
 * 
 * 【编程基础概念通俗比喻】
 * 1. 风险控制(Risk Management) = 渔船安全系统：
 *    就像渔船上的安全监测系统，确保航行和捕捞过程中的安全
 *    例如：isEmergencyStopped()就像检查是否开启了紧急停止信号
 *    
 * 2. 资金分配(Fund Allocation) = 渔获资源调度：
 *    就像渔船决定在每片渔场投入多少捕捞设备和人力
 *    例如：allocateFunds()就像船长决定在发现的鱼群上投入多少网具
 *    
 * 3. 风险等级(Risk Level) = 海域危险评级：
 *    就像渔民对不同海域危险程度的划分标准
 *    例如：RiskLevel.HIGH就像标记了"危险暗礁区"的海图
 *    
 * 4. 风险报告(Risk Report) = 海域安全评估：
 *    就像渔船出航前的海况和天气安全评估报告
 *    例如：generateRiskReport()就像航海专家综合各种因素做出的航行安全预测
 * 
 * 5. 紧急停止(Emergency Stop) = 紧急撤离信号：
 *    就像遇到风暴或危险时发出的全船撤离信号
 *    例如：triggerEmergencyStop()就像船长拉响的紧急警报
 * 
 * 【比喻解释】
 * 这个模块就像渔船上的安全与资源调度中心：
 * - 评估每片海域的危险等级（风险评估）
 * - 决定每次捕捞行动投入多少资源（资金分配）
 * - 设置捕捞行动的各种安全限制（交易限额）
 * - 记录每日的捕捞成果和资源消耗（统计数据）
 * - 保存危险海域的黑名单（代币黑名单）
 * - 在危险情况下可立即发出全船撤离信号（紧急停止）
 * - 确保整个渔船的捕捞活动安全且高效（系统安全）
 */

import { PublicKey } from '@solana/web3.js';
import logger from '../../core/logger.js';
import { 
  Position, 
  TokenInfo, 
  TradeResult, 
  TradingOpportunity 
} from '../../core/types.js';
import appConfig from '../../core/config.js';

// 模块名称
// 就像渔船安全中心的舱位编号
const MODULE_NAME = 'RiskManager';

/**
 * 风险级别枚举
 * 定义海域危险程度的评级标准
 * 
 * 【比喻解释】
 * 这就像渔民航海图上的危险等级标记：
 * - 非常低(VERY_LOW)：平静安全的浅海区，适合初学者
 * - 低(LOW)：微风平缓的海域，有经验的渔民可安全作业
 * - 中(MEDIUM)：有一定风浪的海域，需要警惕变化
 * - 高(HIGH)：风浪较大的危险区域，仅资深渔民可冒险
 * - 非常高(VERY_HIGH)：暴风雨或礁石密布区，建议所有船只避开
 */
export enum RiskLevel {
  VERY_LOW = 1,
  LOW = 2,
  MEDIUM = 3,
  HIGH = 4,
  VERY_HIGH = 5
}

/**
 * 交易限额配置接口
 * 定义捕捞活动的各种安全限制
 * 
 * 【比喻解释】
 * 这就像渔船的航行与捕捞安全手册：
 * - 最大日捕捞次数(maxDailyTrades)：每天最多下网次数
 * - 日投入上限(maxDailyInvestment)：每天最多投入的燃料和物资
 * - 单次投入上限(maxSingleTradeAmount)：单次捕捞行动的最大投入
 * - 单次投入下限(minSingleTradeAmount)：值得下网的最低资源投入
 * - 最大同时作业点(maxOpenPositions)：船队能同时照看的捕捞点数量
 * - 最大总风险敞口(maxTotalExposure)：船队能承受的总风险上限
 * - 单鱼种风险上限(maxExposurePerToken)：对单一鱼种的风险承受上限
 * - 紧急撤离阈值(emergencyStopLoss)：触发全船紧急撤离的损失百分比
 */
export interface TradingLimits {
  maxDailyTrades: number;           // 每日最大交易次数
  maxDailyInvestment: number;       // 每日最大投资金额(USD)
  maxSingleTradeAmount: number;     // 单笔最大交易金额(USD)
  minSingleTradeAmount: number;     // 单笔最小交易金额(USD)
  maxOpenPositions: number;         // 最大同时持仓数量
  maxTotalExposure: number;         // 最大总风险敞口(USD)
  maxExposurePerToken: number;      // 单个代币最大风险敞口(USD)
  emergencyStopLoss: number;        // 紧急止损阈值(%)
}

/**
 * 风险评分标准接口
 * 定义评估海域危险程度的各项指标权重
 * 
 * 【比喻解释】
 * 这就像渔船评估海域安全性的专业标准：
 * - 深度与水流(liquidityWeight)：海域深度和水流强度的重要性
 * - 风浪程度(volatilityWeight)：海域风浪变化剧烈程度的影响
 * - 海域历史(ageWeight)：该海域被发现和使用的时间长短
 * - 海域规模(marketCapWeight)：整体渔场规模大小的参考价值
 * - 同行数量(holderCountWeight)：该海域有多少渔船在作业
 * - 基础设施(devActivityWeight)：海域周边的港口和补给设施完善度
 * - 渔民反馈(socialMediaWeight)：其他渔民对该海域的评价和建议
 */
export interface RiskScoringCriteria {
  liquidityWeight: number;          // 流动性权重
  volatilityWeight: number;         // 波动性权重
  ageWeight: number;                // 代币年龄权重
  marketCapWeight: number;          // 市值权重
  holderCountWeight: number;        // 持有人数量权重
  devActivityWeight: number;        // 开发活动权重
  socialMediaWeight: number;        // 社交媒体权重
}

/**
 * 风险报告接口
 * 定义一份完整的海域安全评估报告结构
 * 
 * 【比喻解释】
 * 这就像出航前的综合安全评估报告：
 * - 总体风险(overallRisk)：综合所有因素的最终安全等级
 * - 鱼种风险(tokenRisk)：目标鱼类的危险性评估（有毒、稀有等）
 * - 市场风险(marketRisk)：销售市场的稳定性和风险评估
 * - 环境风险(liquidityRisk)：海域环境条件对捕捞的影响
 * - 投入风险(exposureRisk)：投入资源面临损失的可能性
 * - 详细数据(details)：各项具体指标的详细数据
 * - 时间戳(timestamp)：报告生成的准确时间
 * - 建议行动(recommendation)：专业人员给出的操作建议
 */
export interface RiskReport {
  overallRisk: RiskLevel;           // 总体风险级别
  tokenRisk: RiskLevel;             // 代币风险级别
  marketRisk: RiskLevel;            // 市场风险级别
  liquidityRisk: RiskLevel;         // 流动性风险级别
  exposureRisk: RiskLevel;          // 敞口风险级别
  details: {                        // 详细信息
    [key: string]: number | string;
  };
  timestamp: number;                // 时间戳
  recommendation: string;           // 建议
}

/**
 * 资金分配结果接口
 * 定义资源调度决策的结果信息
 * 
 * 【比喻解释】
 * 这就像船长做出的资源分配决定书：
 * - 是否批准(approved)：是否同意在此海域进行捕捞
 * - 分配资源(allocatedAmount)：分配给此次行动的资源量
 * - 最大限额(maxAmount)：可以分配的最大资源上限
 * - 剩余日配额(remainingDailyBudget)：今日剩余可用资源
 * - 剩余总配额(remainingTotalBudget)：整体剩余可用资源
 * - 决策原因(reason)：做出此决定的具体原因说明
 */
export interface AllocationResult {
  approved: boolean;                // 是否批准
  allocatedAmount: number;          // 分配金额(USD)
  maxAmount: number;                // 最大允许金额(USD)
  remainingDailyBudget: number;     // 剩余日预算(USD)
  remainingTotalBudget: number;     // 剩余总预算(USD)
  reason: string;                   // 原因
}

/**
 * 每日交易统计接口
 * 定义每日捕捞活动的统计数据结构
 * 
 * 【比喻解释】
 * 这就像渔船的每日航行日志：
 * - 日期(date)：记录的具体日期
 * - 捕捞次数(tradeCount)：今日下网总次数
 * - 总投入(totalInvested)：今日投入的总资源
 * - 成功次数(successfulTrades)：有收获的捕捞次数
 * - 失败次数(failedTrades)：空网而归的次数
 * - 利润(profit)：今日总收益（减去成本）
 */
export interface DailyStats {
  date: string;                     // 日期(YYYY-MM-DD)
  tradeCount: number;               // 交易次数
  totalInvested: number;            // 总投资金额(USD)
  successfulTrades: number;         // 成功交易次数
  failedTrades: number;             // 失败交易次数
  profit: number;                   // 利润(USD)
}

/**
 * 风险控制与资金管理系统类
 * 负责控制交易风险和资金分配
 * 
 * 【比喻解释】
 * 这就像渔船上的安全与资源调度中心：
 * - 制定安全航行的各项规章制度（风险控制规则）
 * - 维护危险海域的黑名单地图（代币黑名单）
 * - 根据天气和海况发出预警或紧急信号（风险监控）
 * - 记录每日捕捞成果和资源消耗（统计数据）
 * - 为每次捕捞行动分配合理资源（资金分配）
 * - 定期评估不同海域的安全等级（风险评估）
 * - 确保整个船队在安全范围内高效作业（系统安全）
 * 
 * 【编程语法通俗翻译】
 * class = 专业部门：一个有组织的专业团队，负责特定职责
 * private = 内部资料：只有部门内部才能查看和使用的资料
 * export = 公开服务：向船上其他部门提供的公开服务
 */
export class RiskManager {
  // 交易限额配置
  // 就像渔船的安全航行规章制度
  private tradingLimits: TradingLimits;
  
  // 风险评分标准
  // 就像评估海域安全的专业标准
  private scoringCriteria: RiskScoringCriteria;
  
  // 每日统计数据
  // 就像每日的航行和捕捞日志
  private dailyStats: Map<string, DailyStats> = new Map();
  
  // 风险报告缓存
  // 就像已评估过海域的安全报告存档
  private riskReportCache: Map<string, RiskReport> = new Map();
  
  // 紧急停止标志
  // 就像全船紧急撤离的警报开关
  private emergencyStop: boolean = false;
  
  // 黑名单代币
  // 就像危险海域的黑名单地图
  private blacklistedTokens: Set<string> = new Set();

  /**
   * 构造函数
   * 初始化风险控制系统并设置默认参数
   * 
   * 【比喻解释】
   * 这就像组建渔船安全与资源调度中心：
   * - 制定默认的安全航行规则（交易限额）
   * - 确立评估海域安全的专业标准（评分标准）
   * - 准备今日的航行日志表格（初始化统计）
   * - 加载已知危险海域的黑名单（黑名单加载）
   * - 确认安全中心已准备就绪（初始化完成）
   * 
   * 【编程语法通俗翻译】
   * constructor = 组建团队：招募人员并建立工作制度
   */
  constructor() {
    // 初始化默认交易限额
    // 就像设置渔船的安全航行规则
    this.tradingLimits = {
      maxDailyTrades: 20,
      maxDailyInvestment: 1000,
      maxSingleTradeAmount: 100,
      minSingleTradeAmount: 10,
      maxOpenPositions: 5,
      maxTotalExposure: 2000,
      maxExposurePerToken: 300,
      emergencyStopLoss: 15
    };
    
    // 初始化风险评分标准
    // 就像制定评估海域安全的标准
    this.scoringCriteria = {
      liquidityWeight: 0.25,
      volatilityWeight: 0.15,
      ageWeight: 0.15,
      marketCapWeight: 0.15,
      holderCountWeight: 0.1,
      devActivityWeight: 0.1,
      socialMediaWeight: 0.1
    };
    
    // 初始化当日统计
    // 就像准备今日的航行日志
    this.initializeDailyStats();
    
    // 加载黑名单
    // 就像更新危险海域地图
    this.loadBlacklist();
    
    logger.info('风险控制与资金管理系统初始化完成', MODULE_NAME);
  }
  
  /**
   * 初始化每日统计数据
   * 为新的一天创建统计记录
   * 
   * 【比喻解释】
   * 这就像每天早晨准备新的航行日志：
   * - 检查今天的日志是否已经准备好
   * - 如果没有，创建一个新的空白日志
   * - 记录日期并准备好各项统计栏目
   * - 确认日志已准备就绪可以使用
   * 
   * 【编程语法通俗翻译】
   * private = 内部流程：只有团队内部需要了解的工作步骤
   */
  private initializeDailyStats(): void {
    // 获取今天的日期字符串
    // 就像确认今天的日期
    const today = this.getDateString();
    
    // 检查今日统计是否已存在
    // 就像检查今天的日志是否已准备
    if (!this.dailyStats.has(today)) {
      // 创建新的统计记录
      // 就像准备一份新的航行日志
      this.dailyStats.set(today, {
        date: today,
        tradeCount: 0,
        totalInvested: 0,
        successfulTrades: 0,
        failedTrades: 0,
        profit: 0
      });
    }
    
    logger.debug('每日交易统计初始化完成', MODULE_NAME);
  }
  
  /**
   * 获取当前日期字符串(YYYY-MM-DD)
   * 生成标准格式的日期字符串
   * 
   * 【比喻解释】
   * 这就像查看今天的日历日期：
   * - 确认今天是几年几月几日
   * - 按照标准格式记录日期
   * - 确保月份和日期有两位数字
   * 
   * 【编程语法通俗翻译】
   * private = 内部工具：团队内部使用的日期处理工具
   */
  private getDateString(): string {
    // 获取当前日期
    // 就像看一眼日历
    const now = new Date();
    // 格式化为YYYY-MM-DD
    // 就像按标准格式记录日期
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  
  /**
   * 加载代币黑名单
   * 初始化危险代币的黑名单列表
   * 
   * 【比喻解释】
   * 这就像更新危险海域的黑名单地图：
   * - 从海图档案中加载已知的危险区域
   * - 标记有暗礁、漩涡或海盗的区域
   * - 确保所有船员都知道哪些区域要避开
   * - 记录黑名单海域的总数量
   * 
   * 【编程语法通俗翻译】
   * private = 内部操作：只有安全部门内部执行的数据加载
   */
  private loadBlacklist(): void {
    // 这里应该从配置或数据库加载黑名单
    // 简化示例:
    
    // 添加一些示例黑名单代币
    // 就像在地图上标记危险区域
    this.blacklistedTokens.add('FakeSolana1111111111111111111111111111111');
    this.blacklistedTokens.add('ScamToken22222222222222222222222222222222');
    
    logger.info(`已加载 ${this.blacklistedTokens.size} 个黑名单代币`, MODULE_NAME);
  }
  
  /**
   * 检查是否存在紧急停止状态
   * 查询系统当前是否处于紧急状态
   * 
   * 【比喻解释】
   * 这就像检查渔船是否处于紧急撤离状态：
   * - 查看紧急警报开关是否已被激活
   * - 返回当前的紧急状态标志
   * - 让其他系统了解是否可以继续正常作业
   * 
   * 【编程语法通俗翻译】
   * public = 公开查询：任何部门都可以随时查询的紧急状态
   * 
   * @returns 是否处于紧急停止状态，就像渔船是否处于紧急状态
   */
  public isEmergencyStopped(): boolean {
    return this.emergencyStop;
  }
  
  /**
   * 触发紧急停止
   * 激活系统的紧急停止机制
   * 
   * 【比喻解释】
   * 这就像拉响渔船的紧急警报：
   * - 激活全船紧急状态信号
   * - 记录触发紧急警报的原因
   * - 通知所有船员立即停止当前作业
   * - 准备通知船长和其他负责人
   * 
   * 【编程语法通俗翻译】
   * public = 公开权限：授权人员可以触发的紧急机制
   * 
   * @param reason 停止原因，就像触发紧急警报的具体危险情况
   */
  public triggerEmergencyStop(reason: string): void {
    // 设置紧急停止标志
    // 就像激活紧急警报系统
    this.emergencyStop = true;
    
    // 记录警告日志
    // 就像在航行日志中记录紧急情况
    logger.warn(`触发紧急停止: ${reason}`, MODULE_NAME);
    
    // 这里应该添加紧急通知逻辑
    // 例如发送邮件或短信通知
  }
  
  /**
   * 解除紧急停止状态
   * 取消系统的紧急状态，恢复正常运行
   * 
   * 【比喻解释】
   * 这就像解除渔船的紧急警报：
   * - 关闭紧急警报信号
   * - 通知全船恢复正常作业
   * - 在日志中记录紧急状态已解除
   * - 允许各系统恢复正常功能
   * 
   * 【编程语法通俗翻译】
   * public = 公开权限：授权人员可以解除的紧急状态
   */
  public clearEmergencyStop(): void {
    // 清除紧急停止标志
    // 就像关闭紧急警报
    this.emergencyStop = false;
    
    // 记录信息日志
    // 就像在航行日志中记录恢复正常
    logger.info('已解除紧急停止状态', MODULE_NAME);
  }
  
  /**
   * 验证是否可以交易
   * 根据当前状态和限制检查是否允许交易
   * 
   * 【比喻解释】
   * 这就像船长出航前的安全检查：
   * - 首先确认没有紧急警报（紧急停止）
   * - 检查今天的出航次数是否已达上限（交易次数）
   * - 确认当前持有的渔获数量是否超限（持仓数量）
   * - 评估当前的风险暴露程度是否安全（风险敞口）
   * - 根据多项安全检查做出是否允许出航的决定
   * 
   * 【编程语法通俗翻译】
   * public = 公开检查：任何系统出航前必须进行的安全检查
   * 
   * @param positions 当前持仓列表，就像船上当前储存的渔获
   * @returns 是否允许继续交易，就像是否允许出航捕鱼
   */
  public canTrade(positions: Position[]): boolean {
    // 检查紧急停止状态
    // 就像检查是否有紧急警报
    if (this.isEmergencyStopped()) {
      logger.warn('交易被禁止: 系统处于紧急停止状态', MODULE_NAME);
      return false;
    }
    
    // 检查今日交易次数限制
    // 就像检查今天的出航次数限制
    const today = this.getDateString();
    const stats = this.dailyStats.get(today);
    
    if (!stats) {
      this.initializeDailyStats();
      return true;
    }
    
    // 检查是否超过每日交易次数限制
    // 就像检查是否超过每日出航次数限制
    if (stats.tradeCount >= this.tradingLimits.maxDailyTrades) {
      logger.warn(`交易被禁止: 已达每日最大交易次数 ${this.tradingLimits.maxDailyTrades}`, MODULE_NAME);
      return false;
    }
    
    // 检查是否超过每日投资金额限制
    // 就像检查是否超过每日资源投入限制
    if (stats.totalInvested >= this.tradingLimits.maxDailyInvestment) {
      logger.warn(`交易被禁止: 已达每日最大投资金额 $${this.tradingLimits.maxDailyInvestment}`, MODULE_NAME);
      return false;
    }
    
    // 检查是否超过最大持仓数量限制
    // 就像检查是否超过最大同时作业点限制
    if (positions.length >= this.tradingLimits.maxOpenPositions) {
      logger.warn(`交易被禁止: 已达最大持仓数量 ${this.tradingLimits.maxOpenPositions}`, MODULE_NAME);
      return false;
    }
    
    // 检查总风险敞口
    // 就像检查总体风险暴露程度
    const totalExposure = this.calculateTotalExposure(positions);
    if (totalExposure >= this.tradingLimits.maxTotalExposure) {
      logger.warn(`交易被禁止: 总风险敞口过高 $${totalExposure.toFixed(2)}`, MODULE_NAME);
      return false;
    }
    
    // 全部检查通过
    // 就像安全检查全部通过
    return true;
  }
  
  /**
   * 计算当前总风险敞口
   * @param positions 持仓列表
   * @returns 总风险敞口(USD)
   */
  private calculateTotalExposure(positions: Position[]): number {
    let totalExposure = 0;
    
    for (const position of positions) {
      const price = position.currentPrice || position.avgBuyPrice || 0;
      const amount = Number(position.amount) / Math.pow(10, position.token.decimals || 0);
      totalExposure += price * amount;
    }
    
    return totalExposure;
  }
  
  /**
   * 计算代币风险评分
   * @param token 代币信息
   * @param opportunity 交易机会
   * @returns 风险评分(1-5，1最低风险)
   */
  public calculateTokenRisk(token: TokenInfo, opportunity: TradingOpportunity): RiskLevel {
    // 默认风险级别
    let riskScore = 3;
    
    // 检查是否黑名单代币
    if (this.blacklistedTokens.has(token.mint.toBase58())) {
      return RiskLevel.VERY_HIGH; // 黑名单代币直接判定为最高风险
    }
    
    // 应用各种风险评估标准
    
    // 1. 流动性风险
    const liquidityUsd = opportunity.liquidityUsd || 0;
    if (liquidityUsd > 100000) {
      riskScore -= 0.5; // 流动性高，风险降低
    } else if (liquidityUsd < 10000) {
      riskScore += 1; // 流动性低，风险增加
    }
    
    // 2. 代币年龄
    const tokenMetadata = token.metadata || {};
    const tokenCreatedAt = (tokenMetadata as any).createdAt || 0;
    const tokenAge = tokenCreatedAt ? (Date.now() - tokenCreatedAt) / (24 * 60 * 60 * 1000) : 0;
    if (tokenAge < 1) {
      riskScore += 1; // 新代币风险高
    } else if (tokenAge > 48) {
      riskScore -= 0.5; // 存在时间长风险较低
    }
    
    // 3. 价格影响
    const priceImpact = opportunity.estimatedSlippage || 0;
    if (priceImpact > 5) {
      riskScore += 0.5; // 价格影响大风险增加
    }
    
    // 4. 代币验证状态
    if (token.isVerified) {
      riskScore -= 1; // 已验证代币风险低
    }
    
    if (token.isBlacklisted) {
      riskScore += 2; // 黑名单代币高风险
    }
    
    // 确保评分在1-5范围内
    riskScore = Math.max(1, Math.min(5, riskScore));
    
    return Math.round(riskScore) as RiskLevel;
  }
  
  /**
   * 生成风险报告
   * 为特定代币和交易机会创建全面的风险评估报告
   * 
   * 【比喻解释】
   * 这就像渔船航海专家为一片新发现的渔场做安全评估：
   * - 先查看是否已经有这片海域的评估报告（检查缓存）
   * - 如果报告太旧需要重新评估（检查时效性）
   * - 仔细评估目标鱼种是否有毒或危险（代币风险）
   * - 分析当前海域的整体气候条件（市场风险）
   * - 检查水深水流等捕捞环境因素（流动性风险）
   * - 计算当前船队的总体风险水平（敞口风险）
   * - 根据所有因素计算整体安全等级（综合评估）
   * - 记录各项具体指标供船长参考（详细数据）
   * - 给出专业的操作建议（行动建议）
   * - 形成完整的安全评估报告（风险报告）
   * - 将报告存档以便将来查阅（缓存报告）
   * 
   * 【编程语法通俗翻译】
   * public = 公开服务：可供船上任何部门请求的专业评估
   * 
   * @param token 代币信息，就像目标鱼种的特征
   * @param opportunity 交易机会，就像发现的特定鱼群
   * @param positions 当前持仓，就像船上已有的渔获
   * @returns 风险报告，就像完整的海域安全评估报告
   */
  public generateRiskReport(token: TokenInfo, opportunity: TradingOpportunity, positions: Position[]): RiskReport {
    // 检查缓存中是否已有最近的风险报告
    // 就像查找是否已有这片海域的评估报告
    const cacheKey = token.mint.toString();
    const cachedReport = this.riskReportCache.get(cacheKey);
    
    // 如果缓存报告存在且不超过5分钟，直接返回
    // 就像如果有近期的评估报告就直接使用
    if (cachedReport && (Date.now() - cachedReport.timestamp < 5 * 60 * 1000)) {
      return cachedReport;
    }
    
    // 计算代币风险
    // 就像评估目标鱼种的安全性
    const tokenRisk = this.calculateTokenRisk(token, opportunity);
    
    // 计算市场风险
    // 就像评估整体海况和天气
    const marketRisk = this.calculateMarketRisk();
    
    // 计算流动性风险
    // 就像评估水深和洋流状况
    const liquidityRisk = this.calculateLiquidityRisk(opportunity);
    
    // 计算敞口风险
    // 就像评估船队当前承担的总体风险
    const exposureRisk = this.calculateExposureRisk(token, positions);
    
    // 计算整体风险
    // 就像综合所有因素确定总体安全等级
    const overallRisk = this.calculateOverallRisk(
      tokenRisk,
      marketRisk,
      liquidityRisk,
      exposureRisk
    );
    
    // 生成风险建议
    // 就像给出专业的操作建议
    const recommendation = this.generateRecommendation(overallRisk);
    
    // 创建详细信息对象
    // 就像记录各项具体指标
    const details: { [key: string]: number | string } = {
      'tokenAge': 0, // 无法获取代币创建时间，默认为0
      'liquidity': opportunity.liquidityUsd || 0,
      'confidence': opportunity.confidence,
      'totalExposure': this.calculateTotalExposure(positions),
      'openPositions': positions.length
    };
    
    // 创建完整的风险报告
    // 就像形成完整的安全评估报告
    const report: RiskReport = {
      overallRisk,
      tokenRisk,
      marketRisk,
      liquidityRisk,
      exposureRisk,
      details,
      timestamp: Date.now(),
      recommendation
    };
    
    // 缓存报告
    // 就像将报告存档以便将来查阅
    this.riskReportCache.set(cacheKey, report);
    
    return report;
  }
  
  /**
   * 计算市场风险
   * 评估当前整体市场状况的风险级别
   * 
   * 【比喻解释】
   * 这就像航海气象专家评估整体海况和天气：
   * - 查看天气预报和海况信息（市场数据）
   * - 分析风暴和洋流的变化趋势（市场趋势）
   * - 估算当前海域的总体安全级别（风险等级）
   * 
   * 【编程语法通俗翻译】
   * private = 内部方法：专业团队内部的评估技术
   * 
   * @returns 市场风险等级，就像海况安全评级
   */
  private calculateMarketRisk(): RiskLevel {
    // 这里应该有复杂的市场分析逻辑
    // 简化实现，返回中等风险
    return RiskLevel.MEDIUM;
  }
  
  /**
   * 计算流动性风险
   * 评估交易机会流动性相关的风险级别
   * 
   * 【比喻解释】
   * 这就像评估特定海域的水深和洋流状况：
   * - 检查水深是否足够船只安全通行（流动性规模）
   * - 分析洋流强度是否在可控范围内（价格影响）
   * - 确定这片海域整体的捕捞条件（安全等级）
   * 
   * 【编程语法通俗翻译】
   * private = 内部方法：专业团队内部的评估技术
   * 
   * @param opportunity 交易机会信息，就像特定海域的基础数据
   * @returns 流动性风险等级，就像海域条件的安全评级
   */
  private calculateLiquidityRisk(opportunity: TradingOpportunity): RiskLevel {
    const liquidity = opportunity.liquidityUsd || 0;
    
    if (liquidity >= 10000) {
      return RiskLevel.VERY_LOW;
    } else if (liquidity >= 5000) {
      return RiskLevel.LOW;
    } else if (liquidity >= 2000) {
      return RiskLevel.MEDIUM;
    } else if (liquidity >= 1000) {
      return RiskLevel.HIGH;
    } else {
      return RiskLevel.VERY_HIGH;
    }
  }
  
  /**
   * 计算敞口风险
   * 评估当前持仓对特定代币的风险敞口
   * 
   * 【比喻解释】
   * 这就像评估船队当前承担的风险水平：
   * - 检查船队有多少船只已经出海（持仓数量）
   * - 计算已经投入了多少资源（总体敞口）
   * - 分析对特定鱼种投入的资源（特定代币敞口）
   * - 判断当前风险水平是否在安全范围内（风险等级）
   * 
   * 【编程语法通俗翻译】
   * private = 内部方法：专业团队内部的评估技术
   * 
   * @param token 代币信息，就像特定鱼种信息
   * @param positions 当前持仓，就像当前船队状态
   * @returns 敞口风险等级，就像船队风险水平评级
   */
  private calculateExposureRisk(token: TokenInfo, positions: Position[]): RiskLevel {
    // 计算总敞口
    // 就像计算总投入资源
    const totalExposure = this.calculateTotalExposure(positions);
    
    // 计算对特定代币的敞口
    // 就像计算对特定鱼种的投入
    let tokenExposure = 0;
    for (const pos of positions) {
      if (pos.token.mint.toString() === token.mint.toString()) {
        const tokenValue = Number(pos.amount) * (pos.currentPrice || 0);
        tokenExposure += tokenValue;
      }
    }
    
    // 计算敞口比例
    // 就像计算资源分配比例
    const exposureRatio = totalExposure / this.tradingLimits.maxTotalExposure;
    const tokenExposureRatio = tokenExposure / this.tradingLimits.maxExposurePerToken;
    
    // 根据比例确定风险等级
    // 就像根据比例确定安全等级
    if (exposureRatio > 0.9 || tokenExposureRatio > 0.9) {
      return RiskLevel.VERY_HIGH;
    } else if (exposureRatio > 0.7 || tokenExposureRatio > 0.7) {
      return RiskLevel.HIGH;
    } else if (exposureRatio > 0.5 || tokenExposureRatio > 0.5) {
      return RiskLevel.MEDIUM;
    } else if (exposureRatio > 0.3 || tokenExposureRatio > 0.3) {
      return RiskLevel.LOW;
    } else {
      return RiskLevel.VERY_LOW;
    }
  }
  
  /**
   * 计算整体风险
   * 综合所有风险因素计算整体风险等级
   * 
   * 【比喻解释】
   * 这就像航海专家综合各方面因素评估出海安全性：
   * - 考虑目标鱼种的安全性（代币风险）
   * - 评估整体海况和天气（市场风险）
   * - 分析特定海域的水文条件（流动性风险）
   * - 考虑船队当前的疲劳程度（敞口风险）
   * - 取最严重的风险因素作为主要考量（取最大值）
   * - 综合各方面给出最终的安全等级（整体风险）
   * 
   * 【编程语法通俗翻译】
   * private = 内部方法：专业团队内部的综合评估技术
   * 
   * @param tokenRisk 代币风险，就像鱼种安全风险
   * @param marketRisk 市场风险，就像整体海况风险
   * @param liquidityRisk 流动性风险，就像水文条件风险
   * @param exposureRisk 敞口风险，就像船队疲劳风险
   * @returns 整体风险等级，就像综合安全评级
   */
  private calculateOverallRisk(
    tokenRisk: RiskLevel,
    marketRisk: RiskLevel,
    liquidityRisk: RiskLevel,
    exposureRisk: RiskLevel
  ): RiskLevel {
    // 获取最高风险等级
    // 就像找出最危险的因素
    const maxRisk = Math.max(tokenRisk, marketRisk, liquidityRisk, exposureRisk);
    
    // 这里可以实现更复杂的综合评估逻辑
    // 简化实现，返回最高风险
    
    return maxRisk as RiskLevel;
  }
  
  /**
   * 生成风险建议
   * 根据风险等级提供相应的操作建议
   * 
   * 【比喻解释】
   * 这就像航海专家根据安全评估给船长的行动建议：
   * - 非常安全的海域，可以大胆捕捞（非常低风险）
   * - 较为安全但需注意的海域（低风险）
   * - 有一定风险需谨慎的海域（中等风险）
   * - 危险区域，建议减少投入或避开（高风险）
   * - 极度危险区域，强烈建议不要进入（非常高风险）
   * 
   * 【编程语法通俗翻译】
   * private = 内部方法：专家团队内部的建议形成过程
   * 
   * @param riskLevel 风险等级，就像海域安全等级
   * @returns 操作建议，就像给船长的行动建议
   */
  private generateRecommendation(riskLevel: RiskLevel): string {
    switch (riskLevel) {
      case RiskLevel.VERY_LOW:
        return '风险非常低，适合大额交易';
      case RiskLevel.LOW:
        return '风险较低，可以考虑适量交易';
      case RiskLevel.MEDIUM:
        return '风险中等，建议谨慎投资，控制金额';
      case RiskLevel.HIGH:
        return '风险较高，建议减少投资金额或观望';
      case RiskLevel.VERY_HIGH:
        return '风险非常高，强烈建议避免交易';
      default:
        return '无法评估风险，请手动判断';
    }
  }
  
  /**
   * 分配资金
   * 为交易机会分配合适的投资金额
   * 
   * 【比喻解释】
   * 这就像渔船船长决定在新发现的渔场投入多少资源：
   * - 先让安全专家评估这片海域的风险（获取风险报告）
   * - 检查渔船剩余的燃料和设备（检查可用资金）
   * - 考虑今天已经消耗了多少资源（检查每日配额）
   * - 查看船上已经装了多少渔获（检查持仓情况）
   * - 根据风险等级决定投入的安全额度（根据风险分配）
   * - 确保不超过船长设定的单次投入上限（检查单笔上限）
   * - 如果风险太高，可能决定完全不去这片海域（风险拒绝）
   * - 记录最终的资源分配方案（创建结果）
   * - 向船长报告详细的分配依据（返回分配结果）
   * 
   * 【编程语法通俗翻译】
   * public = 公开服务：船上任何部门都可以请求的资源分配服务
   * 
   * @param token 代币信息，就像目标鱼种的特征
   * @param opportunity 交易机会，就像发现的特定鱼群
   * @param positions 当前持仓，就像船上已有的渔获
   * @returns 资金分配结果，就像资源分配方案
   */
  public allocateFunds(token: TokenInfo, opportunity: TradingOpportunity, positions: Position[]): AllocationResult {
    // 生成风险报告
    // 就像获取安全专家的海域评估
    const riskReport = this.generateRiskReport(token, opportunity, positions);
    
    // 默认拒绝并设置0资金
    // 就像默认谨慎，不进入未评估的海域
    let approved = false;
    let allocatedAmount = 0;
    let maxAmount = this.tradingLimits.maxSingleTradeAmount;
    let reason = '默认安全策略：需要评估后才能分配资金';
    
    // 检查紧急停止状态
    // 就像检查是否发出了全船禁止出海的信号
    if (this.emergencyStop) {
      return {
        approved: false,
        allocatedAmount: 0,
        maxAmount: 0,
        remainingDailyBudget: this.getRemainingDailyBudget(),
        remainingTotalBudget: this.tradingLimits.maxTotalExposure - this.calculateTotalExposure(positions),
        reason: '系统处于紧急停止状态，禁止所有交易'
      };
    }
    
    // 检查持仓数量限制
    // 就像检查船上还有没有空间存放新渔获
    if (positions.length >= this.tradingLimits.maxOpenPositions) {
      return {
        approved: false,
        allocatedAmount: 0,
        maxAmount: 0,
        remainingDailyBudget: this.getRemainingDailyBudget(),
        remainingTotalBudget: this.tradingLimits.maxTotalExposure - this.calculateTotalExposure(positions),
        reason: '已达到最大持仓数量限制'
      };
    }
    
    // 根据风险等级分配资金
    // 就像根据海域安全等级决定投入多少资源
    switch (riskReport.overallRisk) {
      case RiskLevel.VERY_LOW:
        approved = true;
        allocatedAmount = this.tradingLimits.maxSingleTradeAmount;
        reason = '非常低风险，分配最大允许金额';
        break;
      case RiskLevel.LOW:
        approved = true;
        allocatedAmount = this.tradingLimits.maxSingleTradeAmount * 0.75;
        reason = '低风险，分配75%最大允许金额';
        break;
      case RiskLevel.MEDIUM:
        approved = true;
        allocatedAmount = this.tradingLimits.maxSingleTradeAmount * 0.5;
        reason = '中等风险，分配50%最大允许金额';
        break;
      case RiskLevel.HIGH:
        approved = true;
        allocatedAmount = this.tradingLimits.maxSingleTradeAmount * 0.25;
        reason = '高风险，分配25%最大允许金额';
        break;
      case RiskLevel.VERY_HIGH:
        approved = false;
        allocatedAmount = 0;
        reason = '风险极高，拒绝分配资金';
        break;
    }
    
    // 检查最小交易金额
    // 就像确认资源投入是否值得一次出海
    if (allocatedAmount < this.tradingLimits.minSingleTradeAmount) {
      approved = false;
      allocatedAmount = 0;
      reason = '分配金额低于最小交易金额限制';
    }
    
    // 检查每日预算
    // 就像检查今日剩余的可用燃料
    const remainingDailyBudget = this.getRemainingDailyBudget();
    if (allocatedAmount > remainingDailyBudget) {
      allocatedAmount = remainingDailyBudget;
      reason += '，但受每日预算限制调整';
      
      // 如果调整后低于最小交易金额，则拒绝
      // 就像如果剩余燃料不足以支持有效捕捞，就取消行动
      if (allocatedAmount < this.tradingLimits.minSingleTradeAmount) {
        approved = false;
        allocatedAmount = 0;
        reason = '每日预算不足，剩余金额低于最小交易金额限制';
      }
    }
    
    // 检查总风险敞口
    // 就像检查整个船队的安全承受能力
    const totalExposure = this.calculateTotalExposure(positions);
    const remainingTotalBudget = this.tradingLimits.maxTotalExposure - totalExposure;
    
    if (allocatedAmount > remainingTotalBudget) {
      allocatedAmount = remainingTotalBudget;
      reason += '，但受总风险敞口限制调整';
      
      // 如果调整后低于最小交易金额，则拒绝
      // 就像如果剩余安全承受能力不足，就取消行动
      if (allocatedAmount < this.tradingLimits.minSingleTradeAmount) {
        approved = false;
        allocatedAmount = 0;
        reason = '总风险敞口接近上限，剩余空间低于最小交易金额限制';
      }
    }
    
    // 创建并返回分配结果
    // 就像形成最终的资源分配方案
    return {
      approved,
      allocatedAmount: Math.floor(allocatedAmount * 100) / 100, // 保留两位小数
      maxAmount,
      remainingDailyBudget,
      remainingTotalBudget,
      reason
    };
  }
  
  /**
   * 获取每日剩余预算
   * 计算今日还能使用的资金额度
   * 
   * 【比喻解释】
   * 这就像计算渔船今日还剩多少可用燃料：
   * - 获取今日的航行记录（获取今日统计）
   * - 查看船长设定的每日燃料限额（每日预算上限）
   * - 减去已经消耗的燃料量（已投资金额）
   * - 计算出剩余的可用燃料（剩余预算）
   * 
   * 【编程语法通俗翻译】
   * private = 内部计算：团队内部的资源计算方法
   * 
   * @returns 每日剩余预算，就像今日剩余可用燃料
   */
  private getRemainingDailyBudget(): number {
    // 初始化/更新每日统计
    // 就像确保今日的航行记录已准备好
    this.initializeDailyStats();
    
    // 获取今日统计
    // 就像查看今日的航行记录
    const today = this.getDateString();
    const stats = this.dailyStats.get(today);
    
    if (!stats) {
      // 这种情况不应该发生，因为initializeDailyStats会确保存在
      // 就像航行记录意外丢失时的应急措施
      logger.error('无法获取今日交易统计', MODULE_NAME);
      return 0;
    }
    
    // 计算剩余预算
    // 就像计算剩余可用燃料
    const remaining = Math.max(0, this.tradingLimits.maxDailyInvestment - stats.totalInvested);
    
    return remaining;
  }
  
  /**
   * 记录交易结果
   * @param result 交易结果
   * @param amount 交易金额(USD)
   */
  public recordTradeResult(result: TradeResult, amount: number): void {
    const today = this.getDateString();
    let stats = this.dailyStats.get(today);
    
    if (!stats) {
      this.initializeDailyStats();
      stats = this.dailyStats.get(today)!;
    }
    
    // 更新统计数据
    stats.tradeCount++;
    stats.totalInvested += amount;
    
    if (result.success) {
      stats.successfulTrades++;
      // 如果有利润数据，也可以累加
      if (result.price) {
        // 简化处理，实际应该基于买入卖出计算利润
      }
    } else {
      stats.failedTrades++;
    }
    
    // 更新统计数据
    this.dailyStats.set(today, stats);
    
    logger.debug('已记录交易结果', MODULE_NAME, {
      success: result.success,
      amount,
      dailyTotal: stats.totalInvested
    });
    
    // 检查是否需要紧急止损
    this.checkEmergencyConditions(stats);
  }
  
  /**
   * 检查是否触发紧急条件
   * @param stats 每日统计数据
   */
  private checkEmergencyConditions(stats: DailyStats): void {
    // 检查失败率
    if (stats.tradeCount > 5 && stats.failedTrades / stats.tradeCount > 0.5) {
      this.triggerEmergencyStop('交易失败率过高，超过50%');
    }
    
    // 检查亏损率
    if (stats.profit < 0 && Math.abs(stats.profit) / stats.totalInvested > this.tradingLimits.emergencyStopLoss / 100) {
      this.triggerEmergencyStop(`日亏损率超过设定阈值${this.tradingLimits.emergencyStopLoss}%`);
    }
  }
  
  /**
   * 获取交易限额配置
   * @returns 交易限额配置
   */
  public getTradingLimits(): TradingLimits {
    return { ...this.tradingLimits };
  }
  
  /**
   * 更新交易限额配置
   * @param limits 新的限额配置
   */
  public updateTradingLimits(limits: Partial<TradingLimits>): void {
    this.tradingLimits = { ...this.tradingLimits, ...limits };
    
    logger.info('已更新交易限额配置', MODULE_NAME, {
      maxDailyTrades: this.tradingLimits.maxDailyTrades,
      maxDailyInvestment: this.tradingLimits.maxDailyInvestment,
      maxSingleTradeAmount: this.tradingLimits.maxSingleTradeAmount
    });
  }
  
  /**
   * 获取今日交易统计
   * @returns 今日统计数据
   */
  public getTodayStats(): DailyStats {
    const today = this.getDateString();
    let stats = this.dailyStats.get(today);
    
    if (!stats) {
      this.initializeDailyStats();
      stats = this.dailyStats.get(today)!;
    }
    
    return { ...stats };
  }
  
  /**
   * 检查代币是否在黑名单中
   * @param mintAddress 代币Mint地址
   * @returns 是否在黑名单中
   */
  public isBlacklisted(mintAddress: string | PublicKey): boolean {
    const mintString = typeof mintAddress === 'string' ? mintAddress : mintAddress.toBase58();
    return this.blacklistedTokens.has(mintString);
  }
  
  /**
   * 添加代币到黑名单
   * @param mintAddress 代币Mint地址
   * @param reason 添加原因
   */
  public addToBlacklist(mintAddress: string | PublicKey, reason: string): void {
    const mintString = typeof mintAddress === 'string' ? mintAddress : mintAddress.toBase58();
    
    this.blacklistedTokens.add(mintString);
    
    logger.info(`已将代币添加到黑名单: ${mintString}`, MODULE_NAME, { reason });
    
    // 这里可以添加持久化存储逻辑
  }
  
  /**
   * 从黑名单移除代币
   * @param mintAddress 代币Mint地址
   */
  public removeFromBlacklist(mintAddress: string | PublicKey): void {
    const mintString = typeof mintAddress === 'string' ? mintAddress : mintAddress.toBase58();
    
    const removed = this.blacklistedTokens.delete(mintString);
    
    if (removed) {
      logger.info(`已从黑名单移除代币: ${mintString}`, MODULE_NAME);
      
      // 这里可以添加持久化存储逻辑
    }
  }
}

// 导出单例实例
const riskManager = new RiskManager();
export default riskManager; 