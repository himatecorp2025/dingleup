import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { usePlatformDetection } from '@/hooks/usePlatformDetection';
import { trackBonusEvent } from '@/lib/analytics';
import { supabase } from '@/integrations/supabase/client';
import celebrationBg from '@/assets/popup-celebration.jpeg';

interface WelcomeBonusDialogProps {
  open: boolean;
  onClaim: () => Promise<boolean>;
  onLater: () => void;
  claiming: boolean;
}

export const WelcomeBonusDialog = ({ open, onClaim, onLater, claiming }: WelcomeBonusDialogProps) => {
  const [userId, setUserId] = useState<string | null>(null);
  const isHandheld = usePlatformDetection();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  useEffect(() => {
    if (open && userId) {
      trackBonusEvent(userId, 'welcome_shown', 'welcome', {
        coins_amount: 2500,
        lives_amount: 50
      });
    }
  }, [open, userId]);

  const handleClaim = async () => {
    const success = await onClaim();
    if (success && userId) {
      trackBonusEvent(userId, 'welcome_claimed', 'welcome', {
        coins_amount: 2500,
        lives_amount: 50
      });
    }
  };

  if (!isHandheld || !open) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
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
              LEVEL 1
            </p>
          </div>

          {/* Stars */}
          <div className="flex gap-[3vw] my-[2vh]">
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ fontSize: 'clamp(2rem, 12vw, 5rem)' }}>
                ⭐
              </div>
            ))}
          </div>

          {/* Rewards box */}
          <div className="bg-purple-600/90 border-4 border-yellow-400 rounded-2xl px-[5vw] py-[2vh] my-[2vh] backdrop-blur-sm">
            <div className="flex items-center gap-[2vw]">
              <span style={{ fontSize: 'clamp(2rem, 10vw, 4rem)' }}>🪙</span>
              <span className="font-black text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" 
                    style={{ fontSize: 'clamp(1.5rem, 6vw, 2.5rem)' }}>
                +2,500
              </span>
            </div>
          </div>

          {/* Bonus lives info */}
          <p className="text-white font-bold text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" 
             style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1.25rem)' }}>
            +50 Élet Bónusz! 💝
          </p>

          {/* Collect button */}
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="bg-gradient-to-b from-pink-500 to-pink-700 hover:from-pink-600 hover:to-pink-800 disabled:from-pink-300 disabled:to-pink-500 text-white font-black rounded-full px-[8vw] py-[2vh] shadow-[0_4px_0_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-1 transition-all border-4 border-white/30 mt-[3vh] disabled:cursor-not-allowed"
            style={{ fontSize: 'clamp(1rem, 4.5vw, 1.75rem)' }}
          >
            {claiming ? 'Feldolgozás...' : 'COLLECT'}
          </button>

          {/* Lives indicator */}
          <div className="absolute top-[2vh] right-[4vw] bg-green-500 border-4 border-white rounded-full w-[15vw] h-[15vw] max-w-[60px] max-h-[60px] flex items-center justify-center shadow-lg">
            <span className="text-white font-black" style={{ fontSize: 'clamp(1rem, 5vw, 1.5rem)' }}>
              +50
            </span>
          </div>

          {/* Later button */}
          <button
            onClick={onLater}
            disabled={claiming}
            className="text-white/70 hover:text-white font-bold mt-[2vh] disabled:cursor-not-allowed"
            style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1.125rem)' }}
          >
            Később
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
