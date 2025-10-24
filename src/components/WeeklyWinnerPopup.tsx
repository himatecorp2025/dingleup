import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';
import weeklyWinnerBg from '@/assets/popup-weekly-winner.png';

interface WeeklyWinnerPopupProps {
  userId: string | undefined;
}

export const WeeklyWinnerPopup = ({ userId }: WeeklyWinnerPopupProps) => {
  const [open, setOpen] = useState(false);
  const [winnerData, setWinnerData] = useState<{
    rank: number;
    gold: number;
    lives: number;
    weekStart: string;
  } | null>(null);
  const isHandheld = usePlatformDetection();

  useEffect(() => {
    if (!userId) return;

    const checkWinnerStatus = async () => {
      try {
        const { data: weekData } = await supabase.rpc('get_current_week_start');
        if (!weekData) return;

        const currentWeekStart = weekData as string;
        const lastWeekDate = new Date(currentWeekStart);
        lastWeekDate.setDate(lastWeekDate.getDate() - 7);
        const lastWeekStart = lastWeekDate.toISOString().split('T')[0];

        const { data: awardData, error: awardError } = await supabase
          .from('weekly_winner_awarded')
          .select('*')
          .eq('user_id', userId)
          .eq('week_start', lastWeekStart)
          .single();

        if (awardError || !awardData) return;

        const { data: popupData } = await supabase
          .from('weekly_winner_popup_shown')
          .select('*')
          .eq('user_id', userId)
          .eq('week_start', lastWeekStart)
          .single();

        if (popupData) return;

        const { data: prizeData } = await supabase
          .from('weekly_prize_table')
          .select('*')
          .eq('rank', awardData.rank)
          .single();

        if (!prizeData) return;

        setWinnerData({
          rank: awardData.rank,
          gold: prizeData.gold,
          lives: prizeData.lives,
          weekStart: lastWeekStart
        });

        setOpen(true);
      } catch (error) {
        console.error('[WEEKLY-WINNER-POPUP] Error:', error);
      }
    };

    const timeout = setTimeout(checkWinnerStatus, 2000);
    return () => clearTimeout(timeout);
  }, [userId]);

  const handleClose = async () => {
    if (!userId || !winnerData) return;

    try {
      await supabase
        .from('weekly_winner_popup_shown')
        .insert({
          user_id: userId,
          week_start: winnerData.weekStart
        });

      setOpen(false);
    } catch (error) {
      console.error('[WEEKLY-WINNER-POPUP] Error marking as shown:', error);
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
    if (rank === 1) return 'from-yellow-400 to-yellow-600';
    if (rank === 2) return 'from-gray-300 to-gray-500';
    if (rank === 3) return 'from-orange-400 to-orange-600';
    return 'from-purple-400 to-purple-600';
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
          className="relative w-full flex flex-col items-center justify-center p-[4vw] bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${weeklyWinnerBg})`,
            minHeight: '80vh',
            aspectRatio: '0.65'
          }}
        >
          {/* Top ornament with lights */}
          <div className="absolute top-[5vh] left-1/2 -translate-x-1/2 w-[60vw] max-w-[400px]">
            <div className="relative">
              {/* Left and right light beams */}
              <div className="absolute -left-[15vw] top-1/2 -translate-y-1/2 w-[10vw] h-[1px] bg-gradient-to-r from-transparent to-yellow-400"></div>
              <div className="absolute -right-[15vw] top-1/2 -translate-y-1/2 w-[10vw] h-[1px] bg-gradient-to-l from-transparent to-yellow-400"></div>
            </div>
          </div>

          {/* PATCH UPDATE badge */}
          <div className="mt-[8vh] mb-[4vh]">
            <div className="relative">
              {/* Glowing effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent blur-xl opacity-50 animate-pulse"></div>
              
              {/* Main badge */}
              <div className="relative bg-gradient-to-b from-purple-700 via-purple-800 to-purple-900 px-[10vw] py-[3vh] rounded-2xl border-8 border-yellow-400 shadow-[0_0_40px_rgba(234,179,8,0.8)]"
                   style={{
                     clipPath: 'polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%)'
                   }}>
                <div className="text-center space-y-[1vh]">
                  <h1 className="font-black bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                      style={{ fontSize: 'clamp(1.5rem, 7vw, 2.5rem)' }}>
                    HETI GYŐZELEM
                  </h1>
                  <p className="text-white font-bold drop-shadow-lg" style={{ fontSize: 'clamp(0.75rem, 3.5vw, 1.25rem)' }}>
                    TOP 10 HELYEZÉS
                  </p>
                </div>
              </div>

              {/* Side ornaments */}
              <div className="absolute -left-[8vw] top-1/2 -translate-y-1/2 w-[6vw] h-[6vw] bg-yellow-400 rounded-full border-4 border-yellow-600 animate-pulse shadow-lg"></div>
              <div className="absolute -right-[8vw] top-1/2 -translate-y-1/2 w-[6vw] h-[6vw] bg-yellow-400 rounded-full border-4 border-yellow-600 animate-pulse shadow-lg"></div>
            </div>
          </div>

          {/* Central hexagon platform */}
          <div className="relative my-[4vh]">
            {/* Lightning effects */}
            <div className="absolute -left-[20vw] top-1/2 w-[15vw] h-[2px]">
              <div className="w-full h-full bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-pulse"></div>
            </div>
            <div className="absolute -right-[20vw] top-1/2 w-[15vw] h-[2px]">
              <div className="w-full h-full bg-gradient-to-l from-transparent via-yellow-400 to-transparent animate-pulse"></div>
            </div>

            {/* Hexagon base */}
            <div className="w-[70vw] max-w-[400px] aspect-[1.5/1] bg-gradient-to-b from-amber-600 via-amber-700 to-amber-900 border-8 border-yellow-500 shadow-2xl relative"
                 style={{
                   clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
                 }}>
              {/* Inner glow */}
              <div className="absolute inset-[10px] bg-gradient-to-b from-purple-600/40 to-transparent"
                   style={{
                     clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
                   }}></div>

              {/* Content overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 space-y-[2vh]">
                {/* Rank badge */}
                <div className={`bg-gradient-to-b ${getRankBadgeColor(winnerData.rank)} px-[6vw] py-[2vh] rounded-xl border-4 border-yellow-400 shadow-xl`}>
                  <p className="font-black text-white text-center drop-shadow-lg" style={{ fontSize: 'clamp(1rem, 5vw, 1.75rem)' }}>
                    {getRankDisplay(winnerData.rank)}
                  </p>
                </div>

                {/* Rewards */}
                <div className="space-y-[1vh]">
                  <div className="flex items-center justify-center gap-[2vw]">
                    <span style={{ fontSize: 'clamp(1.5rem, 7vw, 2.5rem)' }}>🪙</span>
                    <span className="font-black text-yellow-300 drop-shadow-lg" style={{ fontSize: 'clamp(1.25rem, 6vw, 2rem)' }}>
                      +{winnerData.gold}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-[2vw]">
                    <span style={{ fontSize: 'clamp(1.5rem, 7vw, 2.5rem)' }}>❤️</span>
                    <span className="font-black text-red-300 drop-shadow-lg" style={{ fontSize: 'clamp(1.25rem, 6vw, 2rem)' }}>
                      +{winnerData.lives}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom text */}
          <div className="bg-black/70 backdrop-blur-sm rounded-2xl border-4 border-purple-600 px-[6vw] py-[2vh] mt-[3vh] max-w-[85vw]">
            <p className="text-white text-center font-bold leading-relaxed drop-shadow-lg" style={{ fontSize: 'clamp(0.75rem, 3.5vw, 1rem)' }}>
              A múlt heti teljesítményed alapján bekerültél a TOP 10-be! Gratulálunk! 🎉
            </p>
          </div>

          {/* OK button */}
          <button
            onClick={handleClose}
            className="mt-[3vh] bg-gradient-to-b from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-black rounded-full px-[10vw] py-[2.5vh] shadow-[0_6px_0_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-1 transition-all border-4 border-yellow-400"
            style={{ fontSize: 'clamp(1rem, 4.5vw, 1.75rem)' }}
          >
            RENDBEN
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
