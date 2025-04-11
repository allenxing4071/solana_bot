"use strict";
/**
 * 交易构建器（捕鱼装备制造工坊）
 * 负责构建Solana交易指令
 *
 * 【编程基础概念通俗比喻】
 * 1. 交易构建(Transaction Building) = 捕鱼装备组装：
 *    就像渔船上的工匠为不同捕鱼任务准备合适的网具和工具
 *    例如：buildSwapTransaction()就像根据捕捞目标配置专用渔网
 *
 * 2. 交易指令(Transaction Instruction) = 捕鱼工具组件：
 *    就像构成完整捕鱼装备的各个零件和部件
 *    例如：addPriorityFeeInstruction()就像给渔网添加特殊重物让它更快沉入水中
 *
 * 3. 签名者(Signers) = 捕鱼许可证：
 *    就像证明这次捕捞行动合法性的官方文件和印章
 *    例如：params.wallet就像船长签名的捕捞许可证
 *
 * 4. DEX(Decentralized Exchange) = 不同的捕鱼场所：
 *    就像海洋中不同的捕鱼区域，每个区域有特定的捕鱼规则
 *    例如：Raydium, Orca, Jupiter就像不同的海湾，每个都有特殊的水流和鱼群
 *
 * 5. 滑点(Slippage) = 捕捞损耗容忍度：
 *    就像渔民愿意接受的鱼群逃脱比例
 *    例如：slippageBps就像设定"即使有10%的鱼逃脱也要继续捕捞"的容忍度
 *
 * 【比喻解释】
 * 这个模块就像渔船上的捕鱼装备制造工坊：
 * - 根据不同鱼类特征制作专用渔具（不同DEX的交易）
 * - 精确计算每种渔网的设计参数（交易参数）
 * - 为不同海域的水流特性调整装备（不同DEX的适配）
 * - 确保捕捞装备符合海洋法规（交易验证）
 * - 预估每种装备的捕获效率（价格影响和费用）
 * - 提供完整的装备使用说明（交易结果）
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
// 模块名称
// 就像渔船上这个工坊的船舱编号
const MODULE_NAME = 'TransactionBuilder';
/**
 * 交易构建器类
 * 负责构建Solana交易，提供不同DEX的交易构建实现
 *
 * 【比喻解释】
 * 这就像渔船上的捕鱼装备制造工坊：
 * - 拥有与海洋的通讯设备（链接节点）
 * - 掌握不同海域的捕鱼装备设计图（不同DEX交易构建）
 * - 能根据目标鱼种定制最合适的渔具（构建交易）
 * - 精通各种特殊装备的加工技艺（特殊交易指令）
 * - 提供装备使用指南和预期效果（交易结果预测）
 * - 确保所有装备符合海洋法规（交易验证）
 *
 * 【编程语法通俗翻译】
 * class = 专业工坊：一个拥有专业设备和技术的制造车间
 * private = 内部工具：只有工坊内部能使用的专用工具
 */
