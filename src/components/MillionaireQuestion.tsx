import { ReactNode } from 'react';

interface MillionaireQuestionProps {
  children: ReactNode;
  questionNumber?: number;
}

export const MillionaireQuestion = ({ children, questionNumber }: MillionaireQuestionProps) => {
  return (
    <div className="relative w-full mb-3">
      <div 
        className="bg-slate-900 border-2 border-cyan-500/60 px-4 py-5 sm:py-6 text-white"
        style={{
          clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)'
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 bg-cyan-600 border-2 border-cyan-400 flex-shrink-0 flex items-center justify-center"
            style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)' }}
          >
            {typeof questionNumber === 'number' && (
              <span className="text-white font-bold text-sm leading-none">{questionNumber}</span>
            )}
          </div>
          <p className="text-base md:text-lg font-normal leading-snug text-center flex-1">
            {children}
          </p>
        </div>
      </div>
    </div>
  );
};
