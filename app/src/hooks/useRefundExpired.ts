import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction, SystemProgram } from '@solana/web3.js';
import toast from 'react-hot-toast';
import { useCasino } from './useCasino';
import { operatorLog, operatorError } from '../utils/operatorGate';

export interface ExpiredSession {
  pubkey: string;
  gameId: number;
  betAmount: number;
  createdAt: number;
  isExpired: boolean;
}

export function useRefundExpired() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const casino = useCasino();
  const [isRefunding, setIsRefunding] = useState(false);

  /**
   * Find all expired pending sessions for the connected wallet
   */
  const findExpiredSessions = async (): Promise<ExpiredSession[]> => {
    if (!wallet.publicKey || !casino.program) {
      return [];
    }

    try {
      const sessions = await casino.fetchPlayerSessions(wallet.publicKey);
      const now = Math.floor(Date.now() / 1000);
      const SESSION_EXPIRY = 300; // 5 minutes (matches on-chain constant)

      return sessions
        .filter(s => {
          const status = typeof s.status === 'object' ? Object.keys(s.status)[0] : s.status;
          const isPending = status === 'pending' || status === 'Pending';
          const age = now - (s.createdAt || 0);
          return isPending && age > SESSION_EXPIRY;
        })
        .map(s => ({
          pubkey: s.pubkey,
          gameId: s.gameId,
          betAmount: s.betAmount,
          createdAt: s.createdAt || 0,
          isExpired: true,
        }));
    } catch (error) {
      operatorError('Error finding expired sessions:', error);
      return [];
    }
  };

  /**
   * Refund a single expired session by calling the on-chain refund_expired instruction
   */
  const refundSession = async (sessionPubkey: string, gameId: number): Promise<boolean> => {
    if (!wallet.publicKey || !casino.program) {
      toast.error('Wallet not connected');
      return false;
    }

    try {
      operatorLog(`Refunding session ${sessionPubkey.slice(0, 8)}... (gameId: ${gameId})`);

      const casinoPDA = casino.getCasinoPDA.pda;
      const vaultPDA = casino.getVaultPDA.pda;
      const sessionPDA = casino.getSessionPDA(wallet.publicKey, gameId).pda;

      // Build refund_expired transaction
      const tx = await casino.program.methods
        .refundExpired()
        .accounts({
          casino: casinoPDA,
          session: sessionPDA,
          vault: vaultPDA,
          player: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = wallet.publicKey;

      const signed = await wallet.sendTransaction(tx, connection);
      operatorLog(`  TX sent: ${signed}`);

      const confirmation = await connection.confirmTransaction({
        signature: signed,
        blockhash,
        lastValidBlockHeight,
      });

      if (confirmation.value.err) {
        throw new Error(`TX failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      operatorLog(`  ✓ Refunded session ${sessionPubkey.slice(0, 8)}`);
      return true;
    } catch (error: any) {
      operatorError(`Failed to refund session ${sessionPubkey.slice(0, 8)}`, error);
      return false;
    }
  };

  /**
   * Refund multiple expired sessions (batched, with progress reporting)
   */
  const refundExpiredSessions = async (
    maxBatch: number = 5
  ): Promise<{ success: number; failed: number; total: number }> => {
    if (isRefunding) {
      toast.error('Already refunding sessions');
      return { success: 0, failed: 0, total: 0 };
    }

    setIsRefunding(true);
    const toastId = toast.loading('Finding expired sessions...');

    try {
      const expired = await findExpiredSessions();

      if (expired.length === 0) {
        toast.success('No expired sessions found', { id: toastId });
        return { success: 0, failed: 0, total: 0 };
      }

      // Limit batch to avoid wallet spam
      const batch = expired.slice(0, maxBatch);
      toast.loading(`Refunding ${batch.length} session(s)...`, { id: toastId });

      let success = 0;
      let failed = 0;

      for (const session of batch) {
        const result = await refundSession(session.pubkey, session.gameId);
        if (result) {
          success++;
        } else {
          failed++;
        }

        // Small delay between transactions
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (failed === 0) {
        toast.success(`✓ Refunded ${success} session(s)`, { id: toastId });
      } else {
        toast.error(`Refunded ${success}, failed ${failed}`, { id: toastId });
      }

      return { success, failed, total: expired.length };
    } catch (error) {
      operatorError('Error refunding expired sessions:', error);
      toast.error('Failed to refund sessions', { id: toastId });
      return { success: 0, failed: 0, total: 0 };
    } finally {
      setIsRefunding(false);
    }
  };

  return {
    findExpiredSessions,
    refundExpiredSessions,
    isRefunding,
  };
}

