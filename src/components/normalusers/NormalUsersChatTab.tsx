import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GeniusMember } from '@/hooks/useGeniusAnalytics';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download, MessageCircle, Users, Send, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { exportToCSV } from '@/utils/exportHelpers';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface NormalUsersChatTabProps {
  members: GeniusMember[];
}

export const NormalUsersChatTab = ({ members }: NormalUsersChatTabProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = members.filter(m =>
    m.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalFriends = members.reduce((sum, m) => sum + m.friends_count, 0);
  const totalMessages = members.reduce((sum, m) => sum + m.messages_sent, 0);
  const avgFriendsPerUser = members.length > 0 ? totalFriends / members.length : 0;
  const avgMessagesPerUser = members.length > 0 ? totalMessages / members.length : 0;

  // Most social users chart
  const mostSocialUsers = [...members]
    .sort((a, b) => (b.friends_count + b.messages_sent) - (a.friends_count + a.messages_sent))
    .slice(0, 5)
    .map(m => ({
      name: m.username,
      friends: m.friends_count,
      messages: m.messages_sent
    }));

  const handleExport = () => {
    const headers = ['Felhasználónév', 'Email', 'Barátok', 'Üzenetek', 'Regisztráció'];
    const data = filteredMembers.map(m => ({
      'Felhasználónév': m.username,
      'Email': m.email,
      'Barátok': m.friends_count,
      'Üzenetek': m.messages_sent,
      'Regisztráció': new Date(m.created_at).toLocaleDateString('hu-HU')
    }));
    exportToCSV(data, 'normal_users_chat', headers);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#0a1f14] border-[#d4af37]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Összes Barát</p>
                <p className="text-2xl font-bold text-blue-400">{totalFriends}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0a1f14] border-[#d4af37]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Összes Üzenet</p>
                <p className="text-2xl font-bold text-green-400">{totalMessages}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/20">
                <MessageCircle className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0a1f14] border-[#d4af37]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Átlag Barát/Felhasználó</p>
                <p className="text-2xl font-bold text-yellow-400">{avgFriendsPerUser.toFixed(1)}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-500/20">
                <TrendingUp className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0a1f14] border-[#d4af37]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Átlag Üzenet/Felhasználó</p>
                <p className="text-2xl font-bold text-purple-400">{avgMessagesPerUser.toFixed(1)}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/20">
                <Send className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Social Users Chart */}
      <Card className="bg-[#0a1f14] border-[#d4af37]/30">
        <CardHeader>
          <CardTitle className="text-[#d4af37]">Top 5 Legtársaságibb Felhasználó</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mostSocialUsers}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4af37" opacity={0.1} />
              <XAxis dataKey="name" stroke="#d4af37" />
              <YAxis stroke="#d4af37" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0a1f14', 
                  border: '1px solid #d4af37',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="friends" fill="#3b82f6" name="Barátok" />
              <Bar dataKey="messages" fill="#10b981" name="Üzenetek" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-[#0a1f14] border-[#d4af37]/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#d4af37]">Chat/Közösség Részletek</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Keresés..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 bg-[#0a1f14] border-[#d4af37]/30 text-white"
              />
              <Button onClick={handleExport} className="bg-[#d4af37] hover:bg-[#d4af37]/80 text-black">
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
                <TableRow className="border-[#d4af37]/30">
                  <TableHead className="text-[#d4af37]">Felhasználónév</TableHead>
                  <TableHead className="text-[#d4af37]">Email</TableHead>
                  <TableHead className="text-[#d4af37]">Barátok</TableHead>
                  <TableHead className="text-[#d4af37]">Üzenetek</TableHead>
                  <TableHead className="text-[#d4af37]">Regisztráció</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id} className="border-[#d4af37]/30">
                    <TableCell className="text-white">{member.username}</TableCell>
                    <TableCell className="text-white">{member.email}</TableCell>
                    <TableCell className="text-white">{member.friends_count}</TableCell>
                    <TableCell className="text-white">{member.messages_sent}</TableCell>
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
