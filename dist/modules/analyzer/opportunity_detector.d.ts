/**
 * 机会探测器（鱼群价值评估系统）
 * 负责分析新池子，评估交易机会，计算价格和滑点
 *
 * 【编程基础概念通俗比喻】
 * 1. 机会(Opportunity) = 高价值鱼群：
 *    就像渔船雷达发现的价值高、容易捕获的鱼群
 *    例如：新池子中具有良好流动性和价格的代币就像肥美的鱼群
 *
 * 2. 评估(Analysis) = 鱼群价值评估：
 *    就像渔民通过经验判断哪些鱼群值得下网捕捞
 *    例如：analyzePool方法就像老渔民看到鱼群后估算其规模和价值
 *
 * 3. 优先级(Priority) = 捕捞顺序决策：
 *    就像渔船船长决定先去哪片海域捕鱼
 *    例如：calculatePriorityScore就像船长根据鱼群大小、种类和距离决定先捕哪一群
 *
 * 4. 滑点(Slippage) = 捕捞损耗：
 *    就像撒网捕鱼时总会有鱼逃脱的现象
 *    例如：estimateSlippage就像预估大网捕鱼时会损失多少目标渔获
 *
 * 5. 基础代币(Base Token) = 主要交易货币：
 *    就像渔民用来交易的主要货币（比如黄金或银币）
 *    例如：SOL和USDC就像渔民公认的两种硬通货
 *
 * 【比喻解释】
 * 这个模块就像渔船上的鱼群价值评估中心：
 * - 配备了先进的鱼群价值计算系统（价格计算）
 * - 能够快速判断哪些鱼群值得捕捞（机会筛选）
 * - 为每个潜在目标计算最佳的捕捞策略（交易策略）
 * - 预估不同捕捞方式的收益和风险（滑点计算）
 * - 对多个目标进行排序，确定最优先捕捞顺序（优先级评分）
 * - 能够识别有毒或不值钱的鱼种并避开（风险规避）
 */
import { PoolInfo, TradingOpportunity } from '../../core/types';
/**
 * 机会检测器类
 * 负责检测并分析交易机会
 *
 * 【比喻解释】
 * 这就像渔船上的鱼群价值评估专家团队：
 * - 熟悉各种常见交易货币的市场价值（基础代币）
 * - 能够迅速判断鱼群规模是否达到捕捞标准（最小流动性）
 * - 具备评估新鱼种初始价值的专业能力（价格评估）
 * - 配备先进的鱼群分析设备和方法（分析算法）
 * - 为船长提供最优捕捞决策建议（机会检测）
 *
 * 【编程语法通俗翻译】
 * class = 专业团队结构：定义了这支评估队伍的组成和工作方法
 * private = 内部信息：只有团队内部才知道的专业数据和标准
 * export = 对外服务：这支团队可以为渔船其他部门提供咨询
 */
