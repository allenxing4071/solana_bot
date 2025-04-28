/**
 * 代币验证器(鱼类安全检测系统)
 * 负责验证代币的合法性和安全性，包括白名单/黑名单检查
 * 
 * 【编程基础概念通俗比喻】
 * 1. 验证器 = 渔船上的鱼类检测仪:
 *    就像渔船上用来区分安全和危险鱼类的专业设备
 *    例如：validateToken() 就像是"鱼类安全扫描"功能
 *    
 * 2. 白名单/黑名单 = 已知安全/危险鱼类图鉴:
 *    记录了已知的安全鱼类和危险鱼类信息
 *    例如：whitelist 就像是"优质鱼类图鉴"，blacklist 就像是"有毒鱼类警示录"
 *    
 * 3. 模式匹配 = 鱼类特征识别:
 *    根据鱼的外观特征来识别潜在危险
 *    例如：blacklistPatterns 就像是"危险鱼类特征数据库"
 *    
 * 4. 代币信息 = 鱼类档案:
 *    记录每种鱼的详细信息和特性
 *    例如：TokenInfo 就像是"鱼类百科信息卡"
 * 
 * 【比喻解释】
 * 这个模块就像渔船上的鱼类检验站：
 * - 负责检查捕获的每条鱼是否安全可食(代币是否可交易)
 * - 维护着已知安全鱼类和危险鱼类的名录(白名单和黑名单)
 * - 能够识别某些危险鱼类的共同特征(模式匹配)
 * - 定期更新鱼类图鉴(重新加载名单)，保持信息最新
 */

import { PublicKey } from '@solana/web3.js';
import fs from 'fs-extra';
import path from 'path';
import appConfig from '../../core/config.js';
import logger from '../../core/logger.js';
import rpcService from '../../services/rpc_service.js';
import type { TokenInfo } from '../../core/types.js';

const MODULE_NAME = 'TokenValidator';

/**
 * 代币验证结果接口
 * 
 * 【比喻解释】
 * 就像鱼类检验后的检测报告：
 * - 包含这条鱼是否安全可食(isValid)
 * - 鱼的基本信息(token)
 * - 如果不安全，标明具体原因(reason)
 * - 安全风险评分(riskScore)
 * - 是否是已知的优质鱼种(isWhitelisted)
 * - 是否是已知的危险鱼种(isBlacklisted)
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
 * 
 * 【比喻解释】
 * 就像优质鱼类图鉴中的一页：
 * - 记录了鱼的唯一标识(mint)
 * - 鱼类简称(symbol)
 * - 鱼类全名(name)
 * - 是否是特别值得信赖的鱼种(trusted)
 */
interface WhitelistEntry {
  mint: string;
  symbol?: string;
  name?: string;
  trusted?: boolean;
}

/**
 * 黑名单代币条目接口
 * 
 * 【比喻解释】
 * 就像危险鱼类警示录中的一页：
 * - 记录了鱼的唯一标识(mint)
 * - 鱼类简称(symbol)
 * - 鱼类全名(name)
 * - 为什么这种鱼是危险的(reason)
 */
interface BlacklistEntry {
  mint: string;
  symbol?: string;
  name?: string;
  reason?: string;
}

/**
 * 黑名单模式接口
 * 
 * 【比喻解释】
 * 就像危险鱼类的特征描述：
 * - 鱼名中包含的危险关键词(nameContains)
 * - 鱼类简称中的危险标志(symbolContains)
 * - 标记为危险的原因(reason)
 */
interface BlacklistPattern {
  nameContains?: string[];
  symbolContains?: string[];
  reason?: string;
}

