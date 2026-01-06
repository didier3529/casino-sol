import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { SystemProgram, SYSVAR_RENT_PUBKEY, SYSVAR_CLOCK_PUBKEY } from '@solana/web3.js';
import BN from 'bn.js';
import { useCasino } from './useCasino';
import { NETWORK, getClusterUrl } from '../utils/constants';
import { logTransactionError, logTransactionSuccess, getUserFriendlyError } from '../utils/errors';
import toast from 'react-hot-toast';

export function useBet() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const casino = useCasino();
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [isFetchingSessions, setIsFetchingSessions] = useState(false);

  /**
   * Place a bet on any casino game
   * @param gameType 'coinflip' | 'dice' | 'slots'
   * @param choice Game-specific: CoinFlip(0/1), Dice(2-12), Slots(0)
   * @param betAmountLamports Bet amount in lamports (BN, required for Anchor u64)
   * @returns {betTx, gameId, sessionPda} for modal/auto-resolve tracking, or null on error
   */
  const placeBet = async (gameType: 'coinflip' | 'dice' | 'slots', choice: number, betAmountLamports: BN): Promise<{betTx: string; gameId: number; sessionPda: string} | null> => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return null;
    }

    if (!casino.program) {
      toast.error('Program not initialized');
      return null;
    }

    setIsPlacingBet(true);

    try {
      console.log('\n🎲 PLACE_BET START');
      console.log('  Wallet:', publicKey.toBase58());
      console.log('  Cluster:', NETWORK);
      console.log('  RPC:', getClusterUrl());
      console.log('  Game Type:', gameType);
      console.log('  Choice:', choice);
      console.log('  Bet Amount:', betAmountLamports.toString(), 'lamports');

      // Fetch casino to get current game ID
      const casinoAccount = await casino.fetchCasino();
      if (!casinoAccount) {
        throw new Error('Casino not initialized. Please initialize casino first.');
      }

      const gameId = casinoAccount.totalGames.toNumber();
      console.log('  Game ID:', gameId);

      // Derive PDAs
      const casinoPDA = casino.getCasinoPDA.pda;
      const vaultPDA = casino.getVaultPDA.pda;
      const { pda: sessionPDA } = casino.getSessionPDA(publicKey, gameId);

      console.log('\n🔑 PDAs:');
      console.log('  Casino PDA:', casinoPDA.toBase58());
      console.log('  Vault PDA:', vaultPDA.toBase58());
      console.log('  Session PDA:', sessionPDA.toBase58());

      // Check player balance
      const playerBalance = await connection.getBalance(publicKey);
      const playerBalanceBn = new BN(playerBalance);
      const requiredBalanceBn = betAmountLamports.add(new BN(10_000_000)); // Bet + 0.01 SOL buffer
      console.log('\n💰 Balance Check:');
      console.log('  Player Balance:', playerBalance, 'lamports (', playerBalance / 1e9, 'SOL)');
      console.log('  Required:', requiredBalanceBn.toString(), 'lamports');

      if (playerBalanceBn.lt(requiredBalanceBn)) {
        throw new Error(`Insufficient balance. Need ${requiredBalanceBn.toString()} lamports but have ${playerBalanceBn.toString()} lamports`);
      }

      // Build transaction using Anchor program
      console.log('\n🔨 Building transaction...');
      
      // Convert gameType string to Anchor enum format
      const gameTypeEnum = gameType === 'coinflip' ? { coinFlip: {} } : 
                           gameType === 'dice' ? { dice: {} } :
                           { slots: {} };
      
      const tx = await casino.program.methods
        // Anchor expects BN for u64. Passing a JS number causes `toArrayLike` serialization crash.
        .placeBet(gameTypeEnum, choice, betAmountLamports)
        .accounts({
          casino: casinoPDA,
          session: sessionPDA,
          vault: vaultPDA,
          player: publicKey,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
          clock: SYSVAR_CLOCK_PUBKEY,
        })
        .transaction();

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;
      tx.lastValidBlockHeight = lastValidBlockHeight;

      console.log('  Transaction built successfully');
      console.log('  Blockhash:', blockhash);

      // Simulate transaction first
      console.log('\n🧪 Simulating transaction...');
      try {
        const simulation = await connection.simulateTransaction(tx);
        if (simulation.value.err) {
          console.error('  ❌ Simulation failed:', simulation.value.err);
          throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
        }
        console.log('  ✅ Simulation successful');
        if (simulation.value.logs) {
          console.log('  Logs:');
          simulation.value.logs.forEach((log, i) => {
            console.log(`    ${i + 1}. ${log}`);
          });
        }
      } catch (simError) {
        console.error('  ❌ Simulation error:', simError);
        throw simError;
      }

      // Send transaction
      console.log('\n📤 Sending transaction...');
      const txSignature = await sendTransaction(tx, connection);
      console.log('  Transaction sent:', txSignature);

      // Confirm transaction
      console.log('\n⏳ Confirming transaction...');
      const confirmation = await connection.confirmTransaction({
        signature: txSignature,
        blockhash,
        lastValidBlockHeight,
      });

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      // Success!
      logTransactionSuccess('PLACE_BET', txSignature, {
        'Session PDA': sessionPDA.toBase58(),
        'Game ID': gameId,
        'Choice': choice === 0 ? 'Heads (0)' : 'Tails (1)',
        'Bet Amount': `${betAmountLamports.toString()} lamports`,
      });

      toast.success(`Bet placed! TX: ${txSignature.slice(0, 8)}...`);
      
      return {
        betTx: txSignature,
        gameId,
        sessionPda: sessionPDA.toBase58(),
      };

    } catch (error: any) {
      // Comprehensive error logging
      logTransactionError({
        action: 'PLACE_BET',
        wallet: publicKey!,
        cluster: NETWORK,
        betAmount: betAmountLamports.toString(),
        choice,
        pdas: {
          casino: casino.getCasinoPDA.pda.toBase58(),
          vault: casino.getVaultPDA.pda.toBase58(),
        },
      }, error);

      // User-friendly toast
      const friendlyMessage = getUserFriendlyError(error);
      toast.error(friendlyMessage);

      return null;
    } finally {
      setIsPlacingBet(false);
    }
  };

  /**
   * Fetch all sessions for connected wallet
   */
  const fetchSessions = async () => {
    if (!publicKey || !casino.program) {
      return [];
    }

    setIsFetchingSessions(true);
    try {
      console.log('📥 Fetching sessions for:', publicKey.toBase58());
      const sessions = await casino.fetchPlayerSessions(publicKey);
      console.log('  Found', sessions.length, 'session(s)');
      return sessions;
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    } finally {
      setIsFetchingSessions(false);
    }
  };

  return {
    placeBet,
    fetchSessions,
    isPlacingBet,
    isFetchingSessions,
  };
}

