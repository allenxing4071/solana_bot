/**
 * 日志工具模块
 * 用于记录系统的运行和错误信息
 */

const fs = require('node:fs');
const path = require('node:path');
const util = require('node:util');

// 确保日志目录存在
const LOG_DIR = path.join(process.cwd(), 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// 日志文件路径
const LOG_FILE = path.join(LOG_DIR, 'intelligent_routing.log');
const ERROR_LOG_FILE = path.join(LOG_DIR, 'intelligent_routing_error.log');

/**
 * 日志工具
 * 提供记录一般信息和错误的方法
 */
const logger = {
  /**
   * 记录普通日志信息
   * @param {...any} args 要记录的信息
   */
  log(...args) {
    const timestamp = new Date().toISOString();
    const message = util.format(...args);
    const logEntry = `[${timestamp}] INFO: ${message}\n`;
    
    // 输出到控制台
    console.log(`[INFO] ${message}`);
    
    // 写入日志文件
    fs.appendFileSync(LOG_FILE, logEntry);
  },
  
  /**
   * 记录错误信息
   * @param {...any} args 要记录的错误信息
   */
  error(...args) {
    const timestamp = new Date().toISOString();
    const message = util.format(...args);
    const logEntry = `[${timestamp}] ERROR: ${message}\n`;
    
    // 输出到错误控制台
    console.error(`[ERROR] ${message}`);
    
    // 写入错误日志文件
    fs.appendFileSync(ERROR_LOG_FILE, logEntry);
    
    // 同时写入普通日志文件，方便查看完整记录
    fs.appendFileSync(LOG_FILE, logEntry);
  },
  
  /**
   * 记录警告信息
   * @param {...any} args 要记录的警告信息
   */
  warn(...args) {
    const timestamp = new Date().toISOString();
    const message = util.format(...args);
    const logEntry = `[${timestamp}] WARN: ${message}\n`;
    
    // 输出到控制台
    console.warn(`[WARN] ${message}`);
    
    // 写入日志文件
    fs.appendFileSync(LOG_FILE, logEntry);
  },
  
  /**
   * 记录调试信息(仅在开发环境显示)
   * @param {...any} args 要记录的调试信息
   */
  debug(...args) {
    // 仅在开发环境记录调试信息
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      const message = util.format(...args);
      const logEntry = `[${timestamp}] DEBUG: ${message}\n`;
      
      // 输出到控制台
      console.debug(`[DEBUG] ${message}`);
      
      // 写入日志文件
      fs.appendFileSync(LOG_FILE, logEntry);
    }
  }
};

module.exports = { logger }; 