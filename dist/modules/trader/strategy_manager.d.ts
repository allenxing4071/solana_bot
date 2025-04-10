/**
 * 交易策略管理器
 * 负责管理交易策略，决定何时买入和卖出，跟踪持仓状态
 */
import type { PublicKey } from '@solana/web3.js';
import { StrategyType } from '../../core/types';
import type { Position, TradingOpportunity, TradeResult, TokenInfo } from '../../core/types';
/**
 * 持仓管理接口
 */
interface PositionManager {
    addPosition(token: TokenInfo, amount: bigint, buyPrice: number, txInfo: TradeResult): Position;
    getPosition(mintAddress: string | PublicKey): Position | null;
    updatePosition(position: Position): void;
    removePosition(mintAddress: string | PublicKey): boolean;
    getAllPositions(): Position[];
}
/**
 * 出售决策结果接口
 */
interface SellDecision {
    shouldSell: boolean;
    reason?: string;
    triggerType?: StrategyType;
    position?: Position;
    sellPrice?: number;
    profit?: number;
    profitPercentage?: number;
}
/**
 * 交易策略管理器类
 * 负责管理交易策略和持仓状态
 */
export declare class StrategyManager implements PositionManager {
    private positions;
    private sellConditions;
    private priceHistory;
    private highestPrices;
    /**
     * 构造函数
     */
    constructor();
    /**
     * 从配置中加载策略
     */
    private loadStrategies;
    /**
     * 是否应该买入
     * @param opportunity 交易机会
     * @returns 是否应该买入
     */
    shouldBuy(opportunity: TradingOpportunity): boolean;
    /**
     * 处理买入交易结果
     * @param tradeResult 交易结果
     * @param opportunity 交易机会
     * @returns 新建的持仓或null
     */
    handleBuyResult(tradeResult: TradeResult, opportunity: TradingOpportunity): Position | null;
    /**
     * 检查是否应该卖出代币
     * @param mint 代币Mint地址
     * @param currentPrice 当前价格
     * @returns 卖出决策结果
     */
    shouldSell(mint: string | PublicKey, currentPrice: number): SellDecision;
    /**
     * 处理卖出交易结果
     * @param tradeResult 交易结果
     * @param position 持仓
     * @returns 是否成功处理
     */
    handleSellResult(tradeResult: TradeResult, position: Position): boolean;
    /**
     * 检查止盈条件
     * @param position 持仓
     * @param condition 策略条件
     * @returns 是否满足条件
     */
    private checkTakeProfit;
    /**
     * 检查止损条件
     * @param position 持仓
     * @param condition 策略条件
     * @returns 是否满足条件
     */
    private checkStopLoss;
    /**
     * 检查追踪止损条件
     * @param position 持仓
     * @param condition 策略条件
     * @param mintString 代币Mint地址
     * @returns 是否满足条件
     */
    private checkTrailingStop;
    /**
     * 检查时间限制条件
     * @param position 持仓
     * @param condition 策略条件
     * @returns 是否满足条件
     */
    private checkTimeLimit;
    /**
     * 更新最高价格记录
     * @param mintString 代币Mint地址
     * @param currentPrice 当前价格
     */
    private updateHighestPrice;
    /**
     * 记录价格更新
     * @param update 价格更新数据
     */
    private recordPriceUpdate;
    /**
     * 计算利润
     * @param position 持仓
     * @param currentPrice 当前价格
     * @returns 利润信息
     */
    private calculateProfit;
    /**
     * 添加新持仓
     * @param token 代币信息
     * @param amount 数量
     * @param buyPrice 买入价格
     * @param txInfo 交易信息
     * @returns 新持仓
     */
    addPosition(token: TokenInfo, amount: bigint, buyPrice: number, txInfo: TradeResult): Position;
    /**
     * 获取持仓
     * @param mintAddress 代币Mint地址
     * @returns 持仓或null
     */
    getPosition(mintAddress: string | PublicKey): Position | null;
    /**
     * 更新持仓
     * @param position 持仓
     */
    updatePosition(position: Position): void;
    /**
     * 移除持仓
     * @param mintAddress 代币Mint地址
     * @returns 是否成功移除
     */
    removePosition(mintAddress: string | PublicKey): boolean;
    /**
     * 获取所有持仓
     * @returns 持仓列表
     */
    getAllPositions(): Position[];
}
declare const strategyManager: StrategyManager;
export default strategyManager;
