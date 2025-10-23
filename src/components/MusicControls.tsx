import { useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useAudioStore } from '@/stores/audioStore';

export const MusicControls = () => {
  const { volume, musicEnabled, setVolume, setMusicEnabled, loadSettings } = useAudioStore();
  
  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100; // Convert to 0-1 range
    setVolume(newVolume);
    
    // If changing from 0, enable music
    if (newVolume > 0 && !musicEnabled) {
      setMusicEnabled(true);
    }
    // If changing to 0, disable music
    else if (newVolume === 0) {
      setMusicEnabled(false);
    }
  };

  const toggleMute = () => {
    const newEnabled = !musicEnabled;
    setMusicEnabled(newEnabled);
    
    // If enabling and volume is 0, set to 50%
    if (newEnabled && volume === 0) {
      setVolume(0.5);
    }
  };
  
  const displayVolume = Math.round(volume * 100);

  return (
    <div className="w-full bg-gradient-to-r from-purple-900/40 to-purple-800/40 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30 shadow-lg">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleMute}
          className="p-2 rounded-full bg-purple-600/50 hover:bg-purple-600/70 transition-colors"
        >
          {!musicEnabled || volume === 0 ? (
            <VolumeX className="w-5 h-5 text-white" />
          ) : (
            <Volume2 className="w-5 h-5 text-white" />
          )}
        </button>
        
        <div className="flex-1">
          <Slider
            value={[displayVolume]}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="cursor-pointer"
          />
        </div>
        
        <span className="text-white text-sm font-bold w-12 text-right">
          {displayVolume}%
        </span>
      </div>
    </div>
  );
};
