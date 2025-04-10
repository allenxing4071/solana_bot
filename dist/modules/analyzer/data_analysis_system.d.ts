/**
 * 数据分析与报告系统
 * 负责收集交易数据，生成分析报告，提供决策支持
 */
import { EventEmitter } from 'events';
import { TokenInfo } from '../../core/types';
/**
 * 交易数据记录接口
 */
export interface TradeRecord {
    id: string;
    tokenMint: string;
    tokenSymbol: string;
    tokenName: string;
    buyTimestamp: number;
    buyPrice: number;
    buyAmount: number;
    buyCost: number;
    sellTimestamp?: number;
    sellPrice?: number;
    sellAmount?: number;
    sellProceeds?: number;
    profit?: number;
    profitPercentage?: number;
    holdingTime?: number;
    status: 'open' | 'closed';
    executionLatency: number;
    strategy: string;
    reason: string;
    notes: string[];
}
/**
 * 代币绩效接口
 */
export interface TokenPerformance {
    mint: string;
    symbol: string;
    name: string;
    trades: number;
    successTrades: number;
    avgProfit: number;
    totalProfit: number;
    avgHoldingTime: number;
    lastTrade: number;
}
/**
 * 市场趋势分析接口
 */
export interface MarketTrend {
    period: string;
    startTime: number;
    endTime: number;
    topPerformers: TokenPerformance[];
    totalTrades: number;
    successRate: number;
    avgProfit: number;
    profitTrend: number[];
    tradeVolume: number[];
    volatility: number;
    signals: {
        bullish: boolean;
        bearish: boolean;
        sideways: boolean;
        volatility: 'high' | 'normal' | 'low';
    };
    opportunities: string[];
}
/**
 * 策略性能评估接口
 */
export interface StrategyEvaluation {
    strategyId: string;
    name: string;
    trades: number;
    successRate: number;
    avgProfit: number;
    avgHoldingTime: number;
    riskReturnRatio: number;
    goodFor: string[];
    weaknesses: string[];
    improvement: string[];
}
/**
 * 分析报告接口
 */
export interface AnalysisReport {
    generatedAt: number;
    period: {
        start: number;
        end: number;
        days: number;
    };
    overview: {
        totalTrades: number;
        successfulTrades: number;
        failedTrades: number;
        successRate: number;
        totalProfit: number;
        avgDailyProfit: number;
        bestTrade: {
            profit: number;
            token: string;
        };
        worstTrade: {
            profit: number;
            token: string;
        };
    };
    performance: {
        daily: {
            date: string;
            profit: number;
            trades: number;
        }[];
        byToken: TokenPerformance[];
        byStrategy: StrategyEvaluation[];
    };
    marketAnalysis: MarketTrend;
    recommendations: {
        tradingRecommendations: string[];
        strategyRecommendations: string[];
        riskManagementRecommendations: string[];
    };
}
/**
 * 数据分析系统配置接口
 */
export interface DataAnalysisConfig {
    recordRetentionDays: number;
    autoAnalysisInterval: number;
    minTradesForAnalysis: number;
    reportGenerationTime: string;
    persistData: boolean;
    detailedReporting: boolean;
}
/**
 * 数据分析与报告系统类
 */
export declare class DataAnalysisSystem extends EventEmitter {
    private config;
    private tradeRecords;
    private tokenPerformance;
    private strategyEvaluations;
    private latestMarketTrend;
    private latestReport;
    private analysisTimer;
    /**
     * 构造函数
     * @param config 配置参数
     */
    constructor(config?: Partial<DataAnalysisConfig>);
    /**
     * 启动分析系统
     */
    start(): void;
    /**
     * 停止分析系统
     */
    stop(): void;
    /**
     * 加载历史数据
     */
    private loadData;
    /**
     * 保存数据到文件
     */
    private saveData;
    /**
     * 清理过期数据
     */
    private cleanupOldData;
    /**
     * 重建性能数据
     */
    private rebuildPerformanceData;
    /**
     * 记录买入交易
     */
    recordBuy(token: TokenInfo, amount: number, price: number, cost: number, strategy: string, latency: number, reason: string): string;
    /**
     * 记录卖出交易
     */
    recordSell(tradeId: string, price: number, amount: number, proceeds: number): boolean;
    /**
     * 添加交易笔记
     */
    addTradeNote(tradeId: string, note: string): boolean;
    /**
     * 更新代币绩效数据
     */
    private updateTokenPerformance;
    /**
     * 更新策略评估数据
     */
    private updateStrategyEvaluation;
    /**
     * 执行周期性分析
     */
    private runPeriodicAnalysis;
    /**
     * 分析市场趋势
     * 分析最近交易数据，识别市场模式和趋势
     */
    private analyzeMarketTrend;
    /**
     * 计算趋势斜率
     * 使用简单线性回归计算斜率
     * @param data 数据点数组
     * @returns 趋势斜率
     */
    private calculateTrendSlope;
    /**
     * 生成分析报告
     */
    private generateReport;
    /**
     * 保存报告到文件
     */
    private saveReport;
    /**
     * 获取最新分析报告
     */
    getLatestReport(): AnalysisReport | null;
    /**
     * 获取代币绩效数据
     */
    getTokenPerformance(mintAddress?: string): TokenPerformance[] | TokenPerformance | null;
    /**
     * 获取策略评估数据
     */
    getStrategyEvaluation(strategyId?: string): StrategyEvaluation[] | StrategyEvaluation | null;
    /**
     * 获取市场趋势分析
     */
    getMarketTrend(): MarketTrend | null;
    /**
     * 获取交易记录
     */
    getTradeRecords(status?: 'open' | 'closed', startTime?: number, endTime?: number): TradeRecord[];
    /**
     * 获取交易统计数据
     */
    getTradeStatistics(): {
        total: number;
        open: number;
        closed: number;
        successful: number;
        failed: number;
        totalProfit: number;
        successRate: number;
        avgProfit: number;
    };
}
declare const dataAnalysisSystem: DataAnalysisSystem;
export default dataAnalysisSystem;
