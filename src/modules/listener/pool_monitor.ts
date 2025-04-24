/**
 * 交易池监听器（海洋探测雷达系统）
 * 监控DEX上的新交易池创建
 * 
 * 【编程基础概念通俗比喻】
 * 1. 监听器(Listener) = 渔船上的海洋探测雷达：
 *    就像渔船上的高级声纳和雷达设备，不断扫描海域寻找鱼群聚集地
 *    例如：connection.onProgramAccountChange() 就是持续工作的声纳装置，能捕捉到水下鱼群活动
 *    
 * 2. 事件(Event) = 雷达捕获的信号：
 *    雷达屏幕上显示的各种不同亮点，代表不同的海洋活动
 *    例如：代币池创建事件就像发现了一片新的鱼群聚集地，立刻在雷达上显示特殊标记
 *    
 * 3. 过滤器(Filter) = 雷达信号筛选器：
 *    不是所有雷达信号都值得渔船关注，需要筛选出真正有价值的鱼群信号
 *    例如：memcmp过滤条件就像设置雷达只显示特定大小和密度的鱼群，忽略海草和小型生物
 *    
 * 4. 订阅(Subscription) = 雷达监测任务：
 *    分配给不同船员的观察任务，每人负责监控雷达上不同区域的动态
 *    例如：this.subscriptions就是当前安排的所有监测任务清单，记录谁在监测哪个区域
 * 
 * 5. 池子(Pool) = 鱼群聚集地：
 *    海洋中鱼类密集的区域，通常意味着捕鱼的好时机
 *    例如：knownPools就像船长记录的已知鱼群位置图，标记着哪里有可捕捞的鱼群
 * 
 * 【比喻解释】
 * 这个模块就像渔船上的探测指挥中心：
 * - 配备了多套雷达和声纳，同时监控多个海域（不同DEX）
 * - 能够自动过滤无关信号，只关注有价值的鱼群（新池子）
 * - 发现新鱼群后立即通知捕鱼系统准备行动（事件触发）
 * - 维护一张详细的海域鱼群分布图（池子数据库）
 * - 定期扫描海域确保不遗漏任何新出现的鱼群（定期检查）
 * - 负责整个探测系统的启动、运行和关闭（生命周期管理）
 */

import { EventEmitter } from 'node:events';
import { appConfig } from '../../core/config';
import logger from '../../core/logger';
import rpcService from '../../services/rpc_service';
import { DexType, PoolInfo, EventType, SystemEvent } from '../../core/types';
import { PublicKey, AccountInfo } from '@solana/web3.js';

// 模块名称
// 就像这个雷达系统的舱位编号
const MODULE_NAME = 'PoolMonitor';

/**
 * 池子监控器配置接口
 * 定义监控器所需的各种设置参数
 * 
 * 【比喻解释】
 * 这就像探测雷达的操作手册：
 * - 规定了雷达扫描频率（检查间隔）
 * - 列出了需要监控的海域坐标（DEX列表）
 * - 配置了每个海域的特殊识别码（programId）
 * - 决定了哪些海域需要重点监控（enabled开关）
 */
interface PoolMonitorConfig {
  checkInterval: number;
  dexes: {
    name: DexType;
    programId: string;
    enabled: boolean;
  }[];
}

/**
 * 交易池监听服务
 * 负责监听DEX合约上的新交易池创建事件
 * 
 * 【比喻解释】
 * 这就像渔船上的高级鱼群探测指挥中心：
 * - 统筹协调多套探测设备的工作（多DEX监听）
 * - 配有自动识别系统区分不同类型的鱼群（池子分类）
 * - 能够立即向捕鱼队发出新鱼群的精确位置（事件通知）
 * - 维护完整的海域鱼群分布档案（数据记录）
 * - 自动过滤干扰信号，提高探测效率（数据过滤）
 * - 全天候不间断工作，确保不错过任何机会（持续监控）
 * 
 * 【编程语法通俗翻译】
 * class = 一套完整系统：包含多种功能和组件的探测中心设计图
 * extends EventEmitter = 带通讯功能：这个系统能够向其他系统发送信号
 * private = 内部组件：只有系统内部可以操作的控制装置和数据
 */
class PoolMonitor extends EventEmitter {
  // 配置信息
  // 就像探测系统的参数设置手册
  private readonly config: PoolMonitorConfig;
  
  // 运行状态标志
  // 就像整个系统的总电源开关状态
  private isRunning = false;
  
