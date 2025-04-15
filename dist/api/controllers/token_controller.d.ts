/**
 * 代币控制器
 * 处理与代币黑名单/白名单相关的所有请求
 */
import type { Request, Response } from 'express';
/**
 * 获取所有黑名单代币
 * @param req 请求对象
 * @param res 响应对象
 *
 * @api {get} /api/tokens/blacklist 获取所有黑名单代币
 * @apiName GetBlacklist
 * @apiGroup Token
 * @apiVersion 1.0.0
 * @apiDescription 获取当前所有黑名单代币列表
 *
 * @apiSuccess {Boolean} success 操作是否成功
 * @apiSuccess {Number} count 黑名单代币数量
 * @apiSuccess {Array} data 黑名单代币数组
 * @apiSuccess {String} data.mint 代币Mint地址
 * @apiSuccess {String} [data.symbol] 代币符号
 * @apiSuccess {String} [data.name] 代币名称
 * @apiSuccess {String} [data.reason] 加入黑名单的原因
 *
 * @apiSuccessExample {json} 成功响应:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "count": 2,
 *       "data": [
 *         {
 *           "mint": "ExampleBadToken111111111111111111111111111",
 *           "symbol": "SCAM",
 *           "name": "Scam Token Example",
 *           "reason": "已知诈骗项目"
 *         },
 *         {
 *           "mint": "AnotherBadToken22222222222222222222222222",
 *           "symbol": "RUG",
 *           "name": "Rug Pull Example",
 *           "reason": "流动性过低，可能是Rug Pull"
 *         }
 *       ]
 *     }
 */
export declare const getBlacklist: (_req: Request, res: Response) => Promise<void>;
/**
 * 添加代币到黑名单
 * @param req 请求对象
 * @param res 响应对象
 *
 * @api {post} /api/tokens/blacklist 添加代币到黑名单
 * @apiName AddToBlacklist
 * @apiGroup Token
 * @apiVersion 1.0.0
 * @apiDescription 将代币添加到黑名单，如果已存在则更新信息
 *
 * @apiParam {String} mint 代币Mint地址（必填）
 * @apiParam {String} [symbol] 代币符号
 * @apiParam {String} [name] 代币名称
 * @apiParam {String} [reason] 添加原因
 *
 * @apiParamExample {json} 请求示例:
 *     {
 *       "mint": "ExampleBadToken111111111111111111111111111",
 *       "symbol": "SCAM",
 *       "name": "Scam Token Example",
 *       "reason": "已知诈骗项目"
 *     }
 *
 * @apiSuccess {Boolean} success 操作是否成功
 * @apiSuccess {String} message 操作结果消息
 * @apiSuccess {Object} data 添加/更新的黑名单条目
 *
 * @apiSuccessExample {json} 成功响应 (新增):
 *     HTTP/1.1 201 Created
 *     {
 *       "success": true,
 *       "message": "代币已成功添加到黑名单",
 *       "data": {
 *         "mint": "ExampleBadToken111111111111111111111111111",
 *         "symbol": "SCAM",
 *         "name": "Scam Token Example",
 *         "reason": "已知诈骗项目"
 *       }
 *     }
 *
 * @apiSuccessExample {json} 成功响应 (更新):
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "message": "代币信息已在黑名单中更新",
 *       "data": {
 *         "mint": "ExampleBadToken111111111111111111111111111",
 *         "symbol": "SCAM",
 *         "name": "Scam Token Example",
 *         "reason": "已知诈骗项目 - 已更新"
 *       }
 *     }
 *
 * @apiError {Boolean} success 操作结果 (false)
 * @apiError {String} error 错误信息
 *
 * @apiErrorExample {json} 错误响应 (缺少参数):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "error": "缺少mint地址参数"
 *     }
 *
 * @apiErrorExample {json} 错误响应 (格式错误):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "error": "无效的Solana地址格式"
 *     }
 */
export declare const addToBlacklist: (req: Request, res: Response) => Promise<void>;
/**
 * 从黑名单中移除代币
 * @param req 请求对象
 * @param res 响应对象
 */
export declare const removeFromBlacklist: (req: Request, res: Response) => Promise<void>;
/**
 * 获取所有白名单代币
 * @param req 请求对象
 * @param res 响应对象
 */
export declare const getWhitelist: (_req: Request, res: Response) => Promise<void>;
/**
 * 添加代币到白名单
 * @param req 请求对象
 * @param res 响应对象
 */
export declare const addToWhitelist: (req: Request, res: Response) => Promise<void>;
/**
 * 从白名单中移除代币
 * @param req 请求对象
 * @param res 响应对象
 */
export declare const removeFromWhitelist: (req: Request, res: Response) => Promise<void>;
/**
 * 验证代币是否在白名单或黑名单中
 * @param req 请求对象
 * @param res 响应对象
 */
export declare const validateToken: (req: Request, res: Response) => Promise<void>;
/**
 * 获取所有代币列表
 * @param req 请求对象
 * @param res 响应对象
 */
export declare const getAllTokens: (req: Request, res: Response) => Promise<void>;
