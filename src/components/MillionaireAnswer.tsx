import { ReactNode } from 'react';

interface MillionaireAnswerProps {
  children: ReactNode;
  letter: 'A' | 'B' | 'C';
  onClick: () => void;
  isSelected?: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
  disabled?: boolean;
  isRemoved?: boolean;
  isDoubleChoiceActive?: boolean;
  showCorrectPulse?: boolean;
}

export const MillionaireAnswer = ({ 
  children, 
  letter, 
  onClick, 
  isSelected,
  isCorrect,
  isWrong,
  disabled,
  isRemoved,
  isDoubleChoiceActive,
  showCorrectPulse
}: MillionaireAnswerProps) => {
  if (isRemoved) {
    return (
      <div className="w-full flex justify-center mb-2 opacity-30">
      <div 
        className="w-[90%] bg-muted/50 border-2 border-muted/50 px-3 sm:px-4 md:px-5 py-[18px] sm:py-[28px] md:py-[37px] text-muted-foreground"
          style={{
            clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)'
          }}
        >
          <div className="flex items-center justify-center w-full">
            <div 
              className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-muted/80 border-2 border-muted flex items-center justify-center flex-shrink-0 text-sm sm:text-base font-bold font-poppins"
              style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)' }}
            >
              {letter}:
            </div>
            <span className="text-sm sm:text-base md:text-lg line-through font-bold font-poppins flex-1 text-center px-2 sm:px-3 md:px-4">{children}</span>
            <div className="w-8 sm:w-9 md:w-10 flex-shrink-0" aria-hidden />
          </div>
        </div>
      </div>
    );
  }

  let bgColor = 'bg-muted/90';
  let borderColor = 'border-accent';
  let textColor = 'text-foreground';
  let letterBg = 'bg-accent';
  let letterBorder = 'border-accent-dark';
  let letterText = 'text-accent-foreground';
  
  // Green pulsing animation for correct answer when user selected wrong
  if (showCorrectPulse) {
    bgColor = 'bg-success animate-pulse';
    borderColor = 'border-success/80';
    textColor = 'text-foreground';
    letterBg = 'bg-success/30';
    letterBorder = 'border-success/20';
    letterText = 'text-foreground';
  }
  
  // Double choice active state (orange background)
  if (isDoubleChoiceActive) {
    bgColor = 'bg-accent/80';
    borderColor = 'border-accent/60';
    textColor = 'text-foreground';
    letterBg = 'bg-accent/30';
    letterBorder = 'border-accent/20';
    letterText = 'text-foreground';
  }
  
  if (isSelected && !isCorrect && !isWrong) {
    bgColor = 'bg-accent/80';
    borderColor = 'border-accent/60';
    letterBg = 'bg-accent/30';
    letterBorder = 'border-accent/20';
  }
  
  if (isCorrect) {
    bgColor = 'bg-success';
    borderColor = 'border-success/80';
    letterBg = 'bg-success/30';
    letterBorder = 'border-success/20';
  }
  
  if (isWrong) {
    bgColor = 'bg-destructive';
    borderColor = 'border-destructive/80';
    letterBg = 'bg-destructive/30';
    letterBorder = 'border-destructive/20';
  }

  return (
    <div className="w-full flex justify-center mb-2">
      <button
        onClick={onClick}
        disabled={disabled}
        className="w-[90%] touch-manipulation group relative"
        style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
      >
      {/* BASE SHADOW - Enhanced */}
      <div 
        className="absolute inset-0 bg-background/80 rounded-2xl" 
        style={{ 
          transform: 'translate(8px, 8px) translateZ(-10px)', 
          filter: 'blur(12px)',
          clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)' 
        }} 
        aria-hidden 
      />
      
      {/* OUTER FRAME - Enhanced */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br opacity-95 border-4 shadow-2xl transition-all duration-300 ${
          showCorrectPulse ? 'from-green-400 via-green-500 to-green-600 border-green-300/90 animate-pulse' :
          isDoubleChoiceActive ? 'from-orange-400 via-orange-500 to-orange-600 border-orange-300/90' :
          isCorrect ? 'from-green-400 via-green-500 to-green-600 border-green-300/90' :
          isWrong ? 'from-red-400 via-red-500 to-red-600 border-red-300/90' :
          'from-yellow-400 via-yellow-500 to-yellow-600 border-yellow-300/90'
        }`}
        style={{
          clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)',
          transform: 'translateZ(0px)',
          boxShadow: showCorrectPulse ? '0 0 30px rgba(74, 222, 128, 0.8), 0 15px 40px rgba(0,0,0,0.7), inset 0 2px 8px rgba(255,255,255,0.4)' :
                     isCorrect ? '0 0 30px rgba(74, 222, 128, 0.6), 0 15px 40px rgba(0,0,0,0.7), inset 0 2px 8px rgba(255,255,255,0.4)' :
                     isWrong ? '0 0 30px rgba(248, 113, 113, 0.6), 0 15px 40px rgba(0,0,0,0.7), inset 0 2px 8px rgba(255,255,255,0.4)' :
                     '0 0 20px rgba(250, 204, 21, 0.4), 0 15px 40px rgba(0,0,0,0.7), inset 0 2px 8px rgba(255,255,255,0.4)'
        }}
        aria-hidden
      />
      
      {/* MIDDLE FRAME - Enhanced */}
      <div 
        className="absolute inset-[5px] bg-gradient-to-b from-black/60 via-transparent to-black/80"
        style={{
          clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)',
          boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.4), inset 0 -3px 6px rgba(0,0,0,0.6)',
          transform: 'translateZ(15px)'
        }}
        aria-hidden
      />
      
      {/* INNER LAYER - Enhanced */}
      <div 
        className={`absolute inset-[7px] bg-gradient-to-br transition-all duration-300 ${
          showCorrectPulse ? 'from-green-500/90 to-green-700/90' :
          isDoubleChoiceActive ? 'from-orange-500/90 to-orange-700/90' :
          isCorrect ? 'from-green-500/90 to-green-700/90' :
          isWrong ? 'from-red-500/90 to-red-700/90' :
          'from-slate-900/90 to-slate-950/90'
        }`}
        style={{
          clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)',
          boxShadow: 'inset 0 16px 32px rgba(255,255,255,0.2), inset 0 -16px 32px rgba(0,0,0,0.5)',
          transform: 'translateZ(25px)'
        }}
        aria-hidden
      />
      
      {/* SPECULAR HIGHLIGHT - Enhanced */}
      <div 
        className="absolute inset-[7px] pointer-events-none"
        style={{
          clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)',
          background: 'radial-gradient(ellipse 120% 80% at 40% 10%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 40%, transparent 70%)',
          transform: 'translateZ(35px)'
        }}
        aria-hidden
      />
      
      <div 
        className={`relative px-3 sm:px-4 md:px-5 py-[18px] sm:py-[28px] md:py-[37px] transition-all duration-300 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'}`}
        style={{
          clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)',
          transform: 'translateZ(40px)'
        }}
      >
        <div className="flex items-center justify-center w-full">
          <div 
            className={`relative w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center flex-shrink-0 text-xs sm:text-sm font-black`}
            style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)' }}
          >
            {/* Letter badge 3D */}
            <div 
              className={`absolute inset-0 border-2 transition-all duration-300 ${
                showCorrectPulse ? 'bg-gradient-to-br from-green-300 to-green-400 border-green-200' :
                isDoubleChoiceActive ? 'bg-gradient-to-br from-orange-300 to-orange-400 border-orange-200' :
                isCorrect ? 'bg-gradient-to-br from-green-300 to-green-400 border-green-200' :
                isWrong ? 'bg-gradient-to-br from-red-300 to-red-400 border-red-200' :
                'bg-gradient-to-br from-yellow-400 to-yellow-500 border-yellow-300'
              }`}
              style={{ 
                clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.3)'
              }} 
              aria-hidden 
            />
            <span className={`relative z-10 font-poppins font-bold ${
              showCorrectPulse || isDoubleChoiceActive || isCorrect || isWrong ? 'text-gray-900' : 'text-gray-100'
            }`} style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
              {letter}:
            </span>
          </div>
          <span className={`text-sm sm:text-base md:text-lg font-bold text-center flex-1 ${textColor} drop-shadow-lg font-poppins px-2 sm:px-3 md:px-4`} style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)' }}>
            {children}
          </span>
          <div className="w-8 sm:w-9 md:w-10 flex-shrink-0" aria-hidden />
        </div>
      </div>
      </button>
    </div>
  );
};
