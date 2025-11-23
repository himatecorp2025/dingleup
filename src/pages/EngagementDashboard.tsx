import { RefreshCw, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEngagementAnalytics } from "@/hooks/useEngagementAnalytics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import AdminLayout from '@/components/admin/AdminLayout';
import { MetricInfo } from '@/components/admin/MetricInfo';

const EngagementDashboard = () => {
  const navigate = useNavigate();
  const { analytics, loading, error, refetch } = useEngagementAnalytics();

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
              Engagement Dashboard
            </h1>
          </div>
          <Button onClick={() => refetch()} disabled={loading} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Frissítés
          </Button>
        </div>

        <Card className="bg-primary-dark/30 border border-primary/20">
          <CardContent className="pt-6">
            <p className="text-foreground/80 leading-relaxed">
              Az Engagement Dashboard azt mutatja, hogy a felhasználók mennyire aktívak az alkalmazásban.
              Láthatod a session hosszakat, funkció használatot, játék aktivitást és a legaktívabb felhasználókat.
              Az adatok valós időben frissülnek minden felhasználói tevékenység után.
            </p>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="backdrop-blur-xl bg-white/5 border border-white/10 p-1 flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">
              Áttekintés
            </TabsTrigger>
            <TabsTrigger value="features" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">
              Funkciók
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">
              Felhasználók
            </TabsTrigger>
            <TabsTrigger value="game" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">
              Játék Engagement
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <Card className="backdrop-blur-xl bg-white/5 border border-white/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-foreground text-base sm:text-lg">Átlagos Session Hossz</CardTitle>
                    <MetricInfo
                      title="Átlagos Session Hossz"
                      description="Az összes felhasználói session átlagos időtartama másodpercben mérve. Egy session akkor kezdődik, amikor a felhasználó megnyitja az alkalmazást, és akkor ér véget, amikor bezárja."
                      interpretation="Jó érték: >180s (3 perc). Minél hosszabb a session, annál jobban elkötelezett a felhasználó."
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl sm:text-4xl font-bold text-foreground">{analytics.avgSessionDuration}s</p>
                </CardContent>
              </Card>

              <Card className="bg-primary-dark/50 border border-primary/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-foreground text-base sm:text-lg">Átlagos Session / Felhasználó</CardTitle>
                    <MetricInfo
                      title="Átlagos Session / Felhasználó"
                      description="Az egy felhasználóra jutó átlagos sessionök száma. Ez mutatja, hogy a felhasználók átlagosan hányszor nyitják meg az alkalmazást."
                      interpretation="Jó érték: >3. Minél többször nyitják meg az alkalmazást, annál inkább visszatérő, hű felhasználók."
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl sm:text-4xl font-bold text-foreground">{analytics.avgSessionsPerUser}</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-white text-base sm:text-lg">Összes Session</CardTitle>
                    <MetricInfo
                      title="Összes Session"
                      description="Az összes felhasználói session teljes száma az alkalmazásban. Ez az összes alkalommal számolva, amikor egy felhasználó megnyitotta az alkalmazást."
                      interpretation="Ez a szám folyamatosan növekszik az idő múlásával, ahogy egyre több felhasználó nyitja meg az alkalmazást."
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl sm:text-4xl font-bold text-white">{analytics.totalSessions}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-white">Engagement Időszakonként (óránkénti bontás)</CardTitle>
                  <MetricInfo
                    title="Engagement Időszakonként"
                    description="Ez a grafikon mutatja, hogy a nap melyik órájában mennyi session kezdődik. A vízszintes tengely az órát (0-23), a függőleges tengely a sessionök számát jelenti."
                    interpretation="A csúcsidők megmutatják, mikor aktívak legjobban a felhasználók. Ezt felhasználhatod promóciók vagy új funkciók időzítésére."
                  />
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.engagementByTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="hour" stroke="#fff" />
                    <YAxis stroke="#fff" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #6b7280', color: '#fff' }} />
                    <Line type="monotone" dataKey="sessions" stroke="hsl(var(--primary))" name="Sessionök" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-white">Funkció Használat</CardTitle>
                  <MetricInfo
                    title="Funkció Használat"
                    description="Ez a grafikon mutatja, hogy az egyes funkciók (Játék, Ranglista, Profil, Bolt, stb.) hányszor használták a felhasználók. Minden funkciónál látható a teljes használati szám."
                    interpretation="A legnépszerűbb funkciók megmutatják, mi érdekli leginkább a felhasználókat. Ha egy funkció kevés használatot kap, érdemes megvizsgálni, hogy miért."
                  />
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.featureUsage}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="feature_name" stroke="#fff" />
                    <YAxis stroke="#fff" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #6b7280', color: '#fff' }} />
                    <Bar dataKey="usage_count" fill="hsl(var(--primary))" name="Használatok száma" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-white">Legaktívabb Felhasználók</CardTitle>
                  <MetricInfo
                    title="Legaktívabb Felhasználók"
                    description="Azok a felhasználók, akik a legtöbbet használták az alkalmazást. Minden felhasználónál látható a sessionök száma és az összesen töltött idő percekben."
                    interpretation="Ezek a 'super user'-ek, akik a legelkötelezettebben használják az alkalmazást. Érdemes követni őket, mert ők adnak visszajelzést leggyakrabban és leghasznosabban."
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.mostActiveUsers.map(user => (
                    <div key={user.user_id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 border border-purple-500/20 rounded bg-[#0a0a2e]/50">
                      <span className="font-medium text-white">{user.username}</span>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{user.session_count} session</p>
                        <p className="text-xs text-white/70">
                          {Math.round(user.total_duration / 60)}p összesen
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="game" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-white text-base sm:text-lg">Átlagos Játék / Felhasználó</CardTitle>
                    <MetricInfo
                      title="Átlagos Játék / Felhasználó"
                      description="Az egy felhasználóra jutó átlagos játékok száma. Ez mutatja, hogy a felhasználók átlagosan hányszor játszottak (indítottak új játékot)."
                      interpretation="Jó érték: >5. Minél többször játszanak, annál inkább visszatérő játékosok. Ha alacsony ez a szám, érdemes jutalmazni a visszatérést."
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl sm:text-4xl font-bold text-white">{analytics.gameEngagement.avgGamesPerUser}</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-white text-base sm:text-lg">Átlagos Helyes Válaszok</CardTitle>
                    <MetricInfo
                      title="Átlagos Helyes Válaszok"
                      description="Az összes játék átlagában hány helyes választ adtak a játékosok a 15 kérdésből. Ez a játék nehézségi szintjének és a játékosok tudásának mutatója."
                      interpretation="Jó érték: 8-12 helyes válasz (53-80%). Ha túl alacsony, a játék túl nehéz. Ha túl magas, túl könnyű."
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl sm:text-4xl font-bold text-white">{analytics.gameEngagement.avgCorrectAnswers}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-white">Legnépszerűbb Témakörök</CardTitle>
                  <MetricInfo
                    title="Legnépszerűbb Témakörök"
                    description="Azok a témakörök (Történelem, Kultúra, Egészség, Pénzügyek), ahol a legtöbb játékot játszották. Minden témakör mellett látható az összes játékszám."
                    interpretation="A legnépszerűbb témakörök megmutatják, mi érdekli leginkább a játékosokat. Érdemes több kérdést készíteni a népszerű témákból."
                  />
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.gameEngagement.mostPlayedCategories}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="category" stroke="#fff" />
                    <YAxis stroke="#fff" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #6b7280', color: '#fff' }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" name="Top témakör pontszám" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default EngagementDashboard;
