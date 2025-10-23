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
  volume: 0.3,
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
      loaded: true,
    });
    
    // DO NOT apply directly - let AudioPolicyManager handle this based on route/platform
    // AudioManager.getInstance().apply(newEnabled, newVolume);
  },
}));
