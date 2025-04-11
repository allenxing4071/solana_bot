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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.rpcService = void 0;
var web3_js_1 = require("@solana/web3.js");
var config_1 = __importDefault(require("../core/config"));
var logger_1 = __importDefault(require("../core/logger"));
var MODULE_NAME = 'RPCService';
// 连接配置
var connectionConfig = {
    commitment: config_1["default"].network.cluster === 'mainnet-beta' ? 'confirmed' : 'processed',
    confirmTransactionInitialTimeout: 60000
};
// 连接重试配置
var MAX_CONN_RETRIES = 3;
var RETRY_DELAY_MS = 2000;
/**
 * 获取备用RPC端点
 * 从环境变量中解析备用RPC端点列表
 *
 * @returns 备用RPC端点数组
 */
function getBackupRPCEndpoints() {
    var backupEndpoints = process.env.BACKUP_RPC_ENDPOINTS || '';
    if (!backupEndpoints)
        return [];
    return backupEndpoints.split(',').filter(function (url) { return url.trim().startsWith('http'); });
}
/**
 * RPC服务类
 *
 * 【比喻解释】
 * 这就像渔船的通讯中心：
 * - 维护多种与陆地的联系方式（HTTP/WebSocket连接）
 * - 管理发出的所有通讯请求（RPC调用）
 * - 保持持续监听特定频道（订阅）
 */
