import { ReactNode } from 'react';

interface MillionaireQuestionProps {
  children: ReactNode;
  questionNumber?: number;
}

export const MillionaireQuestion = ({ children, questionNumber }: MillionaireQuestionProps) => {
  const borderWidth = 4;
  const clipPathId = `hexClip-question-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className="w-full flex justify-center mb-4">
      {/* SVG clip-path definition - EXACT HEXAGON from provided SVG */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <clipPath id={clipPathId} clipPathUnits="objectBoundingBox">
            {/* Pixel-perfect hexagon: sharp left/right tips, rounded diagonal corners (r=56) */}
            <path 
              shapeRendering="geometricPrecision"
              d="M 0.00000,0.50000 L 0.15287,0.04128 A 0.04667,0.13333 0 0 1 0.18667,0.00000 L 0.81333,0.00000 A 0.04667,0.13333 0 0 1 0.84713,0.04128 L 1.00000,0.50000 L 0.84713,0.95872 A 0.04667,0.13333 0 0 1 0.81333,1.00000 L 0.18667,1.00000 A 0.04667,0.13333 0 0 1 0.15287,0.95872 L 0.00000,0.50000 Z"
            />
          </clipPath>
        </defs>
      </svg>

      <div className="w-[96%] sm:w-[94%] relative group overflow-visible" style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}>
        {/* 3D horizontal line in the middle - BEHIND the box */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-0"
          style={{
            width: '100vw',
            zIndex: -1,
          }}
        >
          {/* Shadow layer */}
          <div 
            className="absolute inset-0"
            style={{
              borderTop: `${borderWidth + 2}px solid rgba(0,0,0,0.4)`,
              transform: 'translateY(4px)',
              filter: 'blur(8px)',
            }}
            aria-hidden
          />
          {/* Main gradient line */}
          <div 
            className="absolute inset-0"
            style={{
              borderTop: `${borderWidth + 4}px solid #22d3ee`,
              boxShadow: '0 0 40px rgba(34, 211, 238, 0.8), 0 6px 20px rgba(34, 211, 238, 0.6), inset 0 -4px 8px rgba(0,0,0,0.7), inset 0 4px 8px rgba(255,255,255,0.5)',
            }}
            aria-hidden
          />
        </div>

        {/* Question number badge */}
        {questionNumber && (
          <div 
            className="absolute left-[5%] top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 z-50"
            style={{ perspective: '500px', transform: 'translateY(-50%) translateZ(50px)' }}
          >
            <div className="absolute inset-0 rounded-full bg-black/60" style={{ transform: 'translate(2px, 2px)', filter: 'blur(3px)' }} aria-hidden />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 via-cyan-500 to-cyan-600 border-2 border-cyan-300/80 shadow-lg" aria-hidden />
            <div className="absolute inset-[2px] rounded-full bg-gradient-to-b from-black/40 via-transparent to-black/60" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.4)' }} aria-hidden />
            <div className="absolute inset-[2px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 30%, transparent 60%)' }} aria-hidden />
            <div className="absolute inset-0 flex items-center justify-center text-white font-black text-sm sm:text-base z-10 drop-shadow-lg">
              {questionNumber}
            </div>
          </div>
        )}

        {/* BASE SHADOW */}
        <div 
          className="absolute inset-0 bg-black/80" 
          style={{ 
            transform: 'translate(8px, 8px) translateZ(-10px)', 
            filter: 'blur(12px)',
            clipPath: `url(#${clipPathId})`
          }} 
          aria-hidden 
        />
        
        {/* OUTER FRAME */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-cyan-500 to-cyan-600 shadow-2xl opacity-95"
          style={{
            transform: 'translateZ(0px)',
            boxShadow: '0 0 30px rgba(34, 211, 238, 0.6), 0 15px 40px rgba(0,0,0,0.7), inset 0 2px 8px rgba(255,255,255,0.4)',
            clipPath: `url(#${clipPathId})`
          }}
          aria-hidden
        />
        
        {/* STROKE LAYER - egyenletes border mindenütt */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 0 4px #22d3ee',
            clipPath: `url(#${clipPathId})`
          }}
          aria-hidden
        />
        
        {/* MIDDLE FRAME */}
        <div 
          className="absolute inset-[5px] bg-gradient-to-b from-black/60 via-transparent to-black/80"
          style={{
            boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.4), inset 0 -3px 6px rgba(0,0,0,0.6)',
            transform: 'translateZ(15px)',
            clipPath: `url(#${clipPathId})`
          }}
          aria-hidden
        />
        
        {/* INNER LAYER */}
        <div 
          className="absolute bg-gradient-to-br from-slate-900/90 to-slate-950/90"
          style={{
            top: '10px',
            left: '20px',
            right: '20px',
            bottom: '10px',
            boxShadow: 'inset 0 16px 32px rgba(255,255,255,0.2), inset 0 -16px 32px rgba(0,0,0,0.5)',
            transform: 'translateZ(25px)',
            clipPath: `url(#${clipPathId})`
          }}
          aria-hidden
        />
        
        {/* SPECULAR HIGHLIGHT */}
        <div 
          className="absolute pointer-events-none"
          style={{
            top: '10px',
            left: '20px',
            right: '20px',
            bottom: '10px',
            background: 'radial-gradient(ellipse 120% 80% at 40% 10%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 40%, transparent 70%)',
            transform: 'translateZ(35px)',
            clipPath: `url(#${clipPathId})`
          }}
          aria-hidden
        />
        
        <div 
          className="relative px-4 sm:px-6 md:px-8 py-[32px] sm:py-[40px] md:py-[49px] cursor-default"
          style={{
            transform: 'translateZ(40px)',
            clipPath: `url(#${clipPathId})`
          }}
        >
          <div className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-center text-white drop-shadow-lg font-poppins" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