  // 定期检查的计时器
  // 就像自动定时扫描的控制时钟
  private checkIntervalId: NodeJS.Timeout | null = null;
  
  // 已知池子的存储
  // 就像已发现鱼群的电子海图
  private knownPools: Map<string, PoolInfo> = new Map();
  
  // 事件订阅的集合
  // 就像各个探测设备的工作任务分配表
  private subscriptions: Map<string, number> = new Map();

  /**
   * 检查监控器是否处于活动状态
   * 
   * 【比喻解释】
   * 这就像查看探测雷达的工作状态灯：
   * - 绿灯亮起表示系统正在运行
   * - 红灯表示系统当前已关闭
   * 
   * @returns {boolean} 监控器是否正在运行
   */
  public isActive(): boolean {
    return this.isRunning;
  }

  /**
   * 构造函数
   * 初始化池子监听器并加载配置
   * 
   * 【比喻解释】
   * 这就像组装和校准探测指挥中心：
   * - 读取探测任务的详细参数（配置加载）
   * - 确认要监控的各个海域范围（启用的DEX）
   * - 准备记录系统随时记录发现（日志初始化）
   * - 装配好所有设备但尚未通电（等待start调用）
   * 
   * 【编程语法通俗翻译】
   * constructor = 建造过程：创建并安装这套探测系统
   * super() = 安装基础组件：先完成通讯系统的安装
   * this.config = 保存设置手册：把操作指南放在控制台旁边随时查阅
   */
  constructor() {
    // 初始化事件发射器
    // 就像安装基础通讯系统
    super();

    // 从配置中加载监控设置
    // 就像根据任务手册设置探测参数
    const enabledDexes = appConfig.dexes
      .filter(dex => dex.enabled)
      .map(dex => ({
        name: dex.name,
        programId: dex.programId,
        enabled: dex.enabled
      }));
    
    this.config = {
      checkInterval: appConfig.monitoring.poolMonitorInterval,
      dexes: enabledDexes
    };

    // 记录初始化完成
    // 就像在航行日志中记录设备安装完毕
    logger.info('交易池监听器初始化完成', MODULE_NAME, {
      enabledDexes: this.config.dexes.map(dex => dex.name),
      checkInterval: this.config.checkInterval
    });
  }

