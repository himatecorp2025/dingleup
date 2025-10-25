import { create } from 'zustand';

interface BackgroundMusicState {
  enabled: boolean;
  volume: number;
  loaded: boolean;
  setEnabled: (enabled: boolean) => void;
  setVolume: (vol: number) => void;
  loadSettings: () => void;
}

export const useBackgroundMusicStore = create<BackgroundMusicState>((set) => ({
  enabled: true,
  volume: 0.05, // Default 5%
  loaded: false,
  
  setEnabled: (enabled) => {
    set({ enabled });
    localStorage.setItem('bgMusicEnabled', JSON.stringify(enabled));
  },
  
  setVolume: (vol) => {
    const v = Math.max(0, Math.min(1, vol));
    set({ volume: v });
    localStorage.setItem('bgMusicVolume', v.toString());
  },
  
  loadSettings: () => {
    const savedEnabled = localStorage.getItem('bgMusicEnabled');
    const savedVolume = localStorage.getItem('bgMusicVolume');
    
    const newEnabled = savedEnabled ? JSON.parse(savedEnabled) : true;
    const newVolume = savedVolume ? parseFloat(savedVolume) : 0.05; // Default 5%
    
    set({
      enabled: newEnabled,
      volume: newVolume,
      loaded: true,
    });
  },
}));