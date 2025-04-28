/**
 * 代币工具函数
 * 提供代币相关的工具函数
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { TokenMetadata } from '../core/types.js';
import logger from '../core/logger.js';
import { getConnection } from '../services/rpc_service.js';

// 模块名称
const MODULE_NAME = 'TokenUtils';

/**
 * 从链上获取代币元数据
 * @param mint 代币Mint地址
 * @returns 代币元数据
 */
export async function getTokenMetadataFromChain(mint: PublicKey): Promise<TokenMetadata> {
  try {
    const connection = getConnection();
    
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
    
    // 构建元数据
    const metadata: TokenMetadata = {
      address: mint.toBase58(),
      name: tokenInfo.name || 'Unknown Token',
      symbol: tokenInfo.symbol || 'UNKNOWN',
      decimals: tokenInfo.decimals,
      totalSupply: tokenInfo.supply,
      createdAt: new Date().toISOString()
    };

    return metadata;
  } catch (error) {
    logger.error('从链上获取代币元数据失败', MODULE_NAME, {
      error: error instanceof Error ? error.message : String(error),
      mint: mint.toBase58()
    });
    throw error;
  }
}

/**
 * 验证代币地址
 * @param address 代币地址
 * @returns 是否有效
 */
export function isValidTokenAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 格式化代币数量
 * @param amount 代币数量
 * @param decimals 小数位数
 * @returns 格式化后的数量
 */
export function formatTokenAmount(amount: string | number, decimals: number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return (num / Math.pow(10, decimals)).toFixed(decimals);
}

/**
 * 解析代币数量
 * @param amount 格式化后的数量
 * @param decimals 小数位数
 * @returns 原始数量
 */
export function parseTokenAmount(amount: string | number, decimals: number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return (num * Math.pow(10, decimals)).toString();
} 