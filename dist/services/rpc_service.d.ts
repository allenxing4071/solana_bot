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
import { Connection, Commitment, PublicKey, Transaction, SendOptions, VersionedTransaction, AccountInfo, LogsFilter, Signer } from '@solana/web3.js';
/**
 * 基本RPC服务接口定义
 */
export interface IRPCService {
    initialize(): Promise<void>;
    getConnection(): Connection | null;
    getAccountInfo(address: PublicKey, commitment?: Commitment): Promise<AccountInfo<Buffer> | null>;
    getProgramAccounts(programId: PublicKey, filters?: any[]): Promise<Array<{
        pubkey: PublicKey;
        account: AccountInfo<Buffer>;
    }>>;
    subscribeAccount(address: PublicKey, callback: (accountInfo: AccountInfo<Buffer>) => void, commitment?: Commitment): Promise<number>;
    subscribeLogs(filter: LogsFilter, callback: (logs: any) => void): Promise<number>;
    subscribeProgram(programId: PublicKey, callback: (accountInfo: AccountInfo<Buffer>) => void, commitment?: Commitment): Promise<number>;
    unsubscribe(subscriptionId: number): Promise<boolean>;
    unsubscribeAll(): Promise<void>;
    sendTransaction(transaction: Transaction | VersionedTransaction, signers: Signer[], options?: SendOptions): Promise<string>;
    withRetry<T>(fn: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T>;
}
/**
 * RPC服务类
 * 负责管理与Solana RPC节点的通信
 */
declare class RPCService implements IRPCService {
    private _connection;
    private _subscriptions;
    private readonly MAX_RETRIES;
    private readonly RETRY_DELAY;
    /**
     * 构造函数
     */
    constructor();
    /**
     * 初始化连接
     */
    initialize(): Promise<void>;
    /**
     * 获取连接实例
     */
    getConnection(): Connection | null;
    /**
     * 获取账户信息
     */
    getAccountInfo(address: PublicKey, commitment?: Commitment): Promise<AccountInfo<Buffer> | null>;
    /**
     * 获取程序账户
     */
    getProgramAccounts(programId: PublicKey, filters?: any[]): Promise<Array<{
        pubkey: PublicKey;
        account: AccountInfo<Buffer>;
    }>>;
    /**
     * 订阅账户变更
     */
    subscribeAccount(address: PublicKey, callback: (accountInfo: AccountInfo<Buffer>) => void, commitment?: Commitment): Promise<number>;
    /**
     * 订阅程序账户变更
     */
    subscribeProgram(programId: PublicKey, callback: (accountInfo: AccountInfo<Buffer>) => void, commitment?: Commitment): Promise<number>;
    /**
     * 订阅日志
     */
    subscribeLogs(filter: LogsFilter, callback: (logs: any) => void): Promise<number>;
    /**
     * 取消订阅
     */
    unsubscribe(subscriptionId: number): Promise<boolean>;
    /**
     * 取消所有订阅
     */
    unsubscribeAll(): Promise<void>;
    /**
     * 发送交易
     */
    sendTransaction(transaction: Transaction | VersionedTransaction, signers: Signer[], options?: SendOptions): Promise<string>;
    /**
     * 带重试机制的函数执行
     */
    withRetry<T>(fn: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T>;
}
export declare const rpcService: RPCService;
export default rpcService;
