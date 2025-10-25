import { ReactNode } from 'react';

interface MillionaireQuestionProps {
  children: ReactNode;
  questionNumber?: number;
}

export const MillionaireQuestion = ({ children, questionNumber }: MillionaireQuestionProps) => {
  return (
    <div className="relative w-full mb-3" style={{ perspective: '1000px' }}>
      {/* BASE SHADOW */}
      <div className="absolute inset-0 bg-black/70 rounded-2xl" style={{ transform: 'translate(6px, 6px)', filter: 'blur(8px)', clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)' }} aria-hidden />
      
      {/* OUTER FRAME */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-cyan-700 via-cyan-600 to-cyan-900 opacity-90 border-3 border-cyan-500/60 shadow-2xl"
        style={{
          clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)',
          transform: 'translateZ(0px)'
        }}
        aria-hidden
      />
      
      {/* MIDDLE FRAME */}
      <div 
        className="absolute inset-[4px] bg-gradient-to-b from-black/50 via-transparent to-black/70"
        style={{
          clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)',
          boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.5)',
          transform: 'translateZ(10px)'
        }}
        aria-hidden
      />
      
      {/* INNER LAYER */}
      <div 
        className="absolute inset-[6px] bg-gradient-to-br from-slate-900/80 to-slate-950/80"
        style={{
          clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)',
          boxShadow: 'inset 0 12px 24px rgba(255,255,255,0.15), inset 0 -12px 24px rgba(0,0,0,0.4)',
          transform: 'translateZ(20px)'
        }}
        aria-hidden
      />
      
      {/* SPECULAR HIGHLIGHT */}
      <div 
        className="absolute inset-[6px] pointer-events-none"
        style={{
          clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)',
          background: 'radial-gradient(ellipse 120% 80% at 40% 10%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 40%, transparent 70%)',
          transform: 'translateZ(30px)'
        }}
        aria-hidden
      />
      
      <div 
        className="relative px-4 py-6 sm:py-7 text-white"
        style={{
          clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)',
          transform: 'translateZ(40px)'
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center"
            style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)' }}
          >
            {/* Number badge 3D */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-600 via-cyan-500 to-cyan-700 border-2 border-cyan-400" style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.3)' }} aria-hidden />
            {typeof questionNumber === 'number' && (
              <span className="relative z-10 text-white font-bold text-sm leading-none drop-shadow-lg">{questionNumber}</span>
            )}
          </div>
          <p className="text-base md:text-lg font-normal leading-snug text-center flex-1 drop-shadow-lg">
            {children}
          </p>
        </div>
      </div>
    </div>
  );
};
