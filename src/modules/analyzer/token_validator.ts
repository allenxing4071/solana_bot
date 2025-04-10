/**
 * 代币验证器
 * 负责验证代币的合法性和安全性，包括白名单/黑名单检查
 */

import { PublicKey } from '@solana/web3.js';
import fs from 'fs-extra';
import path from 'path';
import appConfig from '../../core/config';
import logger from '../../core/logger';
import rpcService from '../../services/rpc_service';
import type { TokenInfo } from '../../core/types';

const MODULE_NAME = 'TokenValidator';

/**
 * 代币验证结果接口
 */
interface TokenValidationResult {
  isValid: boolean;
  token: TokenInfo;
  reason?: string;
  riskScore?: number;
  isWhitelisted?: boolean;
  isBlacklisted?: boolean;
}

/**
 * 白名单代币条目接口
 */
interface WhitelistEntry {
  mint: string;
  symbol?: string;
  name?: string;
  trusted?: boolean;
}

/**
 * 黑名单代币条目接口
 */
interface BlacklistEntry {
  mint: string;
  symbol?: string;
  name?: string;
  reason?: string;
}

/**
 * 黑名单模式接口
 */
interface BlacklistPattern {
  nameContains?: string[];
  symbolContains?: string[];
  reason?: string;
}

/**
 * 代币列表数据接口
 */
interface TokenListData {
  whitelist: {
    description: string;
    dexes: Record<string, boolean>;
    tokens: WhitelistEntry[];
  };
  blacklist: {
    description: string;
    tokens: BlacklistEntry[];
    patterns: BlacklistPattern[];
  };
  tokenFilters: {
    minLiquidityUsd: number;
    maxInitialPriceUsd: number;
    minPoolBalanceToken: number;
    requireMetadata: boolean;
    requireDecimals: boolean;
  };
}

/**
 * 代币验证器
 * 负责检查代币是否符合交易条件，包括白名单/黑名单校验
 */
class TokenValidator {
  private whitelist: Map<string, WhitelistEntry> = new Map();
  private blacklist: Map<string, BlacklistEntry> = new Map();
  private blacklistPatterns: BlacklistPattern[] = [];
  private tokenFilters: TokenListData['tokenFilters'] | null = null;
  private lastLoadTime = 0;
  private readonly RELOAD_INTERVAL = 5 * 60 * 1000; // 5分钟重新加载一次

  /**
   * 构造函数
   */
  constructor() {
    this.loadTokenLists();
  }

  /**
   * 加载代币白名单和黑名单
   */
  async loadTokenLists(): Promise<void> {
    try {
      // 加载白名单
      const whitelistPath = appConfig.security.tokenValidation.whitelistPath;
      // 加载黑名单
      const blacklistPath = appConfig.security.tokenValidation.blacklistPath;

      logger.info('开始加载代币列表', MODULE_NAME, {
        whitelistPath,
        blacklistPath
      });

      // 检查是否是完整的代币列表文件
      let tokenListData: TokenListData | null = null;

      // 确保白名单文件存在
      if (!fs.existsSync(whitelistPath)) {
        logger.warn(`白名单文件不存在，创建空白名单: ${whitelistPath}`, MODULE_NAME);
        await fs.ensureFile(whitelistPath);
        await fs.writeJson(whitelistPath, [], { spaces: 2 });
      }

      // 确保黑名单文件存在
      if (!fs.existsSync(blacklistPath)) {
        logger.warn(`黑名单文件不存在，创建空黑名单: ${blacklistPath}`, MODULE_NAME);
        await fs.ensureFile(blacklistPath);
        await fs.writeJson(blacklistPath, [], { spaces: 2 });
      }

      if (fs.existsSync(whitelistPath)) {
        try {
          const fileData = await fs.readFile(whitelistPath, 'utf8');
          const data = JSON.parse(fileData);
          
          // 检查是否为完整格式的代币列表文件
          if (data.whitelist && data.blacklist) {
            tokenListData = data as TokenListData;
            logger.info('从单一文件加载代币列表数据', MODULE_NAME);
          } else if (Array.isArray(data)) {
            // 仅包含白名单数组
            this.loadWhitelist(data);
          } else if (data.tokens) {
            // 包含tokens字段的白名单
            this.loadWhitelist(data.tokens);
          } else {
            logger.warn(`白名单文件格式不正确: ${whitelistPath}，使用空白名单`, MODULE_NAME);
            this.loadWhitelist([]);
          }
        } catch (error) {
          logger.error(`无法解析白名单文件 ${whitelistPath}`, MODULE_NAME, error);
          this.loadWhitelist([]);
        }
      } else {
        logger.warn(`白名单文件 ${whitelistPath} 不存在`, MODULE_NAME);
        this.loadWhitelist([]);
      }

      // 如果没有从单一文件加载数据，尝试分别加载黑名单
      if (!tokenListData && fs.existsSync(blacklistPath)) {
        try {
          const fileData = await fs.readFile(blacklistPath, 'utf8');
          const data = JSON.parse(fileData);
          
          if (Array.isArray(data)) {
            // 黑名单是简单数组
            this.loadBlacklist(data, []);
          } else if (data.tokens) {
            // 黑名单有tokens字段
            this.loadBlacklist(data.tokens, data.patterns || []);
          } else {
            logger.warn(`黑名单文件格式不正确: ${blacklistPath}，使用空黑名单`, MODULE_NAME);
            this.loadBlacklist([], []);
          }
        } catch (error) {
          logger.error(`无法解析黑名单文件 ${blacklistPath}`, MODULE_NAME, error);
          this.loadBlacklist([], []);
        }
      } else if (!tokenListData) {
        logger.warn(`黑名单文件 ${blacklistPath} 不存在`, MODULE_NAME);
        this.loadBlacklist([], []);
      }

      // 如果使用完整格式的代币列表数据
      if (tokenListData) {
        this.loadWhitelist(tokenListData.whitelist.tokens);
        this.loadBlacklist(tokenListData.blacklist.tokens, tokenListData.blacklist.patterns);
        this.tokenFilters = tokenListData.tokenFilters;
      }

      this.lastLoadTime = Date.now();
      logger.info('代币列表加载完成', MODULE_NAME, {
        whitelistSize: this.whitelist.size,
        blacklistSize: this.blacklist.size,
        blacklistPatterns: this.blacklistPatterns.length
      });
    } catch (error) {
      logger.error('加载代币列表时出错', MODULE_NAME, error);
      // 确保即使出错也有空的列表
      this.whitelist.clear();
      this.blacklist.clear();
      this.blacklistPatterns = [];
    }
  }

