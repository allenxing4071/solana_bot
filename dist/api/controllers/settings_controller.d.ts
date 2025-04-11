/**
 * 设置控制器
 * 处理系统配置和设置相关的所有请求
 */
import { Request, Response } from 'express';
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
