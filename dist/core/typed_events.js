"use strict";
/**
 * 类型安全的事件工具
 * 为Node.js的EventEmitter提供类型安全的包装器
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeOn = safeOn;
exports.safeOnce = safeOnce;
exports.safeEmit = safeEmit;
const node_events_1 = require("node:events");
const logger_1 = __importDefault(require("./logger"));
const MODULE_NAME = 'TypedEvents';
/**
 * 类型安全的事件处理函数
 * @param emitter 事件发射器
 * @param eventName 事件名称
 * @param handler 处理函数
 */
function safeOn(emitter, eventName, handler) {
    // 对于Service接口
    if (emitter && 'on' in emitter && typeof emitter.on === 'function') {
        emitter.on(eventName, ((data) => {
            try {
                // 传递数据到强类型处理器
                handler(data);
            }
            catch (error) {
                logger_1.default.error(`事件处理失败: ${eventName}`, MODULE_NAME, { error: error instanceof Error ? error.message : String(error) });
            }
        }));
        logger_1.default.debug(`已注册事件监听器: ${eventName}`, MODULE_NAME);
        return;
    }
    // 对于标准EventEmitter
    if (emitter && emitter instanceof node_events_1.EventEmitter) {
        emitter.on(eventName, (data) => {
            try {
                // 传递数据到强类型处理器
                handler(data);
            }
            catch (error) {
                logger_1.default.error(`事件处理失败: ${eventName}`, MODULE_NAME, { error: error instanceof Error ? error.message : String(error) });
            }
        });
        logger_1.default.debug(`已注册事件监听器: ${eventName}`, MODULE_NAME);
        return;
    }
    logger_1.default.warn(`尝试监听无效的事件发射器: ${eventName}`, MODULE_NAME);
}
/**
 * 监听一次事件
 * @param emitter 事件发射器
 * @param eventName 事件名称
 * @param handler 处理函数
 */
function safeOnce(emitter, eventName, handler) {
    if (!emitter || typeof emitter.once !== 'function') {
        logger_1.default.warn(`尝试监听无效的事件发射器: ${eventName}`, MODULE_NAME);
        return;
    }
    // 创建类型安全的包装处理器
    emitter.once(eventName, (data) => {
        try {
            // 传递数据到强类型处理器
            handler(data);
        }
        catch (error) {
            logger_1.default.error(`一次性事件处理失败: ${eventName}`, MODULE_NAME, { error: error instanceof Error ? error.message : String(error) });
        }
    });
    logger_1.default.debug(`已注册一次性事件监听器: ${eventName}`, MODULE_NAME);
}
/**
 * 安全地发出事件
 * @param emitter 事件发射器
 * @param eventName 事件名称
 * @param data 事件数据
 */
function safeEmit(emitter, eventName, data) {
    if (!emitter || typeof emitter.emit !== 'function') {
        logger_1.default.warn(`尝试从无效的事件发射器发出事件: ${eventName}`, MODULE_NAME);
        return false;
    }
    try {
        return emitter.emit(eventName, data);
    }
    catch (error) {
        logger_1.default.error(`发出事件失败: ${eventName}`, MODULE_NAME, { error: error instanceof Error ? error.message : String(error) });
        return false;
    }
}
// 导出默认模块
exports.default = {
    safeOn,
    safeOnce,
    safeEmit
};
//# sourceMappingURL=typed_events.js.map