"use strict";
/**
 * 交易构建器
 * 负责构建Solana交易指令
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionBuilder = void 0;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const config_1 = __importDefault(require("../../core/config"));
const logger_1 = __importDefault(require("../../core/logger"));
const rpc_service_1 = __importDefault(require("../../services/rpc_service"));
const types_1 = require("../../core/types");
const MODULE_NAME = 'TransactionBuilder';
/**
 * 交易构建器类
 * 负责构建Solana交易，提供不同DEX的交易构建实现
 */
class TransactionBuilder {
    /**
     * 构造函数
     */
    constructor() {
        this.connection = rpc_service_1.default.connection;
        this.priorityFee = config_1.default.trading.buyStrategy.priorityFee;
        logger_1.default.info('交易构建器初始化完成', MODULE_NAME);
    }
    /**
     * 构建代币交换交易
     * @param params 交换参数
     * @param dexOverride 指定DEX
     * @returns 交易构建结果
     */
    async buildSwapTransaction(params, dexOverride) {
        try {
            // 确定使用哪个DEX的交换方法
            const dex = dexOverride || params.poolInfo.dex;
            // 根据DEX类型构建交易
            switch (dex) {
                case types_1.DexType.RAYDIUM:
                    return await this.buildRaydiumSwap(params);
                case types_1.DexType.ORCA:
                    return await this.buildOrcaSwap(params);
                case types_1.DexType.JUPITER:
                    return await this.buildJupiterSwap(params);
                default:
                    throw new Error(`不支持的DEX类型: ${dex}`);
            }
        }
        catch (error) {
            logger_1.default.error('构建交换交易时出错', MODULE_NAME, error);
            return {
                transaction: new web3_js_1.Transaction(),
                signers: [],
                error: `构建交易失败: ${error.message}`
            };
        }
    }
    /**
     * 构建Raydium交换交易
     * @param params 交换参数
     * @returns 交易构建结果
     */
    async buildRaydiumSwap(params) {
        logger_1.default.info('构建Raydium交换交易', MODULE_NAME);
        // 创建新交易
        const transaction = new web3_js_1.Transaction();
        const signers = [params.wallet];
        try {
            // 添加交易优先级指令(如果启用)
            this.addPriorityFeeInstruction(transaction);
            // 获取最新区块哈希
            const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.lastValidBlockHeight = lastValidBlockHeight;
            transaction.feePayer = params.wallet.publicKey;
            // TODO: 实现Raydium交换指令构建
            // 实际实现会需要与Raydium程序进行交互，构建交换指令
            // 这里仅作为示例，实际需要根据Raydium API和程序结构实现
            logger_1.default.info('Raydium交换交易构建完成', MODULE_NAME);
            return {
                transaction,
                signers,
                // 这些值在实际实现中会从Raydium API获取
                expectedOutAmount: params.minAmountOut,
                estimatedPriceImpact: 0.1, // 示例值
                estimatedFee: 0.3 // 示例值
            };
        }
        catch (error) {
            logger_1.default.error('构建Raydium交换指令时出错', MODULE_NAME, error);
            throw error;
        }
    }
    /**
     * 构建Orca交换交易
     * @param params 交换参数
     * @returns 交易构建结果
     */
    async buildOrcaSwap(params) {
        logger_1.default.info('构建Orca交换交易', MODULE_NAME);
        // 创建新交易
        const transaction = new web3_js_1.Transaction();
        const signers = [params.wallet];
        try {
            // 添加交易优先级指令(如果启用)
            this.addPriorityFeeInstruction(transaction);
            // 获取最新区块哈希
            const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.lastValidBlockHeight = lastValidBlockHeight;
            transaction.feePayer = params.wallet.publicKey;
            // TODO: 实现Orca交换指令构建
            // 实际实现会需要与Orca程序进行交互，构建交换指令
            // 这里仅作为示例，实际需要根据Orca API和程序结构实现
            logger_1.default.info('Orca交换交易构建完成', MODULE_NAME);
            return {
                transaction,
                signers,
                // 这些值在实际实现中会从Orca API获取
                expectedOutAmount: params.minAmountOut,
                estimatedPriceImpact: 0.1, // 示例值
                estimatedFee: 0.3 // 示例值
            };
        }
        catch (error) {
            logger_1.default.error('构建Orca交换指令时出错', MODULE_NAME, error);
            throw error;
        }
    }
    /**
     * 构建Jupiter交换交易
     * @param params 交换参数
     * @returns 交易构建结果
     */
    async buildJupiterSwap(params) {
        logger_1.default.info('构建Jupiter聚合交换交易', MODULE_NAME);
        // 创建新交易
        const transaction = new web3_js_1.Transaction();
        const signers = [params.wallet];
        try {
            // 添加交易优先级指令(如果启用)
            this.addPriorityFeeInstruction(transaction);
            // 获取最新区块哈希
            const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.lastValidBlockHeight = lastValidBlockHeight;
            transaction.feePayer = params.wallet.publicKey;
            // TODO: 实现Jupiter交换指令构建
            // 实际实现会需要与Jupiter API进行交互，获取最优路由并构建交换指令
            // 这里仅作为示例，实际需要调用Jupiter API
            logger_1.default.info('Jupiter交换交易构建完成', MODULE_NAME);
            return {
                transaction,
                signers,
                // 这些值在实际实现中会从Jupiter API获取
                expectedOutAmount: params.minAmountOut,
                estimatedPriceImpact: 0.1, // 示例值
                estimatedFee: 0.3 // 示例值
            };
        }
        catch (error) {
            logger_1.default.error('构建Jupiter交换指令时出错', MODULE_NAME, error);
            throw error;
        }
    }
    /**
     * 添加交易优先级指令
     * @param transaction 交易对象
     */
    addPriorityFeeInstruction(transaction) {
        if (!this.priorityFee.enabled) {
            return;
        }
        // 计算优先级费用(以lamports为单位)
        const microLamports = Math.floor(this.priorityFee.baseFee * web3_js_1.LAMPORTS_PER_SOL * 1000000);
        // 添加计算单元预算指令
        const priorityFeeInstruction = web3_js_1.ComputeBudgetProgram.setComputeUnitPrice({
            microLamports
        });
        transaction.add(priorityFeeInstruction);
        logger_1.default.debug(`已添加优先级费用指令: ${microLamports} microlamports`, MODULE_NAME);
    }
    /**
     * 构建代币转账交易
     * @param source 源钱包
     * @param destination 目标钱包
     * @param mint 代币铸造地址
     * @param amount 转账金额
     * @returns 交易构建结果
     */
    async buildTokenTransferTransaction(source, destination, mint, amount) {
        logger_1.default.info('构建代币转账交易', MODULE_NAME);
        // 创建新交易
        const transaction = new web3_js_1.Transaction();
        const signers = [source];
        try {
            // 添加交易优先级指令(如果启用)
            this.addPriorityFeeInstruction(transaction);
            // 获取最新区块哈希
            const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.lastValidBlockHeight = lastValidBlockHeight;
            transaction.feePayer = source.publicKey;
            // 判断是否为SOL转账
            if (mint.equals(web3_js_1.SystemProgram.programId)) {
                // SOL转账
                transaction.add(web3_js_1.SystemProgram.transfer({
                    fromPubkey: source.publicKey,
                    toPubkey: destination,
                    lamports: amount
                }));
            }
            else {
                // SPL代币转账
                // 查找源账户的代币账户地址
                const sourceTokenAccount = await spl_token_1.Token.getAssociatedTokenAddress(spl_token_1.TOKEN_PROGRAM_ID, mint, source.publicKey);
                // 查找目标账户的代币账户地址
                const destinationTokenAccount = await spl_token_1.Token.getAssociatedTokenAddress(spl_token_1.TOKEN_PROGRAM_ID, mint, destination);
                // TODO: 检查目标代币账户是否存在，如果不存在则创建
                // 添加转账指令
                const transferInstruction = spl_token_1.Token.createTransferInstruction(spl_token_1.TOKEN_PROGRAM_ID, sourceTokenAccount, destinationTokenAccount, source.publicKey, [], new spl_token_1.u64(amount.toString()));
                transaction.add(transferInstruction);
            }
            logger_1.default.info('代币转账交易构建完成', MODULE_NAME);
            return {
                transaction,
                signers
            };
        }
        catch (error) {
            logger_1.default.error('构建代币转账交易时出错', MODULE_NAME, error);
            throw error;
        }
    }
    /**
     * 构建代币授权交易
     * @param owner 拥有者钱包
     * @param spender 被授权者地址
     * @param mint 代币铸造地址
     * @param amount 授权金额
     * @returns 交易构建结果
     */
    async buildTokenApproveTransaction(owner, spender, mint, amount) {
        logger_1.default.info('构建代币授权交易', MODULE_NAME);
        // 创建新交易
        const transaction = new web3_js_1.Transaction();
        const signers = [owner];
        try {
            // 添加交易优先级指令(如果启用)
            this.addPriorityFeeInstruction(transaction);
            // 获取最新区块哈希
            const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.lastValidBlockHeight = lastValidBlockHeight;
            transaction.feePayer = owner.publicKey;
            // 查找源账户的代币账户地址
            const ownerTokenAccount = await spl_token_1.Token.getAssociatedTokenAddress(spl_token_1.TOKEN_PROGRAM_ID, mint, owner.publicKey);
            // 添加授权指令
            const approveInstruction = spl_token_1.Token.createApproveInstruction(spl_token_1.TOKEN_PROGRAM_ID, ownerTokenAccount, spender, owner.publicKey, [], new spl_token_1.u64(amount.toString()));
            transaction.add(approveInstruction);
            logger_1.default.info('代币授权交易构建完成', MODULE_NAME);
            return {
                transaction,
                signers
            };
        }
        catch (error) {
            logger_1.default.error('构建代币授权交易时出错', MODULE_NAME, error);
            throw error;
        }
    }
}
// 创建并导出单例
exports.transactionBuilder = new TransactionBuilder();
exports.default = exports.transactionBuilder;
//# sourceMappingURL=transaction_builder.js.map