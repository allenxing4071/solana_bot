/**
 * RPC连接服务
 * 管理与Solana节点的连接
 * 
 * 【编程基础概念通俗比喻】
 * 这个模块就像渔船的无线电通讯系统：
 * - 与岸上（区块链节点）保持稳定通信
 * - 发送指令（交易）并接收反馈
 * - 在通信不稳定时自动重新连接
 * 
 * 【比喻解释】
 * 这个服务就像船上的通讯官：
 * - 管理与陆地的多种通讯方式（HTTP和WebSocket）
 * - 确保命令能可靠传达（重试机制）
 * - 处理各类信息的接收和解析（账户数据、日志等）
 */

import {
  Connection,
  ConnectionConfig,
  Commitment,
  PublicKey,
  Transaction,
  SendOptions,
  Keypair,
  VersionedTransaction,
  AccountInfo,
  LogsFilter,
  Signer,
  KeyedAccountInfo
} from '@solana/web3.js';
import appConfig from '../core/config';
import logger from '../core/logger';
import { WebSocket } from 'ws';

const MODULE_NAME = 'RPCService';

/**
 * 基本RPC服务接口定义
 */
export interface IRPCService {
  initialize(): Promise<void>;
  getConnection(): Connection | null;
  getAccountInfo(address: PublicKey, commitment?: Commitment): Promise<AccountInfo<Buffer> | null>;
  getProgramAccounts(programId: PublicKey, filters?: any[]): Promise<Array<{pubkey: PublicKey, account: AccountInfo<Buffer>}>>;
  subscribeAccount(address: PublicKey, callback: (accountInfo: AccountInfo<Buffer>) => void, commitment?: Commitment): Promise<number>;
  subscribeLogs(filter: LogsFilter, callback: (logs: any) => void): Promise<number>;
  subscribeProgram(programId: PublicKey, callback: (accountInfo: AccountInfo<Buffer>) => void, commitment?: Commitment): Promise<number>;
  unsubscribe(subscriptionId: number): Promise<boolean>;
  unsubscribeAll(): Promise<void>;
  sendTransaction(transaction: Transaction | VersionedTransaction, signers: Signer[], options?: SendOptions): Promise<string>;
  withRetry<T>(fn: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T>;
}

/**
 * 缓存账户信息类型
 */
interface CachedAccountInfo {
  data: any;
  timestamp: number;
}

/**
 * 订阅信息类型
 */
interface SubscriptionInfo {
  address?: PublicKey;
  programId?: PublicKey;
  filter?: LogsFilter;
  callback?: (...args: any[]) => void;
  commitment?: Commitment;
}

// 连接配置
const connectionConfig: ConnectionConfig = {
  commitment: appConfig.network.cluster === 'mainnet-beta' ? 'confirmed' : 'processed',
  confirmTransactionInitialTimeout: 60000
};

// 连接重试配置
const MAX_CONN_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

/**
 * 获取备用RPC端点
 * 从环境变量中解析备用RPC端点列表
 * 
 * @returns 备用RPC端点数组
 */
function getBackupRPCEndpoints(): string[] {
  const backupEndpoints = process.env.BACKUP_RPC_ENDPOINTS || '';
  if (!backupEndpoints) return [];
  
  return backupEndpoints.split(',').filter(url => url.trim().startsWith('http'));
}

/**
 * RPC服务类
 * 负责管理与Solana RPC节点的通信
 */
class RPCService implements IRPCService {
  private _connection: Connection | null = null;
  private _subscriptions = new Map<number, SubscriptionInfo>();
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000;
  
  /**
   * 构造函数
   */
  constructor() {
    const rpcUrl = appConfig.network.rpcUrl;
    if (!rpcUrl) {
      logger.warn('未配置RPC URL，将在初始化时使用备用节点');
    }
  }
  
