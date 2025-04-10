"use strict";
/**
 * 核心类型定义文件
 * 定义了整个系统中使用的基本数据类型和接口
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogLevel = exports.NotificationLevel = exports.EventType = exports.SystemStatus = exports.StrategyType = exports.DexType = void 0;
/**
 * DEX交易所类型
 */
var DexType;
(function (DexType) {
    DexType["RAYDIUM"] = "raydium";
    DexType["ORCA"] = "orca";
    DexType["JUPITER"] = "jupiter";
})(DexType || (exports.DexType = DexType = {}));
/**
 * 策略类型枚举
 */
var StrategyType;
(function (StrategyType) {
    StrategyType["TAKE_PROFIT"] = "take_profit";
    StrategyType["STOP_LOSS"] = "stop_loss";
    StrategyType["TRAILING_STOP"] = "trailing_stop";
    StrategyType["TIME_LIMIT"] = "time_limit"; // 时间限制
})(StrategyType || (exports.StrategyType = StrategyType = {}));
/**
 * 系统状态枚举
 */
var SystemStatus;
(function (SystemStatus) {
    SystemStatus["STARTING"] = "starting";
    SystemStatus["RUNNING"] = "running";
    SystemStatus["PAUSED"] = "paused";
    SystemStatus["ERROR"] = "error";
    SystemStatus["SHUTDOWN"] = "shutdown";
    SystemStatus["STOPPING"] = "stopping";
    SystemStatus["STOPPED"] = "stopped"; // 已停止
})(SystemStatus || (exports.SystemStatus = SystemStatus = {}));
/**
 * 事件类型枚举
 */
var EventType;
(function (EventType) {
    EventType["POOL_CREATED"] = "pool_created";
    EventType["NEW_POOL_DETECTED"] = "new_pool_detected";
    EventType["TRADE_EXECUTED"] = "trade_executed";
    EventType["POSITION_UPDATED"] = "position_updated";
    EventType["PRICE_UPDATED"] = "price_updated";
    EventType["ERROR_OCCURRED"] = "error_occurred";
})(EventType || (exports.EventType = EventType = {}));
/**
 * 通知级别枚举
 */
var NotificationLevel;
(function (NotificationLevel) {
    NotificationLevel["INFO"] = "info";
    NotificationLevel["WARNING"] = "warning";
    NotificationLevel["SUCCESS"] = "success";
    NotificationLevel["ERROR"] = "error"; // 错误
})(NotificationLevel || (exports.NotificationLevel = NotificationLevel = {}));
/**
 * 日志级别枚举
 */
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error"; // 错误
})(LogLevel || (exports.LogLevel = LogLevel = {}));
//# sourceMappingURL=types.js.map