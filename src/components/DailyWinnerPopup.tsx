import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';

interface DailyWinnerPopupProps {
  userId: string | undefined;
}

export const DailyWinnerPopup = ({ userId }: DailyWinnerPopupProps) => {
  const [open, setOpen] = useState(false);
  const [winnerData, setWinnerData] = useState<{
    rank: number;
    gold: number;
    lives: number;
    dayDate: string;
  } | null>(null);
  const isHandheld = usePlatformDetection();

  useEffect(() => {
    if (!userId) return;

    const checkWinnerStatus = async () => {
      try {
        // Calculate yesterday's date
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDate = yesterday.toISOString().split('T')[0];

        const { data: awardData, error: awardError } = await supabase
          .from('daily_winner_awarded' as any)
          .select('*')
          .eq('user_id', userId)
          .eq('day_date', yesterdayDate)
          .single();

        if (awardError || !awardData) return;

        const { data: popupData } = await supabase
          .from('daily_winner_popup_shown' as any)
          .select('*')
          .eq('user_id', userId)
          .eq('day_date', yesterdayDate)
          .single();

        if (popupData) return;

        const { data: prizeData } = await supabase
          .from('daily_prize_table' as any)
          .select('*')
          .eq('rank', (awardData as any).rank)
          .single();

        if (!prizeData) return;

        setWinnerData({
          rank: (awardData as any).rank,
          gold: (prizeData as any).gold,
          lives: (prizeData as any).lives,
          dayDate: yesterdayDate
        });

        setOpen(true);
      } catch (error) {
        console.error('[DAILY-WINNER-POPUP] Error:', error);
      }
    };

    // Check winner status immediately (instant, 0 seconds delay)
    checkWinnerStatus();
  }, [userId]);

  const handleClose = async () => {
    if (!userId || !winnerData) return;

    try {
      await supabase
        .from('daily_winner_popup_shown' as any)
        .insert({
          user_id: userId,
          day_date: winnerData.dayDate
        });

      setOpen(false);
    } catch (error) {
      console.error('[DAILY-WINNER-POPUP] Error marking as shown:', error);
      setOpen(false);
    }
  };

  if (!winnerData || !isHandheld) return null;

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return '🥇 1. HELYEZETT';
    if (rank === 2) return '🥈 2. HELYEZETT';
    if (rank === 3) return '🥉 3. HELYEZETT';
    return `🏆 ${rank}. HELYEZETT`;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'from-accent to-accent-dark';
    if (rank === 2) return 'from-muted to-muted-foreground';
    if (rank === 3) return 'from-accent/80 to-accent';
    return 'from-primary to-primary-dark';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="overflow-hidden p-0 border-0 bg-transparent max-w-[95vw] w-[95vw]"
        style={{ 
          height: 'auto',
          maxHeight: '90vh'
        }}
      >
        <div 
          className="relative w-full flex flex-col items-center justify-center p-[4vw] bg-gradient-to-br from-primary-darker via-primary-dark to-primary"
          style={{ 
            minHeight: '80vh',
            aspectRatio: '0.65',
            borderRadius: '24px'
          }}
        >
          {/* Sparkle effects */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`
              }}
            />
          ))}

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-6 text-center">
            {/* Badge */}
            <div className={`px-8 py-4 bg-gradient-to-r ${getRankBadgeColor(winnerData.rank)} rounded-2xl shadow-2xl`}>
              <p className="text-3xl font-bold text-white">
                {getRankDisplay(winnerData.rank)}
              </p>
            </div>

            {/* Trophy */}
            <div className="text-8xl animate-bounce">
              🏆
            </div>

            {/* Title */}
            <h2 className="text-4xl font-bold text-white drop-shadow-lg">
              TEGNAPI GYŐZELEM!
            </h2>

            {/* Rewards */}
            <div className="flex flex-col gap-4 mt-4">
              <div className="flex items-center justify-center gap-3 px-6 py-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <span className="text-3xl">💰</span>
                <span className="text-2xl font-bold text-accent">
                  +{winnerData.gold} arany
                </span>
              </div>
              <div className="flex items-center justify-center gap-3 px-6 py-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <span className="text-3xl">❤️</span>
                <span className="text-2xl font-bold text-red-400">
                  +{winnerData.lives} élet
                </span>
              </div>
            </div>

            {/* Message */}
            <p className="text-xl text-white/90 mt-4 px-4">
              Gratulálunk! Tegnap a TOP {winnerData.rank} közé kerültél!
            </p>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="mt-6 px-12 py-4 bg-gradient-to-r from-accent to-accent-dark text-white text-xl font-bold rounded-xl shadow-xl hover:scale-105 transition-transform"
            >
              OK
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
