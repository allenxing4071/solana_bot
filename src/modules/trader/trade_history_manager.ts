/**
 * 交易历史管理器
 * 用于保存和查询交易历史记录
 * 
 * 【比喻解释】
 * 这就像渔船的捕捞日志系统：
 * - 记录每次出海的渔获情况（交易记录）
 * - 可以查询历史渔获记录（历史交易）
 * - 支持按各种条件筛选渔获记录（过滤查询）
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import logger from '../../core/logger';

// 模块名称常量
const MODULE_NAME = 'TradeHistoryManager';

/**
 * 交易记录接口
 * 定义交易记录的数据结构
 */
export interface Trade {
  id: string;               // 交易ID
  timestamp: number;        // 交易时间戳
  type: 'buy' | 'sell';     // 交易类型：买入或卖出
  tokenSymbol?: string;     // 代币符号
  tokenAddress: string;     // 代币地址
  amount: number;           // 交易数量
  price: number;            // 交易价格
  value: number;            // 交易价值
  txid?: string;            // 交易哈希ID
  status: 'pending' | 'completed' | 'failed'; // 交易状态
  dex?: string;             // 使用的DEX
  profit?: number;          // 利润（仅适用于卖出交易）
  fee?: number;             // 交易费用
  notes?: string;           // 备注
}

/**
 * 交易历史管理器类
 * 管理系统的交易历史记录
 */
export class TradeHistoryManager {
  private trades: Trade[] = [];
  private readonly dataPath: string;
  private isLoaded = false;
  
  /**
   * 构造函数
   * @param dataPath 数据存储路径
   */
  constructor(dataPath = './data/trades') {
    this.dataPath = dataPath;
    this.loadTrades().catch(error => {
      logger.error('加载交易历史失败', MODULE_NAME, {
        error: error instanceof Error ? error.message : String(error)
      });
    });
  }
  
