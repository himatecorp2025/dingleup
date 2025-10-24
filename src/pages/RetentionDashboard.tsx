import { ArrowLeft, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRetentionAnalytics } from "@/hooks/useRetentionAnalytics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

const RetentionDashboard = () => {
  const { analytics, loading, error, refetch } = useRetentionAnalytics();

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-4xl font-bold">Retenciós Dashboard</h1>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Frissítés
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Áttekintés</TabsTrigger>
            <TabsTrigger value="cohorts">Kohorszok</TabsTrigger>
            <TabsTrigger value="churn">Lemorzsolódás</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Napi Aktív Felhasználók</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{analytics.dailyActiveUsers}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Heti Aktív Felhasználók</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{analytics.weeklyActiveUsers}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Havi Aktív Felhasználók</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{analytics.monthlyActiveUsers}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Retenciós Ráták</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: '1. Nap', rate: analytics.retentionRates.day1 },
                    { name: '7. Nap', rate: analytics.retentionRates.day7 },
                    { name: '30. Nap', rate: analytics.retentionRates.day30 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="rate" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cohorts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Kohorsz Analízis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={analytics.cohortData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="cohort" />
                    <YAxis />
                    <Tooltip />
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
            <Card>
              <CardHeader>
                <CardTitle>Inaktív Felhasználók (Lemorzsolódási Kockázat)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.churningUsers.slice(0, 10).map(user => (
                    <div key={user.user_id} className="flex justify-between items-center p-3 border rounded">
                      <span className="font-medium">{user.username}</span>
                      <span className="text-sm text-muted-foreground">
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