  /**
   * 加载白名单
   * @param tokens 白名单代币条目
   */
  private loadWhitelist(tokens: WhitelistEntry[]): void {
    this.whitelist.clear();
    
    for (const token of tokens) {
      if (token.mint) {
        this.whitelist.set(token.mint.toLowerCase(), token);
      }
    }
    
    logger.info(`已加载 ${this.whitelist.size} 个白名单代币`, MODULE_NAME);
  }

  /**
   * 加载黑名单
   * @param tokens 黑名单代币条目
   * @param patterns 黑名单模式
   */
  private loadBlacklist(tokens: BlacklistEntry[], patterns: BlacklistPattern[]): void {
    this.blacklist.clear();
    this.blacklistPatterns = [];
    
    for (const token of tokens) {
      if (token.mint) {
        this.blacklist.set(token.mint.toLowerCase(), token);
      }
    }
    
    this.blacklistPatterns = patterns || [];
    
    logger.info(`已加载 ${this.blacklist.size} 个黑名单代币和 ${this.blacklistPatterns.length} 个黑名单模式`, MODULE_NAME);
  }

  /**
   * 检查是否需要重新加载代币列表
   */
  private async checkAndReloadIfNeeded(): Promise<void> {
    const now = Date.now();
    if (now - this.lastLoadTime > this.RELOAD_INTERVAL) {
      await this.loadTokenLists();
    }
  }

