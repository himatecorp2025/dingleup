import { RefreshCw, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePerformanceAnalytics } from "@/hooks/usePerformanceAnalytics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AdminLayout from '@/components/admin/AdminLayout';

const PerformanceDashboard = () => {
  const navigate = useNavigate();
  const { analytics, loading, error, refetch } = usePerformanceAnalytics();

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-lg text-white/70">Betöltés...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !analytics) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-lg text-red-400">{error || 'Hiba történt az adatok betöltése során'}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin/advanced-analytics')}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Teljesítmény Dashboard
            </h1>
          </div>
          <Button onClick={() => refetch()} disabled={loading} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Frissítés
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="backdrop-blur-xl bg-white/5 border border-white/10 p-1 flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white text-white/60">
              Áttekintés
            </TabsTrigger>
            <TabsTrigger value="pages" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white text-white/60">
              Oldalak
            </TabsTrigger>
            <TabsTrigger value="devices" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white text-white/60">
              Eszközök
            </TabsTrigger>
            <TabsTrigger value="errors" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white text-white/60">
              Hibák
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="backdrop-blur-xl bg-white/5 border border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-lg">Átlagos Betöltési Idő</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-white">{analytics.overallMetrics.avgLoadTime}ms</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/5 border border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-lg">Átlagos TTFB</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl sm:text-4xl font-bold text-foreground">{analytics.overallMetrics.avgTTFB}ms</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-base sm:text-lg">Átlagos LCP</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl sm:text-4xl font-bold text-white">{analytics.overallMetrics.avgLCP}ms</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-base sm:text-lg">Átlagos CLS</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl sm:text-4xl font-bold text-white">{analytics.overallMetrics.avgCLS}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pages" className="space-y-6">
            <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Teljesítmény Oldalanként</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.performanceByPage}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="page_route" stroke="#fff" />
                    <YAxis stroke="#fff" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #6b7280', color: '#fff' }} />
                    <Bar dataKey="avg_load_time_ms" fill="hsl(var(--primary))" name="Átlagos betöltési idő (ms)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="devices" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white">Teljesítmény Eszközönként</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.performanceByDevice}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="device_type" stroke="#fff" />
                      <YAxis stroke="#fff" />
                      <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #6b7280', color: '#fff' }} />
                      <Bar dataKey="avg_load_time" fill="hsl(var(--primary))" name="Átlagos betöltési idő (ms)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white">Teljesítmény Böngészőnként</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.performanceByBrowser}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="browser" stroke="#fff" />
                      <YAxis stroke="#fff" />
                      <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #6b7280', color: '#fff' }} />
                      <Bar dataKey="avg_load_time" fill="hsl(var(--secondary))" name="Átlagos betöltési idő (ms)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="errors" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white">Hibák Oldalanként</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.errorsByPage.map((error, index) => (
                      <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 border border-purple-500/20 rounded bg-[#0a0a2e]/50">
                        <div>
                          <p className="font-medium text-white">{error.page_route}</p>
                          <p className="text-sm text-white/70">{error.error_type}</p>
                        </div>
                        <span className="text-sm font-bold text-white">{error.error_count} hiba</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white">Top Hibák</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.topErrors.map((error, index) => (
                      <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 border border-purple-500/20 rounded bg-[#0a0a2e]/50">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white">{error.error_type}</p>
                          <p className="text-sm text-white/70 truncate">{error.error_message.slice(0, 50)}...</p>
                        </div>
                        <span className="text-sm font-bold text-white whitespace-nowrap">{error.count}x</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default PerformanceDashboard;
