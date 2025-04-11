"use strict";
/**
 * 独立API服务器入口文件
 * 提供HTTP接口管理黑名单和白名单
 */
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
var dotenv_1 = __importDefault(require("dotenv"));
// 加载环境变量
dotenv_1["default"].config();
var server_1 = __importDefault(require("./api/server"));
var logger_1 = __importDefault(require("./core/logger"));
var MODULE_NAME = 'ApiServerMain';
// 启动API服务器
function startServer() {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, server_1["default"].start()];
                case 1:
                    _a.sent();
                    logger_1["default"].info('API服务器已成功启动', MODULE_NAME);
                    // 添加进程处理器来优雅关闭
                    process.on('SIGINT', handleShutdown);
                    process.on('SIGTERM', handleShutdown);
                    process.on('uncaughtException', function (error) {
                        logger_1["default"].error('捕获到未处理的异常', MODULE_NAME, {
                            error: error instanceof Error ? error.toString() : String(error)
                        });
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    logger_1["default"].error('启动API服务器失败', MODULE_NAME, {
                        error: error_1 instanceof Error ? error_1.toString() : String(error_1)
                    });
                    process.exit(1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// 处理关闭
function handleShutdown() {
    return __awaiter(this, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logger_1["default"].info('正在关闭API服务器...', MODULE_NAME);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, server_1["default"].stop()];
                case 2:
                    _a.sent();
                    logger_1["default"].info('API服务器已成功关闭', MODULE_NAME);
                    process.exit(0);
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    logger_1["default"].error('关闭API服务器时出错', MODULE_NAME, {
                        error: error_2 instanceof Error ? error_2.toString() : String(error_2)
                    });
                    process.exit(1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// 启动服务器
startServer();
