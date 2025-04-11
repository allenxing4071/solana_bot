/**
 * 交易执行器（渔船的捕捞行动执行系统）
 * 负责执行交易操作，包括买入和卖出交易，以及交易确认和重试逻辑
 *
 * 【编程基础概念通俗比喻】
 * 1. 交易执行(Trade Execution) = 捕鱼行动：
 *    就像船长下令进行实际的捕鱼行动
 *    例如：executeBuy()就像发出"下网捕捞"的命令
 *
 * 2. 交易确认(Transaction Confirmation) = 确认捕获：
 *    就像确认渔网中确实捕获了目标鱼类
 *    例如：等待交易确认就像等待渔网收回并确认捕获物
 *
 * 3. 交易重试(Retry) = 再次投网：
 *    就像第一次投网失败后再次尝试
 *    例如：maxRetries就像设定最多允许投网的次数
 *
 * 4. 滑点(Slippage) = 捕获误差：
 *    就像预期捕获100条鱼但实际只获得95条的误差
 *    例如：maxSlippageBps就像能接受的最大捕获误差
 *
 * 5. 交易签名(Transaction Signature) = 捕获记录：
 *    就像每次捕捞行动的官方记录编号
 *    例如：signature就像航海日志中的捕捞编号
 *
 * 【比喻解释】
 * 这个模块就像渔船上的捕捞行动中心：
 * - 接收船长发出的捕捞指令（处理交易请求）
 * - 指挥船员准备捕捞装备（构建交易）
 * - 执行实际的下网捕鱼动作（发送交易）
 * - 确认渔网成功回收并清点捕获物（确认交易）
 * - 处理突发状况如风浪过大（处理错误和重试）
 * - 向船长汇报捕捞结果（返回交易结果）
 */
import { Keypair, ConfirmedTransaction } from '@solana/web3.js';
import type { TradeResult, TradingOpportunity } from '../../core/types';
/**
 * 交易执行参数接口
 *
 * 【比喻解释】
 * 这就像捕捞任务指令书：
 * - 详细说明捕捞目标、使用的船只、最大尝试次数和等待时间
 * - 包含船长需要了解的所有捕捞行动相关参数
 */
interface TradeExecutionParams {
    opportunity: TradingOpportunity;
    wallet?: Keypair;
    maxRetries?: number;
    confirmTimeout?: number;
}
/**
 * 交易执行器类
 * 负责实际执行买入和卖出交易操作
 *
 * 【比喻解释】
 * 这就像渔船上的捕捞行动总指挥：
 * - 负责指挥整个捕捞过程从准备到完成
 * - 确保捕捞行动按照船长的指示执行
 * - 处理捕捞过程中的各种意外情况
 * - 最终向船长报告捕捞成果
 *
 * 【编程语法通俗翻译】
 * class = 专业角色：船上有特定职责的专业人员
 * private = 私密工具：只有捕捞指挥才能使用的专用设备
 */
