import backMusic from '@/assets/backmusic.mp3';

/**
 * Singleton AudioManager - handles global background music
 * Ensures single source of truth for audio state
 */
class AudioManager {
  private static _instance: AudioManager | null = null;
  private bgm: HTMLAudioElement;
  private _enabled: boolean = true;
  private _volume: number = 0.3;

  private constructor() {
    this.bgm = new Audio(backMusic);
    this.bgm.loop = true;
    this.bgm.volume = this._volume;

    // Store reference globally for debugging
    if (typeof window !== 'undefined') {
      (window as any).__bgm = this.bgm;
    }

    console.log('[AudioManager] Initialized', { volume: this._volume, enabled: this._enabled });
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
    this.bgm.volume = this._volume;

    console.log('[AudioManager] Apply settings', { enabled, volume: this._volume });

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
