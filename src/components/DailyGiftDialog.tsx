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
          className="relative w-full flex flex-col items-center justify-center p-[4vw] bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900"
          style={{ 
            minHeight: '75vh',
            aspectRatio: '0.7',
            borderRadius: '24px'
          }}
        >
          {/* Sparkle particles background */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-pulse"
                style={{
                  fontSize: `${Math.random() * 8 + 4}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.1}s`,
                  color: ['#FF69B4', '#00CED1', '#FFD700', '#FF1493'][Math.floor(Math.random() * 4)]
                }}
              >
                ✦
              </div>
            ))}
          </div>

          {/* Gift boxes at top */}
          <div className="flex gap-[2vw] mb-[2vh] mt-[2vh] z-10">
            <div className="text-center transform -rotate-12" style={{ fontSize: 'clamp(2rem, 10vw, 3.5rem)' }}>🎁</div>
            <div className="text-center transform rotate-6" style={{ fontSize: 'clamp(2.5rem, 12vw, 4rem)' }}>🎁</div>
            <div className="text-center transform -rotate-6" style={{ fontSize: 'clamp(2rem, 10vw, 3.5rem)' }}>🎁</div>
          </div>

          {/* Banner with YOU WIN */}
          <div className="relative z-10 mb-[3vh]">
            {/* Red ribbon banner */}
            <div className="relative bg-gradient-to-b from-red-500 via-red-600 to-red-700 px-[8vw] py-[2vh] shadow-2xl"
                 style={{
                   clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 85%, 0% 100%)',
                   borderRadius: '12px 12px 0 0'
                 }}>
              <h1 className="font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-orange-500 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] text-center"
                  style={{ 
                    fontSize: 'clamp(2rem, 9vw, 3.5rem)',
                    WebkitTextStroke: '2px rgba(255,165,0,0.3)',
                    letterSpacing: '0.05em'
                  }}>
                YOU WIN
              </h1>
            </div>
          </div>

          {/* Main purple shield/banner card */}
          <div className="relative bg-gradient-to-b from-purple-600 via-purple-700 to-purple-800 rounded-3xl border-8 border-yellow-500 shadow-[0_0_40px_rgba(234,179,8,0.6)] p-[5vw] w-[75vw] max-w-[400px] z-10"
               style={{
                 clipPath: 'polygon(0% 0%, 100% 0%, 100% 85%, 50% 100%, 0% 85%)'
               }}>
            
            {/* Inner golden glow */}
            <div className="absolute inset-[12px] bg-gradient-to-b from-yellow-400/20 to-transparent rounded-2xl pointer-events-none"
                 style={{
                   clipPath: 'polygon(0% 0%, 100% 0%, 100% 85%, 50% 100%, 0% 85%)'
                 }}></div>

            {/* Content */}
            <div className="relative z-10 space-y-[2vh]">
              {/* DAY X */}
              <p className="font-black text-white text-center drop-shadow-lg" 
                 style={{ fontSize: 'clamp(1.25rem, 6vw, 2rem)' }}>
                DAY {weeklyEntryCount + 1}
              </p>

              {/* Stars - show progress */}
              <div className="flex gap-[3vw] justify-center">
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ fontSize: 'clamp(2rem, 10vw, 3.5rem)' }}>
                    {i <= Math.min(weeklyEntryCount + 1, 3) ? '⭐' : '☆'}
                  </div>
                ))}
              </div>

              {/* Rewards box with coin */}
              <div className="bg-gradient-to-b from-purple-500 to-purple-700 border-4 border-yellow-400 rounded-full px-[6vw] py-[2vh] mx-auto w-fit shadow-xl">
                {isPremium ? (
                  <div className="flex flex-col items-center gap-[0.5vh]">
                    <div className="flex items-center gap-[2vw]">
                      <span style={{ fontSize: 'clamp(1.5rem, 7vw, 2.5rem)' }}>🪙</span>
                      <span className="font-black text-yellow-300/50 line-through drop-shadow-lg" 
                            style={{ fontSize: 'clamp(1rem, 5vw, 1.75rem)' }}>
                        +{nextReward / 2}
                      </span>
                    </div>
                    <div className="flex items-center gap-[2vw]">
                      <span style={{ fontSize: 'clamp(1.75rem, 8vw, 3rem)' }}>🪙</span>
                      <span className="font-black text-yellow-300 drop-shadow-lg" 
                            style={{ fontSize: 'clamp(1.5rem, 7vw, 2.5rem)' }}>
                        +{nextReward}
                      </span>
                    </div>
                    <p className="text-yellow-300 font-black text-center" style={{ fontSize: 'clamp(0.625rem, 3vw, 0.875rem)' }}>
                      🌟 GENIUS DUPLA! 🌟
                    </p>
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

              {/* Streak info with fire emoji */}
              <p className="text-white font-bold text-center drop-shadow-lg" 
                 style={{ fontSize: 'clamp(0.875rem, 4vw, 1.25rem)' }}>
                {weeklyEntryCount + 1}. napi belépés 🔥
              </p>
            </div>
          </div>

          {/* Lives bonus indicator - green circle on the right */}
          {isPremium && (
            <div className="absolute right-[6vw] top-[45vh] bg-gradient-to-b from-green-400 to-green-600 border-4 border-green-700 rounded-full w-[15vw] h-[15vw] max-w-[70px] max-h-[70px] flex flex-col items-center justify-center shadow-xl z-20 animate-bounce">
              <span className="text-white font-black" style={{ fontSize: 'clamp(1.25rem, 6vw, 2rem)' }}>+3</span>
              <span style={{ fontSize: 'clamp(0.75rem, 3vw, 1rem)' }}>❤️</span>
            </div>
          )}

          {/* COLLECT button */}
          {canClaim ? (
            <button
              onClick={handleClaim}
              className="bg-gradient-to-b from-pink-400 via-pink-500 to-pink-600 hover:from-pink-500 hover:to-pink-700 text-white font-black rounded-full px-[10vw] py-[2.5vh] shadow-[0_6px_0_rgba(0,0,0,0.4)] active:shadow-none active:translate-y-1 transition-all border-4 border-pink-300 mt-[4vh] z-10"
              style={{ fontSize: 'clamp(1.25rem, 6vw, 2rem)' }}
            >
              COLLECT
            </button>
          ) : (
            <div className="text-center mt-[4vh] z-10">
              <p className="text-white font-black" style={{ fontSize: 'clamp(1rem, 5vw, 1.75rem)' }}>
                ✅ MAI JUTALOM ÁTVÉVE
              </p>
            </div>
          )}

          {/* Streak progress indicators at bottom */}
          <div className="flex gap-[1.5vw] mt-[3vh] justify-center flex-wrap max-w-[85vw] z-10">
            {DAILY_REWARDS.map((reward, index) => (
              <div
                key={index}
                className={`
                  rounded-xl px-[2.5vw] py-[1.5vh] border-3 text-center transition-all
                  ${index < weeklyEntryCount ? 'bg-cyan-400 border-cyan-600 shadow-lg' : ''}
                  ${index === weeklyEntryCount ? 'bg-yellow-400 border-yellow-600 animate-pulse shadow-xl scale-110' : ''}
                  ${index > weeklyEntryCount ? 'bg-gray-600/50 border-gray-500' : ''}
                `}
                style={{ minWidth: '11vw' }}
              >
                <p className="text-white font-black drop-shadow-md" style={{ fontSize: 'clamp(0.75rem, 3vw, 1rem)' }}>
                  {index + 1}
                </p>
              </div>
            ))}
          </div>

          {/* 7th day indicator */}
          <div className="mt-[1vh] z-10">
            <div className={`rounded-xl px-[3vw] py-[1.5vh] border-3 text-center ${weeklyEntryCount >= 6 ? 'bg-purple-500 border-purple-700' : 'bg-gray-600/50 border-gray-500'}`}>
              <p className="text-white font-black" style={{ fontSize: 'clamp(0.75rem, 3vw, 1rem)' }}>7</p>
            </div>
          </div>

          {/* Close X button top right */}
          <button
            onClick={onLater}
            className="absolute top-[2vh] right-[4vw] text-white/80 hover:text-white font-bold z-20"
            style={{ fontSize: 'clamp(1.5rem, 7vw, 2.5rem)' }}
          >
            ×
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DailyGiftDialog;
