/**
 * 类型安全的事件工具
 * 为Node.js的EventEmitter提供类型安全的包装器
 */

import { EventEmitter } from 'node:events';
import type { Service } from './service.js';
import logger from './logger.js';

const MODULE_NAME = 'TypedEvents';

/**
 * 类型安全的事件处理函数
 * @param emitter 事件发射器
 * @param eventName 事件名称
 * @param handler 处理函数
 */
export function safeOn<T>(
  emitter: Service | EventEmitter | null | undefined, 
  eventName: string, 
  handler: (data: T) => void
): void {
  // 对于Service接口
  if (emitter && 'on' in emitter && typeof emitter.on === 'function') {
    emitter.on(eventName, ((data: unknown) => {
      try {
        // 传递数据到强类型处理器
        handler(data as T);
      } catch (error) {
        logger.error(
          `事件处理失败: ${eventName}`, 
          MODULE_NAME, 
          { error: error instanceof Error ? error.message : String(error) }
        );
      }
    }) as (...args: unknown[]) => void);
    
    logger.debug(`已注册事件监听器: ${eventName}`, MODULE_NAME);
    return;
  }
  
  // 对于标准EventEmitter
  if (emitter && emitter instanceof EventEmitter) {
    emitter.on(eventName, (data: unknown) => {
      try {
        // 传递数据到强类型处理器
        handler(data as T);
      } catch (error) {
        logger.error(
          `事件处理失败: ${eventName}`, 
          MODULE_NAME, 
          { error: error instanceof Error ? error.message : String(error) }
        );
      }
    });
    
    logger.debug(`已注册事件监听器: ${eventName}`, MODULE_NAME);
    return;
  }
  
  logger.warn(`尝试监听无效的事件发射器: ${eventName}`, MODULE_NAME);
}

/**
 * 监听一次事件
 * @param emitter 事件发射器
 * @param eventName 事件名称
 * @param handler 处理函数
 */
export function safeOnce<T>(
  emitter: EventEmitter | null | undefined, 
  eventName: string, 
  handler: (data: T) => void
): void {
  if (!emitter || typeof emitter.once !== 'function') {
    logger.warn(`尝试监听无效的事件发射器: ${eventName}`, MODULE_NAME);
    return;
  }
  
  // 创建类型安全的包装处理器
  emitter.once(eventName, (data: unknown) => {
    try {
      // 传递数据到强类型处理器
      handler(data as T);
    } catch (error) {
      logger.error(
        `一次性事件处理失败: ${eventName}`, 
        MODULE_NAME, 
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  });
  
  logger.debug(`已注册一次性事件监听器: ${eventName}`, MODULE_NAME);
}

/**
 * 安全地发出事件
 * @param emitter 事件发射器
 * @param eventName 事件名称
 * @param data 事件数据
 */
export function safeEmit<T>(
  emitter: EventEmitter | null | undefined, 
  eventName: string, 
  data: T
): boolean {
  if (!emitter || typeof emitter.emit !== 'function') {
    logger.warn(`尝试从无效的事件发射器发出事件: ${eventName}`, MODULE_NAME);
    return false;
  }
  
  try {
    return emitter.emit(eventName, data);
  } catch (error) {
    logger.error(
      `发出事件失败: ${eventName}`, 
      MODULE_NAME, 
      { error: error instanceof Error ? error.message : String(error) }
    );
    return false;
  }
}

// 导出默认模块
export default {
  safeOn,
  safeOnce,
  safeEmit
}; 