/**
 * 交易池监听器
 * 监控DEX上的新交易池创建
 *
 * 【编程基础概念通俗比喻】
 * 1. 监听器(Listener) = 海洋探测系统：
 *    就像渔船上的高级探测系统，不断扫描海域寻找鱼群活动
 *    例如：connection.onProgramAccountChange() 就是持续观察海域的雷达装置
 *
 * 2. 事件(Event) = 海洋信号：
 *    水下的各种动静，可能代表不同的海洋活动
 *    例如：代币创建事件就像海底火山喷发，新鱼种出现的信号
 *
 * 3. 过滤器(Filter) = 信号筛选器：
 *    不是所有信号都值得关注，需要筛选出真正有价值的信号
 *    例如：memcmp过滤条件就像设置雷达只对特定大小的鱼群反应
 *
 * 4. 订阅(Subscription) = 观察任务：
 *    分配船员执行的各种观察任务，每个任务关注不同区域
 *    例如：this.subscriptions数组就是当前进行中的所有观察任务清单
 *
 * 【比喻解释】
 * 这个监听器就像渔船上的探测中心：
 * - 同时运行多台探测设备，监控多个海域（不同DEX）
 * - 利用声纳和雷达（账户变化和日志分析）捕捉信号
 * - 对发现的信号进行筛选和分析（数据解析）
 * - 当发现有价值目标时通知捕捞系统（触发交易）
 * - 保持整个探测系统的高效运行（资源管理）
 */
import { EventEmitter } from 'events';
import { DexType, PoolInfo } from '../../core/types';
/**
 * 交易池监听服务
 * 负责监听DEX合约上的新交易池创建事件
 *
 * 【比喻解释】
 * 这就像渔船上的高级鱼群探测系统：
 * - 配备了多种传感器（监听不同DEX）
 * - 持续扫描海域寻找鱼群聚集（流动性池）
 * - 能够区分不同鱼群特征（不同池类型）
 * - 发现新鱼群后自动追踪和记录（事件处理）
 * - 定期清理过期数据保持系统高效（资源管理）
 *
 * 【编程语法通俗翻译】
 * class = 设计图纸：这是一个完整的探测系统设计方案
 * extends EventEmitter = 继承通讯能力：这个系统能够向其他系统发送信号
 */
declare class PoolMonitor extends EventEmitter {
    private readonly config;
    private isRunning;
    private checkIntervalId;
    private knownPools;
    private subscriptions;
    /**
     * 构造函数
     * 初始化池子监听器并加载配置
     *
     * 【比喻解释】
     * 这就像组装和校准探测系统：
     * - 读取探测范围和频率（配置加载）
     * - 确认要监控的海域（启用的DEX）
     * - 准备日志记录设备（日志初始化）
     * - 但还未实际开始工作（等待start调用）
     *
     * 【编程语法通俗翻译】
     * constructor = 组装仪式：创建这个探测系统的过程
     * super() = 继承基础功能：先完成通讯系统的基础设置
     * this.config = 保存设置：把操作手册放在随手可得的地方
     */
    constructor();
    /**
     * 启动监听服务
     * 开始监控所有配置的DEX程序变化
     *
     * 【比喻解释】
     * 这就像启动船上所有探测设备：
     * - 检查系统是否已经在运行（避免重复启动）
     * - 打开各种扫描仪和传感器（设置订阅）
     * - 加载已知鱼群数据（加载现有池子）
     * - 安排定期巡查任务（定期检查）
     * - 确认所有设备正常工作（状态检查）
     *
     * 【编程语法通俗翻译】
     * async = 启动需要时间：不是一按按钮就立刻完成的
     * if (this.isRunning) return = 防重复：如果设备已在运行就不要再启动一次
     * try/catch = 安全操作：小心启动，出问题立即处理
     *
     * @returns {Promise<void>} - 启动完成的信号
     */
    start(): Promise<void>;
    /**
     * 停止监听服务
     * 清理所有活动的监听和定时任务
     *
     * 【比喻解释】
     * 这就像关闭船上所有探测设备：
     * - 取消所有定期巡查任务（清除定时器）
     * - 收回所有探测设备（取消订阅）
     * - 保存当前状态（记录日志）
     * - 完全关闭系统电源（状态设置）
     *
     * 【编程语法通俗翻译】
     * if (!this.isRunning) return = 无需操作：如果设备已经关闭就不用再关一次
     * clearInterval = 取消定时：停止原本安排的定期巡查
     *
     * @returns {Promise<void>} - 停止完成的信号
     */
    stop(): Promise<void>;
    /**
     * 设置程序订阅
     * 为每个启用的DEX创建监听
     *
     * 【比喻解释】
     * 这就像为每个海域设置专门的探测器：
     * - 为每个目标海域（DEX）准备设备
     * - 同时使用声纳和摄像头（账户和日志监听）
     * - 设置好信号接收方式（回调函数）
     * - 保存每个探测器的识别码（订阅ID）
     * - 确认所有设备工作正常（日志记录）
     *
     * 【编程语法通俗翻译】
     * for (const dex of this.config.dexes) = 挨个设置：对每个目标海域逐一部署设备
     * try/catch = 安全部署：如果某个设备部署失败，不影响其他设备
     *
     * @returns {Promise<void>} - 设置完成的信号
     * @private
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
}
export declare const poolMonitor: PoolMonitor;
export default poolMonitor;
