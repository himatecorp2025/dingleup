import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEngagementAnalytics } from "@/hooks/useEngagementAnalytics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const EngagementDashboard = () => {
  const { analytics, loading, error } = useEngagementAnalytics();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted p-8">
        <p className="text-lg text-muted-foreground">Betöltés...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted p-8">
        <p className="text-lg text-destructive">{error || 'Hiba történt az adatok betöltése során'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-4xl font-bold">Engagement Dashboard</h1>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Áttekintés</TabsTrigger>
            <TabsTrigger value="features">Funkciók</TabsTrigger>
            <TabsTrigger value="users">Felhasználók</TabsTrigger>
            <TabsTrigger value="game">Játék Engagement</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Átlagos Session Hossz</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{analytics.avgSessionDuration}s</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Átlagos Session / Felhasználó</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{analytics.avgSessionsPerUser}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Összes Session</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{analytics.totalSessions}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Időszakonként (óránkénti bontás)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.engagementByTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="sessions" stroke="hsl(var(--primary))" name="Sessionök" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Funkció Használat</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.featureUsage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="feature_name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="usage_count" fill="hsl(var(--primary))" name="Használatok száma" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Legaktívabb Felhasználók</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.mostActiveUsers.map(user => (
                    <div key={user.user_id} className="flex justify-between items-center p-3 border rounded">
                      <span className="font-medium">{user.username}</span>
                      <div className="text-right">
                        <p className="text-sm font-bold">{user.session_count} session</p>
                        <p className="text-xs text-muted-foreground">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Átlagos Játék / Felhasználó</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{analytics.gameEngagement.avgGamesPerUser}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Átlagos Helyes Válaszok</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{analytics.gameEngagement.avgCorrectAnswers}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Legnépszerűbb Kategóriák</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.gameEngagement.mostPlayedCategories}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" name="Játékok száma" />
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

export default EngagementDashboard;
