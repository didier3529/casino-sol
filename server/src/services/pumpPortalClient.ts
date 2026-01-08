import { Transaction, VersionedTransaction } from '@solana/web3.js';
import { logger } from '../utils/logger';

/**
 * PumpPortal Local Transaction API Client
 * Builds unsigned transactions for Pump.fun bonding curve buys
 * that we sign and send ourselves for maximum security and control.
 */

export interface PumpPortalTradeRequest {
  publicKey: string; // Wallet public key (authority)
  action: 'buy' | 'sell';
  mint: string; // Token mint address
  amount: number; // Amount in lamports (if denominatedInSol=true) or tokens
  denominatedInSol: 'true' | 'false';
  slippage: number; // Slippage percentage (e.g., 5 for 5%)
  priorityFee: number; // Priority fee in SOL (e.g., 0.0005)
  pool?: string; // Pool type, defaults to 'pump'
}

export interface PumpPortalTradeResponse {
  success: boolean;
  transaction?: string; // Base64-encoded serialized transaction
  error?: string;
}

const PUMPPORTAL_API_URL = 'https://pumpportal.fun/api/trade-local';

export class PumpPortalClient {
  /**
   * Request an unsigned transaction from PumpPortal for a Pump.fun buy
   */
  async buildBuyTransaction(params: {
    authorityPublicKey: string;
    tokenMint: string;
    amountLamports: number;
    slippagePercent: number;
    priorityFeeSol: number;
  }): Promise<Transaction | VersionedTransaction> {
    const request: PumpPortalTradeRequest = {
      publicKey: params.authorityPublicKey,
      action: 'buy',
      mint: params.tokenMint,
      amount: params.amountLamports,
      denominatedInSol: 'true',
      slippage: params.slippagePercent,
      priorityFee: params.priorityFeeSol,
      pool: 'pump', // Explicitly use Pump.fun bonding curve
    };

    logger.info('Requesting PumpPortal buy transaction:', {
      mint: params.tokenMint,
      amountSOL: params.amountLamports / 1e9,
      slippage: params.slippagePercent,
      priorityFee: params.priorityFeeSol,
    });

    try {
      const response = await fetch(PUMPPORTAL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PumpPortal API error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as PumpPortalTradeResponse;

      if (!data.success || !data.transaction) {
        throw new Error(`PumpPortal returned unsuccessful response: ${data.error || 'Unknown error'}`);
      }

      // Decode the base64-encoded transaction
      const txBuffer = Buffer.from(data.transaction, 'base64');
      
      // Try to deserialize as VersionedTransaction first (more common for modern txs)
      try {
        const versionedTx = VersionedTransaction.deserialize(txBuffer);
        logger.info('Successfully decoded PumpPortal transaction (VersionedTransaction)');
        return versionedTx;
      } catch (versionedError) {
        // Fallback to legacy Transaction
        try {
          const legacyTx = Transaction.from(txBuffer);
          logger.info('Successfully decoded PumpPortal transaction (Legacy Transaction)');
          return legacyTx;
        } catch (legacyError) {
          throw new Error(
            `Failed to deserialize transaction: ${versionedError} | ${legacyError}`
          );
        }
      }
    } catch (error) {
      logger.error('PumpPortal API call failed:', error);
      throw error;
    }
  }

  /**
   * Health check for PumpPortal API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(PUMPPORTAL_API_URL, {
        method: 'OPTIONS',
      });
      return response.ok;
    } catch (error) {
      logger.error('PumpPortal health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
let pumpPortalClient: PumpPortalClient | null = null;

export const getPumpPortalClient = (): PumpPortalClient => {
  if (!pumpPortalClient) {
    pumpPortalClient = new PumpPortalClient();
  }
  return pumpPortalClient;
};












