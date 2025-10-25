import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

import WeeklyRewards from '@/components/WeeklyRewards';
import { WeeklyRankingsCountdown } from '@/components/WeeklyRankingsCountdown';
import BottomNav from '@/components/BottomNav';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  total_correct_answers: number;
  avatar_url: string | null;
  rank: number;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    
    // Auto-refresh every 5 seconds for immediate updates
    const interval = setInterval(() => {
      fetchLeaderboard();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('global_leaderboard')
        .select('user_id, username, total_correct_answers, avatar_url')
        .order('total_correct_answers', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Add rank to each entry
      const rankedData = (data || []).map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));

      setTopPlayers(rankedData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return (
      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.5 16L3.5 5L7 7.5L12 2L17 7.5L20.5 5L21.5 16H2.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M3 16H21V19C21 19.5523 20.5523 20 20 20H4C3.44772 20 3 19.5523 3 19V16Z" stroke="currentColor" strokeWidth="2"/>
        <circle cx="12" cy="9" r="1.5" fill="currentColor"/>
        <circle cx="7" cy="11" r="1.5" fill="currentColor"/>
        <circle cx="17" cy="11" r="1.5" fill="currentColor"/>
      </svg>
    );
    if (rank === 2) return (
      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.5 16L3.5 5L7 7.5L12 2L17 7.5L20.5 5L21.5 16H2.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M3 16H21V19C21 19.5523 20.5523 20 20 20H4C3.44772 20 3 19.5523 3 19V16Z" stroke="currentColor" strokeWidth="2"/>
        <circle cx="12" cy="9" r="1.5" fill="currentColor"/>
        <circle cx="7" cy="11" r="1.5" fill="currentColor"/>
        <circle cx="17" cy="11" r="1.5" fill="currentColor"/>
      </svg>
    );
    if (rank === 3) return (
      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
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
    <div className="h-screen w-screen bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] overflow-hidden fixed inset-0" style={{
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      {/* Casino lights animation at top */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-red-500 to-purple-500 opacity-80 animate-pulse z-50"></div>
      
      <div className="h-full w-full flex flex-col overflow-y-auto overflow-x-hidden relative z-10" style={{ paddingBottom: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom) + 16px)' }}>
        <div className="max-w-6xl mx-auto p-4 w-full">
          {/* Header with Back Button - 3D Box Style */}
          <div className="flex items-center mb-4 sm:mb-6 pt-safe">
            <button
              onClick={() => navigate('/dashboard')}
              className="relative p-2 sm:p-3 rounded-xl hover:scale-110 transition-all"
              title="Vissza"
            >
              {/* BASE SHADOW */}
              <div className="absolute inset-0 bg-black/40 rounded-xl" style={{ transform: 'translate(3px, 3px)', filter: 'blur(4px)' }} aria-hidden />
              
              {/* OUTER FRAME */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-700 via-red-600 to-red-900 border-2 border-red-400/50 shadow-lg" aria-hidden />
              
              {/* MIDDLE FRAME */}
              <div className="absolute inset-[3px] rounded-xl bg-gradient-to-b from-red-600 via-red-500 to-red-800" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }} aria-hidden />
              
              {/* INNER LAYER */}
              <div className="absolute inset-[5px] rounded-xl bg-gradient-to-b from-red-500 via-red-600 to-red-700" style={{ boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.2), inset 0 -8px 16px rgba(0,0,0,0.3)' }} aria-hidden />
              
              {/* SPECULAR HIGHLIGHT */}
              <div className="absolute inset-[5px] rounded-xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)' }} aria-hidden />
              
              {/* DIAGONAL STREAKS */}
              <div className="absolute inset-[5px] rounded-xl pointer-events-none" style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.08) 8px, rgba(255,255,255,0.08) 12px)', opacity: 0.7 }} aria-hidden />
              
              {/* Icon */}
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white relative z-10 -scale-x-100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

        <div className="max-w-4xl mx-auto w-full">

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-center mb-3 sm:mb-4 bg-gradient-to-r from-yellow-400 via-purple-500 to-yellow-400 bg-clip-text text-transparent pt-safe px-2">
          🏆 Ranglista 🏆
        </h1>

        {/* Countdown Timer - below title */}
        <div className="flex justify-center mb-4 sm:mb-6 px-2">
          <WeeklyRankingsCountdown compact={false} />
        </div>

        {/* Weekly Rewards Section */}
        <WeeklyRewards />

        {/* Leaderboard */}
        {loading ? (
          <p className="text-center text-white">Betöltés...</p>
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
                
                {/* DIAGONAL STREAKS */}
                <div className="absolute inset-[5px] rounded-2xl pointer-events-none" style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 14px)', opacity: 0.8 }} aria-hidden />

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
                    
                    {/* DIAGONAL STREAKS */}
                    <div className="absolute inset-[3px] rounded-xl pointer-events-none" style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.06) 6px, rgba(255,255,255,0.06) 9px)', opacity: 0.7 }} aria-hidden />
                    
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
            {topPlayers.length < 100 && (
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

      <BottomNav />
    </div>
  );
};

export default Leaderboard;
