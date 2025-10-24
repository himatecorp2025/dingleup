import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Search, MessageCircle, Users, Send, Heart } from 'lucide-react';
import { GeniusMember } from '@/hooks/useGeniusAnalytics';
import { exportToCSV } from '@/utils/exportHelpers';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GeniusChatTabProps {
  members: GeniusMember[];
}

export const GeniusChatTab = ({ members }: GeniusChatTabProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = members.filter(member =>
    member.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalFriends = members.reduce((sum, m) => sum + m.friends_count, 0);
  const totalMessages = members.reduce((sum, m) => sum + m.messages_sent, 0);
  const avgFriendsPerUser = members.length > 0 ? totalFriends / members.length : 0;
  const avgMessagesPerUser = members.length > 0 ? totalMessages / members.length : 0;

  // Top chat users by messages
  const topChatUsers = [...members]
    .sort((a, b) => b.messages_sent - a.messages_sent)
    .slice(0, 10);

  // Top social users by friends
  const topSocialUsers = [...members]
    .sort((a, b) => b.friends_count - a.friends_count)
    .slice(0, 10);

  // Engagement distribution
  const engagementDist = members.reduce((acc: any[], member) => {
    const range = member.messages_sent === 0 ? '0' :
                  member.messages_sent < 10 ? '1-10' :
                  member.messages_sent < 50 ? '10-50' :
                  member.messages_sent < 100 ? '50-100' : '100+';
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
      friends_count: m.friends_count,
      messages_sent: m.messages_sent
    }));
    
    exportToCSV(data, 'genius-chat', ['username', 'email', 'friends_count', 'messages_sent']);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/70 text-sm">Összes Barát</h3>
              <Users className="w-8 h-8 text-blue-400 bg-blue-400/20 p-1.5 rounded-lg" />
            </div>
            <p className="text-2xl font-bold text-white">{totalFriends.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/70 text-sm">Összes Üzenet</h3>
              <MessageCircle className="w-8 h-8 text-green-400 bg-green-400/20 p-1.5 rounded-lg" />
            </div>
            <p className="text-2xl font-bold text-white">{totalMessages.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/70 text-sm">Átlag Barát/User</h3>
              <Heart className="w-8 h-8 text-purple-400 bg-purple-400/20 p-1.5 rounded-lg" />
            </div>
            <p className="text-2xl font-bold text-white">{avgFriendsPerUser.toFixed(1)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/70 text-sm">Átlag Üzenet/User</h3>
              <Send className="w-8 h-8 text-yellow-400 bg-yellow-400/20 p-1.5 rounded-lg" />
            </div>
            <p className="text-2xl font-bold text-white">{avgMessagesPerUser.toFixed(1)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Chat Users */}
        <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
          <CardHeader>
            <CardTitle className="text-[#ffd700] flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Top 10 Chat Aktív Felhasználó
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topChatUsers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis type="number" stroke="#fff" />
                <YAxis dataKey="username" type="category" stroke="#fff" width={100} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #d4af37' }} />
                <Bar dataKey="messages_sent" fill="#10b981" name="Üzenetek száma" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Social Users */}
        <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
          <CardHeader>
            <CardTitle className="text-[#ffd700] flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top 10 Legtöbb Baráttal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topSocialUsers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis type="number" stroke="#fff" />
                <YAxis dataKey="username" type="category" stroke="#fff" width={100} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #d4af37' }} />
                <Bar dataKey="friends_count" fill="#3b82f6" name="Barátok száma" />
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
              <MessageCircle className="w-5 h-5" />
              Részletes Chat/Közösségi Adatok ({filteredMembers.length})
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
                  <TableHead className="text-[#ffd700]">Barátok</TableHead>
                  <TableHead className="text-[#ffd700]">Üzenetek</TableHead>
                  <TableHead className="text-[#ffd700]">Aktivitás</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => {
                  const activityScore = member.friends_count + (member.messages_sent / 10);
                  const activityLevel = activityScore > 50 ? 'Magas' :
                                       activityScore > 20 ? 'Közepes' : 'Alacsony';
                  
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
                      <TableCell className="text-blue-400">{member.friends_count}</TableCell>
                      <TableCell className="text-green-400">{member.messages_sent}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-sm ${
                          activityLevel === 'Magas' ? 'bg-green-500/20 text-green-400' :
                          activityLevel === 'Közepes' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {activityLevel}
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
