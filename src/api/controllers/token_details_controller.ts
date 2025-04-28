/**
 * 代币详情控制器
 * 处理与代币详细信息相关的请求
 */

import { Request, Response } from 'express';
import { PublicKey } from '@solana/web3.js';
import logger from '../../core/logger.js';
import { getTokenMetadata } from '../../services/token_service.js';
import { getTokenPrice, getTokenPriceHistory } from '../../services/price_service.js';
import { getTokenLiquidity } from '../../services/liquidity_service.js';
import { getTokenTransactionHistory } from '../../services/transaction_service.js';
import { TokenMetadata } from '../../core/types.js';

// 模块名称
const MODULE_NAME = 'TokenDetailsController';

/**
 * 获取代币详细信息
 */
export const getTokenDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const tokenAddress = req.query.address as string;
    
    if (!tokenAddress) {
      // 获取所有代币的统计信息
      const tokens = await getTokenMetadata() as TokenMetadata[];
      
      // 获取今日新增代币
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newTokensToday = tokens.filter(t => 
        new Date(t.createdAt).getTime() >= today.getTime()
      ).length;
      
      // 获取白名单和黑名单数量
      const whitelistCount = tokens.filter(t => t.isWhitelisted).length;
      const blacklistCount = tokens.filter(t => t.isBlacklisted).length;
      
      // 获取每个代币的价格
      const tokensWithPrice = await Promise.all(
        tokens.map(async token => {
          const price = await getTokenPrice(token.address);
          return {
            symbol: token.symbol,
            address: token.address,
            price,
            riskScore: token.riskScore || 0,
            status: (token.riskScore || 0) < 50 ? '正常' : '风险'
          };
        })
      );
      
      res.json({
        success: true,
        data: {
          total: tokens.length,
          whitelistCount,
          blacklistCount,
          newTokensToday,
          tokens: tokensWithPrice
        }
      });
      return;
    }
    
    try {
      // 验证代币地址
      new PublicKey(tokenAddress);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: '无效的代币地址'
      });
      return;
    }
    
    // 获取代币元数据
    const metadata = await getTokenMetadata(tokenAddress) as TokenMetadata;
    if (!metadata) {
      res.status(404).json({
        success: false,
        error: '找不到该代币'
      });
      return;
    }
    
    // 获取代币价格
    const price = await getTokenPrice(tokenAddress);
    
    // 获取代币流动性
    const liquidity = await getTokenLiquidity(tokenAddress);
    
    // 获取代币交易历史
    const transactions = await getTokenTransactionHistory(tokenAddress);
    
    // 获取代币价格历史
    const priceHistory = await getTokenPriceHistory(tokenAddress);
    
    // 返回代币详情
    res.json({
      success: true,
      data: {
        ...metadata,
        price,
        liquidity,
        transactions,
        priceHistory
      }
    });
  } catch (error) {
    logger.error('获取代币详情失败', MODULE_NAME, { 
      error: error instanceof Error ? error.message : String(error) 
    });
    res.status(500).json({
      success: false,
      error: '获取代币详情失败'
    });
  }
};

/**
 * 获取代币列表
 */
export const getTokensList = async (req: Request, res: Response): Promise<void> => {
  try {
    // 分页参数
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // 获取所有代币
    const tokens = await getTokenMetadata() as TokenMetadata[];
    
    // 计算分页
    const total = tokens.length;
    const paginatedTokens = tokens.slice(offset, offset + limit);
    
    // 获取每个代币的额外信息
    const tokensWithDetails = await Promise.all(
      paginatedTokens.map(async token => {
        const price = await getTokenPrice(token.address);
        const liquidity = await getTokenLiquidity(token.address);
        return {
          ...token,
          price,
          liquidity
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        tokens: tokensWithDetails,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('获取代币列表失败', MODULE_NAME, { 
      error: error instanceof Error ? error.message : String(error) 
    });
    res.status(500).json({
      success: false,
      error: '获取代币列表失败'
    });
  }
}; 