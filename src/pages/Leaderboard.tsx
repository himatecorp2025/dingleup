import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LogOut } from 'lucide-react';

import DailyRewards from '@/components/DailyRewards';
import { DailyRankingsCountdown } from '@/components/DailyRankingsCountdown';
import BottomNav from '@/components/BottomNav';

interface LeaderboardEntry {
  user_id?: string;
  username: string;
  total_correct_answers: number;
  avatar_url: string | null;
  rank: number;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userUsername, setUserUsername] = useState<string | null>(null);
  const [userCorrectAnswers, setUserCorrectAnswers] = useState<number>(0);

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
      
      <div className="h-full w-full flex flex-col overflow-y-auto overflow-x-hidden relative z-10" style={{ paddingBottom: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom) + 100px)' }}>
        <div className="max-w-6xl mx-auto p-4 w-full">
          {/* Header with Back Button - 3D Box Style */}
          <div className="flex items-center mb-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="relative p-3 rounded-full hover:scale-110 transition-all"
              title="Vissza a dashboardra"
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
              <LogOut className="w-6 h-6 text-white relative z-10 -scale-x-100" />
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
          🏆 Ranglista 🏆
        </h1>

        {/* Countdown Timer - below title */}
        <div className="flex justify-center mb-2 px-2">
          <DailyRankingsCountdown compact={false} />
        </div>

        {/* Daily Rewards Section with Top 10 */}
        <DailyRewards 
          topPlayers={topPlayers.slice(0, 10).map(p => ({
            username: p.username,
            total_correct_answers: p.total_correct_answers
          }))}
          userRank={userRank}
          userUsername={userUsername}
          userCorrectAnswers={userCorrectAnswers}
        />

        </div>
      </div>
    </div>

    <BottomNav />
  </div>
);
};

export default Leaderboard;
