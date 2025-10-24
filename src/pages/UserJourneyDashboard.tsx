import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserJourneyAnalytics } from "@/hooks/useUserJourneyAnalytics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

const UserJourneyDashboard = () => {
  const { analytics, loading, error } = useUserJourneyAnalytics();

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
          <h1 className="text-4xl font-bold">User Journey Dashboard</h1>
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
            <Card>
              <CardHeader>
                <CardTitle>Onboarding Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.onboardingFunnel} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="step" type="category" width={150} />
                    <Tooltip />
                    <Bar dataKey="users" name="Felhasználók">
                      {analytics.onboardingFunnel.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {analytics.onboardingFunnel.map((step, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded">
                      <span className="font-medium">{step.step}</span>
                      <div className="text-right">
                        <p className="text-sm font-bold">{step.users} felhasználó</p>
                        {step.dropoffRate > 0 && (
                          <p className="text-xs text-destructive">
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
            <Card>
              <CardHeader>
                <CardTitle>Vásárlási Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.purchaseFunnel} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="step" type="category" width={150} />
                    <Tooltip />
                    <Bar dataKey="users" name="Felhasználók">
                      {analytics.purchaseFunnel.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {analytics.purchaseFunnel.map((step, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded">
                      <span className="font-medium">{step.step}</span>
                      <div className="text-right">
                        <p className="text-sm font-bold">{step.users} felhasználó</p>
                        {step.dropoffRate > 0 && (
                          <p className="text-xs text-destructive">
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
            <Card>
              <CardHeader>
                <CardTitle>Játék Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.gameFunnel} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="step" type="category" width={150} />
                    <Tooltip />
                    <Bar dataKey="users" name="Felhasználók">
                      {analytics.gameFunnel.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {analytics.gameFunnel.map((step, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded">
                      <span className="font-medium">{step.step}</span>
                      <div className="text-right">
                        <p className="text-sm font-bold">{step.users} felhasználó</p>
                        {step.dropoffRate > 0 && (
                          <p className="text-xs text-destructive">
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
            <Card>
              <CardHeader>
                <CardTitle>Leggyakoribb Útvonalak</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.commonPaths.map((path, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded">
                      <span className="font-mono text-sm">{path.path}</span>
                      <span className="font-bold">{path.count} alkalom</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exits" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Kilépési Pontok</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.exitPoints}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="page" />
                    <YAxis />
                    <Tooltip />
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
