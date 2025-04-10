"use strict";
/**
 * 交易执行器
 * 负责执行交易操作，包括买入和卖出交易，以及交易确认和重试逻辑
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraderExecutor = void 0;
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = __importDefault(require("bs58"));
const logger_1 = __importDefault(require("../../core/logger"));
const rpc_service_1 = __importDefault(require("../../services/rpc_service"));
const config_1 = __importDefault(require("../../core/config"));
const transaction_builder_1 = __importDefault(require("./transaction_builder"));
const MODULE_NAME = 'TraderExecutor';
/**
 * 交易执行器类
 * 负责实际执行买入和卖出交易操作
 */
class TraderExecutor {
    /**
     * 构造函数
     * @param walletPrivateKey 钱包私钥(Base58编码或Uint8Array)
     */
    constructor(walletPrivateKey) {
        this.connection = rpc_service_1.default.connection;
        this.txBuilder = transaction_builder_1.default;
        // 创建钱包Keypair
        if (typeof walletPrivateKey === 'string') {
            const privateKeyBytes = bs58_1.default.decode(walletPrivateKey);
            this.walletKeypair = web3_js_1.Keypair.fromSecretKey(privateKeyBytes);
        }
        else {
            this.walletKeypair = web3_js_1.Keypair.fromSecretKey(walletPrivateKey);
        }
        // 从配置中加载交易参数
        this.maxRetries = config_1.default.trading.txRetryCount;
        this.confirmTimeout = config_1.default.trading.txConfirmTimeout;
        this.priorityFeeEnabled = config_1.default.trading.buyStrategy.priorityFee.enabled;
        this.maxSlippageBps = config_1.default.trading.buyStrategy.maxSlippage * 100; // 转换为基点(1% = 100bps)
        logger_1.default.info('交易执行器初始化完成', MODULE_NAME);
    }
    /**
     * 执行买入交易
     * @param params 交易执行参数
     * @returns 交易结果
     */
    async executeBuy(params) {
        const startTime = Date.now();
        const opportunity = params.opportunity;
        const pool = opportunity.pool;
        logger_1.default.info(`开始执行买入交易: ${opportunity.targetToken.symbol || opportunity.targetToken.mint.toBase58()}`, MODULE_NAME, {
            pool: pool.address.toBase58(),
            dex: pool.dex,
            baseToken: opportunity.baseToken.symbol || opportunity.baseToken.mint.toBase58()
        });
        try {
            // 计算买入金额
            const amountIn = this.calculateBuyAmount(opportunity);
            // 计算最小输出金额(考虑滑点)
            const expectedOutAmount = opportunity.estimatedOutAmount || BigInt(0);
            const minAmountOut = this.applySlippage(expectedOutAmount, this.maxSlippageBps);
            // 构建交换参数
            const swapParams = {
                poolInfo: pool,
                tokenIn: opportunity.baseToken,
                tokenOut: opportunity.targetToken,
                amountIn,
                minAmountOut,
                slippageBps: this.maxSlippageBps,
                wallet: params.wallet || this.walletKeypair
            };
            // 构建交易
            const txResult = await this.txBuilder.buildSwapTransaction(swapParams);
            if (txResult.error) {
                throw new Error(`构建交易失败: ${txResult.error}`);
            }
            // 执行交易
            const signature = await this.executeTransaction(txResult.transaction, txResult.signers, params.maxRetries || this.maxRetries, params.confirmTimeout || this.confirmTimeout);
            // 交易成功
            const executionTime = Date.now() - startTime;
            logger_1.default.info(`买入交易执行成功: ${signature}`, MODULE_NAME, {
                executionTimeMs: executionTime,
                token: opportunity.targetToken.symbol || opportunity.targetToken.mint.toBase58(),
                expectedAmount: expectedOutAmount.toString()
            });
            // 返回交易结果
            return {
                success: true,
                signature,
                txid: signature,
                tokenAmount: txResult.expectedOutAmount || BigInt(0),
                baseTokenAmount: amountIn,
                price: opportunity.estimatedPriceUsd,
                priceImpact: txResult.estimatedPriceImpact,
                fee: txResult.estimatedFee,
                timestamp: Date.now()
            };
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            logger_1.default.error(`买入交易执行失败`, MODULE_NAME, {
                error: error instanceof Error ? error.message : String(error),
                executionTimeMs: executionTime,
                token: opportunity.targetToken.symbol || opportunity.targetToken.mint.toBase58()
            });
            // 返回失败结果
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                errorCode: error instanceof web3_js_1.SendTransactionError ? error.code : undefined,
                timestamp: Date.now()
            };
        }
    }
    /**
     * 执行卖出交易
     * @param params 交易执行参数
     * @returns 交易结果
     */
    async executeSell(params) {
        const startTime = Date.now();
        const opportunity = params.opportunity;
        const pool = opportunity.pool;
        logger_1.default.info(`开始执行卖出交易: ${opportunity.targetToken.symbol || opportunity.targetToken.mint.toBase58()}`, MODULE_NAME, {
            pool: pool.address.toBase58(),
            dex: pool.dex,
            baseToken: opportunity.baseToken.symbol || opportunity.baseToken.mint.toBase58()
        });
        try {
            // 计算卖出金额
            const amountIn = opportunity.sellAmount || BigInt(0);
            // 计算最小输出金额(考虑滑点)
            const expectedOutAmount = opportunity.estimatedOutAmount || BigInt(0);
            const minAmountOut = this.applySlippage(expectedOutAmount, this.maxSlippageBps);
            // 构建交换参数
            const swapParams = {
                poolInfo: pool,
                tokenIn: opportunity.targetToken,
                tokenOut: opportunity.baseToken,
                amountIn,
                minAmountOut,
                slippageBps: this.maxSlippageBps,
                wallet: params.wallet || this.walletKeypair
            };
            // 构建交易
            const txResult = await this.txBuilder.buildSwapTransaction(swapParams);
            if (txResult.error) {
                throw new Error(`构建交易失败: ${txResult.error}`);
            }
            // 执行交易
            const signature = await this.executeTransaction(txResult.transaction, txResult.signers, params.maxRetries || this.maxRetries, params.confirmTimeout || this.confirmTimeout);
            // 交易成功
            const executionTime = Date.now() - startTime;
            logger_1.default.info(`卖出交易执行成功: ${signature}`, MODULE_NAME, {
                executionTimeMs: executionTime,
                token: opportunity.targetToken.symbol || opportunity.targetToken.mint.toBase58(),
                amount: amountIn.toString(),
                receivedBaseAmount: txResult.expectedOutAmount?.toString()
            });
            // 返回交易结果
            return {
                success: true,
                signature,
                txid: signature,
                tokenAmount: amountIn,
                baseTokenAmount: txResult.expectedOutAmount || BigInt(0),
                price: opportunity.estimatedPriceUsd,
                priceImpact: txResult.estimatedPriceImpact,
                fee: txResult.estimatedFee,
                timestamp: Date.now()
            };
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            logger_1.default.error(`卖出交易执行失败`, MODULE_NAME, {
                error: error instanceof Error ? error.message : String(error),
                executionTimeMs: executionTime,
                token: opportunity.targetToken.symbol || opportunity.targetToken.mint.toBase58()
            });
            // 返回失败结果
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                errorCode: error instanceof web3_js_1.SendTransactionError ? error.code : undefined,
                timestamp: Date.now()
            };
        }
    }
    /**
     * 执行交易并处理重试逻辑
     * @param transaction 交易对象
     * @param signers 签名者数组
     * @param maxRetries 最大重试次数
     * @param timeout 确认超时时间(毫秒)
     * @returns 交易签名
     */
    async executeTransaction(transaction, signers, maxRetries, timeout) {
        let currentTry = 0;
        let lastError = null;
        while (currentTry <= maxRetries) {
            try {
                // 如果不是第一次尝试，获取新的blockhash
                if (currentTry > 0) {
                    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
                    transaction.recentBlockhash = blockhash;
                    transaction.lastValidBlockHeight = lastValidBlockHeight;
                    logger_1.default.info(`重试交易 (${currentTry}/${maxRetries})，更新blockhash: ${blockhash}`, MODULE_NAME);
                }
                // 发送并确认交易
                const signature = await (0, web3_js_1.sendAndConfirmTransaction)(this.connection, transaction, signers, {
                    skipPreflight: false,
                    preflightCommitment: 'confirmed',
                    commitment: 'confirmed',
                    maxRetries: 2, // 在sendAndConfirmTransaction层面的重试
                });
                return signature;
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                currentTry++;
                // 记录错误
                logger_1.default.warn(`交易执行失败 (尝试 ${currentTry}/${maxRetries})`, MODULE_NAME, {
                    error: lastError.message
                });
                // 如果还有重试次数，等待一段时间后重试
                if (currentTry <= maxRetries) {
                    const backoffTime = Math.min(500 * Math.pow(2, currentTry), 10000); // 指数退避，最多10秒
                    await new Promise(resolve => setTimeout(resolve, backoffTime));
                }
            }
        }
        // 所有重试都失败
        throw lastError || new Error('交易执行失败，超过最大重试次数');
    }
    /**
     * 应用滑点计算最小输出数量
     * @param amount 预期数量
     * @param slippageBps 滑点(基点)
     * @returns 应用滑点后的最小数量
     */
    applySlippage(amount, slippageBps) {
        const slippageFactor = 10000 - slippageBps; // 10000 = 100%
        return (amount * BigInt(slippageFactor)) / BigInt(10000);
    }
    /**
     * 计算买入金额
     * @param opportunity 交易机会
     * @returns 买入金额
     */
    calculateBuyAmount(opportunity) {
        // 从配置获取最大交易额
        const maxAmountPerTrade = config_1.default.trading.buyStrategy.maxAmountPerTrade;
        // 根据优先级分数调整买入金额
        let adjustedAmount = maxAmountPerTrade;
        // 如果优先级分数低于阈值，减少买入金额
        if (opportunity.priorityScore < 0.7) {
            adjustedAmount = maxAmountPerTrade * 0.5;
        }
        else if (opportunity.priorityScore < 0.5) {
            adjustedAmount = maxAmountPerTrade * 0.25;
        }
        // 将SOL金额转换为lamports
        return BigInt(Math.floor(adjustedAmount * 1e9)); // 1 SOL = 10^9 lamports
    }
    /**
     * 获取交易状态
     * @param signature 交易签名
     * @returns 交易信息
     */
    async getTransactionStatus(signature) {
        try {
            const txInfo = await this.connection.getTransaction(signature, {
                commitment: 'confirmed',
            });
            return txInfo;
        }
        catch (error) {
            logger_1.default.error(`获取交易状态失败: ${signature}`, MODULE_NAME, error);
            return null;
        }
    }
}
exports.TraderExecutor = TraderExecutor;
// 导出单例实例
const traderExecutor = new TraderExecutor(process.env.WALLET_PRIVATE_KEY || '');
exports.default = traderExecutor;
//# sourceMappingURL=trader_executor.js.map