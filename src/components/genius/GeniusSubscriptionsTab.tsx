import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Search, Crown, Calendar, CreditCard } from 'lucide-react';
import { GeniusMember } from '@/hooks/useGeniusAnalytics';
import { toast } from 'sonner';

interface GeniusSubscriptionsTabProps {
  members: GeniusMember[];
}

export const GeniusSubscriptionsTab = ({ members }: GeniusSubscriptionsTabProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = members.filter(member =>
    member.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = ['Felhasználónév', 'Email', 'Tier', 'Csatlakozott', 'Lejárat', 'Státusz'];
    const rows = filteredMembers.map(m => [
      m.username,
      m.email,
      m.subscription_tier || 'N/A',
      new Date(m.subscriber_since || m.created_at).toLocaleDateString('hu-HU'),
      m.subscriber_renew_at ? new Date(m.subscriber_renew_at).toLocaleDateString('hu-HU') : 'N/A',
      m.is_subscribed ? 'Aktív' : 'Inaktív'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `genius-subscriptions-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('CSV exportálva!');
  };

  return (
    <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="text-[#ffd700] flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Előfizetések ({filteredMembers.length})
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
            <Button onClick={exportToCSV} className="bg-[#d4af37] hover:bg-[#c5a028] text-black">
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
                <TableHead className="text-[#ffd700]">Email</TableHead>
                <TableHead className="text-[#ffd700]">Tier</TableHead>
                <TableHead className="text-[#ffd700]">Csatlakozott</TableHead>
                <TableHead className="text-[#ffd700]">Lejárat</TableHead>
                <TableHead className="text-[#ffd700]">Státusz</TableHead>
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
                  <TableCell className="text-white/70">{member.email}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded bg-[#ffd700]/20 text-[#ffd700] text-sm">
                      {member.subscription_tier || 'Standard'}
                    </span>
                  </TableCell>
                  <TableCell className="text-white/70">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(member.subscriber_since || member.created_at).toLocaleDateString('hu-HU')}
                    </div>
                  </TableCell>
                  <TableCell className="text-white/70">
                    <div className="flex items-center gap-1">
                      <CreditCard className="w-4 h-4" />
                      {member.subscriber_renew_at
                        ? new Date(member.subscriber_renew_at).toLocaleDateString('hu-HU')
                        : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-sm ${
                      member.is_subscribed
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {member.is_subscribed ? 'Aktív' : 'Inaktív'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
