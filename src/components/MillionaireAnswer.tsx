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
        className="w-[90%] bg-muted/50 border-2 border-muted/50 px-3 sm:px-4 md:px-5 py-[18px] sm:py-[28px] md:py-[37px] text-muted-foreground"
          style={{
            clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)'
          }}
        >
          <div className="flex items-center justify-center w-full">
            <div 
              className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-muted/80 border-2 border-muted flex items-center justify-center flex-shrink-0 text-lg sm:text-xl font-bold font-poppins"
              style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)' }}
            >
              {letter}:
            </div>
            <span className="text-xl sm:text-2xl md:text-3xl line-through font-bold font-poppins flex-1 text-center px-2 sm:px-3 md:px-4">{children}</span>
            <div className="w-8 sm:w-9 md:w-10 flex-shrink-0" aria-hidden />
          </div>
        </div>
      </div>
    );
  }

  // Determine gradient suffix based on state
  let gradientSuffix = 'default';
  if (showCorrectPulse || isCorrect) {
    gradientSuffix = 'correct';
  } else if (isWrong) {
    gradientSuffix = 'wrong';
  } else if (isDoubleChoiceActive) {
    gradientSuffix = 'orange';
  }

  const band20Id = `band20_ans_${gradientSuffix}`;
  const band5Id = `band5_ans_${gradientSuffix}`;

  return (
    <div className="w-full flex justify-center mb-1">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-[90%] relative ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'} transition-transform duration-300`}
        style={{ minHeight: '72px' }}
      >
        {/* SVG Background with fast pulse animation on correct answer */}
        <svg 
          xmlns="http://www.w3.org/2000/svg"
          viewBox="22.53058 -47.5814116 672.82399 250"
          fill="none"
          shapeRendering="geometricPrecision"
          colorInterpolationFilters="sRGB"
          className={`absolute inset-0 w-full h-auto pointer-events-none ${showCorrectPulse || isCorrect ? 'animate-pulse-fast' : ''}`}
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <path id="HEX_ANS" d="M 592.82399,0 h -467.76283 c -23.80302,0 -36.4576,36.10205 -62.53058,36.10196 26.07298,-9e-5 38.72756,36.10196 62.53058,36.10196 h 467.76283 c 23.80302,0 36.4576,-36.10205 62.53058,-36.10196 -26.07298,9e-5 -38.72756,-36.10196 -62.53058,-36.10196 z"/>

            <linearGradient id="bg_ans" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#191534"/>
              <stop offset="100%" stopColor="#0e0b1c"/>
            </linearGradient>

            <linearGradient id="chromeGrad_ans" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f8fbff"/>
              <stop offset="10%" stopColor="#c6ccd3"/>
              <stop offset="22%" stopColor="#ffffff"/>
              <stop offset="40%" stopColor="#9ea6b0"/>
              <stop offset="58%" stopColor="#e7ebf0"/>
              <stop offset="78%" stopColor="#bfc6cf"/>
              <stop offset="100%" stopColor="#ffffff"/>
            </linearGradient>

            {/* Purple/Default gradients */}
            <linearGradient id="band20_ans_default" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#E0BFFF"/>
              <stop offset="35%" stopColor="#9C27F3"/>
              <stop offset="100%" stopColor="#6A0BB8"/>
            </linearGradient>

            <linearGradient id="band5_ans_default" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F2E6FF"/>
              <stop offset="50%" stopColor="#B85AFF"/>
              <stop offset="100%" stopColor="#7B1ED6"/>
            </linearGradient>

            {/* Green/Correct gradients */}
            <linearGradient id="band20_ans_correct" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#BFFFBF"/>
              <stop offset="35%" stopColor="#27F327"/>
              <stop offset="100%" stopColor="#0BB80B"/>
            </linearGradient>

            <linearGradient id="band5_ans_correct" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#E6FFE6"/>
              <stop offset="50%" stopColor="#5AFF5A"/>
              <stop offset="100%" stopColor="#1ED61E"/>
            </linearGradient>

            {/* Red/Wrong gradients */}
            <linearGradient id="band20_ans_wrong" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFBFBF"/>
              <stop offset="35%" stopColor="#F32727"/>
              <stop offset="100%" stopColor="#B80B0B"/>
            </linearGradient>

            <linearGradient id="band5_ans_wrong" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFE6E6"/>
              <stop offset="50%" stopColor="#FF5A5A"/>
              <stop offset="100%" stopColor="#D61E1E"/>
            </linearGradient>

            {/* Orange/Double Choice gradients */}
            <linearGradient id="band20_ans_orange" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFDBBF"/>
              <stop offset="35%" stopColor="#F39C27"/>
              <stop offset="100%" stopColor="#B8660B"/>
            </linearGradient>

            <linearGradient id="band5_ans_orange" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFEDE6"/>
              <stop offset="50%" stopColor="#FFB85A"/>
              <stop offset="100%" stopColor="#D6851E"/>
            </linearGradient>

            <filter id="pro3d_ans" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1.2" stdDeviation="1.2" floodColor="rgba(0,0,0,0.35)"/>
              <feDropShadow dx="0" dy="-0.6" stdDeviation="0.7" floodColor="rgba(255,255,255,0.35)"/>
            </filter>

            <mask id="maskOuterOnly_ans" maskUnits="userSpaceOnUse">
              <rect x="-9999" y="-9999" width="20000" height="20000" fill="black"/>
              <use href="#HEX_ANS" stroke="white" strokeWidth="2" fill="none"/>
              <use href="#HEX_ANS" stroke="black" strokeWidth="25" fill="none"/>
            </mask>
          </defs>

          <rect x="-10000" y="-10000" width="30000" height="30000" fill="none" />

          <g transform="scale(1,1.44)">
            <use href="#HEX_ANS" fill="black" fillOpacity="0.5"/>

            <use href="#HEX_ANS" fill="none" stroke={`url(#${band20Id})`} strokeWidth="20"
                 strokeLinejoin="miter" strokeMiterlimit="200" strokeLinecap="butt" filter="url(#pro3d_ans)"
                 vectorEffect="non-scaling-stroke"/>

            <use href="#HEX_ANS" fill="none" stroke={`url(#${band5Id})`} strokeWidth="5"
                 strokeLinejoin="miter" strokeMiterlimit="200" strokeLinecap="butt" filter="url(#pro3d_ans)"
                 vectorEffect="non-scaling-stroke"/>

            <g mask="url(#maskOuterOnly_ans)">
              <use href="#HEX_ANS" fill="none" stroke="url(#chromeGrad_ans)" strokeWidth="2"
                   strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
            </g>
          </g>
        </svg>
        
        <div 
          className={`absolute top-[20%] bottom-[20%] left-0 right-0 flex items-center justify-center px-3 sm:px-4 md:px-5 translate-y-[20%]`}
        >
          <div className="flex items-center justify-center w-full gap-2 sm:gap-3">
            <div 
              className="relative w-12 h-8 sm:w-14 sm:h-9 md:w-16 md:h-10 flex-shrink-0 flex items-center justify-center translate-y-[20%]"
              style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)' }}
            >
              {/* Letter hexagon with same 3D effect as question number */}
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

              <div
                className="absolute inset-0 bg-gradient-to-br from-primary-dark via-primary to-primary-darker border-2 border-primary"
                style={{ 
                  clipPath: 'polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)',
                  boxShadow: '0 0 20px hsl(var(--primary)/0.6), 0 8px 25px rgba(0,0,0,0.5)'
                }}
                aria-hidden
              />

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

              <span className="relative z-10 text-primary-foreground font-bold text-[15px] sm:text-lg leading-none drop-shadow-lg font-poppins" style={{ textShadow: '1px 1px 2px hsl(var(--background) / 0.8), -1px -1px 2px hsl(var(--background) / 0.8)' }}>{letter}:</span>
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold leading-snug text-center flex-1 drop-shadow-lg font-poppins text-foreground translate-y-[35%]" style={{ textShadow: '1px 1px 2px hsl(var(--background) / 0.8), -1px -1px 2px hsl(var(--background) / 0.8)' }}>
              {children}
            </p>
            <div className="w-12 sm:w-14 md:w-16 flex-shrink-0" aria-hidden />
          </div>
        </div>
      </button>
    </div>
  );
};
