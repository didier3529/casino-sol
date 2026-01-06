/**
 * Audio Manager for Casino Games
 * Handles sound effects and background music with user-gesture unlock
 */

import { Howl } from 'howler';

type SoundType = 'click' | 'spin' | 'stop' | 'win-small' | 'win-big' | 'win-jackpot' | 'lose';

class AudioManager {
  private sounds: Map<SoundType, Howl> = new Map();
  private isInitialized = false;
  private isMuted = false;
  private volume = 0.5;

  constructor() {
    // Check localStorage for saved preferences
    const savedMuted = localStorage.getItem('casino-audio-muted');
    const savedVolume = localStorage.getItem('casino-audio-volume');
    
    if (savedMuted !== null) {
      this.isMuted = savedMuted === 'true';
    }
    
    if (savedVolume !== null) {
      this.volume = parseFloat(savedVolume);
    }
  }

  /**
   * Initialize audio system (must be called after user gesture)
   */
  init() {
    if (this.isInitialized) return;

    // For now, we'll use placeholder sounds (beep tones)
    // In production, replace with actual audio files from /assets/audio/
    
    // Note: Since we don't have actual audio files yet, we'll create silent placeholders
    // that can be replaced when audio assets are added
    
    this.sounds.set('click', new Howl({
      src: ['/assets/audio/click.mp3'],
      volume: this.volume * 0.3,
      onloaderror: () => console.warn('Audio file not found: click.mp3'),
    }));

    this.sounds.set('spin', new Howl({
      src: ['/assets/audio/spin-loop.mp3'],
      volume: this.volume * 0.4,
      loop: true,
      onloaderror: () => console.warn('Audio file not found: spin-loop.mp3'),
    }));

    this.sounds.set('stop', new Howl({
      src: ['/assets/audio/spin-stop.mp3'],
      volume: this.volume * 0.5,
      onloaderror: () => console.warn('Audio file not found: spin-stop.mp3'),
    }));

    this.sounds.set('win-small', new Howl({
      src: ['/assets/audio/win-small.mp3'],
      volume: this.volume * 0.6,
      onloaderror: () => console.warn('Audio file not found: win-small.mp3'),
    }));

    this.sounds.set('win-big', new Howl({
      src: ['/assets/audio/win-big.mp3'],
      volume: this.volume * 0.7,
      onloaderror: () => console.warn('Audio file not found: win-big.mp3'),
    }));

    this.sounds.set('win-jackpot', new Howl({
      src: ['/assets/audio/win-jackpot.mp3'],
      volume: this.volume * 0.8,
      onloaderror: () => console.warn('Audio file not found: win-jackpot.mp3'),
    }));

    this.sounds.set('lose', new Howl({
      src: ['/assets/audio/coin-drop.mp3'],
      volume: this.volume * 0.4,
      onloaderror: () => console.warn('Audio file not found: coin-drop.mp3'),
    }));

    this.isInitialized = true;
    console.log('🔊 Audio Manager initialized');
  }

  /**
   * Play a sound effect
   */
  play(soundType: SoundType) {
    if (!this.isInitialized) {
      this.init();
    }

    if (this.isMuted) return;

    const sound = this.sounds.get(soundType);
    if (sound) {
      sound.play();
    }
  }

  /**
   * Stop a sound effect
   */
  stop(soundType: SoundType) {
    const sound = this.sounds.get(soundType);
    if (sound) {
      sound.stop();
    }
  }

  /**
   * Stop all sounds
   */
  stopAll() {
    this.sounds.forEach(sound => sound.stop());
  }

  /**
   * Toggle mute
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('casino-audio-muted', this.isMuted.toString());
    
    if (this.isMuted) {
      this.stopAll();
    }
    
    return this.isMuted;
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('casino-audio-volume', this.volume.toString());
    
    // Update all sound volumes
    this.sounds.forEach((sound, type) => {
      const baseVolume = this.getBaseVolume(type);
      sound.volume(this.volume * baseVolume);
    });
  }

  /**
   * Get base volume for a sound type
   */
  private getBaseVolume(type: SoundType): number {
    const volumes: Record<SoundType, number> = {
      'click': 0.3,
      'spin': 0.4,
      'stop': 0.5,
      'win-small': 0.6,
      'win-big': 0.7,
      'win-jackpot': 0.8,
      'lose': 0.4,
    };
    return volumes[type] || 0.5;
  }

  /**
   * Get current mute state
   */
  isMutedState() {
    return this.isMuted;
  }

  /**
   * Get current volume
   */
  getVolume() {
    return this.volume;
  }
}

// Singleton instance
export const audioManager = new AudioManager();











