import { ArrowLeft, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMonetizationAnalytics } from "@/hooks/useMonetizationAnalytics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

const MonetizationDashboard = () => {
  const { analytics, loading, error, refetch } = useMonetizationAnalytics();

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
            <h1 className="text-4xl font-bold">Monetizációs Dashboard</h1>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Frissítés
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Áttekintés</TabsTrigger>
            <TabsTrigger value="products">Termékek</TabsTrigger>
            <TabsTrigger value="spenders">Top Vásárlók</TabsTrigger>
            <TabsTrigger value="ltv">LTV Analízis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Teljes Bevétel</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">${analytics.totalRevenue.toFixed(2)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>ARPU</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">${analytics.averageRevenuePerUser.toFixed(2)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fizető Felhasználók</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{analytics.payingUsers}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Konverziós Ráta</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{analytics.conversionRate.toFixed(1)}%</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Bevétel Időbeli Alakulása</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.revenueOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" name="Bevétel ($)" />
                    <Line type="monotone" dataKey="transactions" stroke="hsl(var(--secondary))" name="Tranzakciók" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bevétel Termékek Szerint</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={analytics.revenueByProduct}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.product_type}: $${entry.revenue.toFixed(2)}`}
                      outerRadius={120}
                      fill="hsl(var(--primary))"
                      dataKey="revenue"
                    >
                      {analytics.revenueByProduct.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="spenders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Vásárló</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.topSpenders}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="username" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total_spent" fill="hsl(var(--primary))" name="Összesen költött ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ltv" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lifetime Value Kohorszonként</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.lifetimeValue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="cohort" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="ltv" fill="hsl(var(--primary))" name="LTV ($)" />
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

export default MonetizationDashboard;
