import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Crown, Medal } from 'lucide-react';
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
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(() => {
      fetchLeaderboard();
    }, 15000);
    
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
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Crown className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Crown className="w-6 h-6 text-orange-400" />;
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
      
      <div className="h-full w-full flex flex-col overflow-y-auto overflow-x-hidden pb-24 relative z-10 px-4 py-4">
      
      {/* Back Button - same as shop */}
      <button
        onClick={() => navigate('/dashboard')}
        className="p-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-full shadow-lg hover:from-red-700 hover:to-red-900 transition-all hover:scale-110 border-2 border-red-400/50"
        title="Vissza"
      >
        <LogOut className="w-6 h-6 -scale-x-100" />
      </button>

      <div className="max-w-4xl mx-auto p-4 pt-4 pb-24 min-h-screen">

        {/* Title */}
        <h1 className="text-4xl font-black text-center mb-4 bg-gradient-to-r from-yellow-400 via-purple-500 to-yellow-400 bg-clip-text text-transparent pt-safe">
          🏆 Ranglista 🏆
        </h1>

        {/* Countdown Timer - below title */}
        <div className="flex justify-center mb-6">
          <WeeklyRankingsCountdown compact={false} />
        </div>

        {/* Weekly Rewards Section */}
        <WeeklyRewards />

        {/* Leaderboard */}
        {loading ? (
          <p className="text-center text-white">Betöltés...</p>
        ) : (
          <div className="space-y-3">
            {topPlayers.map((player) => (
              <div
                key={player.user_id}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                  player.rank === 1
                    ? 'bg-gradient-to-r from-yellow-600/20 to-yellow-900/20 border-yellow-500/50'
                    : player.rank === 2
                    ? 'bg-gradient-to-r from-gray-600/20 to-gray-900/20 border-gray-500/50'
                    : player.rank === 3
                    ? 'bg-gradient-to-r from-orange-600/20 to-orange-900/20 border-orange-500/50'
                    : 'bg-black/60 border-purple-500/30'
                }`}
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-12">
                  {getMedalIcon(player.rank) || (
                    <span className="text-2xl font-black text-purple-400">
                      {player.rank}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <div className="rounded-xl w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center border-2 border-purple-400">
                  {player.avatar_url ? (
                    <img
                      src={player.avatar_url}
                      alt={player.username}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <span className="text-2xl font-black text-white">
                      {getInitials(player.username)}
                    </span>
                  )}
                </div>

                {/* Player info */}
                <div className="flex-1">
                  <p className="text-lg font-bold text-white">{player.username}</p>
                  <p className="text-sm text-purple-300">
                    Helyes válaszok: {player.total_correct_answers}
                  </p>
                </div>

                {/* Medal for top 3 */}
                {player.rank <= 3 && (
                  <Medal
                    className={`w-8 h-8 ${
                      player.rank === 1
                        ? 'text-yellow-400'
                        : player.rank === 2
                        ? 'text-gray-400'
                        : 'text-orange-400'
                    }`}
                  />
                )}
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

      <BottomNav />
    </div>
  );
};

export default Leaderboard;
