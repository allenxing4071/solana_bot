/**
 * 交易池监听器
 * 监控DEX上的新交易池创建
 * 
 * 【编程基础概念通俗比喻】
 * 1. 监听器(Listener) = 海洋探测系统：
 *    就像渔船上的高级探测系统，不断扫描海域寻找鱼群活动
 *    例如：connection.onProgramAccountChange() 就是持续观察海域的雷达装置
 *    
 * 2. 事件(Event) = 海洋信号：
 *    水下的各种动静，可能代表不同的海洋活动
 *    例如：代币创建事件就像海底火山喷发，新鱼种出现的信号
 *    
 * 3. 过滤器(Filter) = 信号筛选器：
 *    不是所有信号都值得关注，需要筛选出真正有价值的信号
 *    例如：memcmp过滤条件就像设置雷达只对特定大小的鱼群反应
 *    
 * 4. 订阅(Subscription) = 观察任务：
 *    分配船员执行的各种观察任务，每个任务关注不同区域
 *    例如：this.subscriptions数组就是当前进行中的所有观察任务清单
 * 
 * 【比喻解释】
 * 这个监听器就像渔船上的探测中心：
 * - 同时运行多台探测设备，监控多个海域（不同DEX）
 * - 利用声纳和雷达（账户变化和日志分析）捕捉信号
 * - 对发现的信号进行筛选和分析（数据解析）
 * - 当发现有价值目标时通知捕捞系统（触发交易）
 * - 保持整个探测系统的高效运行（资源管理）
 */

import { PublicKey } from '@solana/web3.js';
import { EventEmitter } from 'events';
import appConfig from '../../core/config';
import logger from '../../core/logger';
import rpcService from '../../services/rpc_service';
import { DexType, PoolInfo, EventType, SystemEvent } from '../../core/types';

// 模块名称
// 就像这个探测系统的编号
const MODULE_NAME = 'PoolMonitor';

/**
 * 池子监控器配置接口
 * 定义监控器所需的各种设置参数
 * 
 * 【比喻解释】
 * 这就像探测系统的操作手册：
 * - 规定了探测器扫描频率（检查间隔）
 * - 列出了需要监控的海域（DEX列表）
 * - 配置了每个海域的特殊标识（programId）
 * - 决定了哪些海域需要关注（enabled开关）
 * 
 * 【编程语法通俗翻译】
 * interface = 标准规范：就像一份清单，列出了必须准备的设备
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
 * 这就像渔船上的高级鱼群探测系统：
 * - 配备了多种传感器（监听不同DEX）
 * - 持续扫描海域寻找鱼群聚集（流动性池）
 * - 能够区分不同鱼群特征（不同池类型）
 * - 发现新鱼群后自动追踪和记录（事件处理）
 * - 定期清理过期数据保持系统高效（资源管理）
 * 
 * 【编程语法通俗翻译】
 * class = 设计图纸：这是一个完整的探测系统设计方案
 * extends EventEmitter = 继承通讯能力：这个系统能够向其他系统发送信号
 */
class PoolMonitor extends EventEmitter {
  // 配置信息
  // 就像探测系统的设置参数
  private readonly config: PoolMonitorConfig;
  
  // 运行状态标志
  // 就像系统的开关状态
  private isRunning = false;
  
  // 定期检查的计时器
  // 就像定期巡逻的闹钟
  private checkIntervalId: NodeJS.Timeout | null = null;
  
  // 已知池子的存储
  // 就像已发现鱼群的记录本
  private knownPools: Map<string, PoolInfo> = new Map();
  
  // 事件订阅的集合
  // 就像分配出去的观察任务清单
  private subscriptions: Map<string, number> = new Map();

