import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';
import { trackBonusEvent } from '@/lib/analytics';
import { supabase } from '@/integrations/supabase/client';
import celebrationBg from '@/assets/popup-celebration.jpeg';

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
          className="relative w-full flex flex-col items-center justify-between p-[4vw] bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${celebrationBg})`,
            minHeight: '70vh',
            aspectRatio: '0.75'
          }}
        >
          {/* Title */}
          <div className="text-center space-y-[2vh] pt-[5vh] pb-[3vh] w-full">
            <h1 className="font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-500 to-orange-600 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" 
                style={{ fontSize: 'clamp(1.75rem, 8vw, 3.5rem)', lineHeight: '1.1' }}>
              YOU WIN
            </h1>
            <p className="font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" 
               style={{ fontSize: 'clamp(1rem, 4vw, 1.5rem)' }}>
              DAY {weeklyEntryCount + 1}
            </p>
          </div>

          {/* Stars - show progress */}
          <div className="flex gap-[3vw] my-[2vh]">
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ fontSize: 'clamp(2rem, 12vw, 5rem)' }}>
                {i <= Math.min(weeklyEntryCount + 1, 3) ? '⭐' : '☆'}
              </div>
            ))}
          </div>

          {/* Rewards box */}
          <div className="bg-purple-600/90 border-4 border-yellow-400 rounded-2xl px-[5vw] py-[2vh] my-[2vh] backdrop-blur-sm">
            {isPremium ? (
              <div className="flex flex-col items-center gap-[1vh]">
                <div className="flex items-center gap-[2vw]">
                  <span style={{ fontSize: 'clamp(2rem, 10vw, 4rem)' }}>🪙</span>
                  <span className="font-black text-yellow-300/50 line-through drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" 
                        style={{ fontSize: 'clamp(1.25rem, 5vw, 2rem)' }}>
                    +{nextReward / 2}
                  </span>
                </div>
                <div className="flex items-center gap-[2vw]">
                  <span style={{ fontSize: 'clamp(2rem, 10vw, 4rem)' }}>🪙</span>
                  <span className="font-black text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" 
                        style={{ fontSize: 'clamp(1.5rem, 6vw, 2.5rem)' }}>
                    +{nextReward}
                  </span>
                </div>
                <p className="text-yellow-300 font-black text-center" style={{ fontSize: 'clamp(0.75rem, 3vw, 1rem)' }}>
                  🌟 GENIUS DUPLA! 🌟
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-[2vw]">
                <span style={{ fontSize: 'clamp(2rem, 10vw, 4rem)' }}>🪙</span>
                <span className="font-black text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" 
                      style={{ fontSize: 'clamp(1.5rem, 6vw, 2.5rem)' }}>
                  +{nextReward}
                </span>
              </div>
            )}
          </div>

          {/* Streak info */}
          <p className="text-white font-bold text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" 
             style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1.25rem)' }}>
            {weeklyEntryCount + 1}. napi belépés 🔥
          </p>

          {/* Collect button */}
          {canClaim ? (
            <button
              onClick={handleClaim}
              className="bg-gradient-to-b from-pink-500 to-pink-700 hover:from-pink-600 hover:to-pink-800 text-white font-black rounded-full px-[8vw] py-[2vh] shadow-[0_4px_0_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-1 transition-all border-4 border-white/30 mt-[3vh]"
              style={{ fontSize: 'clamp(1rem, 4.5vw, 1.75rem)' }}
            >
              COLLECT
            </button>
          ) : (
            <div className="text-center mt-[3vh]">
              <p className="text-white font-black" style={{ fontSize: 'clamp(1rem, 4vw, 1.5rem)' }}>
                ✅ MAI JUTALOM ÁTVÉVE
              </p>
            </div>
          )}

          {/* Streak indicator */}
          <div className="flex gap-[1vw] mt-[2vh] justify-center flex-wrap max-w-[80vw]">
            {DAILY_REWARDS.map((reward, index) => (
              <div
                key={index}
                className={`
                  rounded-lg px-[2vw] py-[1vh] border-2 text-center
                  ${index < weeklyEntryCount ? 'bg-cyan-500 border-cyan-300' : ''}
                  ${index === weeklyEntryCount ? 'bg-yellow-500 border-yellow-300 animate-pulse' : ''}
                  ${index > weeklyEntryCount ? 'bg-gray-600 border-gray-400' : ''}
                `}
                style={{ minWidth: '12vw', maxWidth: '15vw' }}
              >
                <p className="text-white font-black" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.875rem)' }}>
                  {index + 1}
                </p>
              </div>
            ))}
          </div>

          {/* Later button */}
          <button
            onClick={onLater}
            className="text-white/70 hover:text-white font-bold mt-[2vh]"
            style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1.125rem)' }}
          >
            {canClaim ? 'Később' : 'Bezárás'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DailyGiftDialog;
