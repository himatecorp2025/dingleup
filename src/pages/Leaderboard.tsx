import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LogOut } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useI18n } from '@/i18n';

import DailyRewards from '@/components/DailyRewards';
import { DailyRankingsCountdown } from '@/components/DailyRankingsCountdown';
import { TimerButton } from '@/components/TimerButton';
import { LeaderboardSkeleton } from '@/components/LeaderboardSkeleton';
import BottomNav from '@/components/BottomNav';

interface LeaderboardEntry {
  user_id?: string;
  username: string;
  total_correct_answers: number;
  avatar_url: string | null;
  rank: number;
}

interface RankReward {
  rank: number;
  gold: number;
  life: number;
}

interface DailyRewardsData {
  day: string;
  type: 'NORMAL' | 'JACKPOT';
  rewards: RankReward[];
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userUsername, setUserUsername] = useState<string | null>(null);
  const [userCorrectAnswers, setUserCorrectAnswers] = useState<number>(0);
  const [dailyRewards, setDailyRewards] = useState<DailyRewardsData | null>(null);
  
  // Pull-to-refresh functionality
  const { isPulling, pullProgress } = usePullToRefresh({
    onRefresh: async () => {
      await fetchLeaderboard();
    },
    threshold: 80,
    disabled: false
  });

  // Platform detection for conditional padding
  const [isStandalone, setIsStandalone] = useState(false);
  
  useEffect(() => {
    const checkStandalone = () => {
      const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                    (window.navigator as any).standalone === true ||
                    document.referrer.includes('android-app://');
      setIsStandalone(isPWA);
    };
    checkStandalone();
  }, []);

  useEffect(() => {
    fetchLeaderboard();
    
    // Real-time subscription for daily_rankings updates
    const channel = supabase
      .channel('leaderboard-rankings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_rankings'
        },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);


  const fetchLeaderboard = async () => {
    try {
      // Call Edge Function for country-specific daily leaderboard
      const { data, error } = await supabase.functions.invoke('get-daily-leaderboard-by-country');

      if (error) {
        console.error('[Leaderboard] Edge function error:', error);
        setLoading(false);
        return;
      }

      if (!data || !data.leaderboard) {
        console.error('[Leaderboard] No leaderboard data returned');
        setLoading(false);
        return;
      }

      console.log('[Leaderboard] Loaded', data.leaderboard.length, 'players from country:', data.countryCode);
      setTopPlayers(data.leaderboard);
      setDailyRewards(data.dailyRewards || null);
      
      // Set user's own rank and info
      if (data.userRank) {
        setUserRank(data.userRank);
        
        // Get current user's data
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, total_correct_answers')
            .eq('id', user.id)
            .single();
          
          if (profileData) {
            setUserUsername(profileData.username);
            setUserCorrectAnswers(profileData.total_correct_answers);
          }
        }
      }
    } catch (error) {
      console.error('[Leaderboard] Error fetching daily leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative">
      {/* Pull-to-refresh indicator */}
      {isPulling && (
        <div 
          className="fixed top-0 left-0 right-0 z-50 flex justify-center items-center pointer-events-none"
          style={{ 
            height: `${pullProgress * 60}px`,
            opacity: pullProgress,
            paddingTop: 'env(safe-area-inset-top, 0px)'
          }}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400" />
        </div>
      )}
      {/* Dynamic Island Safe Area - matches Hero component */}
      <div 
        className="absolute top-0 left-0 right-0 pointer-events-none z-50"
        style={{ 
          height: 'env(safe-area-inset-top, 0px)',
        }}
      />
      
      {/* Background Gradient - FULL SCREEN coverage */}
      <div 
        className="fixed inset-0 w-full pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, hsl(280 90% 8%) 0%, hsl(280 80% 12%) 25%, hsl(280 70% 18%) 50%, hsl(280 60% 15%) 75%, hsl(280 80% 10%) 100%)',
          top: 'calc(-1 * env(safe-area-inset-top, 0px))',
          left: 'calc(-1 * env(safe-area-inset-left, 0px))',
          right: 'calc(-1 * env(safe-area-inset-right, 0px))',
          bottom: 'calc(-1 * env(safe-area-inset-bottom, 0px))',
          width: 'calc(100% + env(safe-area-inset-left, 0px) + env(safe-area-inset-right, 0px))',
          height: 'calc(100vh + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px))',
          pointerEvents: 'none'
        }}
      />
      
      <div className="w-full flex flex-col overflow-y-auto overflow-x-hidden relative z-10" style={{ paddingBottom: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom) + 100px)' }}>
        <div className="max-w-6xl mx-auto p-4 w-full">
          {/* Header with Back Button - 3D Box Style */}
          <div className="flex items-center mb-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="relative p-4 rounded-full hover:scale-110 transition-all min-w-[56px] min-h-[56px] flex items-center justify-center"
              title={t('leaderboard.back_aria')}
              aria-label={t('leaderboard.back_aria')}
            >
              {/* BASE SHADOW */}
              <div className="absolute inset-0 bg-black/40 rounded-full" style={{ transform: 'translate(3px, 3px)', filter: 'blur(4px)' }} aria-hidden />
              
              {/* OUTER FRAME */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-700 via-red-600 to-red-900 border-2 border-red-400/50 shadow-lg" aria-hidden />
              
              {/* MIDDLE FRAME */}
              <div className="absolute inset-[3px] rounded-full bg-gradient-to-b from-red-600 via-red-500 to-red-800" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }} aria-hidden />
              
              {/* INNER LAYER */}
              <div className="absolute inset-[5px] rounded-full bg-gradient-to-b from-red-500 via-red-600 to-red-700" style={{ boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.2), inset 0 -8px 16px rgba(0,0,0,0.3)' }} aria-hidden />
              
              {/* SPECULAR HIGHLIGHT */}
              <div className="absolute inset-[5px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)' }} aria-hidden />
              
              {/* Icon */}
              <LogOut className="w-7 h-7 text-white relative z-10 -scale-x-100" />
            </button>
          </div>

        <div className="max-w-4xl mx-auto w-full">

        {/* Title */}
        <h1 
          className="text-2xl sm:text-3xl md:text-4xl font-black text-center mb-2 px-2"
          style={{
            background: 'linear-gradient(135deg, hsl(45 100% 70%), hsl(45 100% 60%), hsl(45 95% 55%))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 16px hsla(45, 100%, 65%, 0.8)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))'
          }}
        >
          🏆 {t('leaderboard.title')} 🏆
        </h1>

        {/* Countdown Timer - below title */}
        <div className="flex justify-center mb-2 px-2">
          <TimerButton>
            <span className="text-[6px] font-extrabold text-primary-dark drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] leading-none whitespace-nowrap">
              <DailyRankingsCountdown compact={true} />
            </span>
          </TimerButton>
        </div>

        {/* Daily Rewards Section with Top 10 */}
        {loading ? (
          <LeaderboardSkeleton />
        ) : (
          <DailyRewards 
            topPlayers={topPlayers.slice(0, 10).map(p => ({
              username: p.username,
              total_correct_answers: p.total_correct_answers
            }))}
            userRank={userRank}
            userUsername={userUsername}
            userCorrectAnswers={userCorrectAnswers}
            dailyRewards={dailyRewards}
          />
        )}

        </div>
      </div>
    </div>

    <BottomNav />
  </div>
);
};

export default Leaderboard;
