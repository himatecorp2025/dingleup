import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface ChartDataPoint {
  date: string;
  users: number;
  avgSpend: number;
}

export const UserGrowthChart = () => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
    
    // Refresh every 15 seconds for faster updates
    const interval = setInterval(fetchChartData, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchChartData = async () => {
    try {
      // Fetch user registrations by day (last 30 days)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      if (profilesError) throw profilesError;

      // Fetch all purchases
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select('user_id, amount_usd, created_at')
        .eq('status', 'completed')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (purchasesError) throw purchasesError;

      // Group by date
      const dataMap = new Map<string, { users: number; totalSpend: number; uniqueSpenders: Set<string> }>();

      // Initialize last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dataMap.set(dateStr, { users: 0, totalSpend: 0, uniqueSpenders: new Set() });
      }

      // Count cumulative users (cumulative count)
      let cumulativeUsers = 0;
      profiles?.forEach((profile) => {
        const date = new Date(profile.created_at).toISOString().split('T')[0];
        cumulativeUsers++;
        
        // Update all dates from this point forward
        for (const [key, value] of dataMap.entries()) {
          if (key >= date) {
            value.users = Math.max(value.users, cumulativeUsers);
          }
        }
      });

      // Calculate spending per user per day
      purchases?.forEach((purchase) => {
        const date = new Date(purchase.created_at).toISOString().split('T')[0];
        const data = dataMap.get(date);
        if (data && purchase.amount_usd) {
          data.totalSpend += Number(purchase.amount_usd);
          data.uniqueSpenders.add(purchase.user_id);
        }
      });

      // Convert to chart data
      const chartArray: ChartDataPoint[] = [];
      dataMap.forEach((value, date) => {
        const avgSpend = value.uniqueSpenders.size > 0 
          ? value.totalSpend / value.uniqueSpenders.size 
          : 0;
        
        chartArray.push({
          date: new Date(date).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' }),
          users: value.users,
          avgSpend: Number(avgSpend.toFixed(2))
        });
      });

      setChartData(chartArray);
      setLoading(false);
    } catch (error) {
      console.error('Chart data fetch error:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-primary-darker/50 border border-primary/30 rounded-xl lg:rounded-2xl p-4 lg:p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-primary-glow" />
          <h3 className="text-lg lg:text-xl font-bold text-foreground">Felhasználók & Költés Trend</h3>
        </div>
        <div className="h-64 lg:h-80 flex items-center justify-center">
          <p className="text-muted-foreground">Adatok betöltése...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-primary-darker/50 border border-primary/30 rounded-xl lg:rounded-2xl p-4 lg:p-6">
      <div className="flex items-center gap-3 mb-4 lg:mb-6">
        <TrendingUp className="w-6 h-6 lg:w-7 lg:h-7 text-primary-glow" />
        <h3 className="text-lg lg:text-xl font-bold text-foreground">Felhasználók & Költés Trend (30 nap)</h3>
      </div>
      
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            yAxisId="left"
            stroke="hsl(var(--primary-glow))"
            tick={{ fill: 'hsl(var(--primary-glow))', fontSize: 12 }}
            label={{ value: 'Felhasználók', angle: -90, position: 'insideLeft', fill: 'hsl(var(--primary-glow))' }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="hsl(var(--success))"
            tick={{ fill: 'hsl(var(--success))', fontSize: 12 }}
            label={{ value: 'Átlag költés ($)', angle: 90, position: 'insideRight', fill: 'hsl(var(--success))' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              color: 'hsl(var(--foreground))'
            }}
            labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
          />
          <Legend 
            wrapperStyle={{ color: 'hsl(var(--muted-foreground))' }}
            iconType="line"
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="users" 
            stroke="hsl(var(--primary-glow))" 
            strokeWidth={3}
            dot={{ fill: 'hsl(var(--primary-glow))', r: 4 }}
            activeDot={{ r: 6 }}
            name="Összes felhasználó"
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="avgSpend" 
            stroke="hsl(var(--success))" 
            strokeWidth={3}
            dot={{ fill: 'hsl(var(--success))', r: 4 }}
            activeDot={{ r: 6 }}
            name="Átlag költés/fő ($)"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
          <p className="text-primary-glow text-xs font-semibold mb-1">Jelenlegi felhasználók</p>
          <p className="text-foreground text-xl font-bold">
            {chartData.length > 0 ? chartData[chartData.length - 1].users : 0}
          </p>
        </div>
        <div className="bg-success/10 border border-success/30 rounded-lg p-3">
          <p className="text-success text-xs font-semibold mb-1">Átlag költés/fő</p>
          <p className="text-foreground text-xl font-bold">
            ${chartData.length > 0 ? chartData[chartData.length - 1].avgSpend.toFixed(2) : '0.00'}
          </p>
        </div>
      </div>
    </div>
  );
};