class TransactionBuilder {
    /**
     * 构造函数
     * 初始化交易构建器
     *
     * 【比喻解释】
     * 这就像建立一个捕鱼装备制造工坊：
     * - 安装与海洋通信的设备（初始化连接）
     * - 设置船只加速的燃料配置（优先级费用）
     * - 向船长报告工坊已准备就绪（日志记录）
     *
     * 【编程语法通俗翻译】
     * constructor = 工坊建立：准备和配置专业的制造工坊
     */
    constructor() {
        const connection = rpc_service_1.default.getConnection();
        if (!connection) {
            throw new Error('RPC连接未初始化');
        }
        this.connection = connection;
        // 加载优先级费用配置
        // 就像设置船只加速的燃料配置
        this.priorityFee = config_1.default.trading.buyStrategy.priorityFee;
        logger_1.default.info('交易构建器初始化完成', MODULE_NAME);
    }
    /**
     * 构建代币交换交易
     * 根据指定参数构建交易指令
     *
     * 【比喻解释】
     * 这就像根据捕捞需求定制专用渔具：
     * - 接收详细的捕捞任务需求（交换参数）
     * - 确认在哪片海域进行捕捞（DEX类型）
     * - 根据不同海域的特性选择合适的装备设计（不同DEX构建）
     * - 精心制作完整的捕捞装备（构建交易）
     * - 提供装备使用指南和预期效果（返回结果）
     * - 如果制作过程出现问题，报告具体原因（错误处理）
     *
     * 【编程语法通俗翻译】
     * async = 耗时工艺：制作专业装备需要一定时间
     * try/catch = 安全措施：制作过程中可能出现问题需要妥善处理
     *
     * @param params 交换参数，就像详细的捕捞任务需求
     * @param dexOverride 指定DEX，就像指定必须在某片海域捕捞
     * @returns 交易构建结果，就像制作完成的渔具及使用说明
     */
    async buildSwapTransaction(params, dexOverride) {
        try {
            // 确定使用哪个DEX的交换方法
            // 就像确定在哪片海域捕捞
            const dex = dexOverride || params.poolInfo.dex;
            // 根据DEX类型构建交易
            // 就像根据海域特性选择渔具设计
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
            // 处理错误
            // 就像处理装备制作失败
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
     * 专门为Raydium DEX构建交易指令
     *
     * 【比喻解释】
     * 这就像为"宁静海湾"（Raydium）定制专用捕鱼装备：
     * - 记录开始制作特定海域装备（日志记录）
     * - 准备一个全新的装备框架（新建交易）
     * - 附加使用这套装备的合法证明（签名者）
     * - 如果需要加速，添加特殊推进器（优先级费用）
     * - 确认海洋当前状态（获取最新区块）
     * - 按照"宁静海湾"的水流特性组装专用网具（构建指令）
     * - 提供完整的装备使用指南和效果预测（返回结果）
     *
     * 【编程语法通俗翻译】
     * private = 工坊秘方：工坊内部的专有技术
     * async = 精细工艺：需要时间完成的精密制作
     *
     * @param params 交换参数，就像详细的捕捞需求
     * @returns 交易构建结果，就像制作完成的专用渔具
     */
    async buildRaydiumSwap(params) {
        // 记录开始构建
        // 就像记录开始制作特定装备
        logger_1.default.info('构建Raydium交换交易', MODULE_NAME);
        // 创建新交易
        // 就像准备一个新的装备框架
        const transaction = new web3_js_1.Transaction();
        const signers = [params.wallet];
        try {
            // 添加交易优先级指令(如果启用)
            // 就像添加特殊推进装置以加速
            this.addPriorityFeeInstruction(transaction);
            // 获取最新区块哈希
            // 就像确认当前海洋状态
            const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.lastValidBlockHeight = lastValidBlockHeight;
            transaction.feePayer = params.wallet.publicKey;
            // TODO: 实现Raydium交换指令构建
            // 实际实现会需要与Raydium程序进行交互，构建交换指令
            // 这里仅作为示例，实际需要根据Raydium API和程序结构实现
            // 记录构建完成
            // 就像记录装备制作完成
            logger_1.default.info('Raydium交换交易构建完成', MODULE_NAME);
            // 返回构建结果
            // 就像交付完成的装备和使用说明
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
            // 处理错误
            // 就像处理装备制作失败
            logger_1.default.error('构建Raydium交换指令时出错', MODULE_NAME, error);
            throw error;
        }
    }
    /**
     * 构建Orca交换交易
     * 专门为Orca DEX构建交易指令
     *
     * 【比喻解释】
     * 这就像为"深海暗流"（Orca）定制专用捕鱼装备：
     * - 记录开始制作特定海域装备（日志记录）
     * - 准备一个全新的装备框架（新建交易）
     * - 附加使用这套装备的合法证明（签名者）
     * - 如果需要加速，添加特殊推进器（优先级费用）
     * - 确认海洋当前状态（获取最新区块）
     * - 按照"深海暗流"的水流特性组装专用网具（构建指令）
     * - 提供完整的装备使用指南和效果预测（返回结果）
     *
     * 【编程语法通俗翻译】
     * private = 工坊秘方：工坊内部的专有技术
     * async = 精细工艺：需要时间完成的精密制作
     *
     * @param params 交换参数，就像详细的捕捞需求
     * @returns 交易构建结果，就像制作完成的专用渔具
     */
    async buildOrcaSwap(params) {
        // 记录开始构建
        // 就像记录开始制作特定装备
        logger_1.default.info('构建Orca交换交易', MODULE_NAME);
        // 创建新交易
        // 就像准备一个新的装备框架
        const transaction = new web3_js_1.Transaction();
        const signers = [params.wallet];
        try {
            // 添加交易优先级指令(如果启用)
            // 就像添加特殊推进装置以加速
            this.addPriorityFeeInstruction(transaction);
            // 获取最新区块哈希
            // 就像确认当前海洋状态
            const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.lastValidBlockHeight = lastValidBlockHeight;
            transaction.feePayer = params.wallet.publicKey;
            // TODO: 实现Orca交换指令构建
            // 实际实现会需要与Orca程序进行交互，构建交换指令
            // 这里仅作为示例，实际需要根据Orca API和程序结构实现
            // 记录构建完成
            // 就像记录装备制作完成
            logger_1.default.info('Orca交换交易构建完成', MODULE_NAME);
            // 返回构建结果
            // 就像交付完成的装备和使用说明
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
            // 处理错误
            // 就像处理装备制作失败
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
                const sourceTokenAccount = await Promise.resolve().then(() => __importStar(require('@solana/spl-token'))).then(splToken => splToken.getAssociatedTokenAddressSync(mint, source.publicKey, false, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID));
                // 查找目标账户的代币账户地址
                const destinationTokenAccount = await Promise.resolve().then(() => __importStar(require('@solana/spl-token'))).then(splToken => splToken.getAssociatedTokenAddressSync(mint, destination, false, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID));
                // TODO: 检查目标代币账户是否存在，如果不存在则创建
                // 添加转账指令
                const transferInstruction = await Promise.resolve().then(() => __importStar(require('@solana/spl-token'))).then(splToken => splToken.createTransferInstruction(sourceTokenAccount, destinationTokenAccount, source.publicKey, BigInt(amount.toString()), [], spl_token_1.TOKEN_PROGRAM_ID));
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
            const ownerTokenAccount = await Promise.resolve().then(() => __importStar(require('@solana/spl-token'))).then(splToken => splToken.getAssociatedTokenAddressSync(mint, owner.publicKey, false, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID));
            // 添加授权指令
            const approveInstruction = await Promise.resolve().then(() => __importStar(require('@solana/spl-token'))).then(splToken => splToken.createApproveInstruction(ownerTokenAccount, spender, owner.publicKey, BigInt(amount.toString()), [], spl_token_1.TOKEN_PROGRAM_ID));
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