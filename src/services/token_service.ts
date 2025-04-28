/**
 * 代币服务
 * 提供代币元数据获取和管理功能
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import logger from '../core/logger.js';
import appConfig from '../core/config.js';
import { getTokenMetadataFromChain } from '../utils/token_utils.js';
import { TokenMetadata } from '../core/types.js';
import { getConnection } from '../services/rpc_service.js';

// 模块名称
const MODULE_NAME = 'TokenService';

// 创建Solana连接
// const connection = new Connection(appConfig!.network.rpcUrl, {
//   commitment: appConfig!.network.connection.commitment as any
// });

function getTokenConnection(): Connection {
  if (!appConfig || !appConfig.network) {
    throw new Error('appConfig未初始化或缺少network配置');
  }
  return new Connection(appConfig.network.rpcUrl, {
    commitment: (appConfig.network.connection?.commitment || 'confirmed') as any
  });
}

// 代币缓存
const tokenCache = new Map<string, TokenMetadata>();

/**
 * 获取代币元数据
 * @param mintAddress 代币Mint地址，如果为空则返回所有代币
 * @returns 代币元数据
 */
export async function getTokenMetadata(mintAddress?: string): Promise<TokenMetadata | TokenMetadata[]> {
  try {
    if (mintAddress) {
      // 检查缓存
      if (tokenCache.has(mintAddress)) {
        return tokenCache.get(mintAddress)!;
      }

      // 验证地址
      const mint = new PublicKey(mintAddress);
      const connection = getConnection() || getTokenConnection();
      
      // 获取代币账户
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        mint,
        { programId: TOKEN_PROGRAM_ID }
      );

      if (tokenAccounts.value.length === 0) {
        throw new Error('找不到代币账户');
      }

      // 获取代币元数据
      const metadata = await getTokenMetadataFromChain(mint);
      
      // 更新缓存
      tokenCache.set(mintAddress, metadata);
      
      return metadata;
    } else {
      // 获取所有代币
      // TODO: 从数据库获取所有代币列表
      return [];
    }
  } catch (error) {
    logger.error('获取代币元数据失败', MODULE_NAME, {
      error: error instanceof Error ? error.message : String(error),
      mintAddress
    });
    throw error;
  }
}

/**
 * 更新代币元数据
 * @param mintAddress 代币Mint地址
 * @param metadata 新的元数据
 */
export async function updateTokenMetadata(mintAddress: string, metadata: Partial<TokenMetadata>): Promise<void> {
  try {
    // 验证地址
    new PublicKey(mintAddress);
    
    // 获取当前元数据
    const currentMetadata = await getTokenMetadata(mintAddress) as TokenMetadata;
    
    // 更新元数据
    const updatedMetadata = {
      ...currentMetadata,
      ...metadata,
      updatedAt: new Date().toISOString()
    };
    
    // 更新缓存
    tokenCache.set(mintAddress, updatedMetadata);
    
    // TODO: 更新数据库
    
    logger.info('代币元数据已更新', MODULE_NAME, { mintAddress });
  } catch (error) {
    logger.error('更新代币元数据失败', MODULE_NAME, {
      error: error instanceof Error ? error.message : String(error),
      mintAddress
    });
    throw error;
  }
}

/**
 * 清除代币缓存
 * @param mintAddress 代币Mint地址，如果为空则清除所有缓存
 */
export function clearTokenCache(mintAddress?: string): void {
  if (mintAddress) {
    tokenCache.delete(mintAddress);
  } else {
    tokenCache.clear();
  }
  logger.info('代币缓存已清除', MODULE_NAME, { mintAddress });
} 