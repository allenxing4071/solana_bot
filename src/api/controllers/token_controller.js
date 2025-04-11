"use strict";
/**
 * 代币控制器
 * 处理与代币黑名单/白名单相关的所有请求
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
exports.validateToken = exports.removeFromWhitelist = exports.addToWhitelist = exports.getWhitelist = exports.removeFromBlacklist = exports.addToBlacklist = exports.getBlacklist = void 0;
var fs_extra_1 = __importDefault(require("fs-extra"));
var web3_js_1 = require("@solana/web3.js");
var config_1 = __importDefault(require("../../core/config"));
var logger_1 = __importDefault(require("../../core/logger"));
var token_validator_1 = require("../../modules/analyzer/token_validator");
var risk_manager_1 = __importDefault(require("../../modules/risk/risk_manager"));
// 模块名称
var MODULE_NAME = 'TokenController';
// 黑名单和白名单文件路径
var blacklistPath = config_1["default"].security.tokenValidation.blacklistPath;
var whitelistPath = config_1["default"].security.tokenValidation.whitelistPath;
/**
 * 加载黑名单文件内容
 * @returns 黑名单数组
 */
function loadBlacklistFile() {
    return __awaiter(this, void 0, void 0, function () {
        var data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    if (!!fs_extra_1["default"].existsSync(blacklistPath)) return [3 /*break*/, 3];
                    return [4 /*yield*/, fs_extra_1["default"].ensureFile(blacklistPath)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, fs_extra_1["default"].writeJson(blacklistPath, [], { spaces: 2 })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, []];
                case 3: return [4 /*yield*/, fs_extra_1["default"].readJson(blacklistPath)];
                case 4:
                    data = _a.sent();
                    return [2 /*return*/, Array.isArray(data) ? data : []];
                case 5:
                    error_1 = _a.sent();
                    logger_1["default"].error("\u52A0\u8F7D\u9ED1\u540D\u5355\u6587\u4EF6\u5931\u8D25: ".concat(blacklistPath), MODULE_NAME, {
                        error: error_1 instanceof Error ? error_1.message : String(error_1)
                    });
                    return [2 /*return*/, []];
                case 6: return [2 /*return*/];
            }
        });
    });
}
/**
 * 保存黑名单到文件
 * @param blacklist 黑名单数组
 */
function saveBlacklistFile(blacklist) {
    return __awaiter(this, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fs_extra_1["default"].ensureFile(blacklistPath)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, fs_extra_1["default"].writeJson(blacklistPath, blacklist, { spaces: 2 })];
                case 2:
                    _a.sent();
                    logger_1["default"].info("\u9ED1\u540D\u5355\u5DF2\u6210\u529F\u4FDD\u5B58\u5230: ".concat(blacklistPath), MODULE_NAME);
                    return [2 /*return*/, true];
                case 3:
                    error_2 = _a.sent();
                    logger_1["default"].error("\u4FDD\u5B58\u9ED1\u540D\u5355\u5931\u8D25: ".concat(blacklistPath), MODULE_NAME, {
                        error: error_2 instanceof Error ? error_2.message : String(error_2)
                    });
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * 加载白名单文件内容
 * @returns 白名单数组
 */
function loadWhitelistFile() {
    return __awaiter(this, void 0, void 0, function () {
        var data, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    if (!!fs_extra_1["default"].existsSync(whitelistPath)) return [3 /*break*/, 3];
                    return [4 /*yield*/, fs_extra_1["default"].ensureFile(whitelistPath)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, fs_extra_1["default"].writeJson(whitelistPath, [], { spaces: 2 })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, []];
                case 3: return [4 /*yield*/, fs_extra_1["default"].readJson(whitelistPath)];
                case 4:
                    data = _a.sent();
                    return [2 /*return*/, Array.isArray(data) ? data : []];
                case 5:
                    error_3 = _a.sent();
                    logger_1["default"].error("\u52A0\u8F7D\u767D\u540D\u5355\u6587\u4EF6\u5931\u8D25: ".concat(whitelistPath), MODULE_NAME, {
                        error: error_3 instanceof Error ? error_3.message : String(error_3)
                    });
                    return [2 /*return*/, []];
                case 6: return [2 /*return*/];
            }
        });
    });
}
/**
 * 保存白名单到文件
 * @param whitelist 白名单数组
 */
