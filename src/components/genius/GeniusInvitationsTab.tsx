import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Search, Users, UserPlus, CheckCircle, TrendingUp } from 'lucide-react';
import { GeniusMember } from '@/hooks/useGeniusAnalytics';
import { exportToCSV } from '@/utils/exportHelpers';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface GeniusInvitationsTabProps {
  members: GeniusMember[];
}

const COLORS = ['#10b981', '#ef4444', '#6366f1', '#f59e0b'];

export const GeniusInvitationsTab = ({ members }: GeniusInvitationsTabProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = members.filter(member =>
    member.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalInvitationsSent = members.reduce((sum, m) => sum + m.invitations_sent, 0);
  const totalInvitationsAccepted = members.reduce((sum, m) => sum + m.invitations_accepted, 0);
  const avgConversionRate = totalInvitationsSent > 0 
    ? (totalInvitationsAccepted / totalInvitationsSent) * 100 
    : 0;
  const activeInviters = members.filter(m => m.invitations_sent > 0).length;

  // Top inviters
  const topInviters = [...members]
    .filter(m => m.invitations_sent > 0)
    .sort((a, b) => b.invitations_accepted - a.invitations_accepted)
    .slice(0, 10);

  // Invitation success distribution
  const invitationSuccessDist = [
    { name: 'Elfogadva', value: totalInvitationsAccepted },
    { name: 'Függőben', value: totalInvitationsSent - totalInvitationsAccepted }
  ];

  const handleExport = () => {
    const data = filteredMembers.map(m => ({
      username: m.username,
      email: m.email,
      invitations_sent: m.invitations_sent,
      invitations_accepted: m.invitations_accepted,
      conversion_rate: m.invitations_sent > 0 
        ? `${((m.invitations_accepted / m.invitations_sent) * 100).toFixed(1)}%` 
        : '0%'
    }));
    
    exportToCSV(data, 'genius-invitations', ['username', 'email', 'invitations_sent', 'invitations_accepted', 'conversion_rate']);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/70 text-sm">Elküldött Meghívók</h3>
              <UserPlus className="w-8 h-8 text-blue-400 bg-blue-400/20 p-1.5 rounded-lg" />
            </div>
            <p className="text-2xl font-bold text-white">{totalInvitationsSent.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/70 text-sm">Elfogadott Meghívók</h3>
              <CheckCircle className="w-8 h-8 text-green-400 bg-green-400/20 p-1.5 rounded-lg" />
            </div>
            <p className="text-2xl font-bold text-white">{totalInvitationsAccepted.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/70 text-sm">Konverziós Arány</h3>
              <TrendingUp className="w-8 h-8 text-purple-400 bg-purple-400/20 p-1.5 rounded-lg" />
            </div>
            <p className="text-2xl font-bold text-white">{avgConversionRate.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/70 text-sm">Aktív Meghívók</h3>
              <Users className="w-8 h-8 text-yellow-400 bg-yellow-400/20 p-1.5 rounded-lg" />
            </div>
            <p className="text-2xl font-bold text-white">{activeInviters}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Inviters */}
        <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
          <CardHeader>
            <CardTitle className="text-[#ffd700] flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Top 10 Meghívó
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topInviters} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis type="number" stroke="#fff" />
                <YAxis dataKey="username" type="category" stroke="#fff" width={100} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #d4af37' }} />
                <Bar dataKey="invitations_accepted" fill="#10b981" name="Elfogadott meghívók" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Invitation Success */}
        <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
          <CardHeader>
            <CardTitle className="text-[#ffd700] flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Meghívók Megoszlása
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={invitationSuccessDist}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {invitationSuccessDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #d4af37' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-[#ffd700] flex items-center gap-2">
              <Users className="w-5 h-5" />
              Részletes Meghívási Adatok ({filteredMembers.length})
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
                  <TableHead className="text-[#ffd700]">Elküldve</TableHead>
                  <TableHead className="text-[#ffd700]">Elfogadva</TableHead>
                  <TableHead className="text-[#ffd700]">Konverziós Arány</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => {
                  const conversionRate = member.invitations_sent > 0 
                    ? (member.invitations_accepted / member.invitations_sent) * 100 
                    : 0;
                  
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
                      <TableCell className="text-white">{member.invitations_sent}</TableCell>
                      <TableCell className="text-green-400">{member.invitations_accepted}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-sm ${
                          conversionRate >= 50 ? 'bg-green-500/20 text-green-400' :
                          conversionRate >= 25 ? 'bg-yellow-500/20 text-yellow-400' :
                          conversionRate > 0 ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {conversionRate.toFixed(1)}%
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
