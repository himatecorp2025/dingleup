import backMusic from '@/assets/backmusic.mp3';

/**
 * Singleton AudioManager - handles global background music
 * Ensures single source of truth for audio state
 * A1-A5 COMPLIANCE: Runtime detektor + singleton enforcement
 * Uses Web Audio API for precise volume control
 */
class AudioManager {
  private static _instance: AudioManager | null = null;
  private bgm: HTMLAudioElement;
  private audioCtx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private _enabled: boolean = true;
  private _volume: number = 0.03; // 3% default

  private constructor() {
    // Note: Multiple audio systems can coexist (BackgroundMusic for DingleUP + AudioManager for game)
    // Track only AudioManager instances, not all Audio elements
    if ((window as any).__AUDIO_MANAGER_INSTANCES__ >= 1) {
      console.warn('[AudioManager] AudioManager instance already exists, using existing instance');
      return;
    }
    (window as any).__AUDIO_MANAGER_INSTANCES__ = ((window as any).__AUDIO_MANAGER_INSTANCES__ || 0) + 1;

    this.bgm = new Audio(backMusic);
    this.bgm.loop = true;
    this.bgm.volume = 0; // Start silent, gain controls loudness

    // Initialize Web Audio API
    this.initWebAudio();

    // Store reference globally for debugging
    if (typeof window !== 'undefined') {
      (window as any).__bgm = this.bgm;
    }

    console.log('[AudioManager] Initialized with Web Audio API', { 
      volume: this._volume, 
      enabled: this._enabled, 
      instances: (window as any).__AUDIO_MANAGER_INSTANCES__,
      percentage: `${Math.round(this._volume * 100)}%`
    });
  }

  private initWebAudio(): void {
    try {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) {
        console.warn('[AudioManager] Web Audio API not supported');
        return;
      }

      this.audioCtx = new AC();
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = this._volume;

      this.sourceNode = this.audioCtx.createMediaElementSource(this.bgm);
      this.sourceNode.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);

      // Unlock AudioContext on user interaction
      const unlock = async () => {
        if (this.audioCtx?.state === 'suspended') {
          try {
            await this.audioCtx.resume();
            console.log('[AudioManager] AudioContext resumed');
          } catch (e) {
            console.log('[AudioManager] Failed to resume AudioContext', e);
          }
        }
      };

      document.addEventListener('pointerdown', unlock, { once: true });
      document.addEventListener('touchstart', unlock, { once: true });
      document.addEventListener('click', unlock, { once: true });

      console.log('[AudioManager] WebAudio graph initialized');
    } catch (err) {
      console.error('[AudioManager] WebAudio init failed', err);
    }
  }

  static getInstance(): AudioManager {
    if (!AudioManager._instance) {
      AudioManager._instance = new AudioManager();
    }
    return AudioManager._instance;
  }

  /**
   * Apply settings from store
   */
  apply(enabled: boolean, volume: number): void {
    this._enabled = enabled;
    this._volume = Math.max(0, Math.min(1, volume));
    
    // Update gain node instead of audio element volume
    if (this.gainNode) {
      this.gainNode.gain.value = this._volume;
    }
    this.bgm.volume = 1; // Keep element at full, gain controls loudness

    console.log('[AudioManager] Apply settings', { 
      enabled, 
      volume: this._volume,
      percentage: `${Math.round(this._volume * 100)}%`
    });

    // Ensure AudioContext is running
    if (enabled && this._volume > 0 && this.audioCtx?.state === 'suspended') {
      this.audioCtx.resume().catch((e) => {
        console.log('[AudioManager] AudioContext resume blocked', e);
      });
    }

    if (enabled && this._volume > 0) {
      this.safePlay();
    } else {
      this.bgm.pause();
    }
  }

  /**
   * Safe play with autoplay policy handling
   */
  private async safePlay(): Promise<void> {
    if (this.bgm.paused) {
      try {
        await this.bgm.play();
        console.log('[AudioManager] Playing');
      } catch (err) {
        console.log('[AudioManager] Play blocked (autoplay policy)', err);
      }
    }
  }

  /**
   * Get current state
   */
  getState(): { enabled: boolean; volume: number; paused: boolean } {
    return {
      enabled: this._enabled,
      volume: this._volume,
      paused: this.bgm.paused
    };
  }
}

export default AudioManager;
