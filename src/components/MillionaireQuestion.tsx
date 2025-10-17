import { ReactNode } from 'react';

interface MillionaireQuestionProps {
  children: ReactNode;
}

export const MillionaireQuestion = ({ children }: MillionaireQuestionProps) => {
  return (
    <div className="relative w-full mb-6">
      <div 
        className="bg-slate-900 border-2 border-cyan-500/60 px-6 py-5 text-white"
        style={{
          clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)'
        }}
      >
        <div className="flex items-center gap-4">
          <div 
            className="w-10 h-10 bg-cyan-600 border-2 border-cyan-400 flex-shrink-0"
            style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)' }}
          />
          <p className="text-base md:text-lg font-normal leading-snug text-left">
            {children}
          </p>
        </div>
      </div>
    </div>
  );
};