function saveWhitelistFile(whitelist) {
    return __awaiter(this, void 0, void 0, function () {
        var error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fs_extra_1["default"].ensureFile(whitelistPath)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, fs_extra_1["default"].writeJson(whitelistPath, whitelist, { spaces: 2 })];
                case 2:
                    _a.sent();
                    logger_1["default"].info("\u767D\u540D\u5355\u5DF2\u6210\u529F\u4FDD\u5B58\u5230: ".concat(whitelistPath), MODULE_NAME);
                    return [2 /*return*/, true];
                case 3:
                    error_4 = _a.sent();
                    logger_1["default"].error("\u4FDD\u5B58\u767D\u540D\u5355\u5931\u8D25: ".concat(whitelistPath), MODULE_NAME, {
                        error: error_4 instanceof Error ? error_4.message : String(error_4)
                    });
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * 获取所有黑名单代币
 * @param req 请求对象
 * @param res 响应对象
 *
 * @api {get} /api/tokens/blacklist 获取所有黑名单代币
 * @apiName GetBlacklist
 * @apiGroup Token
 * @apiVersion 1.0.0
 * @apiDescription 获取当前所有黑名单代币列表
 *
 * @apiSuccess {Boolean} success 操作是否成功
 * @apiSuccess {Number} count 黑名单代币数量
 * @apiSuccess {Array} data 黑名单代币数组
 * @apiSuccess {String} data.mint 代币Mint地址
 * @apiSuccess {String} [data.symbol] 代币符号
 * @apiSuccess {String} [data.name] 代币名称
 * @apiSuccess {String} [data.reason] 加入黑名单的原因
 *
 * @apiSuccessExample {json} 成功响应:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "count": 2,
 *       "data": [
 *         {
 *           "mint": "ExampleBadToken111111111111111111111111111",
 *           "symbol": "SCAM",
 *           "name": "Scam Token Example",
 *           "reason": "已知诈骗项目"
 *         },
 *         {
 *           "mint": "AnotherBadToken22222222222222222222222222",
 *           "symbol": "RUG",
 *           "name": "Rug Pull Example",
 *           "reason": "流动性过低，可能是Rug Pull"
 *         }
 *       ]
 *     }
 */
var getBlacklist = function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var blacklist, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, loadBlacklistFile()];
            case 1:
                blacklist = _a.sent();
                res.status(200).json({
                    success: true,
                    count: blacklist.length,
                    data: blacklist
                });
                return [3 /*break*/, 3];
            case 2:
                error_5 = _a.sent();
                logger_1["default"].error('获取黑名单失败', MODULE_NAME, {
                    error: error_5 instanceof Error ? error_5.message : String(error_5)
                });
                res.status(500).json({
                    success: false,
                    error: '获取黑名单失败'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getBlacklist = getBlacklist;
/**
 * 添加代币到黑名单
 * @param req 请求对象
 * @param res 响应对象
 *
 * @api {post} /api/tokens/blacklist 添加代币到黑名单
 * @apiName AddToBlacklist
 * @apiGroup Token
 * @apiVersion 1.0.0
 * @apiDescription 将代币添加到黑名单，如果已存在则更新信息
 *
 * @apiParam {String} mint 代币Mint地址（必填）
 * @apiParam {String} [symbol] 代币符号
 * @apiParam {String} [name] 代币名称
 * @apiParam {String} [reason] 添加原因
 *
 * @apiParamExample {json} 请求示例:
 *     {
 *       "mint": "ExampleBadToken111111111111111111111111111",
 *       "symbol": "SCAM",
 *       "name": "Scam Token Example",
 *       "reason": "已知诈骗项目"
 *     }
 *
 * @apiSuccess {Boolean} success 操作是否成功
 * @apiSuccess {String} message 操作结果消息
 * @apiSuccess {Object} data 添加/更新的黑名单条目
 *
 * @apiSuccessExample {json} 成功响应 (新增):
 *     HTTP/1.1 201 Created
 *     {
 *       "success": true,
 *       "message": "代币已成功添加到黑名单",
 *       "data": {
 *         "mint": "ExampleBadToken111111111111111111111111111",
 *         "symbol": "SCAM",
 *         "name": "Scam Token Example",
 *         "reason": "已知诈骗项目"
 *       }
 *     }
 *
 * @apiSuccessExample {json} 成功响应 (更新):
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "message": "代币信息已在黑名单中更新",
 *       "data": {
 *         "mint": "ExampleBadToken111111111111111111111111111",
 *         "symbol": "SCAM",
 *         "name": "Scam Token Example",
 *         "reason": "已知诈骗项目 - 已更新"
 *       }
 *     }
 *
 * @apiError {Boolean} success 操作结果 (false)
 * @apiError {String} error 错误信息
 *
 * @apiErrorExample {json} 错误响应 (缺少参数):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "error": "缺少mint地址参数"
 *     }
 *
 * @apiErrorExample {json} 错误响应 (格式错误):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "error": "无效的Solana地址格式"
 *     }
 */
var addToBlacklist = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, mint_1, symbol, name_1, reason, blacklist, existingIndex, newEntry, error_6;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 6, , 7]);
                _a = req.body, mint_1 = _a.mint, symbol = _a.symbol, name_1 = _a.name, reason = _a.reason;
                if (!mint_1) {
                    res.status(400).json({
                        success: false,
                        error: '缺少mint地址参数'
                    });
                    return [2 /*return*/];
                }
                // 验证Mint地址是否有效
                try {
                    new web3_js_1.PublicKey(mint_1);
                }
                catch (error) {
                    res.status(400).json({
                        success: false,
                        error: '无效的Solana地址格式'
                    });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, loadBlacklistFile()];
            case 1:
                blacklist = _b.sent();
                existingIndex = blacklist.findIndex(function (item) {
                    return item.mint.toLowerCase() === mint_1.toLowerCase();
                });
                if (!(existingIndex !== -1)) return [3 /*break*/, 3];
                // 更新现有条目
                blacklist[existingIndex] = __assign(__assign({}, blacklist[existingIndex]), { symbol: symbol || blacklist[existingIndex].symbol, name: name_1 || blacklist[existingIndex].name, reason: reason || blacklist[existingIndex].reason });
                return [4 /*yield*/, saveBlacklistFile(blacklist)];
            case 2:
                _b.sent();
                res.status(200).json({
                    success: true,
                    message: '代币信息已在黑名单中更新',
                    data: blacklist[existingIndex]
                });
                return [3 /*break*/, 5];
            case 3:
                newEntry = __assign(__assign(__assign({ mint: mint_1 }, (symbol && { symbol: symbol })), (name_1 && { name: name_1 })), (reason && { reason: reason }));
                blacklist.push(newEntry);
                return [4 /*yield*/, saveBlacklistFile(blacklist)];
            case 4:
                _b.sent();
                // 同时更新内存中的黑名单
                risk_manager_1["default"].addToBlacklist(mint_1, reason || '通过API添加');
                res.status(201).json({
                    success: true,
                    message: '代币已成功添加到黑名单',
                    data: newEntry
                });
                _b.label = 5;
            case 5: return [3 /*break*/, 7];
            case 6:
                error_6 = _b.sent();
                logger_1["default"].error('添加代币到黑名单失败', MODULE_NAME, {
                    error: error_6 instanceof Error ? error_6.message : String(error_6)
                });
                res.status(500).json({
                    success: false,
                    error: '添加代币到黑名单失败'
                });
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.addToBlacklist = addToBlacklist;
/**
 * 从黑名单中移除代币
 * @param req 请求对象
 * @param res 响应对象
 */
