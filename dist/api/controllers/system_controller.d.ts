/**
 * 系统控制器
 * 处理与系统状态、性能监控和操作相关的所有请求
 */
import { Request, Response } from 'express';
declare global {
    namespace NodeJS {
        interface Global {
            gc?: () => void;
        }
    }
}
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
