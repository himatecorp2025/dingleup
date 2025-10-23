import { create } from 'zustand';

interface AudioState {
  musicEnabled: boolean;
  volume: number;
  setMusicEnabled: (enabled: boolean) => void;
  setVolume: (vol: number) => void;
  loadSettings: () => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  musicEnabled: true,
  volume: 0.3,
  
  setMusicEnabled: (enabled) => {
    console.log('[AudioStore] Setting music enabled:', enabled);
    set({ musicEnabled: enabled });
    localStorage.setItem('musicEnabled', JSON.stringify(enabled));
    
    // Update global audio element
    const globalBgm = (window as any).__bgm as HTMLAudioElement | undefined;
    if (globalBgm) {
      if (enabled && globalBgm.paused) {
        globalBgm.play().catch(() => {});
      } else if (!enabled && !globalBgm.paused) {
        globalBgm.pause();
      }
    }
  },
  
  setVolume: (vol) => {
    const v = Math.max(0, Math.min(1, vol));
    console.log('[AudioStore] Setting volume:', v);
    set({ volume: v });
    localStorage.setItem('musicVolume', v.toString());
    
    // Update global audio element
    const globalBgm = (window as any).__bgm as HTMLAudioElement | undefined;
    if (globalBgm) {
      globalBgm.volume = v;
    }
  },
  
  loadSettings: () => {
    const savedEnabled = localStorage.getItem('musicEnabled');
    const savedVolume = localStorage.getItem('musicVolume');
    
    const newEnabled = savedEnabled ? JSON.parse(savedEnabled) : true;
    const newVolume = savedVolume ? parseFloat(savedVolume) : 0.3;
    
    console.log('[AudioStore] Loading settings from localStorage:', { 
      savedEnabled, 
      savedVolume,
      newEnabled, 
      newVolume 
    });
    
    set({
      musicEnabled: newEnabled,
      volume: newVolume,
    });
    
    // Update global audio element immediately
    const globalBgm = (window as any).__bgm as HTMLAudioElement | undefined;
    if (globalBgm) {
      globalBgm.volume = newVolume;
      if (newEnabled && newVolume > 0 && globalBgm.paused) {
        globalBgm.play().catch(() => {});
      } else if (!newEnabled && !globalBgm.paused) {
        globalBgm.pause();
      }
    }
  },
}));
