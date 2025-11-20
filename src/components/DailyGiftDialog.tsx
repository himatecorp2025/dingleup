import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';
import { trackBonusEvent } from '@/lib/analytics';
import { supabase } from '@/integrations/supabase/client';
import HexShieldFrame from './frames/HexShieldFrame';
import HexAcceptButton from './ui/HexAcceptButton';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
      };
    } else {
      setContentVisible(false);
      setBurstActive(false);
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
      // Track successful claim
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'reward_granted', {
          event_category: 'daily_gift',
          event_label: `day_${weeklyEntryCount + 1}`,
          value: nextReward
        });
      }
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
        {/* Középre igazító, teljes képernyős konténer (fix + flex) */}
        <div 
          className="fixed inset-0 flex flex-col items-center overflow-hidden"
          style={{ 
            minHeight: '100dvh', 
            minWidth: '100vw',
            justifyContent: 'center',
            paddingTop: '0',
            marginTop: '-3vh'  // 3% feljebb, vertikális center javítás
          }}
        >
          <DialogTitle className="sr-only">{t('dialogs.dailyGift.title')}</DialogTitle>
          <DialogDescription className="sr-only">{t('dialogs.dailyGift.subtitle')}</DialogDescription>

          {/* Háttér gradiens */}
          <div
            className="absolute inset-0 -z-10 pointer-events-none"
            style={{
              background:
                "radial-gradient(120% 80% at 50% 10%, rgba(20,30,60,0.6), rgba(10,14,28,0.95))",
            }}
          />

          {/* Bezáró X - közelebb a pajzshoz (top: 2vh helyett 1vh) */}
          <button
            onClick={onLater}
            aria-label={t('common.close')}
            className="absolute z-[10001] rounded-full text-white/80 hover:text-white bg-black/30 hover:bg-black/50 transition-all flex items-center justify-center"
            style={{
              top: "max(1vh, env(safe-area-inset-top))",
              right: "max(1vh, env(safe-area-inset-right))",
              width: "clamp(36px, 8svw, 48px)",
              height: "clamp(36px, 8svw, 48px)",
              fontSize: "clamp(18px, 5svw, 28px)",
              lineHeight: 1,
            }}
          >
            ×
          </button>

          {/* Zoom animáció wrapper - 1.5mp scale-in középről + mély 3D hatás */}
          <div 
            className="relative z-10 w-full max-w-[min(95vw,600px)] mx-auto flex items-center justify-center"
            style={{ 
              transform: contentVisible ? 'scale(1)' : 'scale(0)',
              opacity: contentVisible ? 1 : 0,
              transition: 'transform 1500ms ease-in-out 10ms, opacity 1500ms ease-in-out 10ms',
              transformOrigin: 'center center',
              willChange: contentVisible ? 'transform, opacity' : 'auto',
              perspective: '1200px'
            }}
          >
            {/* Deep 3D outer wrapper */}
            <div className="relative w-full" style={{ transform: 'scale(1)' }}>
              {/* BASE SHADOW */}
              <div className="absolute inset-0 bg-black/70 rounded-3xl" style={{ transform: 'translate(8px, 8px)', filter: 'blur(12px)' }} aria-hidden />
              
              {/* OUTER FRAME */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-dark via-primary to-primary-dark opacity-95 border-4 border-primary/60 shadow-2xl" style={{ transform: 'translateZ(0px)' }} aria-hidden />
              
              {/* MIDDLE FRAME */}
              <div className="absolute inset-[6px] rounded-3xl bg-gradient-to-b from-background/50 via-transparent to-background/70" style={{ boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.15), inset 0 -1.5px 0 rgba(0,0,0,0.3)', transform: 'translateZ(15px)' }} aria-hidden />
              
              {/* INNER LAYER */}
              <div className="absolute inset-[8px] rounded-3xl bg-gradient-to-br from-primary-dark/60 to-primary-dark/60" style={{ boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.1), inset 0 -8px 16px rgba(0,0,0,0.25)', transform: 'translateZ(30px)' }} aria-hidden />
              
              {/* SPECULAR HIGHLIGHT */}
              <div className="absolute inset-[8px] rounded-3xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 140% 100% at 50% 0%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 35%, transparent 75%)', transform: 'translateZ(45px)' }} aria-hidden />
              
              <div className="relative" style={{ transform: 'translateZ(60px)' }}>
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
                         background: 'radial-gradient(ellipse 100% 80% at 50% -10%, hsl(0 95% 75%) 0%, hsl(0 90% 65%) 30%, hsl(0 85% 55%) 60%, hsl(0 78% 48%) 100%)',
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
                    {t('dialogs.dailyGift.title')}
                  </h1>
                </div>
              </div>

              {/* Content Area */}
              <div className="relative z-10 flex flex-col items-center justify-between flex-1 px-[8%] pb-[8%] pt-[2%]">
                
                {/* DAY Counter with fire emoji */}
                <p className="font-black text-white text-center drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] mb-[3%]"
                   style={{ 
                     fontSize: 'clamp(1.5rem, 13cqw, 2.6rem)', 
                     letterSpacing: '0.06em',
                     textShadow: '0 0 16px rgba(255,255,255,0.2)'
                   }}>
                  {t('dialogs.dailyGift.dayNumber', { day: weeklyEntryCount + 1 })}
                </p>

                {/* Weekly Rewards Preview - 7 boxes */}
                <div className="flex gap-[2.5%] justify-center mb-[4%] flex-wrap w-full">
                  {DAILY_REWARDS.map((reward, index) => {
                    const dayNumber = index + 1;
                    const isActive = dayNumber <= weeklyEntryCount + 1;
                    const displayReward = isPremium ? reward * 2 : reward;
                    
                    return (
                      <div key={dayNumber} className="flex flex-col items-center gap-[1.5%]">
                        <div
                          style={{ 
                            fontSize: 'clamp(0.875rem, 6.5cqw, 1.2rem)',
                            filter: isActive 
                              ? `drop-shadow(0 0 6px hsl(var(--dup-gold-500)))` 
                              : 'grayscale(100%) brightness(1.2) drop-shadow(0 0 4px rgba(192,192,192,0.6))'
                          }}>
                          ⭐
                        </div>
                        
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
                                   ? 'linear-gradient(180deg, rgba(139, 92, 246, 0.3), rgba(109, 40, 217, 0.4))'
                                   : 'linear-gradient(180deg, rgba(100, 100, 100, 0.3), rgba(80, 80, 80, 0.4))',
                               }} />
                          
                          <div className="relative z-10 flex items-center justify-center gap-[0.3em]">
                            <span style={{ fontSize: 'clamp(0.625rem, 5.2cqw, 0.9rem)' }}>🪙</span>
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

                {/* Today's Reward - BIG DISPLAY */}
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
                    <span style={{ fontSize: 'clamp(1.25rem, 10cqw, 2rem)' }}>🪙</span>
                    <span className="font-black text-white"
                          style={{ 
                            fontSize: 'clamp(1.5rem, 12cqw, 2.5rem)',
                            textShadow: '0 0 16px rgba(255,255,255,0.3), 0 2px 8px rgba(0,0,0,0.9)',
                            letterSpacing: '0.02em'
                          }}>
                      +{nextReward}
                    </span>
                  </div>
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
                    disabled={!canClaim || claiming}
                    style={{ width: 'var(--sync-width)' }}
                  >
                    {claiming ? "FELDOLGOZÁS..." : "IGÉNYLEM"}
                  </HexAcceptButton>
                </div>
              </div>
            </HexShieldFrame>
            </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DailyGiftDialog;
