/**
 * 数据分析与报告系统（渔船航行日志与捕获分析中心）
 * 负责收集交易数据，生成分析报告，提供决策支持
 *
 * 【编程基础概念通俗比喻】
 * 1. 数据分析(Data Analysis) = 渔获记录整理:
 *    就像渔船船长整理每天的捕鱼记录，分析哪些渔场产量高
 *    例如：analyzeMarketTrend()就像分析近期哪片海域鱼群最活跃
 *
 * 2. 报告生成(Report Generation) = 航海日志总结:
 *    就像定期汇总航行记录，记录捕获情况和渔场条件
 *    例如：generateReport()就像编写一份完整的捕鱼季报告
 *
 * 3. 交易记录(Trade Record) = 单次捕鱼记录:
 *    记录每次下网的具体情况，包括位置、时间和捕获量
 *    例如：TradeRecord就像一页渔获日记，记录何时何地捕到何种鱼
 *
 * 4. 绩效评估(Performance Evaluation) = 渔场产量评估:
 *    评价不同渔场和捕鱼方法的效果
 *    例如：TokenPerformance就像不同海域的鱼类丰产程度记录
 *
 * 5. 趋势分析(Trend Analysis) = 洋流和鱼群动向预测:
 *    分析捕鱼数据找出规律，预测未来的捕获机会
 *    例如：MarketTrend就像海洋季节性变化图表
 *
 * 【比喻解释】
 * 这个模块就像渔船上的航海记录室：
 * - 记录每次捕鱼行动的过程和结果(记录交易)
 * - 分析不同渔场(代币)的产量情况(绩效分析)
 * - 评估不同捕鱼方法(交易策略)的效果(策略评估)
 * - 研究海洋变化趋势，预测鱼群动向(市场趋势分析)
 * - 为船长提供下一步航行建议(生成决策报告)
 */
import { EventEmitter } from 'node:events';
import { TokenInfo } from '../../core/types';
/**
 * 交易数据记录接口
 *
 * 【比喻解释】
 * 就像单次捕鱼行动的详细记录：
 * - 捕鱼行动编号和目标鱼种信息(id和代币信息)
 * - 下网时间、位置和使用的渔具(买入信息)
 * - 收网时间、捕获数量和品质(卖出信息)
 * - 此次出海的收益和成本计算(利润分析)
 * - 记录捕鱼过程中的特殊情况(交易笔记)
 */
export interface TradeRecord {
    id: string;
    tokenMint: string;
    tokenSymbol: string;
    tokenName: string;
    buyTimestamp: number;
    buyPrice: number;
    buyAmount: number;
    buyCost: number;
    sellTimestamp?: number;
    sellPrice?: number;
    sellAmount?: number;
    sellProceeds?: number;
    profit?: number;
    profitPercentage?: number;
    holdingTime?: number;
    status: 'open' | 'closed';
    executionLatency: number;
    strategy: string;
    reason: string;
    notes: string[];
}
/**
 * 代币绩效接口
 *
 * 【比喻解释】
 * 就像对特定鱼类或渔场的产出评估：
 * - 记录鱼类的基本信息(mint、symbol、name)
 * - 统计捕获该鱼种的次数和成功率(trades、successTrades)
 * - 计算平均和总体收益情况(avgProfit、totalProfit)
 * - 分析从捕获到售出的平均周期(avgHoldingTime)
 * - 记录最近一次的捕获时间(lastTrade)
 */
export interface TokenPerformance {
    mint: string;
    symbol: string;
    name: string;
    trades: number;
    successTrades: number;
    avgProfit: number;
    totalProfit: number;
    avgHoldingTime: number;
    lastTrade: number;
}
/**
 * 市场趋势分析接口
 *
 * 【比喻解释】
 * 就像海洋环境和鱼群活动分析报告：
 * - 记录分析的时间周期(period、startTime、endTime)
 * - 列出最丰产的鱼种(topPerformers)
 * - 统计总体捕鱼情况和成功率(totalTrades、successRate)
 * - 分析收益变化趋势(profitTrend)和捕获量变化(tradeVolume)
 * - 评估海况稳定程度(volatility)
 * - 提供海洋状况信号(signals)如涨潮、退潮等
 * - 给出未来捕鱼机会建议(opportunities)
 */
