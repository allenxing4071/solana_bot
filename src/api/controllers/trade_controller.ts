import type { Request, Response } from 'express';
import logger from '../../core/logger.js';
import { TradeHistoryManager } from '../../modules/trader/trade_history_manager.js';

// 模块名称常量
const MODULE_NAME = 'TradeController';

// 创建交易历史管理器实例
const tradeHistoryManager = new TradeHistoryManager();

/**
 * 获取交易历史记录
 * @param req 请求对象
 * @param res 响应对象
 */
export const getTradeHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    // 获取分页和搜索参数
    const page = Number.parseInt(req.query.page as string) || 1;
    const limit = Number.parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || 'all';
    const type = (req.query.type as string) || 'all';
    
    // 获取所有交易
    let trades = await tradeHistoryManager.getAllTrades();
    
    // 应用搜索过滤
    if (search) {
      trades = trades.filter(trade => 
        (trade.tokenSymbol?.toLowerCase().includes(search.toLowerCase())) ||
        trade.id.toLowerCase().includes(search.toLowerCase()) ||
        (trade.txid?.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    // 按状态过滤
    if (status !== 'all') {
      trades = trades.filter(trade => trade.status === status);
    }
    
    // 按类型过滤
    if (type !== 'all') {
      trades = trades.filter(trade => trade.type === type);
    }
    
    // 计算总数据量和总页数
    const totalItems = trades.length;
    const totalPages = Math.ceil(totalItems / limit);
    
    // 分页处理
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedTrades = trades.slice(startIndex, endIndex);
    
    res.status(200).json({
      success: true,
      count: totalItems,
      page,
      totalPages,
      limit,
      data: paginatedTrades
    });
  } catch (error) {
    logger.error('获取交易历史记录失败', MODULE_NAME, {
      error: error instanceof Error ? error.message : String(error)
    });
    res.status(500).json({
      success: false,
      error: '获取交易历史记录失败'
    });
  }
}; 