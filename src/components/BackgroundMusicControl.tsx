import { Volume2, VolumeX } from 'lucide-react';
import { useAudioStore } from '@/stores/audioStore';

export const BackgroundMusicControl = () => {
  const { musicEnabled, volume, setMusicEnabled, setVolume } = useAudioStore();

  return (
    <div className="background-music-control relative rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 transform-gpu">
      {/* Base shadow (3D depth) */}
      <div className="absolute rounded-xl sm:rounded-2xl bg-black/35 blur-md" style={{ top: '3px', left: '3px', right: '-3px', bottom: '-3px' }} aria-hidden />
      
      {/* Outer frame */}
      <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-700/40 via-purple-600/30 to-purple-900/40 border-2 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.4),0_8px_25px_rgba(0,0,0,0.5)]" aria-hidden />
      
      {/* Middle frame (bright highlight) */}
      <div className="absolute rounded-xl sm:rounded-2xl bg-gradient-to-b from-blue-600/15 via-purple-500/10 to-purple-800/15"
        style={{ top: '3px', left: '3px', right: '3px', bottom: '3px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)' }} aria-hidden />
      
      {/* Inner crystal layer */}
      <div className="absolute rounded-xl sm:rounded-2xl bg-gradient-to-b from-black/60 via-black/70 to-black/80"
        style={{ top: '5px', left: '5px', right: '5px', bottom: '5px', boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.1), inset 0 -8px 16px rgba(0,0,0,0.4)' }} aria-hidden />
      
      {/* Content */}
      <div className="relative z-10">
        <h2 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-300 mb-3 sm:mb-4 flex items-center gap-2">
          {musicEnabled ? <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" /> : <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />}
          Háttérzene (Játékban)
        </h2>
        
        <div className="space-y-4">
          {/* On/Off Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm sm:text-base text-foreground/90">Zene be/ki</span>
            <button
              onClick={() => setMusicEnabled(!musicEnabled)}
              className={`relative w-14 h-7 rounded-full transition-all ${
                musicEnabled ? 'bg-success' : 'bg-muted'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-5 h-5 bg-background rounded-full transition-transform ${
                  musicEnabled ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Volume Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base text-foreground/90">Hangerő</span>
              <span className="text-sm sm:text-base text-blue-300 font-bold">
                {Math.round(volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume * 100}
              onChange={(e) => setVolume(parseInt(e.target.value) / 100)}
              disabled={!musicEnabled}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-gradient-to-br
                [&::-webkit-slider-thumb]:from-blue-400
                [&::-webkit-slider-thumb]:to-purple-500
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:hover:scale-110
                [&::-webkit-slider-thumb]:transition-transform
                [&::-moz-range-thumb]:w-4
                [&::-moz-range-thumb]:h-4
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-gradient-to-br
                [&::-moz-range-thumb]:from-blue-400
                [&::-moz-range-thumb]:to-purple-500
                [&::-moz-range-thumb]:cursor-pointer
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:shadow-lg
                [&::-moz-range-thumb]:hover:scale-110
                [&::-moz-range-thumb]:transition-transform"
              style={{
                background: musicEnabled 
                  ? `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume * 100}%, #374151 ${volume * 100}%, #374151 100%)`
                  : '#374151'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};