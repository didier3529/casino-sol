import axios from 'axios';
import { Connection, Keypair, VersionedTransaction, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { createBurnInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { logger } from './logger';

const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6/quote';
const JUPITER_SWAP_API = 'https://quote-api.jup.ag/v6/swap';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

export interface QuoteParams {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps: number;
}

export interface QuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: number;
  routePlan: any[];
}

export interface SwapParams {
  quoteResponse: QuoteResponse;
  userPublicKey: string;
}

export interface SwapResponse {
  swapTransaction: string;  // Base64 encoded
  lastValidBlockHeight: number;
}

/**
 * Get a swap quote from Jupiter
 */
export async function getJupiterQuote(params: QuoteParams): Promise<QuoteResponse> {
  try {
    const response = await axios.get(JUPITER_QUOTE_API, {
      params: {
        inputMint: params.inputMint,
        outputMint: params.outputMint,
        amount: params.amount,
        slippageBps: params.slippageBps,
      },
    });
    
    return response.data;
  } catch (error: any) {
    logger.error('Jupiter quote error:', error.response?.data || error.message);
    throw new Error(`Failed to get Jupiter quote: ${error.message}`);
  }
}

/**
 * Get a swap transaction from Jupiter
 */
export async function getJupiterSwap(params: SwapParams): Promise<SwapResponse> {
  try {
    const response = await axios.post(JUPITER_SWAP_API, {
      quoteResponse: params.quoteResponse,
      userPublicKey: params.userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto',
    });
    
    return response.data;
  } catch (error: any) {
    logger.error('Jupiter swap error:', error.response?.data || error.message);
    throw new Error(`Failed to get Jupiter swap transaction: ${error.message}`);
  }
}

/**
 * Execute a swap using Jupiter with retry logic
 */
export async function executeSwap(params: {
  quote: QuoteResponse;
  wallet: Keypair;
  connection: Connection;
}): Promise<string> {
  const { quote, wallet, connection } = params;
  const maxRetries = 3;
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`Jupiter swap attempt ${attempt}/${maxRetries}`);
      
      // Get swap transaction from Jupiter
      const { swapTransaction } = await getJupiterSwap({
        quoteResponse: quote,
        userPublicKey: wallet.publicKey.toBase58(),
      });
      
      // Deserialize transaction
      const txBuffer = Buffer.from(swapTransaction, 'base64');
      const tx = VersionedTransaction.deserialize(txBuffer);
      
      // Sign with bot wallet
      tx.sign([wallet]);
      
      // Send transaction
      const signature = await connection.sendTransaction(tx, {
        skipPreflight: false,
        maxRetries: 2,
      });
      
      logger.info(`Swap transaction sent: ${signature}`);
      
      // Wait for confirmation with timeout
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`Swap transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }
      
      logger.info(`✅ Swap transaction confirmed: ${signature}`);
      return signature;
      
    } catch (error: any) {
      lastError = error;
      logger.warn(`Swap attempt ${attempt} failed: ${error.message}`);
      
      // Check for specific error types
      if (error.message.includes('slippage')) {
        logger.error('Slippage exceeded - not retrying');
        throw new Error('Slippage tolerance exceeded');
      }
      
      if (error.message.includes('insufficient')) {
        logger.error('Insufficient funds - not retrying');
        throw new Error('Insufficient SOL for transaction fees');
      }
      
      // Exponential backoff before retry
      if (attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        logger.info(`Waiting ${delayMs}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  throw new Error(`Failed to execute swap after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Burn SPL tokens from a token account
 */
export async function burnTokens(params: {
  tokenMint: PublicKey;
  amount: bigint;
  wallet: Keypair;
  connection: Connection;
}): Promise<string> {
  const { tokenMint, amount, wallet, connection } = params;
  
  // Get associated token account
  const tokenAccount = await getAssociatedTokenAddress(
    tokenMint,
    wallet.publicKey
  );
  
  // Create burn instruction
  const burnIx = createBurnInstruction(
    tokenAccount,
    tokenMint,
    wallet.publicKey,
    amount,
    [],
    TOKEN_PROGRAM_ID
  );
  
  // Create and send transaction
  const tx = new Transaction().add(burnIx);
  
  const signature = await sendAndConfirmTransaction(
    connection,
    tx,
    [wallet],
    { commitment: 'confirmed' }
  );
  
  logger.info(`Burn transaction confirmed: ${signature}`);
  
  return signature;
}

/**
 * Get SOL -> Token quote (convenience wrapper)
 */
export async function getSOLToTokenQuote(
  tokenMint: string,
  solAmount: number,
  slippageBps: number
): Promise<QuoteResponse> {
  return getJupiterQuote({
    inputMint: SOL_MINT,
    outputMint: tokenMint,
    amount: solAmount,
    slippageBps,
  });
}
