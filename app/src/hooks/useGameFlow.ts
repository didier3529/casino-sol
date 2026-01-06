import { useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import toast from 'react-hot-toast';
import { useBet } from './useBet';
import { useCasino } from './useCasino';

export type GameType = 'coinflip' | 'dice' | 'slots';

export type GameFlowStep = 'submitting' | 'settling' | 'result';

export interface GameResult {
  outcome: any; // Game-specific outcome (e.g., coin side, dice number, slot symbols)
  isWin: boolean;
  payout: string; // lamports as string
}

export interface GameFlowState {
  step: GameFlowStep;
  betAmount: string; // lamports as string
  gameData: any; // Game-specific data (e.g., choice for coinflip, target for dice)
  betTxSignature?: string;
  sessionPubkey?: string;
  result?: GameResult;
  resolveTxSignature?: string;
}

/**
 * Generic hook for managing game flow across all casino games
 * Handles: bet submission → settlement polling → result display
 */
export function useGameFlow(gameType: GameType) {
  const { placeBet, fetchSessions } = useBet();
  const [isPlaying, setIsPlaying] = useState(false);
  const [flowState, setFlowState] = useState<GameFlowState>({
    step: 'submitting',
    betAmount: '0',
    gameData: {},
  });

  /**
   * Start a new game round
   * @param betAmountLamports - Bet amount as BN
   * @param gameData - Game-specific data (choice, target, etc.)
   */
  const startRound = async (
    betAmountLamports: BN,
    gameData: any
  ): Promise<boolean> => {
    setIsPlaying(true);
    setFlowState({
      step: 'submitting',
      betAmount: betAmountLamports.toString(),
      gameData,
    });

    try {
      // Place bet (game-specific logic will be in placeBet based on gameType)
      const betResult = await placeBet(gameData.choice || 0, betAmountLamports);
      
      if (!betResult) {
        setIsPlaying(false);
        return false;
      }

      // Move to settling step
      setFlowState(prev => ({
        ...prev,
        step: 'settling',
        betTxSignature: betResult.betTx,
        sessionPubkey: betResult.sessionPda,
      }));

      // Poll for result (relayer will settle in the background)
      const result = await pollForResult(betResult.sessionPda, betAmountLamports.toString());
      
      if (result) {
        setFlowState(prev => ({
          ...prev,
          step: 'result',
          result: result.gameResult,
          resolveTxSignature: result.resolveTx,
        }));
        return true;
      } else {
        toast.error('Could not fetch game result. Check sessions list.');
        setIsPlaying(false);
        return false;
      }
    } catch (error) {
      console.error('Game flow error:', error);
      setIsPlaying(false);
      return false;
    }
  };

  /**
   * Poll for game result after bet is placed
   * The relayer settles in the background, so we just wait and fetch
   */
  const pollForResult = async (
    sessionPda: string,
    betAmountLamports: string,
    maxAttempts: number = 30,
    intervalMs: number = 2000
  ): Promise<{ gameResult: GameResult; resolveTx: string } | null> => {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      
      try {
        const sessions = await fetchSessions();
        const session = sessions.find((s: any) => s.publicKey === sessionPda);
        
        if (session && session.account.result) {
          console.log('✅ Game settled! Result found:', session.account.result);
          
          return {
            gameResult: {
              outcome: session.account.result.outcome,
              isWin: session.account.result.isWin,
              payout: session.account.result.payout,
            },
            resolveTx: '(settled by relayer)', // We don't track relayer tx in frontend
          };
        }
        
        console.log(`⏳ Polling attempt ${i + 1}/${maxAttempts} - session not settled yet`);
      } catch (error) {
        console.error('Polling error:', error);
      }
    }
    
    console.error('❌ Polling timeout - session not settled');
    return null;
  };

  /**
   * Reset flow for a new round
   */
  const reset = () => {
    setIsPlaying(false);
    setFlowState({
      step: 'submitting',
      betAmount: '0',
      gameData: {},
    });
  };

  return {
    flowState,
    isPlaying,
    startRound,
    reset,
  };
}





