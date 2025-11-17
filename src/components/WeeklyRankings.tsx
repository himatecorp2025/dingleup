import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Medal, Crown, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { GameCategory } from '@/types/game';

interface RankingEntry {
  id: string;
  user_id: string;
  username: string;
  rank: number;
  total_correct_answers: number;
  average_response_time: number;
}

const WeeklyRankings = () => {
  const [rankings, setRankings] = useState<Record<GameCategory, RankingEntry[]>>({
    health: [],
    history: [],
    culture: [],
    finance: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRankings();

    // Set up realtime subscription
    const weekStart = getWeekStart();
    const channel = supabase
      .channel('weekly_rankings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'weekly_rankings',
          filter: `week_start=eq.${weekStart}`
        },
        () => {
          fetchRankings();
        }
      )
      .subscribe();

    // Auto-refresh every 60 seconds
    const refreshInterval = setInterval(() => {
      fetchRankings();
    }, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(refreshInterval);
    };
  }, []);

  const fetchRankings = async () => {
    setLoading(true);
    
    const categories: GameCategory[] = ['health', 'history', 'culture', 'finance'];
    const weekStart = getWeekStart();
    
    for (const category of categories) {
      const { data, error } = await supabase
        .from('weekly_rankings')
        .select(`
          id,
          user_id,
          rank,
          total_correct_answers,
          average_response_time,
          profiles!inner(username)
        `)
        .eq('category', category)
        .eq('week_start', weekStart)
        .order('rank', { ascending: true })
        .limit(10);

      if (!error && data) {
        setRankings(prev => ({
          ...prev,
          [category]: data.map(entry => ({
            id: entry.id,
            user_id: entry.user_id,
            username: (entry.profiles as any).username,
            rank: entry.rank || 0,
            total_correct_answers: entry.total_correct_answers || 0,
            average_response_time: entry.average_response_time || 0
          }))
        }));
      }
    }
    
    setLoading(false);
  };

  const getWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 text-center font-bold">{rank}</span>;
  };

  const categoryNames = {
    health: 'Egészség',
    history: 'Történelem',
    culture: 'Kultúra',
    finance: 'Pénzügy'
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Betöltés...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          Heti rangsor
        </CardTitle>
        <CardDescription>
          A hét legjobb játékosai kategóriánként
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="health">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="health">Egészség</TabsTrigger>
            <TabsTrigger value="history">Történelem</TabsTrigger>
            <TabsTrigger value="culture">Kultúra</TabsTrigger>
            <TabsTrigger value="finance">Pénzügy</TabsTrigger>
          </TabsList>

          {Object.entries(rankings).map(([category, entries]) => (
            <TabsContent key={category} value={category} className="space-y-3 mt-4">
              {entries.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Még nincs ranglista erre a hétre
                </p>
              ) : (
                entries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`
                      flex items-center gap-4 p-4 rounded-xl
                      ${entry.rank === 1 ? 'bg-gradient-to-r from-yellow-500/20 to-transparent border-2 border-yellow-500/50' : ''}
                      ${entry.rank === 2 ? 'bg-gradient-to-r from-gray-400/20 to-transparent border-2 border-gray-400/50' : ''}
                      ${entry.rank === 3 ? 'bg-gradient-to-r from-amber-600/20 to-transparent border-2 border-amber-600/50' : ''}
                      ${entry.rank > 3 ? 'bg-accent/50' : ''}
                    `}
                  >
                    <div className="flex items-center justify-center w-10">
                      {getRankIcon(entry.rank)}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-bold">{entry.username}</p>
                      <p className="text-sm text-muted-foreground">
                        {entry.total_correct_answers} helyes válasz
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Átlag válaszidő</p>
                      <p className="font-bold">{entry.average_response_time.toFixed(1)}s</p>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default WeeklyRankings;
