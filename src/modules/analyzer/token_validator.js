"use strict";
/**
 * 代币验证器
 * 负责验证代币的合法性和安全性，包括白名单/黑名单检查
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
exports.tokenValidator = void 0;
var web3_js_1 = require("@solana/web3.js");
var fs_extra_1 = __importDefault(require("fs-extra"));
var config_1 = __importDefault(require("../../core/config"));
var logger_1 = __importDefault(require("../../core/logger"));
var rpc_service_1 = __importDefault(require("../../services/rpc_service"));
var MODULE_NAME = 'TokenValidator';
/**
 * 代币验证器
 * 负责检查代币是否符合交易条件，包括白名单/黑名单校验
 */
var TokenValidator = /** @class */ (function () {
    /**
     * 构造函数
     */
    function TokenValidator() {
        this.whitelist = new Map();
        this.blacklist = new Map();
        this.blacklistPatterns = [];
        this.tokenFilters = null;
        this.lastLoadTime = 0;
        this.RELOAD_INTERVAL = 5 * 60 * 1000; // 5分钟重新加载一次
        this.loadTokenLists();
    }
    /**
     * 加载代币白名单和黑名单
     */
    TokenValidator.prototype.loadTokenLists = function () {
        return __awaiter(this, void 0, void 0, function () {
            var whitelistPath, blacklistPath, tokenListData, fileData, data, error_1, fileData, data, error_2, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 19, , 20]);
                        whitelistPath = config_1["default"].security.tokenValidation.whitelistPath;
                        blacklistPath = config_1["default"].security.tokenValidation.blacklistPath;
                        logger_1["default"].info('开始加载代币列表', MODULE_NAME, {
                            whitelistPath: whitelistPath,
                            blacklistPath: blacklistPath
                        });
                        tokenListData = null;
                        if (!!fs_extra_1["default"].existsSync(whitelistPath)) return [3 /*break*/, 3];
                        logger_1["default"].warn("\u767D\u540D\u5355\u6587\u4EF6\u4E0D\u5B58\u5728\uFF0C\u521B\u5EFA\u7A7A\u767D\u540D\u5355: ".concat(whitelistPath), MODULE_NAME);
                        return [4 /*yield*/, fs_extra_1["default"].ensureFile(whitelistPath)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, fs_extra_1["default"].writeJson(whitelistPath, [], { spaces: 2 })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        if (!!fs_extra_1["default"].existsSync(blacklistPath)) return [3 /*break*/, 6];
                        logger_1["default"].warn("\u9ED1\u540D\u5355\u6587\u4EF6\u4E0D\u5B58\u5728\uFF0C\u521B\u5EFA\u7A7A\u9ED1\u540D\u5355: ".concat(blacklistPath), MODULE_NAME);
                        return [4 /*yield*/, fs_extra_1["default"].ensureFile(blacklistPath)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, fs_extra_1["default"].writeJson(blacklistPath, [], { spaces: 2 })];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        if (!fs_extra_1["default"].existsSync(whitelistPath)) return [3 /*break*/, 11];
                        _a.label = 7;
                    case 7:
                        _a.trys.push([7, 9, , 10]);
                        return [4 /*yield*/, fs_extra_1["default"].readFile(whitelistPath, 'utf8')];
                    case 8:
                        fileData = _a.sent();
                        data = JSON.parse(fileData);
                        // 检查是否为完整格式的代币列表文件
                        if (data.whitelist && data.blacklist) {
                            tokenListData = data;
                            logger_1["default"].info('从单一文件加载代币列表数据', MODULE_NAME);
                        }
                        else if (Array.isArray(data)) {
                            // 仅包含白名单数组
                            this.loadWhitelist(data);
                        }
                        else if (data.tokens) {
                            // 包含tokens字段的白名单
                            this.loadWhitelist(data.tokens);
                        }
                        else {
                            logger_1["default"].warn("\u767D\u540D\u5355\u6587\u4EF6\u683C\u5F0F\u4E0D\u6B63\u786E: ".concat(whitelistPath, "\uFF0C\u4F7F\u7528\u7A7A\u767D\u540D\u5355"), MODULE_NAME);
                            this.loadWhitelist([]);
                        }
                        return [3 /*break*/, 10];
                    case 9:
                        error_1 = _a.sent();
                        logger_1["default"].error("\u65E0\u6CD5\u89E3\u6790\u767D\u540D\u5355\u6587\u4EF6 ".concat(whitelistPath), MODULE_NAME, error_1);
                        this.loadWhitelist([]);
                        return [3 /*break*/, 10];
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        logger_1["default"].warn("\u767D\u540D\u5355\u6587\u4EF6 ".concat(whitelistPath, " \u4E0D\u5B58\u5728"), MODULE_NAME);
                        this.loadWhitelist([]);
                        _a.label = 12;
                    case 12:
                        if (!(!tokenListData && fs_extra_1["default"].existsSync(blacklistPath))) return [3 /*break*/, 17];
                        _a.label = 13;
                    case 13:
                        _a.trys.push([13, 15, , 16]);
                        return [4 /*yield*/, fs_extra_1["default"].readFile(blacklistPath, 'utf8')];
                    case 14:
                        fileData = _a.sent();
                        data = JSON.parse(fileData);
                        if (Array.isArray(data)) {
                            // 黑名单是简单数组
                            this.loadBlacklist(data, []);
                        }
                        else if (data.tokens) {
                            // 黑名单有tokens字段
                            this.loadBlacklist(data.tokens, data.patterns || []);
                        }
                        else {
                            logger_1["default"].warn("\u9ED1\u540D\u5355\u6587\u4EF6\u683C\u5F0F\u4E0D\u6B63\u786E: ".concat(blacklistPath, "\uFF0C\u4F7F\u7528\u7A7A\u9ED1\u540D\u5355"), MODULE_NAME);
                            this.loadBlacklist([], []);
                        }
                        return [3 /*break*/, 16];
                    case 15:
                        error_2 = _a.sent();
                        logger_1["default"].error("\u65E0\u6CD5\u89E3\u6790\u9ED1\u540D\u5355\u6587\u4EF6 ".concat(blacklistPath), MODULE_NAME, error_2);
                        this.loadBlacklist([], []);
                        return [3 /*break*/, 16];
                    case 16: return [3 /*break*/, 18];
                    case 17:
                        if (!tokenListData) {
                            logger_1["default"].warn("\u9ED1\u540D\u5355\u6587\u4EF6 ".concat(blacklistPath, " \u4E0D\u5B58\u5728"), MODULE_NAME);
                            this.loadBlacklist([], []);
                        }
                        _a.label = 18;
                    case 18:
                        // 如果使用完整格式的代币列表数据
                        if (tokenListData) {
                            this.loadWhitelist(tokenListData.whitelist.tokens);
                            this.loadBlacklist(tokenListData.blacklist.tokens, tokenListData.blacklist.patterns);
                            this.tokenFilters = tokenListData.tokenFilters;
                        }
                        this.lastLoadTime = Date.now();
                        logger_1["default"].info('代币列表加载完成', MODULE_NAME, {
                            whitelistSize: this.whitelist.size,
                            blacklistSize: this.blacklist.size,
                            blacklistPatterns: this.blacklistPatterns.length
                        });
                        return [3 /*break*/, 20];
                    case 19:
                        error_3 = _a.sent();
                        logger_1["default"].error('加载代币列表时出错', MODULE_NAME, error_3);
                        // 确保即使出错也有空的列表
                        this.whitelist.clear();
                        this.blacklist.clear();
                        this.blacklistPatterns = [];
                        return [3 /*break*/, 20];
                    case 20: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 加载白名单
     * @param tokens 白名单代币条目
     */
    TokenValidator.prototype.loadWhitelist = function (tokens) {
        this.whitelist.clear();
        for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
            var token = tokens_1[_i];
            if (token.mint) {
                this.whitelist.set(token.mint.toLowerCase(), token);
            }
        }
        logger_1["default"].info("\u5DF2\u52A0\u8F7D ".concat(this.whitelist.size, " \u4E2A\u767D\u540D\u5355\u4EE3\u5E01"), MODULE_NAME);
    };
    /**
     * 加载黑名单
     * @param tokens 黑名单代币条目
     * @param patterns 黑名单模式
     */
    TokenValidator.prototype.loadBlacklist = function (tokens, patterns) {
        this.blacklist.clear();
        this.blacklistPatterns = [];
        for (var _i = 0, tokens_2 = tokens; _i < tokens_2.length; _i++) {
            var token = tokens_2[_i];
            if (token.mint) {
                this.blacklist.set(token.mint.toLowerCase(), token);
            }
        }
        this.blacklistPatterns = patterns || [];
        logger_1["default"].info("\u5DF2\u52A0\u8F7D ".concat(this.blacklist.size, " \u4E2A\u9ED1\u540D\u5355\u4EE3\u5E01\u548C ").concat(this.blacklistPatterns.length, " \u4E2A\u9ED1\u540D\u5355\u6A21\u5F0F"), MODULE_NAME);
    };
    /**
     * 检查是否需要重新加载代币列表
     */
    TokenValidator.prototype.checkAndReloadIfNeeded = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = Date.now();
                        if (!(now - this.lastLoadTime > this.RELOAD_INTERVAL)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.loadTokenLists()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 验证代币
     * @param token 代币信息
     * @param liquidityUsd 流动性（美元）
     * @returns 验证结果
     */
    TokenValidator.prototype.validateToken = function (token, liquidityUsd) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var mintAddress, result, isWhitelisted, blacklistEntry, _loop_1, _i, _c, pattern, state_1, minLiquidity;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, this.checkAndReloadIfNeeded()];
                    case 1:
                        _d.sent();
                        mintAddress = token.mint.toBase58().toLowerCase();
                        result = {
                            isValid: true,
                            token: token,
                            riskScore: 0
                        };
                        // 1. 白名单检查
                        if (config_1["default"].security.tokenValidation.useWhitelist) {
                            isWhitelisted = this.whitelist.has(mintAddress);
                            result.isWhitelisted = isWhitelisted;
                            // 如果启用强制白名单，且代币不在白名单中，则拒绝
                            if (!isWhitelisted) {
                                result.isValid = false;
                                result.reason = '代币不在白名单中';
                                return [2 /*return*/, result];
                            }
                        }
                        // 2. 黑名单检查
                        if (config_1["default"].security.tokenValidation.useBlacklist) {
                            // 2.1 直接黑名单
                            if (this.blacklist.has(mintAddress)) {
                                blacklistEntry = this.blacklist.get(mintAddress);
                                result.isBlacklisted = true;
                                result.isValid = false;
                                result.reason = (blacklistEntry === null || blacklistEntry === void 0 ? void 0 : blacklistEntry.reason) || '代币在黑名单中';
                                return [2 /*return*/, result];
                            }
                            // 2.2 模式黑名单 (如果有代币名称和符号)
                            if (token.name || token.symbol) {
                                _loop_1 = function (pattern) {
                                    // 检查名称
                                    if (pattern.nameContains && token.name) {
                                        var name_1 = token.name.toLowerCase();
                                        if (pattern.nameContains.some(function (keyword) { return name_1.includes(keyword.toLowerCase()); })) {
                                            result.isBlacklisted = true;
                                            result.isValid = false;
                                            result.reason = pattern.reason || "\u4EE3\u5E01\u540D\u79F0\u5305\u542B\u53EF\u7591\u5173\u952E\u8BCD";
                                            return { value: result };
                                        }
                                    }
                                    // 检查符号
                                    if (pattern.symbolContains && token.symbol) {
                                        var symbol_1 = token.symbol.toLowerCase();
                                        if (pattern.symbolContains.some(function (keyword) { return symbol_1.includes(keyword.toLowerCase()); })) {
                                            result.isBlacklisted = true;
                                            result.isValid = false;
                                            result.reason = pattern.reason || "\u4EE3\u5E01\u7B26\u53F7\u5305\u542B\u53EF\u7591\u5173\u952E\u8BCD";
                                            return { value: result };
                                        }
                                    }
                                };
                                for (_i = 0, _c = this.blacklistPatterns; _i < _c.length; _i++) {
                                    pattern = _c[_i];
                                    state_1 = _loop_1(pattern);
                                    if (typeof state_1 === "object")
                                        return [2 /*return*/, state_1.value];
                                }
                            }
                        }
                        // 3. 流动性检查
                        if (liquidityUsd !== undefined) {
                            minLiquidity = ((_a = this.tokenFilters) === null || _a === void 0 ? void 0 : _a.minLiquidityUsd) ||
                                config_1["default"].security.tokenValidation.minLiquidityUsd;
                            if (liquidityUsd < minLiquidity) {
                                result.isValid = false;
                                result.reason = "\u6D41\u52A8\u6027\u592A\u4F4E: $".concat(liquidityUsd, " < $").concat(minLiquidity);
                                return [2 /*return*/, result];
                            }
                        }
                        // 4. 元数据检查
                        if (config_1["default"].security.tokenValidation.requireMetadata) {
                            // 如果没有元数据，尝试获取
                            if (!token.metadata && (token.metadata === undefined)) {
                                try {
                                    // 这里可能需要实现获取代币元数据的逻辑
                                    // 例如: token.metadata = await getTokenMetadata(token.mint);
                                    // 获取元数据失败的处理
                                    if (!token.metadata) {
                                        result.isValid = false;
                                        result.reason = '无法获取代币元数据';
                                        return [2 /*return*/, result];
                                    }
                                }
                                catch (error) {
                                    logger_1["default"].warn("\u83B7\u53D6\u4EE3\u5E01 ".concat(mintAddress, " \u5143\u6570\u636E\u5931\u8D25"), MODULE_NAME, error);
                                    result.isValid = false;
                                    result.reason = '获取代币元数据时出错';
                                    return [2 /*return*/, result];
                                }
                            }
                        }
                        // 5. 小数位检查
                        if (((_b = this.tokenFilters) === null || _b === void 0 ? void 0 : _b.requireDecimals) && token.decimals === undefined) {
                            result.isValid = false;
                            result.reason = '缺少代币小数位信息';
                            return [2 /*return*/, result];
                        }
                        // 执行更多自定义验证...
                        return [2 /*return*/, result];
                }
            });
        });
    };
    /**
     * 异步更新代币信息
     * @param token 代币信息
     * @returns 更新后的代币信息
     */
    TokenValidator.prototype.enrichTokenInfo = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var enrichedToken, mintInfo, parsedData, mintData, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        enrichedToken = __assign({}, token);
                        if (!(!token.name || !token.symbol || token.decimals === undefined)) return [3 /*break*/, 2];
                        return [4 /*yield*/, rpc_service_1["default"].connection.getParsedAccountInfo(token.mint)];
                    case 1:
                        mintInfo = _a.sent();
                        if (mintInfo.value && 'parsed' in mintInfo.value.data) {
                            parsedData = mintInfo.value.data.parsed;
                            if (parsedData.type === 'mint') {
                                mintData = parsedData.info;
                                enrichedToken.decimals = mintData.decimals;
                                // 其他字段...
                            }
                        }
                        _a.label = 2;
                    case 2: return [2 /*return*/, enrichedToken];
                    case 3:
                        error_4 = _a.sent();
                        logger_1["default"].warn("\u4E30\u5BCC\u4EE3\u5E01 ".concat(token.mint.toBase58(), " \u4FE1\u606F\u65F6\u51FA\u9519"), MODULE_NAME, error_4);
                        return [2 /*return*/, token]; // 返回原始代币信息
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 检查代币是否在白名单中
     * @param mintAddress 代币Mint地址
     * @returns 是否在白名单中
     */
    TokenValidator.prototype.isWhitelisted = function (mintAddress) {
        var address = typeof mintAddress === 'string'
            ? mintAddress.toLowerCase()
            : mintAddress.toBase58().toLowerCase();
        return this.whitelist.has(address);
    };
    /**
     * 检查代币是否在黑名单中
     * @param mintAddress 代币Mint地址
     * @returns 是否在黑名单中
     */
    TokenValidator.prototype.isBlacklisted = function (mintAddress) {
        var address = typeof mintAddress === 'string'
            ? mintAddress.toLowerCase()
            : mintAddress.toBase58().toLowerCase();
        return this.blacklist.has(address);
    };
    /**
     * 获取已知的代币信息
     * @param mintAddress 代币Mint地址
     * @returns 代币信息或null
     */
    TokenValidator.prototype.getKnownToken = function (mintAddress) {
        var address = typeof mintAddress === 'string'
            ? mintAddress.toLowerCase()
            : mintAddress.toBase58().toLowerCase();
        // 从白名单中查找
        var whitelistEntry = this.whitelist.get(address);
        if (whitelistEntry) {
            return {
                mint: new web3_js_1.PublicKey(whitelistEntry.mint),
                symbol: whitelistEntry.symbol,
                name: whitelistEntry.name,
                isTrusted: whitelistEntry.trusted
            };
        }
        return null;
    };
    return TokenValidator;
}());
// 创建并导出单例
exports.tokenValidator = new TokenValidator();
exports["default"] = exports.tokenValidator;
