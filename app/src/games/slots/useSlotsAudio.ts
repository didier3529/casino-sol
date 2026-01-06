/**
 * Slots-specific audio hook
 * Manages sound effects for slot machine gameplay
 */

import { useEffect, useRef } from 'react';
import { audioManager } from '../../audio/audioManager';

interface UseSlotsAudioProps {
  isSpinning: boolean;
  isWin?: boolean;
  isJackpot?: boolean;
}

export const useSlotsAudio = ({ isSpinning, isWin, isJackpot }: UseSlotsAudioProps) => {
  const prevSpinningRef = useRef(isSpinning);
  const prevWinRef = useRef(isWin);

  useEffect(() => {
    // Initialize audio on first user interaction
    const initAudio = () => {
      audioManager.init();
      document.removeEventListener('click', initAudio);
    };
    document.addEventListener('click', initAudio);

    return () => {
      document.removeEventListener('click', initAudio);
    };
  }, []);

  useEffect(() => {
    const wasSpinning = prevSpinningRef.current;
    const wasWin = prevWinRef.current;

    // Start spinning sound
    if (isSpinning && !wasSpinning) {
      audioManager.play('spin');
    }

    // Stop spinning sound
    if (!isSpinning && wasSpinning) {
      audioManager.stop('spin');
      audioManager.play('stop');
    }

    // Play win/lose sounds
    if (!isSpinning && wasSpinning && isWin !== undefined && isWin !== wasWin) {
      if (isWin) {
        if (isJackpot) {
          audioManager.play('win-jackpot');
        } else {
          audioManager.play('win-big');
        }
      } else {
        audioManager.play('lose');
      }
    }

    prevSpinningRef.current = isSpinning;
    prevWinRef.current = isWin;
  }, [isSpinning, isWin, isJackpot]);

  return {
    playClick: () => audioManager.play('click'),
  };
};
