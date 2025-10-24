import { Users, DollarSign, TrendingUp, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GeniusAnalytics } from '@/hooks/useGeniusAnalytics';

interface GeniusOverviewTabProps {
  analytics: GeniusAnalytics;
}

const COLORS = ['#ffd700', '#d4af37', '#c5a028', '#b8941e'];

export const GeniusOverviewTab = ({ analytics }: GeniusOverviewTabProps) => {
  const kpiData = [
    {
      title: 'Összes Genius Tag',
      value: analytics.totalGenius.toLocaleString(),
      icon: Users,
      color: 'text-[#ffd700]',
      bgColor: 'bg-[#ffd700]/20'
    },
    {
      title: 'Összes Bevétel',
      value: `$${analytics.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-400/20'
    },
    {
      title: 'Átlagos Vásárlás',
      value: `$${analytics.averagePurchase.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/20'
    },
    {
      title: 'Aktív Előfizetők',
      value: analytics.activeSubscriptions.toLocaleString(),
      icon: Award,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/20'
    }
  ];

  // Genius növekedés időben
  const growthData = analytics.members
    .reduce((acc: any[], member) => {
      const date = new Date(member.subscriber_since || member.created_at).toLocaleDateString('hu-HU', { year: 'numeric', month: 'short' });
      const existing = acc.find(item => item.month === date);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ month: date, count: 1 });
      }
      return acc;
    }, [])
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  // Subscription distribution
  const subscriptionData = [
    { name: 'Aktív', value: analytics.activeSubscriptions },
    { name: 'Lemondott', value: analytics.cancelledSubscriptions }
  ];

  // Top 5 spenders
  const topSpenders = [...analytics.members]
    .sort((a, b) => b.total_spent - a.total_spent)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => (
          <Card key={index} className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white/70 text-sm">{kpi.title}</h3>
                <kpi.icon className={`w-8 h-8 ${kpi.color} ${kpi.bgColor} p-1.5 rounded-lg`} />
              </div>
              <p className="text-2xl font-bold text-white">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Genius Growth Chart */}
        <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
          <CardHeader>
            <CardTitle className="text-[#ffd700] flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Genius Növekedés Időben
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="month" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #d4af37' }} />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#ffd700" strokeWidth={2} name="Új Genius tagok" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subscription Distribution */}
        <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
          <CardHeader>
            <CardTitle className="text-[#ffd700] flex items-center gap-2">
              <Award className="w-5 h-5" />
              Előfizetések Megoszlása
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={subscriptionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {subscriptionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #d4af37' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Genius Spenders */}
      <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-[#d4af37]/30">
        <CardHeader>
          <CardTitle className="text-[#ffd700] flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Top 5 Genius Vásárló
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSpenders}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="username" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #d4af37' }} />
              <Legend />
              <Bar dataKey="total_spent" fill="#ffd700" name="Költés ($)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
