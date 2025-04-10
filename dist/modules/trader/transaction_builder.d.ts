/**
 * 交易构建器
 * 负责构建Solana交易指令
 */
import { PublicKey, Transaction, Keypair } from '@solana/web3.js';
import { DexType, PoolInfo, TokenInfo } from '../../core/types';
/**
 * 代币交换参数接口
 */
interface SwapParams {
    poolInfo: PoolInfo;
    tokenIn: TokenInfo;
    tokenOut: TokenInfo;
    amountIn: bigint;
    minAmountOut: bigint;
    slippageBps?: number;
    wallet: Keypair;
    deadline?: number;
    referrer?: PublicKey;
}
/**
 * 交易构建状态接口
 */
interface TransactionBuildResult {
    transaction: Transaction;
    signers: Keypair[];
    expectedOutAmount?: bigint;
    estimatedPriceImpact?: number;
    estimatedFee?: number;
    error?: string;
}
/**
 * 交易构建器类
 * 负责构建Solana交易，提供不同DEX的交易构建实现
 */
declare class TransactionBuilder {
    private connection;
    private priorityFee;
    /**
     * 构造函数
     */
    constructor();
    /**
     * 构建代币交换交易
     * @param params 交换参数
     * @param dexOverride 指定DEX
     * @returns 交易构建结果
     */
    buildSwapTransaction(params: SwapParams, dexOverride?: DexType): Promise<TransactionBuildResult>;
    /**
     * 构建Raydium交换交易
     * @param params 交换参数
     * @returns 交易构建结果
     */
    private buildRaydiumSwap;
    /**
     * 构建Orca交换交易
     * @param params 交换参数
     * @returns 交易构建结果
     */
    private buildOrcaSwap;
    /**
     * 构建Jupiter交换交易
     * @param params 交换参数
     * @returns 交易构建结果
     */
    private buildJupiterSwap;
    /**
     * 添加交易优先级指令
     * @param transaction 交易对象
     */
    private addPriorityFeeInstruction;
    /**
     * 构建代币转账交易
     * @param source 源钱包
     * @param destination 目标钱包
     * @param mint 代币铸造地址
     * @param amount 转账金额
     * @returns 交易构建结果
     */
    buildTokenTransferTransaction(source: Keypair, destination: PublicKey, mint: PublicKey, amount: bigint): Promise<TransactionBuildResult>;
    /**
     * 构建代币授权交易
     * @param owner 拥有者钱包
     * @param spender 被授权者地址
     * @param mint 代币铸造地址
     * @param amount 授权金额
     * @returns 交易构建结果
     */
    buildTokenApproveTransaction(owner: Keypair, spender: PublicKey, mint: PublicKey, amount: bigint): Promise<TransactionBuildResult>;
}
export declare const transactionBuilder: TransactionBuilder;
export default transactionBuilder;