  /**
   * 加载交易历史
   * 从文件系统加载保存的交易记录
   */
  private async loadTrades(): Promise<void> {
    try {
      // 确保数据目录存在
      await fs.mkdir(this.dataPath, { recursive: true });
      
      // 尝试读取交易历史文件
      const filePath = path.join(this.dataPath, 'trade_history.json');
      
      try {
        const data = await fs.readFile(filePath, 'utf8');
        this.trades = JSON.parse(data);
        logger.info(`已加载${this.trades.length}条交易记录`, MODULE_NAME);
      } catch (error) {
        // 如果文件不存在或格式不正确，初始化为空数组
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          logger.info('交易历史文件不存在，初始化为空记录', MODULE_NAME);
          this.trades = [];
        } else {
          throw error;
        }
      }
      
      this.isLoaded = true;
    } catch (error) {
      logger.error('加载交易历史时出错', MODULE_NAME, {
        error: error instanceof Error ? error.message : String(error)
      });
      this.trades = [];
      throw error;
    }
  }
  
  /**
   * 保存交易历史
   * 将当前的交易记录保存到文件系统
   */
  private async saveTrades(): Promise<void> {
    try {
      const filePath = path.join(this.dataPath, 'trade_history.json');
      await fs.writeFile(filePath, JSON.stringify(this.trades, null, 2), 'utf8');
      logger.debug(`已保存${this.trades.length}条交易记录`, MODULE_NAME);
    } catch (error) {
      logger.error('保存交易历史时出错', MODULE_NAME, {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * 添加交易记录
   * @param trade 交易记录对象
   */
  public async addTrade(trade: Trade): Promise<void> {
    // 确保数据已加载
    if (!this.isLoaded) {
      await this.loadTrades();
    }
    
    this.trades.push(trade);
    await this.saveTrades();
    
    logger.info(`已添加新交易记录: ${trade.id}`, MODULE_NAME, {
      type: trade.type,
      token: trade.tokenSymbol,
      amount: trade.amount,
      value: trade.value
    });
  }
  
  /**
   * 更新交易记录
   * @param tradeId 交易ID
   * @param updates 要更新的字段
   */
  public async updateTrade(tradeId: string, updates: Partial<Trade>): Promise<boolean> {
    // 确保数据已加载
    if (!this.isLoaded) {
      await this.loadTrades();
    }
    
    const index = this.trades.findIndex(t => t.id === tradeId);
    if (index === -1) {
      logger.warn(`更新交易记录失败: 找不到ID为${tradeId}的交易`, MODULE_NAME);
      return false;
    }
    
    // 合并更新
    this.trades[index] = { ...this.trades[index], ...updates };
    await this.saveTrades();
    
    logger.info(`已更新交易记录: ${tradeId}`, MODULE_NAME, {
      updates: Object.keys(updates)
    });
    
    return true;
  }
  
  /**
   * 获取所有交易记录
   * @returns 所有交易记录数组
   */
  public async getAllTrades(): Promise<Trade[]> {
    // 确保数据已加载
    if (!this.isLoaded) {
      await this.loadTrades();
    }
    
    // 按时间戳降序排序，最新的交易排在前面
    return [...this.trades].sort((a, b) => b.timestamp - a.timestamp);
  }
  
  /**
   * 获取指定代币的交易记录
   * @param tokenAddress 代币地址
   * @returns 该代币的交易记录数组
   */
  public async getTradesByToken(tokenAddress: string): Promise<Trade[]> {
    // 确保数据已加载
    if (!this.isLoaded) {
      await this.loadTrades();
    }
    
    return this.trades
      .filter(trade => trade.tokenAddress === tokenAddress)
      .sort((a, b) => b.timestamp - a.timestamp);
  }
  
  /**
   * 获取指定类型的交易记录
   * @param type 交易类型
   * @returns 指定类型的交易记录数组
   */
  public async getTradesByType(type: 'buy' | 'sell'): Promise<Trade[]> {
    // 确保数据已加载
    if (!this.isLoaded) {
      await this.loadTrades();
    }
    
    return this.trades
      .filter(trade => trade.type === type)
      .sort((a, b) => b.timestamp - a.timestamp);
  }
  
  /**
   * 获取指定时间范围内的交易记录
   * @param startTime 开始时间戳
   * @param endTime 结束时间戳
   * @returns 时间范围内的交易记录数组
   */
  public async getTradesByTimeRange(startTime: number, endTime: number): Promise<Trade[]> {
    // 确保数据已加载
    if (!this.isLoaded) {
      await this.loadTrades();
    }
    
    return this.trades
      .filter(trade => trade.timestamp >= startTime && trade.timestamp <= endTime)
      .sort((a, b) => b.timestamp - a.timestamp);
  }
  
  /**
   * 获取交易统计信息
   * @returns 交易统计数据
   */
  public async getTradeStats(): Promise<{
    totalTrades: number;
    buyTrades: number;
    sellTrades: number;
    successfulTrades: number;
    failedTrades: number;
    pendingTrades: number;
    totalProfit: number;
    totalFees: number;
  }> {
    // 确保数据已加载
    if (!this.isLoaded) {
      await this.loadTrades();
    }
    
    const buyTrades = this.trades.filter(t => t.type === 'buy').length;
    const sellTrades = this.trades.filter(t => t.type === 'sell').length;
    const successfulTrades = this.trades.filter(t => t.status === 'completed').length;
    const failedTrades = this.trades.filter(t => t.status === 'failed').length;
    const pendingTrades = this.trades.filter(t => t.status === 'pending').length;
    
    const totalProfit = this.trades
      .filter(t => t.type === 'sell' && t.profit !== undefined)
      .reduce((sum, t) => sum + (t.profit || 0), 0);
      
    const totalFees = this.trades
      .filter(t => t.fee !== undefined)
      .reduce((sum, t) => sum + (t.fee || 0), 0);
    
    return {
      totalTrades: this.trades.length,
      buyTrades,
      sellTrades,
      successfulTrades,
      failedTrades,
      pendingTrades,
      totalProfit,
      totalFees
    };
  }
} 