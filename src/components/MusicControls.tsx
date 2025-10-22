import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

const STORAGE_KEY = 'music_volume';
const STORAGE_MUTE_KEY = 'music_muted';

export const MusicControls = () => {
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? parseInt(saved, 10) : 30;
  });
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem(STORAGE_MUTE_KEY);
    return saved === 'true';
  });

  useEffect(() => {
    const actualVolume = isMuted ? 0 : volume / 100;
    
    localStorage.setItem(STORAGE_KEY, volume.toString());
    localStorage.setItem(STORAGE_MUTE_KEY, isMuted.toString());
    
    // Update global audio element if exists
    const w = window as any;
    const audio: HTMLAudioElement | undefined = w.__bgm;
    
    if (audio) {
      audio.volume = actualVolume;
      
      // If unmuting or changing volume, try to play
      if (!isMuted && actualVolume > 0) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Autoplay was prevented, user needs to interact first
          });
        }
      } else if (isMuted) {
        audio.pause();
      }
      
      console.log(`[MusicControls] Volume set to ${actualVolume} (muted: ${isMuted}, slider: ${volume})`);
    }
    
    // Dispatch custom event for other components to listen
    window.dispatchEvent(new CustomEvent('musicVolumeChange', { 
      detail: { volume: actualVolume, isMuted } 
    }));
  }, [volume, isMuted]);

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    
    // If changing from 0, unmute
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
    // If changing to 0, mute
    else if (newVolume === 0) {
      setIsMuted(true);
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    
    // If unmuting and volume is 0, set to 50%
    if (!newMuted && volume === 0) {
      setVolume(50);
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-purple-900/40 to-purple-800/40 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30 shadow-lg">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleMute}
          className="p-2 rounded-full bg-purple-600/50 hover:bg-purple-600/70 transition-colors"
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-5 h-5 text-white" />
          ) : (
            <Volume2 className="w-5 h-5 text-white" />
          )}
        </button>
        
        <div className="flex-1">
          <Slider
            value={[volume]}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="cursor-pointer"
          />
        </div>
        
        <span className="text-white text-sm font-bold w-12 text-right">
          {volume}%
        </span>
      </div>
    </div>
  );
};
