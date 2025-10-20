import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Crown, Medal } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import WeeklyRewards from '@/components/WeeklyRewards';
import { WeeklyRankingsCountdown } from '@/components/WeeklyRankingsCountdown';

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
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] pb-24">
      {/* Back Button - top left like in game */}
      <button
        onClick={() => navigate('/dashboard')}
        className="fixed top-4 left-4 z-50 p-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-full shadow-lg hover:from-red-700 hover:to-red-900 transition-all hover:scale-110 border-2 border-red-400/50"
        title="Vissza"
      >
        <LogOut className="w-6 h-6 -scale-x-100" />
      </button>

      <div className="max-w-4xl mx-auto p-4 pt-20">

        {/* Title */}
        <h1 className="text-4xl font-black text-center mb-8 bg-gradient-to-r from-yellow-400 via-purple-500 to-yellow-400 bg-clip-text text-transparent">
          🏆 Ranglista 🏆
        </h1>

        {/* Weekly Rewards Section */}
        <WeeklyRewards />
        
        {/* Countdown Timer */}
        <WeeklyRankingsCountdown />

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
                <div className="clip-hexagon w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center border-2 border-purple-400">
                  {player.avatar_url ? (
                    <img
                      src={player.avatar_url}
                      alt={player.username}
                      className="w-full h-full object-cover clip-hexagon"
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

      <BottomNav />
    </div>
  );
};

export default Leaderboard;
