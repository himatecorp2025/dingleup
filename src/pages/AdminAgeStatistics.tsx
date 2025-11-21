import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface AgeBucket {
  label: string;
  count: number;
  percentage: number;
}

interface AgeStatistics {
  total_users: number;
  buckets: AgeBucket[];
}

const COLORS = ['#FFD700', '#FFA500', '#FF6347', '#9370DB', '#4169E1'];

export default function AdminAgeStatistics() {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<AgeStatistics | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');

  useEffect(() => {
    fetchStatistics();
  }, [dateFilter, countryFilter]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('admin-age-statistics', {
        body: {
          date_filter: dateFilter,
          country_filter: countryFilter === 'all' ? null : countryFilter,
        },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;
      setStatistics(data);
    } catch (error) {
      console.error('[AdminAgeStatistics] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Korcsoport Statisztika</h1>
          <p className="text-muted-foreground">Felhasználók megoszlása életkor szerint</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Regisztráció időszak</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Összes</SelectItem>
                  <SelectItem value="30">Elmúlt 30 nap</SelectItem>
                  <SelectItem value="90">Elmúlt 90 nap</SelectItem>
                  <SelectItem value="365">Elmúlt 1 év</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Ország</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Összes ország</SelectItem>
                  <SelectItem value="HU">Magyarország</SelectItem>
                  <SelectItem value="US">USA</SelectItem>
                  <SelectItem value="GB">Egyesült Királyság</SelectItem>
                  <SelectItem value="DE">Németország</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : statistics ? (
          <>
            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>Összesítés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {statistics.total_users.toLocaleString('hu-HU')} felhasználó
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  16 éves vagy idősebb felhasználók száma
                </p>
              </CardContent>
            </Card>

            {/* Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Korcsoportok eloszlása</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statistics.buckets}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => `${value} fő`}
                      labelStyle={{ color: '#000' }}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#FFD700" name="Felhasználók száma" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Korcsoportok aránya</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statistics.buckets}
                      dataKey="percentage"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ label, percentage }) => `${label}: ${percentage.toFixed(1)}%`}
                    >
                      {statistics.buckets.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardHeader>
                <CardTitle>Részletes táblázat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Korcsoport</th>
                        <th className="text-right py-3 px-4">Felhasználók száma</th>
                        <th className="text-right py-3 px-4">Arány (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statistics.buckets.map((bucket, index) => (
                        <tr key={bucket.label} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{bucket.label}</td>
                          <td className="text-right py-3 px-4">{bucket.count.toLocaleString('hu-HU')}</td>
                          <td className="text-right py-3 px-4">{bucket.percentage.toFixed(2)}%</td>
                        </tr>
                      ))}
                      <tr className="font-bold bg-muted/30">
                        <td className="py-3 px-4">Összesen</td>
                        <td className="text-right py-3 px-4">{statistics.total_users.toLocaleString('hu-HU')}</td>
                        <td className="text-right py-3 px-4">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nincs megjeleníthető adat
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}