var removeFromBlacklist = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var mint_2, blacklist, initialLength, filteredBlacklist, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                mint_2 = req.params.mint;
                if (!mint_2) {
                    res.status(400).json({
                        success: false,
                        error: '缺少mint参数'
                    });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, loadBlacklistFile()];
            case 1:
                blacklist = _a.sent();
                initialLength = blacklist.length;
                filteredBlacklist = blacklist.filter(function (item) { return item.mint.toLowerCase() !== mint_2.toLowerCase(); });
                if (filteredBlacklist.length === initialLength) {
                    res.status(404).json({
                        success: false,
                        error: '代币不在黑名单中'
                    });
                    return [2 /*return*/];
                }
                // 保存更新后的黑名单
                return [4 /*yield*/, saveBlacklistFile(filteredBlacklist)];
            case 2:
                // 保存更新后的黑名单
                _a.sent();
                // 同时更新内存中的黑名单
                risk_manager_1["default"].removeFromBlacklist(mint_2);
                res.status(200).json({
                    success: true,
                    message: '代币已从黑名单中移除',
                    data: { mint: mint_2 }
                });
                return [3 /*break*/, 4];
            case 3:
                error_7 = _a.sent();
                logger_1["default"].error('从黑名单移除代币失败', MODULE_NAME, {
                    error: error_7 instanceof Error ? error_7.message : String(error_7)
                });
                res.status(500).json({
                    success: false,
                    error: '从黑名单移除代币失败'
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.removeFromBlacklist = removeFromBlacklist;
/**
 * 获取所有白名单代币
 * @param req 请求对象
 * @param res 响应对象
 */
var getWhitelist = function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var whitelist, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, loadWhitelistFile()];
            case 1:
                whitelist = _a.sent();
                res.status(200).json({
                    success: true,
                    count: whitelist.length,
                    data: whitelist
                });
                return [3 /*break*/, 3];
            case 2:
                error_8 = _a.sent();
                logger_1["default"].error('获取白名单失败', MODULE_NAME, {
                    error: error_8 instanceof Error ? error_8.message : String(error_8)
                });
                res.status(500).json({
                    success: false,
                    error: '获取白名单失败'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getWhitelist = getWhitelist;
/**
 * 添加代币到白名单
 * @param req 请求对象
 * @param res 响应对象
 */
var addToWhitelist = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, mint_3, symbol, name_2, trusted, whitelist, existingIndex, newEntry, error_9;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 6, , 7]);
                _a = req.body, mint_3 = _a.mint, symbol = _a.symbol, name_2 = _a.name, trusted = _a.trusted;
                if (!mint_3) {
                    res.status(400).json({
                        success: false,
                        error: '缺少mint地址参数'
                    });
                    return [2 /*return*/];
                }
                // 验证Mint地址是否有效
                try {
                    new web3_js_1.PublicKey(mint_3);
                }
                catch (error) {
                    res.status(400).json({
                        success: false,
                        error: '无效的Solana地址格式'
                    });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, loadWhitelistFile()];
            case 1:
                whitelist = _b.sent();
                existingIndex = whitelist.findIndex(function (item) {
                    return item.mint.toLowerCase() === mint_3.toLowerCase();
                });
                if (!(existingIndex !== -1)) return [3 /*break*/, 3];
                // 更新现有条目
                whitelist[existingIndex] = __assign(__assign({}, whitelist[existingIndex]), { symbol: symbol || whitelist[existingIndex].symbol, name: name_2 || whitelist[existingIndex].name, trusted: trusted !== undefined ? trusted : whitelist[existingIndex].trusted });
                return [4 /*yield*/, saveWhitelistFile(whitelist)];
            case 2:
                _b.sent();
                res.status(200).json({
                    success: true,
                    message: '代币信息已在白名单中更新',
                    data: whitelist[existingIndex]
                });
                return [3 /*break*/, 5];
            case 3:
                newEntry = __assign(__assign(__assign({ mint: mint_3 }, (symbol && { symbol: symbol })), (name_2 && { name: name_2 })), (trusted !== undefined && { trusted: trusted }));
                whitelist.push(newEntry);
                return [4 /*yield*/, saveWhitelistFile(whitelist)];
            case 4:
                _b.sent();
                res.status(201).json({
                    success: true,
                    message: '代币已成功添加到白名单',
                    data: newEntry
                });
                _b.label = 5;
            case 5: return [3 /*break*/, 7];
            case 6:
                error_9 = _b.sent();
                logger_1["default"].error('添加代币到白名单失败', MODULE_NAME, {
                    error: error_9 instanceof Error ? error_9.message : String(error_9)
                });
                res.status(500).json({
                    success: false,
                    error: '添加代币到白名单失败'
                });
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.addToWhitelist = addToWhitelist;
/**
 * 从白名单中移除代币
 * @param req 请求对象
 * @param res 响应对象
 */
var removeFromWhitelist = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var mint_4, whitelist, initialLength, filteredWhitelist, error_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                mint_4 = req.params.mint;
                if (!mint_4) {
                    res.status(400).json({
                        success: false,
                        error: '缺少mint参数'
                    });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, loadWhitelistFile()];
            case 1:
                whitelist = _a.sent();
                initialLength = whitelist.length;
                filteredWhitelist = whitelist.filter(function (item) { return item.mint.toLowerCase() !== mint_4.toLowerCase(); });
                if (filteredWhitelist.length === initialLength) {
                    res.status(404).json({
                        success: false,
                        error: '代币不在白名单中'
                    });
                    return [2 /*return*/];
                }
                // 保存更新后的白名单
                return [4 /*yield*/, saveWhitelistFile(filteredWhitelist)];
            case 2:
                // 保存更新后的白名单
                _a.sent();
                res.status(200).json({
                    success: true,
                    message: '代币已从白名单中移除',
                    data: { mint: mint_4 }
                });
                return [3 /*break*/, 4];
            case 3:
                error_10 = _a.sent();
                logger_1["default"].error('从白名单移除代币失败', MODULE_NAME, {
                    error: error_10 instanceof Error ? error_10.message : String(error_10)
                });
                res.status(500).json({
                    success: false,
                    error: '从白名单移除代币失败'
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.removeFromWhitelist = removeFromWhitelist;
/**
 * 验证代币是否在白名单或黑名单中
 * @param req 请求对象
 * @param res 响应对象
 */
var validateToken = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var mint, isWhitelisted, isBlacklisted;
    return __generator(this, function (_a) {
        try {
            mint = req.params.mint;
            if (!mint) {
                res.status(400).json({
                    success: false,
                    error: '缺少mint参数'
                });
                return [2 /*return*/];
            }
            // 验证Mint地址是否有效
            try {
                new web3_js_1.PublicKey(mint);
            }
            catch (error) {
                res.status(400).json({
                    success: false,
                    error: '无效的Solana地址格式'
                });
                return [2 /*return*/];
            }
            isWhitelisted = token_validator_1.tokenValidator.isWhitelisted(mint);
            isBlacklisted = token_validator_1.tokenValidator.isBlacklisted(mint) || risk_manager_1["default"].isBlacklisted(mint);
            res.status(200).json({
                success: true,
                data: {
                    mint: mint,
                    isWhitelisted: isWhitelisted,
                    isBlacklisted: isBlacklisted,
                    status: isBlacklisted ? 'blacklisted' : (isWhitelisted ? 'whitelisted' : 'unknown')
                }
            });
        }
        catch (error) {
            logger_1["default"].error('验证代币状态失败', MODULE_NAME, {
                error: error instanceof Error ? error.message : String(error)
            });
            res.status(500).json({
                success: false,
                error: '验证代币状态失败'
            });
        }
        return [2 /*return*/];
    });
}); };
exports.validateToken = validateToken;
