/**
 * Audio Toggle Component
 * Allows users to mute/unmute and adjust volume
 */

import { FC, useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { audioManager } from '../audio/audioManager';

export const AudioToggle: FC = () => {
  const [isMuted, setIsMuted] = useState(audioManager.isMutedState());
  const [volume, setVolume] = useState(audioManager.getVolume());
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  useEffect(() => {
    // Initialize audio manager on mount
    audioManager.init();
  }, []);

  const handleToggleMute = () => {
    const newMuted = audioManager.toggleMute();
    setIsMuted(newMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioManager.setVolume(newVolume);
    
    // Unmute if volume is changed
    if (isMuted && newVolume > 0) {
      audioManager.toggleMute();
      setIsMuted(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* Mute/Unmute Button */}
        <button
          onClick={handleToggleMute}
          className="glass-effect p-3 rounded-xl hover:border-[var(--accent)] transition-all duration-300 group"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--accent)]" />
          ) : (
            <Volume2 className="w-5 h-5 text-[var(--accent)] group-hover:text-[var(--accent-hover)]" />
          )}
        </button>

        {/* Volume Slider (shown on hover) */}
        <div
          className="relative"
          onMouseEnter={() => setShowVolumeSlider(true)}
          onMouseLeave={() => setShowVolumeSlider(false)}
        >
          <button
            className="glass-effect px-4 py-3 rounded-xl hover:border-[var(--accent)] transition-all duration-300 text-xs text-[var(--text-secondary)]"
          >
            {Math.round(volume * 100)}%
          </button>

          {showVolumeSlider && (
            <div className="absolute top-full mt-2 left-0 glass-effect p-4 rounded-xl border border-[var(--border)] z-50 min-w-[200px]">
              <label className="block text-xs text-[var(--text-secondary)] mb-2">
                Volume
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full accent-[var(--accent)]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};






