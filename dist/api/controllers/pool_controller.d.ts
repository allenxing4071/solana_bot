/**
 * 流动性池控制器
 * 处理与流动性池相关的所有请求
 */
import { Request, Response } from 'express';
/**
 * 获取所有流动性池
 * @param req 请求对象
 * @param res 响应对象
 *
 * @api {get} /api/pools 获取所有流动性池
 * @apiName GetAllPools
 * @apiGroup Pool
 * @apiVersion 1.0.0
 * @apiDescription 获取当前监控的所有流动性池列表
 *
 * @apiSuccess {Boolean} success 操作是否成功
 * @apiSuccess {Number} count 流动性池数量
 * @apiSuccess {Array} data 流动性池数组
 *
 * @apiSuccessExample {json} 成功响应:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "count": 2,
 *       "data": [
 *         {
 *           "address": "PoolAddress111111111111111111111111111111",
 *           "dex": "raydium",
 *           "tokenAMint": "TokenAMint11111111111111111111111111111",
 *           "tokenBMint": "TokenBMint11111111111111111111111111111",
 *           "tokenASymbol": "SOL",
 *           "tokenBSymbol": "USDC",
 *           "createdAt": 1649856000000,
 *           "firstDetectedAt": 1649856100000
 *         }
 *       ]
 *     }
 */
export declare const getAllPools: (req: Request, res: Response) => Promise<void>;
/**
 * 获取单个流动性池详情
 * @param req 请求对象
 * @param res 响应对象
 *
 * @api {get} /api/pools/:address 获取单个流动性池详情
 * @apiName GetPoolDetails
 * @apiGroup Pool
 * @apiVersion 1.0.0
 * @apiDescription 获取指定地址的流动性池详细信息
 *
 * @apiParam {String} address 池子地址
 *
 * @apiSuccess {Boolean} success 操作是否成功
 * @apiSuccess {Object} data 池子详情数据
 */
export declare const getPoolDetails: (req: Request, res: Response) => Promise<void>;
/**
 * 获取指定DEX的所有流动性池
 * @param req 请求对象
 * @param res 响应对象
 */
export declare const getPoolsByDex: (req: Request, res: Response) => Promise<void>;
/**
 * 获取包含指定代币的所有流动性池
 * @param req 请求对象
 * @param res 响应对象
 */
export declare const getPoolsByToken: (req: Request, res: Response) => Promise<void>;
/**
 * 获取流动性池统计信息
 * @param req 请求对象
 * @param res 响应对象
 */
export declare const getPoolStats: (_req: Request, res: Response) => Promise<void>;
