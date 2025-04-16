/**
 * 交易池监听器（海洋探测雷达系统）
 * 监控DEX上的新交易池创建
 *
 * 【编程基础概念通俗比喻】
 * 1. 监听器(Listener) = 渔船上的海洋探测雷达：
 *    就像渔船上的高级声纳和雷达设备，不断扫描海域寻找鱼群聚集地
 *    例如：connection.onProgramAccountChange() 就是持续工作的声纳装置，能捕捉到水下鱼群活动
 *
 * 2. 事件(Event) = 雷达捕获的信号：
 *    雷达屏幕上显示的各种不同亮点，代表不同的海洋活动
 *    例如：代币池创建事件就像发现了一片新的鱼群聚集地，立刻在雷达上显示特殊标记
 *
 * 3. 过滤器(Filter) = 雷达信号筛选器：
 *    不是所有雷达信号都值得渔船关注，需要筛选出真正有价值的鱼群信号
 *    例如：memcmp过滤条件就像设置雷达只显示特定大小和密度的鱼群，忽略海草和小型生物
 *
 * 4. 订阅(Subscription) = 雷达监测任务：
 *    分配给不同船员的观察任务，每人负责监控雷达上不同区域的动态
 *    例如：this.subscriptions就是当前安排的所有监测任务清单，记录谁在监测哪个区域
 *
 * 5. 池子(Pool) = 鱼群聚集地：
 *    海洋中鱼类密集的区域，通常意味着捕鱼的好时机
 *    例如：knownPools就像船长记录的已知鱼群位置图，标记着哪里有可捕捞的鱼群
 *
 * 【比喻解释】
 * 这个模块就像渔船上的探测指挥中心：
 * - 配备了多套雷达和声纳，同时监控多个海域（不同DEX）
 * - 能够自动过滤无关信号，只关注有价值的鱼群（新池子）
 * - 发现新鱼群后立即通知捕鱼系统准备行动（事件触发）
 * - 维护一张详细的海域鱼群分布图（池子数据库）
 * - 定期扫描海域确保不遗漏任何新出现的鱼群（定期检查）
 * - 负责整个探测系统的启动、运行和关闭（生命周期管理）
 */
import { EventEmitter } from 'node:events';
import { DexType, PoolInfo } from '../../core/types';
/**
 * 交易池监听服务
 * 负责监听DEX合约上的新交易池创建事件
 *
 * 【比喻解释】
 * 这就像渔船上的高级鱼群探测指挥中心：
 * - 统筹协调多套探测设备的工作（多DEX监听）
 * - 配有自动识别系统区分不同类型的鱼群（池子分类）
 * - 能够立即向捕鱼队发出新鱼群的精确位置（事件通知）
 * - 维护完整的海域鱼群分布档案（数据记录）
 * - 自动过滤干扰信号，提高探测效率（数据过滤）
 * - 全天候不间断工作，确保不错过任何机会（持续监控）
 *
 * 【编程语法通俗翻译】
 * class = 一套完整系统：包含多种功能和组件的探测中心设计图
 * extends EventEmitter = 带通讯功能：这个系统能够向其他系统发送信号
 * private = 内部组件：只有系统内部可以操作的控制装置和数据
 */
