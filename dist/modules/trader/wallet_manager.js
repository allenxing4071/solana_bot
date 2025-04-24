"use strict";
/**
 * 钱包管理器（渔船的财务舱）
 * 负责管理交易钱包、资金和代币
 *
 * 【编程基础概念通俗比喻】
 * 1. 钱包(Wallet) = 船长的保险箱：
 *    就像存放捕鱼许可证和贵重物品的保险箱
 *    例如：创建钱包就像配备一个有密码锁的保险箱
 *
 * 2. 密钥对(Keypair) = 船长的钥匙和身份证：
 *    就像开启保险箱的钥匙和证明身份的证件
 *    例如：privateKey就像保险箱的钥匙，publicKey就像船长的身份证
 *
 * 3. 代币余额(Token Balance) = 不同类型的捕获物库存：
 *    就像船上储存的各种不同鱼类的数量记录
 *    例如：getTokenBalance()就像清点某种鱼的库存
 *
 * 4. 资金转移(Transfer) = 捕获物交易：
 *    就像将捕获的鱼分配给不同的储藏舱或交易给其他渔船
 *    例如：transferSol()就像将某些捕获物转移到其他地方
 *
 * 5. 账户创建(Account Creation) = 新建储藏舱：
 *    就像在船上建造新的专用储藏空间
 *    例如：createTokenAccount()就像为特定鱼类建造专门的冷藏柜
 *
 * 【比喻解释】
 * 这个模块就像渔船上的财务舱：
 * - 保管船长的钥匙和身份证明（私钥和公钥）
 * - 记录和管理各类捕获物的库存（代币余额）
 * - 负责捕获物的转移和分配（转账功能）
 * - 为新类型的捕获物准备储藏空间（创建代币账户）
 * - 定期清点库存并向船长报告（余额查询）
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
exports.walletManager = void 0;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const config_1 = __importDefault(require("../../core/config"));
const logger_1 = __importDefault(require("../../core/logger"));
const rpc_service_1 = __importDefault(require("../../services/rpc_service"));
// 模块名称
// 就像这个财务舱的标识牌
const MODULE_NAME = 'WalletManager';
/**
 * 钱包管理器类
 * 负责管理交易钱包，提供代币操作相关功能
 *
 * 【比喻解释】
 * 这就像渔船上的财务管理员：
 * - 守护着船长的身份证明和钥匙（管理钱包）
 * - 熟知所有类型的捕获物和它们的价值（了解代币）
 * - 精确记录每次捕捞的收获（跟踪余额）
 * - 安排捕获物的存放和分配（执行转账）
 * - 确保所有交易都符合海洋法规（验证交易）
 * - 向船长报告财务状况（提供余额信息）
 *
 * 【编程语法通俗翻译】
 * class = 专业角色：船上有特定职责的专业人员
 * private = 私密信息：只有财务管理员知道的机密内容
 */
