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
  LogsFilter
} from '@solana/web3.js';
import appConfig from '../core/config';
import logger from '../core/logger';

const MODULE_NAME = 'RPCService';

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
 * 
 * 【比喻解释】
 * 这就像渔船的通讯中心：
 * - 维护多种与陆地的联系方式（HTTP/WebSocket连接）
 * - 管理发出的所有通讯请求（RPC调用）
 * - 保持持续监听特定频道（订阅）
 */
class RPCService {
  private _connection: Connection;
  private _wsConnection: Connection | null = null;
  private _wsSubscriptions: Map<string, number> = new Map();
  private _backupEndpoints: string[] = [];
  private _currentEndpointIndex = 0;

  /**
   * 构造函数
   * 
   * 【比喻解释】
   * 这就像安装和调试通讯设备：
   * - 设置主要通讯线路（HTTP连接）
   * - 如有可能，建立实时通话频道（WebSocket）
   * - 记录设备就绪状态（日志）
   */
  constructor() {
    try {
      // 获取主RPC URL
      const rpcUrl = appConfig.network.rpcUrl;
      const wsUrl = appConfig.network.wsUrl;
      
      // 获取备用RPC端点
      this._backupEndpoints = getBackupRPCEndpoints();

      logger.debug('初始化RPC连接配置', MODULE_NAME, {
        mainRpcUrl: rpcUrl,
        wsUrl: wsUrl,
        backupEndpoints: this._backupEndpoints
      });

      // 验证RPC URL
      if (!rpcUrl || !rpcUrl.startsWith('http')) {
        throw new Error('无效的RPC URL: ' + rpcUrl);
      }

      // 创建HTTP连接
      this._connection = new Connection(
        rpcUrl,
        connectionConfig
      );
      
      // 创建WebSocket连接
      if (wsUrl && wsUrl.startsWith('wss')) {
        try {
          this._wsConnection = new Connection(
            wsUrl,
            connectionConfig
          );
        } catch (wsError) {
          logger.warn('WebSocket连接创建失败，使用HTTP连接作为备用', MODULE_NAME, { 
            error: wsError instanceof Error ? wsError.message : String(wsError)
          });
          this._wsConnection = this._connection;
        }
      } else {
        this._wsConnection = this._connection;
      }
      
      logger.info('RPC服务初始化完成', MODULE_NAME, {
        cluster: appConfig.network.cluster,
        rpcUrl,
        wsUrl,
        hasBackups: this._backupEndpoints.length > 0,
        hasWs: !!this._wsConnection && this._wsConnection !== this._connection
      });
    } catch (error) {
      logger.error('RPC服务初始化失败', MODULE_NAME, { 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * 获取主连接
   * 
   * 【比喻解释】
   * 这就像获取主通讯设备的引用
   * 
   * @return {Connection} - 主连接对象
   */
  get connection(): Connection {
    return this._connection;
  }

  /**
   * 获取WebSocket连接
   * 
   * 【比喻解释】
   * 这就像获取实时通话设备的引用，如果没有则使用普通通讯设备
   * 
   * @return {Connection|null} - WebSocket连接对象或主连接
   */
  get wsConnection(): Connection | null {
    return this._wsConnection || this._connection;
  }

  /**
   * 切换到下一个备用RPC端点
   * 当当前端点出现故障时使用
   * 
   * @returns {boolean} 是否成功切换到新端点
   */
  private switchToNextEndpoint(): boolean {
    if (this._backupEndpoints.length === 0) {
      logger.warn('没有可用的备用RPC端点', MODULE_NAME);
      return false;
    }
    
    this._currentEndpointIndex = (this._currentEndpointIndex + 1) % this._backupEndpoints.length;
    const newEndpoint = this._backupEndpoints[this._currentEndpointIndex];
    
    try {
      this._connection = new Connection(newEndpoint, connectionConfig);
      logger.info(`已切换到备用RPC端点: ${newEndpoint}`, MODULE_NAME);
      return true;
    } catch (error) {
      logger.error('切换RPC端点失败', MODULE_NAME, {
        error: error instanceof Error ? error.message : String(error),
        endpoint: newEndpoint
      });
      return false;
    }
  }

  /**
   * 检查连接状态
   * 
   * 【比喻解释】
   * 这就像测试通讯设备是否能正常工作：
   * - 发送测试信号看是否有回应
   * - 如果没有回应则表示线路故障
   * 
   * @return {Promise<boolean>} - 连接是否正常工作
   */
  async isConnectionHealthy(): Promise<boolean> {
    try {
      const result = await this._connection.getVersion();
      return !!result;
    } catch (error) {
      logger.error('RPC连接检查失败', MODULE_NAME, { 
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 重新连接
   * 
   * 【比喻解释】
   * 这就像重启和重新调整通讯设备：
   * - 关闭并重新建立连接
   * - 测试新连接是否正常工作
   * - 报告连接恢复情况
   * 
   * @return {Promise<boolean>} - 是否成功重新连接
   */
  async reconnect(): Promise<boolean> {
    try {
      // 先尝试重新连接到主RPC
      const mainRpcUrl = appConfig.network.rpcUrl;
      const wsUrl = appConfig.network.wsUrl;
      
      if (mainRpcUrl && mainRpcUrl.startsWith('http')) {
        this._connection = new Connection(mainRpcUrl, connectionConfig);
        
        if (wsUrl && wsUrl.startsWith('wss')) {
          try {
            this._wsConnection = new Connection(wsUrl, connectionConfig);
          } catch (wsError) {
            this._wsConnection = this._connection;
          }
        }
        
        // 检查新连接是否正常
        const isHealthy = await this.isConnectionHealthy();
        
        if (isHealthy) {
          logger.info('RPC重连成功', MODULE_NAME);
          return true;
        }
      }
      
      // 如果主RPC连接失败或不可用，尝试备用端点
      if (this.switchToNextEndpoint()) {
        const isHealthy = await this.isConnectionHealthy();
        
        if (isHealthy) {
          logger.info('备用RPC节点连接成功', MODULE_NAME);
          return true;
        }
      }
      
      // 所有尝试都失败
      logger.warn('RPC重连后连接仍不健康', MODULE_NAME);
      return false;
    } catch (error) {
      logger.error('RPC重连失败', MODULE_NAME, { 
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 执行带有重试的RPC调用
   * 
   * 【比喻解释】
   * 这就像发送重要消息时的标准流程：
   * - 尝试发送消息
   * - 如果没收到确认，检查通讯设备
   * - 必要时修复设备并重新发送
   * - 多次尝试后仍失败则报告问题
   * 
   * 【编程语法通俗翻译】
   * 泛型T = 灵活数据类型：适应不同种类的返回信息
   * try/catch = 应对意外：处理发送过程中可能的问题
   * 
   * @param {Function} fn - 要执行的函数，就像准备发送的消息
   * @param {...any[]} args - 函数参数，就像消息的具体内容
   * @return {Promise<T>} - 函数执行结果，就像收到的回复
   */
  async withRetry<T>(fn: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt < MAX_CONN_RETRIES; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error as Error;
        logger.warn(`RPC调用失败，尝试重试 (${attempt + 1}/${MAX_CONN_RETRIES})`, MODULE_NAME, { 
          error: error instanceof Error ? error.message : String(error)
        });
        
        // 检查是否是连接错误，如果是则尝试重连
        if (this.isConnectionError(error)) {
          // 先尝试重连
          const reconnected = await this.reconnect();
          
          // 如果重连失败且有备用端点，尝试切换端点
          if (!reconnected && this._backupEndpoints.length > 0) {
            this.switchToNextEndpoint();
          }
        }
        
        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
    
    logger.error('RPC调用在多次尝试后失败', MODULE_NAME, { 
      error: lastError instanceof Error ? lastError.message : String(lastError)
    });
    throw lastError;
  }

  /**
   * 模拟交易
   * 
   * 【比喻解释】
   * 这就像在实际行动前演练捕鱼计划：
   * - 在不实际捕鱼的情况下测试方案
   * - 检查计划中的潜在问题
   * - 获得执行结果的预测
   * 
   * @param {Transaction|VersionedTransaction} transaction - 交易对象，就像捕鱼计划
   * @param {Keypair[]} signers - 签名者列表，就像授权执行的船员
   * @return {Promise<any>} - 模拟结果，就像计划可行性评估
   */
  async simulateTransaction(
    transaction: Transaction | VersionedTransaction,
    signers?: Keypair[]
  ): Promise<any> {
    return this.withRetry(
      async () => {
        // 如果是普通交易且有签名者，需要先部分签名
        if (transaction instanceof Transaction && signers && signers.length > 0) {
          transaction.sign(...signers);
        }
        
        // 根据交易类型使用不同的调用方式
        let result;
        if (transaction instanceof Transaction) {
          result = await this._connection.simulateTransaction(transaction, signers || []);
        } else {
          result = await this._connection.simulateTransaction(transaction as VersionedTransaction);
        }
        
        if (result.value.err) {
          logger.warn('交易模拟失败', MODULE_NAME, {
            error: result.value.err,
            logs: result.value.logs
          });
        }
        
        return result;
      }
    );
  }

  /**
   * 发送交易
   * 
   * 【比喻解释】
   * 这就像向海洋发出捕鱼指令：
   * - 准备好计划并获得所有必要签名（授权）
   * - 将命令发送到区块链网络（海洋）
   * - 返回可追踪的交易ID（捕鱼行动编号）
   * 
   * @param {Transaction|VersionedTransaction} transaction - 交易对象，就像捕鱼行动计划
   * @param {Keypair[]} signers - 签名者列表，就像授权执行的船员
   * @param {SendOptions} options - 发送选项，就像行动的具体要求
   * @return {Promise<string>} - 交易签名，就像行动的唯一识别码
   */
  async sendTransaction(
    transaction: Transaction | VersionedTransaction,
    signers: Keypair[],
    options?: SendOptions
  ): Promise<string> {
    return this.withRetry(
      async () => {
        const sendOptions: SendOptions = {
          skipPreflight: false,
          preflightCommitment: connectionConfig.commitment as Commitment,
          maxRetries: 3,
          ...options
        };
        
        // 如果是普通交易，使用传统方式签名和发送
        if (transaction instanceof Transaction) {
          transaction.recentBlockhash = (await this._connection.getLatestBlockhash()).blockhash;
          transaction.sign(...signers);
          return await this._connection.sendRawTransaction(transaction.serialize(), sendOptions);
        } 
        // 如果是版本化交易，使用新的方式
        else {
          // 注意：版本化交易的签名方式可能需要根据具体情况调整
          return await this._connection.sendTransaction(transaction, sendOptions);
        }
      }
    );
  }

  /**
   * 获取账户信息
   * @param address 账户地址
   * @param commitment 确认级别
   * @returns 账户信息
   */
  async getAccountInfo(address: PublicKey, commitment?: Commitment): Promise<any> {
    return this.withRetry(
      async () => {
        return await this._connection.getAccountInfo(
          address,
          commitment || connectionConfig.commitment as Commitment
        );
      }
    );
  }

  /**
   * 获取多个账户信息
   * @param addresses 账户地址列表
   * @param commitment 确认级别
   * @returns 账户信息列表
   */
  async getMultipleAccountsInfo(addresses: PublicKey[], commitment?: Commitment): Promise<any[]> {
    return this.withRetry(
      async () => {
        return await this._connection.getMultipleAccountsInfo(
          addresses,
          commitment || connectionConfig.commitment as Commitment
        );
      }
    );
  }

  /**
   * 获取程序账户
   * @param programId 程序ID
   * @param commitment 确认级别
   * @returns 程序账户列表
   */
  async getProgramAccounts(programId: PublicKey, commitment?: Commitment): Promise<ReadonlyArray<{
    pubkey: PublicKey;
    account: AccountInfo<Buffer>;
  }>> {
    return this.withRetry(
      async () => {
        return await this._connection.getProgramAccounts(
          programId,
          { commitment: commitment || connectionConfig.commitment as Commitment }
        );
      }
    );
  }

  /**
   * 订阅账户变化
   * @param address 账户地址
   * @param callback 回调函数
   * @param commitment 确认级别
   * @returns 订阅ID
   */
  async subscribeAccount(
    address: PublicKey,
    callback: (accountInfo: any, context: any) => void,
    commitment?: Commitment
  ): Promise<number> {
    const wsConn = this.wsConnection;
    if (!wsConn) {
      throw new Error('WebSocket连接未配置');
    }
    
    const subscriptionId = await wsConn.onAccountChange(
      address,
      callback,
      commitment || connectionConfig.commitment as Commitment
    );
    
    // 保存订阅ID以便后续管理
    this._wsSubscriptions.set(address.toBase58(), subscriptionId);
    logger.debug(`已订阅账户 ${address.toBase58()}`, MODULE_NAME);
    
    return subscriptionId;
  }

  /**
   * 订阅程序账户变化
   * @param programId 程序ID
   * @param callback 回调函数
   * @param commitment 确认级别
   * @returns 订阅ID
   */
  async subscribeProgram(
    programId: PublicKey,
    callback: (accountInfo: any, context: any) => void,
    commitment?: Commitment
  ): Promise<number> {
    const wsConn = this.wsConnection;
    if (!wsConn) {
      throw new Error('WebSocket连接未配置');
    }
    
    const subscriptionId = await wsConn.onProgramAccountChange(
      programId,
      callback,
      commitment || connectionConfig.commitment as Commitment
    );
    
    // 保存订阅ID以便后续管理
    this._wsSubscriptions.set(`program:${programId.toBase58()}`, subscriptionId);
    logger.debug(`已订阅程序 ${programId.toBase58()}`, MODULE_NAME);
    
    return subscriptionId;
  }

  /**
   * 订阅日志
   * @param filter 日志过滤条件
   * @param callback 回调函数
   * @returns 订阅ID
   */
  async subscribeLogs(
    filter: LogsFilter,
    callback: (logs: any, context: any) => void
  ): Promise<number> {
    const wsConn = this.wsConnection;
    if (!wsConn) {
      throw new Error('WebSocket连接未配置');
    }
    
    const subscriptionId = await wsConn.onLogs(
      filter,
      callback
    );
    
    // 保存订阅ID以便后续管理
    let filterKey: string;
    if (filter instanceof PublicKey) {
      filterKey = `logs:${filter.toBase58()}`;
    } else {
      // 安全地处理其他类型的过滤器
      filterKey = `logs:filter:${Math.random().toString(36).substring(2, 15)}`;
    }
      
    this._wsSubscriptions.set(filterKey, subscriptionId);
    logger.debug(`已订阅日志 ${filterKey}`, MODULE_NAME);
    
    return subscriptionId;
  }

  /**
   * 取消订阅
   * @param subscriptionId 订阅ID
   * @returns 是否成功取消
   */
  async unsubscribe(subscriptionId: number): Promise<boolean> {
    const wsConn = this.wsConnection;
    if (!wsConn) {
      return false;
    }
    
    try {
      // 使用Promise包装以返回布尔值
      await wsConn.removeAccountChangeListener(subscriptionId);
      
      // 从订阅Map中移除
      for (const [key, id] of this._wsSubscriptions.entries()) {
        if (id === subscriptionId) {
          this._wsSubscriptions.delete(key);
          logger.debug(`已取消订阅 ${key}`, MODULE_NAME);
          break;
        }
      }
      
      return true;
    } catch (error) {
      logger.warn('取消订阅失败', MODULE_NAME, { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  /**
   * 取消所有订阅
   */
  async unsubscribeAll(): Promise<void> {
    const wsConn = this.wsConnection;
    if (!wsConn) {
      return;
    }
    
    const subscriptionIds = Array.from(this._wsSubscriptions.values());
    for (const id of subscriptionIds) {
      try {
        await wsConn.removeAccountChangeListener(id);
      } catch (error) {
        logger.warn(`无法取消订阅ID ${id}`, MODULE_NAME, { error: error instanceof Error ? error.message : String(error) });
      }
    }
    
    this._wsSubscriptions.clear();
    logger.info('已取消所有订阅', MODULE_NAME);
  }

  /**
   * 判断是否为连接错误
   * @param error 错误对象
   * @returns 是否是连接错误
   */
  private isConnectionError(error: any): boolean {
    if (!error) return false;
    
    const errorString = String(error);
    return (
      errorString.includes('timed out') ||
      errorString.includes('network error') ||
      errorString.includes('failed to fetch') ||
      errorString.includes('connection closed')
    );
  }
}

// 创建并导出单例
export const rpcService = new RPCService();
export default rpcService; 