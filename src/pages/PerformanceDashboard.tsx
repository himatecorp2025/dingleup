import { RefreshCw, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePerformanceAnalytics } from "@/hooks/usePerformanceAnalytics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AdminLayout from '@/components/admin/AdminLayout';
import { MetricInfo } from "@/components/admin/MetricInfo";

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
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Teljesítmény Dashboard
              </h1>
              <p className="text-white/60 text-sm mt-1">Az alkalmazás betöltési sebességének és hibáinak valós idejű monitorozása</p>
            </div>
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
                  <CardTitle className="text-white text-lg flex items-center">
                    Átlagos Betöltési Idő
                    <MetricInfo 
                      title="Betöltési Idő (Load Time)"
                      description="Az oldal teljes betöltési ideje milliszekundumban, a DNS keresésétől kezdve a teljes megjelenésig."
                      interpretation="Jó: <2000ms | Közepes: 2000-4000ms | Lassú: >4000ms"
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-white">{analytics.overallMetrics.avgLoadTime}ms</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/5 border border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-lg flex items-center">
                    Átlagos TTFB
                    <MetricInfo 
                      title="Time To First Byte"
                      description="Az első bájt megérkezésének ideje a szerverről. Azt mutatja, mennyire gyorsan válaszol a backend."
                      interpretation="Jó: <200ms | Közepes: 200-500ms | Lassú: >500ms"
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl sm:text-4xl font-bold text-white">{analytics.overallMetrics.avgTTFB}ms</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-base sm:text-lg flex items-center">
                    Átlagos LCP
                    <MetricInfo 
                      title="Largest Contentful Paint"
                      description="A legnagyobb tartalmi elem megjelenési ideje. Google Core Web Vitals egyik fő metrikája."
                      interpretation="Jó: <2.5s | Közepes: 2.5-4s | Lassú: >4s"
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl sm:text-4xl font-bold text-white">{analytics.overallMetrics.avgLCP}ms</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-base sm:text-lg flex items-center">
                    Átlagos CLS
                    <MetricInfo 
                      title="Cumulative Layout Shift"
                      description="A vizuális stabilitás mérőszáma. Azt mutatja, mennyire 'ugrál' az oldal betöltés közben."
                      interpretation="Jó: <0.1 | Közepes: 0.1-0.25 | Lassú: >0.25"
                    />
                  </CardTitle>
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
                <CardTitle className="text-white flex items-center">
                  Teljesítmény Oldalanként
                  <MetricInfo 
                    title="Oldalankénti Teljesítmény"
                    description="Minden egyes oldal átlagos betöltési ideje. Ez segít azonosítani, mely oldalak lassúak és optimalizálásra szorulnak."
                    interpretation="Összehasonlítsd az oldalakat egymással - a leglassabb oldalak prioritást kaphatnak az optimalizálásban."
                  />
                </CardTitle>
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
                  <CardTitle className="text-white flex items-center">
                    Teljesítmény Eszközönként
                    <MetricInfo 
                      title="Eszközönkénti Teljesítmény"
                      description="Betöltési idők mobilon, tableten és deszktopon. A mobil felhasználók gyakran lassabb hálózatot használnak, ezért fontosak ezek a mérések."
                      interpretation="Mobil optimalizálás kulcsfontosságú - a felhasználók 70-80%-a mobilról látogat."
                    />
                  </CardTitle>
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
                  <CardTitle className="text-white flex items-center">
                    Teljesítmény Böngészőnként
                    <MetricInfo 
                      title="Böngészőnkénti Teljesítmény"
                      description="Betöltési idők különböző böngészőkben (Chrome, Safari, Firefox, stb.). Segít azonosítani böngésző-specifikus problémákat."
                      interpretation="Ha egy böngészőben jelentősen lassabb az oldal, akkor böngésző-kompatibilitási probléma lehet."
                    />
                  </CardTitle>
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
                  <CardTitle className="text-white flex items-center">
                    Hibák Oldalanként
                    <MetricInfo 
                      title="Oldalankénti Hibák"
                      description="JavaScript hibák és kivételek oldalanként csoportosítva. Segít azonosítani, mely oldalakon történnek a legtöbb hibák."
                      interpretation="Magas hibaszám egy oldalon kódhiba vagy rossz felhasználói élmény jelzője. Azonnal javítandó."
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.errorsByPage.length > 0 ? analytics.errorsByPage.map((error, index) => (
                      <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 border border-purple-500/20 rounded bg-[#0a0a2e]/50">
                        <div>
                          <p className="font-medium text-white">{error.page_route}</p>
                          <p className="text-sm text-white/70">{error.error_type}</p>
                        </div>
                        <span className="text-sm font-bold text-white">{error.error_count} hiba</span>
                      </div>
                    )) : (
                      <p className="text-white/60 text-center py-8">Nincs rögzített hiba ezen az oldalon</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    Top Hibák
                    <MetricInfo 
                      title="Leggyakoribb Hibák"
                      description="A leggyakrabban előforduló hibák típusa és üzenete. Ezek prioritást kapnak a hibajavításban."
                      interpretation="A leggyakoribb hibák javítása a legnagyobb hatással lesz a felhasználói élményre."
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.topErrors.length > 0 ? analytics.topErrors.map((error, index) => (
                      <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 border border-purple-500/20 rounded bg-[#0a0a2e]/50">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white">{error.error_type}</p>
                          <p className="text-sm text-white/70 truncate">{error.error_message.slice(0, 50)}...</p>
                        </div>
                        <span className="text-sm font-bold text-white whitespace-nowrap">{error.count}x</span>
                      </div>
                    )) : (
                      <p className="text-white/60 text-center py-8">Nincs rögzített hiba</p>
                    )}
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
