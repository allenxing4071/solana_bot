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
import { Position, TokenInfo, TradeResult, TradingOpportunity } from '../../core/types';
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
export declare enum RiskLevel {
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
    maxDailyTrades: number;
    maxDailyInvestment: number;
    maxSingleTradeAmount: number;
    minSingleTradeAmount: number;
    maxOpenPositions: number;
    maxTotalExposure: number;
    maxExposurePerToken: number;
    emergencyStopLoss: number;
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
    liquidityWeight: number;
    volatilityWeight: number;
    ageWeight: number;
    marketCapWeight: number;
    holderCountWeight: number;
    devActivityWeight: number;
    socialMediaWeight: number;
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
    overallRisk: RiskLevel;
    tokenRisk: RiskLevel;
    marketRisk: RiskLevel;
    liquidityRisk: RiskLevel;
    exposureRisk: RiskLevel;
    details: {
        [key: string]: number | string;
    };
    timestamp: number;
    recommendation: string;
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
    approved: boolean;
    allocatedAmount: number;
    maxAmount: number;
    remainingDailyBudget: number;
    remainingTotalBudget: number;
    reason: string;
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
    date: string;
    tradeCount: number;
    totalInvested: number;
    successfulTrades: number;
    failedTrades: number;
    profit: number;
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
export declare class RiskManager {
    private tradingLimits;
    private scoringCriteria;
    private dailyStats;
    private riskReportCache;
    private emergencyStop;
    private blacklistedTokens;
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
    constructor();
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
    private initializeDailyStats;
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
    private getDateString;
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
    private loadBlacklist;
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
    isEmergencyStopped(): boolean;
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
    triggerEmergencyStop(reason: string): void;
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
    clearEmergencyStop(): void;
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
    canTrade(positions: Position[]): boolean;
    /**
     * 计算当前总风险敞口
     * @param positions 持仓列表
     * @returns 总风险敞口(USD)
     */
    private calculateTotalExposure;
    /**
     * 计算代币风险评分
     * @param token 代币信息
     * @param opportunity 交易机会
     * @returns 风险评分(1-5，1最低风险)
     */
    calculateTokenRisk(token: TokenInfo, opportunity: TradingOpportunity): RiskLevel;
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
    generateRiskReport(token: TokenInfo, opportunity: TradingOpportunity, positions: Position[]): RiskReport;
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
    private calculateMarketRisk;
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
    private calculateLiquidityRisk;
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
    private calculateExposureRisk;
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
    private calculateOverallRisk;
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
    private generateRecommendation;
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
    allocateFunds(token: TokenInfo, opportunity: TradingOpportunity, positions: Position[]): AllocationResult;
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
    private getRemainingDailyBudget;
    /**
     * 记录交易结果
     * @param result 交易结果
     * @param amount 交易金额(USD)
     */
    recordTradeResult(result: TradeResult, amount: number): void;
    /**
     * 检查是否触发紧急条件
     * @param stats 每日统计数据
     */
    private checkEmergencyConditions;
    /**
     * 获取交易限额配置
     * @returns 交易限额配置
     */
    getTradingLimits(): TradingLimits;
    /**
     * 更新交易限额配置
     * @param limits 新的限额配置
     */
    updateTradingLimits(limits: Partial<TradingLimits>): void;
    /**
     * 获取今日交易统计
     * @returns 今日统计数据
     */
    getTodayStats(): DailyStats;
    /**
     * 检查代币是否在黑名单中
     * @param mintAddress 代币Mint地址
     * @returns 是否在黑名单中
     */
    isBlacklisted(mintAddress: string | PublicKey): boolean;
    /**
     * 添加代币到黑名单
     * @param mintAddress 代币Mint地址
     * @param reason 添加原因
     */
    addToBlacklist(mintAddress: string | PublicKey, reason: string): void;
    /**
     * 从黑名单移除代币
     * @param mintAddress 代币Mint地址
     */
    removeFromBlacklist(mintAddress: string | PublicKey): void;
}
declare const riskManager: RiskManager;
export default riskManager;
