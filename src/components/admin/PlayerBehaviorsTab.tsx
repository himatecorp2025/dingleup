import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Users, Target, HelpCircle } from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';

interface CategoryStats {
  category: string;
  uniquePlayers: number;
  totalGames: number;
  completedGames: number;
  abandonedGames: number;
  completionRate: number;
  avgCorrectAnswers: number;
  avgResponseTime: number;
  helpUsage: {
    third: number;
    skip: number;
    audience: number;
    '2x_answer': number;
  };
}

const CATEGORIES = [
  { id: 'health', name: 'Egészség', color: 'from-primary to-primary/80' },
  { id: 'history', name: 'Történelem', color: 'from-primary-glow to-primary' },
  { id: 'culture', name: 'Kultúra', color: 'from-primary to-accent' },
  { id: 'finance', name: 'Pénzügyek', color: 'from-accent to-destructive' }
];

const HELP_TYPES = [
  { id: 'third', name: '1/3', icon: '🎯' },
  { id: 'skip', name: 'Kérdés átugrás', icon: '⏭️' },
  { id: 'audience', name: 'Közönség', icon: '👥' },
  { id: '2x_answer', name: 'Dupla válasz', icon: '✌️' }
];

type DateRangeOption = 'all' | '3d' | '7d' | '15d' | '30d' | '6m' | '12m';

export default function PlayerBehaviorsTab() {
  const [dateRange, setDateRange] = useState<DateRangeOption>('all');
  const [stats, setStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);

  // Realtime subscription for instant updates
  useEffect(() => {
    fetchStats(); // Initial load

    const gameResultsChannel = supabase
      .channel('player-behaviors-game-results-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_results'
      }, (payload) => {
        fetchStats();
      })
      .subscribe();

    const helpUsageChannel = supabase
      .channel('player-behaviors-help-usage-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_help_usage'
      }, (payload) => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(gameResultsChannel);
      supabase.removeChannel(helpUsageChannel);
    };
  }, [dateRange]);

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case '3d':
        return { start: subDays(now, 3), end: now };
      case '7d':
        return { start: subDays(now, 7), end: now };
      case '15d':
        return { start: subDays(now, 15), end: now };
      case '30d':
        return { start: subDays(now, 30), end: now };
      case '6m':
        return { start: subMonths(now, 6), end: now };
      case '12m':
        return { start: subMonths(now, 12), end: now };
      default:
        return { start: null, end: null };
    }
  };

  const fetchStats = async () => {
    try {
      const { start, end } = getDateRange();
      const startISO = start ? start.toISOString() : null;
      const endISO = end ? end.toISOString() : null;

      const { data, error } = await supabase.functions.invoke('admin-player-behaviors', {
        body: { 
          startDate: startISO, 
          endDate: endISO,
          timestamp: Date.now() // Force cache bust
        }
      });

      if (error) {
        console.error('[PlayerBehaviors] Admin function error:', error);
        return;
      }

      const incoming = (data?.stats || []) as CategoryStats[];
      
      // Force state update by creating new array reference
      setStats([...incoming]);
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
          <p className="text-xs text-yellow-400/80 mt-1">
            ℹ️ Segítséghasználat adatok csak 2025-10-24-től érhetők el
          </p>
        </div>
        
        <Select value={dateRange} onValueChange={(value: DateRangeOption) => setDateRange(value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Időszak kiválasztása" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Összes adat</SelectItem>
            <SelectItem value="3d">Elmúlt 3 nap</SelectItem>
            <SelectItem value="7d">Elmúlt 7 nap</SelectItem>
            <SelectItem value="15d">Elmúlt 15 nap</SelectItem>
            <SelectItem value="30d">Elmúlt 30 nap</SelectItem>
            <SelectItem value="6m">Elmúlt 6 hónap</SelectItem>
            <SelectItem value="12m">Elmúlt 12 hónap</SelectItem>
          </SelectContent>
        </Select>
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    <div className="bg-slate-800/80 rounded-lg p-3 text-center border border-white/5">
                      <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                      <div className="text-xs text-white/60 mb-1">Játékosok</div>
                      <div className="text-2xl font-bold text-white">{catStats.uniquePlayers}</div>
                    </div>

                    <div className="bg-slate-800/80 rounded-lg p-3 text-center border border-white/5">
                      <TrendingUp className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                      <div className="text-xs text-white/60 mb-1">Összes játék</div>
                      <div className="text-2xl font-bold text-white">{catStats.totalGames}</div>
                    </div>

                    <div className="bg-slate-800/80 rounded-lg p-3 text-center border border-white/5">
                      <Target className="w-5 h-5 text-green-400 mx-auto mb-1" />
                      <div className="text-xs text-white/60 mb-1">Befejezett</div>
                      <div className="text-2xl font-bold text-white">{catStats.completedGames}</div>
                    </div>

                    <div className="bg-slate-800/80 rounded-lg p-3 text-center border border-white/5">
                      <div className="text-xl mb-1">📊</div>
                      <div className="text-xs text-white/60 mb-1">Befejezési %</div>
                      <div className="text-2xl font-bold text-white">{catStats.completionRate}%</div>
                    </div>
                  </div>

                  {/* Secondary Stats */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="bg-slate-800/80 rounded-lg p-3 text-center border border-white/5">
                      <div className="text-xs text-white/60 mb-1">Átlag helyes válasz</div>
                      <div className="text-xl font-bold text-green-400">{catStats.avgCorrectAnswers}</div>
                    </div>

                    <div className="bg-slate-800/80 rounded-lg p-3 text-center border border-white/5">
                      <div className="text-xs text-white/60 mb-1">Átlag válaszidő (mp)</div>
                      <div className="text-xl font-bold text-blue-400">{catStats.avgResponseTime}</div>
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
