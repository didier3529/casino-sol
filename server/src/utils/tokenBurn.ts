import { Connection, PublicKey, Transaction, Keypair, sendAndConfirmTransaction } from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createBurnInstruction,
  TOKEN_PROGRAM_ID,
  getAccount
} from '@solana/spl-token';
import { logger } from './logger';

/**
 * Burn SPL tokens by transferring them to the burn address
 * or using the burn instruction
 */

// Solana burn address (all zeros except last byte = 1)
const BURN_ADDRESS = new PublicKey('11111111111111111111111111111112');

export interface BurnTokensParams {
  connection: Connection;
  payer: Keypair;
  tokenMint: PublicKey;
  amount: number; // Amount in token base units
}

export interface BurnTokensResult {
  success: boolean;
  signature?: string;
  amountBurned?: number;
  error?: string;
}

/**
 * Burn tokens using the SPL Token burn instruction
 * This permanently removes tokens from circulation
 */
export async function burnTokens(params: BurnTokensParams): Promise<BurnTokensResult> {
  const { connection, payer, tokenMint, amount } = params;

  try {
    logger.info(`Attempting to burn ${amount} tokens of mint ${tokenMint.toBase58()}`);

    // Get the associated token account for the payer
    const payerTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      payer.publicKey
    );

    // Check if the account exists and has sufficient balance
    try {
      const accountInfo = await getAccount(connection, payerTokenAccount);
      
      if (Number(accountInfo.amount) < amount) {
        throw new Error(
          `Insufficient token balance. Have: ${accountInfo.amount}, Need: ${amount}`
        );
      }

      logger.info(`Found token account ${payerTokenAccount.toBase58()} with balance ${accountInfo.amount}`);
    } catch (error) {
      throw new Error(`Token account not found or error reading: ${error}`);
    }

    // Create burn instruction
    const burnInstruction = createBurnInstruction(
      payerTokenAccount,      // Account to burn from
      tokenMint,              // Mint
      payer.publicKey,        // Owner of the account
      amount,                 // Amount to burn
      [],                     // No multisig signers
      TOKEN_PROGRAM_ID
    );

    // Create and send transaction
    const transaction = new Transaction().add(burnInstruction);
    
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = payer.publicKey;
    transaction.lastValidBlockHeight = lastValidBlockHeight;

    // Sign and send
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [payer],
      {
        commitment: 'confirmed',
        skipPreflight: false,
      }
    );

    logger.info(`✅ Successfully burned ${amount} tokens. Signature: ${signature}`);

    return {
      success: true,
      signature,
      amountBurned: amount,
    };
  } catch (error) {
    logger.error('❌ Token burn failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get the token balance for a given mint and owner
 */
export async function getTokenBalance(
  connection: Connection,
  tokenMint: PublicKey,
  owner: PublicKey
): Promise<number> {
  try {
    const tokenAccount = await getAssociatedTokenAddress(tokenMint, owner);
    const accountInfo = await getAccount(connection, tokenAccount);
    return Number(accountInfo.amount);
  } catch (error) {
    logger.warn(`Could not get token balance: ${error}`);
    return 0;
  }
}

