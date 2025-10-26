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
        className="w-[90%] bg-gray-800/50 border-2 border-gray-600/50 rounded-3xl px-3 sm:px-4 md:px-5 py-[18px] sm:py-[28px] md:py-[37px] text-gray-500"
        >
          <div className="flex items-center justify-center w-full">
            <div 
              className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-gray-700 border-2 border-gray-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm sm:text-base font-bold font-poppins"
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

  const borderWidth = 4;
  const clipPathId = `hexClip-answer-${letter}-${Math.random().toString(36).substr(2, 9)}`;
  const borderColorHex = showCorrectPulse ? '#4ade80' :
                         isDoubleChoiceActive ? '#fb923c' :
                         isCorrect ? '#4ade80' :
                         isWrong ? '#f87171' :
                         '#fde047';

  let bgColor = 'bg-slate-900';
  let textColor = 'text-white';
  
  // Green pulsing animation for correct answer when user selected wrong
  if (showCorrectPulse) {
    bgColor = 'bg-green-600 animate-pulse';
    textColor = 'text-white';
  }
  
  // Double choice active state (orange background)
  if (isDoubleChoiceActive) {
    bgColor = 'bg-orange-600';
    textColor = 'text-white';
  }
  
  if (isSelected && !isCorrect && !isWrong) {
    bgColor = 'bg-orange-600';
  }
  
  if (isCorrect) {
    bgColor = 'bg-green-600';
  }
  
  if (isWrong) {
    bgColor = 'bg-red-600';
  }

  return (
    <div className="w-full flex justify-center mb-2">
      {/* SVG clip-path definition - lekerekített hexagon */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <clipPath id={clipPathId} clipPathUnits="objectBoundingBox">
            {/* True hexagon with curved corners - 6 sides */}
            <path d="
              M 0.15,0 
              L 0.85,0 
              C 0.88,0 0.90,0.01 0.92,0.03
              L 0.98,0.15
              C 0.99,0.17 1,0.20 1,0.23
              L 1,0.77
              C 1,0.80 0.99,0.83 0.98,0.85
              L 0.92,0.97
              C 0.90,0.99 0.88,1 0.85,1
              L 0.15,1
              C 0.12,1 0.10,0.99 0.08,0.97
              L 0.02,0.85
              C 0.01,0.83 0,0.80 0,0.77
              L 0,0.23
              C 0,0.20 0.01,0.17 0.02,0.15
              L 0.08,0.03
              C 0.10,0.01 0.12,0 0.15,0
              Z
            " />
          </clipPath>
        </defs>
      </svg>

      <button
        onClick={onClick}
        disabled={disabled}
        className="w-[90%] touch-manipulation group relative"
        style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
      >
      {/* Single horizontal line in the middle - BEHIND the button */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-0"
        style={{
          width: '100vw',
          borderTop: `${borderWidth}px solid ${borderColorHex}`,
          zIndex: -1,
        }}
      />

      {/* BASE SHADOW - Enhanced */}
      <div 
        className="absolute inset-0 bg-black/80" 
        style={{ 
          transform: 'translate(8px, 8px) translateZ(-10px)', 
          filter: 'blur(12px)',
          clipPath: `url(#${clipPathId})`
        }} 
        aria-hidden 
      />
      
      {/* OUTER FRAME - Enhanced */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br opacity-95 shadow-2xl transition-all duration-300 ${
          showCorrectPulse ? 'from-green-400 via-green-500 to-green-600 animate-pulse' :
          isDoubleChoiceActive ? 'from-orange-400 via-orange-500 to-orange-600' :
          isCorrect ? 'from-green-400 via-green-500 to-green-600' :
          isWrong ? 'from-red-400 via-red-500 to-red-600' :
          'from-yellow-400 via-yellow-500 to-yellow-600'
        }`}
        style={{
          border: `${borderWidth}px solid ${borderColorHex}`,
          transform: 'translateZ(0px)',
          boxShadow: showCorrectPulse ? '0 0 30px rgba(74, 222, 128, 0.8), 0 15px 40px rgba(0,0,0,0.7), inset 0 2px 8px rgba(255,255,255,0.4)' :
                     isCorrect ? '0 0 30px rgba(74, 222, 128, 0.6), 0 15px 40px rgba(0,0,0,0.7), inset 0 2px 8px rgba(255,255,255,0.4)' :
                     isWrong ? '0 0 30px rgba(248, 113, 113, 0.6), 0 15px 40px rgba(0,0,0,0.7), inset 0 2px 8px rgba(255,255,255,0.4)' :
                     '0 0 20px rgba(250, 204, 21, 0.4), 0 15px 40px rgba(0,0,0,0.7), inset 0 2px 8px rgba(255,255,255,0.4)',
          clipPath: `url(#${clipPathId})`
        }}
        aria-hidden
      />
      
      {/* MIDDLE FRAME - Enhanced */}
      <div 
        className="absolute inset-[5px] bg-gradient-to-b from-black/60 via-transparent to-black/80"
        style={{
          boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.4), inset 0 -3px 6px rgba(0,0,0,0.6)',
          transform: 'translateZ(15px)',
          clipPath: `url(#${clipPathId})`
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
          boxShadow: 'inset 0 16px 32px rgba(255,255,255,0.2), inset 0 -16px 32px rgba(0,0,0,0.5)',
          transform: 'translateZ(25px)',
          clipPath: `url(#${clipPathId})`
        }}
        aria-hidden
      />
      
      {/* SPECULAR HIGHLIGHT - Enhanced */}
      <div 
        className="absolute inset-[7px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 120% 80% at 40% 10%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 40%, transparent 70%)',
          transform: 'translateZ(35px)',
          clipPath: `url(#${clipPathId})`
        }}
        aria-hidden
      />
      
      <div 
        className={`relative px-3 sm:px-4 md:px-5 py-[18px] sm:py-[28px] md:py-[37px] transition-all duration-300 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'}`}
        style={{
          transform: 'translateZ(40px)',
          clipPath: `url(#${clipPathId})`
        }}
      >
        <div className="flex items-center justify-center w-full">
          <div 
            className={`relative w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center flex-shrink-0 text-xs sm:text-sm font-black`}
          >
            {/* Letter badge 3D */}
            <div 
              className={`absolute inset-0 rounded-full border-2 transition-all duration-300 ${
                showCorrectPulse ? 'bg-gradient-to-br from-green-300 to-green-400 border-green-200' :
                isDoubleChoiceActive ? 'bg-gradient-to-br from-orange-300 to-orange-400 border-orange-200' :
                isCorrect ? 'bg-gradient-to-br from-green-300 to-green-400 border-green-200' :
                isWrong ? 'bg-gradient-to-br from-red-300 to-red-400 border-red-200' :
                'bg-gradient-to-br from-yellow-400 to-yellow-500 border-yellow-300'
              }`}
              style={{ 
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
