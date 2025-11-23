import { RefreshCw, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserJourneyAnalytics } from "@/hooks/useUserJourneyAnalytics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import AdminLayout from '@/components/admin/AdminLayout';
import { MetricInfo } from '@/components/admin/MetricInfo';

const COLORS = ['#a78bfa', '#60a5fa', '#34d399', '#fbbf24'];

const UserJourneyDashboard = () => {
  const navigate = useNavigate();
  const { analytics, loading, error, refetch } = useUserJourneyAnalytics();

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
              User Journey Dashboard
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
              A User Journey Dashboard segít megérteni, hogyan navigálnak a felhasználók az alkalmazásban. 
              Láthatod, hol lépnek be, milyen útvonalakon haladnak, és hol lépnek ki. 
              Az adatok valós időben frissülnek minden felhasználói interakció után.
            </p>
          </CardContent>
        </Card>

        <Tabs defaultValue="onboarding" className="space-y-6">
          <TabsList className="bg-primary-dark/50 p-1 flex-wrap h-auto gap-1">
            <TabsTrigger value="onboarding" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">
              Onboarding Tölcsér
            </TabsTrigger>
            <TabsTrigger value="purchase" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">
              Vásárlási Tölcsér
            </TabsTrigger>
            <TabsTrigger value="game" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">
              Játék Tölcsér
            </TabsTrigger>
            <TabsTrigger value="paths" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">
              Gyakori Útvonalak
            </TabsTrigger>
            <TabsTrigger value="exits" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">
              Kilépési Pontok
            </TabsTrigger>
          </TabsList>

          <TabsContent value="onboarding" className="space-y-6">
            <Card className="bg-primary-dark/50 border border-primary/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-foreground">Onboarding Funnel</CardTitle>
                  <MetricInfo
                    title="Onboarding Tölcsér"
                    description="Az onboarding folyamat során végigkövetjük, hogy a felhasználók hány lépésben jutnak el a regisztrációtól a játék megkezdéséig. Minden lépésnél látható, hány felhasználó halad tovább, és hol morzsolódnak le a legtöbben."
                    interpretation="Minél alacsonyabb a lemorzsolódási arány, annál sikeresebb az onboarding folyamat. Ha egy lépésnél magas a lemorzsolódás, érdemes megvizsgálni, hogy mi okozza a problémát."
                  />
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.onboardingFunnel} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--foreground))" />
                    <YAxis dataKey="step" type="category" width={150} stroke="hsl(var(--foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--primary-dark))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                    <Bar dataKey="users" name="Felhasználók">
                      {analytics.onboardingFunnel.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {analytics.onboardingFunnel.map((step, index) => (
                    <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 border border-purple-500/20 rounded bg-[#0a0a2e]/50">
                      <span className="font-medium text-white">{step.step}</span>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{step.users} felhasználó</p>
                        {step.dropoffRate > 0 && (
                          <p className="text-xs text-red-400">
                            {step.dropoffRate.toFixed(1)}% lemorzsolódás
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchase" className="space-y-6">
            <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-white">Vásárlási Funnel</CardTitle>
                  <MetricInfo
                    title="Vásárlási Tölcsér"
                    description="A vásárlási folyamat három fő lépése: (1) Booster megtekintés - a felhasználó megnézi a Bolt oldalt, (2) Vásárlás indítás - rákattint egy boosterre, (3) Sikeres vásárlás - befejezi a vásárlást és az arany/élet jóváírásra kerül."
                    interpretation="A magas konverziós arány azt jelenti, hogy sokan vásárolnak. Ha sok felhasználó nézi meg a Bolt oldalt, de kevesen vásárolnak, akkor érdemes az árakat vagy az ajánlatokat felülvizsgálni."
                  />
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.purchaseFunnel} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" stroke="#fff" />
                    <YAxis dataKey="step" type="category" width={150} stroke="#fff" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #6b7280', color: '#fff' }} />
                    <Bar dataKey="users" name="Felhasználók">
                      {analytics.purchaseFunnel.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {analytics.purchaseFunnel.map((step, index) => (
                    <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 border border-purple-500/20 rounded bg-[#0a0a2e]/50">
                      <span className="font-medium text-white">{step.step}</span>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{step.users} felhasználó</p>
                        {step.dropoffRate > 0 && (
                          <p className="text-xs text-red-400">
                            {step.dropoffRate.toFixed(1)}% lemorzsolódás
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="game" className="space-y-6">
            <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-white">Játék Funnel</CardTitle>
                  <MetricInfo
                    title="Játék Tölcsér"
                    description="A játék tölcsér mutatja, hogy a felhasználók hányan jutnak el az 5. kérdésig, a 10. kérdésig, és hányan fejezik be sikeresen mind a 15 kérdést. Ez segít azonosítani, hogy melyik szakaszban adják fel legtöbben a játékot."
                    interpretation="Ha az 5. kérdésnél magas a lemorzsolódás, lehet, hogy túl nehéz a játék eleje. Ha a 10. kérdésnél sokan feladják, lehet, hogy a játék túl hosszú vagy unalmas. A cél, hogy minél többen fejezzék be mind a 15 kérdést."
                  />
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.gameFunnel} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" stroke="#fff" />
                    <YAxis dataKey="step" type="category" width={150} stroke="#fff" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #6b7280', color: '#fff' }} />
                    <Bar dataKey="users" name="Felhasználók">
                      {analytics.gameFunnel.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {analytics.gameFunnel.map((step, index) => (
                    <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 border border-purple-500/20 rounded bg-[#0a0a2e]/50">
                      <span className="font-medium text-white">{step.step}</span>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{step.users} felhasználó</p>
                        {step.dropoffRate > 0 && (
                          <p className="text-xs text-red-400">
                            {step.dropoffRate.toFixed(1)}% lemorzsolódás
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paths" className="space-y-6">
            <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-white">Leggyakoribb Útvonalak</CardTitle>
                  <MetricInfo
                    title="Gyakori Útvonalak"
                    description="Ez a lista mutatja, hogy a felhasználók milyen sorrendben keresik fel az oldalakon keresztül az alkalmazást. Például: Dashboard → Játék → Ranglista. Minden útvonal mellett látható, hogy hányan követték azt az útvonalat."
                    interpretation="A leggyakoribb útvonalak megmutatják, hogy a felhasználók hogyan használják az alkalmazást a gyakorlatban. Ha váratlan útvonalakat látsz, érdemes megvizsgálni, hogy miért választják azokat."
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.commonPaths.map((path, index) => (
                    <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 border border-purple-500/20 rounded bg-[#0a0a2e]/50">
                      <span className="font-mono text-sm text-white break-all">{path.path}</span>
                      <span className="font-bold text-white whitespace-nowrap">{path.count} alkalom</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exits" className="space-y-6">
            <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-white">Kilépési Pontok</CardTitle>
                  <MetricInfo
                    title="Kilépési Pontok"
                    description="Ezek azok az oldalak, ahol a felhasználók leggyakrabban kilépnek az alkalmazásból vagy bezárják azt. Minden oldal mellett látható, hány kilépés történt onnan."
                    interpretation="Magas kilépési arány egy adott oldalon azt jelezheti, hogy ott valami probléma van, vagy a felhasználók elvégezték, amit akartak (pl. megnézték a ranglistát és kiléptek). A Játék oldalról történő kilépések normálisak, ha befejezték a játékot."
                  />
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.exitPoints}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="page" stroke="#fff" />
                    <YAxis stroke="#fff" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #6b7280', color: '#fff' }} />
                    <Bar dataKey="exits" fill="hsl(var(--destructive))" name="Kilépések" />
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

export default UserJourneyDashboard;
