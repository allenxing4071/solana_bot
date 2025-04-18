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
declare enum SystemStatus {
    INITIALIZING = "initializing",
    STARTING = "starting",
    RUNNING = "running",
    STOPPING = "stopping",
    STOPPED = "stopped",
    ERROR = "error"
}
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
declare class Application {
    private systemStatus;
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
    constructor();
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
    private setupProcessHandlers;
    /**
     * 设置所有事件监听器
     */
    private setupEventListeners;
    /**
     * 启动应用程序
     */
    start(): Promise<void>;
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
    shutdown(): Promise<void>;
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
    private setSystemStatus;
    /**
     * 获取当前系统状态
     *
     * @returns {SystemStatus} - 当前系统状态
     */
    getSystemStatus(): SystemStatus;
    /**
     * 初始化系统模块
     * 按顺序初始化各个功能模块
     */
    private initializeModules;
    /**
     * 启动业务逻辑
     */
    private startBusinessLogic;
}
declare const app: Application;
export default app;
