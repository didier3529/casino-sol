import { useCallback } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

interface GameResultReport {
  walletAddress: string;
  transactionSignature: string;
  gameType: 'coinflip' | 'dice' | 'slots';
  betAmount: number; // in SOL
  payoutAmount: number; // in SOL
  isWin: boolean;
  timestamp?: number;
  gameData?: any;
}

/**
 * Hook for reporting game results to the leaderboard backend
 */
export function useLeaderboard() {
  /**
   * Report a game result to the backend for leaderboard tracking
   */
  const reportGameResult = useCallback(async (result: GameResultReport): Promise<boolean> => {
    try {
      console.log('📊 Reporting game result to leaderboard:', result);
      
      const response = await fetch(`${BACKEND_URL}/api/webhooks/game-result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: result.walletAddress,
          transactionSignature: result.transactionSignature,
          gameType: result.gameType,
          betAmount: result.betAmount,
          payoutAmount: result.payoutAmount,
          isWin: result.isWin,
          timestamp: result.timestamp || Date.now(),
          gameData: result.gameData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to report game result:', errorData);
        return false;
      }

      const data = await response.json();
      console.log('✅ Game result reported successfully:', data);
      return true;
      
    } catch (error) {
      console.error('Error reporting game result to leaderboard:', error);
      // Don't throw - this should not break the game flow
      return false;
    }
  }, []);

  /**
   * Helper to convert lamports to SOL and report
   */
  const reportGameResultFromLamports = useCallback(async (
    walletAddress: string,
    transactionSignature: string,
    gameType: 'coinflip' | 'dice' | 'slots',
    betAmountLamports: string | number,
    payoutAmountLamports: string | number,
    isWin: boolean,
    gameData?: any
  ): Promise<boolean> => {
    const betAmount = Number(betAmountLamports) / LAMPORTS_PER_SOL;
    const payoutAmount = Number(payoutAmountLamports) / LAMPORTS_PER_SOL;

    return reportGameResult({
      walletAddress,
      transactionSignature,
      gameType,
      betAmount,
      payoutAmount,
      isWin,
      gameData,
    });
  }, [reportGameResult]);

  return {
    reportGameResult,
    reportGameResultFromLamports,
  };
}








