/**
 * 交易执行器
 * 负责执行交易操作，包括买入和卖出交易，以及交易确认和重试逻辑
 */

import {
  Connection,
  Keypair,
  Transaction,
  PublicKey,
  sendAndConfirmTransaction,
  SendTransactionError,
  ConfirmedTransaction
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Buffer } from 'buffer';
import BN from 'bn.js';
import bs58 from 'bs58';
import logger from '../../core/logger';
import rpcService from '../../services/rpc_service';
import { TransactionBuilder } from './transaction_builder';
import { TokenInfo, PoolInfo, TradeResult, TradingOpportunity } from '../../core/types';
import appConfig from '../../core/config';
import transactionBuilder from './transaction_builder';

const MODULE_NAME = 'TraderExecutor';

/**
 * 交易执行参数接口
 */
interface TradeExecutionParams {
  opportunity: TradingOpportunity;  // 交易机会
  wallet?: Keypair;                 // 钱包密钥对(可选，默认使用配置的钱包)
  maxRetries?: number;              // 最大重试次数
  confirmTimeout?: number;          // 确认超时时间(毫秒)
}

/**
 * 交易执行器类
 * 负责实际执行买入和卖出交易操作
 */
export class TraderExecutor {
  private connection: Connection;
  private txBuilder: any; // 交易构建器
  private walletKeypair: Keypair;

  // 交易配置
  private readonly maxRetries: number;
  private readonly confirmTimeout: number;
  private readonly priorityFeeEnabled: boolean;
  private readonly maxSlippageBps: number;

  /**
   * 构造函数
   * @param walletPrivateKey 钱包私钥(Base58编码或Uint8Array)
   */
  constructor(walletPrivateKey: string | Uint8Array) {
    this.connection = rpcService.connection;
    this.txBuilder = transactionBuilder;
    
    // 创建钱包Keypair
    if (typeof walletPrivateKey === 'string') {
      const privateKeyBytes = bs58.decode(walletPrivateKey);
      this.walletKeypair = Keypair.fromSecretKey(privateKeyBytes);
    } else {
      this.walletKeypair = Keypair.fromSecretKey(walletPrivateKey);
    }
    
    // 从配置中加载交易参数
    this.maxRetries = appConfig.trading.txRetryCount;
    this.confirmTimeout = appConfig.trading.txConfirmTimeout;
    this.priorityFeeEnabled = appConfig.trading.buyStrategy.priorityFee.enabled;
    this.maxSlippageBps = appConfig.trading.buyStrategy.maxSlippage * 100; // 转换为基点(1% = 100bps)
    
    logger.info('交易执行器初始化完成', MODULE_NAME);
  }

