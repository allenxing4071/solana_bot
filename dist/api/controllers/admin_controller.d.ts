/**
 * 管理控制器
 * 处理系统状态、设置和性能监控相关的所有请求
 */
import { type Request, type Response } from 'express';
/**
 * 获取系统状态
 */
export declare const getSystemStatus: (_req: Request, res: Response) => Promise<void>;
/**
 * 启动系统
 */
export declare const startSystem: (_req: Request, res: Response) => Promise<void>;
/**
 * 停止系统
 */
export declare const stopSystem: (_req: Request, res: Response) => Promise<void>;
/**
 * 优化内存
 */
export declare const optimizeMemory: (_req: Request, res: Response) => Promise<void>;
/**
 * 获取内存统计数据
 */
export declare const getMemoryStats: (_req: Request, res: Response) => Promise<void>;
/**
 * 获取系统设置
 */
export declare const getSettings: (_req: Request, res: Response) => Promise<void>;
/**
 * 保存系统设置
 */
export declare const saveSettings: (req: Request, res: Response) => Promise<void>;
/**
 * 应用系统设置
 */
export declare const applySettings: (req: Request, res: Response) => Promise<void>;