var RPCService = /** @class */ (function () {
    /**
     * 构造函数
     *
     * 【比喻解释】
     * 这就像安装和调试通讯设备：
     * - 设置主要通讯线路（HTTP连接）
     * - 如有可能，建立实时通话频道（WebSocket）
     * - 记录设备就绪状态（日志）
     */
    function RPCService() {
        this._wsConnection = null;
        this._wsSubscriptions = new Map();
        this._backupEndpoints = [];
        this._currentEndpointIndex = 0;
        try {
            // 获取主RPC URL
            var rpcUrl = config_1["default"].network.rpcUrl;
            var wsUrl = config_1["default"].network.wsUrl;
            // 获取备用RPC端点
            this._backupEndpoints = getBackupRPCEndpoints();
            logger_1["default"].debug('初始化RPC连接配置', MODULE_NAME, {
                mainRpcUrl: rpcUrl,
                wsUrl: wsUrl,
                backupEndpoints: this._backupEndpoints
            });
            // 验证RPC URL
            if (!rpcUrl || !rpcUrl.startsWith('http')) {
                throw new Error('无效的RPC URL: ' + rpcUrl);
            }
            // 创建HTTP连接
            this._connection = new web3_js_1.Connection(rpcUrl, connectionConfig);
            // 创建WebSocket连接
            if (wsUrl && wsUrl.startsWith('wss')) {
                try {
                    this._wsConnection = new web3_js_1.Connection(wsUrl, connectionConfig);
                }
                catch (wsError) {
                    logger_1["default"].warn('WebSocket连接创建失败，使用HTTP连接作为备用', MODULE_NAME, {
                        error: wsError instanceof Error ? wsError.message : String(wsError)
                    });
                    this._wsConnection = this._connection;
                }
            }
            else {
                this._wsConnection = this._connection;
            }
            logger_1["default"].info('RPC服务初始化完成', MODULE_NAME, {
                cluster: config_1["default"].network.cluster,
                rpcUrl: rpcUrl,
                wsUrl: wsUrl,
                hasBackups: this._backupEndpoints.length > 0,
                hasWs: !!this._wsConnection && this._wsConnection !== this._connection
            });
        }
        catch (error) {
            logger_1["default"].error('RPC服务初始化失败', MODULE_NAME, {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    Object.defineProperty(RPCService.prototype, "connection", {
        /**
         * 获取主连接
         *
         * 【比喻解释】
         * 这就像获取主通讯设备的引用
         *
         * @return {Connection} - 主连接对象
         */
        get: function () {
            return this._connection;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(RPCService.prototype, "wsConnection", {
        /**
         * 获取WebSocket连接
         *
         * 【比喻解释】
         * 这就像获取实时通话设备的引用，如果没有则使用普通通讯设备
         *
         * @return {Connection|null} - WebSocket连接对象或主连接
         */
        get: function () {
            return this._wsConnection || this._connection;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * 切换到下一个备用RPC端点
     * 当当前端点出现故障时使用
     *
     * @returns {boolean} 是否成功切换到新端点
     */
    RPCService.prototype.switchToNextEndpoint = function () {
        if (this._backupEndpoints.length === 0) {
            logger_1["default"].warn('没有可用的备用RPC端点', MODULE_NAME);
            return false;
        }
        this._currentEndpointIndex = (this._currentEndpointIndex + 1) % this._backupEndpoints.length;
        var newEndpoint = this._backupEndpoints[this._currentEndpointIndex];
        try {
            this._connection = new web3_js_1.Connection(newEndpoint, connectionConfig);
            logger_1["default"].info("\u5DF2\u5207\u6362\u5230\u5907\u7528RPC\u7AEF\u70B9: ".concat(newEndpoint), MODULE_NAME);
            return true;
        }
        catch (error) {
            logger_1["default"].error('切换RPC端点失败', MODULE_NAME, {
                error: error instanceof Error ? error.message : String(error),
                endpoint: newEndpoint
            });
            return false;
        }
    };
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
    RPCService.prototype.isConnectionHealthy = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this._connection.getVersion()];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, !!result];
                    case 2:
                        error_1 = _a.sent();
                        logger_1["default"].error('RPC连接检查失败', MODULE_NAME, {
                            error: error_1 instanceof Error ? error_1.message : String(error_1)
                        });
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
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
    RPCService.prototype.reconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var mainRpcUrl, wsUrl, isHealthy, isHealthy, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        mainRpcUrl = config_1["default"].network.rpcUrl;
                        wsUrl = config_1["default"].network.wsUrl;
                        if (!(mainRpcUrl && mainRpcUrl.startsWith('http'))) return [3 /*break*/, 2];
                        this._connection = new web3_js_1.Connection(mainRpcUrl, connectionConfig);
                        if (wsUrl && wsUrl.startsWith('wss')) {
                            try {
                                this._wsConnection = new web3_js_1.Connection(wsUrl, connectionConfig);
                            }
                            catch (wsError) {
                                this._wsConnection = this._connection;
                            }
                        }
                        return [4 /*yield*/, this.isConnectionHealthy()];
                    case 1:
                        isHealthy = _a.sent();
                        if (isHealthy) {
                            logger_1["default"].info('RPC重连成功', MODULE_NAME);
                            return [2 /*return*/, true];
                        }
                        _a.label = 2;
                    case 2:
                        if (!this.switchToNextEndpoint()) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.isConnectionHealthy()];
                    case 3:
                        isHealthy = _a.sent();
                        if (isHealthy) {
                            logger_1["default"].info('备用RPC节点连接成功', MODULE_NAME);
                            return [2 /*return*/, true];
                        }
                        _a.label = 4;
                    case 4:
                        // 所有尝试都失败
                        logger_1["default"].warn('RPC重连后连接仍不健康', MODULE_NAME);
                        return [2 /*return*/, false];
                    case 5:
                        error_2 = _a.sent();
                        logger_1["default"].error('RPC重连失败', MODULE_NAME, {
                            error: error_2 instanceof Error ? error_2.message : String(error_2)
                        });
                        return [2 /*return*/, false];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
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
    RPCService.prototype.withRetry = function (fn) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var lastError, attempt, error_3, reconnected;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        attempt = 0;
                        _a.label = 1;
                    case 1:
                        if (!(attempt < MAX_CONN_RETRIES)) return [3 /*break*/, 9];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 8]);
                        return [4 /*yield*/, fn.apply(void 0, args)];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        error_3 = _a.sent();
                        lastError = error_3;
                        logger_1["default"].warn("RPC\u8C03\u7528\u5931\u8D25\uFF0C\u5C1D\u8BD5\u91CD\u8BD5 (".concat(attempt + 1, "/").concat(MAX_CONN_RETRIES, ")"), MODULE_NAME, {
                            error: error_3 instanceof Error ? error_3.message : String(error_3)
                        });
                        if (!this.isConnectionError(error_3)) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.reconnect()];
                    case 5:
                        reconnected = _a.sent();
                        // 如果重连失败且有备用端点，尝试切换端点
                        if (!reconnected && this._backupEndpoints.length > 0) {
                            this.switchToNextEndpoint();
                        }
                        _a.label = 6;
                    case 6: 
                    // 等待一段时间后重试
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, RETRY_DELAY_MS); })];
                    case 7:
                        // 等待一段时间后重试
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 8:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 9:
                        logger_1["default"].error('RPC调用在多次尝试后失败', MODULE_NAME, {
                            error: lastError instanceof Error ? lastError.message : String(lastError)
                        });
                        throw lastError;
                }
            });
        });
    };
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
    RPCService.prototype.simulateTransaction = function (transaction, signers) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this.withRetry(function () { return __awaiter(_this, void 0, void 0, function () {
                        var result;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    // 如果是普通交易且有签名者，需要先部分签名
                                    if (transaction instanceof web3_js_1.Transaction && signers && signers.length > 0) {
                                        transaction.sign.apply(transaction, signers);
                                    }
                                    if (!(transaction instanceof web3_js_1.Transaction)) return [3 /*break*/, 2];
                                    return [4 /*yield*/, this._connection.simulateTransaction(transaction, signers || [])];
                                case 1:
                                    result = _a.sent();
                                    return [3 /*break*/, 4];
                                case 2: return [4 /*yield*/, this._connection.simulateTransaction(transaction)];
                                case 3:
                                    result = _a.sent();
                                    _a.label = 4;
                                case 4:
                                    if (result.value.err) {
                                        logger_1["default"].warn('交易模拟失败', MODULE_NAME, {
                                            error: result.value.err,
                                            logs: result.value.logs
                                        });
                                    }
                                    return [2 /*return*/, result];
                            }
                        });
                    }); })];
            });
        });
    };
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
    RPCService.prototype.sendTransaction = function (transaction, signers, options) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this.withRetry(function () { return __awaiter(_this, void 0, void 0, function () {
                        var sendOptions, _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    sendOptions = __assign({ skipPreflight: false, preflightCommitment: connectionConfig.commitment, maxRetries: 3 }, options);
                                    if (!(transaction instanceof web3_js_1.Transaction)) return [3 /*break*/, 3];
                                    _a = transaction;
                                    return [4 /*yield*/, this._connection.getLatestBlockhash()];
                                case 1:
                                    _a.recentBlockhash = (_b.sent()).blockhash;
                                    transaction.sign.apply(transaction, signers);
                                    return [4 /*yield*/, this._connection.sendRawTransaction(transaction.serialize(), sendOptions)];
                                case 2: return [2 /*return*/, _b.sent()];
                                case 3: return [4 /*yield*/, this._connection.sendTransaction(transaction, sendOptions)];
                                case 4: 
                                // 注意：版本化交易的签名方式可能需要根据具体情况调整
                                return [2 /*return*/, _b.sent()];
                            }
                        });
                    }); })];
            });
        });
    };
    /**
     * 获取账户信息
     * @param address 账户地址
     * @param commitment 确认级别
     * @returns 账户信息
     */
    RPCService.prototype.getAccountInfo = function (address, commitment) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this.withRetry(function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this._connection.getAccountInfo(address, commitment || connectionConfig.commitment)];
                                case 1: return [2 /*return*/, _a.sent()];
                            }
                        });
                    }); })];
            });
        });
    };
    /**
     * 获取多个账户信息
     * @param addresses 账户地址列表
     * @param commitment 确认级别
     * @returns 账户信息列表
     */
    RPCService.prototype.getMultipleAccountsInfo = function (addresses, commitment) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this.withRetry(function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this._connection.getMultipleAccountsInfo(addresses, commitment || connectionConfig.commitment)];
                                case 1: return [2 /*return*/, _a.sent()];
                            }
                        });
                    }); })];
            });
        });
    };
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
    RPCService.prototype.getProgramAccounts = function (programId, commitment) {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.withRetry(function () { return __awaiter(_this, void 0, void 0, function () {
                                var accounts;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this._connection.getProgramAccounts(programId, {
                                                commitment: commitment || connectionConfig.commitment,
                                                // 可以添加更具体的过滤器以优化性能
                                                filters: [],
                                                encoding: 'base64'
                                            })];
                                        case 1:
                                            accounts = _a.sent();
                                            logger_1["default"].debug("\u83B7\u53D6\u5230 ".concat(accounts.length, " \u4E2A\u7A0B\u5E8F\u8D26\u6237"), MODULE_NAME, {
                                                programId: programId.toBase58(),
                                                count: accounts.length
                                            });
                                            return [2 /*return*/, accounts];
                                    }
                                });
                            }); })];
                    case 1: 
                    // 使用带重试功能的方法调用
                    return [2 /*return*/, _a.sent()];
                    case 2:
                        error_4 = _a.sent();
                        logger_1["default"].error("\u83B7\u53D6\u7A0B\u5E8F\u8D26\u6237\u5931\u8D25: ".concat(programId.toBase58()), MODULE_NAME, {
                            error: error_4 instanceof Error ? error_4.message : String(error_4)
                        });
                        // 出错时返回空数组，避免整个流程崩溃
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 订阅账户变化
     * @param address 账户地址
     * @param callback 回调函数
     * @param commitment 确认级别
     * @returns 订阅ID
     */
    RPCService.prototype.subscribeAccount = function (address, callback, commitment) {
        return __awaiter(this, void 0, void 0, function () {
            var wsConn, subscriptionId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        wsConn = this.wsConnection;
                        if (!wsConn) {
                            throw new Error('WebSocket连接未配置');
                        }
                        return [4 /*yield*/, wsConn.onAccountChange(address, callback, commitment || connectionConfig.commitment)];
                    case 1:
                        subscriptionId = _a.sent();
                        // 保存订阅ID以便后续管理
                        this._wsSubscriptions.set(address.toBase58(), subscriptionId);
                        logger_1["default"].debug("\u5DF2\u8BA2\u9605\u8D26\u6237 ".concat(address.toBase58()), MODULE_NAME);
                        return [2 /*return*/, subscriptionId];
                }
            });
        });
    };
    /**
     * 订阅程序账户变化
     * @param programId 程序ID
     * @param callback 回调函数
     * @param commitment 确认级别
     * @returns 订阅ID
     */
    RPCService.prototype.subscribeProgram = function (programId, callback, commitment) {
        return __awaiter(this, void 0, void 0, function () {
            var wsConn, subscriptionId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        wsConn = this.wsConnection;
                        if (!wsConn) {
                            throw new Error('WebSocket连接未配置');
                        }
                        return [4 /*yield*/, wsConn.onProgramAccountChange(programId, callback, commitment || connectionConfig.commitment)];
                    case 1:
                        subscriptionId = _a.sent();
                        // 保存订阅ID以便后续管理
                        this._wsSubscriptions.set("program:".concat(programId.toBase58()), subscriptionId);
                        logger_1["default"].debug("\u5DF2\u8BA2\u9605\u7A0B\u5E8F ".concat(programId.toBase58()), MODULE_NAME);
                        return [2 /*return*/, subscriptionId];
                }
            });
        });
    };
    /**
     * 订阅日志
     * @param filter 日志过滤条件
     * @param callback 回调函数
     * @returns 订阅ID
     */
    RPCService.prototype.subscribeLogs = function (filter, callback) {
        return __awaiter(this, void 0, void 0, function () {
            var wsConn, subscriptionId, filterKey;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        wsConn = this.wsConnection;
                        if (!wsConn) {
                            throw new Error('WebSocket连接未配置');
                        }
                        return [4 /*yield*/, wsConn.onLogs(filter, callback)];
                    case 1:
                        subscriptionId = _a.sent();
                        if (filter instanceof web3_js_1.PublicKey) {
                            filterKey = "logs:".concat(filter.toBase58());
                        }
                        else {
                            // 安全地处理其他类型的过滤器
                            filterKey = "logs:filter:".concat(Math.random().toString(36).substring(2, 15));
                        }
                        this._wsSubscriptions.set(filterKey, subscriptionId);
                        logger_1["default"].debug("\u5DF2\u8BA2\u9605\u65E5\u5FD7 ".concat(filterKey), MODULE_NAME);
                        return [2 /*return*/, subscriptionId];
                }
            });
        });
    };
    /**
     * 取消订阅
     * @param subscriptionId 订阅ID
     * @returns 是否成功取消
     */
    RPCService.prototype.unsubscribe = function (subscriptionId) {
        return __awaiter(this, void 0, void 0, function () {
            var wsConn, _i, _a, _b, key, id, error_5;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        wsConn = this.wsConnection;
                        if (!wsConn) {
                            return [2 /*return*/, false];
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        // 使用Promise包装以返回布尔值
                        return [4 /*yield*/, wsConn.removeAccountChangeListener(subscriptionId)];
                    case 2:
                        // 使用Promise包装以返回布尔值
                        _c.sent();
                        // 从订阅Map中移除
                        for (_i = 0, _a = this._wsSubscriptions.entries(); _i < _a.length; _i++) {
                            _b = _a[_i], key = _b[0], id = _b[1];
                            if (id === subscriptionId) {
                                this._wsSubscriptions["delete"](key);
                                logger_1["default"].debug("\u5DF2\u53D6\u6D88\u8BA2\u9605 ".concat(key), MODULE_NAME);
                                break;
                            }
                        }
                        return [2 /*return*/, true];
                    case 3:
                        error_5 = _c.sent();
                        logger_1["default"].warn('取消订阅失败', MODULE_NAME, { error: error_5 instanceof Error ? error_5.message : String(error_5) });
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 取消所有订阅
     */
    RPCService.prototype.unsubscribeAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var wsConn, subscriptionIds, _i, subscriptionIds_1, id, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        wsConn = this.wsConnection;
                        if (!wsConn) {
                            return [2 /*return*/];
                        }
                        subscriptionIds = Array.from(this._wsSubscriptions.values());
                        _i = 0, subscriptionIds_1 = subscriptionIds;
                        _a.label = 1;
                    case 1:
                        if (!(_i < subscriptionIds_1.length)) return [3 /*break*/, 6];
                        id = subscriptionIds_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, wsConn.removeAccountChangeListener(id)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_6 = _a.sent();
                        logger_1["default"].warn("\u65E0\u6CD5\u53D6\u6D88\u8BA2\u9605ID ".concat(id), MODULE_NAME, { error: error_6 instanceof Error ? error_6.message : String(error_6) });
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6:
                        this._wsSubscriptions.clear();
                        logger_1["default"].info('已取消所有订阅', MODULE_NAME);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 判断是否为连接错误
     * @param error 错误对象
     * @returns 是否是连接错误
     */
    RPCService.prototype.isConnectionError = function (error) {
        if (!error)
            return false;
        var errorString = String(error);
        return (errorString.includes('timed out') ||
            errorString.includes('network error') ||
            errorString.includes('failed to fetch') ||
            errorString.includes('connection closed'));
    };
    return RPCService;
}());
// 创建并导出单例
exports.rpcService = new RPCService();
exports["default"] = exports.rpcService;
