/**
 * RPC连接服务
 * 管理与Solana节点的连接
 *
 * 【编程基础概念通俗比喻】
 * 这个模块就像渔船的无线电通讯系统：
 * - 与岸上（区块链节点）保持稳定通信
 * - 发送指令（交易）并接收反馈
 * - 在通信不稳定时自动重新连接
 *
 * 【比喻解释】
 * 这个服务就像船上的通讯官：
 * - 管理与陆地的多种通讯方式（HTTP和WebSocket）
 * - 确保命令能可靠传达（重试机制）
 * - 处理各类信息的接收和解析（账户数据、日志等）
 */
import { Connection, Commitment, PublicKey, Transaction, SendOptions, Keypair, VersionedTransaction, AccountInfo, LogsFilter } from '@solana/web3.js';
/**
 * RPC服务类
 *
 * 【比喻解释】
 * 这就像渔船的通讯中心：
 * - 维护多种与陆地的联系方式（HTTP/WebSocket连接）
 * - 管理发出的所有通讯请求（RPC调用）
 * - 保持持续监听特定频道（订阅）
 */
declare class RPCService {
    private _connection;
    private _wsConnection;
    private _wsSubscriptions;
    private _backupEndpoints;
    private _currentEndpointIndex;
    /**
     * 构造函数
     *
     * 【比喻解释】
     * 这就像安装和调试通讯设备：
     * - 设置主要通讯线路（HTTP连接）
     * - 如有可能，建立实时通话频道（WebSocket）
     * - 记录设备就绪状态（日志）
     */
    constructor();
    /**
     * 获取主连接
     *
     * 【比喻解释】
     * 这就像获取主通讯设备的引用
     *
     * @return {Connection} - 主连接对象
     */
    get connection(): Connection;
    /**
     * 获取WebSocket连接
     *
     * 【比喻解释】
     * 这就像获取实时通话设备的引用，如果没有则使用普通通讯设备
     *
     * @return {Connection|null} - WebSocket连接对象或主连接
     */
    get wsConnection(): Connection | null;
    /**
     * 切换到下一个备用RPC端点
     * 当当前端点出现故障时使用
     *
     * @returns {boolean} 是否成功切换到新端点
     */
    private switchToNextEndpoint;
    /**
     * 检查连接状态
     *
     * 【比喻解释】
     * 这就像测试通讯设备是否能正常工作：
     * - 发送测试信号看是否有回应
     * - 如果没有回应则表示线路故障
     *
     * @return {Promise<boolean>} - 连接是否正常工作
     */
    isConnectionHealthy(): Promise<boolean>;
    /**
     * 重新连接
     *
     * 【比喻解释】
     * 这就像重启和重新调整通讯设备：
     * - 关闭并重新建立连接
     * - 测试新连接是否正常工作
     * - 报告连接恢复情况
     *
     * @return {Promise<boolean>} - 是否成功重新连接
     */
    reconnect(): Promise<boolean>;
    /**
     * 执行带有重试的RPC调用
     *
     * 【比喻解释】
     * 这就像发送重要消息时的标准流程：
     * - 尝试发送消息
     * - 如果没收到确认，检查通讯设备
     * - 必要时修复设备并重新发送
     * - 多次尝试后仍失败则报告问题
     *
     * 【编程语法通俗翻译】
     * 泛型T = 灵活数据类型：适应不同种类的返回信息
     * try/catch = 应对意外：处理发送过程中可能的问题
     *
     * @param {Function} fn - 要执行的函数，就像准备发送的消息
     * @param {...any[]} args - 函数参数，就像消息的具体内容
     * @return {Promise<T>} - 函数执行结果，就像收到的回复
     */
    withRetry<T>(fn: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T>;
    /**
     * 模拟交易
     *
     * 【比喻解释】
     * 这就像在实际行动前演练捕鱼计划：
     * - 在不实际捕鱼的情况下测试方案
     * - 检查计划中的潜在问题
     * - 获得执行结果的预测
     *
     * @param {Transaction|VersionedTransaction} transaction - 交易对象，就像捕鱼计划
     * @param {Keypair[]} signers - 签名者列表，就像授权执行的船员
     * @return {Promise<any>} - 模拟结果，就像计划可行性评估
     */
    simulateTransaction(transaction: Transaction | VersionedTransaction, signers?: Keypair[]): Promise<any>;
    /**
     * 发送交易
     *
     * 【比喻解释】
     * 这就像向海洋发出捕鱼指令：
     * - 准备好计划并获得所有必要签名（授权）
     * - 将命令发送到区块链网络（海洋）
     * - 返回可追踪的交易ID（捕鱼行动编号）
     *
     * @param {Transaction|VersionedTransaction} transaction - 交易对象，就像捕鱼行动计划
     * @param {Keypair[]} signers - 签名者列表，就像授权执行的船员
     * @param {SendOptions} options - 发送选项，就像行动的具体要求
     * @return {Promise<string>} - 交易签名，就像行动的唯一识别码
     */
    sendTransaction(transaction: Transaction | VersionedTransaction, signers: Keypair[], options?: SendOptions): Promise<string>;
    /**
     * 获取账户信息
     * @param address 账户地址
     * @param commitment 确认级别
     * @returns 账户信息
     */
    getAccountInfo(address: PublicKey, commitment?: Commitment): Promise<any>;
    /**
     * 获取多个账户信息
     * @param addresses 账户地址列表
     * @param commitment 确认级别
     * @returns 账户信息列表
     */
    getMultipleAccountsInfo(addresses: PublicKey[], commitment?: Commitment): Promise<any[]>;
    /**
     * 获取程序账户
     *
     * 【比喻解释】
     * 这就像请求获取某一类通讯记录的完整清单：
     * - 指定某个特定频道（程序ID）
     * - 获取该频道上所有活跃通讯者（程序账户）的详细资料
     *
     * @param {PublicKey} programId - 程序ID
     * @param {Commitment} commitment - 确认级别
     * @returns {Promise<Array>} - 账户信息数组
     */
    getProgramAccounts(programId: PublicKey, commitment?: Commitment): Promise<ReadonlyArray<{
        pubkey: PublicKey;
        account: AccountInfo<Buffer>;
    }>>;
    /**
     * 订阅账户变化
     * @param address 账户地址
     * @param callback 回调函数
     * @param commitment 确认级别
     * @returns 订阅ID
     */
    subscribeAccount(address: PublicKey, callback: (accountInfo: any, context: any) => void, commitment?: Commitment): Promise<number>;
    /**
     * 订阅程序账户变化
     * @param programId 程序ID
     * @param callback 回调函数
     * @param commitment 确认级别
     * @returns 订阅ID
     */
    subscribeProgram(programId: PublicKey, callback: (accountInfo: any, context: any) => void, commitment?: Commitment): Promise<number>;
    /**
     * 订阅日志
     * @param filter 日志过滤条件
     * @param callback 回调函数
     * @returns 订阅ID
     */
    subscribeLogs(filter: LogsFilter, callback: (logs: any, context: any) => void): Promise<number>;
    /**
     * 取消订阅
     * @param subscriptionId 订阅ID
     * @returns 是否成功取消
     */
    unsubscribe(subscriptionId: number): Promise<boolean>;
    /**
     * 取消所有订阅
     */
    unsubscribeAll(): Promise<void>;
    /**
     * 判断是否为连接错误
     * @param error 错误对象
     * @returns 是否是连接错误
     */
    private isConnectionError;
}
export declare const rpcService: RPCService;
export default rpcService;