  /**
   * 构造函数
   * 初始化池子监听器并加载配置
   * 
   * 【比喻解释】
   * 这就像组装和校准探测系统：
   * - 读取探测范围和频率（配置加载）
   * - 确认要监控的海域（启用的DEX）
   * - 准备日志记录设备（日志初始化）
   * - 但还未实际开始工作（等待start调用）
   * 
   * 【编程语法通俗翻译】
   * constructor = 组装仪式：创建这个探测系统的过程
   * super() = 继承基础功能：先完成通讯系统的基础设置
   * this.config = 保存设置：把操作手册放在随手可得的地方
   */
  constructor() {
    // 初始化事件发射器
    // 就像安装基础通讯设备
    super();

    // 从配置中加载监控设置
    // 就像根据操作手册设置探测参数
    this.config = {
      checkInterval: appConfig.monitoring.poolMonitorInterval,
      dexes: appConfig.dexes.filter(dex => dex.enabled)
    };

    // 记录初始化完成
    // 就像在日志中记录设备安装完毕
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
   * 这就像启动船上所有探测设备：
   * - 检查系统是否已经在运行（避免重复启动）
   * - 打开各种扫描仪和传感器（设置订阅）
   * - 加载已知鱼群数据（加载现有池子）
   * - 安排定期巡查任务（定期检查）
   * - 确认所有设备正常工作（状态检查）
   * 
   * 【编程语法通俗翻译】
   * async = 启动需要时间：不是一按按钮就立刻完成的
   * if (this.isRunning) return = 防重复：如果设备已在运行就不要再启动一次
   * try/catch = 安全操作：小心启动，出问题立即处理
   * 
   * @returns {Promise<void>} - 启动完成的信号
   */
  async start(): Promise<void> {
    // 检查是否已在运行
    // 就像确认设备是否已经开启
    if (this.isRunning) {
      logger.warn('交易池监听器已经在运行中', MODULE_NAME);
      return;
    }

    // 记录启动信息
    // 就像在日志中记录开始工作
    logger.info('开始启动交易池监听器', MODULE_NAME);
    
    // 设置运行标志
    // 就像打开系统总开关
    this.isRunning = true;

    try {
      // 设置DEX程序监听
      // 就像启动各种探测设备
      await this.setupProgramSubscriptions();

      // 初始加载现有池子
      // 就像加载已知鱼群数据库
      await this.loadExistingPools();

      // 设置定期检查
      // 就像设置定期巡查任务
      this.startPeriodicCheck();

      // 记录启动成功
      // 就像在日志中记录系统正常运行
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
   * 这就像关闭船上所有探测设备：
   * - 取消所有定期巡查任务（清除定时器）
   * - 收回所有探测设备（取消订阅）
   * - 保存当前状态（记录日志）
   * - 完全关闭系统电源（状态设置）
   * 
   * 【编程语法通俗翻译】
   * if (!this.isRunning) return = 无需操作：如果设备已经关闭就不用再关一次
   * clearInterval = 取消定时：停止原本安排的定期巡查
   * 
   * @returns {Promise<void>} - 停止完成的信号
   */
  async stop(): Promise<void> {
    // 检查是否在运行
    // 就像确认设备是否已开启
    if (!this.isRunning) {
      return;
    }

    // 记录停止信息
    // 就像在日志中记录准备关闭系统
    logger.info('停止交易池监听器', MODULE_NAME);

    // 清除定时器
    // 就像取消定期巡查任务
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }

    // 取消所有订阅
    // 就像收回所有探测设备
    await this.unsubscribeAll();

    // 更新运行状态
    // 就像关闭系统总开关
    this.isRunning = false;
    
    // 记录停止完成
    // 就像在日志中记录系统已安全关闭
    logger.info('交易池监听器已停止', MODULE_NAME);
  }

  /**
   * 设置程序订阅
   * 为每个启用的DEX创建监听
   * 
   * 【比喻解释】
   * 这就像为每个海域设置专门的探测器：
   * - 为每个目标海域（DEX）准备设备
   * - 同时使用声纳和摄像头（账户和日志监听）
   * - 设置好信号接收方式（回调函数）
   * - 保存每个探测器的识别码（订阅ID）
   * - 确认所有设备工作正常（日志记录）
   * 
   * 【编程语法通俗翻译】
   * for (const dex of this.config.dexes) = 挨个设置：对每个目标海域逐一部署设备
   * try/catch = 安全部署：如果某个设备部署失败，不影响其他设备
   * 
   * @returns {Promise<void>} - 设置完成的信号
   * @private
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
          (accountInfo, context) => this.handleProgramAccountChange(dex.name, programId, accountInfo, context)
        );
        this.subscriptions.set(`program:${dex.name}`, programSubId);
        
        // 设置日志订阅
        // 就像部署海面观测设备
        const logsSubId = await rpcService.subscribeLogs(
          programId,
          (logs, context) => this.handleProgramLogs(dex.name, programId, logs, context)
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
   * 分析账户信息，查找新池子创建迹象
   * 
   * 【比喻解释】
   * 这就像分析声纳接收到的信号：
   * - 接收来自特定海域的声纳信号（账户信息）
   * - 分析信号是否表示鱼群聚集（新池子）
   * - 如果信号明确，进行更深入分析（检查池子详情）
   * - 记录每次声纳探测结果（日志）
   * 
   * 【编程语法通俗翻译】
   * if (!this.isRunning) return = 设备已关闭：如果系统已关闭，不再处理信号
   * logger.debug = 记录细节：把探测到的小信号记在技术日志里
   * 
   * @param {DexType} dexName - 交易所名称，就像海域名称
   * @param {PublicKey} programId - 程序ID，像是特定区域的坐标
   * @param {any} accountInfo - 账户信息，像是声纳接收到的原始信号
   * @param {any} context - 上下文信息，像是信号接收时的环境数据
   * @private
   */
  private handleProgramAccountChange(
    dexName: DexType, 
    _programId: PublicKey,
    accountInfo: any, 
    _context: any
  ): void {
    // 检查系统是否运行中
    // 就像确认设备是否开启
    if (!this.isRunning) return;

    // 记录探测到的变化
    // 就像记录接收到的声纳信号
    logger.debug(`检测到 ${dexName} 程序账户变化`, MODULE_NAME);
    
    // 确保accountInfo及其pubkey属性存在
    if (!accountInfo || !accountInfo.pubkey) {
      logger.warn(`接收到无效的账户信息，缺少pubkey`, MODULE_NAME, { dex: dexName });
      return;
    }
    
    // 解析数据查找池子创建
    // 就像分析声纳信号寻找鱼群
    this.checkForNewPool(dexName, accountInfo.pubkey, accountInfo.account);
  }

  /**
   * 处理程序日志
   * 分析程序日志，查找池子创建的关键信息
   * 
   * 【比喻解释】
   * 这就像分析水面观测设备的录像：
   * - 查看来自特定海域的画面记录（程序日志）
   * - 寻找水面波纹或其他鱼群迹象（关键词）
   * - 如果发现明显迹象，立即深入调查（查询交易）
   * - 记录每次重要发现（日志记录）
   * 
   * 【编程语法通俗翻译】
   * const signature = context.signature = 交易标识：就像每段录像的时间戳
   * logMessages.some() = 查找特征：浏览记录寻找特定的波纹模式
   * 
   * @param {DexType} dexName - 交易所名称，就像海域名称
   * @param {PublicKey} programId - 程序ID，像是特定区域的坐标
   * @param {any} logs - 日志内容，像是观测设备记录的画面
   * @param {any} context - 上下文信息，像是录像的时间和位置信息
   * @private
   */
  private handleProgramLogs(
    dexName: DexType,
    _programId: PublicKey,
    logs: any,
    context: any
  ): void {
    // 检查系统是否运行中
    // 就像确认观测设备是否开启
    if (!this.isRunning) return;
    
    // 获取交易签名和日志内容
    // 就像获取录像的编号和内容
    const signature = context.signature;
    const logMessages = logs.logs || [];
    
    // 获取池子创建关键词
    // 就像获取鱼群特征的识别清单
    const poolCreationKeywords = this.getPoolCreationKeywords(dexName);
    
    // 检查日志是否包含关键词
    // 就像检查录像中是否有鱼群特征
    const hasPoolCreation = logMessages.some((log: string) => 
      poolCreationKeywords.some(keyword => log.includes(keyword))
    );
    
    // 如果发现池子创建迹象
    // 就像发现明显的鱼群活动
    if (hasPoolCreation) {
      // 记录发现信息
      // 就像记录重要发现
      logger.info(`检测到 ${dexName} 可能的新池子创建日志`, MODULE_NAME, {
        signature,
        dex: dexName
      });
      
      // 深入分析交易细节
      // 就像派出小队近距离观察鱼群
      this.processTransactionWithPool(dexName, signature);
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
  private async processTransactionWithPool(_dexName: DexType, signature: string): Promise<void> {
    try {
      // 获取交易详情
      const txInfo = await rpcService.withRetry(
        async () => await rpcService.connection.getParsedTransaction(signature)
      );
      
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
          this.checkForNewPool(dex.name, account.pubkey, account.account);
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
          dex: dexName,
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
          const isPool = this.analyzeAccountForPool(dex.name, account.pubkey, account.account);
          
          if (isPool) {
            poolCount++;
            const poolKey = `${dex.name}:${account.pubkey.toBase58()}`;
            
            // 创建池子信息对象
            const poolInfo: PoolInfo = {
              address: account.pubkey,
              dex: dex.name,
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
}

// 创建并导出单例
export const poolMonitor = new PoolMonitor();
export default poolMonitor; 