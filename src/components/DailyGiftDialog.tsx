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
        className="overflow-hidden p-0 border-0 bg-transparent max-w-[95vw] w-[95vw]"
        style={{ 
          height: 'auto',
          maxHeight: '90vh'
        }}
      >
        <div 
          className="relative w-full flex flex-col items-center justify-center p-[4vw] bg-gradient-to-br from-indigo-950 via-purple-950 to-blue-950"
          style={{ 
            minHeight: '80vh',
            aspectRatio: '0.7',
            borderRadius: '24px'
          }}
        >
          {/* Sparkle particles background */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
            {[...Array(40)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full animate-pulse"
                style={{
                  width: `${Math.random() * 4 + 2}px`,
                  height: `${Math.random() * 4 + 2}px`,
                  background: ['#FF69B4', '#DA70D6', '#BA55D3', '#9370DB'][Math.floor(Math.random() * 4)],
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: `${Math.random() * 2 + 2}s`
                }}
              />
            ))}
          </div>

          {/* Gift boxes at top */}
          <div className="flex gap-[3vw] mb-[3vh] mt-[3vh] z-10">
            <div className="transform -rotate-12" style={{ fontSize: 'clamp(2.5rem, 11vw, 4rem)' }}>🎁</div>
            <div className="transform rotate-6" style={{ fontSize: 'clamp(3rem, 13vw, 5rem)' }}>🎁</div>
            <div className="transform -rotate-6" style={{ fontSize: 'clamp(2.5rem, 11vw, 4rem)' }}>🎁</div>
          </div>

          {/* YOU WIN banner with ribbon */}
          <div className="relative z-10 mb-[4vh]">
            <div className="relative bg-gradient-to-b from-red-500 via-red-600 to-red-700 px-[10vw] py-[2.5vh] shadow-2xl"
                 style={{
                   clipPath: 'polygon(5% 0%, 95% 0%, 100% 50%, 95% 100%, 85% 95%, 50% 100%, 15% 95%, 5% 100%, 0% 50%)'
                 }}>
              <h1 className="font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-orange-400 text-center drop-shadow-[0_4px_12px_rgba(0,0,0,1)]"
                  style={{ 
                    fontSize: 'clamp(2rem, 9vw, 4rem)',
                    WebkitTextStroke: '2px rgba(255,165,0,0.4)',
                    letterSpacing: '0.05em'
                  }}>
                YOU WIN
              </h1>
            </div>
          </div>

          {/* Central shield/badge - radial glow behind */}
          <div className="relative z-10">
            {/* Purple radial glow effect */}
            <div className="absolute inset-0 -z-10"
                 style={{
                   background: 'radial-gradient(circle, rgba(147,51,234,0.6) 0%, rgba(126,34,206,0.4) 30%, rgba(107,33,168,0.2) 50%, transparent 70%)',
                   width: '140%',
                   height: '140%',
                   left: '-20%',
                   top: '-20%',
                   filter: 'blur(20px)'
                 }}></div>

            {/* Shield/badge shape */}
            <div className="relative bg-gradient-to-b from-purple-600 via-purple-700 to-purple-800 border-8 border-yellow-500 shadow-[0_0_60px_rgba(234,179,8,0.8)] p-[5vw] w-[70vw] max-w-[400px]"
                 style={{
                   clipPath: 'polygon(50% 0%, 100% 20%, 100% 80%, 50% 100%, 0% 80%, 0% 20%)',
                   aspectRatio: '0.85'
                 }}>
              
              {/* Inner glow */}
              <div className="absolute inset-[12px] bg-gradient-to-b from-yellow-400/20 via-transparent to-transparent rounded-xl pointer-events-none"
                   style={{
                     clipPath: 'polygon(50% 0%, 100% 20%, 100% 80%, 50% 100%, 0% 80%, 0% 20%)'
                   }}></div>

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-[2vh]">
                {/* DAY X */}
                <p className="font-black text-white text-center drop-shadow-lg" 
                   style={{ fontSize: 'clamp(1.5rem, 7vw, 2.5rem)' }}>
                  DAY {weeklyEntryCount + 1}
                </p>

                {/* Stars */}
                <div className="flex gap-[3vw] justify-center">
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ fontSize: 'clamp(2rem, 9vw, 3.5rem)' }}>
                      {i <= Math.min(weeklyEntryCount + 1, 3) ? '⭐' : '☆'}
                    </div>
                  ))}
                </div>

                {/* Coin reward in oval */}
                <div className="bg-gradient-to-b from-purple-500 to-purple-700 border-4 border-yellow-400 rounded-full px-[7vw] py-[2.5vh] shadow-2xl">
                  {isPremium ? (
                    <div className="flex flex-col items-center gap-[0.5vh]">
                      <div className="flex items-center gap-[2vw]">
                        <span style={{ fontSize: 'clamp(1.5rem, 7vw, 2.5rem)' }}>🪙</span>
                        <span className="font-black text-yellow-300/50 line-through" 
                              style={{ fontSize: 'clamp(1rem, 5vw, 1.75rem)' }}>
                          +{nextReward / 2}
                        </span>
                      </div>
                      <div className="flex items-center gap-[2vw]">
                        <span style={{ fontSize: 'clamp(2rem, 9vw, 3.5rem)' }}>🪙</span>
                        <span className="font-black text-yellow-300 drop-shadow-lg" 
                              style={{ fontSize: 'clamp(1.75rem, 8vw, 3rem)' }}>
                          +{nextReward}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-[2vw]">
                      <span style={{ fontSize: 'clamp(2rem, 9vw, 3.5rem)' }}>🪙</span>
                      <span className="font-black text-yellow-300 drop-shadow-lg" 
                            style={{ fontSize: 'clamp(1.75rem, 8vw, 3rem)' }}>
                        +{nextReward}
                      </span>
                    </div>
                  )}
                </div>

                {/* Streak text */}
                <p className="text-white font-bold text-center drop-shadow-lg" 
                   style={{ fontSize: 'clamp(0.875rem, 4vw, 1.25rem)' }}>
                  {weeklyEntryCount + 1}. napi belépés 🔥
                </p>
              </div>
            </div>
          </div>

          {/* Lives bonus - green circle */}
          {isPremium && (
            <div className="absolute right-[8vw] top-[48vh] bg-gradient-to-b from-green-400 to-green-600 border-4 border-white rounded-full w-[16vw] h-[16vw] max-w-[80px] max-h-[80px] flex flex-col items-center justify-center shadow-2xl z-20 animate-bounce">
              <span className="text-white font-black" style={{ fontSize: 'clamp(1.25rem, 6vw, 2rem)' }}>+3</span>
              <span style={{ fontSize: 'clamp(1rem, 4vw, 1.5rem)' }}>❤️</span>
            </div>
          )}

          {/* COLLECT button */}
          {canClaim ? (
            <button
              onClick={handleClaim}
              className="bg-gradient-to-b from-pink-400 via-pink-500 to-pink-600 hover:from-pink-500 hover:to-pink-700 text-white font-black rounded-full px-[12vw] py-[3vh] shadow-[0_8px_0_rgba(0,0,0,0.4)] active:shadow-none active:translate-y-1 transition-all border-4 border-pink-300 mt-[5vh] z-10"
              style={{ fontSize: 'clamp(1.25rem, 6vw, 2.25rem)' }}
            >
              COLLECT
            </button>
          ) : (
            <div className="text-center mt-[5vh] z-10">
              <p className="text-white font-black" style={{ fontSize: 'clamp(1rem, 5vw, 1.75rem)' }}>
                ✅ MAI JUTALOM ÁTVÉVE
              </p>
            </div>
          )}

          {/* Close X button */}
          <button
            onClick={onLater}
            className="absolute top-[2vh] right-[4vw] text-white/80 hover:text-white font-bold z-20 w-[10vw] h-[10vw] max-w-[50px] max-h-[50px] flex items-center justify-center"
            style={{ fontSize: 'clamp(1.75rem, 8vw, 3rem)' }}
          >
            ×
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DailyGiftDialog;
