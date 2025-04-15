/**
 * 流动性池控制器
 * 处理与流动性池相关的所有请求
 */

import { Request, Response } from 'express';
import { PublicKey } from '@solana/web3.js';
import poolMonitor from '../../modules/listener/pool_monitor';
import type { DexType, PoolInfo } from '../../core/types';
import logger from '../../core/logger';
import appConfig from '../../core/config';

// 模块名称
const MODULE_NAME = 'PoolController';

// 使用模拟数据标志 - 改为默认使用真实数据
const USE_MOCK_DATA = false;

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
export const getAllPools = async (req: Request, res: Response): Promise<void> => {
  try {
    // 获取分页和搜索参数
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';
    const dex = (req.query.dex as string) || 'all';
    
    // 获取所有池子
    let pools = poolMonitor.getKnownPools();
    
    // 应用搜索和过滤
    if (search) {
      pools = pools.filter(pool => 
        (pool.tokenASymbol && pool.tokenASymbol.toLowerCase().includes(search.toLowerCase())) ||
        (pool.tokenBSymbol && pool.tokenBSymbol.toLowerCase().includes(search.toLowerCase())) ||
        pool.address.toString().includes(search) ||
        pool.tokenAMint.toString().includes(search) ||
        pool.tokenBMint.toString().includes(search)
      );
    }
    
    // 按DEX过滤
    if (dex !== 'all') {
      pools = pools.filter(pool => pool.dex.toLowerCase() === dex.toLowerCase());
    }
    
    // 计算总页数和总记录数
    const totalItems = pools.length;
    const totalPages = Math.ceil(totalItems / limit);
    
    // 分页处理
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedPools = pools.slice(startIndex, endIndex);
    
    res.status(200).json({
      success: true,
      count: totalItems,
      page,
      totalPages,
      limit,
      data: paginatedPools
    });
  } catch (error) {
    logger.error(`获取流动性池失败: ${error instanceof Error ? error.message : String(error)}`, MODULE_NAME);
    res.status(500).json({
      success: false,
      error: '获取流动性池失败'
    });
  }
};

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
export const getPoolDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { address } = req.params;
    
    logger.info(`获取流动性池详情: ${address}`, MODULE_NAME);
    
    if (!address) {
      res.status(400).json({
        success: false,
        error: '缺少地址参数'
      });
      return;
    }
    
    // 验证地址格式
    try {
      new PublicKey(address);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: '无效的Solana地址格式'
      });
      return;
    }
    
    // 获取所有池子
    const pools = poolMonitor.getKnownPools();
    
    // 查找匹配的池子
    const pool = pools.find(p => p.address.toString() === address);
    
    if (!pool) {
      res.status(404).json({
        success: false,
        error: '未找到指定地址的流动性池'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: pool
    });
  } catch (error) {
    logger.error(`获取流动性池详情失败: ${error instanceof Error ? error.message : String(error)}`, MODULE_NAME);
    res.status(500).json({
      success: false,
      error: '获取流动性池详情失败'
    });
  }
};

/**
 * 获取指定DEX的所有流动性池
 * @param req 请求对象
 * @param res 响应对象
 */
export const getPoolsByDex = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dexName } = req.params;
    
    if (!dexName) {
      res.status(400).json({
        success: false,
        error: '缺少DEX名称参数'
      });
      return;
    }
    
    // 验证DEX名称是否有效
    const validDexes = ['raydium', 'orca', 'jupiter'];
    if (!validDexes.includes(dexName.toLowerCase())) {
      res.status(400).json({
        success: false,
        error: `无效的DEX名称，支持的DEX有: ${validDexes.join(', ')}`
      });
      return;
    }
    
    // 获取所有池子
    const pools = poolMonitor.getKnownPools();
    
    // 过滤指定DEX的池子
    const filteredPools = pools.filter(p => 
      p.dex.toLowerCase() === dexName.toLowerCase()
    );
    
    res.status(200).json({
      success: true,
      count: filteredPools.length,
      data: filteredPools
    });
  } catch (error) {
    logger.error('获取DEX流动性池失败', MODULE_NAME, {
      error: error instanceof Error ? error.message : String(error)
    });
    res.status(500).json({
      success: false,
      error: '获取DEX流动性池失败'
    });
  }
};

/**
 * 获取包含指定代币的所有流动性池
 * @param req 请求对象
 * @param res 响应对象
 */
export const getPoolsByToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mint } = req.params;
    
    if (!mint) {
      res.status(400).json({
        success: false,
        error: '缺少代币Mint地址参数'
      });
      return;
    }
    
    // 验证地址格式
    try {
      new PublicKey(mint);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: '无效的Solana地址格式'
      });
      return;
    }
    
    // 获取所有池子
    const pools = poolMonitor.getKnownPools();
    
    // 过滤包含指定代币的池子
    const filteredPools = pools.filter(p => 
      p.tokenAMint.toString() === mint || 
      p.tokenBMint.toString() === mint
    );
    
    res.status(200).json({
      success: true,
      count: filteredPools.length,
      data: filteredPools
    });
  } catch (error) {
    logger.error('获取代币相关流动性池失败', MODULE_NAME, {
      error: error instanceof Error ? error.message : String(error)
    });
    res.status(500).json({
      success: false,
      error: '获取代币相关流动性池失败'
    });
  }
};

/**
 * 获取流动性池统计信息
 * @param req 请求对象
 * @param res 响应对象
 */
export const getPoolStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    // 获取所有池子
    const pools = poolMonitor.getKnownPools();
    
    // 计算各DEX的池子数量
    const dexCounts: Record<string, number> = {};
    for (const pool of pools) {
      const dex = pool.dex;
      dexCounts[dex] = (dexCounts[dex] || 0) + 1;
    }
    
    // 计算最新创建的池子（按firstDetectedAt排序，取前5个）
    const recentPools = [...pools]
      .sort((a, b) => b.firstDetectedAt - a.firstDetectedAt)
      .slice(0, 5);
    
    // 返回统计数据
    res.status(200).json({
      success: true,
      data: {
        totalPools: pools.length,
        dexDistribution: dexCounts,
        recentPools: recentPools
      }
    });
  } catch (error) {
    logger.error('获取流动性池统计信息失败', MODULE_NAME, {
      error: error instanceof Error ? error.message : String(error)
    });
    res.status(500).json({
      success: false,
      error: '获取流动性池统计信息失败'
    });
  }
}; 