import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';
import { trackBonusEvent, trackFeatureUsage } from '@/lib/analytics';
import { supabase } from '@/integrations/supabase/client';
import HexShieldFrame from './frames/HexShieldFrame';
import HexAcceptButton from './ui/HexAcceptButton';
import { useI18n } from '@/i18n';

interface DailyGiftDialogProps {
  open: boolean;
  onClaim: () => Promise<boolean>;
  onLater: () => void;
  weeklyEntryCount: number;
  nextReward: number;
  canClaim: boolean;
  claiming: boolean;
  isPremium?: boolean;
}

const DAILY_REWARDS = [50, 75, 110, 160, 220, 300, 500];

const DailyGiftDialog = ({ 
  open, 
  onClaim,
  onLater,
  weeklyEntryCount, 
  nextReward, 
  canClaim,
  claiming,
  isPremium = false 
}: DailyGiftDialogProps) => {
  const { t } = useI18n();
  const [userId, setUserId] = useState<string | null>(null);
  const isHandheld = usePlatformDetection();
  const [contentVisible, setContentVisible] = useState(false);
  const flagRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const buttonWrapperRef = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [burstActive, setBurstActive] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const [claimed, setClaimed] = useState(false);

  // Sync badge width to button (account for inner hexagon vs. outer frame ratio)
  useEffect(() => {
    if (!badgeRef.current || !buttonWrapperRef.current) return;

    const INNER_TO_OUTER_RATIO = 132 / 108; // outerHexWidth / innerGreenWidth

    const syncWidth = () => {
      const badgeWidth = badgeRef.current?.offsetWidth;
      if (badgeWidth && buttonWrapperRef.current) {
        const targetButtonWidth = Math.round(badgeWidth * INNER_TO_OUTER_RATIO);
        buttonWrapperRef.current.style.setProperty('--sync-width', `${targetButtonWidth}px`);
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

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setContentVisible(true), 10);
      return () => {
        clearTimeout(t);
        setContentVisible(false);
        setBurstActive(false);
        setClaimed(false); // Reset claimed state when dialog closes
      };
    } else {
      setContentVisible(false);
      setBurstActive(false);
      setClaimed(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!contentVisible) return;
    
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
        streak_day: weeklyEntryCount + 1
      });
    }
  }, [open, userId, nextReward, weeklyEntryCount]);

  const handleClaim = async () => {
    if (!userId) return;
    
    // Track feature usage - claim attempt
    await trackFeatureUsage(userId, 'user_action', 'daily_gift', 'claim_attempt', {
      coins_amount: nextReward,
      streak_day: weeklyEntryCount + 1
    });
    
    // Track claim attempt
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'reward_attempt', {
        event_category: 'daily_gift',
        event_label: 'click_claim',
        value: nextReward
      });
    }
    
    // Execute the actual claim
    const success = await onClaim();
    
    if (success) {
      // Track feature usage - successful claim
      await trackFeatureUsage(userId, 'user_action', 'daily_gift', 'claim_success', {
        coins_amount: nextReward,
        streak_day: weeklyEntryCount + 1
      });
      
      // Track successful claim
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'reward_granted', {
          event_category: 'daily_gift',
          event_label: `day_${weeklyEntryCount + 1}`,
          value: nextReward
        });
      }
      
      // CRITICAL: Show success state on button
      setClaimed(true);
      
      // CRITICAL: Auto-close after 1.5 seconds
      setTimeout(() => {
        onLater();
      }, 1500);
    }
  };

  if (!open) return null;
  
  return (
    <Dialog open={open} onOpenChange={onLater}>
      <DialogContent 
        className="overflow-hidden p-0 border-0 bg-transparent w-screen h-screen max-w-none rounded-none [&>button[data-dialog-close]]:hidden z-[99999]"
        style={{
          margin: 0,
          maxHeight: '100dvh',
          minHeight: '100dvh',
          borderRadius: 0,
          zIndex: 99999
        }}
      >
        {/* Tökéletesen középre igazító, teljes képernyős konténer (fix + flex) */}
        <div 
          className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
          style={{ 
            minHeight: '100dvh', 
            minWidth: '100vw'
          }}
        >
          <DialogTitle className="sr-only">Daily Gift</DialogTitle>
          <DialogDescription className="sr-only">{t('daily_gift.show_reward_description')}</DialogDescription>

          {/* Close X button - PONTOSAN ugyanaz, mint Welcome Bonus */}
          <button
            onClick={onLater}
            disabled={claiming}
            className={`absolute top-[8vh] right-[4vw] text-white/70 hover:text-white font-bold z-30 w-[12vw] h-[12vw] max-w-[60px] max-h-[60px] flex items-center justify-center bg-black/30 hover:bg-black/50 rounded-full transition-all transform duration-500 ease-out focus:outline-none focus-visible:ring-0 ${contentVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
            style={{ fontSize: 'clamp(2rem, 9vw, 3.5rem)', transitionDelay: '0ms' }}
            aria-label={t('daily_gift.close_aria')}
          >
            ×
          </button>

          {/* BONUS MODAL WRAPPER - Fix arányú, skálázódó layout */}
          <div 
            className="relative z-10"
            style={{ 
              width: 'min(420px, 90vw)',
              aspectRatio: '9 / 16',
              transform: contentVisible ? 'scale(1)' : 'scale(0)',
              opacity: contentVisible ? 1 : 0,
              transition: 'transform 1500ms ease-in-out 10ms, opacity 1500ms ease-in-out 10ms',
              transformOrigin: 'center center',
              willChange: contentVisible ? 'transform, opacity' : 'auto'
            }}
          >
            {/* BONUS MODAL CARD - Teljes belső tartalom */}
            <div 
              className="absolute inset-0"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <HexShieldFrame showShine={true}>
              {/* Top Hex Badge - "DAILY GIFT" */}
              <div 
                ref={badgeRef}
                className="relative -mt-12 mb-3 mx-auto z-20" 
                style={{ width: '78%' }}
              >
                <div className="absolute inset-0 translate-y-1 translate-x-1"
                     style={{
                       clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                       background: 'rgba(0,0,0,0.4)',
                       filter: 'blur(4px)',
                       zIndex: -1
                     }} />
                
                <div className="absolute inset-0"
                     style={{
                       clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                       background: 'linear-gradient(135deg, hsl(var(--dup-gold-700)), hsl(var(--dup-gold-600)) 50%, hsl(var(--dup-gold-800)))',
                       boxShadow: 'inset 0 0 0 2px hsl(var(--dup-gold-900)), 0 3px 8px rgba(0,0,0,0.175)'
                     }} />
                
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
                  <div className="absolute inset-[6px]"
                       style={{
                         clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                         background: 'radial-gradient(ellipse 100% 80% at 50% -10%, hsl(220 95% 75%) 0%, hsl(225 90% 65%) 30%, hsl(230 85% 55%) 60%, hsl(235 78% 48%) 100%)',
                         boxShadow: 'inset 0 6px 12px rgba(255,255,255,0.125), inset 0 -6px 12px rgba(0,0,0,0.2)'
                       }} />
                  
                  <div className="absolute inset-[6px] pointer-events-none"
                       style={{
                         clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                         background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.08) 8px, rgba(255,255,255,0.08) 12px, transparent 12px, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 24px)',
                         opacity: 0.7
                       }} />
                  
                  <div className="absolute inset-[6px] pointer-events-none" style={{
                    clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                    background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5), transparent 60%)'
                  }} />
                  
                  <h1 ref={flagRef} className="relative z-10 font-black text-foreground text-center drop-shadow-[0_0_18px_hsl(var(--foreground)/0.3),0_2px_8px_rgba(0,0,0,0.9)]"
                      style={{ 
                        fontSize: 'clamp(1.25rem, 5.2vw, 2.1rem)', 
                        letterSpacing: '0.05em',
                        textShadow: '0 0 12px rgba(255,255,255,0.25)'
                      }}>
                    {t('daily.title')}
                  </h1>
                </div>
              </div>

              {/* Content Area */}
              <div className="relative z-10 flex flex-col items-center justify-between flex-1 px-[8%] pb-[8%] pt-[2%]">
                
                {/* DAY Counter with 3D SVG fire */}
                <div className="flex items-center justify-center gap-2 mb-[3%]">
                  <p className="font-black text-white text-center drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]"
                     style={{ 
                       fontSize: 'clamp(1.5rem, 13cqw, 2.6rem)', 
                       letterSpacing: '0.06em',
                       textShadow: '0 0 16px rgba(255,255,255,0.2)'
                     }}>
                    {t('daily.day_label')} {weeklyEntryCount + 1}
                  </p>
                  
                  {/* 3D Fire SVG - Élethű tűz sárga belső cseppel */}
                  <svg viewBox="0 0 100 120" className="flex-shrink-0" style={{ width: 'clamp(36px, 9vw, 60px)', height: 'auto' }}>
                    <defs>
                      {/* Külső láng gradiens - piros/narancs */}
                      <linearGradient id="fireGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FFD700" />
                        <stop offset="25%" stopColor="#FF8C00" />
                        <stop offset="50%" stopColor="#FF6347" />
                        <stop offset="75%" stopColor="#FF4500" />
                        <stop offset="100%" stopColor="#DC143C" />
                      </linearGradient>
                      {/* Belső sárga csepp gradiens */}
                      <radialGradient id="fireInnerDrop" cx="50%" cy="50%">
                        <stop offset="0%" stopColor="#FFFF00" />
                        <stop offset="40%" stopColor="#FFD700" />
                        <stop offset="70%" stopColor="#FFA500" />
                        <stop offset="100%" stopColor="#FF8C00" />
                      </radialGradient>
                      {/* Fény highlight */}
                      <radialGradient id="fireHighlight" cx="35%" cy="25%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
                        <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                      </radialGradient>
                      <filter id="fireShadow">
                        <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#FF4500" floodOpacity="0.8"/>
                      </filter>
                      <filter id="fireGlow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    {/* Külső láng alakzat */}
                    <path d="M50 10 C40 20, 32 35, 30 55 C28 70, 35 85, 42 92 C45 96, 47 98, 50 100 C53 98, 55 96, 58 92 C65 85, 72 70, 70 55 C68 35, 60 20, 50 10 Z" 
                          fill="url(#fireGrad)" 
                          stroke="#8B0000" 
                          strokeWidth="1" 
                          filter="url(#fireShadow)" 
                          style={{ animation: 'fireFlicker 0.8s ease-in-out infinite' }} />
                    {/* Belső sárga láng - alul, kisebb méretben */}
                    <path d="M50 55 C45 60, 42 68, 41 78 C40 85, 43 91, 46 95 C47 97, 48 98, 50 99 C52 98, 53 97, 54 95 C57 91, 60 85, 59 78 C58 68, 55 60, 50 55 Z" 
                          fill="url(#fireInnerDrop)" 
                          filter="url(#fireGlow)"
                          opacity="0.95"
                          style={{ animation: 'fireFlicker 0.8s ease-in-out infinite 0.1s' }} />
                    {/* Fény highlight a tetején */}
                    <ellipse cx="48" cy="25" rx="10" ry="12" fill="url(#fireHighlight)" opacity="0.5" />
                    <style>{`
                      @keyframes fireFlicker {
                        0%, 100% { transform: scale(1) translateY(0); }
                        50% { transform: scale(1.05) translateY(-2px); }
                      }
                    `}</style>
                  </svg>
                </div>

                {/* Weekly Rewards Preview - 7 boxes with 3D SVG stars and coins */}
                <div className="flex gap-[2.5%] justify-center mb-[4%] flex-wrap w-full">
                  {DAILY_REWARDS.map((reward, index) => {
                    const dayNumber = index + 1;
                    const isActive = dayNumber <= weeklyEntryCount + 1;
                    const displayReward = isPremium ? reward * 2 : reward;
                    
                    return (
                      <div key={dayNumber} className="flex flex-col items-center gap-[1.5%]">
                        {/* 3D Star SVG */}
                        <svg viewBox="0 0 100 100" style={{ 
                          width: 'clamp(21px, 9.75cqw, 36px)', 
                          height: 'auto',
                          filter: isActive 
                            ? `drop-shadow(0 0 6px #FBBF24) drop-shadow(0 0 12px rgba(251,191,36,0.6))` 
                            : 'grayscale(100%) brightness(1.2) drop-shadow(0 0 4px rgba(192,192,192,0.6))'
                        }}>
                          <defs>
                            <linearGradient id={`starGrad${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor={isActive ? "#FFD700" : "#C0C0C0"} />
                              <stop offset="50%" stopColor={isActive ? "#FFA500" : "#A0A0A0"} />
                              <stop offset="100%" stopColor={isActive ? "#FF8C00" : "#808080"} />
                            </linearGradient>
                            <radialGradient id={`starHigh${index}`} cx="30%" cy="25%">
                              <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
                              <stop offset="50%" stopColor="rgba(255,255,255,0.3)" />
                              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                            </radialGradient>
                          </defs>
                          <path d="M50 5 L60 35 L92 35 L67 55 L77 85 L50 65 L23 85 L33 55 L8 35 L40 35 Z" 
                                fill={`url(#starGrad${index})`} 
                                stroke={isActive ? "#B8860B" : "#696969"} 
                                strokeWidth="2" />
                          <ellipse cx="42" cy="25" rx="10" ry="8" fill={`url(#starHigh${index})`} opacity="0.8" />
                        </svg>
                        
                        <div className="relative rounded-lg" style={{ padding: '1.2% 3.5%' }}>
                          <div className="absolute inset-0 rounded-lg"
                               style={{
                                 background: isActive 
                                   ? 'linear-gradient(135deg, hsl(var(--dup-gold-700)), hsl(var(--dup-gold-600)) 50%, hsl(var(--dup-gold-800)))'
                                   : 'linear-gradient(135deg, hsl(0 0% 50%), hsl(0 0% 40%) 50%, hsl(0 0% 30%))',
                                 boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.2)'
                               }} />
                          
                          <div className="absolute inset-[1.5px] rounded-lg"
                               style={{
                                 background: isActive
                                   ? 'linear-gradient(180deg, rgba(65, 105, 225, 0.3), rgba(30, 64, 175, 0.4))'
                                   : 'linear-gradient(180deg, rgba(100, 100, 100, 0.3), rgba(80, 80, 80, 0.4))',
                               }} />
                          
                          <div className="relative z-10 flex items-center justify-center gap-[0.3em]">
                            {/* Mini 3D Coin SVG */}
                            <svg viewBox="0 0 100 100" style={{ width: 'clamp(10px, 5.2cqw, 18px)', height: 'auto' }}>
                              <defs>
                                <linearGradient id={`miniCoinGrad${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#FFD700" />
                                  <stop offset="50%" stopColor="#FFA500" />
                                  <stop offset="100%" stopColor="#FF8C00" />
                                </linearGradient>
                                <radialGradient id={`miniCoinHigh${index}`} cx="35%" cy="30%">
                                  <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
                                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                                </radialGradient>
                              </defs>
                              <circle cx="50" cy="50" r="45" fill={`url(#miniCoinGrad${index})`} stroke="#B8860B" strokeWidth="3" />
                              <ellipse cx="45" cy="40" rx="18" ry="15" fill={`url(#miniCoinHigh${index})`} opacity="0.7" />
                            </svg>
                            <span className="font-bold text-white"
                                  style={{ 
                                    fontSize: 'clamp(0.625rem, 5.2cqw, 0.9rem)',
                                    textShadow: '0 1px 3px rgba(0,0,0,0.8)'
                                  }}>
                              +{displayReward}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Today's Reward - BIG DISPLAY with large 3D coin */}
                <div className="relative rounded-xl mb-[4%]" style={{ padding: '2.5% 8%' }}>
                  <div className="absolute inset-0 rounded-xl translate-y-0.5 translate-x-0.5"
                       style={{
                         background: 'rgba(0,0,0,0.3)',
                         filter: 'blur(4px)',
                         zIndex: -1
                       }} />
                  
                  <div className="absolute inset-0 rounded-xl"
                       style={{
                         background: 'linear-gradient(135deg, hsl(var(--dup-gold-700)), hsl(var(--dup-gold-600)) 50%, hsl(var(--dup-gold-800)))',
                         boxShadow: 'inset 0 0 0 2px hsl(var(--dup-gold-900)), 0 6px 16px rgba(0,0,0,0.35)'
                       }} />
                  
                  <div className="absolute inset-[3px] rounded-xl"
                       style={{
                         background: 'linear-gradient(180deg, hsl(var(--dup-gold-400)), hsl(var(--dup-gold-500)) 40%, hsl(var(--dup-gold-700)))',
                         boxShadow: 'inset 0 1px 0 hsl(var(--dup-gold-300))'
                       }} />
                  
                  <div className="absolute inset-[6px] rounded-xl"
                       style={{
                         background: 'radial-gradient(ellipse 100% 80% at 50% -10%, hsl(var(--dup-purple-500)) 0%, hsl(var(--dup-purple-600)) 40%, hsl(var(--dup-purple-800)) 100%)',
                         boxShadow: 'inset 0 12px 24px rgba(255,255,255,0.15), inset 0 -12px 24px rgba(0,0,0,0.3)'
                       }} />
                  
                  <div className="absolute inset-[6px] rounded-xl pointer-events-none"
                       style={{
                         background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.08) 8px, rgba(255,255,255,0.08) 12px, transparent 12px, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 24px)',
                         opacity: 0.7
                       }} />
                  
                  <div className="absolute inset-[6px] rounded-xl pointer-events-none"
                       style={{
                         background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.35), transparent 60%)'
                       }} />
                  
                  <div className="relative z-10 flex items-center justify-center gap-[0.4em]">
                    {/* Large 3D Coin SVG with pulse animation */}
                    <svg viewBox="0 0 100 100" style={{ 
                      width: 'clamp(32px, 10cqw, 64px)', 
                      height: 'auto',
                      animation: 'bigCoinPulse 1.5s ease-in-out infinite'
                    }}>
                      <defs>
                        <linearGradient id="bigCoinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FFD700" />
                          <stop offset="25%" stopColor="#FFC700" />
                          <stop offset="50%" stopColor="#FFA500" />
                          <stop offset="75%" stopColor="#FF8C00" />
                          <stop offset="100%" stopColor="#FFD700" />
                        </linearGradient>
                        <radialGradient id="bigCoinHighlight" cx="35%" cy="30%">
                          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                          <stop offset="40%" stopColor="rgba(255,255,255,0.4)" />
                          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                        </radialGradient>
                        <filter id="bigCoinShadow">
                          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#FF8C00" floodOpacity="0.8"/>
                        </filter>
                      </defs>
                      {/* Outer rim - 3D effect */}
                      <circle cx="50" cy="50" r="48" fill="url(#bigCoinGrad)" stroke="#B8860B" strokeWidth="3" filter="url(#bigCoinShadow)" />
                      {/* Inner circle with depth */}
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(139,69,19,0.4)" strokeWidth="2" />
                      {/* Highlight effect */}
                      <ellipse cx="42" cy="38" rx="22" ry="18" fill="url(#bigCoinHighlight)" opacity="0.85" />
                      {/* Center emblem */}
                      <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(139,69,19,0.3)" strokeWidth="1.5" />
                    </svg>
                    <span className="font-black text-white"
                          style={{ 
                            fontSize: 'clamp(1.5rem, 12cqw, 2.5rem)',
                            textShadow: '0 0 16px rgba(255,255,255,0.3), 0 2px 8px rgba(0,0,0,0.9)',
                            letterSpacing: '0.02em'
                          }}>
                      +{nextReward}
                    </span>
                  </div>
                  <style>{`
                    @keyframes bigCoinPulse {
                      0%, 100% { 
                        transform: scale(1) rotate(0deg);
                        filter: drop-shadow(0 0 12px rgba(251,191,36,0.8));
                      }
                      50% { 
                        transform: scale(1.08) rotate(5deg);
                        filter: drop-shadow(0 0 20px rgba(251,191,36,1)) drop-shadow(0 0 32px rgba(251,191,36,0.6));
                      }
                    }
                  `}</style>
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
                  <HexAcceptButton
                    onClick={handleClaim}
                    disabled={!canClaim || claiming || claimed}
                    style={{ width: 'var(--sync-width)' }}
                  >
                    {claimed 
                      ? t('daily.claim_button_success') 
                      : claiming 
                        ? t('daily.claim_button_processing') 
                        : t('daily.claim_button_active')}
                  </HexAcceptButton>
                </div>
              </div>
              </HexShieldFrame>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DailyGiftDialog;
