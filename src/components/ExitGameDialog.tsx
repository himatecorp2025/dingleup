import { useEffect } from 'react';

interface ExitGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmExit: () => void;
}

export const ExitGameDialog = ({
  open,
  onOpenChange,
  onConfirmExit
}: ExitGameDialogProps) => {
  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Fullscreen overlay with 10% blur */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-in fade-in duration-200">
        {/* Backdrop blur - 10% opacity */}
        <div 
          className="absolute inset-0 bg-black/10 backdrop-blur-sm" 
          onClick={() => onOpenChange(false)} 
        />
        
        {/* Dialog content - fully transparent background, no borders */}
        <div className="relative z-10 flex flex-col items-center gap-6 p-8 max-w-md w-full mx-4 animate-in zoom-in-95 duration-300">
          {/* Sad SVG Icon */}
          <div className="w-24 h-24 sm:w-32 sm:h-32 animate-in fade-in slide-in-from-top-4 duration-500">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Face circle with gradient */}
              <circle cx="50" cy="50" r="45" fill="url(#sadGradient)" stroke="#9333ea" strokeWidth="2"/>
              <defs>
                <linearGradient id="sadGradient" x1="0" y1="0" x2="0" y2="100">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
              
              {/* Sad eyes with tears */}
              <ellipse cx="35" cy="38" rx="4" ry="6" fill="#1f2937"/>
              <ellipse cx="65" cy="38" rx="4" ry="6" fill="#1f2937"/>
              
              {/* Tears - animated */}
              <path d="M 35 44 Q 34 50, 33 56 Q 32 60, 34 62 Q 36 60, 35 56 Q 34 50, 35 44 Z" fill="#60a5fa" opacity="0.7">
                <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2s" repeatCount="indefinite"/>
              </path>
              <path d="M 65 44 Q 64 50, 63 56 Q 62 60, 64 62 Q 66 60, 65 56 Q 64 50, 65 44 Z" fill="#60a5fa" opacity="0.7">
                <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2s" repeatCount="indefinite"/>
              </path>
              
              {/* Sad mouth - curved down */}
              <path d="M 30 65 Q 50 55, 70 65" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" fill="none"/>
            </svg>
          </div>

          {/* Title - centered */}
          <h2 className="text-2xl sm:text-3xl font-black text-center bg-gradient-to-r from-yellow-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent animate-in fade-in slide-in-from-top-2 duration-500 delay-100">
            Biztosan kilépsz?
          </h2>

          {/* Description */}
          <p className="text-center text-white/90 text-sm sm:text-base px-4 animate-in fade-in slide-in-from-top-2 duration-500 delay-200">
            Ha visszalépsz, minden eddig összegyűjtött eredmény törlődik és nem kapsz aranyérmet.
          </p>

          {/* 3D Buttons */}
          <div className="flex flex-col w-full gap-4 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
            {/* Exit Button - 3D Red */}
            <button
              onClick={onConfirmExit}
              className="relative w-full py-4 px-6 rounded-2xl font-bold text-lg text-white transition-all hover:scale-105 active:scale-95"
            >
              {/* BASE SHADOW */}
              <div className="absolute inset-0 bg-black/40 rounded-2xl" style={{ transform: 'translate(4px, 4px)', filter: 'blur(6px)' }} aria-hidden />
              
              {/* OUTER FRAME */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-700 via-red-600 to-red-900 border-2 border-red-400/50 shadow-lg shadow-red-500/30" aria-hidden />
              
              {/* MIDDLE FRAME */}
              <div className="absolute inset-[3px] rounded-2xl bg-gradient-to-b from-red-600 via-red-500 to-red-800" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3)' }} aria-hidden />
              
              {/* INNER LAYER */}
              <div className="absolute inset-[5px] rounded-2xl bg-gradient-to-b from-red-500/40 via-red-600/40 to-red-700/40" style={{ boxShadow: 'inset 0 8px 20px rgba(255,255,255,0.15), inset 0 -8px 20px rgba(0,0,0,0.4)' }} aria-hidden />
              
              {/* SPECULAR HIGHLIGHT */}
              <div className="absolute inset-[5px] rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 30% 10%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 40%, transparent 70%)' }} aria-hidden />
              
              {/* Text */}
              <span className="relative z-10 drop-shadow-lg">Kilépés</span>
            </button>

            {/* Stay Button - 3D Green */}
            <button
              onClick={() => onOpenChange(false)}
              className="relative w-full py-4 px-6 rounded-2xl font-bold text-lg text-white transition-all hover:scale-105 active:scale-95"
            >
              {/* BASE SHADOW */}
              <div className="absolute inset-0 bg-black/40 rounded-2xl" style={{ transform: 'translate(4px, 4px)', filter: 'blur(6px)' }} aria-hidden />
              
              {/* OUTER FRAME */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-700 via-green-600 to-green-900 border-2 border-green-400/50 shadow-lg shadow-green-500/30" aria-hidden />
              
              {/* MIDDLE FRAME */}
              <div className="absolute inset-[3px] rounded-2xl bg-gradient-to-b from-green-600 via-green-500 to-green-800" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3)' }} aria-hidden />
              
              {/* INNER LAYER */}
              <div className="absolute inset-[5px] rounded-2xl bg-gradient-to-b from-green-500/40 via-green-600/40 to-green-700/40" style={{ boxShadow: 'inset 0 8px 20px rgba(255,255,255,0.15), inset 0 -8px 20px rgba(0,0,0,0.4)' }} aria-hidden />
              
              {/* SPECULAR HIGHLIGHT */}
              <div className="absolute inset-[5px] rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 30% 10%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 40%, transparent 70%)' }} aria-hidden />
              
              {/* Text */}
              <span className="relative z-10 drop-shadow-lg">Maradok</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
