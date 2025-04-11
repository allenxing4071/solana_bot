"use strict";
/**
 * 日志服务模块
 * 为整个应用提供统一的日志记录功能
 *
 * 【编程基础概念通俗比喻】
 * 1. 日志(Logger) = 渔船航行记录本：
 *    记录船上发生的所有重要事件，便于回顾和分析
 *    例如：logger.info() 就像在航行日志中记录"今天天气晴朗，捕获10吨鱼"
 *
 * 2. 日志级别(Log Level) = 记录重要性分类：
 *    不同事件有不同重要性，分类记录便于关注重点
 *    例如：ERROR级别就像"船体进水"这样的紧急情况
 *
 * 3. 日志格式化(Formatting) = 规范记录格式：
 *    统一的记录格式便于阅读和分析
 *    例如：添加时间戳就像每条记录都标注"2023年5月10日14:30"
 *
 * 4. 日志输出(Transport) = 记录保存方式：
 *    决定记录保存在航海日志本上还是无线电广播出去
 *    例如：控制台输出就像向船员广播，文件输出就像写进正式航海日志
 *
 * 【比喻解释】
 * 这个日志服务就像渔船上的航海记录系统：
 * - 记录航行中的所有重要事件（程序运行中的关键节点）
 * - 区分紧急事件和日常事件（错误和普通日志）
 * - 统一记录格式便于日后查阅（结构化日志）
 * - 可以向不同目标发送记录（控制台、文件、远程服务）
 * - 记录包含详细的时间和位置信息（时间戳和上下文）
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
// 导入winston包及其类型
var winston = __importStar(require("winston"));
var config_1 = __importDefault(require("./config"));
// 颜色主题配置
// 就像给不同类型的事件使用不同颜色的墨水
var colors = {
    error: 'red',
    warn: 'yellow',
    info: 'blue',
    debug: 'green'
};
// 向winston添加颜色主题
// 就像告诉记录员使用什么颜色记录什么类型的信息
winston.addColors(colors);
/**
 * 格式化日志信息
 * 创建统一的日志格式化函数
 *
 * 【比喻解释】
 * 这就像设计统一的航海日志格式：
 * - 确保每条记录都有日期和时间（时间戳）
 * - 标记记录的重要性（日志级别）
 * - 记录事件发生的位置（模块名称）
 * - 记录完整的事件详情（消息和元数据）
 * - 使用颜色区分不同类型的记录（着色）
 *
 * 【编程语法通俗翻译】
 * format.combine = 合并格式：就像把多个记录规范组合使用
 * format.timestamp = 时间戳：给每条记录加上精确的时间
 * format.printf = 打印格式：决定最终记录的样子
 */
var customFormat = winston.format.combine(
// 添加时间戳
// 就像每条航海记录必须有精确的日期时间
winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
}), 
// 添加颜色
// 就像用不同颜色标记不同紧急程度的事件
winston.format.colorize({
    all: true
}), 
// 定义打印格式
// 就像规定航海日志的标准格式
winston.format.printf(function (info) {
    // 基础信息部分
    // 就像记录的标准内容
    var logMessage = "[".concat(info.timestamp, "] [").concat(info.level, "]");
    // 添加模块名称（如果有）
    // 就像记录是哪个船舱报告的情况
    if (info.module) {
        logMessage += " [".concat(info.module, "]");
    }
    // 添加主要信息
    // 就像记录事件的主要描述
    logMessage += ": ".concat(info.message);
    // 添加详细信息（如果有）
    // 就像记录事件的详细情况
    if (info.meta && Object.keys(info.meta).length) {
        logMessage += " ".concat(JSON.stringify(info.meta));
    }
    return logMessage;
}));
/**
 * 创建Winston日志记录器
 * 基于配置设置适当的日志级别和输出
 *
 * 【比喻解释】
 * 这就像组装一套完整的航海记录系统：
 * - 根据航行需求选择合适的记录设备（日志级别）
 * - 设置记录保存的地方（控制台/文件）
 * - 应用统一的记录格式（自定义格式）
 * - 确保系统随时可以记录重要信息（预配置）
 *
 * 【编程语法通俗翻译】
 * new winston.Logger = 创建记录员：指派一位专业记录员负责所有日志
 * transports = 传输方式：决定记录保存在哪里（航海日志本、无线电广播等）
 */