class WalletManager {
    /**
     * 构造函数
     * 初始化钱包管理器
     *
     * 【比喻解释】
     * 这就像财务管理员上船报到时：
     * - 接收船长的保险箱和钥匙（配置钱包）
     * - 设置与海港的通信设备（初始化连接）
     * - 确认保险箱正常工作（验证钱包）
     * - 向船长报告财务舱已准备就绪（日志记录）
     *
     * 【编程语法通俗翻译】
     * constructor = 入职仪式：接收职责并准备工作
     */
    constructor(privateKey) {
        try {
            // 从配置中加载钱包
            // 就像从安全地点取出保险箱
            this.loadWalletFromConfig(privateKey);
            // 初始化连接
            // 就像设置海港通信设备
            const connection = rpc_service_1.default.getConnection();
            if (!connection) {
                throw new Error('RPC连接未初始化');
            }
            this.connection = connection;
            logger_1.default.info('钱包管理器初始化完成', MODULE_NAME);
        }
        catch (error) {
            // 处理错误
            // 就像处理初始化过程中的意外情况
            logger_1.default.error('钱包管理器初始化失败', MODULE_NAME, error);
            throw new Error('钱包管理器初始化失败: ' + error.message);
        }
    }
    /**
     * 从配置加载钱包
     * 从配置文件或环境变量中加载钱包密钥
     *
     * 【比喻解释】
     * 这就像财务管理员从船长的秘密文件中取出钥匙：
     * - 检查配置文件中是否有钥匙信息（检查配置）
     * - 如果找到了钥匙，取出并保管好（加载密钥）
     * - 如果没找到钥匙，制作一把新钥匙（创建新钱包）
     * - 确认钥匙能正常使用（验证钱包）
     * - 将钥匙存放在安全的地方（保存密钥）
     *
     * 【编程语法通俗翻译】
     * private = 私密操作：不对外公开的内部工作
     */
    loadWalletFromConfig(privateKey) {
        try {
            // 检查配置是否包含私钥
            // 就像检查是否有既定的保险箱钥匙
            if (privateKey) {
                // 将私钥转换为数组
                // 就像将钥匙的描述转化为实际可用的钥匙
                const privateKeyArray = typeof privateKey === 'string' ? Uint8Array.from(Buffer.from(privateKey, 'base64')) : privateKey;
                // 创建钱包密钥对
                // 就像制作可用的保险箱钥匙和身份证
                this.tradingWallet = web3_js_1.Keypair.fromSecretKey(privateKeyArray);
                logger_1.default.info('已从配置加载交易钱包', MODULE_NAME);
            }
            else {
                // 如果配置中没有私钥，生成新钱包
                // 就像制作全新的保险箱和钥匙
                logger_1.default.warn('配置中未找到钱包私钥，将生成新钱包', MODULE_NAME);
                this.tradingWallet = web3_js_1.Keypair.generate();
                // 将新生成的私钥保存到配置中
                // 就像将新钥匙信息记录在安全文件中
                const privateKeyBase64 = Buffer.from(this.tradingWallet.secretKey).toString('base64');
                // 在实际应用中，这里应该更新配置文件
                logger_1.default.info('已生成新交易钱包', MODULE_NAME);
            }
            // 记录钱包公钥
            // 就像记录船长的身份证号码
            logger_1.default.info(`交易钱包公钥: ${this.tradingWallet.publicKey.toString()}`, MODULE_NAME);
        }
        catch (error) {
            // 处理错误
            // 就像处理钥匙出问题的情况
            logger_1.default.error('加载钱包失败', MODULE_NAME, error);
            throw error;
        }
    }
    /**
     * 获取交易钱包
     * 返回当前使用的交易钱包
     *
     * 【比喻解释】
     * 这就像船长要求查看自己的保险箱和钥匙：
     * - 财务管理员拿出保管的保险箱钥匙和身份证（返回钱包）
     *
     * @returns 钱包密钥对，就像保险箱钥匙和身份证
     */
    getWallet() {
        return this.tradingWallet;
    }
    /**
     * 获取SOL余额
     * 查询指定地址的SOL代币余额
     *
     * 【比喻解释】
     * 这就像检查渔船的基本燃料储备：
     * - 使用通信设备联系海港查询（连接区块链）
     * - 询问特定船只的燃料储备情况（查询余额）
     * - 将得到的数值转换为船长熟悉的单位（转换单位）
     * - 向船长报告当前燃料储备（返回余额）
     *
     * 【编程语法通俗翻译】
     * async = 需等待的操作：需要耐心等待结果的任务
     *
     * @param address 要查询的地址，就像询问哪艘船的燃料储备
     * @returns SOL余额，就像燃料储备量
     */
    async getSOLBalance(address) {
        try {
            // 如果未指定地址，使用钱包地址
            // 就像如果没指定船只，就查询自己船的燃料
            const targetAddress = address || this.tradingWallet.publicKey;
            // 查询SOL余额
            // 就像询问海港关于燃料储备的情况
            const balance = await this.connection.getBalance(targetAddress);
            // 将lamports转换为SOL
            // 就像将技术单位转换为船长熟悉的单位
            const solBalance = balance / web3_js_1.LAMPORTS_PER_SOL;
            logger_1.default.debug(`地址 ${targetAddress.toString()} 的SOL余额: ${solBalance}`, MODULE_NAME);
            return solBalance;
        }
        catch (error) {
            // 处理错误
            // 就像处理通信故障
            logger_1.default.error('获取SOL余额失败', MODULE_NAME, error);
            throw error;
        }
    }
    /**
     * 获取代币余额
     * 查询指定地址的特定代币余额
     *
     * 【比喻解释】
     * 这就像检查船上特定类型鱼的库存：
     * - 确认要查询哪种鱼的库存（确定代币和地址）
     * - 找到存放这种鱼的专用仓库（查找代币账户）
     * - 如果没有这种鱼的仓库，报告库存为零（处理不存在的账户）
     * - 清点仓库中的存量并记录（查询余额）
     * - 向船长报告该种鱼的确切存量（返回余额）
     *
     * 【编程语法通俗翻译】
     * async = 需等待的操作：需要耐心等待结果的任务
     * try/catch = 安全预案：有备无患的做法
     *
     * @param token 代币信息，就像要查询哪种鱼的信息
     * @param address 要查询的地址，就像询问哪艘船的库存
     * @returns 代币余额，就像特定鱼类的库存量
     */
    async getTokenBalance(token, address) {
        try {
            // 如果未指定地址，使用钱包地址
            // 就像如果没指定船只，就查询自己船上的鱼
            const ownerAddress = address || this.tradingWallet.publicKey;
            // 获取关联代币账户地址
            // 就像确定仓库位置
            const tokenAccountAddress = await Promise.resolve().then(() => __importStar(require('@solana/spl-token'))).then(splToken => splToken.getAssociatedTokenAddressSync(token.mint, ownerAddress, false, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID));
            // 查询代币余额
            // 就像检查仓库中的鱼数量
            try {
                const response = await this.connection.getTokenAccountBalance(tokenAccountAddress);
                const balance = Number(response.value.amount) / Math.pow(10, response.value.decimals);
                logger_1.default.debug(`地址 ${ownerAddress.toString()} 的代币 ${token.symbol} 余额: ${balance}`, MODULE_NAME);
                return balance;
            }
            catch (error) {
                // 账户可能不存在
                // 就像这种鱼可能还没有专门的仓库
                logger_1.default.debug(`代币账户 ${tokenAccountAddress.toString()} 不存在或余额为0`, MODULE_NAME);
                return 0;
            }
        }
        catch (error) {
            // 处理错误
            // 就像处理检查过程中的意外情况
            logger_1.default.error('获取代币余额失败', MODULE_NAME, error);
            throw error;
        }
    }
    /**
     * 转移SOL
     * 将SOL从交易钱包转移到指定地址
     *
     * 【比喻解释】
     * 这就像将船上的燃料转移给另一艘船：
     * - 确认要转移多少燃料（确定金额）
     * - 确认要转给哪艘船（确定接收地址）
     * - 准备一份正式的转移文件（创建交易）
     * - 船长签署转移文件（签名交易）
     * - 通过海港执行燃料转移（发送交易）
     * - 等待确认转移完成（等待确认）
     * - 记录转移结果（日志记录）
     *
     * 【编程语法通俗翻译】
     * async = 需等待的操作：需要耐心等待结果的任务
     *
     * @param toAddress 接收地址，就像接收燃料的船
     * @param amountSol 转移金额，就像要转移的燃料量
     * @returns 交易签名，就像转移操作的收据
     */
    async transferSol(toAddress, amountSol) {
        try {
            // 将SOL转换为lamports
            // 就像将船长习惯的单位转换为技术单位
            const lamports = amountSol * web3_js_1.LAMPORTS_PER_SOL;
            // 创建转账交易
            // 就像准备燃料转移文件
            const transaction = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.transfer({
                fromPubkey: this.tradingWallet.publicKey,
                toPubkey: toAddress,
                lamports
            }));
            // 获取最新区块哈希
            // 就像获取当前海港状态
            const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.lastValidBlockHeight = lastValidBlockHeight;
            transaction.feePayer = this.tradingWallet.publicKey;
            // 发送并确认交易
            // 就像执行燃料转移并等待确认
            const signature = await (0, web3_js_1.sendAndConfirmTransaction)(this.connection, transaction, [this.tradingWallet]);
            logger_1.default.info(`转移 ${amountSol} SOL 到 ${toAddress.toString()} 成功，交易ID: ${signature}`, MODULE_NAME);
            return signature;
        }
        catch (error) {
            // 处理错误
            // 就像处理转移过程中的意外情况
            logger_1.default.error('转移SOL失败', MODULE_NAME, error);
            throw error;
        }
    }
    /**
     * 创建关联代币账户
     * 为特定代币创建关联账户
     *
     * 【比喻解释】
     * 这就像为新类型的鱼创建专用存储仓库：
     * - 确认为哪种鱼建造仓库（确定代币）
     * - 确认建在哪艘船上（确定所有者）
     * - 检查是否已经有这种鱼的仓库（检查账户存在）
     * - 如果已有仓库，就不重复建造（返回已有账户）
     * - 准备建造仓库的方案图（创建交易）
     * - 船长签署建造命令（签名交易）
     * - 执行建造工作（发送交易）
     * - 确认仓库建造完成（等待确认）
     * - 记录新仓库的位置（返回地址）
     *
     * 【编程语法通俗翻译】
     * async = 需等待的操作：需要耐心等待结果的任务
     *
     * @param mintAddress 代币铸造地址，就像鱼的品种编号
     * @param owner 所有者地址，就像哪艘船需要这个仓库
     * @returns 代币账户地址，就像新仓库的位置
     */
    async createTokenAccount(mintAddress, owner) {
        var _a;
        try {
            // 如果未指定所有者，使用钱包地址
            // 就像如果没指定船只，就在自己船上建仓库
            const ownerAddress = owner || this.tradingWallet.publicKey;
            // 获取关联代币账户地址
            // 就像确定新仓库的位置
            const associatedTokenAddress = await Promise.resolve().then(() => __importStar(require('@solana/spl-token'))).then(splToken => splToken.getAssociatedTokenAddressSync(mintAddress, ownerAddress, false, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID));
            // 检查账户是否已存在
            // 就像检查是否已经有了这种鱼的仓库
            try {
                await this.connection.getTokenAccountBalance(associatedTokenAddress);
                logger_1.default.debug(`代币账户已存在: ${associatedTokenAddress.toString()}`, MODULE_NAME);
                return associatedTokenAddress;
            }
            catch (error) {
                // 账户不存在，继续创建
                // 就像确认需要建造新仓库
                if (!((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('account not found'))) {
                    throw error;
                }
            }
            // 创建关联代币账户的交易指令
            // 就像准备仓库建造图纸
            const createATAInstruction = await Promise.resolve().then(() => __importStar(require('@solana/spl-token'))).then(splToken => splToken.createAssociatedTokenAccountInstruction(this.tradingWallet.publicKey, // 支付费用的账户
            associatedTokenAddress, // 要创建的账户
            ownerAddress, // 账户所有者
            mintAddress, // 代币铸造地址
            spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID));
            const transaction = new web3_js_1.Transaction().add(createATAInstruction);
            // 获取最新区块哈希
            // 就像获取当前海港状态
            const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.lastValidBlockHeight = lastValidBlockHeight;
            transaction.feePayer = this.tradingWallet.publicKey;
            // 发送并确认交易
            // 就像执行仓库建造并等待完成
            const signature = await (0, web3_js_1.sendAndConfirmTransaction)(this.connection, transaction, [this.tradingWallet]);
            logger_1.default.info(`为代币 ${mintAddress.toString()} 创建账户成功: ${associatedTokenAddress.toString()}`, MODULE_NAME);
            return associatedTokenAddress;
        }
        catch (error) {
            // 处理错误
            // 就像处理建造过程中的意外情况
            logger_1.default.error('创建代币账户失败', MODULE_NAME, error);
            throw error;
        }
    }
}
// 创建并导出单例
exports.walletManager = new WalletManager(config_1.default.wallet.privateKey);
exports.default = exports.walletManager;
