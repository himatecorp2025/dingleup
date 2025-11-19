import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LogOut } from 'lucide-react';
import { getWeekStartInUserTimezone } from '@/lib/utils';

import WeeklyRewards from '@/components/WeeklyRewards';
import { WeeklyRankingsCountdown } from '@/components/WeeklyRankingsCountdown';
import BottomNav from '@/components/BottomNav';
import { MusicControls } from '@/components/MusicControls';

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
    
    // Real-time subscription for weekly_rankings updates
    const channel = supabase
      .channel('leaderboard-rankings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'weekly_rankings'
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
      // Get current user's country code
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('country_code')
        .eq('id', user.id)
        .single();
      
      // Fallback to HU if country_code is missing
      const countryCode = profile?.country_code || 'HU';
      
      const weekStart = getWeekStartInUserTimezone();
      
      // Get ALL users from same country (not just those with rankings)
      const { data: allCountryProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, country_code')
        .eq('country_code', countryCode);
      
      if (profilesError || !allCountryProfiles || allCountryProfiles.length === 0) {
        console.error('[Leaderboard] Error fetching profiles:', profilesError);
        setLoading(false);
        return;
      }
      
      // Get weekly rankings for current week (mixed category only)
      const { data: rankingsData } = await supabase
        .from('weekly_rankings')
        .select('user_id, total_correct_answers')
        .eq('week_start', weekStart)
        .eq('category', 'mixed');
      
      // Create rankings map (defaults to 0 if no data)
      const rankingsMap = new Map<string, number>();
      if (rankingsData) {
        rankingsData.forEach(row => {
          rankingsMap.set(row.user_id, row.total_correct_answers || 0);
        });
      }
      
      // Build leaderboard with ALL users (0 scores included)
      const rankedData: LeaderboardEntry[] = allCountryProfiles.map(profile => ({
        user_id: profile.id,
        username: profile.username || 'Player',
        avatar_url: profile.avatar_url || null,
        total_correct_answers: rankingsMap.get(profile.id) || 0,
        rank: 0
      }));

      // Sort and assign ranks
      rankedData
        .sort((a, b) => b.total_correct_answers - a.total_correct_answers)
        .forEach((entry, index) => { entry.rank = index + 1; });

      setTopPlayers(rankedData.slice(0, 100));
    } catch (error) {
      console.error('Error fetching weekly leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return (
      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-accent" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.5 16L3.5 5L7 7.5L12 2L17 7.5L20.5 5L21.5 16H2.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M3 16H21V19C21 19.5523 20.5523 20 20 20H4C3.44772 20 3 19.5523 3 19V16Z" stroke="currentColor" strokeWidth="2"/>
        <circle cx="12" cy="9" r="1.5" fill="currentColor"/>
        <circle cx="7" cy="11" r="1.5" fill="currentColor"/>
        <circle cx="17" cy="11" r="1.5" fill="currentColor"/>
      </svg>
    );
    if (rank === 2) return (
      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-muted" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.5 16L3.5 5L7 7.5L12 2L17 7.5L20.5 5L21.5 16H2.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M3 16H21V19C21 19.5523 20.5523 20 20 20H4C3.44772 20 3 19.5523 3 19V16Z" stroke="currentColor" strokeWidth="2"/>
        <circle cx="12" cy="9" r="1.5" fill="currentColor"/>
        <circle cx="7" cy="11" r="1.5" fill="currentColor"/>
        <circle cx="17" cy="11" r="1.5" fill="currentColor"/>
      </svg>
    );
    if (rank === 3) return (
      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-accent-dark" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.5 16L3.5 5L7 7.5L12 2L17 7.5L20.5 5L21.5 16H2.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M3 16H21V19C21 19.5523 20.5523 20 20 20H4C3.44772 20 3 19.5523 3 19V16Z" stroke="currentColor" strokeWidth="2"/>
        <circle cx="12" cy="9" r="1.5" fill="currentColor"/>
        <circle cx="7" cy="11" r="1.5" fill="currentColor"/>
        <circle cx="17" cy="11" r="1.5" fill="currentColor"/>
      </svg>
    );
    return null;
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="h-dvh h-svh w-screen overflow-hidden fixed inset-0" style={{
      paddingTop: 'max(calc(env(safe-area-inset-top) + 2%), env(safe-area-inset-top) + 8px)',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      {/* Full-screen background that covers status bar */}
      <div 
        className="fixed bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d]"
        style={{
          left: 'calc(-1 * env(safe-area-inset-left, 0px))',
          right: 'calc(-1 * env(safe-area-inset-right, 0px))',
          top: 'calc(-1 * env(safe-area-inset-top, 0px))',
          bottom: 'calc(-1 * env(safe-area-inset-bottom, 0px))',
          width: 'calc(100vw + env(safe-area-inset-left, 0px) + env(safe-area-inset-right, 0px))',
          height: 'calc(100vh + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px))',
          pointerEvents: 'none'
        }}
      />
      
      {/* Casino lights removed per user requirement */}
      
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
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-center mb-2 bg-gradient-to-r from-yellow-400 via-purple-500 to-yellow-400 bg-clip-text text-transparent px-2">
          🏆 Ranglista 🏆
        </h1>

        {/* Countdown Timer - below title */}
        <div className="flex justify-center mb-2 px-2">
          <WeeklyRankingsCountdown compact={false} />
        </div>

        {/* Weekly Rewards Section */}
        <WeeklyRewards />

        {/* Leaderboard */}
        {loading ? (
          <p className="text-center text-white">Betöltés...</p>
        ) : topPlayers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-white">Eredmény még nem elérhető, gyere vissza később!</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3 px-2">
            {topPlayers.map((player) => (
              <div
                key={player.user_id}
                className="relative flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-2xl transition-all overflow-hidden"
              >
                {/* BASE SHADOW */}
                <div className="absolute inset-0 bg-black/40 rounded-2xl" style={{ transform: 'translate(3px, 3px)', filter: 'blur(5px)' }} aria-hidden />
                
                {/* OUTER FRAME */}
                <div className={`absolute inset-0 rounded-2xl border-2 shadow-lg ${
                  player.rank === 1
                    ? 'bg-gradient-to-br from-yellow-700 via-yellow-600 to-yellow-900 border-yellow-400/50 shadow-yellow-500/20'
                    : player.rank === 2
                    ? 'bg-gradient-to-br from-gray-600 via-gray-500 to-gray-800 border-gray-400/50 shadow-gray-500/20'
                    : player.rank === 3
                    ? 'bg-gradient-to-br from-orange-700 via-orange-600 to-orange-900 border-orange-400/50 shadow-orange-500/20'
                    : 'bg-gradient-to-br from-purple-700 via-purple-600 to-purple-900 border-purple-400/40 shadow-purple-500/20'
                }`} aria-hidden />
                
                {/* MIDDLE FRAME */}
                <div className={`absolute inset-[3px] rounded-2xl ${
                  player.rank === 1
                    ? 'bg-gradient-to-b from-yellow-600 via-yellow-500 to-yellow-800'
                    : player.rank === 2
                    ? 'bg-gradient-to-b from-gray-500 via-gray-400 to-gray-700'
                    : player.rank === 3
                    ? 'bg-gradient-to-b from-orange-600 via-orange-500 to-orange-800'
                    : 'bg-gradient-to-b from-purple-600 via-purple-500 to-purple-800'
                }`} style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.25)' }} aria-hidden />
                
                {/* INNER LAYER */}
                <div className={`absolute inset-[5px] rounded-2xl ${
                  player.rank === 1
                    ? 'bg-gradient-to-b from-yellow-500/30 via-yellow-600/30 to-yellow-700/30'
                    : player.rank === 2
                    ? 'bg-gradient-to-b from-gray-400/30 via-gray-500/30 to-gray-600/30'
                    : player.rank === 3
                    ? 'bg-gradient-to-b from-orange-500/30 via-orange-600/30 to-orange-700/30'
                    : 'bg-gradient-to-b from-purple-500/30 via-purple-600/30 to-purple-700/30'
                }`} style={{ boxShadow: 'inset 0 6px 16px rgba(255,255,255,0.12), inset 0 -6px 16px rgba(0,0,0,0.4)' }} aria-hidden />
                
                {/* SPECULAR HIGHLIGHT */}
                <div className="absolute inset-[5px] rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 30% 10%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.12) 40%, transparent 70%)' }} aria-hidden />


                <div className="relative z-10 flex items-center gap-2 sm:gap-4 w-full">
                  {/* Rank */}
                  <div className="flex items-center justify-center w-10 sm:w-12 flex-shrink-0">
                    {getMedalIcon(player.rank) || (
                      <span className="text-xl sm:text-2xl font-black text-purple-400">
                        {player.rank}
                      </span>
                    )}
                  </div>

                  {/* Avatar - 3D Box Style */}
                  <div className="relative rounded-xl w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
                    {/* BASE SHADOW */}
                    <div className="absolute inset-0 bg-black/40 rounded-xl" style={{ transform: 'translate(2px, 2px)', filter: 'blur(2px)' }} aria-hidden />
                    
                    {/* OUTER FRAME */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-700 via-purple-600 to-purple-900 border-2 border-purple-400" aria-hidden />
                    
                    {/* MIDDLE FRAME */}
                    <div className="absolute inset-[2px] rounded-xl bg-gradient-to-b from-purple-600 via-purple-500 to-purple-800" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }} aria-hidden />
                    
                    {/* INNER LAYER */}
                    <div className="absolute inset-[3px] rounded-xl bg-gradient-to-b from-purple-500 via-purple-600 to-purple-700" style={{ boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.2), inset 0 -4px 8px rgba(0,0,0,0.3)' }} aria-hidden />
                    
                    {/* SPECULAR HIGHLIGHT */}
                    <div className="absolute inset-[3px] rounded-xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 30%, transparent 60%)' }} aria-hidden />
                    
                    {/* Content */}
                    <div className="absolute inset-0 rounded-xl flex items-center justify-center z-10 overflow-hidden">
                      {player.avatar_url ? (
                        <img
                          src={player.avatar_url}
                          alt={player.username}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <span className="text-lg sm:text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                          {getInitials(player.username)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Player info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-lg font-bold text-white truncate">{player.username}</p>
                    <p className="text-xs sm:text-sm text-purple-300 truncate">
                      Helyes válaszok: {player.total_correct_answers}
                    </p>
                  </div>

                  {/* Medal for top 3 */}
                  {player.rank <= 3 && (
                    <div className="flex-shrink-0">
                      <svg 
                        className={`w-6 h-6 sm:w-8 sm:h-8 ${
                          player.rank === 1
                            ? 'text-yellow-400'
                            : player.rank === 2
                            ? 'text-gray-400'
                            : 'text-orange-400'
                        }`}
                        viewBox="0 0 24 24" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle cx="12" cy="15.5" r="6.5" stroke="currentColor" strokeWidth="2" fill="none"/>
                        <path d="M12 2L14 8L12 9L10 8L12 2Z" stroke="currentColor" strokeWidth="2" fill="currentColor"/>
                        <path d="M8 4L6 8L8 10L9 8L8 4Z" stroke="currentColor" strokeWidth="2" fill="currentColor"/>
                        <path d="M16 4L18 8L16 10L15 8L16 4Z" stroke="currentColor" strokeWidth="2" fill="currentColor"/>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Placeholder if less than 100 */}
            {topPlayers.length > 0 && topPlayers.length < 100 && (
              <div className="text-center text-purple-300 mt-8">
                <p className="text-sm">
                  További {100 - topPlayers.length} hely elérhető a ranglistán!
                </p>
              </div>
            )}
          </div>
        )}
        </div>
        </div>
      </div>

      {/* Music Controls - Fixed top-left corner */}
      <div className="fixed top-4 left-4 z-[9999] w-64 max-w-[calc(100vw-2rem)]">
        <MusicControls />
      </div>

      <BottomNav />
    </div>
  );
};

export default Leaderboard;
