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
  { id: 'health', name: 'Egészség', color: 'from-green-500 to-emerald-500' },
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
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [stats, setStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [startDate, endDate]);

  const fetchStats = async () => {
    setLoading(true);
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
        
        const { data: games } = await gameQuery.eq('category', cat.id);

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

        const { data: helps } = await helpQuery.eq('category', cat.id);

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
                {startDate ? format(startDate, 'P', { locale: hu }) : 'Kezdő dátum'}
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
                {endDate ? format(endDate, 'P', { locale: hu }) : 'Vég dátum'}
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
              <Card key={cat.id} className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 p-6">
                <div className={`bg-gradient-to-r ${cat.color} rounded-lg p-4 mb-4`}>
                  <h3 className="text-xl font-bold text-white">{cat.name}</h3>
                </div>

                <div className="space-y-4">
                  {/* Main Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-white/70">Játékosok</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{catStats.uniquePlayers}</div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-white/70">Átlag helyes</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{catStats.avgCorrectAnswers}</div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-white/70">Játékok</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{catStats.totalGames}</div>
                    </div>
                  </div>

                  {/* Help Usage */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <HelpCircle className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-semibold text-white">Segítséghasználat</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {HELP_TYPES.map(help => (
                        <div key={help.id} className="flex items-center justify-between bg-white/5 rounded px-3 py-2">
                          <span className="text-xs text-white/70">
                            {help.icon} {help.name}
                          </span>
                          <span className="text-sm font-bold text-white">
                            {catStats.helpUsage[help.id as keyof typeof catStats.helpUsage]}×
                          </span>
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
