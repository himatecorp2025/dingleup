import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GeniusMember } from '@/hooks/useGeniusAnalytics';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { exportToCSV } from '@/utils/exportHelpers';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface NormalUsersPurchasesTabProps {
  members: GeniusMember[];
}

export const NormalUsersPurchasesTab = ({ members }: NormalUsersPurchasesTabProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = members.filter(m =>
    m.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPurchases = members.reduce((sum, m) => sum + m.total_purchases, 0);
  const totalRevenue = members.reduce((sum, m) => sum + m.total_spent, 0);
  const avgPurchaseValue = totalPurchases > 0 ? totalRevenue / totalPurchases : 0;
  const membersWithPurchases = members.filter(m => m.total_purchases > 0).length;

  // Top purchasers chart
  const topPurchasers = [...members]
    .sort((a, b) => b.total_purchases - a.total_purchases)
    .slice(0, 5)
    .map(m => ({
      name: m.username,
      purchases: m.total_purchases,
      spent: m.total_spent
    }));

  const handleExport = () => {
    const headers = ['Felhasználónév', 'Email', 'Vásárlások', 'Össz. költés ($)', 'Átlag/vásárlás ($)', 'Regisztráció'];
    const data = filteredMembers.map(m => ({
      'Felhasználónév': m.username,
      'Email': m.email,
      'Vásárlások': m.total_purchases,
      'Össz. költés ($)': m.total_spent.toFixed(2),
      'Átlag/vásárlás ($)': m.total_purchases > 0 ? (m.total_spent / m.total_purchases).toFixed(2) : '0.00',
      'Regisztráció': new Date(m.created_at).toLocaleDateString('hu-HU')
    }));
    exportToCSV(data, 'normal_users_purchases', headers);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#0a1f14] border-[#d4af37]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Összes Vásárlás</p>
                <p className="text-2xl font-bold text-blue-400">{totalPurchases}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/20">
                <ShoppingCart className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0a1f14] border-[#d4af37]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Összes Bevétel</p>
                <p className="text-2xl font-bold text-green-400">${totalRevenue.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/20">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0a1f14] border-[#d4af37]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Átlag Vásárlás</p>
                <p className="text-2xl font-bold text-yellow-400">${avgPurchaseValue.toFixed(2)}</p>
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
                <p className="text-sm text-gray-400">Vásárlók Száma</p>
                <p className="text-2xl font-bold text-purple-400">{membersWithPurchases}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/20">
                <ShoppingCart className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Purchasers Chart */}
      <Card className="bg-[#0a1f14] border-[#d4af37]/30">
        <CardHeader>
          <CardTitle className="text-[#d4af37]">Top 5 Vásárló</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topPurchasers}>
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
              <Bar dataKey="purchases" fill="#3b82f6" name="Vásárlások" />
              <Bar dataKey="spent" fill="#10b981" name="Költés ($)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-[#0a1f14] border-[#d4af37]/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#d4af37]">Vásárlási Részletek</CardTitle>
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
                  <TableHead className="text-[#d4af37]">Vásárlások</TableHead>
                  <TableHead className="text-[#d4af37]">Össz. Költés</TableHead>
                  <TableHead className="text-[#d4af37]">Átlag/Vásárlás</TableHead>
                  <TableHead className="text-[#d4af37]">Regisztráció</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id} className="border-[#d4af37]/30">
                    <TableCell className="text-white">{member.username}</TableCell>
                    <TableCell className="text-white">{member.email}</TableCell>
                    <TableCell className="text-white">{member.total_purchases}</TableCell>
                    <TableCell className="text-white">${member.total_spent.toFixed(2)}</TableCell>
                    <TableCell className="text-white">
                      ${member.total_purchases > 0 ? (member.total_spent / member.total_purchases).toFixed(2) : '0.00'}
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
