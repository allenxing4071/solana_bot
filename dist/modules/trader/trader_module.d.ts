/**
 * 交易模块（渔船捕捞作业指挥中心）
 * 整合机会检测、交易执行和策略管理，作为交易系统的主入口
 *
 * 【编程基础概念通俗比喻】
 * 1. 交易模块(Trader Module) = 渔船捕捞指挥中心：
 *    就像渔船上统筹协调所有捕捞活动的中枢系统
 *    例如：handleNewPool()就像船长接到发现新鱼群的报告后的决策过程
 *
 * 2. 机会(Opportunity) = 发现的鱼群：
 *    就像声纳探测到的值得下网捕捞的鱼群
 *    例如：activeOpportunities就像船长记录的所有已发现待捕捞的鱼群位置
 *
 * 3. 交易执行(Trade Execution) = 下网捕鱼行动：
 *    就像渔船派出小艇带着渔网去指定位置捕鱼
 *    例如：executeTrade()就像船长下令"在此处下网"的命令
 *
 * 4. 持仓(Position) = 船上储存的渔获：
 *    就像渔船上已经捕获并存放在鱼舱中的鱼
 *    例如：emitPositionUpdated()就像更新船上渔获储存状态的日志
 *
 * 5. 价格监控(Price Checking) = 鱼市行情监测：
 *    就像定期查询各类鱼的市场价格变化
 *    例如：checkPositionPrices()就像船员定期查询港口鱼市的最新价格
 *
 * 【比喻解释】
 * 这个模块就像渔船上的捕捞作业指挥中心：
 * - 接收探测雷达发现的新鱼群信息（新池子）
 * - 决定哪些鱼群值得派船去捕捞（机会评估）
 * - 根据当前天气和海况选择合适的捕捞方法（策略选择）
 * - 派出小艇执行具体的捕捞行动（交易执行）
 * - 管理船上已捕获的鱼类并决定何时卖出（持仓管理）
 * - 定期检查各类鱼的市场价格变化（价格监控）
 * - 在整个捕捞过程中保持与其他部门的通信（事件通知）
 */
import { EventEmitter } from 'node:events';
import type { PoolInfo, TradingOpportunity } from '../../core/types';
/**
 * 交易模块类
 * 处理交易相关的核心业务逻辑
 *
 * 【比喻解释】
 * 这就像渔船上的捕捞作业指挥中心：
 * - 配备完整的决策系统（是否执行捕捞）
 * - 与探测系统保持密切联系（接收新池子）
 * - 根据船长制定的规则选择捕捞方法（策略）
 * - 协调各个小队执行具体捕捞行动（执行交易）
 * - 记录和管理船上已捕获的渔获（持仓管理）
 * - 定期评估渔获价值和市场行情（价格检查）
 * - 向船长汇报所有捕捞活动的状态（事件通知）
 *
 * 【编程语法通俗翻译】
 * class = 专业部门：一个有组织有分工的船上工作部门
 * extends EventEmitter = 带通讯功能：配备了与其他部门通信的设备
 * private = 内部事务：只有部门内部才能接触的事务和数据
 */
