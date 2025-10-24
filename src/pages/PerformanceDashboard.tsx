import { ArrowLeft, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePerformanceAnalytics } from "@/hooks/usePerformanceAnalytics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PerformanceDashboard = () => {
  const { analytics, loading, error, refetch } = usePerformanceAnalytics();

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-4xl font-bold">Teljesítmény Dashboard</h1>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Frissítés
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Áttekintés</TabsTrigger>
            <TabsTrigger value="pages">Oldalak</TabsTrigger>
            <TabsTrigger value="devices">Eszközök</TabsTrigger>
            <TabsTrigger value="errors">Hibák</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white">Átlagos Betöltési Idő</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-white">{analytics.overallMetrics.avgLoadTime}ms</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Átlagos TTFB</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{analytics.overallMetrics.avgTTFB}ms</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Átlagos LCP</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{analytics.overallMetrics.avgLCP}ms</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Átlagos CLS</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{analytics.overallMetrics.avgCLS}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Teljesítmény Oldalanként</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.performanceByPage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="page_route" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avg_load_time_ms" fill="hsl(var(--primary))" name="Átlagos betöltési idő (ms)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="devices" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Teljesítmény Eszközönként</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.performanceByDevice}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="device_type" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="avg_load_time" fill="hsl(var(--primary))" name="Átlagos betöltési idő (ms)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Teljesítmény Böngészőnként</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.performanceByBrowser}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="browser" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="avg_load_time" fill="hsl(var(--secondary))" name="Átlagos betöltési idő (ms)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="errors" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Hibák Oldalanként</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.errorsByPage.map((error, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <p className="font-medium">{error.page_route}</p>
                          <p className="text-sm text-muted-foreground">{error.error_type}</p>
                        </div>
                        <span className="text-sm font-bold">{error.error_count} hiba</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Hibák</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.topErrors.map((error, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <p className="font-medium">{error.error_type}</p>
                          <p className="text-sm text-muted-foreground">{error.error_message.slice(0, 50)}...</p>
                        </div>
                        <span className="text-sm font-bold">{error.count}x</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
