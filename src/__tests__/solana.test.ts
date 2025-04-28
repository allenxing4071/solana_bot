import { Connection, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { RPCService } from '../services/rpc_service.js';

describe('Solana Transaction Tests', () => {
  let connection: Connection;
  let rpcService: RPCService;
  let fromKeypair: Keypair;
  let toKeypair: Keypair;

  beforeAll(async () => {
    // 连接到 Solana devnet
    connection = new Connection('https://api.devnet.solana.com');
    rpcService = new RPCService();
    await rpcService.initialize(connection);

    // 生成测试用的密钥对
    fromKeypair = Keypair.generate();
    toKeypair = Keypair.generate();

    // 请求空投 SOL 到发送方账户
    const airdropSignature = await connection.requestAirdrop(
      fromKeypair.publicKey,
      LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(airdropSignature);
  });

  it('should successfully send a transaction', async () => {
    // 创建转账交易
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: toKeypair.publicKey,
        lamports: LAMPORTS_PER_SOL / 100 // 转账 0.01 SOL
      })
    );

    // 获取最新区块哈希
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = fromKeypair.publicKey;

    // 发送交易
    const signature = await rpcService.sendTransaction(transaction, [fromKeypair], {
      skipPreflight: true,
      maxRetries: 3
    });

    // 验证交易签名存在
    expect(signature).toBeDefined();
  });

  it('should handle transaction errors', async () => {
    // 创建无效交易（发送方余额不足）
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: toKeypair.publicKey,
        lamports: LAMPORTS_PER_SOL * 100 // 尝试转账 100 SOL
      })
    );

    // 获取最新区块哈希
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = fromKeypair.publicKey;

    // 验证交易失败
    await expect(rpcService.sendTransaction(transaction, [fromKeypair], {
      skipPreflight: true,
      maxRetries: 3
    }))
      .rejects
      .toThrow();
  });
}); 