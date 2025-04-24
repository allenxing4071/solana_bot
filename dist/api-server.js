"use strict";
/**
 * API服务器入口文件
 * 用于启动API服务器，提供系统管理和监控接口
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
const MODULE_NAME = 'ApiServerEntry';
/**
 * 主函数
 */
async function main() {
    try {
        logger_1.default.info('正在启动API服务器...', MODULE_NAME);
        // 启动API服务器
        await server_1.default.start();
        logger_1.default.info(`API服务器已成功启动，访问地址: http://localhost:8081`, MODULE_NAME);
        // 添加进程退出处理
        process.on('SIGINT', handleShutdown);
        process.on('SIGTERM', handleShutdown);
    }
    catch (error) {
        logger_1.default.error('API服务器启动失败', MODULE_NAME, {
            error: error instanceof Error ? error.message : String(error)
        });
        process.exit(1);
    }
}
/**
 * 处理服务器关闭
 */
async function handleShutdown() {
    try {
        logger_1.default.info('正在关闭API服务器...', MODULE_NAME);
        await server_1.default.stop();
        logger_1.default.info('API服务器已安全关闭', MODULE_NAME);
        process.exit(0);
    }
    catch (error) {
        logger_1.default.error('关闭API服务器时出错', MODULE_NAME, {
            error: error instanceof Error ? error.message : String(error)
        });
        process.exit(1);
    }
}
// 如果这个文件是直接运行的（而不是被导入的），则执行主函数
if (require.main === module) {
    main();
}
exports.default = server_1.default;
