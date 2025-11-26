import { ReactNode } from 'react';

interface MillionaireQuestionProps {
  children: ReactNode;
  questionNumber?: number;
}

export const MillionaireQuestion = ({ children, questionNumber }: MillionaireQuestionProps) => {
  
  return (
    <div className="relative w-full mb-0.5" style={{ minHeight: '100px' }}>
      {/* SVG Background */}
      <svg 
        xmlns="http://www.w3.org/2000/svg"
        viewBox="22.53058 -47.5814116 672.82399 250"
        fill="none"
        shapeRendering="geometricPrecision"
        colorInterpolationFilters="sRGB"
        className="absolute inset-0 w-full h-auto pointer-events-none"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <path id="HEX_Q" d="M 592.82399,0 h -467.76283 c -23.80302,0 -36.4576,36.10205 -62.53058,36.10196 26.07298,-9e-5 38.72756,36.10196 62.53058,36.10196 h 467.76283 c 23.80302,0 36.4576,-36.10205 62.53058,-36.10196 -26.07298,9e-5 -38.72756,-36.10196 -62.53058,-36.10196 z"/>

          <linearGradient id="bg_q" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#191534"/>
            <stop offset="100%" stopColor="#0e0b1c"/>
          </linearGradient>

          <linearGradient id="chromeGrad_q" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f8fbff"/>
            <stop offset="10%" stopColor="#c6ccd3"/>
            <stop offset="22%" stopColor="#ffffff"/>
            <stop offset="40%" stopColor="#9ea6b0"/>
            <stop offset="58%" stopColor="#e7ebf0"/>
            <stop offset="78%" stopColor="#bfc6cf"/>
            <stop offset="100%" stopColor="#ffffff"/>
          </linearGradient>

          <linearGradient id="band20_q" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E0BFFF"/>
            <stop offset="35%" stopColor="#9C27F3"/>
            <stop offset="100%" stopColor="#6A0BB8"/>
          </linearGradient>

          <linearGradient id="band5_q" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F2E6FF"/>
            <stop offset="50%" stopColor="#B85AFF"/>
            <stop offset="100%" stopColor="#7B1ED6"/>
          </linearGradient>

          <filter id="pro3d_q" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1.2" stdDeviation="1.2" floodColor="rgba(0,0,0,0.35)"/>
            <feDropShadow dx="0" dy="-0.6" stdDeviation="0.7" floodColor="rgba(255,255,255,0.35)"/>
          </filter>

          <mask id="maskOuterOnly_q" maskUnits="userSpaceOnUse">
            <rect x="-9999" y="-9999" width="20000" height="20000" fill="black"/>
            <use href="#HEX_Q" stroke="white" strokeWidth="2" fill="none"/>
            <use href="#HEX_Q" stroke="black" strokeWidth="25" fill="none"/>
          </mask>
        </defs>

        <rect x="-10000" y="-10000" width="30000" height="30000" fill="none" />

        <g transform="scale(1,1.44)">
          <use href="#HEX_Q" fill="black" fillOpacity="0.5"/>

          <use href="#HEX_Q" fill="none" stroke="url(#band20_q)" strokeWidth="20"
               strokeLinejoin="miter" strokeMiterlimit="200" strokeLinecap="butt" filter="url(#pro3d_q)"
               vectorEffect="non-scaling-stroke"/>

          <use href="#HEX_Q" fill="none" stroke="url(#band5_q)" strokeWidth="5"
               strokeLinejoin="miter" strokeMiterlimit="200" strokeLinecap="butt" filter="url(#pro3d_q)"
               vectorEffect="non-scaling-stroke"/>

          <g mask="url(#maskOuterOnly_q)">
            <use href="#HEX_Q" fill="none" stroke="url(#chromeGrad_q)" strokeWidth="2"
                 strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
          </g>
        </g>
      </svg>
      
      {/* Content wrapper - flexbox centered like PlayNowButton */}
      <div className="absolute inset-0 flex items-center justify-center px-3 sm:px-4 md:px-5">
        <div className="flex items-center justify-center w-full gap-2 sm:gap-3 translate-y-[11px]">
          <div 
            className="relative w-12 h-8 sm:w-14 sm:h-9 md:w-16 md:h-10 flex-shrink-0 flex items-center justify-center"
            style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)' }}
          >
            {/* BASE SHADOW (3D depth) */}
            <div
              className="absolute"
              style={{
                top: '2px',
                left: '2px',
                right: '-2px',
                bottom: '-2px',
                background: 'rgba(0,0,0,0.35)',
                filter: 'blur(3px)',
                clipPath: 'polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)'
              }}
              aria-hidden
            />

            {/* OUTER FRAME - gradient with border */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-primary-dark via-primary to-primary-darker border-2 border-primary"
              style={{ 
                clipPath: 'polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)',
                boxShadow: '0 0 20px hsl(var(--primary)/0.6), 0 8px 25px rgba(0,0,0,0.5)'
              }}
              aria-hidden
            />

            {/* MIDDLE FRAME (bright inner highlight) */}
            <div
              className="absolute bg-gradient-to-b from-primary via-primary-glow to-primary-dark"
              style={{ 
                top: '2px',
                left: '2px',
                right: '2px',
                bottom: '2px',
                clipPath: 'polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)',
                boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.15)' 
              }}
              aria-hidden
            />

            {/* INNER CRYSTAL/COLOR LAYER */}
            <div
              className="absolute bg-gradient-to-b from-primary-glow via-primary to-primary-dark"
              style={{
                top: '3px',
                left: '3px',
                right: '3px',
                bottom: '3px',
                clipPath: 'polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)',
                boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.1), inset 0 -4px 8px rgba(0,0,0,0.15)',
              }}
              aria-hidden
            />

            {/* SPECULAR HIGHLIGHT (top-left) */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: '3px',
                left: '3px',
                right: '3px',
                bottom: '3px',
                clipPath: 'polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)',
                background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 30%, transparent 60%)',
              }}
              aria-hidden
            />

            {/* INNER GLOW (bottom shadow for 3D depth) */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: '3px',
                left: '3px',
                right: '3px',
                bottom: '3px',
                clipPath: 'polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)',
                boxShadow: 'inset 0 0 5px rgba(0,0,0,0.125)',
              }}
              aria-hidden
            />

            {typeof questionNumber === 'number' && (
              <span className="relative z-10 text-primary-foreground font-bold text-[10px] sm:text-xs leading-none drop-shadow-lg font-poppins" style={{ textShadow: '1px 1px 2px hsl(var(--background) / 0.8), -1px -1px 2px hsl(var(--background) / 0.8)' }}>{questionNumber}/15</span>
            )}
          </div>
          <p 
            className={`font-bold text-center flex-1 drop-shadow-lg font-poppins text-foreground ${
              typeof children === 'string' && children.length > 80 
                ? 'text-xs sm:text-sm md:text-base leading-tight' 
                : typeof children === 'string' && children.length > 50
                ? 'text-sm sm:text-base md:text-lg leading-snug'
                : 'text-sm sm:text-base md:text-lg leading-snug'
            }`}
            style={{ textShadow: '1px 1px 2px hsl(var(--background) / 0.8), -1px -1px 2px hsl(var(--background) / 0.8)' }}
          >
            {children}
          </p>
          <div className="w-12 sm:w-14 md:w-16 flex-shrink-0" aria-hidden />
        </div>
      </div>
    </div>
  );
};
