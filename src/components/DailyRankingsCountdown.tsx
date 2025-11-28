import { useState, useEffect, useRef } from 'react';
import { Trophy } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';
import { getMillisecondsUntilMidnight } from '@/lib/utils';

interface DailyRankingsCountdownProps {
  compact?: boolean;
  className?: string;
  userTimezone?: string;
}

export const DailyRankingsCountdown = ({ compact = false, className = '', userTimezone = 'Europe/Budapest' }: DailyRankingsCountdownProps) => {
  const { t } = useI18n();
  const [timeRemaining, setTimeRemaining] = useState('');
  const [containerWidth, setContainerWidth] = useState(260); // default width
  const timerRowRef = useRef<HTMLDivElement>(null); // Ref for second row only

  useEffect(() => {
    const updateCountdown = () => {
      // Calculate milliseconds until midnight in user's timezone
      const diff = getMillisecondsUntilMidnight(userTimezone);
      
      if (diff <= 0) {
        setTimeRemaining(t('countdown.processing'));
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeRemaining(
        `${hours} ${t('countdown.hours')} ${minutes} ${t('countdown.minutes')} ${seconds} ${t('countdown.seconds')}`
      );
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [t, userTimezone]);

  // Measure only the second row (timer row) width and update container width (+5%)
  useEffect(() => {
    if (timerRowRef.current) {
      const measureWidth = () => {
        const timerRowWidth = timerRowRef.current?.offsetWidth || 260;
        const newWidth = Math.max(180, timerRowWidth * 1.05); // +5% wider than timer row, min 180px
        setContainerWidth(newWidth);
      };

      // Initial measurement
      measureWidth();
      
      // Use requestAnimationFrame to ensure DOM is fully rendered
      requestAnimationFrame(measureWidth);
      
      // Remeasure on window resize
      window.addEventListener('resize', measureWidth);
      return () => window.removeEventListener('resize', measureWidth);
    }
  }, [timeRemaining, t]); // Re-measure when countdown or language changes

  if (compact) {
    return (
      <div 
        className={`bg-primary border border-primary/60 rounded px-1 py-0.5 shadow-[0_0_8px_hsl(var(--primary)/0.6)] ${className}`}
        title={t('countdown.dailyEndTitle')}
      >
        <span className="text-[8px] font-extrabold text-foreground drop-shadow leading-none whitespace-nowrap">
          {timeRemaining}
        </span>
      </div>
    );
  }

  return (
    <div 
      className="relative flex items-center mx-auto"
      style={{ 
        width: `${containerWidth}px`,
        minWidth: '180px',
        maxWidth: '90vw',
        height: '80px',
      }}
    >
      {/* Inline SVG Background - Golden Hexagon */}
      <svg 
        xmlns="http://www.w3.org/2000/svg"
        viewBox="22.53058 -47.5814116 672.82399 167.3667432"
        fill="none"
        shapeRendering="geometricPrecision"
        colorInterpolationFilters="sRGB"
        className="absolute"
        style={{
          width: '100%',
          height: '100%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) scale(1.25, 1.5)',
          filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.9)) drop-shadow(0 0 12px rgba(168, 85, 247, 0.6))',
        }}
        aria-hidden
      >
        <defs>
          <path id="HEX_COUNTDOWN" d="M 592.82399,0 h -467.76283 c -23.80302,0 -36.4576,36.10205 -62.53058,36.10196 26.07298,-9e-5 38.72756,36.10196 62.53058,36.10196 h 467.76283 c 23.80302,0 36.4576,-36.10205 62.53058,-36.10196 -26.07298,9e-5 -38.72756,-36.10196 -62.53058,-36.10196 z"/>

          <linearGradient id="bg_countdown" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#191534"/>
            <stop offset="100%" stopColor="#0e0b1c"/>
          </linearGradient>

          <linearGradient id="chromeGrad_countdown" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f8fbff"/>
            <stop offset="10%" stopColor="#c6ccd3"/>
            <stop offset="22%" stopColor="#ffffff"/>
            <stop offset="40%" stopColor="#9ea6b0"/>
            <stop offset="58%" stopColor="#e7ebf0"/>
            <stop offset="78%" stopColor="#bfc6cf"/>
            <stop offset="100%" stopColor="#ffffff"/>
          </linearGradient>

          <linearGradient id="band20_countdown" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E8D9FF"/>
            <stop offset="35%" stopColor="#A855F7"/>
            <stop offset="100%" stopColor="#5B21B6"/>
          </linearGradient>

          <linearGradient id="band5_countdown" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F3E9FF"/>
            <stop offset="50%" stopColor="#C084FC"/>
            <stop offset="100%" stopColor="#7C3AED"/>
          </linearGradient>

          <filter id="pro3d_countdown" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1.2" stdDeviation="1.2" floodColor="rgba(0,0,0,0.35)"/>
            <feDropShadow dx="0" dy="-0.6" stdDeviation="0.7" floodColor="rgba(255,255,255,0.35)"/>
          </filter>

          <mask id="maskOuterOnly_countdown" maskUnits="userSpaceOnUse">
            <rect x="-9999" y="-9999" width="20000" height="20000" fill="black"/>
            <use href="#HEX_COUNTDOWN" stroke="white" strokeWidth="2" fill="none"/>
            <use href="#HEX_COUNTDOWN" stroke="black" strokeWidth="25" fill="none"/>
          </mask>
        </defs>

        <rect x="-10000" y="-10000" width="30000" height="30000" fill="none" />

        <g transform="scale(1,1.2)">
          <use href="#HEX_COUNTDOWN" fill="black" fillOpacity="0.5"/>

          <use href="#HEX_COUNTDOWN" fill="none" stroke="url(#band20_countdown)" strokeWidth="20"
               strokeLinejoin="miter" strokeMiterlimit="200" strokeLinecap="butt" filter="url(#pro3d_countdown)"
               vectorEffect="non-scaling-stroke"/>

          <use href="#HEX_COUNTDOWN" fill="none" stroke="url(#band5_countdown)" strokeWidth="5"
               strokeLinejoin="miter" strokeMiterlimit="200" strokeLinecap="butt" filter="url(#pro3d_countdown)"
               vectorEffect="non-scaling-stroke"/>

          <g mask="url(#maskOuterOnly_countdown)">
            <use href="#HEX_COUNTDOWN" fill="none" stroke="url(#chromeGrad_countdown)" strokeWidth="2"
                 strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
          </g>
        </g>
      </svg>

      {/* Content - Absolutely centered */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center m-0 p-0 bg-transparent gap-1">
        {/* TOP 100 title with trophies */}
        <div className="flex items-center justify-center gap-1 [background:transparent]">
          <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-gold drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
          <span className="text-[10px] sm:text-xs font-black text-foreground drop-shadow-lg leading-none whitespace-nowrap">
            {t('leaderboard.carousel_title')}
          </span>
          <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-gold drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
        </div>
        
        {/* Timer countdown with text - this row is measured for width */}
        <div ref={timerRowRef} className="flex items-center justify-center m-0 p-0 gap-1 leading-none [background:transparent]">
          <span className="text-[10px] sm:text-xs font-black text-foreground drop-shadow-lg leading-none whitespace-nowrap">
            {t('countdown.you_can_win')}
          </span>
          <span className="text-[10px] sm:text-xs font-black text-foreground drop-shadow-lg leading-none whitespace-nowrap">
            {timeRemaining}
          </span>
          {t('countdown.in_time') && (
            <span className="text-[10px] sm:text-xs font-black text-foreground drop-shadow-lg leading-none whitespace-nowrap">
              {t('countdown.in_time')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
