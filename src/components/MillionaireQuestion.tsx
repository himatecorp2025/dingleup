import { ReactNode, memo } from 'react';

interface MillionaireQuestionProps {
  children: ReactNode;
  questionNumber?: number;
}

const MillionaireQuestionComponent = ({ children, questionNumber }: MillionaireQuestionProps) => {
  return (
    <div className="relative w-full mb-3" style={{ perspective: '1200px', transformStyle: 'preserve-3d', minHeight: '100px' }}>
      {/* BASE SHADOW - Enhanced */}
      <div className="absolute inset-0 bg-background/80 rounded-2xl" style={{ transform: 'translate(8px, 8px) translateZ(-10px)', filter: 'blur(12px)', clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)' }} aria-hidden />
      
      {/* OUTER FRAME - Enhanced */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary opacity-95 border-4 border-primary/90 shadow-2xl"
        style={{
          clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)',
          transform: 'translateZ(0px)',
          boxShadow: '0 0 30px hsl(var(--primary) / 0.6), 0 15px 40px hsl(var(--background) / 0.7), inset 0 2px 8px hsl(var(--primary-foreground) / 0.4)'
        }}
        aria-hidden
      />
      
      {/* MIDDLE FRAME - Enhanced */}
      <div 
        className="absolute inset-[4px] bg-gradient-to-b from-background/60 via-transparent to-background/80"
        style={{
          clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)',
          boxShadow: 'inset 0 3px 6px hsl(var(--primary-foreground) / 0.4), inset 0 -3px 6px hsl(var(--background) / 0.6)',
          transform: 'translateZ(15px)'
        }}
        aria-hidden
      />
      
      {/* INNER LAYER - Enhanced */}
      <div 
        className="absolute inset-[6px] bg-gradient-to-br from-muted/90 to-background/90"
        style={{
          clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)',
          boxShadow: 'inset 0 16px 32px rgba(255,255,255,0.2), inset 0 -16px 32px rgba(0,0,0,0.5)',
          transform: 'translateZ(25px)'
        }}
        aria-hidden
      />
      
      {/* SPECULAR HIGHLIGHT - Enhanced */}
      <div 
        className="absolute inset-[6px] pointer-events-none"
        style={{
          clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)',
          background: 'radial-gradient(ellipse 120% 80% at 40% 10%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 40%, transparent 70%)',
          transform: 'translateZ(35px)'
        }}
        aria-hidden
      />
      
      <div 
        className="relative px-3 sm:px-4 md:px-5 py-[32px] sm:py-[40px] md:py-[48px] text-foreground"
        style={{
          clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)',
          transform: 'translateZ(40px)'
        }}
      >
        <div className="flex items-center justify-center w-full">
          <div 
            className="relative w-12 h-8 sm:w-14 sm:h-9 md:w-16 md:h-10 flex-shrink-0 flex items-center justify-center"
            style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)' }}
          >
            {/* Number badge 3D */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary border-2 border-primary" style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)', boxShadow: 'inset 0 2px 4px hsl(var(--primary-foreground) / 0.3), inset 0 -2px 4px hsl(var(--background) / 0.3)' }} aria-hidden />
            {typeof questionNumber === 'number' && (
              <span className="relative z-10 text-primary-foreground font-bold text-[10px] sm:text-xs leading-none drop-shadow-lg font-poppins" style={{ textShadow: '1px 1px 2px hsl(var(--background) / 0.8), -1px -1px 2px hsl(var(--background) / 0.8)' }}>{questionNumber}/15</span>
            )}
          </div>
          <p className="text-sm sm:text-base md:text-lg font-bold leading-snug text-center flex-1 drop-shadow-lg font-poppins px-2 sm:px-3 md:px-4" style={{ textShadow: '1px 1px 2px hsl(var(--background) / 0.8), -1px -1px 2px hsl(var(--background) / 0.8)' }}>
            {children}
          </p>
          <div className="w-12 sm:w-14 md:w-16 flex-shrink-0" aria-hidden />
        </div>
      </div>
    </div>
  );
};

export const MillionaireQuestion = memo(MillionaireQuestionComponent);
