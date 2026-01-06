/**
 * CoinFlip animated view
 * Shows coin flip animation with result
 */

import { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';

interface CoinFlipViewProps {
  isFlipping: boolean;
  choice: 0 | 1; // 0 = Heads, 1 = Tails
  result?: number; // Final outcome
  isWin?: boolean;
}

export const CoinFlipView: FC<CoinFlipViewProps> = ({
  isFlipping,
  choice,
  result,
  isWin,
}) => {
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (!isFlipping && result !== undefined) {
      // Show result after flip animation
      setTimeout(() => setShowResult(true), 500);
    } else if (isFlipping) {
      setShowResult(false);
    }
  }, [isFlipping, result]);

  const getChoiceDisplay = (val: number) => {
    return val === 0 ? { emoji: '🪙', text: 'Heads' } : { emoji: '🎯', text: 'Tails' };
  };

  const choiceDisplay = getChoiceDisplay(choice);
  const resultDisplay = result !== undefined ? getChoiceDisplay(result) : null;

  return (
    <div className="relative">
      {/* Coin Frame */}
      <div className="glass-effect rounded-2xl p-8 border-4 border-[var(--accent)]">
        {/* Your Choice */}
        <div className="text-center mb-6">
          <p className="text-sm text-[var(--text-secondary)] mb-2">Your Choice</p>
          <div className="inline-flex items-center gap-3 glass-effect px-6 py-3 rounded-xl">
            <span className="text-3xl">{choiceDisplay.emoji}</span>
            <span className="text-xl font-bold text-[var(--text-primary)]">{choiceDisplay.text}</span>
          </div>
        </div>

        {/* Coin Animation Area */}
        <div className="flex items-center justify-center h-48 relative">
          <AnimatePresence mode="wait">
            {isFlipping ? (
              <motion.div
                key="flipping"
                className="text-8xl"
                animate={{
                  rotateY: [0, 360],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                🪙
              </motion.div>
            ) : resultDisplay ? (
              <motion.div
                key="result"
                initial={{ scale: 0, rotateY: 180 }}
                animate={{ scale: 1, rotateY: 0 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="text-center"
              >
                <div className={`text-8xl mb-4 ${showResult && isWin ? 'animate-pulse-glow' : ''}`}>
                  {resultDisplay.emoji}
                </div>
                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-bold"
                    style={{ color: isWin ? 'var(--success)' : 'var(--error)' }}
                  >
                    {resultDisplay.text}
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                className="text-8xl"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🪙
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 glass-effect px-4 py-2 rounded-lg">
            <Trophy className="w-4 h-4 text-[var(--accent)]" />
            <span className="text-sm text-[var(--text-secondary)]">
              Win = <span className="text-[var(--accent)] font-bold">1.96x</span> payout
            </span>
          </div>
        </div>
      </div>

      {/* Win Overlay */}
      <AnimatePresence>
        {showResult && isWin && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="glass-effect rounded-2xl p-6 border-4 border-[var(--success)]">
              <div className="text-center">
                <motion.div
                  className="text-5xl mb-2"
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                >
                  🎉
                </motion.div>
                <h2 className="text-3xl font-bold text-[var(--success)]">
                  You Win!
                </h2>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};






