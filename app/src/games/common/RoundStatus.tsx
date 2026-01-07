/**
 * Reusable inline status for game rounds
 * Replaces the blocking GameRoundModal for all games
 */

import { FC, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ExternalLink, X, Share2 } from 'lucide-react';
import { PublicKey } from '@solana/web3.js';
import toast from 'react-hot-toast';
import { formatLamportsToSol } from '../../utils/format';
import { NETWORK } from '../../utils/constants';
import { useClaimPayout } from '../../hooks/useClaimPayout';

interface RoundStatusProps {
  step: 'submitting' | 'flipping' | 'result';
  betAmount: string; // lamports as string
  betTxSignature?: string;
  result?: {
    outcome: number;
    isWin: boolean;
    payout: string; // lamports as string
    payoutClaimed?: boolean;
  };
  onStopWaiting: () => void;
  isAuthority?: boolean;
  onManualResolve?: () => void;
  isFulfilling?: boolean;
  sessionPubkey?: string;
  playerPubkey?: string;
  gameType?: 'coinflip' | 'dice' | 'slots';
}

export const RoundStatus: FC<RoundStatusProps> = ({
  step,
  betAmount,
  betTxSignature,
  result,
  onStopWaiting,
  isAuthority,
  onManualResolve,
  isFulfilling,
  sessionPubkey,
  playerPubkey,
  gameType = 'coinflip',
}) => {
  const { claimPayout, isClaiming } = useClaimPayout();
  const [claimSuccess, setClaimSuccess] = useState(false);

  const betAmountSol = formatLamportsToSol(betAmount);
  const payoutSol = result ? formatLamportsToSol(result.payout) : '0';
  const netResultLamports = result ? BigInt(result.payout) - BigInt(betAmount) : BigInt(0);
  const netResultSol = formatLamportsToSol(netResultLamports.toString());

  const getExplorerUrl = (signature: string) => {
    const cluster = NETWORK === 'devnet' ? 'devnet' : '';
    return `https://explorer.solana.com/tx/${signature}${cluster ? `?cluster=${cluster}` : ''}`;
  };

  const shareOnX = () => {
    if (!result) return;
    const gameName = gameType === 'coinflip' ? 'CoinFlip' : gameType === 'dice' ? 'Dice' : 'Slots';
    const resultText = result.isWin 
      ? `Just won ${payoutSol} SOL playing ${gameName} on SOL VEGAS! 🎰`
      : `Tried my luck on SOL VEGAS ${gameName}. The house won this time, but I'll be back! 🎲`;
    const hashtags = 'SOLVEGAS,Solana,CasinoGaming';
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(resultText)}&hashtags=${hashtags}`;
    window.open(tweetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleClaimWinnings = async () => {
    if (!sessionPubkey || !playerPubkey || !result) {
      toast.error('Session or result information missing');
      return;
    }

    try {
      const sessionPk = new PublicKey(sessionPubkey);
      const playerPk = new PublicKey(playerPubkey);

      toast.loading('Claiming your winnings...', { id: 'claim-tx' });

      await claimPayout(sessionPk, playerPk);

      toast.success(`💰 ${payoutSol} SOL claimed! 🎉`, { id: 'claim-tx' });
      setClaimSuccess(true);

      // Callback to parent to refresh data
      setTimeout(() => {
        onStopWaiting();
      }, 1500);
    } catch (error: any) {
      console.error('Claim winnings error:', error);
      toast.error(error.message || 'Failed to claim winnings', { id: 'claim-tx' });
    }
  };

  return (
    <AnimatePresence>
      {step !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="glass-effect rounded-xl p-4 border border-[var(--border)] mt-4"
        >
          {/* Submitting */}
          {step === 'submitting' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-[var(--accent)] animate-spin" />
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">
                    Confirm in your wallet
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Betting {betAmountSol} SOL
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Flipping/Settling */}
          {step === 'flipping' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-[var(--accent)] animate-spin" />
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">
                      Casino is settling your round...
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Bet: {betAmountSol} SOL • Relayer settles automatically
                    </p>
                  </div>
                </div>
                <button
                  onClick={onStopWaiting}
                  className="glass-effect p-2 rounded-lg hover:border-[var(--error)] transition-all"
                  title="Stop waiting"
                >
                  <X className="w-4 h-4 text-[var(--text-secondary)]" />
                </button>
              </div>

              {betTxSignature && (
                <a
                  href={getExplorerUrl(betTxSignature)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  View bet transaction
                </a>
              )}

              {/* Authority manual resolve */}
              {isAuthority && onManualResolve && (
                <button
                  onClick={onManualResolve}
                  disabled={isFulfilling}
                  className="w-full py-2 px-4 glass-effect rounded-lg hover:border-[var(--accent)] transition-all text-xs font-semibold text-[var(--text-primary)] disabled:opacity-50"
                >
                  {isFulfilling ? 'Resolving...' : '🔐 Resolve now (Authority)'}
                </button>
              )}
            </div>
          )}

          {/* Result */}
          {step === 'result' && result && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-lg font-bold ${result.isWin ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                    {result.isWin ? '🎉 You Won!' : '😔 You Lost'}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Bet: {betAmountSol} SOL • Payout: {payoutSol} SOL
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[var(--text-secondary)]">Net Result</p>
                  <p className={`text-xl font-bold ${netResultLamports >= 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                    {netResultLamports >= 0 ? '+' : ''}{netResultSol} SOL
                  </p>
                </div>
              </div>

              {betTxSignature && (
                <div className="flex items-center justify-between">
                  <a
                    href={getExplorerUrl(betTxSignature)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View transaction
                  </a>
                  <button
                    onClick={shareOnX}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-display transition-all"
                  >
                    <Share2 className="w-3 h-3" />
                    Share on X
                  </button>
                </div>
              )}

              {/* Claim Winnings for wins that haven't been claimed */}
              {result.isWin && result.payoutClaimed === false && !claimSuccess ? (
                <div className="space-y-2">
                  <button
                    onClick={handleClaimWinnings}
                    disabled={isClaiming}
                    className="w-full py-3 px-4 bg-gradient-to-r from-[var(--success)] to-[var(--success-glow)] text-white rounded-lg font-bold hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {isClaiming ? 'Claiming...' : '💰 Claim Winnings'}
                  </button>
                  <p className="text-xs text-center text-[var(--text-secondary)]">
                    Click to sign transaction and claim your winnings
                  </p>
                </div>
              ) : (
                <button
                  onClick={onStopWaiting}
                  className="w-full py-2 px-4 bg-gradient-to-r from-[var(--accent)] to-[var(--secondary)] text-white rounded-lg font-semibold hover:opacity-90 transition-all"
                >
                  Play Again
                </button>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};