  /**
   * 执行买入交易
   * @param params 交易执行参数
   * @returns 交易结果
   */
  async executeBuy(params: TradeExecutionParams): Promise<TradeResult> {
    const startTime = Date.now();
    const opportunity = params.opportunity;
    const pool = opportunity.pool;
    
    logger.info(`开始执行买入交易: ${opportunity.targetToken.symbol || opportunity.targetToken.mint.toBase58()}`, 
      MODULE_NAME, {
        pool: pool.address.toBase58(),
        dex: pool.dex,
        baseToken: opportunity.baseToken.symbol || opportunity.baseToken.mint.toBase58()
      }
    );
    
    try {
      // 计算买入金额
      const amountIn = this.calculateBuyAmount(opportunity);
      
      // 计算最小输出金额(考虑滑点)
      const expectedOutAmount = opportunity.estimatedOutAmount || BigInt(0);
      const minAmountOut = this.applySlippage(expectedOutAmount, this.maxSlippageBps);
      
      // 构建交换参数
      const swapParams = {
        poolInfo: pool,
        tokenIn: opportunity.baseToken,
        tokenOut: opportunity.targetToken,
        amountIn,
        minAmountOut,
        slippageBps: this.maxSlippageBps,
        wallet: params.wallet || this.walletKeypair
      };
      
      // 构建交易
      const txResult = await this.txBuilder.buildSwapTransaction(swapParams);
      
      if (txResult.error) {
        throw new Error(`构建交易失败: ${txResult.error}`);
      }
      
      // 执行交易
      const signature = await this.executeTransaction(
        txResult.transaction, 
        txResult.signers, 
        params.maxRetries || this.maxRetries,
        params.confirmTimeout || this.confirmTimeout
      );
      
      // 交易成功
      const executionTime = Date.now() - startTime;
      logger.info(`买入交易执行成功: ${signature}`, MODULE_NAME, {
        executionTimeMs: executionTime,
        token: opportunity.targetToken.symbol || opportunity.targetToken.mint.toBase58(),
        expectedAmount: expectedOutAmount.toString()
      });
      
      // 返回交易结果
      return {
        success: true,
        signature,
        txid: signature,
        tokenAmount: txResult.expectedOutAmount || BigInt(0),
        baseTokenAmount: amountIn,
        price: opportunity.estimatedPriceUsd,
        priceImpact: txResult.estimatedPriceImpact,
        fee: txResult.estimatedFee,
        timestamp: Date.now()
      };
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error(`买入交易执行失败`, MODULE_NAME, {
        error: error instanceof Error ? error.message : String(error),
        executionTimeMs: executionTime,
        token: opportunity.targetToken.symbol || opportunity.targetToken.mint.toBase58()
      });
      
      // 返回失败结果
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        errorCode: error instanceof SendTransactionError ? error.code : undefined,
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * 执行卖出交易
   * @param params 交易执行参数
   * @returns 交易结果
   */
  async executeSell(params: TradeExecutionParams): Promise<TradeResult> {
    const startTime = Date.now();
    const opportunity = params.opportunity;
    const pool = opportunity.pool;
    
    logger.info(`开始执行卖出交易: ${opportunity.targetToken.symbol || opportunity.targetToken.mint.toBase58()}`, 
      MODULE_NAME, {
        pool: pool.address.toBase58(),
        dex: pool.dex,
        baseToken: opportunity.baseToken.symbol || opportunity.baseToken.mint.toBase58()
      }
    );
    
    try {
      // 计算卖出金额
      const amountIn = opportunity.sellAmount || BigInt(0);
      
      // 计算最小输出金额(考虑滑点)
      const expectedOutAmount = opportunity.estimatedOutAmount || BigInt(0);
      const minAmountOut = this.applySlippage(expectedOutAmount, this.maxSlippageBps);
      
      // 构建交换参数
      const swapParams = {
        poolInfo: pool,
        tokenIn: opportunity.targetToken,
        tokenOut: opportunity.baseToken,
        amountIn,
        minAmountOut,
        slippageBps: this.maxSlippageBps,
        wallet: params.wallet || this.walletKeypair
      };
      
      // 构建交易
      const txResult = await this.txBuilder.buildSwapTransaction(swapParams);
      
      if (txResult.error) {
        throw new Error(`构建交易失败: ${txResult.error}`);
      }
      
      // 执行交易
      const signature = await this.executeTransaction(
        txResult.transaction, 
        txResult.signers, 
        params.maxRetries || this.maxRetries,
        params.confirmTimeout || this.confirmTimeout
      );
      
      // 交易成功
      const executionTime = Date.now() - startTime;
      logger.info(`卖出交易执行成功: ${signature}`, MODULE_NAME, {
        executionTimeMs: executionTime,
        token: opportunity.targetToken.symbol || opportunity.targetToken.mint.toBase58(),
        amount: amountIn.toString(),
        receivedBaseAmount: txResult.expectedOutAmount?.toString()
      });
      
      // 返回交易结果
      return {
        success: true,
        signature,
        txid: signature,
        tokenAmount: amountIn,
        baseTokenAmount: txResult.expectedOutAmount || BigInt(0),
        price: opportunity.estimatedPriceUsd,
        priceImpact: txResult.estimatedPriceImpact,
        fee: txResult.estimatedFee,
        timestamp: Date.now()
      };
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error(`卖出交易执行失败`, MODULE_NAME, {
        error: error instanceof Error ? error.message : String(error),
        executionTimeMs: executionTime,
        token: opportunity.targetToken.symbol || opportunity.targetToken.mint.toBase58()
      });
      
      // 返回失败结果
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        errorCode: error instanceof SendTransactionError ? error.code : undefined,
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * 执行交易并处理重试逻辑
   * @param transaction 交易对象
   * @param signers 签名者数组
   * @param maxRetries 最大重试次数
   * @param timeout 确认超时时间(毫秒)
   * @returns 交易签名
   */
  private async executeTransaction(
    transaction: Transaction,
    signers: Keypair[],
    maxRetries: number,
    timeout: number
  ): Promise<string> {
    let currentTry = 0;
    let lastError: Error | null = null;
    
    while (currentTry <= maxRetries) {
      try {
        // 如果不是第一次尝试，获取新的blockhash
        if (currentTry > 0) {
          const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
          transaction.recentBlockhash = blockhash;
          transaction.lastValidBlockHeight = lastValidBlockHeight;
          
          logger.info(`重试交易 (${currentTry}/${maxRetries})，更新blockhash: ${blockhash}`, MODULE_NAME);
        }
        
        // 发送并确认交易
        const signature = await sendAndConfirmTransaction(
          this.connection,
          transaction,
          signers,
          {
            skipPreflight: false,
            preflightCommitment: 'confirmed',
            commitment: 'confirmed',
            maxRetries: 2, // 在sendAndConfirmTransaction层面的重试
          }
        );
        
        return signature;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        currentTry++;
        
        // 记录错误
        logger.warn(`交易执行失败 (尝试 ${currentTry}/${maxRetries})`, MODULE_NAME, {
          error: lastError.message
        });
        
        // 如果还有重试次数，等待一段时间后重试
        if (currentTry <= maxRetries) {
          const backoffTime = Math.min(500 * Math.pow(2, currentTry), 10000); // 指数退避，最多10秒
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }
    }
    
    // 所有重试都失败
    throw lastError || new Error('交易执行失败，超过最大重试次数');
  }
  
  /**
   * 应用滑点计算最小输出数量
   * @param amount 预期数量
   * @param slippageBps 滑点(基点)
   * @returns 应用滑点后的最小数量
   */
  private applySlippage(amount: bigint, slippageBps: number): bigint {
    const slippageFactor = 10000 - slippageBps; // 10000 = 100%
    return (amount * BigInt(slippageFactor)) / BigInt(10000);
  }
  
  /**
   * 计算买入金额
   * @param opportunity 交易机会
   * @returns 买入金额
   */
  private calculateBuyAmount(opportunity: TradingOpportunity): bigint {
    // 从配置获取最大交易额
    const maxAmountPerTrade = appConfig.trading.buyStrategy.maxAmountPerTrade;
    
    // 根据优先级分数调整买入金额
    let adjustedAmount = maxAmountPerTrade;
    
    // 如果优先级分数低于阈值，减少买入金额
    if (opportunity.priorityScore < 0.7) {
      adjustedAmount = maxAmountPerTrade * 0.5;
    } else if (opportunity.priorityScore < 0.5) {
      adjustedAmount = maxAmountPerTrade * 0.25;
    }
    
    // 将SOL金额转换为lamports
    return BigInt(Math.floor(adjustedAmount * 1e9)); // 1 SOL = 10^9 lamports
  }
  
  /**
   * 获取交易状态
   * @param signature 交易签名
   * @returns 交易信息
   */
  async getTransactionStatus(signature: string): Promise<ConfirmedTransaction | null> {
    try {
      const txInfo = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
      });
      
      return txInfo;
    } catch (error) {
      logger.error(`获取交易状态失败: ${signature}`, MODULE_NAME, error);
      return null;
    }
  }
}

// 导出单例实例
const traderExecutor = new TraderExecutor(process.env.WALLET_PRIVATE_KEY || '');
export default traderExecutor; 