/**
 * 代币列表数据接口
 * 
 * 【比喻解释】
 * 就像完整的渔船鱼类手册：
 * - 包含优质鱼类图鉴(whitelist)
 * - 包含危险鱼类警示录(blacklist)
 * - 捕鱼标准和安全阈值(tokenFilters)
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
 * 
 * 【比喻解释】
 * 这就像渔船上的鱼类安全检测站：
 * - 维护着安全和危险鱼类的完整档案(白名单和黑名单)
 * - 能够按照多种标准评估鱼的安全性(验证规则)
 * - 定期更新鱼类知识库(自动重新加载)
 * - 为捕获的每条鱼提供详细的安全报告(验证结果)
 * 
 * 【编程语法通俗翻译】
 * class = 一种完整设备：包含多个相关功能的整套系统
 * private = 内部组件：设备内部的零件，外部无法直接操作
 * Map = 索引表：快速查找的名录本，通过ID直接找到对应信息
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
   * 
   * 【比喻解释】
   * 就像鱼类检测站的初始化和首次启动：
   * - 加载所有已知的鱼类安全数据
   * - 确保设备准备就绪可以开始工作
   */
  constructor() {
    this.loadTokenLists();
  }

  /**
   * 加载代币白名单和黑名单
   * 
   * 【比喻解释】
   * 就像更新渔船的鱼类图鉴数据库：
   * - 从存储中读取最新的鱼类信息
   * - 确保优质鱼类图鉴(白名单)是最新的
   * - 更新危险鱼类警示录(黑名单)
   * - 记录此次更新的时间，方便定期检查
   * 
   * 【编程语法通俗翻译】
   * async = 需要等待的任务：像是派人去取最新的图鉴，需要等他回来
   * try/catch = 安全操作：尝试完成任务，但准备好处理可能出现的问题
   * fs.existsSync = 检查是否存在：确认图鉴书是否在书架上
   */
  async loadTokenLists(): Promise<void> {
    try {
      // 加载白名单
      const whitelistPath = appConfig!.security.tokenValidation.whitelistPath;
      // 加载黑名单
      const blacklistPath = appConfig!.security.tokenValidation.blacklistPath;

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
          logger.error(`无法解析白名单文件 ${whitelistPath}`, MODULE_NAME, { 
            error: error instanceof Error ? error.message : String(error) 
          });
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
          logger.error(`无法解析黑名单文件 ${blacklistPath}`, MODULE_NAME, { 
            error: error instanceof Error ? error.message : String(error) 
          });
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
      logger.error('加载代币列表时出错', MODULE_NAME, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      // 确保即使出错也有空的列表
      this.whitelist.clear();
      this.blacklist.clear();
      this.blacklistPatterns = [];
    }
  }

  /**
   * 加载白名单
   * @param tokens 白名单代币条目
   * 
   * 【比喻解释】
   * 就像更新优质鱼类图鉴：
   * - 清空旧的图鉴内容
   * - 添加每种已知安全鱼类的详细信息
   * - 记录总共有多少种安全鱼类
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
   * 
   * 【比喻解释】
   * 就像更新危险鱼类警示录：
   * - 清空旧的警示录内容
   * - 添加每种已知危险鱼类的信息
   * - 更新危险鱼类的识别特征库
   * - 记录总共有多少种危险鱼类和识别特征
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
   * 
   * 【比喻解释】
   * 就像定期检查鱼类图鉴是否需要更新：
   * - 查看上次更新图鉴的时间
   * - 如果已经过了预设的更新周期，则获取最新版本
   * - 确保渔船总是使用最新的鱼类安全信息
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
   * @param liquidityUsd 流动性(美元)
   * @returns 验证结果
   * 
   * 【比喻解释】
   * 就像检验捕获的鱼是否安全可食：
   * - 先检查是否是已知的优质鱼种(白名单)
   * - 再检查是否是已知的危险鱼种(黑名单)
   * - 分析鱼的各项指标(流动性、价格等)
   * - 生成一份详细的安全报告
   * 
   * 【编程语法通俗翻译】
   * await = 耐心等待：某些检查需要时间，必须等结果出来才能继续
   * return = 出具报告：完成所有检查后，提供最终的安全评估结果
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
    if (appConfig!.security.tokenValidation.useWhitelist) {
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
    if (appConfig!.security.tokenValidation.useBlacklist) {
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
                          appConfig!.security.tokenValidation.minLiquidityUsd;
      
      if (liquidityUsd < minLiquidity) {
        result.isValid = false;
        result.reason = `流动性太低: $${liquidityUsd} < $${minLiquidity}`;
        return result;
      }
    }
    
    // 4. 元数据检查
    if (appConfig!.security.tokenValidation.requireMetadata) {
      // 如果没有元数据，尝试获取
      if (!token.metadata && (token.metadata === undefined)) {
        try {
          const connection = rpcService.getConnection();
          if (!connection) {
            throw new Error('RPC连接未初始化');
          }
          const mintInfo = await connection.getParsedAccountInfo(token.mint);
          
          // 获取元数据失败的处理
          if (!token.metadata) {
            result.isValid = false;
            result.reason = '无法获取代币元数据';
            return result;
          }
        } catch (error) {
          logger.warn(`获取代币 ${mintAddress} 元数据失败`, MODULE_NAME, { 
            error: error instanceof Error ? error.message : String(error) 
          });
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
        const connection = rpcService.getConnection();
        if (!connection) {
          throw new Error('RPC连接未初始化');
        }
        const mintInfo = await connection.getParsedAccountInfo(token.mint);
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
      logger.warn(`丰富代币 ${token.mint.toBase58()} 信息时出错`, MODULE_NAME, { 
        error: error instanceof Error ? error.message : String(error) 
      });
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

// 创建并导出单例实例
const tokenValidator = new TokenValidator();
export default tokenValidator; 