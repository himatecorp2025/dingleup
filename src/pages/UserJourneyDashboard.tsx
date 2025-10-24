import { ArrowLeft, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserJourneyAnalytics } from "@/hooks/useUserJourneyAnalytics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

const UserJourneyDashboard = () => {
  const { analytics, loading, error, refetch } = useUserJourneyAnalytics();

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
            <Link to="/admin">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">User Journey Dashboard</h1>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm" disabled={loading} className="text-white border-white/30 hover:bg-white/10 w-full sm:w-auto">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Frissítés
          </Button>
        </div>

        <Tabs defaultValue="onboarding" className="space-y-6">
          <TabsList>
            <TabsTrigger value="onboarding">Onboarding Tölcsér</TabsTrigger>
            <TabsTrigger value="purchase">Vásárlási Tölcsér</TabsTrigger>
            <TabsTrigger value="game">Játék Tölcsér</TabsTrigger>
            <TabsTrigger value="paths">Gyakori Útvonalak</TabsTrigger>
            <TabsTrigger value="exits">Kilépési Pontok</TabsTrigger>
          </TabsList>

          <TabsContent value="onboarding" className="space-y-6">
            <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Onboarding Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.onboardingFunnel} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" stroke="#fff" />
                    <YAxis dataKey="step" type="category" width={150} stroke="#fff" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #6b7280' }} />
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
                <CardTitle className="text-white">Vásárlási Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.purchaseFunnel} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" stroke="#fff" />
                    <YAxis dataKey="step" type="category" width={150} stroke="#fff" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #6b7280' }} />
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
                <CardTitle className="text-white">Játék Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.gameFunnel} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" stroke="#fff" />
                    <YAxis dataKey="step" type="category" width={150} stroke="#fff" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #6b7280' }} />
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
                <CardTitle className="text-white">Leggyakoribb Útvonalak</CardTitle>
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
                <CardTitle className="text-white">Kilépési Pontok</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.exitPoints}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="page" stroke="#fff" />
                    <YAxis stroke="#fff" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #6b7280' }} />
                    <Bar dataKey="exits" fill="hsl(var(--destructive))" name="Kilépések" />
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

export default UserJourneyDashboard;
