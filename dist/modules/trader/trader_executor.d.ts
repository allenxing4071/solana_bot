/**
 * 交易执行器
 * 负责执行交易操作，包括买入和卖出交易，以及交易确认和重试逻辑
 */
import { Keypair, ConfirmedTransaction } from '@solana/web3.js';
import { TradeResult, TradingOpportunity } from '../../core/types';
/**
 * 交易执行参数接口
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
     * @param walletPrivateKey 钱包私钥(Base58编码或Uint8Array)
     */
    constructor(walletPrivateKey: string | Uint8Array);
    /**
     * 执行买入交易
     * @param params 交易执行参数
     * @returns 交易结果
     */
    executeBuy(params: TradeExecutionParams): Promise<TradeResult>;
    /**
     * 执行卖出交易
     * @param params 交易执行参数
     * @returns 交易结果
     */
    executeSell(params: TradeExecutionParams): Promise<TradeResult>;
    /**
     * 执行交易并处理重试逻辑
     * @param transaction 交易对象
     * @param signers 签名者数组
     * @param maxRetries 最大重试次数
     * @param timeout 确认超时时间(毫秒)
     * @returns 交易签名
     */
    private executeTransaction;
    /**
     * 应用滑点计算最小输出数量
     * @param amount 预期数量
     * @param slippageBps 滑点(基点)
     * @returns 应用滑点后的最小数量
     */
    private applySlippage;
    /**
     * 计算买入金额
     * @param opportunity 交易机会
     * @returns 买入金额
     */
    private calculateBuyAmount;
    /**
     * 获取交易状态
     * @param signature 交易签名
     * @returns 交易信息
     */
    getTransactionStatus(signature: string): Promise<ConfirmedTransaction | null>;
}
declare const traderExecutor: TraderExecutor;
export default traderExecutor;
