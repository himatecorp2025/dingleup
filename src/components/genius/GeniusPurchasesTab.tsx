import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Search, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';
import { GeniusMember } from '@/hooks/useGeniusAnalytics';
import { exportToCSV } from '@/utils/exportHelpers';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GeniusPurchasesTabProps {
  members: GeniusMember[];
}

export const GeniusPurchasesTab = ({ members }: GeniusPurchasesTabProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = members.filter(member =>
    member.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPurchases = members.reduce((sum, m) => sum + m.total_purchases, 0);
  const totalRevenue = members.reduce((sum, m) => sum + m.total_spent, 0);
  const avgPurchaseValue = totalPurchases > 0 ? totalRevenue / totalPurchases : 0;

  // Top spenders
  const topSpenders = [...members]
    .sort((a, b) => b.total_spent - a.total_spent)
    .slice(0, 10);

  // Purchase frequency distribution
  const purchaseFrequency = members.reduce((acc: any[], member) => {
    const range = member.total_purchases === 0 ? '0' :
                  member.total_purchases <= 5 ? '1-5' :
                  member.total_purchases <= 10 ? '6-10' :
                  member.total_purchases <= 20 ? '11-20' : '20+';
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
      total_purchases: m.total_purchases,
      total_spent: `$${m.total_spent.toFixed(2)}`,
      avg_purchase: m.total_purchases > 0 ? `$${(m.total_spent / m.total_purchases).toFixed(2)}` : '$0.00'
    }));
    
    exportToCSV(data, 'genius-purchases', ['username', 'email', 'total_purchases', 'total_spent', 'avg_purchase']);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/70 text-sm">Összes Vásárlás</h3>
              <ShoppingCart className="w-8 h-8 text-blue-400 bg-blue-400/20 p-1.5 rounded-lg" />
            </div>
            <p className="text-2xl font-bold text-white">{totalPurchases.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/70 text-sm">Összes Bevétel</h3>
              <DollarSign className="w-8 h-8 text-green-400 bg-green-400/20 p-1.5 rounded-lg" />
            </div>
            <p className="text-2xl font-bold text-white">${totalRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/70 text-sm">Átlag Vásárlás</h3>
              <TrendingUp className="w-8 h-8 text-purple-400 bg-purple-400/20 p-1.5 rounded-lg" />
            </div>
            <p className="text-2xl font-bold text-white">${avgPurchaseValue.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Spenders */}
        <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
          <CardHeader>
            <CardTitle className="text-[#ffd700] flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Top 10 Vásárló
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topSpenders} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis type="number" stroke="#fff" />
                <YAxis dataKey="username" type="category" stroke="#fff" width={100} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #d4af37' }} />
                <Bar dataKey="total_spent" fill="#10b981" name="Költés ($)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Purchase Frequency */}
        <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
          <CardHeader>
            <CardTitle className="text-[#ffd700] flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Vásárlási Gyakoriság
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={purchaseFrequency}>
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
              <ShoppingCart className="w-5 h-5" />
              Részletes Vásárlási Adatok ({filteredMembers.length})
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
                  <TableHead className="text-[#ffd700]">Email</TableHead>
                  <TableHead className="text-[#ffd700]">Vásárlások</TableHead>
                  <TableHead className="text-[#ffd700]">Össz. Költés</TableHead>
                  <TableHead className="text-[#ffd700]">Átlag/Vásárlás</TableHead>
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
                    <TableCell className="text-white">{member.total_purchases}</TableCell>
                    <TableCell className="text-green-400 font-semibold">${member.total_spent.toFixed(2)}</TableCell>
                    <TableCell className="text-white/70">
                      ${member.total_purchases > 0 ? (member.total_spent / member.total_purchases).toFixed(2) : '0.00'}
                    </TableCell>
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
