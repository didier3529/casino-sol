import { FC, useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { formatLamportsToSol } from '../utils/format';
import { NETWORK } from '../utils/constants';
import { useFulfillRandomness } from '../hooks/useFulfillRandomness';
import { useClaimPayout } from '../hooks/useClaimPayout';
import { useCasino } from '../hooks/useCasino';
import toast from 'react-hot-toast';

interface GameRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  step: 'submitting' | 'flipping' | 'result';
  betAmount: string; // lamports as string
  choice: number; // Game-specific: CoinFlip(0/1), Dice(2-12), Slots(0)
  betTxSignature?: string;
  result?: {
    outcome: number; // Game-specific outcome
    isWin: boolean;
    payout: string; // lamports as string
    payoutClaimed: boolean; // Whether the payout has been claimed
  };
  resolveTxSignature?: string;
  gameType?: 'coinflip' | 'dice' | 'slots'; // Default coinflip for backward compat
  sessionPubkey?: string;
  playerPubkey?: string;
  onManualResolve?: () => void; // Callback after manual resolve
}

export const GameRoundModal: FC<GameRoundModalProps> = ({
  isOpen,
  onClose,
  step,
  betAmount,
  choice,
  betTxSignature,
  result,
  resolveTxSignature,
  gameType = 'coinflip',
  sessionPubkey,
  playerPubkey,
  onManualResolve,
}) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [stepMessage, setStepMessage] = useState('');
  const wallet = useWallet();
  const casino = useCasino();
  const { fulfillRandomness, isFulfilling } = useFulfillRandomness();
  const { claimPayout, isClaiming } = useClaimPayout();
  const [isAuthority, setIsAuthority] = useState(false);
  
  // Check if connected wallet is casino authority
  useEffect(() => {
    const checkAuthority = async () => {
      if (!wallet.publicKey || !casino.program) {
        setIsAuthority(false);
        return;
      }
      
      try {
        const casinoAccount = await casino.fetchCasino();
        if (casinoAccount && casinoAccount.authority.toBase58() === wallet.publicKey.toBase58()) {
          setIsAuthority(true);
        } else {
          setIsAuthority(false);
        }
      } catch (error) {
        setIsAuthority(false);
      }
    };
    
    checkAuthority();
  }, [wallet.publicKey, casino.program]);

  useEffect(() => {
    if (step === 'submitting') {
      setStepMessage('Please confirm in your wallet');
    } else if (step === 'flipping') {
      setShowAnimation(true);
      setStepMessage('Casino is settling your round...');
    } else if (step === 'result') {
      setStepMessage('');
    }
  }, [step]);
  
  // Handler for manual resolve (authority-only)
  const handleManualResolve = async () => {
    if (!sessionPubkey || !playerPubkey) {
      toast.error('Session information missing');
      return;
    }
    
    try {
      const sessionPk = new PublicKey(sessionPubkey);
      const playerPk = new PublicKey(playerPubkey);
      
      const result = await fulfillRandomness(sessionPk, playerPk);
      if (result) {
        toast.success('Session manually resolved!');
        // Trigger callback to refresh session data
        if (onManualResolve) {
          onManualResolve();
        }
      }
    } catch (error: any) {
      console.error('Manual resolve error:', error);
      toast.error(error.message || 'Failed to resolve session');
    }
  };

  // Handler for player claiming winnings  
  const handleClaimWinnings = async () => {
    if (!sessionPubkey || !playerPubkey || !result) {
      toast.error('Session or result information missing');
      return;
    }
    
    try {
      const sessionPk = new PublicKey(sessionPubkey);
      const playerPk = new PublicKey(playerPubkey);
      
      toast.loading('Claiming your winnings...', { id: 'claim-tx' });
      
      const tx = await claimPayout(sessionPk, playerPk);
      
      toast.success(`💰 ${payoutSol} SOL claimed! 🎉`, { id: 'claim-tx' });
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('Claim winnings error:', error);
      toast.error(error.message || 'Failed to claim winnings', { id: 'claim-tx' });
    }
  };

  // Game-specific display helpers
  const getGameIcon = () => {
    if (gameType === 'dice') return '🎲';
    if (gameType === 'slots') return '🎰';
    return '🪙';
  };

  const getChoiceDisplay = () => {
    if (gameType === 'coinflip') return choice === 0 ? 'Heads' : 'Tails';
    if (gameType === 'dice') return `Target: ${choice}`;
    return 'Auto-spin';
  };

  const getOutcomeDisplay = () => {
    if (!result) return '';
    if (gameType === 'coinflip') return result.outcome === 0 ? 'Heads' : 'Tails';
    if (gameType === 'dice') return `Rolled: ${result.outcome}`;
    if (gameType === 'slots') {
      // Decode slots outcome (packed as reel1*100 + reel2*10 + reel3)
      const reel1 = Math.floor(result.outcome / 100);
      const reel2 = Math.floor((result.outcome % 100) / 10);
      const reel3 = result.outcome % 10;
      return `${reel1}-${reel2}-${reel3}`;
    }
    return '';
  };

  if (!isOpen) return null;

  const betAmountSol = formatLamportsToSol(betAmount);
  const payoutSol = result ? formatLamportsToSol(result.payout) : '0';
  const netResultLamports = result ? BigInt(result.payout) - BigInt(betAmount) : BigInt(0);
  const netResultSol = formatLamportsToSol(netResultLamports.toString());
  
  const getExplorerUrl = (signature: string) => {
    const cluster = NETWORK === 'devnet' ? 'devnet' : '';
    return `https://explorer.solana.com/tx/${signature}${cluster ? `?cluster=${cluster}` : ''}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
        
        {/* Step 1: Bet Submitted */}
        {step === 'submitting' && (
          <div className="text-center">
            <div className="mb-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
            </div>
            <h2 className="text-2xl font-bold mb-4">Submitting Bet...</h2>
            <p className="text-gray-600 mb-4">
              Bet: <span className="font-bold">{betAmountSol} SOL</span> on{' '}
              <span className="font-bold">{getGameIcon()} {getChoiceDisplay()}</span>
            </p>
            <p className="text-sm text-gray-500">Please confirm in your wallet</p>
          </div>
        )}

        {/* Step 2: Game in Progress */}
        {step === 'flipping' && (
          <div className="text-center">
            <div className="mb-4">
              <div className={`text-6xl ${showAnimation ? 'animate-bounce' : ''}`}>
                {getGameIcon()}
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-4">
              {gameType === 'dice' ? 'Rolling Dice...' : gameType === 'slots' ? 'Spinning...' : 'Flipping Coin...'}
            </h2>
            <p className="text-gray-600 mb-4">
              Your bet: <span className="font-bold">{betAmountSol} SOL</span>
            </p>
            {betTxSignature && (
              <a
                href={getExplorerUrl(betTxSignature)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline block mb-3"
              >
                View bet transaction →
              </a>
            )}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm text-gray-600">{stepMessage}</span>
              </div>
              <p className="text-xs text-gray-400">No wallet popup needed (relayer settles on-chain)</p>
            </div>

            <div className="mt-6 space-y-3">
              {/* Authority-only: Manual Resolve Button */}
              {isAuthority && sessionPubkey && playerPubkey && (
                <button
                  onClick={handleManualResolve}
                  disabled={isFulfilling}
                  className="w-full py-2 px-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  {isFulfilling ? 'Resolving...' : '🔐 Resolve now (Authority)'}
                </button>
              )}
              
              {/* Stop Waiting Button */}
              <button
                onClick={onClose}
                className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Stop waiting
              </button>
              
              <p className="text-xs text-gray-400">
                {isAuthority 
                  ? 'As casino authority, you can manually resolve if the relayer is down.'
                  : 'Relayer settles automatically. Check Session List if this times out.'}
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 'result' && result && (
          <div className="text-center">
            <div className="mb-4">
              <div className={`text-6xl ${result.isWin ? 'animate-bounce' : ''}`}>
                {result.isWin ? '🎉' : '😔'}
              </div>
            </div>
            
            {/* Win/Loss Message */}
            <h2 className={`text-3xl font-bold mb-4 ${result.isWin ? 'text-green-600' : 'text-red-600'}`}>
              {result.isWin ? 'Congratulations!' : 'Sorry, you lost'}
            </h2>
            
            {/* Outcome */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                {gameType === 'dice' ? 'Dice result:' : gameType === 'slots' ? 'Reels:' : 'The coin landed on:'}
              </p>
              <p className="text-2xl font-bold">
                {getGameIcon()} {getOutcomeDisplay()}
              </p>
              {gameType !== 'slots' && (
                <p className="text-sm text-gray-500 mt-2">
                  You chose: {getChoiceDisplay()}
                </p>
              )}
            </div>

            {/* Money Flow */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <h3 className="font-bold text-gray-700 mb-3">Money Flow</h3>
              
              <div className="space-y-2 text-left">
                {/* You paid */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">You paid:</span>
                  <span className="font-bold text-red-600">-{betAmountSol} SOL</span>
                </div>
                
                {/* You received */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">You received:</span>
                  <span className={`font-bold ${result.isWin ? 'text-green-600' : 'text-gray-400'}`}>
                    +{payoutSol} SOL
                  </span>
                </div>
                
                {/* Net result */}
                <div className="pt-2 border-t border-blue-300">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-700">Net Result:</span>
                    <span className={`font-bold text-lg ${netResultLamports >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {netResultLamports >= 0 ? '+' : ''}{netResultSol} SOL
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Links */}
            <div className="space-y-2 mb-6">
              {betTxSignature && (
                <a
                  href={getExplorerUrl(betTxSignature)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-blue-500 hover:underline"
                >
                  📝 View bet transaction
                </a>
              )}
              {resolveTxSignature && (
                <a
                  href={getExplorerUrl(resolveTxSignature)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-green-500 hover:underline"
                >
                  ✅ View resolve transaction
                </a>
              )}
            </div>

            {/* Action Button */}
            {result.isWin ? (
              <div className="space-y-3">
                {!result.payoutClaimed ? (
                  <>
                    <button
                      onClick={handleClaimWinnings}
                      disabled={isClaiming}
                      className="w-full py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isClaiming ? 'Claiming...' : '💰 Claim Winnings'}
                    </button>
                    <p className="text-xs text-gray-500">
                      Click to sign transaction and claim your winnings
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-full py-3 bg-gray-200 text-gray-600 rounded-lg font-semibold text-center">
                      ✓ Winnings Claimed
                    </div>
                    <button
                      onClick={onClose}
                      className="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                    >
                      Play Again
                    </button>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={onClose}
                className="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
              >
                Play Again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

