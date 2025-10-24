import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Search, Activity, Clock, Calendar, Zap } from 'lucide-react';
import { GeniusMember } from '@/hooks/useGeniusAnalytics';
import { exportToCSV } from '@/utils/exportHelpers';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GeniusActivityTabProps {
  members: GeniusMember[];
}

export const GeniusActivityTab = ({ members }: GeniusActivityTabProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = members.filter(member =>
    member.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSessions = members.reduce((sum, m) => sum + m.total_sessions, 0);
  const avgSessionDuration = members.length > 0
    ? members.reduce((sum, m) => sum + m.avg_session_duration, 0) / members.length
    : 0;
  const activeUsers = members.filter(m => {
    if (!m.last_login) return false;
    const lastLogin = new Date(m.last_login);
    const daysSinceLogin = (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceLogin <= 7;
  }).length;

  // Top active users by sessions
  const topActiveUsers = [...members]
    .sort((a, b) => b.total_sessions - a.total_sessions)
    .slice(0, 10);

  // Session duration distribution
  const sessionDurationDist = members.reduce((acc: any[], member) => {
    if (member.total_sessions === 0) return acc;
    const avgMin = member.avg_session_duration / 60;
    const range = avgMin < 5 ? '0-5 min' :
                  avgMin < 15 ? '5-15 min' :
                  avgMin < 30 ? '15-30 min' :
                  avgMin < 60 ? '30-60 min' : '60+ min';
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
      total_sessions: m.total_sessions,
      avg_session_duration: `${(m.avg_session_duration / 60).toFixed(1)} min`,
      last_login: m.last_login ? new Date(m.last_login).toLocaleDateString('hu-HU') : 'Soha'
    }));
    
    exportToCSV(data, 'genius-activity', ['username', 'email', 'total_sessions', 'avg_session_duration', 'last_login']);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/70 text-sm">Összes Session</h3>
              <Activity className="w-8 h-8 text-blue-400 bg-blue-400/20 p-1.5 rounded-lg" />
            </div>
            <p className="text-2xl font-bold text-white">{totalSessions.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/70 text-sm">Átlag Session Idő</h3>
              <Clock className="w-8 h-8 text-green-400 bg-green-400/20 p-1.5 rounded-lg" />
            </div>
            <p className="text-2xl font-bold text-white">{(avgSessionDuration / 60).toFixed(1)} min</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/70 text-sm">Aktív (7 nap)</h3>
              <Zap className="w-8 h-8 text-yellow-400 bg-yellow-400/20 p-1.5 rounded-lg" />
            </div>
            <p className="text-2xl font-bold text-white">{activeUsers}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Active Users */}
        <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
          <CardHeader>
            <CardTitle className="text-[#ffd700] flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Top 10 Legaktívabb Felhasználó
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topActiveUsers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis type="number" stroke="#fff" />
                <YAxis dataKey="username" type="category" stroke="#fff" width={100} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #d4af37' }} />
                <Bar dataKey="total_sessions" fill="#3b82f6" name="Sessions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Session Duration Distribution */}
        <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
          <CardHeader>
            <CardTitle className="text-[#ffd700] flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Session Időtartam Megoszlás
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sessionDurationDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="range" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #d4af37' }} />
                <Bar dataKey="count" fill="#10b981" name="Felhasználók száma" />
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
              <Activity className="w-5 h-5" />
              Részletes Aktivitási Adatok ({filteredMembers.length})
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
                  <TableHead className="text-[#ffd700]">Sessions</TableHead>
                  <TableHead className="text-[#ffd700]">Átlag Session Idő</TableHead>
                  <TableHead className="text-[#ffd700]">Utolsó Belépés</TableHead>
                  <TableHead className="text-[#ffd700]">Státusz</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => {
                  const daysSinceLogin = member.last_login 
                    ? (Date.now() - new Date(member.last_login).getTime()) / (1000 * 60 * 60 * 24)
                    : Infinity;
                  const isActive = daysSinceLogin <= 7;
                  
                  return (
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
                      <TableCell className="text-white">{member.total_sessions}</TableCell>
                      <TableCell className="text-white/70">{(member.avg_session_duration / 60).toFixed(1)} min</TableCell>
                      <TableCell className="text-white/70">
                        {member.last_login 
                          ? new Date(member.last_login).toLocaleDateString('hu-HU')
                          : 'Soha'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-sm ${
                          isActive
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {isActive ? 'Aktív' : 'Inaktív'}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
