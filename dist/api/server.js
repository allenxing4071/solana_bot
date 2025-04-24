"use strict";
/**
 * API服务器模块
 * 提供HTTP接口管理黑名单和白名单
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const node_path_1 = __importDefault(require("node:path"));
const logger_1 = __importDefault(require("../core/logger"));
const token_routes_1 = __importDefault(require("./routes/token_routes"));
const system_routes_1 = __importDefault(require("./routes/system_routes"));
const pool_routes_1 = __importDefault(require("./routes/pool_routes"));
const transaction_routes_1 = __importDefault(require("./routes/transaction_routes"));
const settings_routes_1 = __importDefault(require("./routes/settings_routes"));
const stats_routes_1 = __importDefault(require("./routes/stats_routes"));
const api_monitor_1 = __importDefault(require("./api-monitor")); // 使用TypeScript版本的API监控模块
const fs_1 = __importDefault(require("fs"));
// 模块名称
const MODULE_NAME = 'ApiServer';
// 获取API端口，默认为8081
const DEFAULT_PORT = 8081; // 使用8081端口
/**
 * API服务器类
 * 提供HTTP接口，允许管理黑名单和白名单
 */
class ApiServer {
    /**
     * 构造函数
     * @param port 服务器端口
     */
    constructor(port = DEFAULT_PORT) {
        this.server = null;
        this.isRunning = false;
        this.app = (0, express_1.default)();
        this.port = port;
        this.setupMiddleware();
        this.setupRoutes();
    }
    /**
     * 设置中间件
     */
    setupMiddleware() {
        // 使用JSON解析器
        this.app.use(express_1.default.json());
        // 启用CORS - 增强CORS配置
        this.app.use((0, cors_1.default)({
            origin: '*', // 允许所有来源
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: [
                'Content-Type',
                'Authorization',
                'cache-control',
                'pragma',
                'user-agent',
                'x-requested-with',
                'x-access-token',
                'access-control-allow-origin',
                'origin',
                'accept',
                'x-timestamp',
                'x-api-key'
            ],
            exposedHeaders: ['Content-Length', 'Content-Type'],
            credentials: true,
            maxAge: 86400 // 预检请求结果缓存1天
        }));
        // 提供静态文件 - 使用简化版API服务器相同的静态文件目录
        const staticDir = node_path_1.default.resolve(process.cwd(), 'public');
        logger_1.default.info(`静态文件目录: ${staticDir}`, MODULE_NAME);
        // 检查静态文件目录是否存在
        if (!fs_1.default.existsSync(staticDir)) {
            logger_1.default.error(`静态文件目录不存在: ${staticDir}`, MODULE_NAME);
        }
        else {
            logger_1.default.info(`静态文件目录内容: ${fs_1.default.readdirSync(staticDir).join(', ')}`, MODULE_NAME);
        }
        this.app.use(express_1.default.static(staticDir));
        // 添加请求日志中间件
        this.app.use((req, res, next) => {
            logger_1.default.debug(`API请求: ${req.method} ${req.path}`, MODULE_NAME, {
                ip: req.ip,
                query: req.query,
                params: req.params,
                headers: req.headers
            });
            next();
        });
    }
    /**
     * 设置路由
     */
    setupRoutes() {
        // 使用代币路由模块处理所有代币相关请求
        this.app.use('/api/tokens', token_routes_1.default);
        // 使用系统路由模块处理系统相关请求
        this.app.use('/api', system_routes_1.default);
        // 使用池路由模块处理池相关请求
        this.app.use('/api/pools', pool_routes_1.default);
        // 使用交易路由模块处理交易相关请求
        this.app.use('/api/transactions', transaction_routes_1.default);
        // 使用设置路由模块处理设置相关请求
        this.app.use('/api/settings', settings_routes_1.default);
        // 使用统计路由模块处理统计相关请求
        this.app.use('/api/stats', stats_routes_1.default);
        // 设置API监控页面路由
        (0, api_monitor_1.default)(this.app);
        // 添加模拟数据路由（用于API监控页面）
        this.setupMockDataRoutes();
        // 增加根路由，提供前端页面
        this.app.get('/', (_req, res) => {
            res.sendFile('index.html', { root: node_path_1.default.resolve(process.cwd(), 'solana_webbot') });
        });
        // 错误处理中间件
        this.app.use((err, _req, res, _next) => {
            logger_1.default.error('API错误', MODULE_NAME, { error: err.message, stack: err.stack });
            res.status(500).json({
                error: {
                    message: err.message || '服务器内部错误'
                }
            });
        });
    }
    /**
     * 设置模拟数据路由
     * 这些路由仅用于API监控页面显示，提供示例数据
     */
    setupMockDataRoutes() {
        // 利润汇总API
        this.app.get('/api/profit/summary', (_req, res) => {
            res.json({
                success: true,
                isMockData: true, // 明确标识这是模拟数据
                data: {
                    totalProfit: 158.56,
                    dailyProfit: 12.34,
                    weeklyProfit: 67.89,
                    monthlyProfit: 158.56,
                    bestTrade: {
                        token: "SOL",
                        profit: 8.56,
                        date: new Date().toISOString()
                    }
                }
            });
        });
        // 代币趋势API
        this.app.get('/api/token-trends', (_req, res) => {
            const data = [];
            const now = Date.now();
            for (let i = 0; i < 24; i++) {
                data.push({
                    time: new Date(now - i * 3600000).toISOString(),
                    count: Math.floor(Math.random() * 10) + 5
                });
            }
            res.json({
                success: true,
                isMockData: true, // 明确标识这是模拟数据
                data: data.reverse()
            });
        });
        // 利润趋势API
        this.app.get('/api/profit-trends', (_req, res) => {
            const data = [];
            const now = Date.now();
            for (let i = 0; i < 24; i++) {
                data.push({
                    time: new Date(now - i * 3600000).toISOString(),
                    value: (Math.random() * 2 + 0.5).toFixed(2)
                });
            }
            res.json({
                success: true,
                isMockData: true, // 明确标识这是模拟数据
                data: data.reverse()
            });
        });
        // 系统日志API
        this.app.get('/api/logs', (_req, res) => {
            res.json({
                success: true,
                isMockData: true, // 明确标识这是模拟数据
                data: [
                    { time: new Date().toISOString(), level: "info", message: "系统正常运行中" },
                    { time: new Date(Date.now() - 300000).toISOString(), level: "info", message: "发现新代币: TEST" },
                    { time: new Date(Date.now() - 600000).toISOString(), level: "warning", message: "API请求限流" },
                    { time: new Date(Date.now() - 900000).toISOString(), level: "info", message: "完成交易: SOL -> USDC" }
                ]
            });
        });
    }
    /**
     * 启动服务器
     */
    start() {
        return new Promise((resolve, reject) => {
            if (this.isRunning) {
                logger_1.default.warn('API服务器已经在运行', MODULE_NAME);
                return resolve();
            }
            try {
                this.server = this.app.listen(this.port, () => {
                    this.isRunning = true;
                    logger_1.default.info(`API服务器已启动，监听端口 ${this.port}`, MODULE_NAME);
                    resolve();
                });
                // 处理错误
                this.server.on('error', (error) => {
                    if (error.code === 'EADDRINUSE') {
                        logger_1.default.error(`端口 ${this.port} 已被占用`, MODULE_NAME);
                    }
                    else {
                        logger_1.default.error('启动API服务器时出错', MODULE_NAME, {
                            error: error.message,
                            code: error.code
                        });
                    }
                    this.isRunning = false;
                    reject(error);
                });
            }
            catch (error) {
                logger_1.default.error('启动API服务器时出错', MODULE_NAME, {
                    error: error instanceof Error ? error.message : String(error)
                });
                this.isRunning = false;
                reject(error);
            }
        });
    }
    /**
     * 停止服务器
     */
    stop() {
        return new Promise((resolve, reject) => {
            if (!this.isRunning || !this.server) {
                logger_1.default.warn('API服务器未运行', MODULE_NAME);
                return resolve();
            }
            this.server.close((error) => {
                if (error) {
                    logger_1.default.error('关闭API服务器时出错', MODULE_NAME, {
                        error: error.message
                    });
                    reject(error);
                }
                else {
                    logger_1.default.info('API服务器已关闭', MODULE_NAME);
                    this.isRunning = false;
                    resolve();
                }
            });
        });
    }
    /**
     * 检查服务器是否正在运行
     * @returns 服务器是否正在运行
     */
    isServerRunning() {
        return this.isRunning;
    }
}
// 创建并导出单例
const apiServer = new ApiServer(8081);
exports.default = apiServer;
// 如果直接运行此文件，则启动服务器
if (require.main === module) {
    apiServer.start()
        .then(() => {
        console.log(`API服务器已启动，监听端口 ${process.env.API_PORT || DEFAULT_PORT}`);
    })
        .catch(error => {
        console.error('启动API服务器失败:', error);
        process.exit(1);
    });
}
