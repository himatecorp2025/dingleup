import { create } from 'zustand';
import AudioManager from '@/lib/audioManager';

interface AudioState {
  musicEnabled: boolean;
  volume: number;
  loaded: boolean;
  setMusicEnabled: (enabled: boolean) => void;
  setVolume: (vol: number) => void;
  loadSettings: () => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  musicEnabled: true,
  volume: 0.03, // Default 3%
  loaded: false,
  
  setMusicEnabled: (enabled) => {
    console.log('[AudioStore] Setting music enabled:', enabled);
    set({ musicEnabled: enabled });
    localStorage.setItem('musicEnabled', JSON.stringify(enabled));
    
    // DO NOT apply directly - let AudioPolicyManager handle this
    // AudioManager.getInstance().apply(enabled, volume);
  },
  
  setVolume: (vol) => {
    const v = Math.max(0, Math.min(1, vol));
    console.log('[AudioStore] Setting volume:', v);
    set({ volume: v });
    localStorage.setItem('musicVolume', v.toString());
    
    // DO NOT apply directly - let AudioPolicyManager handle this
    // AudioManager.getInstance().apply(musicEnabled, v);
  },
  
  loadSettings: () => {
    const savedEnabled = localStorage.getItem('musicEnabled');
    const savedVolume = localStorage.getItem('musicVolume');
    
    const newEnabled = savedEnabled ? JSON.parse(savedEnabled) : true;
    // Always use 3% as default, even if there's a saved value that's higher
    const parsedVolume = savedVolume ? parseFloat(savedVolume) : 0.03;
    // If saved volume is higher than 3%, reset to 3%
    const newVolume = parsedVolume > 0.03 ? 0.03 : parsedVolume;
    
    console.log('[AudioStore] Loading settings from localStorage:', { 
      savedEnabled, 
      savedVolume,
      newEnabled, 
      newVolume 
    });
    
    // If we reset the volume, save it back to localStorage
    if (newVolume === 0.03 && savedVolume !== '0.03') {
      localStorage.setItem('musicVolume', '0.03');
    }
    
    set({
      musicEnabled: newEnabled,
      volume: newVolume,
      loaded: true,
    });
    
    // DO NOT apply directly - let AudioPolicyManager handle this based on route/platform
    // AudioManager.getInstance().apply(newEnabled, newVolume);
  },
}));
