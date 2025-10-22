import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, RefreshCw } from 'lucide-react';

interface ActivitySummary {
  dateRange: { from: string; to: string; tz: string };
  dau: number;
  avgEventsPerUser: number;
  topHourLast7d: { dow: string; hour: number; events: number };
  topDayLast7d: { date: string; events: number };
  histogram_5min: number[];
  histogram_5min_avg7d: number[];
  heatmap_week: number[][];
  topSlotsToday: Array<{ start: string; end: string; events: number; share: number }>;
  topSlots7d: Array<{ start: string; end: string; events: number; share: number }>;
}

export function ActivityTab() {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('today');
  const [timezone, setTimezone] = useState('Europe/Budapest');
  const [summary, setSummary] = useState<ActivitySummary | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      let from = today;
      let to = today;

      if (dateRange === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        from = to = yesterday.toISOString().split('T')[0];
      } else if (dateRange === 'last7') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        from = weekAgo.toISOString().split('T')[0];
        to = today;
      } else if (dateRange === 'last30') {
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        from = monthAgo.toISOString().split('T')[0];
        to = today;
      }

      const { data, error } = await supabase.functions.invoke('admin-activity', {
        body: { action: 'summary', from, to, tz: timezone },
      });

      if (error) throw error;
      setSummary(data);
    } catch (error: any) {
      console.error('Error fetching activity summary:', error);
      toast.error('Failed to load activity data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [dateRange, timezone]);

  const exportCSV = async (type: '5min' | 'hourly') => {
    try {
      const today = new Date().toISOString().split('T')[0];
      let from = today;
      let to = today;

      if (dateRange === 'last7') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        from = weekAgo.toISOString().split('T')[0];
      }

      const { data, error } = await supabase.functions.invoke('admin-activity', {
        body: { action: `export-${type}`, from, to, tz: timezone },
      });

      if (error) throw error;

      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-${type}-${from}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('CSV exported successfully');
    } catch (error: any) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  const chartData = summary?.histogram_5min.map((events, idx) => {
    const hour = Math.floor(idx * 5 / 60);
    const min = (idx * 5) % 60;
    const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
    return { time, events, avg: summary.histogram_5min_avg7d[idx] };
  }) || [];

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Ma</SelectItem>
              <SelectItem value="yesterday">Tegnap</SelectItem>
              <SelectItem value="last7">Elmúlt 7 nap</SelectItem>
              <SelectItem value="last30">Elmúlt 30 nap</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Europe/Budapest">Europe/Budapest</SelectItem>
              <SelectItem value="UTC">UTC</SelectItem>
              <SelectItem value="America/New_York">America/New_York</SelectItem>
              <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={fetchSummary} disabled={loading} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Frissít
          </Button>

          <Button onClick={() => exportCSV('5min')} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            5 perc CSV
          </Button>

          <Button onClick={() => exportCSV('hourly')} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Óránkénti CSV
          </Button>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Napi Aktív Felhasználók</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.dau.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Átlag Aktivitás / Felhasználó</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.avgEventsPerUser}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Legaktívabb Óra (7 nap)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {summary.topHourLast7d.dow} {summary.topHourLast7d.hour}:00
              </div>
              <p className="text-sm text-muted-foreground">{summary.topHourLast7d.events} esemény</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Legaktívabb Nap (7 nap)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.topDayLast7d.date}</div>
              <p className="text-sm text-muted-foreground">{summary.topDayLast7d.events} esemény</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 24h Chart */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>24 órás Aktivitás (5 perces bontás)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData.filter((_, i) => i % 3 === 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="events" 
                  stroke="#D4AF37" 
                  strokeWidth={2}
                  name="Események"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="avg" 
                  stroke="#138F5E" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="7 nap átlag"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Heatmap */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Heti Hőtérkép (Nap × Óra)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="inline-flex gap-1 min-w-max">
                <div className="flex flex-col gap-1">
                  {/* Day labels column */}
                  <div className="h-6" /> {/* Spacer for hour labels */}
                  {dayNames.map((day, dayIdx) => (
                    <div key={`day-${dayIdx}`} className="h-8 flex items-center text-xs text-muted-foreground pr-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="flex flex-col gap-1">
                  {/* Hour labels row */}
                  <div className="flex gap-1">
                    {Array.from({ length: 24 }, (_, i) => (
                      <div key={i} className="w-8 text-xs text-center text-muted-foreground">
                        {i}
                      </div>
                    ))}
                  </div>
                  
                  {/* Heatmap cells */}
                  {summary.heatmap_week.map((day, dayIdx) => (
                    <div key={`row-${dayIdx}`} className="flex gap-1">
                      {day.map((events, hourIdx) => {
                        const maxEvents = Math.max(...summary.heatmap_week.flat());
                        const intensity = maxEvents > 0 ? events / maxEvents : 0;
                        const bgColor = `rgba(212, 175, 55, ${intensity})`;
                        
                        return (
                          <div
                            key={`${dayIdx}-${hourIdx}`}
                            className="w-8 h-8 rounded border border-border flex items-center justify-center text-xs cursor-pointer hover:ring-2 hover:ring-primary"
                            style={{ backgroundColor: bgColor }}
                            title={`${dayNames[dayIdx]} ${hourIdx}:00 - ${events} events`}
                          >
                            {events > 0 && events > maxEvents * 0.3 ? events : ''}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Slots */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Idősáv Ma</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {summary.topSlotsToday.map((slot, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 rounded bg-card-hover">
                    <span className="font-mono text-sm">{slot.start}–{slot.end}</span>
                    <div className="text-right">
                      <div className="font-semibold">{slot.events}</div>
                      <div className="text-xs text-muted-foreground">{(slot.share * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top 5 Idősáv (7 nap)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {summary.topSlots7d.map((slot, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 rounded bg-card-hover">
                    <span className="font-mono text-sm">{slot.start}–{slot.end}</span>
                    <div className="text-right">
                      <div className="font-semibold">{slot.events}</div>
                      <div className="text-xs text-muted-foreground">{(slot.share * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
