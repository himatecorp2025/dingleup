import { ReactNode } from 'react';

interface MillionaireBannerProps {
  children: ReactNode;
}

export const MillionaireBanner = ({ children }: MillionaireBannerProps) => {
  return (
    <div className="w-full max-w-sm mx-auto mb-6">
      <div 
        className="bg-gradient-to-r from-accent-dark via-accent to-accent-dark border-4 border-accent px-8 py-4 shadow-2xl shadow-accent/60"
        style={{
          clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)'
        }}
      >
        <p className="text-center text-2xl md:text-3xl font-black text-accent-foreground drop-shadow-lg tracking-wide">
          {children}
        </p>
      </div>
    </div>
  );
};
