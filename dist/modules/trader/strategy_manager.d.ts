/**
 * 交易策略管理器（渔船捕鱼策略指挥部）
 * 负责管理交易策略，决定何时买入和卖出，跟踪持仓状态
 *
 * 【编程基础概念通俗比喻】
 * 1. 策略管理器(Strategy Manager) = 渔船捕鱼策略总部：
 *    就像渔船上负责制定捕鱼计划的专业团队，决定在什么条件下出网捕鱼或收网返航
 *    例如：shouldBuy()就像渔长根据鱼探声纳的数据决定"这片海域值得下网"
 *
 * 2. 策略条件(Strategy Condition) = 捕鱼决策规则：
 *    就像渔船上"看到什么情况执行什么动作"的标准作业指南
 *    例如：takeProfit就像"当渔获可以卖到X价格时返航"的规则
 *
 * 3. 持仓(Position) = 船上的渔获储存仓：
 *    就像渔船上存放已捕获鱼类的特殊仓库，记录着每种鱼的数量和捕获信息
 *    例如：this.positions就像船上的渔获清单，记录着哪些鱼已经捕获
 *
 * 4. 价格历史(Price History) = 渔获价格日志：
 *    就像渔船记录的不同鱼类市场价格的历史变化表
 *    例如：priceHistory就像船长记录的"过去一周各类鱼的市场价格"的日志本
 *
 * 5. 止损(Stop Loss) = 紧急弃捕线：
 *    就像渔船预先设定的"如果渔获价值低于某个限度就立刻卖出"的保护措施
 *    例如：checkStopLoss()就像船员定期检查"这批鱼是否贬值到需要紧急处理"的程度
 *
 * 【比喻解释】
 * 这个模块就像渔船上的策略指挥部：
 * - 制定详细的"何时下网捕鱼"的规则（买入策略）
 * - 决定"何时将渔获送回港口销售"的时机（卖出策略）
 * - 记录船上所有已捕获的鱼类详情（持仓管理）
 * - 持续监控鱼市场价格变化并相应调整计划（价格追踪）
 * - 设置各种保护措施避免渔获价值大幅下降（止损机制）
 * - 在合适的时机自动发出"收网"或"下网"的指令（交易信号）
 */
import type { PublicKey } from '@solana/web3.js';
import { StrategyType } from '../../core/types';
import type { Position, TradingOpportunity, TradeResult, TokenInfo } from '../../core/types';
/**
 * 持仓管理接口
 * 定义管理船上渔获的标准操作
 *
 * 【比喻解释】
 * 这就像渔船上的渔获管理规程：
 * - 规定了如何记录新捕获的鱼（添加持仓）
 * - 说明了如何查询特定品种的库存（获取持仓）
 * - 定义了如何更新渔获信息（更新持仓）
 * - 描述了如何处理已售出的鱼类记录（移除持仓）
 * - 要求能够随时盘点所有船上渔获（获取全部持仓）
 */
interface PositionManager {
    addPosition(token: TokenInfo, amount: bigint, buyPrice: number, txInfo: TradeResult): Position;
    getPosition(mintAddress: string | PublicKey): Position | null;
    updatePosition(position: Position): void;
    removePosition(mintAddress: string | PublicKey): boolean;
    getAllPositions(): Position[];
}
/**
 * 出售决策结果接口
 * 描述是否应该卖出持仓的决策结果
 *
 * 【比喻解释】
 * 这就像渔船决定"是否将渔获送回港口销售"的分析报告：
 * - 明确指出是否应该现在卖出（shouldSell）
 * - 解释做出这个决定的原因（reason）
 * - 说明是哪条规则触发了决定（triggerType）
 * - 提供相关渔获的详细信息（position）
 * - 预估当前可以卖出的价格（sellPrice）
 * - 计算预期的利润（profit）和收益率（profitPercentage）
 */
interface SellDecision {
    shouldSell: boolean;
    reason?: string;
    triggerType?: StrategyType;
    position?: Position;
    sellPrice?: number;
    profit?: number;
    profitPercentage?: number;
}
/**
 * 交易策略管理器类
 * 负责管理交易策略和持仓状态
 *
 * 【比喻解释】
 * 这就像渔船上的捕鱼决策总部：
 * - 记录船上所有渔获的详细清单（持仓列表）
 * - 制定何时收网返航的各种规则（卖出条件）
 * - 持续记录各类鱼的市场价格变化（价格历史）
 * - 追踪每种鱼达到过的最高价格（最高价格记录）
 * - 根据市场行情和预设规则自动判断捕捞时机（买卖决策）
 * - 分析渔获价值变化并在适当时机发出警报（止盈止损）
 *
 * 【编程语法通俗翻译】
 * class = 专业部门：一个有组织有分工的船上工作部门
 * implements PositionManager = 遵循标准：按照渔获管理规程来操作
 * private = 内部数据：只有部门内部才能查看的记录和数据
 */
