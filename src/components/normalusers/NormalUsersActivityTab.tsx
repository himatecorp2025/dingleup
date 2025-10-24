import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GeniusMember } from '@/hooks/useGeniusAnalytics';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download, Activity, Clock, Users, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { exportToCSV } from '@/utils/exportHelpers';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface NormalUsersActivityTabProps {
  members: GeniusMember[];
}

export const NormalUsersActivityTab = ({ members }: NormalUsersActivityTabProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = members.filter(m =>
    m.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSessions = members.reduce((sum, m) => sum + m.total_sessions, 0);
  const avgSessionDuration = members.length > 0 ? members.reduce((sum, m) => sum + m.avg_session_duration, 0) / members.length : 0;
  const activeUsers = members.filter(m => m.last_login && new Date(m.last_login) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;

  // Most active users chart
  const mostActiveUsers = [...members]
    .sort((a, b) => b.total_sessions - a.total_sessions)
    .slice(0, 5)
    .map(m => ({
      name: m.username,
      sessions: m.total_sessions,
      avgDuration: m.avg_session_duration
    }));

  const handleExport = () => {
    const headers = ['Felhasználónév', 'Email', 'Összes Munkamenet', 'Átlag Időtartam (s)', 'Utolsó Bejelentkezés', 'Regisztráció'];
    const data = filteredMembers.map(m => ({
      'Felhasználónév': m.username,
      'Email': m.email,
      'Összes Munkamenet': m.total_sessions,
      'Átlag Időtartam (s)': m.avg_session_duration.toFixed(2),
      'Utolsó Bejelentkezés': m.last_login ? new Date(m.last_login).toLocaleString('hu-HU') : 'Soha',
      'Regisztráció': new Date(m.created_at).toLocaleDateString('hu-HU')
    }));
    exportToCSV(data, 'normal_users_activity', headers);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Összes Munkamenet</p>
                <p className="text-2xl font-bold text-blue-400">{totalSessions}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Átlag Időtartam</p>
                <p className="text-2xl font-bold text-purple-400">{(avgSessionDuration / 60).toFixed(1)}m</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/20">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Aktív Felhasználók (7 nap)</p>
                <p className="text-2xl font-bold text-blue-400">{activeUsers}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Aktivitási Arány</p>
                <p className="text-2xl font-bold text-purple-400">
                  {members.length > 0 ? ((activeUsers / members.length) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/20">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Active Users Chart */}
      <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white">Top 5 Legaktívabb Felhasználó</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mostActiveUsers}>
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
              <Bar dataKey="sessions" fill="hsl(var(--primary))" name="Munkamenetek" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-white">Aktivitás Részletek</CardTitle>
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
                  <TableHead className="text-white">Munkamenetek</TableHead>
                  <TableHead className="text-white">Átlag Időtartam</TableHead>
                  <TableHead className="text-white">Utolsó Bejelentkezés</TableHead>
                  <TableHead className="text-white">Regisztráció</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id} className="border-purple-500/30">
                    <TableCell className="text-white">{member.username}</TableCell>
                    <TableCell className="text-white">{member.email}</TableCell>
                    <TableCell className="text-white">{member.total_sessions}</TableCell>
                    <TableCell className="text-white">{(member.avg_session_duration / 60).toFixed(2)} perc</TableCell>
                    <TableCell className="text-white">
                      {member.last_login ? new Date(member.last_login).toLocaleString('hu-HU') : 'Soha'}
                    </TableCell>
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