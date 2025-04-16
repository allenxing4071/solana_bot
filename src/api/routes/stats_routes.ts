import { Router } from 'express';
import type { Request, Response } from 'express';
import { 
  getProfitTrend, 
  getTokenTrend, 
  getProfitSummary,
  getSystemStats,
  getTransactionStats,
  getTokenStats
} from '../controllers/stats_controller';
import logger from '../../core/logger';

const MODULE_NAME = 'StatsRoutes';
const router = Router();

// 统计API路由
// 利润趋势接口
router.get('/profit/trend', (req: Request, res: Response) => {
  logger.debug('收到利润趋势请求', MODULE_NAME);
  getProfitTrend(req, res);
});

// 代币趋势接口
router.get('/token/trend', (req: Request, res: Response) => {
  logger.debug('收到代币趋势请求', MODULE_NAME);
  getTokenTrend(req, res);
});

// 利润摘要接口
router.get('/profit/summary', (req: Request, res: Response) => {
  logger.debug('收到利润摘要请求', MODULE_NAME);
  getProfitSummary(req, res);
});

// 系统性能统计接口
router.get('/system', (req: Request, res: Response) => {
  logger.debug('收到系统性能统计请求', MODULE_NAME);
  getSystemStats(req, res);
});

// 交易统计接口
router.get('/transactions', (req: Request, res: Response) => {
  logger.debug('收到交易统计请求', MODULE_NAME);
  getTransactionStats(req, res);
});

// 代币统计接口
router.get('/tokens', (req: Request, res: Response) => {
  logger.debug('收到代币统计请求', MODULE_NAME);
  getTokenStats(req, res);
});

// 兼容旧路径的路由
router.get('/profit_trend', (req: Request, res: Response) => {
  logger.debug('收到旧路径利润趋势请求', MODULE_NAME);
  getProfitTrend(req, res);
});

router.get('/token_trend', (req: Request, res: Response) => {
  logger.debug('收到旧路径代币趋势请求', MODULE_NAME);
  getTokenTrend(req, res);
});

router.get('/profit_summary', (req: Request, res: Response) => {
  logger.debug('收到旧路径利润摘要请求', MODULE_NAME);
  getProfitSummary(req, res);
});

export default router; 