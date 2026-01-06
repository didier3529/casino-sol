/**
 * Dice animated view
 * Shows dice roll animation with result
 */

import { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';

interface DiceViewProps {
  isRolling: boolean;
  target: number; // 2-12
  result?: number; // Final outcome
  isWin?: boolean;
}

export const DiceView: FC<DiceViewProps> = ({
  isRolling,
  target,
  result,
  isWin,
}) => {
  const [displayNumber, setDisplayNumber] = useState<number>(target);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (isRolling) {
      setShowResult(false);
      // Animate random numbers while rolling
      const interval = setInterval(() => {
        setDisplayNumber(Math.floor(Math.random() * 11) + 2); // 2-12
      }, 100);
      return () => clearInterval(interval);
    } else if (result !== undefined) {
      setDisplayNumber(result);
      setTimeout(() => setShowResult(true), 500);
    }
  }, [isRolling, result]);

  const getDiceEmoji = (num: number) => {
    // Map numbers 2-12 to dice representations
    const dice = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    if (num <= 6) return dice[num - 1];
    // For 7-12, show two dice
    return '🎲';
  };

  return (
    <div className="relative">
      {/* Dice Frame */}
      <div className="glass-effect rounded-2xl p-8 border-4 border-[var(--secondary)]">
        {/* Target Number */}
        <div className="text-center mb-6">
          <p className="text-sm text-[var(--text-secondary)] mb-2">Target Number</p>
          <div className="inline-flex items-center gap-3 glass-effect px-6 py-3 rounded-xl">
            <span className="text-3xl">🎯</span>
            <span className="text-xl font-bold text-[var(--text-primary)]">{target}</span>
          </div>
        </div>

        {/* Dice Animation Area */}
        <div className="flex items-center justify-center h-48 relative">
          <AnimatePresence mode="wait">
            {isRolling ? (
              <motion.div
                key="rolling"
                className="text-8xl"
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 0.3,
                  repeat: Infinity,
                }}
              >
                🎲
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="text-center"
              >
                <div className={`text-8xl mb-4 ${showResult && isWin ? 'animate-pulse-glow' : ''}`}>
                  {displayNumber}
                </div>
                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-bold"
                    style={{ color: isWin ? 'var(--success)' : 'var(--error)' }}
                  >
                    {isWin ? 'Match!' : 'No Match'}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 glass-effect px-4 py-2 rounded-lg">
            <Trophy className="w-4 h-4 text-[var(--secondary)]" />
            <span className="text-sm text-[var(--text-secondary)]">
              Match the roll to win up to <span className="text-[var(--secondary)] font-bold">36x</span>
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


