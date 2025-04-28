import { Connection, PublicKey, Commitment, Finality } from '@solana/web3.js';
import { IDataSource } from './data_sources.js';
import logger from '../../core/logger.js';
import rpcService from '../../services/rpc_service.js';

/**
 * Solana 数据源类
 * 负责获取 Solana 链上数据
 */
export class SolanaDataSource implements IDataSource {
  private connection: Connection | null = null;
  private config: any;
  private commitment: Commitment;

  constructor(config: any) {
    this.config = config;
    this.commitment = config.commitment || 'confirmed';
  }

  async initialize(config: any): Promise<void> {
    this.config = config;
    this.commitment = config.commitment || 'confirmed';
    
    try {
      // 使用 RPC 服务获取连接
      this.connection = await rpcService.getConnection();
      logger.info('Solana data source initialized successfully');
    } catch (error) {
      logger.error(`Failed to initialize Solana data source: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async getOnChainData(params: {
    type: 'account' | 'transaction' | 'program';
    address: string;
    options?: Record<string, any>;
  }): Promise<any> {
    if (!this.connection) {
      throw new Error('Solana connection not initialized');
    }

    try {
      const publicKey = new PublicKey(params.address);
      
      switch (params.type) {
        case 'account':
          return await this.getAccountInfo(publicKey, params.options);
        case 'transaction':
          return await this.getTransaction(publicKey, params.options);
        case 'program':
          return await this.getProgramAccounts(publicKey, params.options);
        default:
          throw new Error(`Unsupported data type: ${params.type}`);
      }
    } catch (error) {
      logger.error(`Failed to get on-chain data: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async getAccountInfo(publicKey: PublicKey, options?: Record<string, any>): Promise<any> {
    if (!this.connection) {
      throw new Error('Solana connection not initialized');
    }

    try {
      const accountInfo = await this.connection.getAccountInfo(publicKey, this.commitment);
      if (!accountInfo) {
        return null;
      }

      return {
        owner: accountInfo.owner.toBase58(),
        lamports: accountInfo.lamports,
        data: accountInfo.data,
        executable: accountInfo.executable,
        rentEpoch: accountInfo.rentEpoch
      };
    } catch (error) {
      logger.error(`Failed to get account info: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async getTransaction(publicKey: PublicKey, options?: Record<string, any>): Promise<any> {
    if (!this.connection) {
      throw new Error('Solana connection not initialized');
    }

    try {
      const signature = publicKey.toBase58();
      const transaction = await this.connection.getTransaction(signature, {
        commitment: this.commitment as Finality,
        maxSupportedTransactionVersion: 0
      });

      if (!transaction) {
        return null;
      }

      return {
        slot: transaction.slot,
        blockTime: transaction.blockTime,
        meta: transaction.meta,
        transaction: transaction.transaction
      };
    } catch (error) {
      logger.error(`Failed to get transaction: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async getProgramAccounts(publicKey: PublicKey, options?: Record<string, any>): Promise<any> {
    if (!this.connection) {
      throw new Error('Solana connection not initialized');
    }

    try {
      const accounts = await this.connection.getProgramAccounts(publicKey, {
        commitment: this.commitment,
        filters: options?.filters || []
      });

      return accounts.map(account => ({
        pubkey: account.pubkey.toBase58(),
        account: {
          owner: account.account.owner.toBase58(),
          lamports: account.account.lamports,
          data: account.account.data,
          executable: account.account.executable,
          rentEpoch: account.account.rentEpoch
        }
      }));
    } catch (error) {
      logger.error(`Failed to get program accounts: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async getMarketData(): Promise<any> {
    throw new Error('Market data not supported by Solana data source');
  }

  async getSocialData(): Promise<any> {
    throw new Error('Social data not supported by Solana data source');
  }

  async healthCheck(): Promise<boolean> {
    if (!this.connection) {
      return false;
    }

    try {
      await this.connection.getVersion();
      return true;
    } catch (error) {
      logger.error(`Health check failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
} 