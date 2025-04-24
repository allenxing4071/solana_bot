"use strict";
/**
 * 交易模块（渔船捕捞作业指挥中心）
 * 整合机会检测、交易执行和策略管理，作为交易系统的主入口
 *
 * 【编程基础概念通俗比喻】
 * 1. 交易模块(Trader Module) = 渔船捕捞指挥中心：
 *    就像渔船上统筹协调所有捕捞活动的中枢系统
 *    例如：handleNewPool()就像船长接到发现新鱼群的报告后的决策过程
 *
 * 2. 机会(Opportunity) = 发现的鱼群：
 *    就像声纳探测到的值得下网捕捞的鱼群
 *    例如：activeOpportunities就像船长记录的所有已发现待捕捞的鱼群位置
 *
 * 3. 交易执行(Trade Execution) = 下网捕鱼行动：
 *    就像渔船派出小艇带着渔网去指定位置捕鱼
 *    例如：executeTrade()就像船长下令"在此处下网"的命令
 *
 * 4. 持仓(Position) = 船上储存的渔获：
 *    就像渔船上已经捕获并存放在鱼舱中的鱼
 *    例如：emitPositionUpdated()就像更新船上渔获储存状态的日志
 *
 * 5. 价格监控(Price Checking) = 鱼市行情监测：
 *    就像定期查询各类鱼的市场价格变化
 *    例如：checkPositionPrices()就像船员定期查询港口鱼市的最新价格
 *
 * 【比喻解释】
 * 这个模块就像渔船上的捕捞作业指挥中心：
 * - 接收探测雷达发现的新鱼群信息（新池子）
 * - 决定哪些鱼群值得派船去捕捞（机会评估）
 * - 根据当前天气和海况选择合适的捕捞方法（策略选择）
 * - 派出小艇执行具体的捕捞行动（交易执行）
 * - 管理船上已捕获的鱼类并决定何时卖出（持仓管理）
 * - 定期检查各类鱼的市场价格变化（价格监控）
 * - 在整个捕捞过程中保持与其他部门的通信（事件通知）
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraderModule = void 0;
const node_events_1 = require("node:events");
const web3_js_1 = require("@solana/web3.js");
const logger_1 = __importDefault(require("../../core/logger"));
const config_1 = __importDefault(require("../../core/config"));
const token_validator_1 = __importDefault(require("../../modules/analyzer/token_validator"));
const types_1 = require("../../core/types");
// 模块名称
// 就像渔船上这个部门的舱位编号
const MODULE_NAME = 'TraderModule';
/**
 * 交易模块类
 * 处理交易相关的核心业务逻辑
 *
 * 【比喻解释】
 * 这就像渔船上的捕捞作业指挥中心：
 * - 配备完整的决策系统（是否执行捕捞）
 * - 与探测系统保持密切联系（接收新池子）
 * - 根据船长制定的规则选择捕捞方法（策略）
 * - 协调各个小队执行具体捕捞行动（执行交易）
 * - 记录和管理船上已捕获的渔获（持仓管理）
 * - 定期评估渔获价值和市场行情（价格检查）
 * - 向船长汇报所有捕捞活动的状态（事件通知）
 *
 * 【编程语法通俗翻译】
 * class = 专业部门：一个有组织有分工的船上工作部门
 * extends EventEmitter = 带通讯功能：配备了与其他部门通信的设备
 * private = 内部事务：只有部门内部才能接触的事务和数据
 */
