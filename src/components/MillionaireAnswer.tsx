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
          className="w-[90%] bg-gray-800/50 border-2 border-gray-600/50 px-5 py-4 text-gray-500"
          style={{
            clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)'
          }}
        >
          <div className="flex items-center justify-center w-full">
            <div 
              className="w-10 h-10 bg-gray-700 border-2 border-gray-600 flex items-center justify-center flex-shrink-0 text-base font-bold font-poppins"
              style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)' }}
            >
              {letter}:
            </div>
            <span className="text-base md:text-lg line-through font-bold font-poppins flex-1 text-center px-4">{children}</span>
            <div className="w-10 flex-shrink-0" aria-hidden />
          </div>
        </div>
      </div>
    );
  }

  let bgColor = 'bg-slate-900';
  let borderColor = 'border-yellow-500';
  let textColor = 'text-white';
  let letterBg = 'bg-yellow-500';
  let letterBorder = 'border-yellow-400';
  let letterText = 'text-gray-100';
  
  // Green pulsing animation for correct answer when user selected wrong
  if (showCorrectPulse) {
    bgColor = 'bg-green-600 animate-pulse';
    borderColor = 'border-green-400';
    textColor = 'text-white';
    letterBg = 'bg-green-300';
    letterBorder = 'border-green-200';
    letterText = 'text-gray-900';
  }
  
  // Double choice active state (orange background)
  if (isDoubleChoiceActive) {
    bgColor = 'bg-orange-600';
    borderColor = 'border-orange-400';
    textColor = 'text-white';
    letterBg = 'bg-orange-300';
    letterBorder = 'border-orange-200';
    letterText = 'text-gray-900';
  }
  
  if (isSelected && !isCorrect && !isWrong) {
    bgColor = 'bg-orange-600';
    borderColor = 'border-orange-400';
    letterBg = 'bg-orange-300';
    letterBorder = 'border-orange-200';
  }
  
  if (isCorrect) {
    bgColor = 'bg-green-600';
    borderColor = 'border-green-400';
    letterBg = 'bg-green-300';
    letterBorder = 'border-green-200';
  }
  
  if (isWrong) {
    bgColor = 'bg-red-600';
    borderColor = 'border-red-400';
    letterBg = 'bg-red-300';
    letterBorder = 'border-red-200';
  }

  return (
    <div className="w-full flex justify-center mb-2">
      <button
        onClick={onClick}
        disabled={disabled}
        className="w-[90%] touch-manipulation group relative"
        style={{ perspective: '1000px' }}
      >
      {/* BASE SHADOW */}
      <div 
        className="absolute inset-0 bg-black/70 rounded-2xl" 
        style={{ 
          transform: 'translate(6px, 6px)', 
          filter: 'blur(8px)',
          clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)' 
        }} 
        aria-hidden 
      />
      
      {/* OUTER FRAME */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br opacity-90 border-4 shadow-2xl transition-all duration-300 ${
          showCorrectPulse ? 'from-green-400 via-green-500 to-green-600 border-green-300/80 animate-pulse' :
          isDoubleChoiceActive ? 'from-orange-400 via-orange-500 to-orange-600 border-orange-300/80' :
          isCorrect ? 'from-green-400 via-green-500 to-green-600 border-green-300/80' :
          isWrong ? 'from-red-400 via-red-500 to-red-600 border-red-300/80' :
          'from-yellow-400 via-yellow-500 to-yellow-600 border-yellow-300/80'
        }`}
        style={{
          clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)',
          transform: 'translateZ(0px)'
        }}
        aria-hidden
      />
      
      {/* MIDDLE FRAME */}
      <div 
        className="absolute inset-[5px] bg-gradient-to-b from-black/50 via-transparent to-black/70"
        style={{
          clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)',
          boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.5)',
          transform: 'translateZ(10px)'
        }}
        aria-hidden
      />
      
      {/* INNER LAYER */}
      <div 
        className={`absolute inset-[7px] bg-gradient-to-br transition-all duration-300 ${
          showCorrectPulse ? 'from-green-500/80 to-green-700/80' :
          isDoubleChoiceActive ? 'from-orange-500/80 to-orange-700/80' :
          isCorrect ? 'from-green-500/80 to-green-700/80' :
          isWrong ? 'from-red-500/80 to-red-700/80' :
          'from-slate-900/80 to-slate-950/80'
        }`}
        style={{
          clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)',
          boxShadow: 'inset 0 12px 24px rgba(255,255,255,0.15), inset 0 -12px 24px rgba(0,0,0,0.4)',
          transform: 'translateZ(20px)'
        }}
        aria-hidden
      />
      
      {/* SPECULAR HIGHLIGHT */}
      <div 
        className="absolute inset-[7px] pointer-events-none"
        style={{
          clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)',
          background: 'radial-gradient(ellipse 120% 80% at 40% 10%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 40%, transparent 70%)',
          transform: 'translateZ(30px)'
        }}
        aria-hidden
      />
      
      <div 
        className={`relative px-5 py-4 transition-all duration-300 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'}`}
        style={{
          clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)',
          transform: 'translateZ(40px)'
        }}
      >
        <div className="flex items-center justify-center w-full">
          <div 
            className={`relative w-10 h-10 flex items-center justify-center flex-shrink-0 text-sm font-black`}
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
          <span className={`text-base sm:text-lg font-bold text-center flex-1 ${textColor} drop-shadow-lg font-poppins px-4`} style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)' }}>
            {children}
          </span>
          <div className="w-10 flex-shrink-0" aria-hidden />
        </div>
      </div>
      </button>
    </div>
  );
};
