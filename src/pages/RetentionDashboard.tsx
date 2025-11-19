import { ArrowLeft, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRetentionAnalytics } from "@/hooks/useRetentionAnalytics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

const RetentionDashboard = () => {
  const navigate = useNavigate();
  const { analytics, loading, error, refetch } = useRetentionAnalytics();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-darker via-primary-dark to-primary-darker flex items-center justify-center p-8">
        <p className="text-lg text-muted-foreground">Betöltés...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-darker via-primary-dark to-primary-darker flex items-center justify-center p-8">
        <p className="text-lg text-destructive">{error || 'Hiba történt az adatok betöltése során'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-darker via-primary-dark to-primary-darker p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button onClick={() => navigate('/admin/analytics')} variant="ghost" size="icon" className="text-foreground hover:bg-foreground/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Retenciós Dashboard</h1>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm" disabled={loading} className="text-foreground border-foreground/30 hover:bg-foreground/10 w-full sm:w-auto">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Frissítés
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-primary-dark/50 p-1 flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">
              Áttekintés
            </TabsTrigger>
            <TabsTrigger value="cohorts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">
              Kohorszok
            </TabsTrigger>
            <TabsTrigger value="churn" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">
              Lemorzsolódás
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <Card className="bg-primary-dark/50 border border-primary/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-foreground text-base sm:text-lg">Napi Aktív Felhasználók</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl sm:text-4xl font-bold text-foreground">{analytics.dailyActiveUsers}</p>
                </CardContent>
              </Card>

              <Card className="bg-primary-dark/50 border border-primary/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-foreground text-base sm:text-lg">Heti Aktív Felhasználók</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl sm:text-4xl font-bold text-foreground">{analytics.weeklyActiveUsers}</p>
                </CardContent>
              </Card>

              <Card className="bg-primary-dark/50 border border-primary/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-foreground text-base sm:text-lg">Havi Aktív Felhasználók</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl sm:text-4xl font-bold text-white">{analytics.monthlyActiveUsers}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Retenciós Ráták</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: '1. Nap', rate: analytics.retentionRates.day1 },
                    { name: '7. Nap', rate: analytics.retentionRates.day7 },
                    { name: '30. Nap', rate: analytics.retentionRates.day30 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#fff" />
                    <YAxis stroke="#fff" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #6b7280', color: '#fff' }} />
                    <Bar dataKey="rate" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cohorts" className="space-y-6">
            <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Kohorsz Analízis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={analytics.cohortData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="cohort" stroke="#fff" />
                    <YAxis stroke="#fff" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #6b7280', color: '#fff' }} />
                    <Legend />
                    <Line type="monotone" dataKey="day1" stroke="hsl(var(--primary))" name="1. Nap" />
                    <Line type="monotone" dataKey="day7" stroke="hsl(var(--secondary))" name="7. Nap" />
                    <Line type="monotone" dataKey="day30" stroke="hsl(var(--accent))" name="30. Nap" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="churn" className="space-y-6">
            <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Inaktív Felhasználók (Lemorzsolódási Kockázat)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.churningUsers.slice(0, 10).map(user => (
                    <div key={user.user_id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 border border-purple-500/20 rounded bg-[#0a0a2e]/50">
                      <span className="font-medium text-white">{user.username}</span>
                      <span className="text-sm text-white/70">
                        {user.days_inactive} napja inaktív
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RetentionDashboard;