  /**
   * 初始化连接
   */
  async initialize(): Promise<void> {
    try {
      // 获取RPC URL
      let rpcUrl = appConfig.network.rpcUrl;
      
      // 如果主RPC URL未设置或明确使用备用节点
      if (!rpcUrl || process.env.USE_BACKUP_RPC === 'true') {
        const backupEndpoints = process.env.BACKUP_RPC_ENDPOINTS?.split(',') || [];
        if (backupEndpoints.length > 0) {
          rpcUrl = backupEndpoints[0].trim();
          logger.info(`使用备用RPC节点: ${rpcUrl}`);
        } else {
          throw new Error('未配置有效的RPC URL或备用节点');
        }
      }
      
      // 初始化连接
      this._connection = new Connection(rpcUrl, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000
      });
      
      // 验证连接
      try {
        const version = await this._connection.getVersion();
        logger.info(`成功连接到Solana节点，版本: ${JSON.stringify(version)}`);
      } catch (error) {
        logger.error(`Solana节点连接测试失败: ${error instanceof Error ? error.message : String(error)}`);
        throw new Error('无法连接到Solana节点');
      }
      
      logger.info(`RPC服务初始化完成，节点: ${rpcUrl}`);
    } catch (error) {
      logger.error(`RPC服务初始化失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * 获取连接实例
   */
  getConnection(): Connection | null {
    return this._connection;
  }
  
  /**
   * 获取账户信息
   */
  async getAccountInfo(address: PublicKey, commitment?: Commitment): Promise<AccountInfo<Buffer> | null> {
    if (!this._connection) {
      throw new Error('RPC连接未初始化');
    }
    
    try {
      return await this._connection.getAccountInfo(address, commitment);
    } catch (error) {
      logger.error(`获取账户信息失败: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
  
  /**
   * 获取程序账户
   */
  async getProgramAccounts(programId: PublicKey, filters?: any[]): Promise<Array<{pubkey: PublicKey, account: AccountInfo<Buffer>}>> {
    if (!this._connection) {
      throw new Error('RPC连接未初始化');
    }
    
    try {
      const config: any = {};
      if (filters && filters.length > 0) {
        config.filters = filters;
      }
      
      const response = await this._connection.getProgramAccounts(programId, config);
      const result: Array<{pubkey: PublicKey, account: AccountInfo<Buffer>}> = [];
      
      if (response && Array.isArray(response)) {
        for (const item of response) {
          result.push({
            pubkey: item.pubkey,
            account: item.account
          });
        }
      }
      
      return result;
    } catch (error) {
      logger.error(`获取程序账户失败: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
  
  /**
   * 订阅账户变更
   */
  async subscribeAccount(address: PublicKey, callback: (accountInfo: AccountInfo<Buffer>) => void, commitment?: Commitment): Promise<number> {
    if (!this._connection) {
      throw new Error('RPC连接未初始化');
    }
    
    try {
      const subscriptionId = this._connection.onAccountChange(address, callback, commitment);
      this._subscriptions.set(subscriptionId, { address, callback });
      return subscriptionId;
    } catch (error) {
      logger.error(`订阅账户变更失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * 订阅程序账户变更
   */
  async subscribeProgram(programId: PublicKey, callback: (accountInfo: AccountInfo<Buffer>) => void, commitment?: Commitment): Promise<number> {
    if (!this._connection) {
      throw new Error('RPC连接未初始化');
    }
    
    try {
      const subscriptionId = this._connection.onProgramAccountChange(
        programId,
        (keyedAccountInfo) => {
          callback(keyedAccountInfo.accountInfo);
        },
        commitment
      );
      this._subscriptions.set(subscriptionId, { programId, callback });
      return subscriptionId;
    } catch (error) {
      logger.error(`订阅程序账户变更失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * 订阅日志
   */
  async subscribeLogs(filter: LogsFilter, callback: (logs: any) => void): Promise<number> {
    if (!this._connection) {
      throw new Error('RPC连接未初始化');
    }
    
    try {
      const subscriptionId = this._connection.onLogs(filter, callback);
      this._subscriptions.set(subscriptionId, { filter, callback });
      return subscriptionId;
    } catch (error) {
      logger.error(`订阅日志失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * 取消订阅
   */
  async unsubscribe(subscriptionId: number): Promise<boolean> {
    if (!this._connection) {
      return false;
    }
    
    try {
      // 尝试不同类型的取消订阅方法
      let success = false;
      
      try {
        await this._connection.removeAccountChangeListener(subscriptionId);
        success = true;
      } catch (e) {
        // 可能不是账户变更监听器，尝试其他类型
      }
      
      if (!success) {
        try {
          await this._connection.removeProgramAccountChangeListener(subscriptionId);
          success = true;
        } catch (e) {
          // 可能不是程序账户监听器，尝试其他类型
        }
      }
      
      if (!success) {
        try {
          await this._connection.removeOnLogsListener(subscriptionId);
          success = true;
        } catch (e) {
          // 可能不是日志监听器
          logger.debug(`无法移除监听器: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
      
      if (success) {
        this._subscriptions.delete(subscriptionId);
      } else {
        logger.warn(`无法识别订阅类型，订阅ID: ${subscriptionId}`);
      }
      
      return success;
    } catch (error) {
      logger.error(`取消订阅失败: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
  
  /**
   * 取消所有订阅
   */
  async unsubscribeAll(): Promise<void> {
    if (!this._connection) {
      return;
    }
    
    for (const subscriptionId of this._subscriptions.keys()) {
      try {
        await this._connection.removeAccountChangeListener(subscriptionId);
      } catch (error) {
        logger.error(`取消订阅失败 (ID: ${subscriptionId}): ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    this._subscriptions.clear();
  }
  
  /**
   * 发送交易
   */
  async sendTransaction(transaction: Transaction | VersionedTransaction, signers: Signer[], options?: SendOptions): Promise<string> {
    if (!this._connection) {
      throw new Error('RPC连接未初始化');
    }
    
    try {
      // 处理不同类型的交易
      if (transaction instanceof Transaction) {
        // 标准交易
        return await this._connection.sendTransaction(transaction, signers, options);
      } else {
        // 版本化交易
        return await this._connection.sendTransaction(transaction, options);
      }
    } catch (error) {
      logger.error(`发送交易失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 带重试机制的函数执行
   */
  async withRetry<T>(fn: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> {
    let lastError: Error | null = null;
    
    for (let i = 0; i < this.MAX_RETRIES; i++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn(`操作失败，准备重试 (${i + 1}/${this.MAX_RETRIES})`, MODULE_NAME, {
          error: lastError.message
        });
        
        if (i < this.MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * (i + 1)));
        }
      }
    }
    
    throw lastError || new Error('重试次数已达上限');
  }
}

// 创建并导出单例
export const rpcService = new RPCService();
export default rpcService; 