  /**
   * 验证代币
   * @param token 代币信息
   * @param liquidityUsd 流动性（美元）
   * @returns 验证结果
   */
  async validateToken(token: TokenInfo, liquidityUsd?: number): Promise<TokenValidationResult> {
    await this.checkAndReloadIfNeeded();
    
    const mintAddress = token.mint.toBase58().toLowerCase();
    const result: TokenValidationResult = {
      isValid: true,
      token,
      riskScore: 0
    };
    
    // 1. 白名单检查
    if (appConfig.security.tokenValidation.useWhitelist) {
      const isWhitelisted = this.whitelist.has(mintAddress);
      result.isWhitelisted = isWhitelisted;
      
      // 如果启用强制白名单，且代币不在白名单中，则拒绝
      if (!isWhitelisted) {
        result.isValid = false;
        result.reason = '代币不在白名单中';
        return result;
      }
    }
    
    // 2. 黑名单检查
    if (appConfig.security.tokenValidation.useBlacklist) {
      // 2.1 直接黑名单
      if (this.blacklist.has(mintAddress)) {
        const blacklistEntry = this.blacklist.get(mintAddress);
        result.isBlacklisted = true;
        result.isValid = false;
        result.reason = blacklistEntry?.reason || '代币在黑名单中';
        return result;
      }
      
      // 2.2 模式黑名单 (如果有代币名称和符号)
      if (token.name || token.symbol) {
        for (const pattern of this.blacklistPatterns) {
          // 检查名称
          if (pattern.nameContains && token.name) {
            const name = token.name.toLowerCase();
            if (pattern.nameContains.some(keyword => name.includes(keyword.toLowerCase()))) {
              result.isBlacklisted = true;
              result.isValid = false;
              result.reason = pattern.reason || `代币名称包含可疑关键词`;
              return result;
            }
          }
          
          // 检查符号
          if (pattern.symbolContains && token.symbol) {
            const symbol = token.symbol.toLowerCase();
            if (pattern.symbolContains.some(keyword => symbol.includes(keyword.toLowerCase()))) {
              result.isBlacklisted = true;
              result.isValid = false;
              result.reason = pattern.reason || `代币符号包含可疑关键词`;
              return result;
            }
          }
        }
      }
    }
    
    // 3. 流动性检查
    if (liquidityUsd !== undefined) {
      const minLiquidity = this.tokenFilters?.minLiquidityUsd || 
                          appConfig.security.tokenValidation.minLiquidityUsd;
      
      if (liquidityUsd < minLiquidity) {
        result.isValid = false;
        result.reason = `流动性太低: $${liquidityUsd} < $${minLiquidity}`;
        return result;
      }
    }
    
    // 4. 元数据检查
    if (appConfig.security.tokenValidation.requireMetadata) {
      // 如果没有元数据，尝试获取
      if (!token.metadata && (token.metadata === undefined)) {
        try {
          // 这里可能需要实现获取代币元数据的逻辑
          // 例如: token.metadata = await getTokenMetadata(token.mint);
          
          // 获取元数据失败的处理
          if (!token.metadata) {
            result.isValid = false;
            result.reason = '无法获取代币元数据';
            return result;
          }
        } catch (error) {
          logger.warn(`获取代币 ${mintAddress} 元数据失败`, MODULE_NAME, error);
          result.isValid = false;
          result.reason = '获取代币元数据时出错';
          return result;
        }
      }
    }
    
    // 5. 小数位检查
    if (this.tokenFilters?.requireDecimals && token.decimals === undefined) {
      result.isValid = false;
      result.reason = '缺少代币小数位信息';
      return result;
    }
    
    // 执行更多自定义验证...
    
    return result;
  }

  /**
   * 异步更新代币信息
   * @param token 代币信息
   * @returns 更新后的代币信息
   */
  async enrichTokenInfo(token: TokenInfo): Promise<TokenInfo> {
    try {
      // 克隆代币对象
      const enrichedToken = { ...token };
      
      // 如果代币没有名称、符号或小数位，尝试获取
      if (!token.name || !token.symbol || token.decimals === undefined) {
        // 这里实现获取代币详细信息的逻辑
        // 例如使用 SPL Token Registry 或查询代币账户
        
        // 示例代码：
        const mintInfo = await rpcService.connection.getParsedAccountInfo(token.mint);
        if (mintInfo.value && 'parsed' in mintInfo.value.data) {
          const parsedData = mintInfo.value.data.parsed;
          if (parsedData.type === 'mint') {
            const mintData = parsedData.info;
            enrichedToken.decimals = mintData.decimals;
            // 其他字段...
          }
        }
        
        // 获取元数据等
      }
      
      return enrichedToken;
    } catch (error) {
      logger.warn(`丰富代币 ${token.mint.toBase58()} 信息时出错`, MODULE_NAME, error);
      return token; // 返回原始代币信息
    }
  }

  /**
   * 检查代币是否在白名单中
   * @param mintAddress 代币Mint地址
   * @returns 是否在白名单中
   */
  isWhitelisted(mintAddress: string | PublicKey): boolean {
    const address = typeof mintAddress === 'string' 
      ? mintAddress.toLowerCase() 
      : mintAddress.toBase58().toLowerCase();
      
    return this.whitelist.has(address);
  }

  /**
   * 检查代币是否在黑名单中
   * @param mintAddress 代币Mint地址
   * @returns 是否在黑名单中
   */
  isBlacklisted(mintAddress: string | PublicKey): boolean {
    const address = typeof mintAddress === 'string' 
      ? mintAddress.toLowerCase() 
      : mintAddress.toBase58().toLowerCase();
      
    return this.blacklist.has(address);
  }

  /**
   * 获取已知的代币信息
   * @param mintAddress 代币Mint地址
   * @returns 代币信息或null
   */
  getKnownToken(mintAddress: string | PublicKey): TokenInfo | null {
    const address = typeof mintAddress === 'string' 
      ? mintAddress.toLowerCase() 
      : mintAddress.toBase58().toLowerCase();
    
    // 从白名单中查找
    const whitelistEntry = this.whitelist.get(address);
    if (whitelistEntry) {
      return {
        mint: new PublicKey(whitelistEntry.mint),
        symbol: whitelistEntry.symbol,
        name: whitelistEntry.name,
        isTrusted: whitelistEntry.trusted
      };
    }
    
    return null;
  }
}

// 创建并导出单例
export const tokenValidator = new TokenValidator();
export default tokenValidator; 