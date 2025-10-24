import { ArrowLeft, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMonetizationAnalytics } from "@/hooks/useMonetizationAnalytics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

const MonetizationDashboard = () => {
  const navigate = useNavigate();
  const { analytics, loading, error, refetch } = useMonetizationAnalytics();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] flex items-center justify-center p-8">
        <p className="text-lg text-white/70">Betöltés...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] flex items-center justify-center p-8">
        <p className="text-lg text-red-400">{error || 'Hiba történt az adatok betöltése során'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button onClick={() => navigate('/admin')} variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Monetizációs Dashboard</h1>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm" disabled={loading} className="text-white border-white/30 hover:bg-white/10 w-full sm:w-auto">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Frissítés
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-[#1a1a3e]/50 p-1 flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#6b46c1] data-[state=active]:text-white text-white/70">
              Áttekintés
            </TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:bg-[#6b46c1] data-[state=active]:text-white text-white/70">
              Termékek
            </TabsTrigger>
            <TabsTrigger value="spenders" className="data-[state=active]:bg-[#6b46c1] data-[state=active]:text-white text-white/70">
              Top Vásárlók
            </TabsTrigger>
            <TabsTrigger value="ltv" className="data-[state=active]:bg-[#6b46c1] data-[state=active]:text-white text-white/70">
              LTV Analízis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-base sm:text-lg">Teljes Bevétel</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl sm:text-4xl font-bold text-white">${analytics.totalRevenue.toFixed(2)}</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-base sm:text-lg">ARPU</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl sm:text-4xl font-bold text-white">${analytics.averageRevenuePerUser.toFixed(2)}</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-base sm:text-lg">Fizető Felhasználók</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl sm:text-4xl font-bold text-white">{analytics.payingUsers}</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-base sm:text-lg">Konverziós Ráta</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl sm:text-4xl font-bold text-white">{analytics.conversionRate.toFixed(1)}%</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Bevétel Időbeli Alakulása</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.revenueOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#fff" />
                    <YAxis stroke="#fff" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #6b7280', color: '#fff' }} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" name="Bevétel ($)" />
                    <Line type="monotone" dataKey="transactions" stroke="hsl(var(--secondary))" name="Tranzakciók" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Bevétel Termékek Szerint</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={analytics.revenueByProduct}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.product_type}: $${entry.revenue.toFixed(2)}`}
                      outerRadius={120}
                      fill="hsl(var(--primary))"
                      dataKey="revenue"
                    >
                      {analytics.revenueByProduct.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="spenders" className="space-y-6">
            <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Top 10 Vásárló</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.topSpenders}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="username" stroke="#fff" />
                    <YAxis stroke="#fff" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #6b7280', color: '#fff' }} />
                    <Bar dataKey="total_spent" fill="hsl(var(--primary))" name="Összesen költött ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ltv" className="space-y-6">
            <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Lifetime Value Kohorszonként</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.lifetimeValue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="cohort" stroke="#fff" />
                    <YAxis stroke="#fff" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #6b7280', color: '#fff' }} />
                    <Bar dataKey="ltv" fill="hsl(var(--primary))" name="LTV ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MonetizationDashboard;
