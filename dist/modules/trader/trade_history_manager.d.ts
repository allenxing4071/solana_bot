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
/**
 * 交易记录接口
 * 定义交易记录的数据结构
 */
export interface Trade {
    id: string;
    timestamp: number;
    type: 'buy' | 'sell';
    tokenSymbol?: string;
    tokenAddress: string;
    amount: number;
    price: number;
    value: number;
    txid?: string;
    status: 'pending' | 'completed' | 'failed';
    dex?: string;
    profit?: number;
    fee?: number;
    notes?: string;
}
/**
 * 交易历史管理器类
 * 管理系统的交易历史记录
 */
export declare class TradeHistoryManager {
    private trades;
    private readonly dataPath;
    private isLoaded;
    /**
     * 构造函数
     * @param dataPath 数据存储路径
     */
    constructor(dataPath?: string);
    /**
     * 加载交易历史
     * 从文件系统加载保存的交易记录
     */
    private loadTrades;
    /**
     * 保存交易历史
     * 将当前的交易记录保存到文件系统
     */
    private saveTrades;
    /**
     * 添加交易记录
     * @param trade 交易记录对象
     */
    addTrade(trade: Trade): Promise<void>;
    /**
     * 更新交易记录
     * @param tradeId 交易ID
     * @param updates 要更新的字段
     */
    updateTrade(tradeId: string, updates: Partial<Trade>): Promise<boolean>;
    /**
     * 获取所有交易记录
     * @returns 所有交易记录数组
     */
    getAllTrades(): Promise<Trade[]>;
    /**
     * 获取指定代币的交易记录
     * @param tokenAddress 代币地址
     * @returns 该代币的交易记录数组
     */
    getTradesByToken(tokenAddress: string): Promise<Trade[]>;
    /**
     * 获取指定类型的交易记录
     * @param type 交易类型
     * @returns 指定类型的交易记录数组
     */
    getTradesByType(type: 'buy' | 'sell'): Promise<Trade[]>;
    /**
     * 获取指定时间范围内的交易记录
     * @param startTime 开始时间戳
     * @param endTime 结束时间戳
     * @returns 时间范围内的交易记录数组
     */
    getTradesByTimeRange(startTime: number, endTime: number): Promise<Trade[]>;
    /**
     * 获取交易统计信息
     * @returns 交易统计数据
     */
    getTradeStats(): Promise<{
        totalTrades: number;
        buyTrades: number;
        sellTrades: number;
        successfulTrades: number;
        failedTrades: number;
        pendingTrades: number;
        totalProfit: number;
        totalFees: number;
    }>;
}
