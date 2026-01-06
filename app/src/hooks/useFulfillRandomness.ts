import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { SystemProgram, SYSVAR_CLOCK_PUBKEY, PublicKey } from '@solana/web3.js';
import { useCasino } from './useCasino';
import { logTransactionError, logTransactionSuccess, getUserFriendlyError } from '../utils/errors';
import toast from 'react-hot-toast';

export function useFulfillRandomness() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const casino = useCasino();
  const [isFulfilling, setIsFulfilling] = useState(false);

  /**
   * Fulfill randomness for a pending session (mock VRF for devnet testing)
   * Returns {txSignature, parsedResult} where parsedResult contains {outcome, isWin} if found in logs
   */
  const fulfillRandomness = async (
    sessionPubkey: PublicKey,
    playerPubkey: PublicKey
  ): Promise<{txSignature: string; parsedResult: {outcome: number; isWin: boolean} | null} | null> => {
    if (!wallet.publicKey || !casino.program) {
      toast.error('Wallet not connected or program not initialized');
      return null;
    }

    setIsFulfilling(true);
    const toastId = toast.loading('Resolving bet...');

    try {
      console.log('\n✨ FULFILL_RANDOMNESS START');
      console.log('  Session:', sessionPubkey.toBase58());
      console.log('  Player:', playerPubkey.toBase58());
      console.log('  Caller (Authority):', wallet.publicKey.toBase58());

      const casinoAccount = await casino.fetchCasino();
      if (!casinoAccount || casinoAccount.authority.toBase58() !== wallet.publicKey.toBase58()) {
        throw new Error('Only casino authority can fulfill randomness');
      }

      const casinoPDA = casino.getCasinoPDA.pda;
      const vaultPDA = casino.getVaultPDA.pda;

      // Generate a mock random value (for devnet testing)
      const randomValue = new Uint8Array(32);
      randomValue[0] = Math.floor(Math.random() * 256);
      console.log('  Mock Random Value (first byte):', randomValue[0]);

      const tx = await casino.program.methods
        .fulfillRandomness(Array.from(randomValue))
        .accounts({
          casino: casinoPDA,
          session: sessionPubkey,
          vault: vaultPDA,
          player: playerPubkey,
          caller: wallet.publicKey,
          systemProgram: SystemProgram.programId,
          clock: SYSVAR_CLOCK_PUBKEY,
        })
        .transaction();

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
      tx.recentBlockhash = blockhash;
      tx.feePayer = wallet.publicKey;
      tx.lastValidBlockHeight = lastValidBlockHeight;

      console.log('  Transaction built successfully');

      console.log('\n📤 Sending fulfillment transaction...');
      const txSignature = await wallet.sendTransaction(tx, connection);
      console.log('  Transaction sent:', txSignature);

      console.log('\n⏳ Confirming fulfillment transaction...');
      const confirmation = await connection.confirmTransaction({
        signature: txSignature,
        blockhash,
        lastValidBlockHeight,
      });

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      // Try to extract result from transaction logs
      let parsedResult: {outcome: number; isWin: boolean} | null = null;
      try {
        const txDetails = await connection.getTransaction(txSignature, {
          maxSupportedTransactionVersion: 0,
        });
        
        if (txDetails && txDetails.meta && txDetails.meta.logMessages) {
          const logs = txDetails.meta.logMessages;
          let outcome: number | null = null;
          let isWin: boolean | null = null;
          
          for (const log of logs) {
            // Look for "Outcome: 0" or "Outcome: 1" in logs
            const outcomeMatch = log.match(/Outcome:\s*(\d+)/i);
            if (outcomeMatch) {
              outcome = parseInt(outcomeMatch[1]);
            }
            
            // Look for "Result: WIN" or "Result: LOSS"
            const resultMatch = log.match(/Result:\s*(WIN|LOSS)/i);
            if (resultMatch) {
              isWin = resultMatch[1] === 'WIN';
            }
          }
          
          if (outcome !== null && isWin !== null) {
            parsedResult = { outcome, isWin };
            console.log('📊 Parsed result from logs:', parsedResult);
          }
        }
      } catch (e) {
        console.warn('Could not parse transaction logs:', e);
      }

      logTransactionSuccess('FULFILL_RANDOMNESS', txSignature, {
        'Session PDA': sessionPubkey.toBase58(),
        'Player': playerPubkey.toBase58(),
        'Caller (Authority)': wallet.publicKey.toBase58(),
        'Result': parsedResult ? `${parsedResult.isWin ? 'WIN' : 'LOSS'} (outcome: ${parsedResult.outcome})` : 'Unknown',
      });

      toast.success(`Session resolved! ${parsedResult ? (parsedResult.isWin ? '🎉 WIN' : '😔 LOSS') : ''}`, { id: toastId });
      return { txSignature, parsedResult };

    } catch (error: any) {
      console.error('❌ Error fulfilling randomness:', error);
      logTransactionError({
        action: 'fulfill randomness',
        wallet: wallet.publicKey,
        cluster: 'devnet',
      }, error);
      const errorMessage = getUserFriendlyError(error);
      toast.error(errorMessage, { id: toastId });
      return null;
    } finally {
      setIsFulfilling(false);
    }
  };

  return {
    fulfillRandomness,
    isFulfilling,
  };
}
