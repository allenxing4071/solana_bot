/**
 * 交易控制器
 * 处理与交易相关的所有请求
 */
import { Request, Response } from 'express';
/**
 * 获取交易列表
 */
export declare const getTransactions: (req: Request, res: Response) => Promise<void>;
/**
 * 获取交易详情
 */
export declare const getTransactionById: (req: Request, res: Response) => Promise<void>;
/**
 * 获取最近交易
 */
export declare const getRecentTransactions: (req: Request, res: Response) => Promise<void>;
