import { ReactNode } from 'react';

interface MillionaireQuestionProps {
  children: ReactNode;
  questionNumber?: number;
}

export const MillionaireQuestion = ({ children, questionNumber }: MillionaireQuestionProps) => {
  const borderWidth = 4;
  
  return (
    <div className="w-full flex justify-center mb-4">
      <div className="w-[95%] sm:w-[90%] relative group" style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}>
        {/* Vízszintes vonalak - teljes szélesség */}
        {/* Felső vonal */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-0"
          style={{
            width: '100vw',
            borderTop: `${borderWidth}px solid #22d3ee`,
            zIndex: 5,
          }}
        />
        {/* Alsó vonal */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0"
          style={{
            width: '100vw',
            borderTop: `${borderWidth}px solid #22d3ee`,
            zIndex: 5,
          }}
        />

        {/* Question number badge - left side */}
        {questionNumber && (
          <div 
            className="absolute -left-2 sm:-left-3 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 z-20"
            style={{ perspective: '500px' }}
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
          className="absolute inset-0 rounded-3xl bg-black/80" 
          style={{ 
            transform: 'translate(8px, 8px) translateZ(-10px)', 
            filter: 'blur(12px)',
          }} 
          aria-hidden 
        />
        
        {/* OUTER FRAME */}
        <div 
          className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-400 via-cyan-500 to-cyan-600 shadow-2xl opacity-95"
          style={{
            border: `${borderWidth}px solid #22d3ee`,
            transform: 'translateZ(0px)',
            boxShadow: '0 0 30px rgba(34, 211, 238, 0.6), 0 15px 40px rgba(0,0,0,0.7), inset 0 2px 8px rgba(255,255,255,0.4)'
          }}
          aria-hidden
        />
        
        {/* MIDDLE FRAME */}
        <div 
          className="absolute inset-[5px] rounded-3xl bg-gradient-to-b from-black/60 via-transparent to-black/80"
          style={{
            boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.4), inset 0 -3px 6px rgba(0,0,0,0.6)',
            transform: 'translateZ(15px)'
          }}
          aria-hidden
        />
        
        {/* INNER LAYER */}
        <div 
          className="absolute inset-[7px] rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-950/90"
          style={{
            boxShadow: 'inset 0 16px 32px rgba(255,255,255,0.2), inset 0 -16px 32px rgba(0,0,0,0.5)',
            transform: 'translateZ(25px)'
          }}
          aria-hidden
        />
        
        {/* SPECULAR HIGHLIGHT */}
        <div 
          className="absolute inset-[7px] rounded-3xl pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 120% 80% at 40% 10%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 40%, transparent 70%)',
            transform: 'translateZ(35px)'
          }}
          aria-hidden
        />
        
        <div 
          className="relative px-4 sm:px-6 md:px-8 py-[24px] sm:py-[30px] md:py-[37px] cursor-default"
          style={{
            transform: 'translateZ(40px)'
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
