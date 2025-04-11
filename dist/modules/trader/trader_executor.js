"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraderExecutor = void 0;
const web3_js_1 = require("@solana/web3.js");
const buffer_1 = require("buffer");
const bs58_1 = __importDefault(require("bs58"));
const logger_1 = __importDefault(require("../../core/logger"));
const rpc_service_1 = __importDefault(require("../../services/rpc_service"));
const transaction_builder_1 = require("./transaction_builder");
const config_1 = __importDefault(require("../../core/config"));
// 模块名称
// 就像捕捞行动中心的标识牌
const MODULE_NAME = 'TraderExecutor';
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
class TraderExecutor {
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
    constructor(walletPrivateKey) {
        const connection = rpc_service_1.default.getConnection();
        if (!connection) {
            throw new Error('RPC连接未初始化');
        }
        this.connection = connection;
        this.txBuilder = transaction_builder_1.transactionBuilder;
        // 创建钱包Keypair
        // 就像准备船长的身份证和钥匙
        if (typeof walletPrivateKey === 'string') {
            const privateKeyBytes = bs58_1.default.decode(walletPrivateKey);
            this.walletKeypair = web3_js_1.Keypair.fromSecretKey(privateKeyBytes);
        }
        else {
            this.walletKeypair = web3_js_1.Keypair.fromSecretKey(walletPrivateKey);
        }
        // 从配置中加载交易参数
        // 就像查看捕捞手册中的标准规则
        this.maxRetries = config_1.default.trading.txRetryCount;
        this.confirmTimeout = config_1.default.trading.txConfirmTimeout;
        this.priorityFeeEnabled = config_1.default.trading.buyStrategy.priorityFee.enabled;
        this.maxSlippageBps = config_1.default.trading.buyStrategy.maxSlippage * 100; // 转换为基点(1% = 100bps)
        logger_1.default.info('交易执行器初始化完成', MODULE_NAME);
    }
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
            // 就像决定投放多大的渔网
            const amountIn = this.calculateBuyAmount(opportunity);
            // 计算最小输出金额(考虑滑点)
            // 就像设定最少需要捕获的鱼量
            const expectedOutAmount = opportunity.estimatedOutAmount || BigInt(0);
            const minAmountOut = this.applySlippage(expectedOutAmount, this.maxSlippageBps);
            // 构建交换参数
            // 就像准备捕鱼行动的详细计划
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
            // 就像准备捕鱼装备和船员
            const txResult = await this.txBuilder.buildSwapTransaction(swapParams);
            if (txResult.error) {
                throw new Error(`构建交易失败: ${txResult.error}`);
            }
            // 执行交易
            // 就像实际投放渔网进行捕捞
            const signature = await this.executeTransaction(txResult.transaction, txResult.signers, params.maxRetries || this.maxRetries, params.confirmTimeout || this.confirmTimeout);
            // 交易成功
            // 就像成功收网并确认捕获
            const executionTime = Date.now() - startTime;
            logger_1.default.info(`买入交易执行成功: ${signature}`, MODULE_NAME, {
                executionTimeMs: executionTime,
                token: opportunity.targetToken.symbol || opportunity.targetToken.mint.toBase58(),
                expectedAmount: expectedOutAmount.toString()
            });
            // 返回交易结果
            // 就像向船长提交捕捞成果报告
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
            // 就像报告捕捞行动失败
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                errorCode: error instanceof web3_js_1.SendTransactionError ?
                    error.code : undefined,
                timestamp: Date.now()
            };
        }
    }
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
            // 就像确定要售卖的鱼量
            const amountIn = opportunity.sellAmount || BigInt(0);
            // 计算最小输出金额(考虑滑点)
            // 就像设定最少需要获得的价值
            const expectedOutAmount = opportunity.estimatedOutAmount || BigInt(0);
            const minAmountOut = this.applySlippage(expectedOutAmount, this.maxSlippageBps);
            // 构建交换参数
            // 就像准备售卖行动的详细计划
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
            // 就像准备售卖文件和验证
            const txResult = await this.txBuilder.buildSwapTransaction(swapParams);
            if (txResult.error) {
                throw new Error(`构建交易失败: ${txResult.error}`);
            }
            // 执行交易
            // 就像实际进行售卖交易
            const signature = await this.executeTransaction(txResult.transaction, txResult.signers, params.maxRetries || this.maxRetries, params.confirmTimeout || this.confirmTimeout);
            // 交易成功
            // 就像成功完成售卖并收款
            const executionTime = Date.now() - startTime;
            logger_1.default.info(`卖出交易执行成功: ${signature}`, MODULE_NAME, {
                executionTimeMs: executionTime,
                token: opportunity.targetToken.symbol || opportunity.targetToken.mint.toBase58(),
                amount: amountIn.toString(),
                receivedBaseAmount: txResult.expectedOutAmount?.toString()
            });
            // 返回交易结果
            // 就像向船长提交售卖成果报告
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
            // 就像报告捕捞行动失败
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                errorCode: error instanceof web3_js_1.SendTransactionError ?
                    error.code : undefined,
                timestamp: Date.now()
            };
        }
    }
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
    applySlippage(amount, slippageBps) {
        const slippageFactor = 10000 - slippageBps; // 10000 = 100%
        return (amount * BigInt(slippageFactor)) / BigInt(10000);
    }
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
    async getTransactionStatus(signature) {
        try {
            const txInfo = await this.connection.getTransaction(signature, {
                commitment: 'confirmed',
            });
            // 转换交易信息类型
            const txResponse = txInfo;
            const transaction = web3_js_1.Transaction.from(txResponse.transaction.message.serialize());
            transaction.signatures = txResponse.transaction.signatures.map(sig => ({
                signature: buffer_1.Buffer.from(sig, 'base64'),
                publicKey: transaction.feePayer || transaction.instructions[0].programId
            }));
            const confirmedTx = {
                ...txResponse,
                transaction
            };
            return confirmedTx;
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