export declare class OpportunityDetector {
    private baseTokens;
    private minLiquidityUsd;
    private maxInitialPriceUsd;
    /**
     * 构造函数
     * 初始化机会检测器并设置评估标准
     *
     * 【比喻解释】
     * 这就像组建鱼群评估专家团队：
     * - 阅读船长制定的捕捞标准手册（配置加载）
     * - 设定最小规模的捕捞标准（最小流动性）
     * - 确定新鱼种的合理价格范围（最大初始价格）
     * - 记录所有评估标准以便查阅（日志记录）
     * - 准备常用交易货币的价值参照（基础代币）
     *
     * 【编程语法通俗翻译】
     * constructor = 组建团队：招募专家并确定工作规范
     * try/catch = 应急预案：如果标准手册损坏，使用经验值
     */
    constructor();
    /**
     * 初始化基础代币列表
     * 添加系统使用的主要交易货币
     *
     * 【比喻解释】
     * 这就像建立主要交易货币的标准参照：
     * - 记录黄金（SOL）的详细信息和官方标识
     * - 记录银币（USDC）的详细信息和官方标识
     * - 确认这些货币在市场上的公认价值和信任度
     * - 准备用这些主要货币来评估其他商品的价值
     *
     * 【编程语法通俗翻译】
     * private = 内部操作：只有团队内部需要了解的准备工作
     * push = 添加记录：将信息添加到参照表中
     */
    private initializeBaseTokens;
    /**
     * 分析新池子并检测交易机会
     * 全面评估一个新发现的池子是否值得交易
     *
     * 【比喻解释】
     * 这就像渔船发现新鱼群后的全面评估流程：
     * - 先在日志中记录发现新鱼群的位置和初步信息（记录日志）
     * - 确定目标鱼种和用于交易的货币类型（识别代币）
     * - 检查这种鱼是否安全、合法可捕捞（验证代币）
     * - 进行专业的鱼群价值和规模评估（分析池子）
     * - 计算这次捕捞在当前任务中的优先级（优先级评分）
     * - 预估使用当前装备能捕获的数量（输出估算）
     * - 形成完整的捕捞计划提交给决策系统（创建机会）
     *
     * 【编程语法通俗翻译】
     * async = 需要时间：这个评估过程需要一定时间完成
     * try/catch = 安全机制：评估过程中可能遇到问题需要妥善处理
     *
     * @param poolInfo 池子信息，就像新发现鱼群的位置和初步观察
     * @returns 交易机会或null(如果没有有效机会)，就像可行的捕捞计划或放弃建议
     */
    detectOpportunity(poolInfo: PoolInfo): Promise<TradingOpportunity | null>;
    /**
     * 识别目标代币和基础代币
     * 从池子中确定哪个是我们要买的代币，哪个是用来支付的代币
     *
     * 【比喻解释】
     * 这就像渔民在交易市场中确定：
     * - 哪个是我们想要捕捞的鱼种（目标代币）
     * - 哪个是我们用来交易的货币（基础代币）
     * - 检查交易是否合理（不能用鱼换鱼或货币换货币）
     * - 获取更多关于这种鱼的详细信息（丰富代币信息）
     *
     * 【编程语法通俗翻译】
     * private = 内部判断：只有评估团队内部使用的专业方法
     *
     * @param poolInfo 池子信息，就像市场上的一个交易摊位
     * @returns [目标代币, 基础代币] 或 [null, null]，就像[想要的鱼，用来支付的货币]或无法交易
     */
    private identifyTokens;
    /**
     * 判断是否为基础代币
     * 检查代币是否是我们用来支付的主要货币
     *
     * 【比喻解释】
     * 这就像渔民判断某物是否为通用货币：
     * - 查看物品的标记是否匹配已知货币的标记
     * - 快速判断这是鱼（商品）还是货币（支付工具）
     * - 为后续交易决策提供基础信息
     *
     * @param mint 代币Mint地址，就像物品上的唯一标识
     * @returns 是否为基础代币，就像判断是否为通用货币
     */
    private isBaseToken;
    /**
     * 获取基础代币信息
     * 根据代币地址获取完整的基础代币信息
     *
     * 【比喻解释】
     * 这就像根据货币的标识查询详细信息：
     * - 查阅货币参照表找到匹配的记录
     * - 获取该货币的完整资料（名称、符号、精度等）
     * - 为交易评估提供准确的价值参照
     *
     * @param mint 代币Mint地址，就像货币的标识码
     * @returns 基础代币信息或null，就像货币的完整资料或未找到
     */
    private getBaseTokenInfo;
    /**
     * 分析池子
     * 深入分析池子数据，评估交易价值和风险
     *
     * 【比喻解释】
     * 这就像渔船专家对发现的鱼群进行专业评估：
     * - 估算鱼群的市场价值（价格评估）
     * - 测量鱼群的规模大小（流动性分析）
     * - 评估捕捞难度和风险（信心评分）
     * - 综合判断是否值得投入资源捕捞（有效性判断）
     * - 形成专业的评估报告（分析结果）
     *
     * 【编程语法通俗翻译】
     * private = 专业内部流程：只有评估专家才能执行的分析过程
     * async = 耗时评估：需要时间收集和分析各种数据
     *
     * @param poolInfo 池子信息，就像鱼群的位置和初步观察
     * @param targetToken 目标代币，就像目标鱼种
     * @param baseToken 基础代币，就像用于交易的货币
     * @returns 池子分析结果，就像专业的鱼群评估报告
     */
    private analyzePool;
    /**
     * 估算代币价格(美元)
     * @param poolInfo 池子信息
     * @param targetToken 目标代币
     * @param baseToken 基础代币
     * @returns 估算价格(美元)
     */
    private estimateTokenPrice;
    /**
     * 估算流动性(美元)
     * @param poolInfo 池子信息
     * @param targetToken 目标代币
     * @param baseToken 基础代币
     * @returns 估算流动性(美元)
     */
    private estimateLiquidity;
    /**
     * 计算信心分数
     * @param poolInfo 池子信息
     * @param targetToken 目标代币
     * @param price 价格(美元)
     * @param liquidity 流动性(美元)
     * @returns 信心分数(0-1)
     */
    private calculateConfidenceScore;
    /**
     * 计算优先级分数
     * @param analysis 池子分析结果
     * @param poolInfo 池子信息
     * @param targetToken 目标代币
     * @returns 优先级分数
     */
    private calculatePriorityScore;
    /**
     * 估算滑点
     * @param poolInfo 池子信息
     * @param liquidityUsd 流动性(美元)
     * @returns 估算滑点百分比
     */
    private estimateSlippage;
    /**
     * 估算输出代币数量
     * @param poolInfo 池子信息
     * @param inputToken 输入代币
     * @param outputToken 输出代币
     * @param amountIn 输入数量
     * @returns 估算输出数量
     */
    private estimateOutputAmount;
    /**
     * 计算利润百分比
     * @param estimatedPriceUsd 估算价格(美元)
     * @param liquidityUsd 流动性(美元)
     * @returns 利润百分比
     */
    private calculateProfitPercentage;
}
declare const opportunityDetector: OpportunityDetector;
export default opportunityDetector;
