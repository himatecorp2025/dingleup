import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';
import { trackBonusEvent } from '@/lib/analytics';
import { supabase } from '@/integrations/supabase/client';

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

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setContentVisible(true), 10);
      return () => {
        clearTimeout(t);
        setContentVisible(false);
      };
    } else {
      setContentVisible(false);
    }
  }, [open]);

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
        className="overflow-hidden p-0 border-0 bg-transparent w-screen h-screen max-w-none"
        style={{ 
          margin: 0,
          maxHeight: '100vh'
        }}
      >
        <div 
          className="fixed inset-0 flex flex-col items-center justify-center"
        >
          {/* Background layer - 50% transparent */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-blue-950 opacity-50"></div>
          {/* Animated radial glow from center */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-50">
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] animate-spin"
              style={{
                background: 'conic-gradient(from 0deg, transparent 0%, rgba(147,51,234,0.3) 10%, transparent 20%, rgba(147,51,234,0.3) 30%, transparent 40%, rgba(147,51,234,0.3) 50%, transparent 60%, rgba(147,51,234,0.3) 70%, transparent 80%, rgba(147,51,234,0.3) 90%, transparent 100%)',
                animationDuration: '20s'
              }}
            ></div>
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] animate-spin"
              style={{
                background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(147,51,234,0.2) 30%, transparent 70%)',
                animationDuration: '15s',
                animationDirection: 'reverse'
              }}
            ></div>
          </div>

          {/* Floating sparkle particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full animate-pulse"
                style={{
                  width: `${Math.random() * 4 + 2}px`,
                  height: `${Math.random() * 4 + 2}px`,
                  background: ['#FF69B4', '#DA70D6', '#BA55D3', '#9370DB', '#DDA0DD'][Math.floor(Math.random() * 5)],
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: `${Math.random() * 3 + 2}s`,
                  boxShadow: '0 0 10px currentColor'
                }}
              />
            ))}
          </div>

          {/* Central content container - ZOOM IN ANIMATION */}
          <div className={`relative z-10 flex flex-col items-center transform transition-all duration-500 ease-out ${contentVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            {/* Gift boxes at top - 3D style */}
            <div className="flex gap-[3vw] mb-[2vh]">
              <div className="transform -rotate-12 drop-shadow-2xl" style={{ fontSize: 'clamp(2.5rem, 10vw, 4.5rem)' }}>🎁</div>
              <div className="transform rotate-6 drop-shadow-2xl" style={{ fontSize: 'clamp(3rem, 12vw, 5.5rem)' }}>🎁</div>
              <div className="transform -rotate-6 drop-shadow-2xl" style={{ fontSize: 'clamp(2.5rem, 10vw, 4.5rem)' }}>🎁</div>
            </div>

            {/* DAILY GIFT banner with 3D ribbon */}
            <div className="relative mb-[3vh]">
              <div className="relative bg-gradient-to-b from-red-500 via-red-600 to-red-700 px-[12vw] py-[2.5vh] shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                   style={{
                     clipPath: 'polygon(5% 0%, 95% 0%, 100% 50%, 95% 100%, 85% 95%, 50% 100%, 15% 95%, 5% 100%, 0% 50%)'
                   }}>
                {/* 3D effect layers */}
                <div className="absolute inset-0 bg-gradient-to-b from-red-400/30 to-transparent"
                     style={{
                       clipPath: 'polygon(5% 0%, 95% 0%, 100% 50%, 95% 100%, 85% 95%, 50% 100%, 15% 95%, 5% 100%, 0% 50%)'
                     }}></div>
                
                <h1 className="font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-orange-400 text-center drop-shadow-[0_4px_15px_rgba(0,0,0,1)] relative z-10"
                    style={{ 
                      fontSize: 'clamp(2rem, 8vw, 3.5rem)',
                      WebkitTextStroke: '2px rgba(255,165,0,0.5)',
                      letterSpacing: '0.08em'
                    }}>
                  DAILY GIFT
                </h1>
              </div>
            </div>

            {/* Central flag/banner - with purple radial glow */}
            <div className="relative">
              {/* Purple radial glow effect behind flag */}
              <div className="absolute inset-0 -z-10"
                   style={{
                     background: 'radial-gradient(ellipse, rgba(147,51,234,0.8) 0%, rgba(126,34,206,0.6) 25%, rgba(107,33,168,0.4) 40%, rgba(88,28,135,0.2) 55%, transparent 70%)',
                     width: '180%',
                     height: '180%',
                     left: '-40%',
                     top: '-40%',
                     filter: 'blur(30px)',
                     animation: 'pulse 3s ease-in-out infinite'
                   }}></div>

              {/* Flag/Banner shape */}
              <div className="relative bg-gradient-to-b from-purple-600 via-purple-700 to-purple-800 border-8 border-yellow-500 shadow-[0_0_80px_rgba(234,179,8,0.9)] p-[6vw]"
                   style={{
                     clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 95% 80%, 90% 85%, 85% 88%, 80% 90%, 75% 91%, 70% 92%, 65% 92%, 60% 92%, 55% 91%, 50% 90%, 45% 91%, 40% 92%, 35% 92%, 30% 92%, 25% 91%, 20% 90%, 15% 88%, 10% 85%, 5% 80%, 0% 75%)',
                     width: 'clamp(280px, 55vw, 450px)',
                     minHeight: '50vh',
                     maxHeight: '55vh'
                   }}>
                
                {/* Inner golden glow */}
                <div className="absolute inset-[12px] bg-gradient-to-b from-yellow-400/25 via-yellow-500/10 to-transparent pointer-events-none"
                     style={{
                       clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 95% 80%, 90% 85%, 85% 88%, 80% 90%, 75% 91%, 70% 92%, 65% 92%, 60% 92%, 55% 91%, 50% 90%, 45% 91%, 40% 92%, 35% 92%, 30% 92%, 25% 91%, 20% 90%, 15% 88%, 10% 85%, 5% 80%, 0% 75%)'
                     }}></div>
                
                {/* Wavy bottom edge gradient effect */}
                <div className="absolute bottom-0 left-0 right-0 h-[15%] bg-gradient-to-b from-transparent via-yellow-500/30 to-pink-500/40 pointer-events-none"
                     style={{
                       clipPath: 'polygon(0% 25%, 5% 30%, 10% 35%, 15% 38%, 20% 40%, 25% 41%, 30% 42%, 35% 42%, 40% 42%, 45% 41%, 50% 40%, 55% 41%, 60% 42%, 65% 42%, 70% 42%, 75% 41%, 80% 40%, 85% 38%, 90% 35%, 95% 30%, 100% 25%, 100% 100%, 0% 100%)'
                     }}></div>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-[2.5vh]">
                  {/* DAY X */}
                  <p className="font-black text-white text-center drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]" 
                     style={{ fontSize: 'clamp(1.5rem, 6vw, 2.25rem)', letterSpacing: '0.1em' }}>
                    DAY {weeklyEntryCount + 1}
                  </p>

                  {/* 7 Stars - day progress */}
                  <div className="flex gap-[2vw] justify-center py-[1vh]">
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                      <div
                        key={day}
                        className={`transition-all duration-500 ${day <= weeklyEntryCount + 1 ? 'scale-100 opacity-100' : 'scale-75 opacity-30'}`}
                        style={{ 
                          fontSize: 'clamp(1.25rem, 5vw, 2rem)',
                          filter: day <= weeklyEntryCount + 1 ? 'drop-shadow(0 0 8px gold)' : 'grayscale(1)'
                        }}
                      >
                        {day <= weeklyEntryCount + 1 ? '⭐' : '☆'}
                      </div>
                    ))}
                  </div>

                  {/* Coin reward in oval */}
                  <div className="bg-gradient-to-b from-purple-500 to-purple-700 border-4 border-yellow-400 rounded-full px-[7vw] py-[2vh] shadow-[0_8px_25px_rgba(0,0,0,0.5)]">
                    {isPremium ? (
                      <div className="flex flex-col items-center gap-[0.5vh]">
                        <div className="flex items-center gap-[2vw]">
                          <span style={{ fontSize: 'clamp(1.5rem, 6vw, 2.25rem)' }}>🪙</span>
                          <span className="font-black text-yellow-300/50 line-through" 
                                style={{ fontSize: 'clamp(1rem, 4.5vw, 1.5rem)' }}>
                            +{nextReward / 2}
                          </span>
                        </div>
                        <div className="flex items-center gap-[2vw]">
                          <span style={{ fontSize: 'clamp(2rem, 8vw, 3rem)' }}>🪙</span>
                          <span className="font-black text-yellow-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]" 
                                style={{ fontSize: 'clamp(1.75rem, 7vw, 2.75rem)' }}>
                            +{nextReward}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-[2vw]">
                        <span style={{ fontSize: 'clamp(2rem, 8vw, 3.25rem)' }}>🪙</span>
                        <span className="font-black text-yellow-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]" 
                              style={{ fontSize: 'clamp(1.75rem, 7vw, 2.75rem)' }}>
                          +{nextReward}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Streak text */}
                  <p className="text-white font-bold text-center drop-shadow-lg" 
                     style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1.125rem)' }}>
                    {weeklyEntryCount + 1}. napi belépés 🔥
                  </p>
                </div>
              </div>
            </div>

            {/* Lives bonus - green circle on the right side of flag */}
            {isPremium && (
              <div className="absolute -right-[12vw] top-[45%] bg-gradient-to-b from-green-400 to-green-600 border-4 border-white rounded-full w-[18vw] h-[18vw] max-w-[90px] max-h-[90px] flex flex-col items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.6)] z-20 animate-bounce">
                <span className="text-white font-black drop-shadow-lg" style={{ fontSize: 'clamp(1.25rem, 6vw, 2rem)' }}>+3</span>
                <span style={{ fontSize: 'clamp(1rem, 4vw, 1.5rem)' }}>❤️</span>
              </div>
            )}

            {/* COLLECT button */}
            {canClaim ? (
              <button
                onClick={handleClaim}
                className="bg-gradient-to-b from-pink-400 via-pink-500 to-pink-600 hover:from-pink-500 hover:to-pink-700 text-white font-black rounded-full px-[14vw] py-[3vh] shadow-[0_10px_35px_rgba(0,0,0,0.5)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)] active:shadow-none active:translate-y-1 transition-all border-4 border-pink-300 mt-[3vh]"
                style={{ fontSize: 'clamp(1.25rem, 5.5vw, 2rem)' }}
              >
                COLLECT
              </button>
            ) : (
              <div className="text-center mt-[3vh]">
                <p className="text-white font-black drop-shadow-[0_4px_15px_rgba(0,0,0,0.8)]" style={{ fontSize: 'clamp(1rem, 5vw, 1.75rem)' }}>
                  ✅ MAI JUTALOM ÁTVÉVE
                </p>
              </div>
            )}
          </div>

          {/* Close X button - top right - ZOOM IN ANIMATION */}
          <button
            onClick={onLater}
            className={`absolute top-[3vh] right-[4vw] text-white/70 hover:text-white font-bold z-30 w-[12vw] h-[12vw] max-w-[60px] max-h-[60px] flex items-center justify-center bg-black/30 hover:bg-black/50 rounded-full transition-all transform duration-500 ease-out ${contentVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            style={{ fontSize: 'clamp(2rem, 9vw, 3.5rem)', transitionDelay: '150ms' }}
          >
            ×
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DailyGiftDialog;
