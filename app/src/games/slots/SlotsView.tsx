/**
 * Modern Slots UI with realistic animations
 * Inspired by legacy UltraSlots but rebuilt for current architecture
 */

import { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Zap } from 'lucide-react';
import { SLOT_SYMBOLS, SlotSymbol, getRandomSymbol, outcomeToSymbols, isWinningCombination, getWinMultiplier } from './slotsSymbols';
import { useSlotsAudio } from './useSlotsAudio';

interface SlotsViewProps {
  isSpinning: boolean;
  finalSymbols?: SlotSymbol[];
  onSpinComplete?: () => void;
  betAmount: string;
  isWin?: boolean;
  payout?: string;
}

export const SlotsView: FC<SlotsViewProps> = ({
  isSpinning,
  finalSymbols,
  onSpinComplete,
  betAmount,
  isWin,
  payout,
}) => {
  const [reelSymbols, setReelSymbols] = useState<SlotSymbol[][]>([
    [SLOT_SYMBOLS[0], SLOT_SYMBOLS[1], SLOT_SYMBOLS[2]],
    [SLOT_SYMBOLS[3], SLOT_SYMBOLS[4], SLOT_SYMBOLS[5]],
    [SLOT_SYMBOLS[6], SLOT_SYMBOLS[7], SLOT_SYMBOLS[0]],
  ]);

  const [displaySymbols, setDisplaySymbols] = useState<SlotSymbol[]>([
    SLOT_SYMBOLS[0],
    SLOT_SYMBOLS[1],
    SLOT_SYMBOLS[2],
  ]);

  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [isJackpot, setIsJackpot] = useState(false);

  // Audio effects
  useSlotsAudio({
    isSpinning,
    isWin: isWin && showWinAnimation,
    isJackpot,
  });

  // Spin animation
  useEffect(() => {
    if (isSpinning) {
      setShowWinAnimation(false);
      setIsJackpot(false);

      // Animate reels spinning - update symbols every 100ms
      const spinInterval = setInterval(() => {
        setReelSymbols(prev => prev.map(reel => {
          const newReel = [...reel];
          newReel.push(getRandomSymbol());
          newReel.shift();
          return newReel;
        }));
      }, 100);

      return () => clearInterval(spinInterval);
    } else if (finalSymbols) {
      // Stop spinning and show final symbols
      setDisplaySymbols(finalSymbols);
      
      // Check for win
      if (isWinningCombination(finalSymbols)) {
        const multiplier = getWinMultiplier(finalSymbols);
        setIsJackpot(multiplier >= 15); // Epic or legendary
        setTimeout(() => setShowWinAnimation(true), 500);
      }

      if (onSpinComplete) {
        setTimeout(onSpinComplete, 1000);
      }
    }
  }, [isSpinning, finalSymbols, onSpinComplete]);

  // Get the symbols to display: spinning shows middle reel position, otherwise shows final/display
  const visibleSymbols = isSpinning 
    ? reelSymbols.map(reel => reel[1]) // Show middle symbol of each reel while spinning
    : displaySymbols;

  return (
    <div className="relative">
      {/* Slot Machine Frame */}
      <div className="relative glass-effect rounded-2xl p-8 border-4 border-[var(--gold)]">
        {/* Decorative Top */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[var(--gold)] via-[var(--gold-glow)] to-[var(--gold)] px-8 py-2 rounded-full border-4 border-[var(--background)]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-black" />
            <span className="text-black font-bold text-lg">ULTRA SLOTS</span>
            <Sparkles className="w-5 h-5 text-black" />
          </div>
        </div>

        {/* Reels Container */}
        <div className="bg-gradient-to-br from-[var(--background)] to-[var(--background-secondary)] rounded-xl p-6 border-2 border-[var(--border)] relative overflow-hidden">
          {/* Win Line Indicator */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className={`w-full h-1 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent transition-opacity duration-300 ${showWinAnimation ? 'opacity-100' : 'opacity-0'}`}></div>
          </div>

          {/* Reels */}
          <div className="flex justify-center gap-4">
            {visibleSymbols.map((symbol, index) => (
              <motion.div
                key={`reel-${index}`}
                className="relative"
                initial={false}
                animate={{
                  y: isSpinning ? [0, -20, 0] : 0,
                }}
                transition={{
                  duration: 0.1,
                  repeat: isSpinning ? Infinity : 0,
                  delay: index * 0.1,
                }}
              >
                {/* Reel Frame */}
                <div className={`w-28 h-28 rounded-xl border-4 flex items-center justify-center relative overflow-hidden transition-all duration-300 ${
                  showWinAnimation
                    ? 'border-[var(--gold)] bg-gradient-to-br from-[var(--gold-glow)] to-[var(--background)] shadow-glow-lg'
                    : 'border-[var(--border)] bg-[var(--card)]'
                }`}>
                  {/* Symbol */}
                  <motion.div
                    className="text-6xl"
                    animate={{
                      scale: showWinAnimation ? [1, 1.2, 1] : 1,
                      rotate: showWinAnimation ? [0, 10, -10, 0] : 0,
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: showWinAnimation ? Infinity : 0,
                    }}
                  >
                    {symbol.emoji}
                  </motion.div>

                  {/* Glow effect on win */}
                  {showWinAnimation && (
                    <motion.div
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: `radial-gradient(circle, ${symbol.color}40 0%, transparent 70%)`,
                      }}
                      animate={{
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                      }}
                    />
                  )}
                </div>

                {/* Symbol Name */}
                {/* Symbol Name - only show when not spinning */}
                {!isSpinning && (
                  <div className="text-center mt-2">
                    <span className="text-xs text-[var(--text-secondary)] font-semibold">
                      {symbol.name}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Paytable Info */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 glass-effect px-4 py-2 rounded-lg">
            <Trophy className="w-4 h-4 text-[var(--gold)]" />
            <span className="text-sm text-[var(--text-secondary)]">
              Match 3 symbols to win up to <span className="text-[var(--gold)] font-bold">25x</span>
            </span>
          </div>
        </div>
      </div>

      {/* Win Overlay */}
      <AnimatePresence>
        {showWinAnimation && isWin && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <div className={`${isJackpot ? 'animate-jackpot' : ''}`}>
              <div className="glass-effect rounded-2xl p-8 border-4 border-[var(--gold)] bg-gradient-to-br from-[var(--background)] to-[var(--gold-glow)]">
                <div className="text-center">
                  {isJackpot && (
                    <motion.div
                      className="text-6xl mb-4"
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0],
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                      }}
                    >
                      🎰
                    </motion.div>
                  )}
                  <h2 className="text-4xl font-bold gradient-text mb-2">
                    {isJackpot ? '🎉 JACKPOT! 🎉' : '🎊 YOU WIN! 🎊'}
                  </h2>
                  <div className="flex items-center justify-center gap-2 text-2xl text-[var(--gold)] font-bold">
                    <Zap className="w-6 h-6" />
                    <span>{payout} SOL</span>
                    <Zap className="w-6 h-6" />
                  </div>
                  <div className="mt-2 text-sm text-[var(--text-secondary)]">
                    {getWinMultiplier(displaySymbols)}x multiplier
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confetti particles on jackpot */}
      {isJackpot && showWinAnimation && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: '100%',
                background: ['#ffd700', '#ff6b35', '#00d4ff', '#ff4757'][i % 4],
              }}
              animate={{
                y: [0, -500],
                x: [0, (Math.random() - 0.5) * 200],
                rotate: [0, 360],
                opacity: [1, 0],
              }}
              transition={{
                duration: 2,
                delay: i * 0.1,
                repeat: Infinity,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