export declare class TraderModule extends EventEmitter {
    private walletManager;
    private transactionBuilder;
    private tokenValidator;
    private riskManager;
    private opportunityDetector;
    private strategyManager;
    private isRunning;
    private isExecuting;
    private activeOpportunities;
    private pendingTrades;
    private positions;
    private priceCheckTimer;
    private opportunityQueue;
    private maxQueueSize;
    private batchProcessingSize;
    private lastBatchProcessTime;
    private batchProcessInterval;
    private priceCache;
    private priceCacheExpiry;
    private priceCheckQueue;
    private isProcessingPriceQueue;
    private maxPriceCheckBatchSize;
    private lastPriceCheckTime;
    private priceCheckInterval;
    private riskLevels;
    private maxRiskPerToken;
    private maxTotalRisk;
    private riskAdjustmentInterval;
    private riskAdjustmentTimer;
    private recentTradeResults;
    private maxRecentTrades;
    private totalAllocatedFunds;
    private maxAllocationPerToken;
    /**
     * 构造函数
     * 初始化交易模块的基本设置
     *
     * 【比喻解释】
     * 这就像组建渔船捕捞指挥团队：
     * - 先建立基础通信系统（初始化事件通知）
     * - 设置默认的工作状态（禁用状态）
     * - 确定多久检查一次鱼市价格（价格检查间隔）
     * - 向船长报告团队已组建完成（日志记录）
     *
     * 【编程语法通俗翻译】
     * constructor = 组建团队：招募和组织指挥中心的工作人员
     * super() = 继承装备：安装从上级分配的通信设备
     */
    constructor();
    /**
     * 初始化交易模块
     * 准备交易模块的所有系统和服务
     *
     * 【比喻解释】
     * 这就像渔船出航前的准备工作：
     * - 检查是否已经准备就绪（避免重复准备）
     * - 确认船长是否允许进行捕捞（配置检查）
     * - 准备所有捕捞设备和系统（初始化资源）
     * - 向船长报告准备完成状态（日志记录）
     *
     * 【编程语法通俗翻译】
     * async = 需要时间：这个准备过程需要一段时间
     * if (this.isInitialized) return = 避免重复：如果已经准备好就不必再准备
     * try/catch = 安全措施：准备过程中如有问题立即报告
     */
    initialize(): Promise<void>;
    /**
     * 启动交易模块
     * 开始监听和处理交易机会
     *
     * 【比喻解释】
     * 这就像渔船正式开始捕捞作业：
     * - 先确认所有设备已准备就绪（检查初始化）
     * - 记录开始工作的时间和状态（日志记录）
     * - 确认船长的最新指令（是否允许捕捞）
     * - 启动定期检查鱼价的任务（价格监控）
     * - 向全船通报捕捞作业正式开始（状态更新）
     *
     * 【优化说明】
     * 添加风险调整定时器和系统监控
     */
    start(enableExecution?: boolean): Promise<void>;
    /**
     * 停止交易模块
     * 结束所有交易相关活动
     *
     * 【比喻解释】
     * 这就像渔船结束当天的捕捞作业：
     * - 通知所有人准备停止工作（记录日志）
     * - 停止定期检查鱼价的任务（停止价格检查）
     * - 召回所有正在捕捞的小艇（清理进行中交易）
     * - 整理和归档今天发现的鱼群记录（清理机会列表）
     * - 向船长报告捕捞工作已安全结束（完成日志）
     *
     * 【优化说明】
     * 添加停止风险调整定时器
     */
    stop(): Promise<void>;
    /**
     * 处理新的流动性池
     *
     * 【比喻解释】
     * 就像船长收到发现新鱼群的报告：
     * - 先确认这个鱼群的位置（验证池子）
     * - 评估这个鱼群的价值（机会评估）
     * - 检查是否有足够的资源去捕捞（风险检查）
     * - 决定是否派出渔船去捕捞（策略检查）
     * - 如果决定捕捞，就加入捕捞计划（添加到队列）
     *
     * @param pool 新发现的流动性池
     */
    handleNewPool(pool: PoolInfo): Promise<void>;
    /**
     * 处理交易机会
     *
     * 【比喻解释】
     * 就像船长收到发现新鱼群的报告后的决策过程：
     * - 先评估这个鱼群的价值（机会评估）
     * - 检查是否有足够的资源去捕捞（风险检查）
     * - 决定是否派出渔船去捕捞（策略检查）
     * - 如果决定捕捞，就加入捕捞计划（添加到队列）
     *
     * @param opportunity 交易机会
     * @returns Promise<void>
     */
    handleOpportunity(opportunity: TradingOpportunity): Promise<void>;
    /**
     * 将机会添加到优先级队列
     *
     * 【比喻解释】
     * 就像船长把新的捕捞任务加入任务清单：
     * - 根据鱼群的价值和捕捞难度给任务打分（计算优先级）
     * - 把任务按分数高低排序（优先级排序）
     * - 如果任务太多，就删除一些低分的任务（队列大小限制）
     *
     * @param opportunity 交易机会
     */
    private addToOpportunityQueue;
    /**
     * 批量处理机会队列
     *
     * 【比喻解释】
     * 就像渔船上的批量作业系统：
     * - 同时处理多个相似的任务
     * - 提高整体效率
     * - 避免资源浪费
     */
    private processOpportunityBatch;
    /**
     * 执行交易
     * 根据交易机会执行具体的交易操作
     *
     * 【比喻解释】
     * 这就像渔船船长下令执行一次完整的捕鱼行动：
     * - 先检查这片海域是否已有小船在捕捞（防止重复）
     * - 标记这片海域为"正在作业"状态（添加到待处理）
     * - 向安全中心请求分配捕捞资源（资金分配）
     * - 如果资源不足或安全中心拒绝，取消行动（处理拒绝）
     * - 准备捕捞装备和人员（准备交易参数）
     * - 派出小船执行实际的捕捞行动（执行交易）
     * - 等待小船返回并清点渔获（处理结果）
     * - 记录这次捕捞的详细情况（记录交易）
     * - 向全船通报捕捞成果（发送事件）
     * - 取消这片海域的"正在作业"标记（移除待处理）
     *
     * 【优化说明】
     * 添加动态风险控制和资金管理
     */
    private executeTrade;
    /**
     * 启动价格检查
     * 开始定期监控持仓价格变化
     *
     * 【比喻解释】
     * 这就像渔船上设置定时查询鱼市价格的任务：
     * - 检查是否已经有人在负责查询价格（避免重复）
     * - 设置一个定时闹钟，按时查询最新价格（设置定时器）
     * - 确保每隔固定时间就更新一次价格信息（定期执行）
     * - 记录价格监控任务已经开始（日志记录）
     *
     * 【优化说明】
     * 添加价格缓存和批量处理机制，减少重复请求
     */
    private startPriceChecking;
    /**
     * 停止价格检查
     * 结束定期的价格监控任务
     *
     * 【比喻解释】
     * 这就像取消渔船上定时查询鱼价的任务：
     * - 检查是否有正在执行的查询任务（检查定时器）
     * - 通知负责查询的船员停止工作（清除定时器）
     * - 记录价格监控任务已经停止（日志记录）
     */
    private stopPriceChecking;
    /**
     * 检查持仓价格
     * 定期更新所有持仓的价格信息
     *
     * 【比喻解释】
     * 这就像渔船上定期查询所有已捕鱼类的最新市场价格：
     * - 先获取船上目前所有的渔获清单（获取持仓）
     * - 如果船上没有渔获，就不需要查询（空持仓检查）
     * - 对每种捕获的鱼类逐一查询最新价格（遍历持仓）
     * - 分别记录每种鱼的当前市场价值（更新价格）
     * - 如果查询过程中出现问题，记录但不影响其他查询（错误处理）
     *
     * 【优化说明】
     * 使用队列和批处理机制，减少重复请求
     */
    private checkPositionPrices;
    /**
     * 添加代币到价格检查队列
     *
     * 【比喻解释】
     * 就像将需要查询价格的鱼类加入待查询清单
     *
     * @param tokenMint 代币Mint地址
     * @param callback 价格更新后的回调函数
     */
    private addToPriceCheckQueue;
    /**
     * 处理价格检查队列
     *
     * 【比喻解释】
     * 就像批量处理待查询价格的鱼类清单
     *
     * 【优化说明】
     * 使用批处理和缓存机制，减少重复请求
     * 添加性能监控，优化批处理性能
     */
    private processPriceCheckQueue;
    /**
     * 清理缓存
     * 移除过期的价格缓存条目
     *
     * 【比喻解释】
     * 就像清理过期的鱼价记录，避免参考过时信息
     */
    private cleanupCache;
    /**
     * 获取代币价格
     *
     * 【比喻解释】
     * 就像查询某种鱼的最新市场价格
     *
     * @param tokenMint 代币Mint地址
     * @returns 代币价格
     */
    private getTokenPrice;
    /**
     * 检查单个持仓价格
     * 更新特定持仓的当前价格信息
     *
     * 【比喻解释】
     * 这就像查询船上某一种特定鱼类的最新市场价格：
     * - 找到这种鱼最初在哪片海域捕获的（查找原始池子）
     * - 查询当前市场对这种鱼的最新估价（获取价格）
     * - 计算这批鱼的总价值变化（计算收益）
     * - 根据价格变化决定是否需要卖出（检查止盈止损）
     * - 更新渔获清单上这种鱼的最新信息（更新持仓）
     * - 向船长通报这种鱼的价格变动情况（发送事件）
     *
     * 【优化说明】
     * 使用队列和回调机制，减少重复请求
     */
    private checkPositionPrice;
    /**
     * 模拟获取代币价格
     * @param position 持仓
     * @returns 模拟的当前价格
     */
    private simulatePrice;
    /**
     * 查找代币对应的池子
     * @param tokenMint 代币Mint地址
     * @returns 池子信息
     */
    private findPoolForToken;
    /**
     * 获取指定符号的基础代币
     * @param symbol 代币符号
     * @returns 代币信息
     */
    private getBaseTokenForSymbol;
    /**
     * 发送交易机会事件
     */
    private emitOpportunityEvent;
    /**
     * 发送交易执行事件
     */
    private emitTradeEvent;
    /**
     * 发送仓位更新事件
     */
    private emitPositionEvent;
    /**
     * 发送错误事件
     */
    private emitErrorEvent;
    /**
     * 发出价格更新事件
     * @param tokenMint 代币Mint地址
     * @param price 价格
     */
    private emitPriceUpdated;
    /**
     * 启动风险调整
     * 定期调整风险参数
     *
     * 【比喻解释】
     * 就像定期评估渔场的风险状况，调整捕捞策略
     */
    private startRiskAdjustment;
    /**
     * 停止风险调整
     * 结束定期的风险调整任务
     *
     * 【比喻解释】
     * 就像停止定期评估渔场风险的任务
     */
    private stopRiskAdjustment;
    /**
     * 调整风险等级
     * 根据最近的交易结果调整风险参数
     *
     * 【比喻解释】
     * 就像根据最近的捕捞结果调整捕捞策略
     *
     * 【优化说明】
     * 动态调整风险参数，提高系统适应性
     */
    private adjustRiskLevels;
    /**
     * 记录交易结果
     * 用于风险调整
     *
     * 【比喻解释】
     * 就像记录每次捕捞的结果，用于评估捕捞策略
     *
     * @param tradeResult 交易结果
     * @param tokenMint 代币Mint地址
     */
    private recordTradeResult;
    /**
     * 计算交易金额
     * 根据风险参数计算交易金额
     *
     * 【比喻解释】
     * 就像根据风险评估决定投入多少资源进行捕捞
     *
     * @param opportunity 交易机会
     * @returns 交易金额
     */
    private calculateTradeAmount;
    /**
     * 获取可用资金
     *
     * 【比喻解释】
     * 就像查询船上可用于捕捞的资金
     *
     * @returns 可用资金
     */
    private getAvailableFunds;
    /**
     * 获取代币已分配资金
     *
     * 【比喻解释】
     * 就像查询已分配给某种鱼类的捕捞资金
     *
     * @param tokenMint 代币Mint地址
     * @returns 已分配资金
     */
    private getTokenAllocatedFunds;
    /**
     * 系统自恢复
     * 当系统检测到异常状态时尝试自动恢复
     *
     * 【比喻解释】
     * 就像船长发现渔船某部分设备故障时的自动修复程序
     *
     * 【优化说明】
     * 添加内存使用监控和资源释放
     */
    private attemptRecovery;
    /**
     * 强制清理缓存
     * 仅保留指定比例的最新数据
     *
     * 【比喻解释】
     * 就像在船舱空间不足时，只保留最新鲜的鱼，扔掉其他所有渔获
     *
     * @param keepRatio 保留的比例（0-1）
     */
    private forceCleanupCache;
    /**
     * 启动系统监控
     * 定期检查系统状态并尝试自动恢复
     *
     * 【比喻解释】
     * 就像船上的自动化维护系统，定期检查各设备状态
     */
    private startSystemMonitoring;
}
declare const traderModule: TraderModule;
export default traderModule;
