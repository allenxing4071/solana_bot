/**
 * 流动性服务
 * 提供代币流动性信息获取和管理功能
 */

import { PublicKey } from '@solana/web3.js';
import logger from '../core/logger.js';
import { getTokenLiquidityFromDex } from '../utils/liquidity_utils.js';
import { LiquidityData } from '../core/types.js';

// 模块名称
const MODULE_NAME = 'LiquidityService';

// 流动性缓存
const liquidityCache = new Map<string, LiquidityData>();

/**
 * 获取代币流动性信息
 * @param mintAddress 代币Mint地址
 * @returns 代币流动性数据
 */
export async function getTokenLiquidity(mintAddress: string): Promise<LiquidityData> {
  try {
    // 检查缓存
    if (liquidityCache.has(mintAddress)) {
      const cachedLiquidity = liquidityCache.get(mintAddress)!;
      // 如果缓存未过期（5分钟），直接返回
      if (Date.now() - cachedLiquidity.timestamp < 300000) {
        return cachedLiquidity;
      }
    }

    // 验证地址
    const mint = new PublicKey(mintAddress);
    
    // 从DEX获取流动性信息
    const liquidityData = await getTokenLiquidityFromDex(mint);
    
    // 更新缓存
    liquidityCache.set(mintAddress, liquidityData);
    
    return liquidityData;
  } catch (error) {
    logger.error('获取代币流动性信息失败', MODULE_NAME, {
      error: error instanceof Error ? error.message : String(error),
      mintAddress
    });
    throw error;
  }
}

/**
 * 获取代币流动性历史
 * @param mintAddress 代币Mint地址
 * @param timeRange 时间范围（小时）
 * @returns 流动性历史数据
 */
export async function getTokenLiquidityHistory(mintAddress: string, timeRange: number = 24): Promise<LiquidityData[]> {
  try {
    // TODO: 从数据库获取流动性历史
    return [];
  } catch (error) {
    logger.error('获取代币流动性历史失败', MODULE_NAME, {
      error: error instanceof Error ? error.message : String(error),
      mintAddress,
      timeRange
    });
    throw error;
  }
}

/**
 * 清除流动性缓存
 * @param mintAddress 代币Mint地址，如果为空则清除所有缓存
 */
export function clearLiquidityCache(mintAddress?: string): void {
  if (mintAddress) {
    liquidityCache.delete(mintAddress);
  } else {
    liquidityCache.clear();
  }
  logger.info('流动性缓存已清除', MODULE_NAME, { mintAddress });
} 