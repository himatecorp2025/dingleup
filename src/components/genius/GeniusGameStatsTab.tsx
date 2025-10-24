import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Search, Gamepad2, Trophy, Target, Zap } from 'lucide-react';
import { GeniusMember } from '@/hooks/useGeniusAnalytics';
import { exportToCSV } from '@/utils/exportHelpers';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

interface GeniusGameStatsTabProps {
  members: GeniusMember[];
}

export const GeniusGameStatsTab = ({ members }: GeniusGameStatsTabProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = members.filter(member =>
    member.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalGames = members.reduce((sum, m) => sum + m.total_games, 0);
  const totalCorrect = members.reduce((sum, m) => sum + m.total_correct_answers, 0);
  const avgWinRate = members.length > 0 
    ? members.reduce((sum, m) => sum + m.win_rate, 0) / members.length 
    : 0;
  const avgResponseTime = members.length > 0
    ? members.reduce((sum, m) => sum + m.avg_response_time, 0) / members.length
    : 0;

  // Top performers by win rate
  const topPerformers = [...members]
    .filter(m => m.total_games > 0)
    .sort((a, b) => b.win_rate - a.win_rate)
    .slice(0, 10);

  // Win rate distribution
  const winRateDistribution = members.reduce((acc: any[], member) => {
    if (member.total_games === 0) return acc;
    const range = member.win_rate < 20 ? '0-20%' :
                  member.win_rate < 40 ? '20-40%' :
                  member.win_rate < 60 ? '40-60%' :
                  member.win_rate < 80 ? '60-80%' : '80-100%';
    const existing = acc.find(item => item.range === range);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ range, count: 1 });
    }
    return acc;
  }, []);

  const handleExport = () => {
    const data = filteredMembers.map(m => ({
      username: m.username,
      email: m.email,
      total_games: m.total_games,
      total_correct: m.total_correct_answers,
      win_rate: `${m.win_rate.toFixed(1)}%`,
      avg_response_time: `${m.avg_response_time.toFixed(2)}s`
    }));
    
    exportToCSV(data, 'genius-game-stats', ['username', 'email', 'total_games', 'total_correct', 'win_rate', 'avg_response_time']);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/70 text-sm">Összes Játék</h3>
              <Gamepad2 className="w-8 h-8 text-blue-400 bg-blue-400/20 p-1.5 rounded-lg" />
            </div>
            <p className="text-2xl font-bold text-white">{totalGames.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/70 text-sm">Helyes Válaszok</h3>
              <Trophy className="w-8 h-8 text-green-400 bg-green-400/20 p-1.5 rounded-lg" />
            </div>
            <p className="text-2xl font-bold text-white">{totalCorrect.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/70 text-sm">Átlag Győzelmi Arány</h3>
              <Target className="w-8 h-8 text-purple-400 bg-purple-400/20 p-1.5 rounded-lg" />
            </div>
            <p className="text-2xl font-bold text-white">{avgWinRate.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/70 text-sm">Átlag Válaszidő</h3>
              <Zap className="w-8 h-8 text-yellow-400 bg-yellow-400/20 p-1.5 rounded-lg" />
            </div>
            <p className="text-2xl font-bold text-white">{avgResponseTime.toFixed(2)}s</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
          <CardHeader>
            <CardTitle className="text-[#ffd700] flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Top 10 Győztes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topPerformers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis type="number" stroke="#fff" />
                <YAxis dataKey="username" type="category" stroke="#fff" width={100} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #d4af37' }} />
                <Bar dataKey="win_rate" fill="#10b981" name="Győzelmi Arány (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Win Rate Distribution */}
        <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
          <CardHeader>
            <CardTitle className="text-[#ffd700] flex items-center gap-2">
              <Target className="w-5 h-5" />
              Győzelmi Arány Megoszlás
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={winRateDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="range" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #d4af37' }} />
                <Bar dataKey="count" fill="#ffd700" name="Felhasználók száma" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-[#ffd700] flex items-center gap-2">
              <Gamepad2 className="w-5 h-5" />
              Részletes Játékstatisztikák ({filteredMembers.length})
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                <Input
                  placeholder="Keresés..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#0a1f14] border-[#d4af37]/30 text-white w-64"
                />
              </div>
              <Button onClick={handleExport} className="bg-[#d4af37] hover:bg-[#c5a028] text-black">
                <Download className="w-4 h-4 mr-2" />
                CSV Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#d4af37]/30 hover:bg-[#0a1f14]/50">
                  <TableHead className="text-[#ffd700]">Felhasználó</TableHead>
                  <TableHead className="text-[#ffd700]">Játékok</TableHead>
                  <TableHead className="text-[#ffd700]">Helyes Válaszok</TableHead>
                  <TableHead className="text-[#ffd700]">Győzelmi Arány</TableHead>
                  <TableHead className="text-[#ffd700]">Átlag Válaszidő</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id} className="border-[#d4af37]/20 hover:bg-[#0a1f14]/70">
                    <TableCell className="text-white font-medium">
                      <div className="flex items-center gap-2">
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt={member.username} className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#ffd700] flex items-center justify-center text-black font-bold">
                            {member.username[0].toUpperCase()}
                          </div>
                        )}
                        {member.username}
                      </div>
                    </TableCell>
                    <TableCell className="text-white">{member.total_games}</TableCell>
                    <TableCell className="text-green-400">{member.total_correct_answers}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-sm ${
                        member.win_rate >= 70 ? 'bg-green-500/20 text-green-400' :
                        member.win_rate >= 40 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {member.win_rate.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-white/70">{member.avg_response_time.toFixed(2)}s</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
