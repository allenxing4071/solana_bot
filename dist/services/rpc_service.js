"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rpcService = void 0;
const web3_js_1 = require("@solana/web3.js");
const config_1 = __importDefault(require("../core/config"));
const logger_1 = __importDefault(require("../core/logger"));
const MODULE_NAME = 'RPCService';
// 连接配置
const connectionConfig = {
    commitment: config_1.default.network.cluster === 'mainnet-beta' ? 'confirmed' : 'processed',
    confirmTransactionInitialTimeout: 60000
};
// 连接重试配置
const MAX_CONN_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
/**
 * 获取备用RPC端点
 * 从环境变量中解析备用RPC端点列表
 *
 * @returns 备用RPC端点数组
 */
function getBackupRPCEndpoints() {
    const backupEndpoints = process.env.BACKUP_RPC_ENDPOINTS || '';
    if (!backupEndpoints)
        return [];
    return backupEndpoints.split(',').filter(url => url.trim().startsWith('http'));
}
/**
 * RPC服务类
 * 负责管理与Solana RPC节点的通信
 */
class RPCService {
    /**
     * 构造函数
     */
    constructor() {
        this._connection = null;
        this._subscriptions = new Map();
        this.MAX_RETRIES = 3;
        this.RETRY_DELAY = 2000;
        const rpcUrl = config_1.default.network.rpcUrl;
        if (!rpcUrl) {
            logger_1.default.warn('未配置RPC URL，将在初始化时使用备用节点');
        }
    }
    /**
     * 初始化连接
     */
    async initialize() {
        var _a;
        try {
            // 获取RPC URL
            let rpcUrl = config_1.default.network.rpcUrl;
            // 如果主RPC URL未设置或明确使用备用节点
            if (!rpcUrl || process.env.USE_BACKUP_RPC === 'true') {
                const backupEndpoints = ((_a = process.env.BACKUP_RPC_ENDPOINTS) === null || _a === void 0 ? void 0 : _a.split(',')) || [];
                if (backupEndpoints.length > 0) {
                    rpcUrl = backupEndpoints[0].trim();
                    logger_1.default.info(`使用备用RPC节点: ${rpcUrl}`);
                }
                else {
                    throw new Error('未配置有效的RPC URL或备用节点');
                }
            }
            // 初始化连接
            this._connection = new web3_js_1.Connection(rpcUrl, {
                commitment: 'confirmed',
                confirmTransactionInitialTimeout: 60000
            });
            // 验证连接
            try {
                const version = await this._connection.getVersion();
                logger_1.default.info(`成功连接到Solana节点，版本: ${JSON.stringify(version)}`);
            }
            catch (error) {
                logger_1.default.error(`Solana节点连接测试失败: ${error instanceof Error ? error.message : String(error)}`);
                throw new Error('无法连接到Solana节点');
            }
            logger_1.default.info(`RPC服务初始化完成，节点: ${rpcUrl}`);
        }
        catch (error) {
            logger_1.default.error(`RPC服务初始化失败: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * 获取连接实例
     */
    getConnection() {
        return this._connection;
    }
    /**
     * 获取账户信息
     */
    async getAccountInfo(address, commitment) {
        if (!this._connection) {
            throw new Error('RPC连接未初始化');
        }
        try {
            return await this._connection.getAccountInfo(address, commitment);
        }
        catch (error) {
            logger_1.default.error(`获取账户信息失败: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
    /**
     * 获取程序账户
     */
    async getProgramAccounts(programId, filters) {
        if (!this._connection) {
            throw new Error('RPC连接未初始化');
        }
        try {
            const config = {};
            if (filters && filters.length > 0) {
                config.filters = filters;
            }
            const response = await this._connection.getProgramAccounts(programId, config);
            const result = [];
            if (response && Array.isArray(response)) {
                for (const item of response) {
                    result.push({
                        pubkey: item.pubkey,
                        account: item.account
                    });
                }
            }
            return result;
        }
        catch (error) {
            logger_1.default.error(`获取程序账户失败: ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
    }
    /**
     * 订阅账户变更
     */
    async subscribeAccount(address, callback, commitment) {
        if (!this._connection) {
            throw new Error('RPC连接未初始化');
        }
        try {
            const subscriptionId = this._connection.onAccountChange(address, callback, commitment);
            this._subscriptions.set(subscriptionId, { address, callback });
            return subscriptionId;
        }
        catch (error) {
            logger_1.default.error(`订阅账户变更失败: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * 订阅程序账户变更
     */
    async subscribeProgram(programId, callback, commitment) {
        if (!this._connection) {
            throw new Error('RPC连接未初始化');
        }
        try {
            const subscriptionId = this._connection.onProgramAccountChange(programId, (keyedAccountInfo) => {
                callback(keyedAccountInfo.accountInfo);
            }, commitment);
            this._subscriptions.set(subscriptionId, { programId, callback });
            return subscriptionId;
        }
        catch (error) {
            logger_1.default.error(`订阅程序账户变更失败: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * 订阅日志
     */
    async subscribeLogs(filter, callback) {
        if (!this._connection) {
            throw new Error('RPC连接未初始化');
        }
        try {
            const subscriptionId = this._connection.onLogs(filter, callback);
            this._subscriptions.set(subscriptionId, { filter, callback });
            return subscriptionId;
        }
        catch (error) {
            logger_1.default.error(`订阅日志失败: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * 取消订阅
     */
    async unsubscribe(subscriptionId) {
        if (!this._connection) {
            return false;
        }
        try {
            // 尝试不同类型的取消订阅方法
            let success = false;
            try {
                await this._connection.removeAccountChangeListener(subscriptionId);
                success = true;
            }
            catch (e) {
                // 可能不是账户变更监听器，尝试其他类型
            }
            if (!success) {
                try {
                    await this._connection.removeProgramAccountChangeListener(subscriptionId);
                    success = true;
                }
                catch (e) {
                    // 可能不是程序账户监听器，尝试其他类型
                }
            }
            if (!success) {
                try {
                    await this._connection.removeOnLogsListener(subscriptionId);
                    success = true;
                }
                catch (e) {
                    // 可能不是日志监听器
                    logger_1.default.debug(`无法移除监听器: ${e instanceof Error ? e.message : String(e)}`);
                }
            }
            if (success) {
                this._subscriptions.delete(subscriptionId);
            }
            else {
                logger_1.default.warn(`无法识别订阅类型，订阅ID: ${subscriptionId}`);
            }
            return success;
        }
        catch (error) {
            logger_1.default.error(`取消订阅失败: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }
    /**
     * 取消所有订阅
     */
    async unsubscribeAll() {
        if (!this._connection) {
            return;
        }
        for (const subscriptionId of this._subscriptions.keys()) {
            try {
                await this._connection.removeAccountChangeListener(subscriptionId);
            }
            catch (error) {
                logger_1.default.error(`取消订阅失败 (ID: ${subscriptionId}): ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        this._subscriptions.clear();
    }
    /**
     * 发送交易
     */
    async sendTransaction(transaction, signers, options) {
        if (!this._connection) {
            throw new Error('RPC连接未初始化');
        }
        try {
            // 处理不同类型的交易
            if (transaction instanceof web3_js_1.Transaction) {
                // 标准交易
                return await this._connection.sendTransaction(transaction, signers, options);
            }
            else {
                // 版本化交易
                return await this._connection.sendTransaction(transaction, options);
            }
        }
        catch (error) {
            logger_1.default.error(`发送交易失败: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * 带重试机制的函数执行
     */
    async withRetry(fn, ...args) {
        let lastError = null;
        for (let i = 0; i < this.MAX_RETRIES; i++) {
            try {
                return await fn(...args);
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                logger_1.default.warn(`操作失败，准备重试 (${i + 1}/${this.MAX_RETRIES})`, MODULE_NAME, {
                    error: lastError.message
                });
                if (i < this.MAX_RETRIES - 1) {
                    await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * (i + 1)));
                }
            }
        }
        throw lastError || new Error('重试次数已达上限');
    }
}
// 创建并导出单例
exports.rpcService = new RPCService();
exports.default = exports.rpcService;
