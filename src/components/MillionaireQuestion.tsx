import { ReactNode } from 'react';

interface MillionaireQuestionProps {
  children: ReactNode;
}

export const MillionaireQuestion = ({ children }: MillionaireQuestionProps) => {
  return (
    <div className="relative w-full mb-6">
      <div 
        className="bg-gradient-to-r from-blue-900/90 via-blue-800/90 to-blue-900/90 border-2 border-blue-400/50 px-6 py-4 text-white text-center"
        style={{
          clipPath: 'polygon(2% 0%, 98% 0%, 100% 50%, 98% 100%, 2% 100%, 0% 50%)'
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 bg-blue-600 border border-blue-300 flex-shrink-0"
            style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)' }}
          />
          <p className="text-base md:text-lg font-medium leading-tight">
            {children}
          </p>
        </div>
      </div>
    </div>
  );
};
