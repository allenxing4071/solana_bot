/**
 * 类型安全的事件工具
 * 为Node.js的EventEmitter提供类型安全的包装器
 */
import { EventEmitter } from 'node:events';
import type { Service } from './service';
/**
 * 类型安全的事件处理函数
 * @param emitter 事件发射器
 * @param eventName 事件名称
 * @param handler 处理函数
 */
export declare function safeOn<T>(emitter: Service | EventEmitter | null | undefined, eventName: string, handler: (data: T) => void): void;
/**
 * 监听一次事件
 * @param emitter 事件发射器
 * @param eventName 事件名称
 * @param handler 处理函数
 */
export declare function safeOnce<T>(emitter: EventEmitter | null | undefined, eventName: string, handler: (data: T) => void): void;
/**
 * 安全地发出事件
 * @param emitter 事件发射器
 * @param eventName 事件名称
 * @param data 事件数据
 */
export declare function safeEmit<T>(emitter: EventEmitter | null | undefined, eventName: string, data: T): boolean;
declare const _default: {
    safeOn: typeof safeOn;
    safeOnce: typeof safeOnce;
    safeEmit: typeof safeEmit;
};
export default _default;
