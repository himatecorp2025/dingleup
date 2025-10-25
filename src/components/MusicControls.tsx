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
    <div className="w-full relative rounded-xl" style={{ perspective: '1000px' }}>
      {/* Deep 3D Layers */}
      {/* BASE SHADOW */}
      <div className="absolute inset-0 bg-black/60 rounded-xl" style={{ transform: 'translate(6px, 6px)', filter: 'blur(8px)' }} aria-hidden />
      
      {/* OUTER FRAME */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-700 via-purple-600 to-purple-900 opacity-90 border-3 border-purple-500/50 shadow-2xl" style={{ transform: 'translateZ(0px)' }} aria-hidden />
      
      {/* MIDDLE FRAME */}
      <div className="absolute inset-[4px] rounded-xl bg-gradient-to-b from-black/40 via-transparent to-black/60" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.5)', transform: 'translateZ(10px)' }} aria-hidden />
      
      {/* INNER LAYER */}
      <div className="absolute inset-[6px] rounded-xl bg-gradient-to-br from-purple-900/40 to-purple-800/40 backdrop-blur-sm" style={{ boxShadow: 'inset 0 12px 24px rgba(255,255,255,0.2), inset 0 -12px 24px rgba(0,0,0,0.4)', transform: 'translateZ(20px)' }} aria-hidden />
      
      {/* SPECULAR HIGHLIGHT */}
      <div className="absolute inset-[6px] rounded-xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 40% 10%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 40%, transparent 70%)', transform: 'translateZ(30px)' }} aria-hidden />
      
      <div className="relative z-10 p-4" style={{ transform: 'translateZ(40px)' }}>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleMute}
            className="relative p-2 rounded-full transition-all hover:scale-110"
          >
            {/* Button 3D effect */}
            <div className="absolute inset-0 bg-black/40 rounded-full" style={{ transform: 'translate(2px, 2px)', filter: 'blur(3px)' }} aria-hidden />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600 via-purple-500 to-purple-700 border border-purple-400/50" aria-hidden />
            <div className="absolute inset-[2px] rounded-full bg-gradient-to-b from-purple-500 via-purple-600 to-purple-700" style={{ boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.2), inset 0 -4px 8px rgba(0,0,0,0.3)' }} aria-hidden />
            
            {!musicEnabled || volume === 0 ? (
              <VolumeX className="w-5 h-5 text-white relative z-10" />
            ) : (
              <Volume2 className="w-5 h-5 text-white relative z-10" />
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
          
          <span className="text-white text-sm font-bold w-12 text-right drop-shadow-lg">
            {displayVolume}%
          </span>
        </div>
      </div>
    </div>
  );
};
