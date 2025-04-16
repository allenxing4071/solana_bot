import type { Request, Response } from 'express';
/**
 * 获取利润趋势数据
 * @param req 请求对象，可包含period参数（小时）
 * @param res 响应对象
 */
export declare const getProfitTrend: (req: Request, res: Response) => void;
/**
 * 获取代币趋势数据
 * @param req 请求对象，可包含period参数（小时）
 * @param res 响应对象
 */
export declare const getTokenTrend: (req: Request, res: Response) => void;
/**
 * 获取利润摘要数据
 * @param req 请求对象
 * @param res 响应对象
 */
export declare const getProfitSummary: (req: Request, res: Response) => void;
/**
 * 获取系统性能统计数据
 * @param req 请求对象
 * @param res 响应对象
 */
export declare const getSystemStats: (req: Request, res: Response) => void;
/**
 * 获取交易统计数据
 * @param req 请求对象
 * @param res 响应对象
 */
export declare const getTransactionStats: (req: Request, res: Response) => void;
/**
 * 获取代币统计数据
 * @param req 请求对象
 * @param res 响应对象
 */
export declare const getTokenStats: (req: Request, res: Response) => void;