export interface MarketTrend {
    period: string;
    startTime: number;
    endTime: number;
    topPerformers: TokenPerformance[];
    totalTrades: number;
    successRate: number;
    avgProfit: number;
    profitTrend: number[];
    tradeVolume: number[];
    volatility: number;
    signals: {
        bullish: boolean;
        bearish: boolean;
        sideways: boolean;
        volatility: 'high' | 'normal' | 'low';
    };
    opportunities: string[];
}
/**
 * 策略性能评估接口
 *
 * 【比喻解释】
 * 就像对不同捕鱼方法的效果评估：
 * - 记录捕鱼方法的编号和名称(strategyId、name)
 * - 统计使用该方法的次数和成功率(trades、successRate)
 * - 分析平均收益和时长(avgProfit、avgHoldingTime)
 * - 评估风险与回报的比例(riskReturnRatio)
 * - 总结适合的海况条件(goodFor)和不足之处(weaknesses)
 * - 提出改进建议(improvement)
 */
export interface StrategyEvaluation {
    strategyId: string;
    name: string;
    trades: number;
    successRate: number;
    avgProfit: number;
    avgHoldingTime: number;
    riskReturnRatio: number;
    goodFor: string[];
    weaknesses: string[];
    improvement: string[];
}
/**
 * 分析报告接口
 *
 * 【比喻解释】
 * 就像一份完整的捕鱼季节总结报告：
 * - 记录报告生成时间和分析周期(generatedAt、period)
 * - 提供总体捕鱼情况概览(overview)
 * - 详细分析各类鱼种和捕鱼方法的效果(performance)
 * - 总结海洋环境变化趋势(marketAnalysis)
 * - 给出下一季捕鱼的策略和风险建议(recommendations)
 */
export interface AnalysisReport {
    generatedAt: number;
    period: {
        start: number;
        end: number;
        days: number;
    };
    overview: {
        totalTrades: number;
        successfulTrades: number;
        failedTrades: number;
        successRate: number;
        totalProfit: number;
        avgDailyProfit: number;
        bestTrade: {
            profit: number;
            token: string;
        };
        worstTrade: {
            profit: number;
            token: string;
        };
    };
    performance: {
        daily: {
            date: string;
            profit: number;
            trades: number;
        }[];
        byToken: TokenPerformance[];
        byStrategy: StrategyEvaluation[];
    };
    marketAnalysis: MarketTrend;
    recommendations: {
        tradingRecommendations: string[];
        strategyRecommendations: string[];
        riskManagementRecommendations: string[];
    };
}
/**
 * 数据分析系统配置接口
 *
 * 【比喻解释】
 * 就像航海记录系统的设置面板：
 * - 设定航海日志保存的期限(recordRetentionDays)
 * - 配置自动分析的频率(autoAnalysisInterval)
 * - 设置需要多少数据才能进行有效分析(minTradesForAnalysis)
 * - 安排定期报告的生成时间(reportGenerationTime)
 * - 决定是否永久保存捕鱼记录(persistData)
 * - 选择是否生成详细的分析报告(detailedReporting)
 */
export interface DataAnalysisConfig {
    recordRetentionDays: number;
    autoAnalysisInterval: number;
    minTradesForAnalysis: number;
    reportGenerationTime: string;
    persistData: boolean;
    detailedReporting: boolean;
}
/**
 * 数据分析与报告系统类
 *
 * 【比喻解释】
 * 这就像渔船上的航海记录与分析中心：
 * - 记录每次捕鱼行动的详细情况(记录交易)
 * - 分析不同鱼类的产量和价值(代币绩效)
 * - 评估各种捕鱼方法的效果(策略评估)
 * - 研究海洋环境变化和鱼群动向(市场趋势)
 * - 定期生成捕鱼报告指导决策(报告生成)
 * - 为船长提供下一步航行和捕鱼建议(提供建议)
 *
 * 【编程语法通俗翻译】
 * class = 专业部门：船上的一个功能完整的工作小组
 * private = 内部资料：只有部门内部才能查看的记录
 * extends = 扩展功能：在基础设施上增加的新功能
 */
