"use strict";
/**
 * API服务器模块
 * 提供HTTP接口管理黑名单和白名单
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var express_1 = __importDefault(require("express"));
var cors_1 = __importDefault(require("cors"));
var logger_1 = __importDefault(require("../core/logger"));
var token_routes_1 = __importDefault(require("./routes/token_routes"));
// 模块名称
var MODULE_NAME = 'ApiServer';
// 默认API端口
var DEFAULT_PORT = 3000;
/**
 * API服务器类
 * 提供HTTP接口，允许管理黑名单和白名单
 */
var ApiServer = /** @class */ (function () {
    /**
     * 构造函数
     * @param port 服务器端口
     */
    function ApiServer(port) {
        if (port === void 0) { port = DEFAULT_PORT; }
        this.isRunning = false;
        this.app = (0, express_1["default"])();
        this.port = port;
        this.setupMiddleware();
        this.setupRoutes();
    }
    /**
     * 设置中间件
     */
    ApiServer.prototype.setupMiddleware = function () {
        // 使用JSON解析器
        this.app.use(express_1["default"].json());
        // 启用CORS
        this.app.use((0, cors_1["default"])());
        // 请求日志中间件
        this.app.use(function (req, res, next) {
            logger_1["default"].debug("API\u8BF7\u6C42: ".concat(req.method, " ").concat(req.path), MODULE_NAME, {
                ip: req.ip,
                query: req.query,
                params: req.params
            });
            next();
        });
    };
    /**
     * 设置路由
     */
    ApiServer.prototype.setupRoutes = function () {
        // 健康检查路由
        this.app.get('/api/health', function (req, res) {
            res.status(200).json({
                status: 'ok',
                timestamp: new Date().toISOString()
            });
        });
        // 代币相关路由
        this.app.use('/api/tokens', token_routes_1["default"]);
        // 错误处理中间件
        this.app.use(function (err, req, res, next) {
            logger_1["default"].error('API错误', MODULE_NAME, { error: err.message, stack: err.stack });
            res.status(err.status || 500).json({
                error: {
                    message: err.message || '服务器内部错误'
                }
            });
        });
    };
    /**
     * 启动服务器
     */
    ApiServer.prototype.start = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.isRunning) {
                logger_1["default"].warn('API服务器已经在运行', MODULE_NAME);
                return resolve();
            }
            try {
                _this.server = _this.app.listen(_this.port, function () {
                    _this.isRunning = true;
                    logger_1["default"].info("API\u670D\u52A1\u5668\u5DF2\u542F\u52A8\uFF0C\u76D1\u542C\u7AEF\u53E3 ".concat(_this.port), MODULE_NAME);
                    resolve();
                });
                // 处理错误
                _this.server.on('error', function (error) {
                    if (error.code === 'EADDRINUSE') {
                        logger_1["default"].error("\u7AEF\u53E3 ".concat(_this.port, " \u5DF2\u88AB\u5360\u7528"), MODULE_NAME);
                    }
                    else {
                        logger_1["default"].error('启动API服务器时出错', MODULE_NAME, error);
                    }
                    _this.isRunning = false;
                    reject(error);
                });
            }
            catch (error) {
                logger_1["default"].error('启动API服务器时出错', MODULE_NAME, error);
                _this.isRunning = false;
                reject(error);
            }
        });
    };
    /**
     * 停止服务器
     */
    ApiServer.prototype.stop = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this.isRunning || !_this.server) {
                logger_1["default"].warn('API服务器未运行', MODULE_NAME);
                return resolve();
            }
            _this.server.close(function (error) {
                if (error) {
                    logger_1["default"].error('关闭API服务器时出错', MODULE_NAME, error);
                    reject(error);
                }
                else {
                    logger_1["default"].info('API服务器已关闭', MODULE_NAME);
                    _this.isRunning = false;
                    resolve();
                }
            });
        });
    };
    /**
     * 检查服务器是否正在运行
     * @returns 服务器是否正在运行
     */
    ApiServer.prototype.isServerRunning = function () {
        return this.isRunning;
    };
    return ApiServer;
}());
// 创建并导出单例
var apiServer = new ApiServer(parseInt(process.env.API_PORT || '') || DEFAULT_PORT);
exports["default"] = apiServer;
