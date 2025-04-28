/**
 * 价格工具函数
 * 提供代币价格相关的工具函数
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PriceData } from '../core/types.js';
import logger from '../core/logger.js';
import appConfig from '../core/config.js';

// 模块名称
const MODULE_NAME = 'PriceUtils';

// 创建Solana连接
const connection = new Connection(appConfig!.network.rpcUrl, {
  commitment: appConfig!.network.connection.commitment as any
});

/**
 * 从DEX获取代币价格
 * @param mint 代币Mint地址
 * @returns 代币价格数据
 */
export async function getTokenPriceFromDex(mint: PublicKey): Promise<PriceData> {
  try {
    // 获取代币账户
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      mint,
      { programId: TOKEN_PROGRAM_ID }
    );

    if (tokenAccounts.value.length === 0) {
      throw new Error('找不到代币账户');
    }

    // 获取代币信息
    const tokenAccount = tokenAccounts.value[0];
    const tokenInfo = tokenAccount.account.data.parsed.info;
    
    // 从DEX获取价格
    // TODO: 实现从不同DEX获取价格
    const price = '0.0';
    const priceUsd = '0.0';
    const volume24h = '0.0';
    
    // 构建价格数据
    const priceData: PriceData = {
      price,
      priceUsd,
      volume24h,
      timestamp: Date.now(),
      source: 'DEX'
    };

    return priceData;
  } catch (error) {
    logger.error('从DEX获取代币价格失败', MODULE_NAME, {
      error: error instanceof Error ? error.message : String(error),
      mint: mint.toBase58()
    });
    throw error;
  }
}

/**
 * 计算价格变化百分比
 * @param currentPrice 当前价格
 * @param previousPrice 之前的价格
 * @returns 价格变化百分比
 */
export function calculatePriceChange(currentPrice: number, previousPrice: number): number {
  if (previousPrice === 0) return 0;
  return ((currentPrice - previousPrice) / previousPrice) * 100;
}

/**
 * 格式化价格
 * @param price 价格
 * @param decimals 小数位数
 * @returns 格式化后的价格
 */
export function formatPrice(price: number, decimals: number = 6): string {
  return price.toFixed(decimals);
}

/**
 * 计算交易价值
 * @param amount 数量
 * @param price 价格
 * @returns 交易价值
 */
export function calculateValue(amount: number, price: number): number {
  return amount * price;
} 