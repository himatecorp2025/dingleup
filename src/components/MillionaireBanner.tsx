import { ReactNode } from 'react';

interface MillionaireBannerProps {
  children: ReactNode;
}

export const MillionaireBanner = ({ children }: MillionaireBannerProps) => {
  return (
    <div className="w-full max-w-xs mx-auto mb-6">
      <div 
        className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 border-3 border-yellow-300 px-6 py-3 shadow-2xl shadow-yellow-500/50"
        style={{
          clipPath: 'polygon(3% 0%, 97% 0%, 100% 50%, 97% 100%, 3% 100%, 0% 50%)'
        }}
      >
        <p className="text-center text-xl md:text-2xl font-black text-white drop-shadow-lg">
          {children}
        </p>
      </div>
    </div>
  );
};
