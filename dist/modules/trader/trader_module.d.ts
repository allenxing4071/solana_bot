/**
 * 交易模块
 * 整合机会检测、交易执行和策略管理，作为交易系统的主入口
 */
import { EventEmitter } from 'events';
import { PoolInfo } from '../../core/types';
/**
 * 交易模块类
 * 处理交易相关的核心业务逻辑
 */
export declare class TraderModule extends EventEmitter {
    private isEnabled;
    private isInitialized;
    private activeOpportunities;
    private pendingTrades;
    private priceCheckTimer;
    private priceCheckInterval;
    /**
     * 构造函数
     */
    constructor();
    /**
     * 初始化交易模块
     */
    initialize(): Promise<void>;
    /**
     * 启动交易模块
     * @param enableExecution 是否启用交易执行
     */
    start(enableExecution?: boolean): Promise<void>;
    /**
     * 停止交易模块
     */
    stop(): Promise<void>;
    /**
     * 处理新的池子事件
     * @param poolInfo 池子信息
     */
    handleNewPool(poolInfo: PoolInfo): Promise<void>;
    /**
     * 执行交易
     * @param opportunity 交易机会
     * @returns 交易结果
     */
    private executeTrade;
    /**
     * 启动价格检查定时器
     */
    private startPriceChecking;
    /**
     * 停止价格检查定时器
     */
    private stopPriceChecking;
    /**
     * 检查所有持仓的价格
     */
    private checkPositionPrices;
    /**
     * 检查单个持仓的价格
     * @param position 持仓
     */
    private checkPositionPrice;
    /**
     * 模拟获取代币价格
     * @param position 持仓
     * @returns 模拟的当前价格
     */
    private simulatePrice;
    /**
     * 查找代币对应的池子
     * @param tokenMint 代币Mint地址
     * @returns 池子信息
     */
    private findPoolForToken;
    /**
     * 获取指定符号的基础代币
     * @param symbol 代币符号
     * @returns 代币信息
     */
    private getBaseTokenForSymbol;
    /**
     * 发出交易执行事件
     * @param tradeResult 交易结果
     * @param opportunity 交易机会
     */
    private emitTradeExecuted;
    /**
     * 发出价格更新事件
     * @param tokenMint 代币Mint地址
     * @param price 价格
     */
    private emitPriceUpdated;
    /**
     * 发出持仓更新事件
     * @param position 持仓
     */
    private emitPositionUpdated;
}
declare const traderModule: TraderModule;
export default traderModule;
