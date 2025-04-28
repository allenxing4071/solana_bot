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

// 导入winston包及其类型
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import * as path from 'path';
import * as fs from 'fs';

// 默认日志配置
const defaultLogConfig = {
  level: 'info',
  file: false
};

// 确保日志目录存在
const logDir = './logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 颜色主题配置
// 就像给不同类型的事件使用不同颜色的墨水
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'blue',
  http: 'magenta',
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
const consoleFormat = winston.format.combine(
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
  
  // 错误堆栈格式化
  winston.format.errors({ stack: true }),
  
  // 定义打印格式
  // 就像规定航海日志的标准格式
  winston.format.printf((info) => {
    // 基础信息部分
    // 就像记录的标准内容
    let logMessage = `[${info.timestamp}] [${info.level}]`;
    
    // 添加模块名称（如果有）
    // 就像记录是哪个船舱报告的情况
    if (info.module) {
      logMessage += ` [${info.module}]`;
    }
    
    // 添加请求ID（如果有，用于API追踪）
    if (info.requestId) {
      logMessage += ` [req:${info.requestId}]`;
    }
    
    // 添加主要信息
    // 就像记录事件的主要描述
    logMessage += `: ${info.message}`;
    
    // 添加错误堆栈（如果有）
    if (info.stack) {
      logMessage += `\n${info.stack}`;
    }
    
    // 添加详细信息（如果有）
    // 就像记录事件的详细情况
    if (info.meta && Object.keys(info.meta).length) {
      logMessage += ` ${JSON.stringify(info.meta)}`;
    }
    
    return logMessage;
  })
);

// 文件输出格式（无颜色）
const fileFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// 根据环境决定是否启用文件日志
const isProduction = process.env.NODE_ENV === 'production';

// 创建文件轮转配置
const fileTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, '%DATE%-app.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: fileFormat
});

// 创建错误日志轮转配置
const errorFileTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, '%DATE%-error.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error',
  format: fileFormat
});

/**
 * 创建Winston日志记录器
 * 使用默认配置初始化
 */
const winstonLogger = winston.createLogger({
  // 使用默认日志级别
  level: defaultLogConfig.level,
  
  // 应用自定义格式
  format: consoleFormat,
  
  // 定义日志输出目标
  transports: [
    new winston.transports.Console()
  ]
});

// 在生产环境中添加文件日志
if (process.env.NODE_ENV === 'production') {
  winstonLogger.add(fileTransport);
  winstonLogger.add(errorFileTransport);
}

/**
 * 更新日志配置
 * 当应用配置准备好时调用此函数更新日志设置
 */
export function updateLoggerConfig(config: any) {
  if (config?.logging?.level) {
    winstonLogger.level = config.logging.level;
  }
  
  if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
    if (config?.logging?.file) {
      // 如果之前没有添加过文件传输，则添加
      if (!winstonLogger.transports.find(t => t instanceof winston.transports.DailyRotateFile)) {
        winstonLogger.add(fileTransport);
        winstonLogger.add(errorFileTransport);
      }
    } else {
      // 如果之前添加过文件传输，则移除
      winstonLogger.transports = winstonLogger.transports.filter(
        t => !(t instanceof winston.transports.DailyRotateFile)
      );
    }
  }
}

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
const logger = {
  /**
   * 记录调试信息
   * @param {string} message - 日志消息
   * @param {string} [module] - 模块名称
   * @param {any} [meta] - 元数据
   */
  debug: (message: string, module?: string, meta?: any): void => {
    winstonLogger.debug(message, { module, meta });
  },

  /**
   * 记录信息
   * @param {string} message - 日志消息
   * @param {string} [module] - 模块名称
   * @param {any} [meta] - 元数据
   */
  info: (message: string, module?: string, meta?: any): void => {
    winstonLogger.info(message, { module, meta });
  },

  /**
   * 记录警告
   * @param {string} message - 日志消息
   * @param {string} [module] - 模块名称
   * @param {any} [meta] - 元数据
   */
  warn: (message: string, module?: string, meta?: any): void => {
    winstonLogger.warn(message, { module, meta });
  },

  /**
   * 记录错误
   * @param {string} message - 日志消息
   * @param {string} [module] - 模块名称
   * @param {any} [meta] - 元数据
   */
  error: (message: string, module?: string, meta?: any): void => {
    winstonLogger.error(message, { module, meta });
  }
};

export { updateLoggerConfig };
export default logger;