export declare class DataAnalysisSystem extends EventEmitter {
    private config;
    private tradeRecords;
    private tokenPerformance;
    private strategyEvaluations;
    private latestMarketTrend;
    private latestReport;
    private analysisTimer;
    /**
     * 构造函数
     *
     * 【比喻解释】
     * 就像航海记录室的初始化准备：
     * - 准备记录本和分析工具(初始化配置)
     * - 确认记录本的格式和分类方式(设置默认配置)
     * - 检查是否有历史航海日志需要继续(加载历史数据)
     * - 向船长报告记录系统已准备就绪(日志记录)
     *
     * @param config 配置参数，就像记录系统的自定义设置
     */
    constructor(config?: Partial<DataAnalysisConfig>);
    /**
     * 启动分析系统
     *
     * 【比喻解释】
     * 就像开始定期整理航海日志和捕鱼记录：
     * - 设置定期分析的时间表(启动自动分析计时器)
     * - 立即进行一次完整的记录整理(立即执行一次分析)
     * - 通知船长分析系统已经开始工作(日志记录)
     */
    start(): void;
    /**
     * 停止分析系统
     *
     * 【比喻解释】
     * 就像暂停航海日志的整理工作：
     * - 取消预定的定期分析计划(清除定时器)
     * - 确认分析工作已经停止(重置计时器变量)
     * - 通知船长分析系统已经停止工作(日志记录)
     */
    stop(): void;
    /**
     * 加载历史数据
     *
     * 【比喻解释】
     * 就像检查并整理过去的航海日志：
     * - 确认航海记录存放的位置(检查数据目录)
     * - 如果是新船，创建全新的记录本(创建数据目录)
     * - 读取过往的捕鱼记录(加载交易记录)
     * - 清理过时的旧记录(清理过期数据)
     * - 重新计算渔获统计和趋势(重建性能指标)
     * - 向船长报告历史记录的恢复情况(日志记录)
     *
     * 【编程语法通俗翻译】
     * try/catch = 安全操作：像是小心翼翼地翻阅珍贵的航海日志
     */
    private loadData;
    /**
     * 保存数据到文件
     *
     * 【比喻解释】
     * 就像将船长的航海日志存档保存：
     * - 确认是否需要长期保存记录(检查配置)
     * - 确保记录本有安全的存放地点(检查目录)
     * - 整理并记录所有捕鱼情况(写入文件)
     * - 确认记录已安全存档(日志记录)
     */
    private saveData;
    /**
     * 清理过期数据
     */
    private cleanupOldData;
    /**
     * 重建性能数据
     */
    private rebuildPerformanceData;
    /**
     * 记录买入交易
     *
     * 【比喻解释】
     * 就像记录一次新的捕鱼行动开始：
     * - 为这次捕鱼行动创建唯一编号(生成交易ID)
     * - 记录目标鱼类、数量和成本(创建交易记录)
     * - 将这次行动记入航海日志(添加到记录列表)
     * - 确保记录被永久保存(保存数据)
     * - 向船长确认捕鱼记录已完成(日志记录)
     *
     * @param token 代币信息，就像目标鱼类信息
     * @param amount 数量，就像捕获数量
     * @param price 价格，就像每条鱼的价格
     * @param cost 成本，就像捕鱼行动总成本
     * @param strategy 策略，就像使用的捕鱼方法
     * @param latency 延迟，就像反应时间
     * @param reason 原因，就像选择该渔场的依据
     * @returns 交易ID，就像捕鱼行动的编号
     */
    recordBuy(token: TokenInfo, amount: number, price: number, cost: number, strategy: string, latency: number, reason: string): string;
    /**
     * 记录卖出交易
     *
     * 【比喻解释】
     * 就像记录一次捕鱼行动的完成和鱼获售卖：
     * - 查找对应的捕鱼行动记录(查找买入交易)
     * - 记录售卖时间、价格和获得的收入(更新交易记录)
     * - 计算这次捕鱼行动的利润(计算盈利)
     * - 记录从捕获到售卖的总时长(计算持仓时间)
     * - 更新该鱼种的产量统计(更新性能数据)
     * - 更新该捕鱼方法的效果评估(更新策略评估)
     * - 确保记录被永久保存(保存数据)
     * - 向船长报告捕鱼行动完成情况(日志记录)
     *
     * @param tradeId 交易ID，就像捕鱼行动编号
     * @param price 价格，就像售卖价格
     * @param amount 数量，就像售卖数量
     * @param proceeds 收益，就像售卖收入
     * @returns 是否成功记录，就像记录是否完成
     */
    recordSell(tradeId: string, price: number, amount: number, proceeds: number): boolean;
    /**
     * 添加交易笔记
     */
    addTradeNote(tradeId: string, note: string): boolean;
    /**
     * 更新代币绩效数据
     *
     * 【比喻解释】
     * 就像更新特定鱼种的捕获记录表：
     * - 只处理已经完成的捕鱼行动(检查是否已完成)
     * - 查找该鱼种的历史产量记录(获取现有绩效记录)
     * - 如果是首次捕获这种鱼，创建新的记录表(创建新记录)
     * - 增加捕获次数和记录最近捕获时间(更新基本统计)
     * - 统计成功的捕获次数(记录成功次数)
     * - 计算总收益和平均收益(更新利润数据)
     * - 计算平均储存周期(更新持仓时间)
     * - 保存更新后的记录(更新性能数据)
     *
     * @param record 交易记录，就像某次捕鱼的详细记录
     */
    private updateTokenPerformance;
    /**
     * 更新策略评估数据
     *
     * 【比喻解释】
     * 就像评估特定捕鱼方法的效果：
     * - 只分析已完成的捕鱼行动(检查是否已完成)
     * - 查找该捕鱼方法的历史评估记录(获取现有评估)
     * - 如果是首次使用这种方法，创建新的评估表(创建新记录)
     * - 增加使用该方法的次数(更新次数)
     * - 计算使用该方法的成功率(更新成功率)
     * - 分析平均收益和捕鱼周期(更新平均数据)
     * - 评估风险与回报的比例(更新风险回报比)
     * - 保存更新后的评估结果(更新评估数据)
     *
     * @param record 交易记录，就像某次捕鱼的详细记录
     */
    private updateStrategyEvaluation;
    /**
     * 执行周期性分析
     */
    private runPeriodicAnalysis;
    /**
     * 分析市场趋势
     * 分析最近交易数据，识别市场模式和趋势
     *
     * 【比喻解释】
     * 就像渔船的海洋学家分析近期海况和鱼群动向：
     * - 确认有足够的捕鱼记录可供分析(确认数据充足)
     * - 按时间顺序排列捕鱼记录(排序交易数据)
     * - 确定分析的时间范围(确定分析周期)
     * - 计算总体捕获效率和收益(计算总体指标)
     * - 跟踪收益和捕获量的变化趋势(收集趋势数据)
     * - 评估海况的稳定性(计算波动性指标)
     * - 判断是涨潮还是退潮，或是平静期(分析市场信号)
     * - 找出产量最高的鱼种(获取表现最好的代币)
     * - 提供下一步捕鱼建议(生成机会建议)
     * - 向船长汇报海况分析结果(日志记录)
     */
    private analyzeMarketTrend;
    /**
     * 计算趋势斜率
     * 使用简单线性回归计算斜率
     *
     * 【比喻解释】
     * 就像计算潮汐变化的方向和速度：
     * - 收集一系列的水位测量数据(数据点数组)
     * - 应用数学方法计算海平面变化趋势(线性回归计算)
     * - 确定潮水是在上涨还是退去(计算斜率)
     * - 如果数据有问题，给出合理预估(处理异常情况)
     *
     * @param data 数据点数组，就像一系列潮位测量值
     * @returns 趋势斜率，就像潮水变化的方向和速度
     */
    private calculateTrendSlope;
    /**
     * 生成分析报告
     *
     * 【比喻解释】
     * 就像编写一份完整的捕鱼季总结报告：
     * - 确保已经进行了海况分析(确认有市场趋势分析)
     * - 汇总所有完成的捕鱼记录(统计已完成交易)
     * - 计算成功率和总收益(计算成功率和利润)
     * - 找出最丰收和最糟糕的捕捞行动(查找最佳和最差交易)
     * - 按日期整理捕鱼成果(收集每日表现)
     * - 评估各种鱼类的产量情况(获取代币绩效)
     * - 分析不同捕鱼方法的效果(获取策略评估)
     * - 根据分析提出捕鱼建议(生成交易建议)
     * - 提出改进捕鱼策略的方法(生成策略建议)
     * - 提供风险防控措施(生成风险管理建议)
     * - 整合所有信息形成完整报告(构建分析报告)
     * - 将报告永久保存以供参考(保存报告)
     * - 通知船长报告已经完成(日志记录)
     */
    private generateReport;
    /**
     * 保存报告到文件
     */
    private saveReport;
    /**
     * 获取最新分析报告
     */
    getLatestReport(): AnalysisReport | null;
    /**
     * 获取代币绩效数据
     */
    getTokenPerformance(mintAddress?: string): TokenPerformance[] | TokenPerformance | null;
    /**
     * 获取策略评估数据
     */
    getStrategyEvaluation(strategyId?: string): StrategyEvaluation[] | StrategyEvaluation | null;
    /**
     * 获取市场趋势分析
     */
    getMarketTrend(): MarketTrend | null;
    /**
     * 获取交易记录
     */
    getTradeRecords(status?: 'open' | 'closed', startTime?: number, endTime?: number): TradeRecord[];
    /**
     * 获取交易统计数据
     */
    getTradeStatistics(): {
        total: number;
        open: number;
        closed: number;
        successful: number;
        failed: number;
        totalProfit: number;
        successRate: number;
        avgProfit: number;
    };
}
declare const dataAnalysisSystem: DataAnalysisSystem;
export default dataAnalysisSystem;
