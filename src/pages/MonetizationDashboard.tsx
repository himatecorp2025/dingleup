import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, TrendingUp, DollarSign, Users, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import AdminLayout from '@/components/admin/AdminLayout';
import { useMonetizationAnalytics } from '@/hooks/useMonetizationAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const MonetizationDashboard = () => {
  const navigate = useNavigate();
  const { analytics, loading, error, refetch } = useMonetizationAnalytics();

  if (loading) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 flex-1" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <Card className="backdrop-blur-xl bg-red-500/10 border-red-500/20">
            <CardContent className="p-8 text-center">
              <p className="text-red-400 mb-4">Hiba történt az adatok betöltése során</p>
              <Button onClick={() => refetch()} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Újrapróbálás
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin/advanced-analytics')}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 bg-clip-text text-transparent">
                Monetizációs Dashboard
              </h1>
              <p className="text-white/60 mt-1">Bevétel, ARPU, konverzió, LTV analízis</p>
            </div>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Frissítés
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="backdrop-blur-xl bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Teljes Bevétel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {analytics?.totalRevenue?.toLocaleString('hu-HU')} Ft
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
                <Users className="w-4 h-4" />
                ARPU
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {analytics?.arpu?.toFixed(0) || 0} Ft
              </div>
              <p className="text-xs text-white/40 mt-1">Átlagos bevétel / felhasználó</p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                ARPPU
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {analytics?.arppu?.toFixed(0) || 0} Ft
              </div>
              <p className="text-xs text-white/40 mt-1">Átlagos bevétel / fizető user</p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Konverziós Arány
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {analytics?.conversionRate?.toFixed(1) || 0}%
              </div>
              <p className="text-xs text-white/40 mt-1">{analytics?.payingUsers || 0} / {analytics?.totalUsers || 0} fizető</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Over Time */}
        {analytics?.revenueOverTime && analytics.revenueOverTime.length > 0 && (
          <Card className="backdrop-blur-xl bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Bevétel Időben</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.revenueOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.6)" />
                  <YAxis stroke="rgba(255,255,255,0.6)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.2)' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Bevétel (Ft)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Revenue by Product */}
        {analytics?.revenueByProduct && analytics.revenueByProduct.length > 0 && (
          <Card className="backdrop-blur-xl bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Bevétel Termék Szerint</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.revenueByProduct}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="product" stroke="rgba(255,255,255,0.6)" />
                  <YAxis stroke="rgba(255,255,255,0.6)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.2)' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10b981" name="Bevétel (Ft)" />
                  <Bar dataKey="count" fill="#3b82f6" name="Vásárlások száma" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {(!analytics?.revenueOverTime || analytics.revenueOverTime.length === 0) && (
          <Card className="backdrop-blur-xl bg-white/5 border-white/10">
            <CardContent className="p-8 text-center">
              <p className="text-white/60">Még nincs monetizációs adat ebben az időszakban</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default MonetizationDashboard;
