/**
 * 机会检测器
 * 负责分析新池子，评估交易机会，计算价格和滑点
 */
import { PoolInfo, TradingOpportunity } from '../../core/types';
/**
 * 机会检测器类
 * 负责检测并分析交易机会
 */
export declare class OpportunityDetector {
    private baseTokens;
    private minLiquidityUsd;
    private maxInitialPriceUsd;
    /**
     * 构造函数
     */
    constructor();
    /**
     * 初始化基础代币列表
     */
    private initializeBaseTokens;
    /**
     * 分析新池子并检测交易机会
     * @param poolInfo 池子信息
     * @returns 交易机会或null(如果没有有效机会)
     */
    detectOpportunity(poolInfo: PoolInfo): Promise<TradingOpportunity | null>;
    /**
     * 识别目标代币和基础代币
     * @param poolInfo 池子信息
     * @returns [目标代币, 基础代币] 或 [null, null]
     */
    private identifyTokens;
    /**
     * 判断是否为基础代币
     * @param mint 代币Mint地址
     * @returns 是否为基础代币
     */
    private isBaseToken;
    /**
     * 获取基础代币信息
     * @param mint 代币Mint地址
     * @returns 基础代币信息或null
     */
    private getBaseTokenInfo;
    /**
     * 分析池子
     * @param poolInfo 池子信息
     * @param targetToken 目标代币
     * @param baseToken 基础代币
     * @returns 池子分析结果
     */
    private analyzePool;
    /**
     * 估算代币价格(美元)
     * @param poolInfo 池子信息
     * @param targetToken 目标代币
     * @param baseToken 基础代币
     * @returns 估算价格(美元)
     */
    private estimateTokenPrice;
    /**
     * 估算流动性(美元)
     * @param poolInfo 池子信息
     * @param targetToken 目标代币
     * @param baseToken 基础代币
     * @returns 估算流动性(美元)
     */
    private estimateLiquidity;
    /**
     * 计算信心分数
     * @param poolInfo 池子信息
     * @param targetToken 目标代币
     * @param price 价格(美元)
     * @param liquidity 流动性(美元)
     * @returns 信心分数(0-1)
     */
    private calculateConfidenceScore;
    /**
     * 计算优先级分数
     * @param analysis 池子分析结果
     * @param poolInfo 池子信息
     * @param targetToken 目标代币
     * @returns 优先级分数
     */
    private calculatePriorityScore;
    /**
     * 估算滑点
     * @param poolInfo 池子信息
     * @param liquidityUsd 流动性(美元)
     * @returns 估算滑点百分比
     */
    private estimateSlippage;
    /**
     * 估算输出代币数量
     * @param poolInfo 池子信息
     * @param inputToken 输入代币
     * @param outputToken 输出代币
     * @param amountIn 输入数量
     * @returns 估算输出数量
     */
    private estimateOutputAmount;
}
declare const opportunityDetector: OpportunityDetector;
export default opportunityDetector;
