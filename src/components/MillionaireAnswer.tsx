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
          className="bg-gray-800/50 border-2 border-gray-600/50 px-5 py-4 text-gray-500"
          style={{
            clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)'
          }}
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-10 h-10 bg-gray-700 border-2 border-gray-600 flex items-center justify-center flex-shrink-0 text-base font-bold"
              style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)' }}
            >
              {letter}:
            </div>
            <span className="text-base md:text-lg line-through">{children}</span>
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
  let letterText = 'text-gray-900';
  
  if (isSelected) {
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
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full mb-3 touch-manipulation group"
    >
      <div 
        className={`${bgColor} border-4 ${borderColor} px-5 py-4 transition-all duration-300 hover:scale-[1.02] ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        style={{
          clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)'
        }}
      >
        <div className="flex items-center gap-4">
          <div 
            className={`w-10 h-10 ${letterBg} border-2 ${letterBorder} flex items-center justify-center flex-shrink-0 text-base font-black ${letterText}`}
            style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)' }}
          >
            {letter}:
          </div>
          <span className={`text-base md:text-lg font-normal text-left ${textColor}`}>
            {children}
          </span>
        </div>
      </div>
    </button>
  );
};