declare class PoolMonitor extends EventEmitter {
    private readonly config;
    private isRunning;
    private checkIntervalId;
    private knownPools;
    private subscriptions;
    /**
     * 检查监控器是否处于活动状态
     *
     * 【比喻解释】
     * 这就像查看探测雷达的工作状态灯：
     * - 绿灯亮起表示系统正在运行
     * - 红灯表示系统当前已关闭
     *
     * @returns {boolean} 监控器是否正在运行
     */
    isActive(): boolean;
    /**
     * 构造函数
     * 初始化池子监听器并加载配置
     *
     * 【比喻解释】
     * 这就像组装和校准探测指挥中心：
     * - 读取探测任务的详细参数（配置加载）
     * - 确认要监控的各个海域范围（启用的DEX）
     * - 准备记录系统随时记录发现（日志初始化）
     * - 装配好所有设备但尚未通电（等待start调用）
     *
     * 【编程语法通俗翻译】
     * constructor = 建造过程：创建并安装这套探测系统
     * super() = 安装基础组件：先完成通讯系统的安装
     * this.config = 保存设置手册：把操作指南放在控制台旁边随时查阅
     */
    constructor();
    /**
     * 启动监听服务
     * 开始监控所有配置的DEX程序变化
     *
     * 【比喻解释】
     * 这就像启动整个探测指挥中心：
     * - 先确认系统没有在运行（避免重复启动）
     * - 依次启动所有探测设备（设置订阅）
     * - 加载已知鱼群分布图（加载现有池子）
     * - 设置定时巡航模式（定期检查）
     * - 确认所有系统正常运转（状态检查）
     * - 向全船通报探测系统已启动（日志记录）
     *
     * 【编程语法通俗翻译】
     * async = 启动需要时间：不是一按按钮就立刻完成的复杂过程
     * if (this.isRunning) return = 重复检查：如果系统已经运行就不要再启动一次
     * try/catch = 安全程序：小心启动，随时准备处理可能出现的故障
     *
     * @returns {Promise<void>} - 启动完成的信号
     */
    start(): Promise<void>;
    /**
     * 停止监听服务
     * 清理所有活动的监听和定时任务
     *
     * 【比喻解释】
     * 这就像安全关闭整个探测指挥中心：
     * - 先通知全船准备关闭探测系统（记录日志）
     * - 取消所有定时扫描任务（清除定时器）
     * - 依次关闭各个探测设备（取消订阅）
     * - 保存当前探测数据（状态保存）
     * - 最后关闭整个系统电源（状态设置）
     * - 向船长确认探测系统已安全关闭（完成日志）
     *
     * 【编程语法通俗翻译】
     * if (!this.isRunning) return = 无效操作检查：如果系统已经关闭就不用再关一次
     * clearInterval = 取消定时任务：停止原本设置的自动扫描
     * await = 耐心等待：关闭每个设备需要时间，要等所有设备都安全关闭
     *
     * @returns {Promise<void>} - 停止完成的信号
     */
    stop(): Promise<void>;
    /**
     * 设置程序订阅
     * 为每个启用的DEX创建监听
     *
     * 【比喻解释】
     * 这就像设置各个海域的专门探测装置：
     * - 逐一检查需要监控的海域（遍历DEX）
     * - 针对每个海域启动特定的探测设备（创建监听）
     * - 设置每个设备的精确参数（过滤条件）
     * - 指派船员负责监控每个设备（回调函数）
     * - 记录每个设备的工作状态（订阅记录）
     *
     * 【编程语法通俗翻译】
     * private = 内部操作：只有指挥中心内部才能执行的设置过程
     * async = 耗时任务：需要时间来逐一启动所有设备
     * for...of = 逐一处理：像是挨个检查清单上的每一项
     */
    private setupProgramSubscriptions;
    /**
     * 处理程序账户变更
     * 分析账户信息，查找新池子创建迹象
     *
     * 【比喻解释】
     * 这就像分析声纳接收到的信号：
     * - 接收来自特定海域的声纳信号（账户信息）
     * - 分析信号是否表示鱼群聚集（新池子）
     * - 如果信号明确，进行更深入分析（检查池子详情）
     * - 记录每次声纳探测结果（日志）
     *
     * 【编程语法通俗翻译】
     * if (!this.isRunning) return = 设备已关闭：如果系统已关闭，不再处理信号
     * logger.debug = 记录细节：把探测到的小信号记在技术日志里
     *
     * @param {DexType} dexName - 交易所名称，就像海域名称
     * @param {PublicKey} programId - 程序ID，像是特定区域的坐标
     * @param {any} accountInfo - 账户信息，像是声纳接收到的原始信号
     * @param {any} context - 上下文信息，像是信号接收时的环境数据
     * @private
     */
    private handleProgramAccountChange;
    /**
     * 处理程序日志
     * 分析程序日志，查找池子创建的关键信息
     *
     * 【比喻解释】
     * 这就像分析水面观测设备的录像：
     * - 查看来自特定海域的画面记录（程序日志）
     * - 寻找水面波纹或其他鱼群迹象（关键词）
     * - 如果发现明显迹象，立即深入调查（查询交易）
     * - 记录每次重要发现（日志记录）
     *
     * 【编程语法通俗翻译】
     * const signature = context.signature = 交易标识：就像每段录像的时间戳
     * logMessages.some() = 查找特征：浏览记录寻找特定的波纹模式
     *
     * @param {DexType} dexName - 交易所名称，就像海域名称
     * @param {PublicKey} programId - 程序ID，像是特定区域的坐标
     * @param {any} logs - 日志内容，像是观测设备记录的画面
     * @param {any} context - 上下文信息，像是录像的时间和位置信息
     * @private
     */
    private handleProgramLogs;
    /**
     * 获取池子创建关键词
     * @param dexName DEX名称
     * @returns 关键词列表
     */
    private getPoolCreationKeywords;
    /**
     * 处理包含新池子的交易
     * @param dexName DEX名称
     * @param signature 交易签名
     */
    private processTransactionWithPool;
    /**
     * 开始定期检查新池子
     */
    private startPeriodicCheck;
    /**
     * 定期检查新池子
     */
    private checkForNewPoolsPeriodically;
    /**
     * 检查是否为新池子
     * @param dexName DEX名称
     * @param pubkey 公钥
     * @param accountData 账户数据
     */
    private checkForNewPool;
    /**
     * 分析账户数据判断是否为池子
     * @param dexName DEX名称
     * @param pubkey 公钥
     * @param accountData 账户数据
     * @returns 是否为池子
     */
    private analyzeAccountForPool;
    /**
     * 分析池子中的代币
     * @param poolInfo 池子信息
     */
    private analyzePoolTokens;
    /**
     * 加载现有池子
     */
    private loadExistingPools;
    /**
     * 取消所有订阅
     */
    private unsubscribeAll;
    /**
     * 获取已知池子列表
     */
    getKnownPools(): PoolInfo[];
    /**
     * 获取指定DEX的池子数量
     * @param dexName DEX名称
     */
    getPoolCountByDex(dexName: DexType): number;
    /**
     * 获取所有被监控的代币
     * 返回一个代币集合
     *
     * @returns {string[]} 被监控的代币地址列表
     */
    getMonitoredTokens(): string[];
}
export declare const poolMonitor: PoolMonitor;
export default poolMonitor;
