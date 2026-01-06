import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { SystemProgram } from '@solana/web3.js';
import BN from 'bn.js';
import { useCasino } from './useCasino';
import { logTransactionError, logTransactionSuccess, getUserFriendlyError } from '../utils/errors';
import toast from 'react-hot-toast';

export function useDrainVault() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const casino = useCasino();
  const [isDraining, setIsDraining] = useState(false);

  /**
   * Drain vault to authority (dev-only for testing)
   * @param amountLamports Amount to drain in lamports (BN)
   */
  const drainVault = async (amountLamports: BN): Promise<string | null> => {
    if (!wallet.publicKey || !casino.program) {
      toast.error('Wallet not connected or program not initialized');
      return null;
    }

    setIsDraining(true);
    const toastId = toast.loading('Draining vault...');

    try {
      console.log('\n💰 DRAIN_VAULT START');
      console.log('  Amount:', amountLamports.toString(), 'lamports');
      console.log('  Authority:', wallet.publicKey.toBase58());

      const casinoAccount = await casino.fetchCasino();
      if (!casinoAccount || casinoAccount.authority.toBase58() !== wallet.publicKey.toBase58()) {
        throw new Error('Only casino authority can drain vault');
      }

      const casinoPDA = casino.getCasinoPDA.pda;
      const vaultPDA = casino.getVaultPDA.pda;

      // Build the transaction
      const tx = await casino.program.methods
        .drainVault(amountLamports)
        .accounts({
          casino: casinoPDA,
          vault: vaultPDA,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
      tx.recentBlockhash = blockhash;
      tx.feePayer = wallet.publicKey;
      tx.lastValidBlockHeight = lastValidBlockHeight;

      console.log('  Transaction built successfully');

      // Simulate first to surface real errors (wallet otherwise shows generic -32603)
      console.log('\n🧪 Simulating drain transaction...');
      const sim = await connection.simulateTransaction(tx);
      if (sim.value.err) {
        console.error('  ❌ Simulation failed:', sim.value.err);
        if (sim.value.logs?.length) {
          console.error('  Logs:');
          sim.value.logs.forEach((l) => console.error('   ', l));
        }
        throw new Error(`Simulation failed: ${JSON.stringify(sim.value.err)}`);
      }
      console.log('  ✅ Simulation successful');

      console.log('\n📤 Sending drain transaction...');
      const txSignature = await wallet.sendTransaction(tx, connection);
      console.log('  Transaction sent:', txSignature);

      console.log('\n⏳ Confirming drain transaction...');
      const confirmation = await connection.confirmTransaction({
        signature: txSignature,
        blockhash,
        lastValidBlockHeight,
      });

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      logTransactionSuccess('DRAIN_VAULT', txSignature, {
        'Vault PDA': vaultPDA.toBase58(),
        'Authority': wallet.publicKey.toBase58(),
        'Amount': `${amountLamports.toString()} lamports`,
      });

      toast.success(`Vault drained! TX: ${txSignature.slice(0, 8)}...`, { id: toastId });
      return txSignature;

    } catch (error: any) {
      console.error('❌ Error draining vault:', error);
      logTransactionError({
        action: 'drain vault',
        wallet: wallet.publicKey,
        cluster: casino.NETWORK,
      }, error);
      const errorMessage = getUserFriendlyError(error);
      toast.error(errorMessage, { id: toastId });
      return null;
    } finally {
      setIsDraining(false);
    }
  };

  return {
    drainVault,
    isDraining,
  };
}

