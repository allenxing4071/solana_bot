"use strict";
/**
 * 独立API服务器入口文件
 * 提供HTTP接口管理黑名单和白名单
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// 加载环境变量
dotenv_1.default.config();
const server_1 = __importDefault(require("./api/server"));
const logger_1 = __importDefault(require("./core/logger"));
const MODULE_NAME = 'ApiServerMain';
// 启动API服务器
async function startServer() {
    try {
        await server_1.default.start();
        logger_1.default.info('API服务器已成功启动', MODULE_NAME);
        // 添加进程处理器来优雅关闭
        process.on('SIGINT', handleShutdown);
        process.on('SIGTERM', handleShutdown);
        process.on('uncaughtException', (error) => {
            logger_1.default.error('捕获到未处理的异常', MODULE_NAME, {
                error: error instanceof Error ? error.toString() : String(error)
            });
        });
    }
    catch (error) {
        logger_1.default.error('启动API服务器失败', MODULE_NAME, {
            error: error instanceof Error ? error.toString() : String(error)
        });
        process.exit(1);
    }
}
// 处理关闭
async function handleShutdown() {
    logger_1.default.info('正在关闭API服务器...', MODULE_NAME);
    try {
        await server_1.default.stop();
        logger_1.default.info('API服务器已成功关闭', MODULE_NAME);
        process.exit(0);
    }
    catch (error) {
        logger_1.default.error('关闭API服务器时出错', MODULE_NAME, {
            error: error instanceof Error ? error.toString() : String(error)
        });
        process.exit(1);
    }
}
// 启动服务器
startServer();
//# sourceMappingURL=api-server.js.map