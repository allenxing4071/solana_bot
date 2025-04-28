/**
 * @file auth.middleware.ts
 * @description API认证中间件，提供API密钥验证功能
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../../core/logger.js';
import appConfig from '../../core/config.js';

const MODULE_NAME = 'AuthMiddleware';

/**
 * API认证中间件
 * 验证请求中的API密钥
 * 
 * @param req 请求对象
 * @param res 响应对象
 * @param next 下一个中间件
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  // 如果未启用认证，直接放行
  if (!appConfig!.api.enableAuth) {
    next();
    return;
  }

  // 获取API密钥
  const apiKey = req.headers['x-api-key'];

  // 验证API密钥
  if (!apiKey) {
    logger.warn('缺少API密钥', MODULE_NAME);
    return res.status(401).json({
      success: false,
      message: '缺少API密钥'
    });
  }

  // 验证API密钥是否正确
  if (apiKey !== appConfig!.api.apiKey) {
    logger.warn('API密钥无效', MODULE_NAME);
    return res.status(401).json({
      success: false,
      message: 'API密钥无效'
    });
  }

  // 验证通过，继续处理请求
  next();
};

/**
 * 请求日志中间件
 * 记录所有API请求的详细信息
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  // 生成请求ID
  const requestId = generateRequestId();
  
  // 将请求ID附加到请求对象上，方便后续使用
  (req as any).requestId = requestId;
  
  // 记录请求信息
  logger.http(
    `${req.method} ${req.path}`,
    requestId,
    MODULE_NAME,
    {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      query: req.query,
      // 不记录敏感信息，如密码、API密钥等
      body: sanitizeRequestBody(req.body)
    }
  );
  
  // 记录响应时间
  const startTime = Date.now();
  
  // 在响应结束时记录耗时
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.http(
      `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`,
      requestId,
      MODULE_NAME
    );
  });
  
  next();
}

/**
 * 过滤请求体中的敏感信息
 */
function sanitizeRequestBody(body: any): any {
  if (!body) return {};
  
  // 创建请求体的副本
  const sanitized = {...body};
  
  // 敏感字段列表
  const sensitiveFields = ['password', 'apiKey', 'token', 'secret', 'privateKey'];
  
  // 遍历对象，隐藏敏感信息
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '******';
    }
  }
  
  return sanitized;
}

/**
 * 生成请求ID
 */
function generateRequestId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

export default {
  authMiddleware,
  requestLogger
}; 