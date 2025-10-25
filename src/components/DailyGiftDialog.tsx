import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';
import { trackBonusEvent } from '@/lib/analytics';
import { supabase } from '@/integrations/supabase/client';
import HexShieldFrame from './frames/HexShieldFrame';
import HexAcceptButton from './ui/HexAcceptButton';

interface DailyGiftDialogProps {
  open: boolean;
  onClaim: () => void;
  onClaimSuccess?: () => void;
  onLater: () => void;
  weeklyEntryCount: number;
  nextReward: number;
  canClaim: boolean;
  isPremium?: boolean;
}

const DAILY_REWARDS = [50, 75, 110, 160, 220, 300, 500];

const DailyGiftDialog = ({ 
  open, 
  onClaim,
  onClaimSuccess,
  onLater,
  weeklyEntryCount, 
  nextReward, 
  canClaim,
  isPremium = false 
}: DailyGiftDialogProps) => {
  const [userId, setUserId] = useState<string | null>(null);
  const isHandheld = usePlatformDetection();
  const [contentVisible, setContentVisible] = useState(false);
  const flagRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const buttonWrapperRef = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [burstActive, setBurstActive] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  // Sync badge width to button (account for inner hexagon vs. outer frame ratio)
  useEffect(() => {
    if (!badgeRef.current || !buttonWrapperRef.current) return;

    const INNER_TO_OUTER_RATIO = 132 / 108; // outerHexWidth / innerGreenWidth

    const syncWidth = () => {
      // Use offsetWidth (transform-independent) instead of getBoundingClientRect
      const badgeWidth = badgeRef.current?.offsetWidth;
      if (badgeWidth && buttonWrapperRef.current) {
        const targetButtonWidth = Math.round(badgeWidth * INNER_TO_OUTER_RATIO);
        buttonWrapperRef.current.style.setProperty('--sync-width', `${targetButtonWidth}px`);
        console.debug('[DailyGift] badgeWidth=', badgeWidth, 'targetButtonWidth=', targetButtonWidth);
      }
    };

    syncWidth();
    const observer = new ResizeObserver(syncWidth);
    observer.observe(badgeRef.current);
    window.addEventListener('resize', syncWidth);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncWidth);
    };
  }, [contentVisible, open]);

  // Diagnostics: log measured widths
  useEffect(() => {
    if (!contentVisible) return;
    const logSizes = () => {
      const badgeW = badgeRef.current?.offsetWidth;
      const wrapperW = buttonWrapperRef.current?.offsetWidth;
      const btnEl = buttonWrapperRef.current?.querySelector('button') as HTMLElement | null;
      const btnW = btnEl?.getBoundingClientRect().width;
      console.debug('[DailyGift][sizes] badge=', badgeW, 'wrapper=', wrapperW, 'button=', btnW);
    };
    const t = setTimeout(logSizes, 100);
    window.addEventListener('resize', logSizes);
    return () => { clearTimeout(t); window.removeEventListener('resize', logSizes); };
  }, [contentVisible]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setContentVisible(true), 10);
      return () => {
        clearTimeout(t);
        setContentVisible(false);
        setBurstActive(false);
      };
    } else {
      setContentVisible(false);
      setBurstActive(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!contentVisible) return;
    
    // 200ms delay after shield appears (shield has 300ms delay, so total 500ms)
    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        const el = flagRef.current;
        if (el) {
          const rect = el.getBoundingClientRect();
          const x = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
          const y = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
          setOrigin({ x, y });
          setBurstKey((k) => k + 1);
          setBurstActive(true);
        }
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [contentVisible, open]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  useEffect(() => {
    if (open && userId) {
      trackBonusEvent(userId, 'daily_shown', 'daily', {
        coins_amount: nextReward,
        streak_day: weeklyEntryCount + 1,
        is_subscriber: isPremium
      });
    }
  }, [open, userId, nextReward, weeklyEntryCount, isPremium]);

  const handleClaim = () => {
    onClaim();
    
    if (userId) {
      trackBonusEvent(userId, 'daily_claimed', 'daily', {
        coins_amount: nextReward,
        streak_day: weeklyEntryCount + 1,
        is_subscriber: isPremium
      });
    }

    if (onClaimSuccess) {
      setTimeout(() => onClaimSuccess(), 500);
    }
  };

  if (!isHandheld || !open) return null;
  
  return (
    <Dialog open={open} onOpenChange={onLater}>
      <DialogContent 
        className="overflow-hidden p-0 border-0 bg-transparent w-screen h-screen max-w-none rounded-none [&>button[data-dialog-close]]:hidden"
        style={{ 
          margin: 0,
          maxHeight: '100vh',
          minHeight: '100vh',
          borderRadius: 0
        }}
      >
        <div 
          className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
          style={{ minHeight: '100vh', minWidth: '100vw' }}
        >
          {/* Background layer - Deep dark blue, 85% transparent, FULL SCREEN */}
          <div className="absolute inset-0 w-full h-full min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950" style={{ opacity: 0.15, borderRadius: 0 }}></div>

          {/* Floating sparkle particles - EXPLOSIVE BURST FROM FLAG CENTER then continuous float */}
          {contentVisible && burstActive && (
            <div key={burstKey} className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(180)].map((_, i) => {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 60 + 40; // vw
                const size = Math.random() * 2 + 1.2;
                const burstDuration = Math.random() * 0.25 + 0.3; // 0.3-0.55s

                const endX = Math.cos(angle) * speed;
                const endY = Math.sin(angle) * speed;

                // Continuous floating parameters - faster and smoother
                const floatX = Math.random() * 40 - 20; // vw
                const floatY = Math.random() * 40 - 20; // vh
                const floatDuration = Math.random() * 1 + 1; // 1-2s - much faster
                const finalOpacity = Math.random() * 0.4 + 0.5; // 0.5-0.9

                return (
                  <div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      background: '#FFD700',
                      left: `${origin.x}%`,
                      top: `${origin.y}%`,
                      boxShadow:
                        '0 0 20px 4px #FFD700, 0 0 35px 10px #FFA500, 0 0 60px 12px rgba(255, 215, 0, 0.85)',
                      filter: 'saturate(1.2) brightness(1.2)',
                      transform: 'translate(-50%, -50%)',
                      animation: `starBurst${i % 40} ${burstDuration}s cubic-bezier(0.2,0.8,0.2,1) forwards, starFloat${i % 40} ${floatDuration}s linear ${burstDuration}s infinite`,
                      animationDelay: `${i * 0.003}s`,
                      zIndex: 5
                    }}
                  >
                    <style>{`
                      @keyframes starBurst${i % 40} {
                        0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                        10% { opacity: 1; }
                        100% { transform: translate(calc(-50% + ${endX}vw), calc(-50% + ${endY}vh)) scale(1); opacity: ${finalOpacity}; }
                      }
                      @keyframes starFloat${i % 40} {
                        0% { transform: translate(calc(-50% + ${endX}vw), calc(-50% + ${endY}vh)); }
                        12.5% { transform: translate(calc(-50% + ${endX + floatX * 0.25}vw), calc(-50% + ${endY + floatY * 0.25}vh)); }
                        25% { transform: translate(calc(-50% + ${endX + floatX * 0.5}vw), calc(-50% + ${endY + floatY * 0.5}vh)); }
                        37.5% { transform: translate(calc(-50% + ${endX + floatX * 0.75}vw), calc(-50% + ${endY + floatY * 0.75}vh)); }
                        50% { transform: translate(calc(-50% + ${endX + floatX}vw), calc(-50% + ${endY + floatY}vh)); }
                        62.5% { transform: translate(calc(-50% + ${endX + floatX * 0.75}vw), calc(-50% + ${endY - floatY * 0.25}vh)); }
                        75% { transform: translate(calc(-50% + ${endX + floatX * 0.5}vw), calc(-50% + ${endY - floatY * 0.5}vh)); }
                        87.5% { transform: translate(calc(-50% + ${endX + floatX * 0.25}vw), calc(-50% + ${endY - floatY * 0.25}vh)); }
                        100% { transform: translate(calc(-50% + ${endX}vw), calc(-50% + ${endY}vh)); }
                      }
                    `}</style>
                  </div>
                );
              })}
            </div>
          )}

          {/* ZOOM WRAPPER - scale animation for visual effect */}
          <div 
            className="relative z-10"
            style={{ 
              transform: contentVisible ? 'scale(1)' : 'scale(0)',
              opacity: contentVisible ? 1 : 0,
              transition: 'transform 1500ms ease-in-out 300ms, opacity 1500ms ease-in-out 300ms',
              transformOrigin: 'center center',
              willChange: contentVisible ? 'transform, opacity' : 'auto'
            }}
          >
            {/* SHIELD CONTAINER - always scale(1) so SVG filters render immediately */}
            <div style={{ transform: 'scale(1)' }}>
              
              {/* Background glow behind shield - removed to prevent purple pulse */}

              <HexShieldFrame>
              {/* Top Hex Badge - "DAILY GIFT" - 3D GOLD FRAME - COVERS TOP POINT */}
              <div 
                ref={badgeRef}
                className="relative -mt-12 mb-3 mx-auto z-20" 
                style={{ width: '78%' }}
              >
                {/* 3D Shadow base */}
                <div className="absolute inset-0 translate-y-1 translate-x-1"
                     style={{
                       clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                       background: 'rgba(0,0,0,0.4)',
                       filter: 'blur(4px)',
                       zIndex: -1
                     }} />
                
                {/* Outer gold frame */}
                <div className="absolute inset-0"
                     style={{
                       clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                       background: 'linear-gradient(135deg, hsl(var(--dup-gold-700)), hsl(var(--dup-gold-600)) 50%, hsl(var(--dup-gold-800)))',
                       boxShadow: 'inset 0 0 0 2px hsl(var(--dup-gold-900)), 0 6px 16px rgba(0,0,0,0.35)'
                     }} />
                
                {/* Middle gold highlight frame */}
                <div className="absolute inset-[3px]"
                     style={{
                       clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                       background: 'linear-gradient(180deg, hsl(var(--dup-gold-400)), hsl(var(--dup-gold-500)) 40%, hsl(var(--dup-gold-700)))',
                       boxShadow: 'inset 0 1px 0 hsl(var(--dup-gold-300))'
                     }} />
                
                <div className="relative px-[5vw] py-[1.2vh]"
                     style={{
                       clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                     }}>
                  {/* Inner RED RUBY crystal with diagonal streaks */}
                  <div className="absolute inset-[6px]"
                       style={{
                         clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                         background: 'radial-gradient(ellipse 100% 80% at 50% -10%, hsl(0 95% 75%) 0%, hsl(0 90% 65%) 30%, hsl(0 85% 55%) 60%, hsl(0 78% 48%) 100%)',
                         boxShadow: 'inset 0 12px 24px rgba(255,255,255,0.25), inset 0 -12px 24px rgba(0,0,0,0.4)'
                       }} />
                  
                  {/* Diagonal light streaks - SAME as ELFOGADOM button */}
                  <div className="absolute inset-[6px] pointer-events-none"
                       style={{
                         clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                         background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.08) 8px, rgba(255,255,255,0.08) 12px, transparent 12px, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 24px)',
                         opacity: 0.7
                       }} />
                  
                  {/* Specular highlight */}
                  <div className="absolute inset-[6px] pointer-events-none" style={{
                    clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                    background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5), transparent 60%)'
                  }} />
                  
                  <h1 className="relative z-10 font-black text-white text-center drop-shadow-[0_0_18px_rgba(255,255,255,0.3),0_2px_8px_rgba(0,0,0,0.9)]"
                      style={{ 
                        fontSize: 'clamp(1.25rem, 5.2vw, 2.1rem)', 
                        letterSpacing: '0.05em',
                        textShadow: '0 0 12px rgba(255,255,255,0.25)'
                      }}>
                    DAILY GIFT
                  </h1>
                </div>
              </div>

              {/* Animated diagonal sparkle beam - 120° angle - SCALES WITH SHIELD */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none z-[5]">
                <div className="absolute"
                     style={{
                       left: '50%',
                       top: '50%',
                       width: 'calc(min(90vw, 400px) * 2.2)',
                       height: 'calc(min(90vw, 400px) * 0.25)',
                       background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.15) 20%, rgba(255,215,0,0.5) 50%, rgba(255,215,0,0.15) 80%, transparent)',
                       transform: 'translate(-50%, -50%) rotate(120deg)',
                       animation: 'sweepDiagonalDaily 2.5s ease-in-out infinite',
                       transformOrigin: 'center center',
                       filter: 'blur(2px)'
                     }} />
              </div>
              <style>{`
                @keyframes sweepDiagonalDaily {
                  0% { opacity: 0; transform: translate(-150%, -50%) rotate(120deg); }
                  20% { opacity: 1; }
                  50% { opacity: 0.8; }
                  80% { opacity: 1; }
                  100% { opacity: 0; transform: translate(50%, -50%) rotate(120deg); }
                }
              `}</style>

              {/* Content Area */}
              <div className="relative z-10 flex flex-col items-center justify-between flex-1 px-[8%] pb-[8%] pt-[2%]">
                
                {/* 3 Big Golden Stars (metallic) */}
                <div className="flex gap-[2.5vw] my-[1.2vh]">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="relative" style={{ fontSize: 'clamp(2.25rem, 9vw, 3.5rem)' }}>
                      <span className="relative" style={{
                        filter: `drop-shadow(4px 6px 8px rgba(0,0,0,0.35)) 
                                 drop-shadow(0 0 12px hsl(var(--dup-gold-400)))`
                      }}>⭐</span>
                    </div>
                  ))}
                </div>

                {/* DAY Counter */}
                <p className="font-black text-white text-center drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] mb-[1.2vh]"
                   style={{ 
                     fontSize: 'clamp(1.5rem, 6.5vw, 2.6rem)', 
                     letterSpacing: '0.06em',
                     textShadow: '0 0 16px rgba(255,255,255,0.2)'
                   }}>
                  DAY {weeklyEntryCount + 1}
                </p>

                {/* 7 Mini Stars Progress (horizontal row) - SAME SIZE, gold vs silver */}
                <div className="flex gap-[1.8vw] justify-center mb-[1.2vh]">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                    const isActive = day <= weeklyEntryCount + 1;
                    return (
                      <div key={day}
                           className="transition-all duration-500"
                           style={{ 
                             fontSize: 'clamp(0.875rem, 3.6vw, 1.3rem)',
                             filter: isActive 
                               ? `drop-shadow(0 0 6px hsl(var(--dup-gold-500)))` 
                               : 'grayscale(100%) brightness(1.2) drop-shadow(0 0 4px rgba(192,192,192,0.6))'
                           }}>
                        ⭐
                      </div>
                    );
                  })}
                </div>

                {/* Streak Text */}
                <p className="text-white font-bold text-center drop-shadow-lg mb-[1.8vh]"
                   style={{ fontSize: 'clamp(0.875rem, 3.6vw, 1.15rem)' }}>
                  {weeklyEntryCount + 1}. napi belépés 🔥
                </p>

                {/* Tomorrow's Reward Preview */}
                <div className="relative rounded-xl px-[4vw] py-[1.2vh] mb-[1.5vh]">
                  {/* 3D Shadow base */}
                  <div className="absolute inset-0 rounded-xl translate-y-0.5 translate-x-0.5"
                       style={{
                         background: 'rgba(0,0,0,0.3)',
                         filter: 'blur(4px)',
                         zIndex: -1
                       }} />
                  
                  {/* Outer gold frame */}
                  <div className="absolute inset-0 rounded-xl"
                       style={{
                         background: 'linear-gradient(135deg, hsl(var(--dup-gold-700)), hsl(var(--dup-gold-600)) 50%, hsl(var(--dup-gold-800)))',
                         boxShadow: 'inset 0 0 0 1.5px hsl(var(--dup-gold-900)), 0 4px 12px rgba(0,0,0,0.3)'
                       }} />
                  
                  {/* Inner semi-transparent purple */}
                  <div className="absolute inset-[2px] rounded-xl"
                       style={{
                         background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.3), rgba(109, 40, 217, 0.4))',
                       }} />
                  
                  <div className="relative z-10 flex items-center justify-center gap-[1.5vw]">
                    <span className="text-white/80 font-bold text-center" 
                          style={{ fontSize: 'clamp(0.7rem, 3vw, 0.95rem)' }}>
                      Holnap:
                    </span>
                    <div className="relative rounded-full"
                         style={{ 
                           width: 'clamp(1rem, 4vw, 1.5rem)', 
                           height: 'clamp(1rem, 4vw, 1.5rem)',
                         }}>
                      {/* Coin */}
                      <div className="absolute inset-0 rounded-full translate-y-0.5"
                           style={{ background: 'rgba(0,0,0,0.35)', filter: 'blur(2px)' }} />
                      <div className="absolute inset-0 rounded-full"
                           style={{ 
                             background: 'linear-gradient(135deg, hsl(45 95% 48%), hsl(45 95% 58%) 50%, hsl(45 90% 45%))',
                             boxShadow: 'inset 0 0 0 1px hsl(45 90% 38%), 0 2px 6px rgba(0,0,0,0.3)'
                           }} />
                      <div className="absolute inset-[2px] rounded-full"
                           style={{ 
                             background: 'radial-gradient(circle at 35% 25%, hsl(45 100% 85%), hsl(45 100% 70%) 35%, hsl(45 95% 58%) 65%, hsl(45 90% 45%))',
                             boxShadow: 'inset 0 1px 4px rgba(255,255,255,0.7), inset 0 -1px 4px rgba(0,0,0,0.4)'
                           }} />
                    </div>
                    <span className="text-yellow-300 font-black drop-shadow-lg"
                          style={{ fontSize: 'clamp(0.875rem, 3.8vw, 1.15rem)' }}>
                      +{DAILY_REWARDS[(weeklyEntryCount + 1) % 7] * (isPremium ? 2 : 1)}
                    </span>
                  </div>
                </div>

                {/* Today's Reward Card - 3D ENHANCED */}
                <div className="relative rounded-xl px-[5vw] py-[1.6vh] mb-[1.5vh]">
                  {/* 3D Shadow base */}
                  <div className="absolute inset-0 rounded-xl translate-y-1 translate-x-1"
                       style={{
                         background: 'rgba(0,0,0,0.4)',
                         filter: 'blur(6px)',
                         zIndex: -1
                       }} />
                  
                  {/* Outer gold frame */}
                  <div className="absolute inset-0 rounded-xl"
                       style={{
                         background: 'linear-gradient(135deg, hsl(var(--dup-gold-700)), hsl(var(--dup-gold-600)) 50%, hsl(var(--dup-gold-800)))',
                         boxShadow: 'inset 0 0 0 2px hsl(var(--dup-gold-900)), 0 8px 20px rgba(0,0,0,0.35)'
                       }} />
                  
                  {/* Middle gold highlight */}
                  <div className="absolute inset-[3px] rounded-xl"
                       style={{
                         background: 'linear-gradient(180deg, hsl(var(--dup-gold-400)), hsl(var(--dup-gold-500)) 40%, hsl(var(--dup-gold-700)))',
                         boxShadow: 'inset 0 1px 0 hsl(var(--dup-gold-300))'
                       }} />
                  
                  {/* Inner purple crystal - NO SHINE */}
                  <div className="absolute inset-[6px] rounded-xl"
                       style={{
                         background: 'radial-gradient(ellipse at 40% 30%, hsl(var(--dup-purple-400)), hsl(var(--dup-purple-600)) 60%, hsl(var(--dup-purple-800)))',
                         boxShadow: `
                           inset 0 1px 0 rgba(255,255,255,0.6),
                           inset 0 -10px 24px rgba(0,0,0,0.25)
                         `
                       }} />
                  
                  {/* Specular highlight only */}
                  <div className="absolute inset-[6px] rounded-xl pointer-events-none"
                       style={{
                         background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5), transparent 60%)'
                       }} />
                  
                  {isPremium ? (
                    <div className="relative z-10 flex flex-col items-center gap-[0.6vh]">
                      {/* Strikethrough old reward */}
                      <div className="flex items-center gap-[2vw]">
                        <div className="relative rounded-full"
                             style={{ 
                               width: 'clamp(1.25rem, 5vw, 2rem)', 
                               height: 'clamp(1.25rem, 5vw, 2rem)',
                             }}>
                          {/* Realistic BRIGHT 3D Coin - small */}
                          <div className="absolute inset-0 rounded-full translate-y-0.5"
                               style={{ background: 'rgba(0,0,0,0.35)', filter: 'blur(2px)' }} />
                          <div className="absolute inset-0 rounded-full"
                               style={{ 
                                 background: 'linear-gradient(135deg, hsl(45 95% 48%), hsl(45 95% 58%) 50%, hsl(45 90% 45%))',
                                 boxShadow: 'inset 0 0 0 1px hsl(45 90% 38%), 0 3px 8px rgba(0,0,0,0.3)'
                               }} />
                          <div className="absolute inset-[2px] rounded-full"
                               style={{ 
                                 background: 'radial-gradient(circle at 35% 25%, hsl(45 100% 85%), hsl(45 100% 70%) 35%, hsl(45 95% 58%) 65%, hsl(45 90% 45%))',
                                 boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.7), inset 0 -2px 6px rgba(0,0,0,0.4)'
                               }} />
                          {/* Edge rim highlight */}
                          <div className="absolute inset-[3px] rounded-full pointer-events-none"
                               style={{
                                 boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.5)'
                               }} />
                        </div>
                        <span className="font-black text-yellow-300/50 line-through" 
                              style={{ fontSize: 'clamp(0.875rem, 4vw, 1.25rem)' }}>
                          +{nextReward / 2}
                        </span>
                      </div>
                      {/* Active reward */}
                      <div className="flex items-center gap-[2vw]">
                        <div className="relative rounded-full"
                             style={{ 
                               width: 'clamp(1.75rem, 7vw, 2.5rem)', 
                               height: 'clamp(1.75rem, 7vw, 2.5rem)',
                             }}>
                          {/* Realistic BRIGHT 3D Coin - large */}
                          <div className="absolute inset-0 rounded-full translate-y-1"
                               style={{ background: 'rgba(0,0,0,0.4)', filter: 'blur(4px)' }} />
                          <div className="absolute inset-0 rounded-full"
                               style={{ 
                                 background: 'linear-gradient(135deg, hsl(45 95% 48%), hsl(45 95% 58%) 50%, hsl(45 90% 45%))',
                                 boxShadow: 'inset 0 0 0 2px hsl(45 90% 38%), 0 6px 18px rgba(0,0,0,0.4)'
                               }} />
                          <div className="absolute inset-[3px] rounded-full"
                               style={{ 
                                 background: 'radial-gradient(circle at 35% 25%, hsl(45 100% 88%), hsl(45 100% 72%) 30%, hsl(45 95% 60%) 60%, hsl(45 90% 48%))',
                                 boxShadow: 'inset 0 4px 12px rgba(255,255,255,0.8), inset 0 -4px 12px rgba(0,0,0,0.5)'
                               }} />
                          {/* Edge rim highlight */}
                          <div className="absolute inset-[4px] rounded-full pointer-events-none"
                               style={{
                                 boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.6)'
                               }} />
                        </div>
                        <span className="font-black text-yellow-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                              style={{ fontSize: 'clamp(1.5rem, 6.2vw, 2.35rem)' }}>
                          +{nextReward}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-10 flex items-center gap-[2vw]">
                      <div className="relative rounded-full"
                           style={{ 
                             width: 'clamp(1.75rem, 7vw, 2.75rem)', 
                             height: 'clamp(1.75rem, 7vw, 2.75rem)',
                           }}>
                        {/* Realistic BRIGHT 3D Coin */}
                        <div className="absolute inset-0 rounded-full translate-y-1"
                             style={{ background: 'rgba(0,0,0,0.4)', filter: 'blur(4px)' }} />
                        <div className="absolute inset-0 rounded-full"
                             style={{ 
                               background: 'linear-gradient(135deg, hsl(45 95% 48%), hsl(45 95% 58%) 50%, hsl(45 90% 45%))',
                               boxShadow: 'inset 0 0 0 2px hsl(45 90% 38%), 0 6px 18px rgba(0,0,0,0.4)'
                             }} />
                        <div className="absolute inset-[3px] rounded-full"
                             style={{ 
                               background: 'radial-gradient(circle at 35% 25%, hsl(45 100% 88%), hsl(45 100% 72%) 30%, hsl(45 95% 60%) 60%, hsl(45 90% 48%))',
                               boxShadow: 'inset 0 4px 12px rgba(255,255,255,0.8), inset 0 -4px 12px rgba(0,0,0,0.5)'
                             }} />
                        {/* Edge rim highlight */}
                        <div className="absolute inset-[4px] rounded-full pointer-events-none"
                             style={{
                               boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.6)'
                             }} />
                      </div>
                      <span className="font-black text-yellow-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                            style={{ fontSize: 'clamp(1.5rem, 6.2vw, 2.35rem)' }}>
                        +{nextReward}
                      </span>
                    </div>
                  )}
                </div>

                {/* Hex Accept Button */}
                <div 
                  ref={buttonWrapperRef}
                  className="flex justify-center w-full"
                  style={{
                    width: 'var(--sync-width, 100%)',
                    maxWidth: '100%'
                  }}
                >
                  {canClaim ? (
                    <HexAcceptButton onClick={handleClaim} style={{ width: 'var(--sync-width)' }} />
                  ) : (
                    <HexAcceptButton disabled style={{ width: 'var(--sync-width)' }} />
                  )}
                </div>
              </div>

              {/* Premium Lives Bonus Badge (floating, right side) */}
              {isPremium && (
                <div className="absolute -right-[6vw] top-[36%] rounded-full w-[14vw] h-[14vw] max-w-[72px] max-h-[72px] flex flex-col items-center justify-center shadow-[0_6px_18px_rgba(0,0,0,0.45)] z-30 animate-bounce"
                     style={{ 
                       background: 'radial-gradient(circle at 35% 25%, hsl(142 70% 65%), hsl(142 70% 50%), hsl(142 70% 35%))',
                       border: '4px solid white' 
                     }}>
                  {/* Inner specular */}
                  <div className="absolute inset-0 rounded-full pointer-events-none"
                       style={{
                         background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.5), transparent 60%)',
                         mixBlendMode: 'soft-light'
                       }} />
                  <span className="text-white font-black drop-shadow-lg relative z-10" 
                        style={{ fontSize: 'clamp(1rem, 4.5vw, 1.55rem)' }}>+3</span>
                  <span className="relative z-10" style={{ fontSize: 'clamp(0.75rem, 3vw, 1rem)' }}>❤️</span>
                </div>
              )}
            </HexShieldFrame>
            </div>
          </div>

          {/* Close X button - top right - DELAY 600ms */}
          <button
            onClick={onLater}
            className={`absolute top-[3vh] right-[4vw] text-white/70 hover:text-white font-bold z-30 w-[10vw] h-[10vw] max-w-[50px] max-h-[50px] flex items-center justify-center bg-black/30 hover:bg-black/50 rounded-full transition-all transform duration-500 ease-out ${contentVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
            style={{ fontSize: 'clamp(1.5rem, 7vw, 2.5rem)', transitionDelay: '600ms' }}
          >
            ×
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DailyGiftDialog;
