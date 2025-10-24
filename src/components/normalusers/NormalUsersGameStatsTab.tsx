import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GeniusMember } from '@/hooks/useGeniusAnalytics';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download, Gamepad2, Target, Trophy, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { exportToCSV } from '@/utils/exportHelpers';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface NormalUsersGameStatsTabProps {
  members: GeniusMember[];
}

export const NormalUsersGameStatsTab = ({ members }: NormalUsersGameStatsTabProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = members.filter(m =>
    m.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalGames = members.reduce((sum, m) => sum + m.total_games, 0);
  const totalCorrect = members.reduce((sum, m) => sum + m.total_correct_answers, 0);
  const avgWinRate = members.length > 0 ? members.reduce((sum, m) => sum + m.win_rate, 0) / members.length : 0;
  const avgResponseTime = members.length > 0 ? members.reduce((sum, m) => sum + m.avg_response_time, 0) / members.length : 0;

  // Top players chart
  const topPlayers = [...members]
    .sort((a, b) => b.total_correct_answers - a.total_correct_answers)
    .slice(0, 5)
    .map(m => ({
      name: m.username,
      correct: m.total_correct_answers,
      games: m.total_games,
      winRate: m.win_rate
    }));

  const handleExport = () => {
    const headers = ['Felhasználónév', 'Email', 'Játékok', 'Helyes válaszok', 'Győzelmi arány (%)', 'Átlag válaszidő (mp)', 'Regisztráció'];
    const data = filteredMembers.map(m => ({
      'Felhasználónév': m.username,
      'Email': m.email,
      'Játékok': m.total_games,
      'Helyes válaszok': m.total_correct_answers,
      'Győzelmi arány (%)': m.win_rate.toFixed(2),
      'Átlag válaszidő (mp)': m.avg_response_time.toFixed(2),
      'Regisztráció': new Date(m.created_at).toLocaleDateString('hu-HU')
    }));
    exportToCSV(data, 'normal_users_game_stats', headers);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Összes Játék</p>
                <p className="text-2xl font-bold text-blue-400">{totalGames}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Gamepad2 className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Helyes Válaszok</p>
                <p className="text-2xl font-bold text-purple-400">{totalCorrect}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/20">
                <Target className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Átlag Győzelmi Arány</p>
                <p className="text-2xl font-bold text-blue-400">{avgWinRate.toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Trophy className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Átlag Válaszidő</p>
                <p className="text-2xl font-bold text-purple-400">{avgResponseTime.toFixed(1)}s</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/20">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Players Chart */}
      <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white">Top 5 Játékos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topPlayers}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a3e', 
                  border: '1px solid #6b7280',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="correct" fill="hsl(var(--primary))" name="Helyes válaszok" />
              <Bar dataKey="games" fill="hsl(var(--secondary))" name="Játékok" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-white">Játékstatisztikák</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Input
                placeholder="Keresés..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 bg-[#0a0a2e] border-purple-500/30 text-white"
              />
              <Button onClick={handleExport} className="bg-[#6b46c1] hover:bg-[#6b46c1]/80 text-white w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                CSV Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="border-purple-500/30">
                  <TableHead className="text-white">Felhasználónév</TableHead>
                  <TableHead className="text-white">Email</TableHead>
                  <TableHead className="text-white">Játékok</TableHead>
                  <TableHead className="text-white">Helyes Válaszok</TableHead>
                  <TableHead className="text-white">Győzelmi Arány</TableHead>
                  <TableHead className="text-white">Átlag Válaszidő</TableHead>
                  <TableHead className="text-white">Regisztráció</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id} className="border-purple-500/30">
                    <TableCell className="text-white">{member.username}</TableCell>
                    <TableCell className="text-white">{member.email}</TableCell>
                    <TableCell className="text-white">{member.total_games}</TableCell>
                    <TableCell className="text-white">{member.total_correct_answers}</TableCell>
                    <TableCell className="text-white">{member.win_rate.toFixed(2)}%</TableCell>
                    <TableCell className="text-white">{member.avg_response_time.toFixed(2)}s</TableCell>
                    <TableCell className="text-white">
                      {new Date(member.created_at).toLocaleDateString('hu-HU')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};