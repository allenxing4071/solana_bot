/**
 * 代币详情控制器
 * 处理与代币详细信息相关的请求
 */
import { Request, Response } from 'express';
/**
 * 获取代币详细信息
 */
export declare const getTokenDetails: (req: Request, res: Response) => Promise<void>;
/**
 * 获取代币列表
 */
export declare const getTokensList: (req: Request, res: Response) => Promise<void>;