class TraderModule extends node_events_1.EventEmitter {
    /**
     * 构造函数
     * 初始化交易模块的基本设置
     *
     * 【比喻解释】
     * 这就像组建渔船捕捞指挥团队：
     * - 先建立基础通信系统（初始化事件通知）
     * - 设置默认的工作状态（禁用状态）
     * - 确定多久检查一次鱼市价格（价格检查间隔）
     * - 向船长报告团队已组建完成（日志记录）
     *
     * 【编程语法通俗翻译】
     * constructor = 组建团队：招募和组织指挥中心的工作人员
     * super() = 继承装备：安装从上级分配的通信设备
     */
    constructor() {
        // 初始化事件发射器
        // 就像安装与其他部门通信的设备
        super();
        this.walletManager = {};
        this.transactionBuilder = {};
        this.tokenValidator = {};
        this.riskManager = {};
        this.opportunityDetector = {};
        this.strategyManager = {};
        this.isRunning = false;
        this.isExecuting = false;
        this.activeOpportunities = new Map();
        this.pendingTrades = new Set();
        this.positions = [];
        this.priceCheckTimer = null;
        this.opportunityQueue = [];
        this.maxQueueSize = 100;
        this.batchProcessingSize = 5;
        this.lastBatchProcessTime = 0;
        this.batchProcessInterval = 1000; // 1秒处理一批
        this.priceCache = new Map();
        this.priceCacheExpiry = 60000; // 价格缓存过期时间，1分钟
        this.priceCheckQueue = [];
        this.isProcessingPriceQueue = false;
        this.maxPriceCheckBatchSize = 10;
        this.lastPriceCheckTime = 0;
        this.priceCheckInterval = 5000; // 5秒检查一次价格
        this.riskLevels = new Map(); // 代币风险等级映射
        this.maxRiskPerToken = 0.1; // 每个代币最大风险比例
        this.maxTotalRisk = 0.3; // 总风险上限
        this.riskAdjustmentInterval = 300000; // 5分钟调整一次风险
        this.riskAdjustmentTimer = null;
        this.recentTradeResults = [];
        this.maxRecentTrades = 50; // 保留最近50笔交易结果
        this.totalAllocatedFunds = 0; // 已分配资金总额
        this.maxAllocationPerToken = 0.2; // 每个代币最大分配比例
        // 初始化属性
        // 就像设置工作状态为待命
        this.isRunning = false;
        this.isExecuting = false;
        // 设置价格检查间隔
        // 就像设定检查鱼市价格的时间表
        this.batchProcessInterval = config_1.default.monitoring.priceCheckInterval || 5000;
        logger_1.default.info('交易模块已创建', MODULE_NAME);
    }
    /**
     * 初始化交易模块
     * 准备交易模块的所有系统和服务
     *
     * 【比喻解释】
     * 这就像渔船出航前的准备工作：
     * - 检查是否已经准备就绪（避免重复准备）
     * - 确认船长是否允许进行捕捞（配置检查）
     * - 准备所有捕捞设备和系统（初始化资源）
     * - 向船长报告准备完成状态（日志记录）
     *
     * 【编程语法通俗翻译】
     * async = 需要时间：这个准备过程需要一段时间
     * if (this.isInitialized) return = 避免重复：如果已经准备好就不必再准备
     * try/catch = 安全措施：准备过程中如有问题立即报告
     */
    async initialize() {
        // 检查是否已初始化
        // 就像检查是否已经准备就绪
        if (this.isRunning) {
            return;
        }
        try {
            // 记录初始化开始
            // 就像记录开始准备工作
            logger_1.default.info('初始化交易模块...', MODULE_NAME);
            // 如果在配置中禁用了交易功能
            // 就像船长下令仅观察不捕捞
            if (process.env.LISTEN_ONLY === 'true') {
                logger_1.default.info('交易功能已禁用，将仅监听新池子', MODULE_NAME);
                this.isRunning = false;
            }
            else {
                this.isRunning = true;
            }
            // 初始化完成
            // 就像所有准备工作已完成
            logger_1.default.info('交易模块初始化完成', MODULE_NAME);
        }
        catch (error) {
            // 处理初始化错误
            // 就像处理准备过程中遇到的问题
            logger_1.default.error('初始化交易模块时出错', MODULE_NAME, {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    /**
     * 启动交易模块
     * 开始监听和处理交易机会
     *
     * 【比喻解释】
     * 这就像渔船正式开始捕捞作业：
     * - 先确认所有设备已准备就绪（检查初始化）
     * - 记录开始工作的时间和状态（日志记录）
     * - 确认船长的最新指令（是否允许捕捞）
     * - 启动定期检查鱼价的任务（价格监控）
     * - 向全船通报捕捞作业正式开始（状态更新）
     *
     * 【优化说明】
     * 添加风险调整定时器和系统监控
     */
    async start(enableExecution = true) {
        // 检查是否已初始化
        // 就像确认设备是否已准备就绪
        if (!this.isRunning) {
            await this.initialize();
        }
        // 记录启动信息
        // 就像记录正式开始工作
        logger_1.default.info('启动交易模块...', MODULE_NAME);
        console.log('交易模块状态 - 启动过程:');
        console.log('enableExecution 参数:', enableExecution);
        console.log('LISTEN_ONLY环境变量:', process.env.LISTEN_ONLY);
        console.log('交易禁用状态:', !this.isRunning);
        // 设置是否启用交易执行
        // 就像设置是否允许实际捕鱼
        this.isRunning = enableExecution;
        // 如果交易功能被禁用
        // 就像仅观察不捕捞的模式
        if (!this.isRunning) {
            logger_1.default.info('交易功能已禁用，将仅监听新池子', MODULE_NAME);
            return;
        }
        // 启动价格检查
        // 开始定期监控持仓价格变化
        this.startPriceChecking();
        // 启动风险调整
        this.startRiskAdjustment();
        // 启动系统监控
        this.startSystemMonitoring();
        logger_1.default.info('交易模块已启动，交易功能已启用', MODULE_NAME);
    }
    /**
     * 停止交易模块
     * 结束所有交易相关活动
     *
     * 【比喻解释】
     * 这就像渔船结束当天的捕捞作业：
     * - 通知所有人准备停止工作（记录日志）
     * - 停止定期检查鱼价的任务（停止价格检查）
     * - 召回所有正在捕捞的小艇（清理进行中交易）
     * - 整理和归档今天发现的鱼群记录（清理机会列表）
     * - 向船长报告捕捞工作已安全结束（完成日志）
     *
     * 【优化说明】
     * 添加停止风险调整定时器
     */
    async stop() {
        // 记录停止信息
        // 就像记录准备结束工作
        logger_1.default.info('停止交易模块...', MODULE_NAME);
        // 停止价格检查
        // 结束定期的价格监控任务
        this.stopPriceChecking();
        // 停止风险调整
        this.stopRiskAdjustment();
        // 清理状态
        // 就像整理并归档工作记录
        this.activeOpportunities.clear();
        this.pendingTrades.clear();
        logger_1.default.info('交易模块已停止', MODULE_NAME);
    }
    /**
     * 处理新的流动性池
     *
     * 【比喻解释】
     * 就像船长收到发现新鱼群的报告：
     * - 先确认这个鱼群的位置（验证池子）
     * - 评估这个鱼群的价值（机会评估）
     * - 检查是否有足够的资源去捕捞（风险检查）
     * - 决定是否派出渔船去捕捞（策略检查）
     * - 如果决定捕捞，就加入捕捞计划（添加到队列）
     *
     * @param pool 新发现的流动性池
     */
    async handleNewPool(pool) {
        if (!this.isRunning) {
            logger_1.default.info('交易模块未运行，忽略新池子', MODULE_NAME);
            return;
        }
        try {
            // 检查是否已处理过该池子
            const poolKey = pool.address.toBase58();
            if (this.activeOpportunities.has(poolKey)) {
                logger_1.default.debug('已处理过该池子，忽略', MODULE_NAME, { poolKey });
                return;
            }
            // 创建TokenInfo对象
            const targetTokenInfo = {
                mint: pool.tokenAMint,
                symbol: pool.tokenASymbol
            };
            const baseTokenInfo = {
                mint: pool.tokenBMint,
                symbol: pool.tokenBSymbol
            };
            // 验证代币
            const targetTokenResult = await token_validator_1.default.validateToken(targetTokenInfo);
            const baseTokenResult = await token_validator_1.default.validateToken(baseTokenInfo);
            if (!targetTokenResult.isValid || !baseTokenResult.isValid) {
                logger_1.default.info('代币验证失败，无法处理', MODULE_NAME);
                return;
            }
            // 创建交易机会对象
            const opportunity = {
                pool: pool,
                targetToken: targetTokenResult.token,
                baseToken: baseTokenResult.token,
                estimatedPriceUsd: 0.001, // 默认价格估算
                confidence: 0.8,
                action: 'buy',
                priority: 0.5,
                priorityScore: 0.7,
                tokenSymbol: targetTokenResult.token.symbol || targetTokenResult.token.mint.toBase58(),
                timestamp: Date.now()
            };
            // 检查风险
            const riskCheck = await this.riskManager.checkRisk(opportunity);
            if (!riskCheck.passed) {
                logger_1.default.info('风险检查未通过，忽略机会', MODULE_NAME, {
                    reason: riskCheck.reason
                });
                return;
            }
            // 检查策略
            const strategyCheck = await this.strategyManager.shouldBuy(opportunity);
            if (!strategyCheck) {
                logger_1.default.info('策略检查未通过，忽略机会', MODULE_NAME);
                return;
            }
            // 添加到活跃机会列表
            this.activeOpportunities.set(poolKey, opportunity);
            // 添加到优先级队列
            this.addToOpportunityQueue(opportunity);
            // 发送机会检测事件
            this.emitOpportunityEvent(opportunity);
            // 如果队列达到批处理大小或距离上次批处理超过间隔时间，执行批处理
            const now = Date.now();
            if (this.opportunityQueue.length >= this.batchProcessingSize ||
                (now - this.lastBatchProcessTime) >= this.batchProcessInterval) {
                this.processOpportunityBatch();
            }
        }
        catch (error) {
            logger_1.default.error('处理新池子时出错', MODULE_NAME, {
                error: error instanceof Error ? error.message : String(error),
                pool: pool.address.toBase58()
            });
        }
    }
    /**
     * 处理交易机会
     *
     * 【比喻解释】
     * 就像船长收到发现新鱼群的报告后的决策过程：
     * - 先评估这个鱼群的价值（机会评估）
     * - 检查是否有足够的资源去捕捞（风险检查）
     * - 决定是否派出渔船去捕捞（策略检查）
     * - 如果决定捕捞，就加入捕捞计划（添加到队列）
     *
     * @param opportunity 交易机会
     * @returns Promise<void>
     */
    async handleOpportunity(opportunity) {
        if (!this.isRunning) {
            logger_1.default.info('交易模块未运行，忽略机会', MODULE_NAME);
            return;
        }
        try {
            // 检查是否已处理过该机会
            const poolKey = opportunity.pool.address.toBase58();
            if (this.activeOpportunities.has(poolKey)) {
                logger_1.default.debug('已处理过该机会，忽略', MODULE_NAME, { poolKey });
                return;
            }
            // 检查风险
            const riskCheck = await this.riskManager.checkRisk(opportunity);
            if (!riskCheck.passed) {
                logger_1.default.info('风险检查未通过，忽略机会', MODULE_NAME, {
                    reason: riskCheck.reason
                });
                return;
            }
            // 检查策略
            const strategyCheck = await this.strategyManager.shouldBuy(opportunity);
            if (!strategyCheck) {
                logger_1.default.info('策略检查未通过，忽略机会', MODULE_NAME);
                return;
            }
            // 添加到活跃机会列表
            this.activeOpportunities.set(poolKey, opportunity);
            // 添加到优先级队列
            this.addToOpportunityQueue(opportunity);
            // 发送机会检测事件
            this.emitOpportunityEvent(opportunity);
            // 如果队列达到批处理大小或距离上次批处理超过间隔时间，执行批处理
            const now = Date.now();
            if (this.opportunityQueue.length >= this.batchProcessingSize ||
                (now - this.lastBatchProcessTime) >= this.batchProcessInterval) {
                this.processOpportunityBatch();
            }
        }
        catch (error) {
            logger_1.default.error('处理交易机会时出错', MODULE_NAME, {
                error: error instanceof Error ? error.message : String(error),
                pool: opportunity.pool.address.toBase58()
            });
        }
    }
    /**
     * 将机会添加到优先级队列
     *
     * 【比喻解释】
     * 就像船长把新的捕捞任务加入任务清单：
     * - 根据鱼群的价值和捕捞难度给任务打分（计算优先级）
     * - 把任务按分数高低排序（优先级排序）
     * - 如果任务太多，就删除一些低分的任务（队列大小限制）
     *
     * @param opportunity 交易机会
     */
    addToOpportunityQueue(opportunity) {
        // 监控队列大小，如果超过警戒线，清理一部分低价值机会
        if (this.opportunityQueue.length > this.maxQueueSize * 0.8) {
            logger_1.default.warn('机会队列接近上限，执行预防性清理', MODULE_NAME, {
                currentSize: this.opportunityQueue.length,
                maxSize: this.maxQueueSize
            });
            // 仅保留25%高价值机会
            this.opportunityQueue.sort((a, b) => b.priority - a.priority);
            this.opportunityQueue = this.opportunityQueue.slice(0, Math.floor(this.maxQueueSize * 0.25));
        }
        // 计算优先级分数 (可以根据实际情况调整计算方式)
        const priority = opportunity.priorityScore || 0.5;
        // 添加到队列
        this.opportunityQueue.push({
            opportunity,
            priority,
            timestamp: Date.now()
        });
        // 按优先级排序 (高优先级在前)
        this.opportunityQueue.sort((a, b) => b.priority - a.priority);
        // 如果队列超过最大大小，移除最低优先级的项
        if (this.opportunityQueue.length > this.maxQueueSize) {
            this.opportunityQueue = this.opportunityQueue.slice(0, this.maxQueueSize);
        }
    }
    /**
     * 批量处理机会队列
     *
     * 【比喻解释】
     * 就像渔船上的批量作业系统：
     * - 同时处理多个相似的任务
     * - 提高整体效率
     * - 避免资源浪费
     */
    async processOpportunityBatch() {
        if (this.opportunityQueue.length === 0 || this.isExecuting) {
            return;
        }
        this.isExecuting = true;
        this.lastBatchProcessTime = Date.now();
        try {
            // 获取要处理的机会数量
            const batchSize = Math.min(this.batchProcessingSize, this.opportunityQueue.length);
            const batch = this.opportunityQueue.splice(0, batchSize);
            // 并行处理批次中的机会
            await Promise.all(batch.map(async ({ opportunity }) => {
                try {
                    // 检查机会是否仍然有效
                    const poolKey = opportunity.pool.address.toBase58();
                    if (!this.activeOpportunities.has(poolKey)) {
                        return;
                    }
                    // 执行交易
                    await this.executeTrade(opportunity);
                }
                catch (error) {
                    logger_1.default.error('处理机会时出错', MODULE_NAME, {
                        error: error instanceof Error ? error.message : String(error),
                        opportunity: opportunity.tokenSymbol
                    });
                }
            }));
        }
        finally {
            this.isExecuting = false;
            // 如果队列中还有机会，设置定时器继续处理
            if (this.opportunityQueue.length > 0) {
                setTimeout(() => this.processOpportunityBatch(), this.batchProcessInterval);
            }
        }
    }
    /**
     * 执行交易
     * 根据交易机会执行具体的交易操作
     *
     * 【比喻解释】
     * 这就像渔船船长下令执行一次完整的捕鱼行动：
     * - 先检查这片海域是否已有小船在捕捞（防止重复）
     * - 标记这片海域为"正在作业"状态（添加到待处理）
     * - 向安全中心请求分配捕捞资源（资金分配）
     * - 如果资源不足或安全中心拒绝，取消行动（处理拒绝）
     * - 准备捕捞装备和人员（准备交易参数）
     * - 派出小船执行实际的捕捞行动（执行交易）
     * - 等待小船返回并清点渔获（处理结果）
     * - 记录这次捕捞的详细情况（记录交易）
     * - 向全船通报捕捞成果（发送事件）
     * - 取消这片海域的"正在作业"标记（移除待处理）
     *
     * 【优化说明】
     * 添加动态风险控制和资金管理
     */
    async executeTrade(opportunity) {
        // 检查是否已在处理该机会
        // 就像检查是否已有小船在这片海域捕捞
        const opportunityId = opportunity.pool.address.toString();
        if (this.pendingTrades.has(opportunityId)) {
            logger_1.default.debug('跳过交易: 该机会已在处理中', MODULE_NAME, {
                pool: opportunityId,
                token: opportunity.targetToken.symbol || opportunity.targetToken.mint.toString()
            });
            return {
                success: false,
                error: '已超过最大待处理交易数',
                timestamp: Date.now()
            };
        }
        try {
            // 添加到待处理集合
            // 就像标记这片海域为"正在作业"
            this.pendingTrades.add(opportunityId);
            // 记录开始执行交易
            // 就像记录开始派出小船捕捞
            logger_1.default.info(`执行交易: ${opportunity.targetToken.symbol || opportunity.targetToken.mint.toString()}`, MODULE_NAME, {
                dex: opportunity.pool.dex,
                action: opportunity.action,
                price: opportunity.estimatedPriceUsd
            });
            // 计算交易金额
            const amountUsd = this.calculateTradeAmount(opportunity);
            // 如果金额为0，取消交易
            if (amountUsd <= 0) {
                logger_1.default.info('交易金额为0，取消交易', MODULE_NAME, {
                    token: opportunity.targetToken.symbol || opportunity.targetToken.mint.toString()
                });
                return {
                    success: false,
                    error: '交易金额为0',
                    timestamp: Date.now()
                };
            }
            // 准备交易参数
            // 就像准备捕捞装备和人员
            // TODO: 构建真实的交易参数
            // 执行交易
            // 就像执行实际的捕捞行动
            // TODO: 与交易执行器集成
            /*
            // 实际交易执行
            // 就像派出小船捕捞
            const txResult = await traderExecutor.executeTrade(
              opportunity,
              amountUsd
            );
            */
            // 模拟交易执行 (在实际集成前)
            // 就像模拟捕捞行动的结果
            const txResult = {
                success: Math.random() > 0.2, // 80%成功率
                signature: `0x${Math.random().toString(16).substring(2, 10)}`,
                txid: `0x${Math.random().toString(16).substring(2, 10)}`,
                tokenAmount: BigInt(Math.floor(Math.random() * 1000000)),
                baseTokenAmount: BigInt(Math.floor(Math.random() * 1000000)),
                price: 0.001, // 默认价格
                priceImpact: 0.01,
                fee: 0.001,
                timestamp: Date.now()
            };
            // 处理交易结果
            // 就像处理捕捞返回的结果
            const tradeResult = {
                success: txResult.success,
                signature: txResult.signature,
                txid: txResult.txid,
                tokenAmount: txResult.tokenAmount,
                baseTokenAmount: txResult.baseTokenAmount,
                price: txResult.price,
                priceImpact: txResult.priceImpact,
                fee: txResult.fee,
                timestamp: txResult.timestamp
            };
            // 记录交易结果
            // 就像记录捕捞成果
            if (txResult.success) {
                logger_1.default.info('交易成功', MODULE_NAME, {
                    token: opportunity.targetToken.symbol || opportunity.targetToken.mint.toString(),
                    amount: txResult.tokenAmount.toString(),
                    txid: txResult.txid
                });
                // TODO: 更新持仓管理
                // positionManager.addPosition(...)
            }
            else {
                logger_1.default.warn('交易失败', MODULE_NAME, {
                    token: opportunity.targetToken.symbol || opportunity.targetToken.mint.toString(),
                    txid: txResult.txid || 'unknown'
                });
            }
            // 记录交易结果用于风险调整
            this.recordTradeResult(tradeResult, opportunity.targetToken.mint.toBase58());
            // 发送交易执行事件
            // 就像向全船通报捕捞成果
            this.emitTradeEvent(tradeResult);
            return tradeResult;
        }
        catch (error) {
            // 处理异常
            // 就像处理捕捞过程中的意外状况
            logger_1.default.error('执行交易时出错', MODULE_NAME, {
                error: error instanceof Error ? error.message : String(error),
                pool: opportunityId,
                token: opportunity.targetToken.symbol || opportunity.targetToken.mint.toString()
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                timestamp: Date.now()
            };
        }
        finally {
            // 从待处理集合中移除
            // 就像取消"正在作业"标记
            this.pendingTrades.delete(opportunityId);
        }
    }
    /**
     * 启动价格检查
     * 开始定期监控持仓价格变化
     *
     * 【比喻解释】
     * 这就像渔船上设置定时查询鱼市价格的任务：
     * - 检查是否已经有人在负责查询价格（避免重复）
     * - 设置一个定时闹钟，按时查询最新价格（设置定时器）
     * - 确保每隔固定时间就更新一次价格信息（定期执行）
     * - 记录价格监控任务已经开始（日志记录）
     *
     * 【优化说明】
     * 添加价格缓存和批量处理机制，减少重复请求
     */
    startPriceChecking() {
        // 如果已经有定时器在运行，先停止它
        // 就像如果已经有人在查询价格，先让他停下
        if (this.priceCheckTimer) {
            this.stopPriceChecking();
        }
        // 设置定时器定期检查价格
        // 就像设置定时闹钟，按时查询价格
        this.priceCheckTimer = setInterval(() => {
            this.processPriceCheckQueue();
        }, this.priceCheckInterval);
        logger_1.default.debug(`已启动价格监控，间隔: ${this.priceCheckInterval}ms`, MODULE_NAME);
    }
    /**
     * 停止价格检查
     * 结束定期的价格监控任务
     *
     * 【比喻解释】
     * 这就像取消渔船上定时查询鱼价的任务：
     * - 检查是否有正在执行的查询任务（检查定时器）
     * - 通知负责查询的船员停止工作（清除定时器）
     * - 记录价格监控任务已经停止（日志记录）
     */
    stopPriceChecking() {
        // 如果存在定时器，清除它
        // 就像如果有人在定时查询，让他停下
        if (this.priceCheckTimer) {
            clearInterval(this.priceCheckTimer);
            this.priceCheckTimer = null;
            logger_1.default.debug('已停止价格监控', MODULE_NAME);
        }
    }
    /**
     * 检查持仓价格
     * 定期更新所有持仓的价格信息
     *
     * 【比喻解释】
     * 这就像渔船上定期查询所有已捕鱼类的最新市场价格：
     * - 先获取船上目前所有的渔获清单（获取持仓）
     * - 如果船上没有渔获，就不需要查询（空持仓检查）
     * - 对每种捕获的鱼类逐一查询最新价格（遍历持仓）
     * - 分别记录每种鱼的当前市场价值（更新价格）
     * - 如果查询过程中出现问题，记录但不影响其他查询（错误处理）
     *
     * 【优化说明】
     * 使用队列和批处理机制，减少重复请求
     */
    async checkPositionPrices() {
        try {
            // 获取当前所有持仓
            // 就像获取船上所有的渔获清单
            // TODO: 集成持仓管理器
            // const positions = positionManager.getOpenPositions();
            const positions = []; // 示例空数组，实际应从持仓管理器获取
            if (positions.length === 0) {
                // 没有持仓时跳过
                // 就像船上没有渔获时不需要查询价格
                return;
            }
            // 将持仓添加到价格检查队列
            for (const position of positions) {
                this.addToPriceCheckQueue(position.token.mint);
            }
            // 处理价格检查队列
            this.processPriceCheckQueue();
        }
        catch (error) {
            // 处理整体检查过程中的异常
            // 就像处理整个价格查询任务中的意外问题
            logger_1.default.error('检查持仓价格时出错', MODULE_NAME, {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    /**
     * 添加代币到价格检查队列
     *
     * 【比喻解释】
     * 就像将需要查询价格的鱼类加入待查询清单
     *
     * @param tokenMint 代币Mint地址
     * @param callback 价格更新后的回调函数
     */
    addToPriceCheckQueue(tokenMint, callback) {
        // 检查是否已在队列中
        const tokenKey = tokenMint.toBase58();
        const existingIndex = this.priceCheckQueue.findIndex(item => item.tokenMint.toBase58() === tokenKey);
        if (existingIndex >= 0) {
            // 如果已在队列中，更新回调函数
            if (callback) {
                this.priceCheckQueue[existingIndex].callback = callback;
            }
            return;
        }
        // 添加到队列
        this.priceCheckQueue.push({ tokenMint, callback });
    }
    /**
     * 处理价格检查队列
     *
     * 【比喻解释】
     * 就像批量处理待查询价格的鱼类清单
     *
     * 【优化说明】
     * 使用批处理和缓存机制，减少重复请求
     * 添加性能监控，优化批处理性能
     */
    async processPriceCheckQueue() {
        if (this.priceCheckQueue.length === 0 || this.isProcessingPriceQueue) {
            return;
        }
        // 记录处理开始时间，用于性能监控
        const startTime = Date.now();
        this.isProcessingPriceQueue = true;
        this.lastPriceCheckTime = startTime;
        try {
            // 获取要处理的代币数量
            const batchSize = Math.min(this.maxPriceCheckBatchSize, this.priceCheckQueue.length);
            const batch = this.priceCheckQueue.splice(0, batchSize);
            logger_1.default.debug(`开始处理价格检查批次，数量: ${batchSize}`, MODULE_NAME);
            // 预先检查缓存，减少网络请求
            const requestsNeeded = [];
            const now = Date.now();
            for (const item of batch) {
                const tokenKey = item.tokenMint.toBase58();
                const cachedPrice = this.priceCache.get(tokenKey);
                if (cachedPrice && (now - cachedPrice.timestamp) < this.priceCacheExpiry) {
                    // 使用缓存的价格
                    if (item.callback) {
                        item.callback(cachedPrice.price);
                    }
                }
                else {
                    // 需要请求最新价格
                    requestsNeeded.push(item);
                }
            }
            // 只对需要更新的代币发起请求
            if (requestsNeeded.length > 0) {
                await Promise.all(requestsNeeded.map(async ({ tokenMint, callback }) => {
                    try {
                        // 获取最新价格
                        const price = await this.getTokenPrice(tokenMint);
                        // 更新缓存
                        this.priceCache.set(tokenMint.toBase58(), { price, timestamp: now });
                        // 调用回调函数
                        if (callback) {
                            callback(price);
                        }
                    }
                    catch (error) {
                        logger_1.default.error('获取代币价格时出错', MODULE_NAME, {
                            error: error instanceof Error ? error.message : String(error),
                            token: tokenMint.toBase58()
                        });
                    }
                }));
            }
            // 清理过期缓存
            this.cleanupCache();
            // 记录性能指标
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            logger_1.default.debug('价格检查批次处理完成', MODULE_NAME, {
                batchSize,
                requestsNeeded: requestsNeeded.length,
                processingTime: `${processingTime}ms`,
                remainingInQueue: this.priceCheckQueue.length
            });
            // 如果处理时间过长，自动减小批处理大小
            if (processingTime > 500 && this.maxPriceCheckBatchSize > 3) {
                this.maxPriceCheckBatchSize--;
                logger_1.default.info(`价格检查批处理时间过长，减小批处理大小至 ${this.maxPriceCheckBatchSize}`, MODULE_NAME);
            }
            else if (processingTime < 100 && this.maxPriceCheckBatchSize < 20) {
                // 如果处理很快，可以适当增加批处理大小
                this.maxPriceCheckBatchSize++;
                logger_1.default.debug(`价格检查批处理性能良好，增加批处理大小至 ${this.maxPriceCheckBatchSize}`, MODULE_NAME);
            }
        }
        finally {
            this.isProcessingPriceQueue = false;
            // 如果队列中还有代币，设置定时器继续处理
            if (this.priceCheckQueue.length > 0) {
                setTimeout(() => this.processPriceCheckQueue(), this.priceCheckInterval);
            }
        }
    }
    /**
     * 清理缓存
     * 移除过期的价格缓存条目
     *
     * 【比喻解释】
     * 就像清理过期的鱼价记录，避免参考过时信息
     */
    cleanupCache() {
        const now = Date.now();
        let clearedEntries = 0;
        // 清理过期的价格缓存
        for (const [key, value] of this.priceCache.entries()) {
            if ((now - value.timestamp) > this.priceCacheExpiry) {
                this.priceCache.delete(key);
                clearedEntries++;
            }
        }
        // 如果缓存过大，即使未过期也清理一些
        if (this.priceCache.size > 1000) {
            // 转换为数组并按时间戳排序
            const entries = Array.from(this.priceCache.entries())
                .sort((a, b) => a[1].timestamp - b[1].timestamp);
            // 移除最旧的25%条目
            const entriesToRemove = Math.floor(entries.length * 0.25);
            for (let i = 0; i < entriesToRemove; i++) {
                this.priceCache.delete(entries[i][0]);
                clearedEntries++;
            }
        }
        if (clearedEntries > 0) {
            logger_1.default.debug(`清理了${clearedEntries}个过期缓存条目`, MODULE_NAME);
        }
    }
    /**
     * 获取代币价格
     *
     * 【比喻解释】
     * 就像查询某种鱼的最新市场价格
     *
     * @param tokenMint 代币Mint地址
     * @returns 代币价格
     */
    async getTokenPrice(tokenMint) {
        // TODO: 实现实际价格查询
        // 这里使用模拟价格，实际应该查询价格服务
        return this.simulatePrice({ token: { mint: tokenMint } });
    }
    /**
     * 检查单个持仓价格
     * 更新特定持仓的当前价格信息
     *
     * 【比喻解释】
     * 这就像查询船上某一种特定鱼类的最新市场价格：
     * - 找到这种鱼最初在哪片海域捕获的（查找原始池子）
     * - 查询当前市场对这种鱼的最新估价（获取价格）
     * - 计算这批鱼的总价值变化（计算收益）
     * - 根据价格变化决定是否需要卖出（检查止盈止损）
     * - 更新渔获清单上这种鱼的最新信息（更新持仓）
     * - 向船长通报这种鱼的价格变动情况（发送事件）
     *
     * 【优化说明】
     * 使用队列和回调机制，减少重复请求
     */
    async checkPositionPrice(position) {
        // 查找该代币的原始池子
        // 就像找到这种鱼最初捕获的海域
        const poolInfo = this.findPoolForToken(position.token.mint);
        if (!poolInfo) {
            logger_1.default.warn('无法找到持仓对应的池子', MODULE_NAME, {
                token: position.token.symbol || position.token.mint.toString()
            });
            return;
        }
        try {
            // 添加到价格检查队列，并设置回调函数
            this.addToPriceCheckQueue(position.token.mint, async (price) => {
                // 计算价值变化
                // 就像计算这批鱼的价值变化
                const currentPrice = position.currentPrice || 0;
                const oldValueUsd = currentPrice * Number(position.amount);
                const newValueUsd = price * Number(position.amount);
                const changePercent = ((newValueUsd - oldValueUsd) / oldValueUsd) * 100;
                // 更新持仓价格
                // 就像更新渔获清单上的价格信息
                // TODO: 集成持仓管理器
                // position.currentPrice = price;
                // position.lastUpdated = Date.now();
                // positionManager.updatePosition(position);
                // 触发价格更新事件
                // 就像向船长通报价格变动
                this.emitPriceUpdated(position.token.mint, price);
                // 触发持仓更新事件
                // 就像更新渔获清单
                this.emitPositionEvent(position);
                // 记录价格更新
                // 就像在日志中记录价格变动
                logger_1.default.debug('更新持仓价格', MODULE_NAME, {
                    token: position.token.symbol || position.token.mint.toString(),
                    price,
                    change: `${changePercent.toFixed(2)}%`
                });
                // 检查止盈止损条件
                // 就像检查是否达到预设的卖出条件
                // TODO: 实现止盈止损逻辑
                if (changePercent >= 20) {
                    // 达到止盈条件
                    // 就像鱼价上涨达到预定卖出点
                    logger_1.default.info('持仓达到止盈条件', MODULE_NAME, {
                        token: position.token.symbol || position.token.mint.toString(),
                        profit: `${changePercent.toFixed(2)}%`
                    });
                    // TODO: 执行卖出操作
                }
                else if (changePercent <= -10) {
                    // 达到止损条件
                    // 就像鱼价下跌到止损点
                    logger_1.default.info('持仓达到止损条件', MODULE_NAME, {
                        token: position.token.symbol || position.token.mint.toString(),
                        loss: `${changePercent.toFixed(2)}%`
                    });
                    // TODO: 执行卖出操作
                }
            });
        }
        catch (error) {
            // 处理价格更新过程中的异常
            // 就像处理价格查询过程中的意外情况
            logger_1.default.error('更新持仓价格时出错', MODULE_NAME, {
                error: error instanceof Error ? error.message : String(error),
                token: position.token.symbol || position.token.mint.toString()
            });
            throw error;
        }
    }
    /**
     * 模拟获取代币价格
     * @param position 持仓
     * @returns 模拟的当前价格
     */
    simulatePrice(position) {
        // 这是一个示例实现，实际应该查询实时价格
        // 生成-10%到+20%的随机波动
        const volatility = -0.1 + Math.random() * 0.3;
        const basePrice = position.avgBuyPrice || 0.001;
        return basePrice * (1 + volatility);
    }
    /**
     * 查找代币对应的池子
     * @param tokenMint 代币Mint地址
     * @returns 池子信息
     */
    findPoolForToken(tokenMint) {
        // 示例实现，实际应该查询已知池子
        // 这里创建一个假的池子信息
        return {
            address: new web3_js_1.PublicKey('11111111111111111111111111111111'),
            dex: types_1.DexType.RAYDIUM,
            tokenAMint: new web3_js_1.PublicKey('11111111111111111111111111111111'),
            tokenBMint: new web3_js_1.PublicKey('11111111111111111111111111111111'),
            createdAt: Date.now(),
            firstDetectedAt: Date.now()
        };
    }
    /**
     * 获取指定符号的基础代币
     * @param symbol 代币符号
     * @returns 代币信息
     */
    getBaseTokenForSymbol(symbol) {
        // 示例实现，实际应该查询已知代币
        if (symbol === 'SOL') {
            return {
                mint: new web3_js_1.PublicKey('So11111111111111111111111111111111111111112'),
                symbol: 'SOL',
                name: 'Solana',
                decimals: 9
            };
        }
        if (symbol === 'USDC') {
            return {
                mint: new web3_js_1.PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
                symbol: 'USDC',
                name: 'USD Coin',
                decimals: 6
            };
        }
        // 默认返回SOL
        return {
            mint: new web3_js_1.PublicKey('So11111111111111111111111111111111111111112'),
            symbol: 'SOL',
            name: 'Solana',
            decimals: 9
        };
    }
    // ---- 事件发射方法 ----
    /**
     * 发送交易机会事件
     */
    emitOpportunityEvent(opportunity) {
        const event = {
            type: "opportunity_detected" /* EventType.OPPORTUNITY_DETECTED */,
            data: opportunity,
            timestamp: Date.now()
        };
        this.emit("opportunity_detected" /* EventType.OPPORTUNITY_DETECTED */, event);
    }
    /**
     * 发送交易执行事件
     */
    emitTradeEvent(tradeResult) {
        const event = {
            type: "trade_executed" /* EventType.TRADE_EXECUTED */,
            data: tradeResult,
            timestamp: Date.now()
        };
        this.emit("trade_executed" /* EventType.TRADE_EXECUTED */, event);
    }
    /**
     * 发送仓位更新事件
     */
    emitPositionEvent(position) {
        const event = {
            type: "position_updated" /* EventType.POSITION_UPDATED */,
            data: position,
            timestamp: Date.now()
        };
        this.emit("position_updated" /* EventType.POSITION_UPDATED */, event);
    }
    /**
     * 发送错误事件
     */
    emitErrorEvent(error) {
        const event = {
            type: "error_occurred" /* EventType.ERROR_OCCURRED */,
            data: error,
            timestamp: Date.now()
        };
        this.emit("error_occurred" /* EventType.ERROR_OCCURRED */, event);
    }
    /**
     * 发出价格更新事件
     * @param tokenMint 代币Mint地址
     * @param price 价格
     */
    emitPriceUpdated(tokenMint, price) {
        const event = {
            type: "price_updated" /* EventType.PRICE_UPDATED */,
            data: {
                mint: tokenMint,
                price,
                timestamp: Date.now()
            },
            timestamp: Date.now()
        };
        // 发出事件
        this.emit('priceUpdated', tokenMint, price);
        this.emit('event', event);
    }
    /**
     * 启动风险调整
     * 定期调整风险参数
     *
     * 【比喻解释】
     * 就像定期评估渔场的风险状况，调整捕捞策略
     */
    startRiskAdjustment() {
        // 如果已经有定时器在运行，先停止它
        if (this.riskAdjustmentTimer) {
            this.stopRiskAdjustment();
        }
        // 设置定时器定期调整风险
        this.riskAdjustmentTimer = setInterval(() => {
            this.adjustRiskLevels();
        }, this.riskAdjustmentInterval);
        logger_1.default.debug(`已启动风险调整，间隔: ${this.riskAdjustmentInterval}ms`, MODULE_NAME);
    }
    /**
     * 停止风险调整
     * 结束定期的风险调整任务
     *
     * 【比喻解释】
     * 就像停止定期评估渔场风险的任务
     */
    stopRiskAdjustment() {
        // 如果存在定时器，清除它
        if (this.riskAdjustmentTimer) {
            clearInterval(this.riskAdjustmentTimer);
            this.riskAdjustmentTimer = null;
            logger_1.default.debug('已停止风险调整', MODULE_NAME);
        }
    }
    /**
     * 调整风险等级
     * 根据最近的交易结果调整风险参数
     *
     * 【比喻解释】
     * 就像根据最近的捕捞结果调整捕捞策略
     *
     * 【优化说明】
     * 动态调整风险参数，提高系统适应性
     */
    adjustRiskLevels() {
        try {
            // 计算整体成功率
            const recentTrades = this.recentTradeResults.slice(-this.maxRecentTrades);
            if (recentTrades.length === 0) {
                return;
            }
            const successCount = recentTrades.filter(trade => trade.success).length;
            const successRate = successCount / recentTrades.length;
            // 根据成功率调整风险参数
            if (successRate > 0.8) {
                // 成功率高于80%，可以适当提高风险
                this.maxRiskPerToken = Math.min(0.15, this.maxRiskPerToken + 0.01);
                this.maxTotalRisk = Math.min(0.4, this.maxTotalRisk + 0.02);
                logger_1.default.info('提高风险参数', MODULE_NAME, {
                    successRate: `${(successRate * 100).toFixed(2)}%`,
                    maxRiskPerToken: this.maxRiskPerToken,
                    maxTotalRisk: this.maxTotalRisk
                });
            }
            else if (successRate < 0.5) {
                // 成功率低于50%，降低风险
                this.maxRiskPerToken = Math.max(0.05, this.maxRiskPerToken - 0.01);
                this.maxTotalRisk = Math.max(0.2, this.maxTotalRisk - 0.02);
                logger_1.default.info('降低风险参数', MODULE_NAME, {
                    successRate: `${(successRate * 100).toFixed(2)}%`,
                    maxRiskPerToken: this.maxRiskPerToken,
                    maxTotalRisk: this.maxTotalRisk
                });
            }
            // 调整每个代币的风险等级
            for (const [tokenMint, riskLevel] of this.riskLevels.entries()) {
                // 获取该代币最近的交易结果
                const tokenTrades = recentTrades.filter(trade => trade.tokenMint === tokenMint);
                if (tokenTrades.length === 0) {
                    continue;
                }
                const tokenSuccessCount = tokenTrades.filter(trade => trade.success).length;
                const tokenSuccessRate = tokenSuccessCount / tokenTrades.length;
                // 根据代币的成功率调整风险等级
                if (tokenSuccessRate > 0.8) {
                    // 代币成功率高于80%，提高风险等级
                    this.riskLevels.set(tokenMint, Math.min(this.maxRiskPerToken, riskLevel + 0.01));
                }
                else if (tokenSuccessRate < 0.5) {
                    // 代币成功率低于50%，降低风险等级
                    this.riskLevels.set(tokenMint, Math.max(0.01, riskLevel - 0.01));
                }
            }
            logger_1.default.debug('风险参数已调整', MODULE_NAME, {
                successRate: `${(successRate * 100).toFixed(2)}%`,
                maxRiskPerToken: this.maxRiskPerToken,
                maxTotalRisk: this.maxTotalRisk
            });
        }
        catch (error) {
            logger_1.default.error('调整风险等级时出错', MODULE_NAME, {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    /**
     * 记录交易结果
     * 用于风险调整
     *
     * 【比喻解释】
     * 就像记录每次捕捞的结果，用于评估捕捞策略
     *
     * @param tradeResult 交易结果
     * @param tokenMint 代币Mint地址
     */
    recordTradeResult(tradeResult, tokenMint) {
        // 添加到最近交易结果
        this.recentTradeResults.push({
            success: tradeResult.success,
            timestamp: Date.now(),
            tokenMint
        });
        // 如果超过最大数量，移除最旧的
        if (this.recentTradeResults.length > this.maxRecentTrades) {
            this.recentTradeResults.shift();
        }
    }
    /**
     * 计算交易金额
     * 根据风险参数计算交易金额
     *
     * 【比喻解释】
     * 就像根据风险评估决定投入多少资源进行捕捞
     *
     * @param opportunity 交易机会
     * @returns 交易金额
     */
    calculateTradeAmount(opportunity) {
        try {
            // 获取代币风险等级
            const tokenMint = opportunity.targetToken.mint.toBase58();
            const riskLevel = this.riskLevels.get(tokenMint) || 0.05; // 默认风险等级5%
            // 如果是新代币，设置初始风险等级
            if (!this.riskLevels.has(tokenMint)) {
                this.riskLevels.set(tokenMint, riskLevel);
            }
            // 获取可用资金
            const availableFunds = this.getAvailableFunds();
            // 计算该代币已分配资金
            const allocatedFunds = this.getTokenAllocatedFunds(tokenMint);
            // 计算最大可分配资金
            const maxAllocation = availableFunds * this.maxAllocationPerToken;
            // 如果已分配资金超过最大可分配资金，返回0
            if (allocatedFunds >= maxAllocation) {
                logger_1.default.info('代币已分配资金达到上限', MODULE_NAME, {
                    token: opportunity.tokenSymbol,
                    allocatedFunds,
                    maxAllocation
                });
                return 0;
            }
            // 计算可分配资金
            const remainingAllocation = maxAllocation - allocatedFunds;
            // 根据风险等级计算交易金额
            const tradeAmount = Math.min(remainingAllocation, availableFunds * riskLevel);
            logger_1.default.debug('计算交易金额', MODULE_NAME, {
                token: opportunity.tokenSymbol,
                riskLevel,
                availableFunds,
                allocatedFunds,
                maxAllocation,
                tradeAmount
            });
            return tradeAmount;
        }
        catch (error) {
            logger_1.default.error('计算交易金额时出错', MODULE_NAME, {
                error: error instanceof Error ? error.message : String(error),
                token: opportunity.tokenSymbol
            });
            return 0;
        }
    }
    /**
     * 获取可用资金
     *
     * 【比喻解释】
     * 就像查询船上可用于捕捞的资金
     *
     * @returns 可用资金
     */
    getAvailableFunds() {
        // TODO: 实现实际资金查询
        // 这里使用模拟资金，实际应该查询钱包余额
        return 1000; // 假设有1000美元可用
    }
    /**
     * 获取代币已分配资金
     *
     * 【比喻解释】
     * 就像查询已分配给某种鱼类的捕捞资金
     *
     * @param tokenMint 代币Mint地址
     * @returns 已分配资金
     */
    getTokenAllocatedFunds(tokenMint) {
        // TODO: 实现实际资金查询
        // 这里使用模拟数据，实际应该查询持仓价值
        return 0; // 假设没有已分配资金
    }
    /**
     * 系统自恢复
     * 当系统检测到异常状态时尝试自动恢复
     *
     * 【比喻解释】
     * 就像船长发现渔船某部分设备故障时的自动修复程序
     *
     * 【优化说明】
     * 添加内存使用监控和资源释放
     */
    async attemptRecovery() {
        logger_1.default.info('尝试系统自恢复...', MODULE_NAME);
        try {
            // 检查系统各部分状态
            let recoveryNeeded = false;
            // 检查价格检查定时器
            if (this.priceCheckTimer === null && this.isRunning) {
                logger_1.default.warn('价格检查定时器丢失，正在重新启动', MODULE_NAME);
                this.startPriceChecking();
                recoveryNeeded = true;
            }
            // 检查风险调整定时器
            if (this.riskAdjustmentTimer === null && this.isRunning) {
                logger_1.default.warn('风险调整定时器丢失，正在重新启动', MODULE_NAME);
                this.startRiskAdjustment();
                recoveryNeeded = true;
            }
            // 检查卡住的执行状态
            if (this.isExecuting && Date.now() - this.lastBatchProcessTime > 60000) {
                logger_1.default.warn('执行状态卡住，正在重置', MODULE_NAME);
                this.isExecuting = false;
                recoveryNeeded = true;
            }
            // 检查卡住的价格队列处理
            if (this.isProcessingPriceQueue && Date.now() - this.lastPriceCheckTime > 60000) {
                logger_1.default.warn('价格队列处理卡住，正在重置', MODULE_NAME);
                this.isProcessingPriceQueue = false;
                recoveryNeeded = true;
            }
            // 检查待处理交易是否超时
            const pendingTradeTimeout = 300000; // 5分钟超时
            const now = Date.now();
            let expiredTrades = 0;
            for (const poolId of this.pendingTrades) {
                const opportunity = this.activeOpportunities.get(poolId);
                if (opportunity && now - opportunity.timestamp > pendingTradeTimeout) {
                    this.pendingTrades.delete(poolId);
                    expiredTrades++;
                }
            }
            if (expiredTrades > 0) {
                logger_1.default.warn(`清理了${expiredTrades}个超时的待处理交易`, MODULE_NAME);
                recoveryNeeded = true;
            }
            // 检查缓存是否过大，执行额外清理
            if (this.priceCache.size > 2000) {
                logger_1.default.warn('价格缓存过大，执行额外清理', MODULE_NAME);
                // 仅保留20%最新的数据
                this.forceCleanupCache(0.2);
                recoveryNeeded = true;
            }
            // 检查机会队列是否异常增长
            if (this.opportunityQueue.length > this.maxQueueSize * 0.9) {
                logger_1.default.warn('机会队列异常增长，执行强制清理', MODULE_NAME);
                // 仅保留最高优先级的10%
                this.opportunityQueue.sort((a, b) => b.priority - a.priority);
                this.opportunityQueue = this.opportunityQueue.slice(0, Math.max(1, Math.floor(this.maxQueueSize * 0.1)));
                recoveryNeeded = true;
            }
            // 如果执行了恢复操作
            if (recoveryNeeded) {
                logger_1.default.info('系统自恢复完成', MODULE_NAME);
                return true;
            }
            logger_1.default.debug('系统状态正常，无需恢复', MODULE_NAME);
            return false;
        }
        catch (error) {
            logger_1.default.error('系统自恢复失败', MODULE_NAME, {
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    /**
     * 强制清理缓存
     * 仅保留指定比例的最新数据
     *
     * 【比喻解释】
     * 就像在船舱空间不足时，只保留最新鲜的鱼，扔掉其他所有渔获
     *
     * @param keepRatio 保留的比例（0-1）
     */
    forceCleanupCache(keepRatio) {
        if (this.priceCache.size === 0) {
            return;
        }
        const entries = Array.from(this.priceCache.entries())
            .sort((a, b) => b[1].timestamp - a[1].timestamp); // 按时间戳降序排序
        // 计算要保留的条目数
        const keepCount = Math.max(1, Math.floor(entries.length * keepRatio));
        // 创建新缓存，只保留需要的部分
        const newCache = new Map();
        for (let i = 0; i < keepCount; i++) {
            newCache.set(entries[i][0], entries[i][1]);
        }
        // 替换原缓存
        this.priceCache = newCache;
        logger_1.default.info(`强制缓存清理完成，从 ${entries.length} 条减至 ${this.priceCache.size} 条`, MODULE_NAME);
    }
    /**
     * 启动系统监控
     * 定期检查系统状态并尝试自动恢复
     *
     * 【比喻解释】
     * 就像船上的自动化维护系统，定期检查各设备状态
     */
    startSystemMonitoring() {
        // 每5分钟执行一次系统自检和恢复
        setInterval(() => {
            this.attemptRecovery().catch(error => {
                logger_1.default.error('执行系统监控时出错', MODULE_NAME, {
                    error: error instanceof Error ? error.message : String(error)
                });
            });
        }, 300000); // 5分钟
        logger_1.default.info('系统监控已启动', MODULE_NAME);
    }
}
exports.TraderModule = TraderModule;
// 导出单例实例
const traderModule = new TraderModule();
exports.default = traderModule;
