import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Trophy, Coins, Heart, Crown, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

  useEffect(() => {
    if (!userId) return;

    const checkWinnerStatus = async () => {
      try {
        // Get current week start
        const { data: weekData } = await supabase.rpc('get_current_week_start');
        if (!weekData) return;

        const currentWeekStart = weekData as string;

        // Calculate last week start
        const lastWeekDate = new Date(currentWeekStart);
        lastWeekDate.setDate(lastWeekDate.getDate() - 7);
        const lastWeekStart = lastWeekDate.toISOString().split('T')[0];

        // Check if user won last week
        const { data: awardData, error: awardError } = await supabase
          .from('weekly_winner_awarded')
          .select('*')
          .eq('user_id', userId)
          .eq('week_start', lastWeekStart)
          .single();

        if (awardError || !awardData) return;

        // Check if popup already shown
        const { data: popupData } = await supabase
          .from('weekly_winner_popup_shown')
          .select('*')
          .eq('user_id', userId)
          .eq('week_start', lastWeekStart)
          .single();

        if (popupData) return; // Already shown

        // Get prize amount
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

    // Check after a short delay
    const timeout = setTimeout(checkWinnerStatus, 2000);
    return () => clearTimeout(timeout);
  }, [userId]);

  const handleClose = async () => {
    if (!userId || !winnerData) return;

    try {
      // Mark popup as shown
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

  if (!winnerData) return null;

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return '🥇 1. HELYEZETT';
    if (rank === 2) return '🥈 2. HELYEZETT';
    if (rank === 3) return '🥉 3. HELYEZETT';
    return `🏆 ${rank}. HELYEZETT`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-600';
    if (rank === 2) return 'from-gray-300 to-gray-500';
    if (rank === 3) return 'from-orange-400 to-orange-600';
    return 'from-purple-400 to-purple-600';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="w-[70dvw] h-[70dvh] bg-gradient-to-br from-[#1a1a3e] via-[#2a1a4e] to-[#1a1a5e] border-4 border-yellow-500/70 text-white shadow-[0_0_60px_rgba(234,179,8,0.5)] overflow-hidden"
        style={{
          maxWidth: '95vw',
          maxHeight: '70dvh'
        }}
      >
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <Star className="absolute top-4 left-4 w-8 h-8 text-yellow-400 animate-pulse" />
          <Star className="absolute top-8 right-8 w-6 h-6 text-yellow-300 animate-pulse" style={{ animationDelay: '0.5s' }} />
          <Crown className="absolute bottom-8 left-8 w-12 h-12 text-yellow-400 animate-pulse" style={{ animationDelay: '1s' }} />
          <Trophy className="absolute bottom-4 right-4 w-10 h-10 text-yellow-300 animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Trophy icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/40 via-orange-400/40 to-yellow-400/40 blur-3xl rounded-full animate-pulse"></div>
            <Trophy className="relative w-16 h-16 sm:w-24 sm:h-24 text-yellow-300 drop-shadow-[0_0_30px_rgba(253,224,71,1)]" />
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-4xl font-black text-center bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 drop-shadow-lg animate-pulse">
            🎉 GRATULÁLUNK! 🎉
          </h2>

          {/* Rank display */}
          <div className={`px-4 sm:px-8 py-2 sm:py-4 bg-gradient-to-r ${getRankColor(winnerData.rank)} rounded-xl border-2 border-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.6)]`}>
            <p className="text-xl sm:text-3xl font-black text-white drop-shadow-lg text-center">
              {getRankDisplay(winnerData.rank)}
            </p>
          </div>

          {/* Rewards */}
          <div className="w-full max-w-md space-y-3">
            <div className="bg-gradient-to-br from-yellow-600/30 to-yellow-800/30 border-2 border-yellow-400/50 rounded-xl p-4 flex items-center justify-center gap-3">
              <Coins className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-300 animate-spin" style={{ animationDuration: '3s' }} />
              <p className="text-2xl sm:text-3xl font-black text-yellow-300">
                +{winnerData.gold}
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-600/30 to-red-800/30 border-2 border-red-400/50 rounded-xl p-4 flex items-center justify-center gap-3">
              <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-red-300 animate-pulse" />
              <p className="text-2xl sm:text-3xl font-black text-red-300">
                +{winnerData.lives}
              </p>
            </div>
          </div>

          {/* Message */}
          <p className="text-base sm:text-lg text-center text-white/90 font-bold max-w-md">
            A múlt heti teljesítményed alapján bekerültél a TOP 10-be!
          </p>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="w-full max-w-xs py-3 sm:py-4 bg-gradient-to-r from-green-500 via-green-600 to-green-500 hover:from-green-600 hover:via-green-700 hover:to-green-600 text-white font-black text-lg sm:text-xl rounded-xl border-2 border-yellow-400 shadow-[0_0_25px_rgba(34,197,94,0.6)] hover:shadow-[0_0_35px_rgba(34,197,94,0.8)] transition-all duration-300"
          >
            RENDBEN
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};