import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, TrendingUp, Users, Target, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';

interface CategoryStats {
  category: string;
  uniquePlayers: number;
  totalGames: number;
  avgCorrectAnswers: number;
  helpUsage: {
    third: number;
    skip: number;
    audience: number;
    '2x_answer': number;
  };
}

const CATEGORIES = [
  { id: 'health', name: 'Egészség', color: 'from-purple-500 to-violet-500' },
  { id: 'history', name: 'Történelem', color: 'from-blue-500 to-indigo-500' },
  { id: 'culture', name: 'Kultúra', color: 'from-purple-500 to-pink-500' },
  { id: 'finance', name: 'Pénzügyek', color: 'from-orange-500 to-red-500' }
];

const HELP_TYPES = [
  { id: 'third', name: '1/3', icon: '🎯' },
  { id: 'skip', name: 'Kérdés átugrás', icon: '⏭️' },
  { id: 'audience', name: 'Közönség', icon: '👥' },
  { id: '2x_answer', name: 'Dupla válasz', icon: '✌️' }
];

export default function PlayerBehaviorsTab() {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [stats, setStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
    }, 5000);

    return () => clearInterval(interval);
  }, [startDate, endDate]);

  // Realtime subscription for instant updates
  useEffect(() => {
    const gameResultsChannel = supabase
      .channel('player-behaviors-game-results')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_results'
      }, () => {
        console.log('[PlayerBehaviors] Game results changed, refreshing...');
        fetchStats();
      })
      .subscribe();

    const helpUsageChannel = supabase
      .channel('player-behaviors-help-usage')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_help_usage'
      }, () => {
        console.log('[PlayerBehaviors] Help usage changed, refreshing...');
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(gameResultsChannel);
      supabase.removeChannel(helpUsageChannel);
    };
  }, [startDate, endDate]);

  useEffect(() => {
    fetchStats();
  }, [startDate, endDate]);

  const fetchStats = async () => {
    try {
      const startDateStr = startDate ? format(startDate, 'yyyy-MM-dd') : null;
      const endDateStr = endDate ? format(endDate, 'yyyy-MM-dd 23:59:59') : null;

      const categoryStats: CategoryStats[] = [];

      for (const cat of CATEGORIES) {
        // Get unique players and avg correct answers
        let gameQuery = supabase
          .from('game_results')
          .select('user_id, correct_answers, id');

        if (startDateStr) gameQuery = gameQuery.gte('created_at', startDateStr);
        if (endDateStr) gameQuery = gameQuery.lte('created_at', endDateStr);
        
        const { data: games, error: gamesError } = await gameQuery.eq('category', cat.id);
        
        if (gamesError) {
          console.error(`Error fetching games for ${cat.id}:`, gamesError);
        }

        const uniquePlayers = new Set(games?.map(g => g.user_id) || []).size;
        const totalGames = games?.length || 0;
        const avgCorrect = totalGames > 0 
          ? (games?.reduce((sum, g) => sum + (g.correct_answers || 0), 0) || 0) / totalGames 
          : 0;

        // Get help usage stats
        let helpQuery = supabase
          .from('game_help_usage')
          .select('help_type');

        if (startDateStr) helpQuery = helpQuery.gte('used_at', startDateStr);
        if (endDateStr) helpQuery = helpQuery.lte('used_at', endDateStr);

        const { data: helps, error: helpsError } = await helpQuery.eq('category', cat.id);
        
        if (helpsError) {
          console.error(`Error fetching helps for ${cat.id}:`, helpsError);
        }

        const helpUsage = {
          third: helps?.filter(h => h.help_type === 'third').length || 0,
          skip: helps?.filter(h => h.help_type === 'skip').length || 0,
          audience: helps?.filter(h => h.help_type === 'audience').length || 0,
          '2x_answer': helps?.filter(h => h.help_type === '2x_answer').length || 0
        };

        categoryStats.push({
          category: cat.id,
          uniquePlayers,
          totalGames,
          avgCorrectAnswers: Math.round(avgCorrect * 10) / 10,
          helpUsage
        });
      }

      setStats(categoryStats);
    } catch (error) {
      console.error('Error fetching player behaviors:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Játékos viselkedések</h2>
          <p className="text-white/70">Kategóriánkénti statisztikák és segítséghasználat</p>
        </div>
        
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[140px] justify-start text-left">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'P', { locale: hu }) : 'Összes adat'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[140px] justify-start text-left">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'P', { locale: hu }) : 'Mai napig'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-white/70">Betöltés...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CATEGORIES.map((cat, idx) => {
            const catStats = stats.find(s => s.category === cat.id);
            if (!catStats) return null;

            return (
              <Card key={cat.id} className="bg-slate-900/95 border-white/10 p-6 backdrop-blur">
                <div className={`bg-gradient-to-r ${cat.color} rounded-lg p-4 mb-4`}>
                  <h3 className="text-xl font-bold text-white">{cat.name}</h3>
                </div>

                <div className="space-y-4">
                  {/* Main Stats - Reszponzív betűméretek */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-800/80 rounded-lg p-3 sm:p-4 text-center border border-white/5">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 mx-auto mb-1 sm:mb-2" />
                      <div className="text-xs sm:text-sm text-white/60 mb-1">Játékosok száma</div>
                      <div className="text-2xl sm:text-3xl font-bold text-white">{catStats.uniquePlayers}</div>
                    </div>

                    <div className="bg-slate-800/80 rounded-lg p-3 sm:p-4 text-center border border-white/5">
                      <Target className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 mx-auto mb-1 sm:mb-2" />
                      <div className="text-xs sm:text-sm text-white/60 mb-1">Átlag helyes</div>
                      <div className="text-2xl sm:text-3xl font-bold text-white">{catStats.avgCorrectAnswers}</div>
                    </div>

                    <div className="bg-slate-800/80 rounded-lg p-3 sm:p-4 text-center border border-white/5">
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 mx-auto mb-1 sm:mb-2" />
                      <div className="text-xs sm:text-sm text-white/60 mb-1">Összes játék</div>
                      <div className="text-2xl sm:text-3xl font-bold text-white">{catStats.totalGames}</div>
                    </div>
                  </div>

                  {/* Help Usage - Reszponzív betűméretek */}
                  <div className="bg-slate-800/80 rounded-lg p-3 sm:p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                      <span className="text-base sm:text-lg font-bold text-white">Segítséghasználat részletesen</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {HELP_TYPES.map(help => (
                        <div key={help.id} className="bg-slate-700/50 rounded-lg p-2 sm:p-3 border border-white/5">
                          <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                            <span className="text-base sm:text-xl">{help.icon}</span>
                            <span className="text-xs sm:text-sm text-white/70">{help.name}</span>
                          </div>
                          <div className="text-lg sm:text-xl font-bold text-white leading-tight">
                            {catStats.helpUsage[help.id as keyof typeof catStats.helpUsage]}
                          </div>
                          <div className="text-xs text-white/50">használat</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
