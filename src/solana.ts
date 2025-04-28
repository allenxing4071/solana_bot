import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

export async function sendTransaction(
  connection: Connection,
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  amount: number
): Promise<string> {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports: amount,
    })
  );

  const signature = await connection.sendTransaction(transaction, []);
  await connection.confirmTransaction(signature);
  
  return signature;
} 