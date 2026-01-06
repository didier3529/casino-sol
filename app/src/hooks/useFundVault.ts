import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { SystemProgram, Transaction } from '@solana/web3.js';
import BN from 'bn.js';
import toast from 'react-hot-toast';
import { useCasino } from './useCasino';
import { logTransactionError, logTransactionSuccess, getUserFriendlyError } from '../utils/errors';

/**
 * Fund the Vault PDA (liquidity) by transferring SOL from the authority wallet to the Vault PDA.
 *
 * Why this is safe/needed:
 * - The vault is a PDA address and can receive SOL like any other account.
 * - Bets are rejected on-chain unless the vault can cover the potential payout.
 * - After draining the vault for testing, you must re-fund it to accept bets again.
 */
export function useFundVault() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const casino = useCasino();
  const [isFunding, setIsFunding] = useState(false);

  const fundVault = async (amountLamports: BN): Promise<string | null> => {
    if (!wallet.publicKey || !casino.program) {
      toast.error('Wallet not connected or program not initialized');
      return null;
    }

    if (amountLamports.lte(new BN(0))) {
      toast.error('Please enter a valid amount');
      return null;
    }

    setIsFunding(true);
    const toastId = toast.loading('Funding vault...');

    try {
      console.log('\n💸 FUND_VAULT START');
      console.log('  Amount:', amountLamports.toString(), 'lamports');
      console.log('  Funder:', wallet.publicKey.toBase58());

      // Authority-only to prevent confusion in UI (anyone *can* fund, but operator should do it)
      const casinoAccount = await casino.fetchCasino();
      if (!casinoAccount || casinoAccount.authority.toBase58() !== wallet.publicKey.toBase58()) {
        throw new Error('Only casino authority can fund the vault (operator action)');
      }

      const vaultPDA = casino.getVaultPDA.pda;

      if (amountLamports.gt(new BN(Number.MAX_SAFE_INTEGER))) {
        throw new Error('Amount too large for web3.js transfer (reduce amount)');
      }

      const ix = SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: vaultPDA,
        lamports: amountLamports.toNumber(), // safe for devnet-sized funding; UI validates small amounts
      });

      const tx = new Transaction().add(ix);

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
      tx.recentBlockhash = blockhash;
      tx.feePayer = wallet.publicKey;
      tx.lastValidBlockHeight = lastValidBlockHeight;

      console.log('\n🧪 Simulating fund transaction...');
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

      console.log('\n📤 Sending fund transaction...');
      const sig = await wallet.sendTransaction(tx, connection);
      console.log('  Transaction sent:', sig);

      console.log('\n⏳ Confirming fund transaction...');
      const confirmation = await connection.confirmTransaction({
        signature: sig,
        blockhash,
        lastValidBlockHeight,
      });
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      logTransactionSuccess('FUND_VAULT', sig, {
        'Vault PDA': vaultPDA.toBase58(),
        'Authority': wallet.publicKey.toBase58(),
        'Amount': `${amountLamports.toString()} lamports`,
      });

      toast.success(`Vault funded! TX: ${sig.slice(0, 8)}...`, { id: toastId });
      return sig;
    } catch (error: any) {
      console.error('❌ Error funding vault:', error);
      logTransactionError(
        {
          action: 'fund vault',
          wallet: wallet.publicKey,
          cluster: casino.NETWORK,
        },
        error
      );
      const msg = getUserFriendlyError(error);
      toast.error(msg, { id: toastId });
      return null;
    } finally {
      setIsFunding(false);
    }
  };

  return { fundVault, isFunding };
}


