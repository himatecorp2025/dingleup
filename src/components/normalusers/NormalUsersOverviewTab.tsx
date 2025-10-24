import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GeniusAnalytics } from '@/hooks/useGeniusAnalytics';
import { Users, DollarSign, TrendingUp, ShoppingCart } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

interface NormalUsersOverviewTabProps {
  analytics: GeniusAnalytics;
}

export const NormalUsersOverviewTab = ({ analytics }: NormalUsersOverviewTabProps) => {
  const kpiData = [
    {
      title: 'Összes Normál Felhasználó',
      value: analytics.totalGenius,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    {
      title: 'Összes Bevétel',
      value: `$${analytics.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    {
      title: 'Átlagos Vásárlás',
      value: `$${analytics.averagePurchase.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20'
    },
    {
      title: 'Összes Vásárlás',
      value: analytics.members.reduce((sum, m) => sum + m.total_purchases, 0),
      icon: ShoppingCart,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    }
  ];

  // Growth data
  const growthData = analytics.members
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .reduce((acc, member) => {
      const date = new Date(member.created_at).toLocaleDateString('hu-HU');
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ date, count: acc.length > 0 ? acc[acc.length - 1].count + 1 : 1 });
      }
      return acc;
    }, [] as { date: string; count: number }[]);

  // Top spenders
  const topSpenders = [...analytics.members]
    .sort((a, b) => b.total_spent - a.total_spent)
    .slice(0, 5)
    .map(m => ({
      name: m.username,
      spent: m.total_spent
    }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index} className="bg-[#0a1f14] border-[#d4af37]/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{kpi.title}</p>
                    <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${kpi.bgColor}`}>
                    <Icon className={`w-6 h-6 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Growth Chart */}
      <Card className="bg-[#0a1f14] border-[#d4af37]/30">
        <CardHeader>
          <CardTitle className="text-[#d4af37]">Normál Felhasználók Növekedése</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4af37" opacity={0.1} />
              <XAxis dataKey="date" stroke="#d4af37" />
              <YAxis stroke="#d4af37" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0a1f14', 
                  border: '1px solid #d4af37',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Spenders */}
      <Card className="bg-[#0a1f14] border-[#d4af37]/30">
        <CardHeader>
          <CardTitle className="text-[#d4af37]">Top 5 Költő</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSpenders}>
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
              <Bar dataKey="spent" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