export declare class TraderExecutor {
    private connection;
    private txBuilder;
    private walletKeypair;
    private readonly maxRetries;
    private readonly confirmTimeout;
    private readonly priorityFeeEnabled;
    private readonly maxSlippageBps;
    /**
     * 构造函数
     * 初始化交易执行器
     *
     * 【比喻解释】
     * 这就像捕捞指挥上岗前的准备工作：
     * - 接收船长的钥匙和身份证（获取钱包）
     * - 设置与海港的通信设备（初始化连接）
     * - 准备捕鱼装备的制作工具（初始化交易构建器）
     * - 确认捕捞规则如尝试次数和等待时间（设置配置参数）
     * - 向船长报告捕捞中心已准备就绪（日志记录）
     *
     * @param walletPrivateKey 钱包私钥，就像船长的钥匙
     */
    constructor(walletPrivateKey: string | Uint8Array);
    /**
     * 执行买入交易
     * 购买目标代币
     *
     * 【比喻解释】
     * 这就像执行"下网捕鱼"的命令：
     * - 记录开始捕捞的时间（开始计时）
     * - 确认捕捞的目标鱼类和位置（确认交易参数）
     * - 决定投放多大的渔网（计算交易金额）
     * - 设定最少需要捕获的数量（设置滑点限制）
     * - 准备捕鱼装备和船员（构建交易）
     * - 执行实际的捕捞行动（发送交易）
     * - 等待渔网回收并检查结果（等待确认）
     * - 向船长报告捕捞成果（返回结果）
     *
     * 【编程语法通俗翻译】
     * async = 需等待的行动：需要时间完成的捕捞任务
     *
     * @param params 交易执行参数，就像捕捞任务指令书
     * @returns 交易结果，就像捕捞行动的成果报告
     */
    executeBuy(params: TradeExecutionParams): Promise<TradeResult>;
    /**
     * 执行卖出交易
     * 卖出目标代币换回基础代币
     *
     * 【比喻解释】
     * 这就像执行"卸货售卖"的命令：
     * - 记录开始售卖的时间（开始计时）
     * - 确认要出售的鱼类和交易市场（确认交易参数）
     * - 决定售卖多少鱼（确定卖出数量）
     * - 设定最少需要获得的价值（设置滑点限制）
     * - 准备交易文件和验证（构建交易）
     * - 执行实际的售卖行动（发送交易）
     * - 等待买家确认并收款（等待确认）
     * - 向船长报告售卖结果（返回结果）
     *
     * @param params 交易执行参数，就像售卖任务指令书
     * @returns 交易结果，就像售卖行动的成果报告
     */
    executeSell(params: TradeExecutionParams): Promise<TradeResult>;
    /**
     * 执行交易
     * 发送交易并等待确认，支持重试逻辑
     *
     * 【比喻解释】
     * 这就像实际执行捕捞或售卖行动：
     * - 确保所有船员准备就绪（确认签名者）
     * - 发出行动指令（发送交易）
     * - 等待行动完成的确认（等待确认）
     * - 如果遇到风浪等问题就重试（重试逻辑）
     * - 最终确认行动结果（返回签名）
     *
     * @param transaction 交易对象，就像捕捞或售卖的详细指令
     * @param signers 签名者数组，就像参与行动的船员
     * @param maxRetries 最大重试次数，就像最多尝试的次数
     * @param timeout 超时时间，就像等待的最长时间
     * @returns 交易签名，就像行动的官方记录编号
     */
    private executeTransaction;
    /**
     * 应用滑点计算
     * 根据滑点百分比计算最小可接受金额
     *
     * 【比喻解释】
     * 这就像计算捕捞或售卖的可接受误差：
     * - 预期捕获100条鱼，但实际可能只有95条
     * - 这个函数就是计算"至少需要多少条"才能接受
     *
     * @param amount 预期金额，就像预期的捕获量
     * @param slippageBps 滑点基点，就像允许的误差百分比
     * @returns 最小可接受金额，就像最少需要的捕获量
     */
    private applySlippage;
    /**
     * 计算买入金额
     * 根据交易机会计算实际买入的代币数量
     *
     * 【比喻解释】
     * 这就像计算需要投放多大的渔网：
     * - 根据鱼群大小和捕捞策略
     * - 决定实际使用多少资源进行捕捞
     *
     * @param opportunity 交易机会，就像发现的鱼群信息
     * @returns 买入金额，就像决定投放的渔网大小
     */
    private calculateBuyAmount;
    /**
     * 获取交易状态
     * 查询指定交易的确认状态
     *
     * 【比喻解释】
     * 这就像查询捕捞或售卖行动的结果：
     * - 通过行动编号查询详细结果
     * - 确认行动是否成功完成
     * - 获取行动的详细报告
     *
     * @param signature 交易签名，就像行动的官方记录编号
     * @returns 交易确认结果，就像行动的详细报告
     */
    getTransactionStatus(signature: string): Promise<ConfirmedTransaction | null>;
}
declare const traderExecutor: TraderExecutor;
export default traderExecutor;