export declare class StrategyManager implements PositionManager {
    private positions;
    private sellConditions;
    private priceHistory;
    private highestPrices;
    /**
     * 构造函数
     * 初始化策略管理器并加载策略
     *
     * 【比喻解释】
     * 这就像组建渔船的策略决策部门：
     * - 先从航海手册中读取预设的捕鱼规则（加载策略）
     * - 准备好各种记录本和工作工具（初始化数据结构）
     * - 向船长报告决策部门已经准备就绪（记录日志）
     *
     * 【编程语法通俗翻译】
     * constructor = 组建团队：招募和组织决策部门的工作人员
     */
    constructor();
    /**
     * 从配置中加载策略
     * 读取并初始化交易策略条件
     *
     * 【比喻解释】
     * 这就像从航海手册中读取捕鱼规则：
     * - 查阅船长制定的各种规则（读取配置）
     * - 如果没有找到规则，使用默认的标准规则（设置默认条件）
     * - 确保至少有基本的止盈和止损保护措施（安全保障）
     * - 整理所有规则并确认已理解（记录日志）
     *
     * 【编程语法通俗翻译】
     * private = 内部工作：决策部门内部的准备工作
     * void = 无需汇报：这项工作不需要向外返回结果
     */
    private loadStrategies;
    /**
     * 是否应该买入
     * 评估交易机会，决定是否执行买入操作
     *
     * 【比喻解释】
     * 这就像渔长根据鱼探设备的数据决定是否下网：
     * - 先检查船长是否允许捕捞（买入策略是否启用）
     * - 确认船上是否已经有这种鱼（避免重复捕捞）
     * - 评估这片鱼群的价值大小（优先级分数）
     * - 判断雷达信号的清晰度和可靠性（信心分数）
     * - 综合各方面因素做出最终"下网"或"继续寻找"的决定
     *
     * 【编程语法通俗翻译】
     * boolean = 是/否决定：最终给出明确的"捕捞"或"不捕捞"的指令
     *
     * @param opportunity 交易机会，就像鱼探设备发现的鱼群信息
     * @returns 是否应该买入，就像"是否下网捕捞"的决定
     */
    shouldBuy(opportunity: TradingOpportunity): boolean;
    /**
     * 处理买入交易结果
     * 根据买入交易的结果更新持仓状态
     *
     * 【比喻解释】
     * 这就像渔船完成捕捞后处理渔获的流程：
     * - 先检查捕捞是否成功（交易结果）
     * - 记录捕获时的市场价格（买入价格）
     * - 将新捕获的鱼加入船上的存储仓（添加持仓）
     * - 在航海日志中详细记录这次捕捞的情况（记录日志）
     * - 向船长报告新增的渔获情况（返回持仓信息）
     *
     * 【编程语法通俗翻译】
     * Position | null = 渔获或空手而归：要么带回渔获，要么一无所获
     *
     * @param tradeResult 交易结果，就像一次捕捞行动的结果
     * @param opportunity 交易机会，就像发现的鱼群信息
     * @returns 新建的持仓或null，就像新增的渔获记录或空记录
     */
    handleBuyResult(tradeResult: TradeResult, opportunity: TradingOpportunity): Position | null;
    /**
     * 检查是否应该卖出代币
     * 根据当前价格和策略条件判断是否应卖出持仓
     *
     * 【比喻解释】
     * 这就像渔船决定是否将渔获送回港口销售：
     * - 先查找船上是否有这种鱼（查找持仓）
     * - 检查各种预设的"适合卖出"的条件（策略条件）
     * - 计算当前可能的利润或亏损（收益计算）
     * - 综合考虑后做出"现在卖出"或"继续持有"的决定
     * - 提供详细的决策理由和预期收益（决策结果）
     *
     * 【编程语法通俗翻译】
     * SellDecision = 卖出分析报告：包含"是否卖出"及理由的完整分析
     *
     * @param mint 代币Mint地址，就像某种鱼的唯一识别码
     * @param currentPrice 当前价格，就像当前市场价格
     * @returns 卖出决策结果，就像"是否将渔获送回港口"的决定报告
     */
    shouldSell(mint: string | PublicKey, currentPrice: number): SellDecision;
    /**
     * 处理卖出交易结果
     * @param tradeResult 交易结果
     * @param position 持仓
     * @returns 是否成功处理
     */
    handleSellResult(tradeResult: TradeResult, position: Position): boolean;
    /**
     * 检查止盈条件
     * @param position 持仓
     * @param condition 策略条件
     * @returns 是否满足条件
     */
    private checkTakeProfit;
    /**
     * 检查止损条件
     * @param position 持仓
     * @param condition 策略条件
     * @returns 是否满足条件
     */
    private checkStopLoss;
    /**
     * 检查追踪止损条件
     * @param position 持仓
     * @param condition 策略条件
     * @param mintString 代币Mint地址
     * @returns 是否满足条件
     */
    private checkTrailingStop;
    /**
     * 检查时间限制条件
     * @param position 持仓
     * @param condition 策略条件
     * @returns 是否满足条件
     */
    private checkTimeLimit;
    /**
     * 更新最高价格记录
     * @param mintString 代币Mint地址
     * @param currentPrice 当前价格
     */
    private updateHighestPrice;
    /**
     * 记录价格更新
     * @param update 价格更新数据
     */
    private recordPriceUpdate;
    /**
     * 计算利润
     * @param position 持仓
     * @param currentPrice 当前价格
     * @returns 利润信息
     */
    private calculateProfit;
    /**
     * 添加新持仓
     * @param token 代币信息
     * @param amount 数量
     * @param buyPrice 买入价格
     * @param txInfo 交易信息
     * @returns 新持仓
     */
    addPosition(token: TokenInfo, amount: bigint, buyPrice: number, txInfo: TradeResult): Position;
    /**
     * 获取持仓
     * @param mintAddress 代币Mint地址
     * @returns 持仓或null
     */
    getPosition(mintAddress: string | PublicKey): Position | null;
    /**
     * 更新持仓
     * @param position 持仓
     */
    updatePosition(position: Position): void;
    /**
     * 移除持仓
     * @param mintAddress 代币Mint地址
     * @returns 是否成功移除
     */
    removePosition(mintAddress: string | PublicKey): boolean;
    /**
     * 获取所有持仓
     * @returns 持仓列表
     */
    getAllPositions(): Position[];
}
declare const strategyManager: StrategyManager;
export default strategyManager;