  /**
   * 启动监听服务
   * 开始监控所有配置的DEX程序变化
   * 
   * 【比喻解释】
   * 这就像启动整个探测指挥中心：
   * - 先确认系统没有在运行（避免重复启动）
   * - 依次启动所有探测设备（设置订阅）
   * - 加载已知鱼群分布图（加载现有池子）
   * - 设置定时巡航模式（定期检查）
   * - 确认所有系统正常运转（状态检查）
   * - 向全船通报探测系统已启动（日志记录）
   * 
   * 【编程语法通俗翻译】
   * async = 启动需要时间：不是一按按钮就立刻完成的复杂过程
   * if (this.isRunning) return = 重复检查：如果系统已经运行就不要再启动一次
   * try/catch = 安全程序：小心启动，随时准备处理可能出现的故障
   * 
   * @returns {Promise<void>} - 启动完成的信号
   */
  async start(): Promise<void> {
    // 检查是否已在运行
    // 就像确认指挥中心是否已经开启
    if (this.isRunning) {
      logger.warn('交易池监听器已经在运行中', MODULE_NAME);
      return;
    }

    // 记录启动信息
    // 就像在航行日志中记录开始工作
    logger.info('开始启动交易池监听器', MODULE_NAME);
    
    // 设置运行标志
    // 就像打开系统总电源
    this.isRunning = true;

    try {
      // 设置DEX程序监听
      // 就像启动各海域的探测雷达
      await this.setupProgramSubscriptions();

      // 初始加载现有池子
      // 就像导入最新的鱼群分布图
      await this.loadExistingPools();

      // 设置定期检查
      // 就像设置雷达自动扫描模式
      this.startPeriodicCheck();

      // 记录启动成功
      // 就像向船长报告系统已全面运行
      logger.info('交易池监听器启动成功', MODULE_NAME);
    } catch (error) {
      // 处理启动错误
      // 就像处理设备故障
      logger.error('交易池监听器启动失败', MODULE_NAME, { error: error instanceof Error ? error.message : String(error) });
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * 停止监听服务
   * 清理所有活动的监听和定时任务
   * 
   * 【比喻解释】
   * 这就像安全关闭整个探测指挥中心：
   * - 先通知全船准备关闭探测系统（记录日志）
   * - 取消所有定时扫描任务（清除定时器）
   * - 依次关闭各个探测设备（取消订阅）
   * - 保存当前探测数据（状态保存）
   * - 最后关闭整个系统电源（状态设置）
   * - 向船长确认探测系统已安全关闭（完成日志）
   * 
   * 【编程语法通俗翻译】
   * if (!this.isRunning) return = 无效操作检查：如果系统已经关闭就不用再关一次
   * clearInterval = 取消定时任务：停止原本设置的自动扫描
   * await = 耐心等待：关闭每个设备需要时间，要等所有设备都安全关闭
   * 
   * @returns {Promise<void>} - 停止完成的信号
   */
  async stop(): Promise<void> {
    // 检查是否在运行
    // 就像确认系统是否处于开启状态
    if (!this.isRunning) {
      return;
    }

    // 记录停止信息
    // 就像在航行日志中记录准备关闭系统
    logger.info('停止交易池监听器', MODULE_NAME);

    // 清除定时器
    // 就像关闭自动扫描模式
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }

    // 取消所有订阅
    // 就像依次关闭所有探测设备
    await this.unsubscribeAll();

    // 更新运行状态
    // 就像关闭系统总电源
    this.isRunning = false;
    
    // 记录停止完成
    // 就像向船长报告系统已安全关闭
    logger.info('交易池监听器已停止', MODULE_NAME);
  }

  /**
   * 设置程序订阅
   * 为每个启用的DEX创建监听
   * 
   * 【比喻解释】
   * 这就像设置各个海域的专门探测装置：
   * - 逐一检查需要监控的海域（遍历DEX）
   * - 针对每个海域启动特定的探测设备（创建监听）
   * - 设置每个设备的精确参数（过滤条件）
   * - 指派船员负责监控每个设备（回调函数）
   * - 记录每个设备的工作状态（订阅记录）
   * 
   * 【编程语法通俗翻译】
   * private = 内部操作：只有指挥中心内部才能执行的设置过程
   * async = 耗时任务：需要时间来逐一启动所有设备
   * for...of = 逐一处理：像是挨个检查清单上的每一项
   */
  private async setupProgramSubscriptions(): Promise<void> {
    // 为每个启用的DEX创建监听
    // 就像为每个海域部署探测器
    for (const dex of this.config.dexes) {
      try {
        // 创建程序ID对象
        // 就像确定探测目标的坐标
        const programId = new PublicKey(dex.programId);
        
        // 设置程序账户变化订阅
        // 就像部署水下声纳设备
        const programSubId = await rpcService.subscribeProgram(
          programId,
          (accountInfo) => {
            // 添加上下文参数的模拟
            const context = { slot: 0 }; // 简化的上下文对象
            this.handleProgramAccountChange(programId, accountInfo);
          }
        );
        this.subscriptions.set(`program:${dex.name}`, programSubId);
        
        // 设置日志订阅
        // 就像部署海面观测设备
        const logFilter = {
          mentions: [programId.toBase58()]
        } as any;
        const logsSubId = await rpcService.subscribeLogs(
          logFilter,
          (logs) => {
            // 添加上下文参数的模拟
            const context = { signature: '' }; // 简化的上下文对象
            this.handleProgramLogs(logs, programId);
          }
        );
        this.subscriptions.set(`logs:${dex.name}`, logsSubId);
        
        // 记录设置成功
        // 就像在日志中记录设备部署完成
        logger.info(`已为 ${dex.name} 设置监听`, MODULE_NAME, { programId: dex.programId });
      } catch (error) {
        // 处理设置错误
        // 就像记录设备部署失败
        logger.error(`无法为 ${dex.name} 设置监听`, MODULE_NAME, { error: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  /**
   * 处理程序账户变更
   * @param programId 程序ID
   * @param accountInfo 账户信息
   */
  private handleProgramAccountChange(programId: PublicKey, accountInfo: AccountInfo<Buffer>): void {
    // 找到对应的DEX
    const dex = this.config.dexes.find(d => d.programId === programId.toBase58());
    if (!dex) return;

    // 检查是否为新池子
    this.checkForNewPool(dex.name, new PublicKey(accountInfo.owner), accountInfo);
  }

  /**
   * 处理程序日志
   * @param logs 日志信息
   * @param programId 程序ID
   */
  private handleProgramLogs(logs: any, programId: PublicKey): void {
    // 找到对应的DEX
    const dex = this.config.dexes.find(d => d.programId === programId.toBase58());
    if (!dex) return;

    const keywords = this.getPoolCreationKeywords(this.getDexType(dex.name));

    // 检查日志中是否包含池子创建关键词
    const containsKeyword = keywords.some(keyword => 
      logs.logs.some((log: string) => log.includes(keyword))
    );

    if (containsKeyword) {
      // 提取交易签名
      const signature = logs.signature;
      if (signature) {
        this.processTransactionWithPool(this.getDexType(dex.name), signature);
      }
    }
  }

  /**
   * 获取池子创建关键词
   * @param dexName DEX名称
   * @returns 关键词列表
   */
  private getPoolCreationKeywords(dexName: DexType): string[] {
    switch (dexName) {
      case DexType.RAYDIUM:
        return ['InitializePool', 'CreatePool', 'initialize_pool'];
      case DexType.ORCA:
        return ['create_pool', 'create_pool_with_seeds', 'initialize_pool'];
      default:
        return ['CreatePool', 'InitPool', 'InitializePool', 'create_pool'];
    }
  }

  /**
   * 处理包含新池子的交易
   * @param dexName DEX名称
   * @param signature 交易签名
   */
  private async processTransactionWithPool(dexName: DexType, signature: string): Promise<void> {
    try {
      // 获取交易详情
      const connection = rpcService.getConnection();
      if (!connection) {
        throw new Error('RPC连接未初始化');
      }
      const txInfo = await connection.getParsedTransaction(signature);
      
      if (!txInfo) {
        logger.warn(`无法获取交易 ${signature} 的详情`, MODULE_NAME);
        return;
      }
      
      // 根据不同DEX解析池子信息
      // 这里仅作示例，实际实现需要根据具体DEX格式进行解析
      // 实际会更复杂，可能需要分析指令数据、账户等
      
      // 示例: 简单提取相关账户
      const accounts = txInfo.transaction.message.instructions
        .flatMap(ix => ('accounts' in ix) ? ix.accounts : [])
        .filter(acc => !!acc);
      
      // 可能需要进一步查询这些账户以确认是否为池子
      if (accounts.length > 0) {
        logger.debug(`从交易 ${signature} 中提取到 ${accounts.length} 个相关账户`, MODULE_NAME);
        
        // 进一步分析这些账户 - 实际实现中需要更精确地识别池子账户
        // 此处仅为示例
      }
    } catch (error) {
      logger.error(`处理交易 ${signature} 时出错`, MODULE_NAME, { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * 开始定期检查新池子
   */
  private startPeriodicCheck(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
    }
    
    this.checkIntervalId = setInterval(
      () => this.checkForNewPoolsPeriodically(),
      this.config.checkInterval
    );
    
    logger.info(`已设置定期检查，间隔 ${this.config.checkInterval}ms`, MODULE_NAME);
  }

  /**
   * 定期检查新池子
   */
  private async checkForNewPoolsPeriodically(): Promise<void> {
    if (!this.isRunning) return;
    
    logger.debug('开始定期检查新池子', MODULE_NAME);
    
    for (const dex of this.config.dexes) {
      try {
        const programId = new PublicKey(dex.programId);
        
        // 获取程序账户 - 可能需要设置过滤器以减少返回数据量
        // 在实际实现中，应该使用更精确的过滤条件
        const accounts = await rpcService.getProgramAccounts(programId);
        
        logger.debug(`从 ${dex.name} 获取到 ${accounts.length} 个程序账户`, MODULE_NAME);
        
        // 分析账户数据，查找新池子
        for (const account of accounts) {
          this.checkForNewPool(this.getDexType(dex.name), account.pubkey, account.account);
        }
      } catch (error) {
        logger.error(`检查 ${dex.name} 新池子时出错`, MODULE_NAME, { error: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  /**
   * 检查是否为新池子
   * @param dexName DEX名称
   * @param pubkey 公钥
   * @param accountData 账户数据
   */
  private checkForNewPool(dexName: DexType, pubkey: PublicKey, accountData: any): void {
    // 确保pubkey存在且有toBase58方法
    if (!pubkey || typeof pubkey.toBase58 !== 'function') {
      logger.warn(`检查新池子时收到无效的pubkey: ${dexName}`, MODULE_NAME);
      return;
    }
    
    // 确保accountData存在且格式正确
    if (!accountData || typeof accountData !== 'object') {
      logger.debug(`跳过处理: 账户数据无效 (${pubkey.toBase58()})`, MODULE_NAME);
      return;
    }

    // 确保accountData包含必要的字段
    if (!accountData.data || !accountData.owner) {
      logger.debug(`跳过处理: 账户数据缺少必要字段 (${pubkey.toBase58()})`, MODULE_NAME);
      return;
    }
    
    const poolKey = `${dexName}:${pubkey.toBase58()}`;
    
    // 如果已知此池子，跳过
    if (this.knownPools.has(poolKey)) {
      return;
    }
    
    try {
      // 这里需要根据不同DEX的数据结构进行解析，判断是否为池子
      // 实际实现会更复杂，这里简化处理
      const isPool = this.analyzeAccountForPool(dexName, pubkey, accountData);
      
      if (isPool) {
        // 创建池子信息对象
        const poolInfo: PoolInfo = {
          address: pubkey,
          dex: this.getDexType(dexName),
          tokenAMint: new PublicKey('11111111111111111111111111111111'), // 示例，实际需要从数据中解析
          tokenBMint: new PublicKey('11111111111111111111111111111111'), // 示例，实际需要从数据中解析
          createdAt: Date.now(),
          firstDetectedAt: Date.now()
        };
        
        // 记录新池子
        this.knownPools.set(poolKey, poolInfo);
        
        // 发出新池子事件
        const event: SystemEvent = {
          type: EventType.NEW_POOL_DETECTED,
          data: poolInfo,
          timestamp: Date.now()
        };
        
        this.emit('newPool', poolInfo);
        this.emit('event', event);
        
        logger.info(`检测到新池子: ${poolKey}`, MODULE_NAME, {
          dex: dexName,
          address: pubkey.toBase58()
        });
        
        // 进一步分析池子中的代币
        this.analyzePoolTokens(poolInfo);
      }
    } catch (error) {
      logger.warn(`处理潜在新池子时出错: ${pubkey.toBase58()}`, MODULE_NAME, {
        error: error instanceof Error ? error.message : String(error),
        dex: dexName
      });
    }
  }

  /**
   * 分析账户数据判断是否为池子
   * @param dexName DEX名称
   * @param pubkey 公钥
   * @param accountData 账户数据
   * @returns 是否为池子
   */
  private analyzeAccountForPool(dexName: DexType, pubkey: PublicKey, accountData: any): boolean {
    // 实际实现中需要根据不同DEX的数据结构进行解析
    // 这里仅做简化示例
    
    // 示例判断逻辑 - 实际会更复杂
    try {
      // 检查数据长度是否符合池子账户的要求
      if (!accountData || !accountData.data) {
        return false;
      }
      
      // 确保data属性是Buffer类型或Uint8Array类型
      const accountDataBuffer = accountData.data;
      if (!Buffer.isBuffer(accountDataBuffer) && !(accountDataBuffer instanceof Uint8Array)) {
        logger.debug(`账户数据不是有效的Buffer: ${pubkey.toBase58()}`, MODULE_NAME);
        return false;
      }
      
      // 确保数据有足够的长度进行分析
      if (accountDataBuffer.length < 32) {
        logger.debug(`账户数据长度不足以进行分析: ${pubkey.toBase58()}`, MODULE_NAME);
        return false;
      }
      
      switch (dexName) {
        case DexType.RAYDIUM:
          // Raydium池子账户特征判断
          // 示例: 检查数据长度、特定字节模式等
          // 这里使用简化判断，实际可能需要查找特定的字节序列模式
          const isRaydiumPool = accountDataBuffer.length > 200;
          if (isRaydiumPool) {
            logger.debug(`发现可能的Raydium池子: ${pubkey.toBase58()}`, MODULE_NAME);
          }
          return isRaydiumPool;
          
        case DexType.ORCA:
          // Orca池子账户特征判断
          const isOrcaPool = accountDataBuffer.length > 240;
          if (isOrcaPool) {
            logger.debug(`发现可能的Orca池子: ${pubkey.toBase58()}`, MODULE_NAME);
          }
          return isOrcaPool;
          
        default:
          // 通用判断
          return false;
      }
    } catch (error) {
      logger.warn(`分析账户 ${pubkey.toBase58()} 时出错`, MODULE_NAME, { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  /**
   * 分析池子中的代币
   * @param poolInfo 池子信息
   */
  private async analyzePoolTokens(poolInfo: PoolInfo): Promise<void> {
    // 实际实现中，需要查询代币信息，例如元数据等
    // 这里仅做简化示例
    
    try {
      // 查询代币A和代币B的信息
      // 示例: 获取代币元数据
      logger.debug(`分析池子 ${poolInfo.address.toBase58()} 中的代币`, MODULE_NAME);
      
      // 判断是否为新代币...
      // 如果是新代币，发出相应事件
      
    } catch (error) {
      logger.error(`分析池子代币时出错: ${poolInfo.address.toBase58()}`, MODULE_NAME, { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * 加载现有池子
   */
  private async loadExistingPools(): Promise<void> {
    logger.info('开始加载现有池子', MODULE_NAME);
    
    // 这里仅做简化，实际实现中应该使用更精确的查询条件
    for (const dex of this.config.dexes) {
      try {
        const programId = new PublicKey(dex.programId);
        
        logger.info(`加载 ${dex.name} 现有池子`, MODULE_NAME);
        
        // 获取程序账户 - 可能需要设置过滤器减少数据量
        const accounts = await rpcService.getProgramAccounts(programId);
        
        logger.info(`从 ${dex.name} 获取到 ${accounts.length} 个程序账户`, MODULE_NAME);
        
        // 初始化池子计数
        let poolCount = 0;
        
        // 分析账户，识别池子
        for (const account of accounts) {
          const isPool = this.analyzeAccountForPool(this.getDexType(dex.name), account.pubkey, account.account);
          
          if (isPool) {
            poolCount++;
            const poolKey = `${this.getDexType(dex.name)}:${account.pubkey.toBase58()}`;
            
            // 创建池子信息对象
            const poolInfo: PoolInfo = {
              address: account.pubkey,
              dex: this.getDexType(dex.name),
              tokenAMint: new PublicKey('11111111111111111111111111111111'), // 示例，实际需要从数据中解析
              tokenBMint: new PublicKey('11111111111111111111111111111111'), // 示例，实际需要从数据中解析
              createdAt: Date.now() - 3600000, // 假设一小时前创建，实际应从数据中解析
              firstDetectedAt: Date.now()
            };
            
            // 记录池子
            this.knownPools.set(poolKey, poolInfo);
          }
        }
        
        logger.info(`从 ${dex.name} 加载了 ${poolCount} 个现有池子`, MODULE_NAME);
        
      } catch (error) {
        logger.error(`加载 ${dex.name} 现有池子时出错`, MODULE_NAME, { error: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  /**
   * 取消所有订阅
   */
  private async unsubscribeAll(): Promise<void> {
    for (const [key, id] of this.subscriptions.entries()) {
      try {
        await rpcService.unsubscribe(id);
        logger.debug(`已取消订阅: ${key}`, MODULE_NAME);
      } catch (error) {
        logger.warn(`取消订阅 ${key} 失败`, MODULE_NAME, { error: error instanceof Error ? error.message : String(error) });
      }
    }
    
    this.subscriptions.clear();
  }

  /**
   * 获取已知池子列表
   */
  getKnownPools(): PoolInfo[] {
    return Array.from(this.knownPools.values());
  }

  /**
   * 获取指定DEX的池子数量
   * @param dexName DEX名称
   */
  getPoolCountByDex(dexName: DexType): number {
    let count = 0;
    
    for (const pool of this.knownPools.values()) {
      if (pool.dex === dexName) {
        count++;
      }
    }
    
    return count;
  }

  /**
   * 获取所有被监控的代币
   * 返回一个代币集合
   * 
   * @returns {string[]} 被监控的代币地址列表
   */
  getMonitoredTokens(): string[] {
    // 存储所有代币的集合（使用Set避免重复）
    const tokenSet = new Set<string>();
    
    // 遍历所有已知的池子
    this.knownPools.forEach(pool => {
      // 添加池子中的代币到集合
      if (pool.tokenAMint) tokenSet.add(pool.tokenAMint.toString());
      if (pool.tokenBMint) tokenSet.add(pool.tokenBMint.toString());
    });
    
    // 转换为数组并返回
    return Array.from(tokenSet);
  }

  /**
   * 将字符串转换为 DexType
   * @param name DEX名称
   * @returns DexType
   */
  private getDexType(name: string): DexType {
    switch (name.toLowerCase()) {
      case 'raydium':
        return DexType.RAYDIUM;
      case 'orca':
        return DexType.ORCA;
      case 'jupiter':
        return DexType.JUPITER;
      default:
        throw new Error(`不支持的DEX类型: ${name}`);
    }
  }
}

// 创建并导出单例
export const poolMonitor = new PoolMonitor();
export default poolMonitor; 