import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

export const MusicControls = () => {
  const [volume, setVolume] = useState(10); // 10%
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const w = window as any;
    const audio: HTMLAudioElement | undefined = w.__bgm;
    
    if (audio) {
      audio.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (value[0] === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
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
            value={[isMuted ? 0 : volume]}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="cursor-pointer"
          />
        </div>
        
        <span className="text-white text-sm font-bold w-12 text-right">
          {isMuted ? 0 : volume}%
        </span>
      </div>
    </div>
  );
};