var winstonLogger = winston.createLogger({
    // 设置日志级别
    // 就像设置需要记录的事件重要性阈值
    level: config_1["default"].logging.level,
    // 应用自定义格式
    // 就像使用统一的航海日志格式
    format: customFormat,
    // 定义日志输出目标
    // 就像决定记录保存的方式
    transports: [
        // 输出到控制台
        // 就像向船员广播重要信息
        new winston.transports.Console()
        // 可以添加文件输出等
        // 就像同时保存到正式航海日志本中
        // new winston.transports.File({ filename: 'logs/app.log' })
    ]
});
/**
 * 创建日志辅助函数
 * 包装Winston日志器，添加模块上下文
 *
 * 【比喻解释】
 * 这就像设计标准化的记录流程：
 * - 简化记录方法（辅助函数）
 * - 确保每条记录都有来源信息（模块名）
 * - 支持添加详细的背景信息（元数据）
 * - 根据情况选择不同的记录重要性（日志级别）
 *
 * 【编程语法通俗翻译】
 * const logger = {} = 工具箱：准备一套专用的记录工具
 * module参数 = 来源标记：标记记录来自哪个船舱或部门
 * meta参数 = 详细情况：记录事件的具体细节和背景
 */
var logger = {
    /**
     * 记录调试信息
     * 低级别的技术细节，通常用于开发调试
     *
     * 【比喻解释】
     * 这就像记录船只日常运行的细节数据：
     * - 记录发动机运行参数（技术细节）
     * - 记录天气和洋流状况（环境数据）
     * - 这些记录对航行不是必须，但对分析船只性能很有用
     *
     * @param {string} message - 日志消息，就像记录的主要内容
     * @param {string} [module] - 模块名称，就像报告来源的船舱
     * @param {Record<string, unknown>} [meta] - 元数据，就像事件的详细背景
     */
    debug: function (message, module, meta) {
        winstonLogger.debug(message, { module: module, meta: meta });
    },
    /**
     * 记录信息
     * 常规操作信息，表示程序正常运行
     *
     * 【比喻解释】
     * 这就像记录船只的正常航行信息：
     * - 记录按计划到达某个航点（程序里程碑）
     * - 记录补给燃料和物资（资源使用）
     * - 记录例行维护工作（常规操作）
     *
     * @param {string} message - 日志消息，就像记录的主要内容
     * @param {string} [module] - 模块名称，就像报告来源的船舱
     * @param {Record<string, unknown>} [meta] - 元数据，就像事件的详细背景
     */
    info: function (message, module, meta) {
        winstonLogger.info(message, { module: module, meta: meta });
    },
    /**
     * 记录警告
     * 潜在问题或需要注意的情况
     *
     * 【比喻解释】
     * 这就像记录船只遇到的可能风险：
     * - 记录燃料不足警告（资源警告）
     * - 记录恶劣天气预警（环境风险）
     * - 记录设备出现小故障（功能降级）
     *
     * @param {string} message - 日志消息，就像记录的主要内容
     * @param {string} [module] - 模块名称，就像报告来源的船舱
     * @param {Record<string, unknown>} [meta] - 元数据，就像事件的详细背景
     */
    warn: function (message, module, meta) {
        winstonLogger.warn(message, { module: module, meta: meta });
    },
    /**
     * 记录错误
     * 严重问题或功能失败情况
     *
     * 【比喻解释】
     * 这就像记录船只遇到的严重问题：
     * - 记录发动机故障（系统错误）
     * - 记录船体进水（数据损坏）
     * - 记录导航系统失效（连接中断）
     *
     * @param {string} message - 日志消息，就像记录的主要内容
     * @param {string} [module] - 模块名称，就像报告来源的船舱
     * @param {Record<string, unknown>} [meta] - 元数据，就像事件的详细背景和错误堆栈
     */
    error: function (message, module, meta) {
        winstonLogger.error(message, { module: module, meta: meta });
    }
};
// 默认导出日志服务
// 就像让航海记录系统可以被其他部门使用
exports["default"] = logger;
