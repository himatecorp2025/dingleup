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
}

export const MillionaireAnswer = ({ 
  children, 
  letter, 
  onClick, 
  isSelected,
  isCorrect,
  isWrong,
  disabled,
  isRemoved
}: MillionaireAnswerProps) => {
  if (isRemoved) {
    return (
      <div className="w-full mb-3 opacity-30">
        <div 
          className="bg-gray-800/50 border-2 border-gray-600/50 px-4 py-3 text-gray-500"
          style={{
            clipPath: 'polygon(1% 0%, 99% 0%, 100% 50%, 99% 100%, 1% 100%, 0% 50%)'
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 bg-gray-700 border border-gray-600 flex items-center justify-center flex-shrink-0 text-sm font-bold"
              style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)' }}
            >
              ◆{letter}
            </div>
            <span className="text-sm md:text-base line-through">{children}</span>
          </div>
        </div>
      </div>
    );
  }

  let bgGradient = 'from-blue-900/80 via-blue-800/80 to-blue-900/80';
  let borderColor = 'border-yellow-500/80';
  let textColor = 'text-white';
  
  if (isSelected) {
    bgGradient = 'from-orange-600 via-orange-500 to-orange-600';
    borderColor = 'border-orange-300';
  }
  
  if (isCorrect) {
    bgGradient = 'from-green-600 via-green-500 to-green-600';
    borderColor = 'border-green-300';
  }
  
  if (isWrong) {
    bgGradient = 'from-red-600 via-red-500 to-red-600';
    borderColor = 'border-red-300';
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full mb-3 touch-manipulation group"
    >
      <div 
        className={`bg-gradient-to-r ${bgGradient} border-3 ${borderColor} px-4 py-3 transition-all duration-300 hover:scale-105 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        style={{
          clipPath: 'polygon(1% 0%, 99% 0%, 100% 50%, 99% 100%, 1% 100%, 0% 50%)'
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className={`w-8 h-8 bg-yellow-500 border-2 border-yellow-300 flex items-center justify-center flex-shrink-0 text-sm font-black ${textColor}`}
            style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)' }}
          >
            ◆{letter}
          </div>
          <span className={`text-sm md:text-base font-medium ${textColor}`}>
            {children}
          </span>
        </div>
      </div>
    </button>
  );
};
