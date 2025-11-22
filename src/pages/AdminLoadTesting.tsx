import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminLayout from "@/components/admin/AdminLayout";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown,
  Database,
  Zap,
  Globe,
  Users,
  Clock,
  XCircle,
  Lightbulb,
  Play,
  BarChart3
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface PerformanceMetric {
  name: string;
  value: string;
  target: string;
  status: 'pass' | 'warning' | 'fail';
  trend?: 'up' | 'down' | 'stable';
}

interface Bottleneck {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  component: string;
  description: string;
  impact: string;
  recommendation: string;
}

interface OptimizationTask {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimatedImpact: string;
  status: 'todo' | 'in-progress' | 'done';
  complexity: 'easy' | 'medium' | 'hard';
}

const AdminLoadTesting = () => {
  const [selectedTab, setSelectedTab] = useState("overview");

  // Mock data - ez valós k6 teszt eredményekből jönne
  const currentCapacity = 5200; // jelenlegi max stabil user/perc
  const targetCapacity = 10000;
  const capacityProgress = (currentCapacity / targetCapacity) * 100;

  const performanceMetrics: PerformanceMetric[] = [
    { name: "P95 Response Time", value: "2,340ms", target: "< 2,000ms", status: "warning", trend: "up" },
    { name: "P99 Response Time", value: "3,890ms", target: "< 3,000ms", status: "fail", trend: "up" },
    { name: "Error Rate", value: "2.3%", target: "< 1%", status: "fail", trend: "stable" },
    { name: "Auth Success Rate", value: "96.8%", target: "> 98%", status: "warning", trend: "down" },
    { name: "Game Start Success", value: "92.1%", target: "> 95%", status: "warning", trend: "down" },
    { name: "Leaderboard Load", value: "89.5%", target: "> 97%", status: "fail", trend: "down" },
    { name: "Daily Reward Claim", value: "99.2%", target: "> 98%", status: "pass", trend: "stable" },
    { name: "Login Response Time", value: "1,120ms", target: "< 1,000ms", status: "warning", trend: "up" },
  ];

  const identifiedBottlenecks: Bottleneck[] = [
    {
      id: "bn-1",
      severity: "critical",
      component: "Leaderboard Query (get-daily-leaderboard-by-country)",
      description: "Country-specific TOP 100 lekérdezés runtime aggregálással 3,500ms+ válaszidővel",
      impact: "89.5% success rate, 11% timeout, felhasználók lassulást érzékelnek",
      recommendation: "Pre-computed cache tábla (leaderboard_cache) + composite index létrehozása"
    },
    {
      id: "bn-2",
      severity: "critical",
      component: "Database Connection Pool",
      description: "Connection pool exhaustion 5,000+ user felett (max_connections: 25)",
      impact: "Timeout errors, új kapcsolatok elutasítva",
      recommendation: "Connection pooler aktiválás + max_connections növelés 100-ra"
    },
    {
      id: "bn-3",
      severity: "high",
      component: "Question Fetch + Translations",
      description: "8 nyelvi fordítás JOIN minden játékindításnál, 1,500-2,100ms ingadozás",
      impact: "Game start success 92.1%, lassú játék betöltés",
      recommendation: "Question cache implementálás (15 perc TTL) vagy denormalizált tábla"
    },
    {
      id: "bn-4",
      severity: "high",
      component: "Edge Function: start-game-session",
      description: "CPU-intenzív random question selection, file I/O bottleneck",
      impact: "Question fetch time P95: 1,890ms",
      recommendation: "In-memory question cache + optimalizált get_random_questions() SQL function"
    },
    {
      id: "bn-5",
      severity: "medium",
      component: "Index hiány: daily_rankings",
      description: "Hiányzó composite index (country_code + day_date + total_correct_answers)",
      impact: "Leaderboard query full table scan → lassú",
      recommendation: "CREATE INDEX idx_daily_rankings_leaderboard ON daily_rankings(...)"
    },
    {
      id: "bn-6",
      severity: "medium",
      component: "Real-time Subscriptions",
      description: "Túl sok párhuzamos Supabase real-time channel 10,000 user esetén",
      impact: "WebSocket connection limit közelében, potenciális packet loss",
      recommendation: "Broadcast channel helyett server-side aggregált push notification"
    },
  ];

  const optimizationTasks: OptimizationTask[] = [
    {
      id: "opt-1",
      priority: "critical",
      title: "Leaderboard Pre-Computed Cache Tábla",
      description: "leaderboard_cache tábla létrehozása minden országra TOP 100, frissítés játék után vagy 5 percenként",
      estimatedImpact: "Leaderboard query: 3,500ms → 150ms (95% javulás)",
      status: "todo",
      complexity: "medium"
    },
    {
      id: "opt-2",
      priority: "critical",
      title: "Database Connection Pooler Aktiválás",
      description: "Supabase connection pooler bekapcsolás + max_connections = 100",
      estimatedImpact: "Connection timeout: 11% → < 0.5%",
      status: "todo",
      complexity: "easy"
    },
    {
      id: "opt-3",
      priority: "critical",
      title: "Composite Index: daily_rankings",
      description: "CREATE INDEX idx_daily_rankings_leaderboard ON daily_rankings(country_code, day_date, total_correct_answers DESC)",
      estimatedImpact: "Leaderboard query: -40% válaszidő",
      status: "todo",
      complexity: "easy"
    },
    {
      id: "opt-4",
      priority: "high",
      title: "Question Cache (In-Memory + Redis)",
      description: "Edge function in-memory cache 15 perc TTL, vagy Redis cache minden kategóriára",
      estimatedImpact: "Question fetch: 1,890ms → 250ms (87% javulás)",
      status: "todo",
      complexity: "medium"
    },
    {
      id: "opt-5",
      priority: "high",
      title: "Optimalizált get_random_questions() SQL Function",
      description: "TABLESAMPLE vagy pre-shuffled index használata random selection-höz",
      estimatedImpact: "Random question query: -60% CPU használat",
      status: "todo",
      complexity: "hard"
    },
    {
      id: "opt-6",
      priority: "high",
      title: "Edge Function: start-game-session Refaktor",
      description: "Parallel Promise.all használata (reset_game_helps, spendLife, questions fetch)",
      estimatedImpact: "Game start: 2,100ms → 1,200ms",
      status: "todo",
      complexity: "medium"
    },
    {
      id: "opt-7",
      priority: "medium",
      title: "Frontend: React Query Caching",
      description: "Leaderboard, profile, translations cache 30-300s staleTime",
      estimatedImpact: "API calls: -40%, UX responsiveness: +50%",
      status: "todo",
      complexity: "easy"
    },
    {
      id: "opt-8",
      priority: "medium",
      title: "Code Splitting: Admin + Game",
      description: "Lazy load admin interface, game komponensek külön chunk",
      estimatedImpact: "Initial load time: -35%",
      status: "todo",
      complexity: "easy"
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-green-600 dark:text-green-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'fail': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600';
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, string> = {
      critical: 'destructive',
      high: 'default',
      medium: 'secondary',
      low: 'outline'
    };
    return variants[severity] || 'default';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Activity className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
      default: return null;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Load Testing & Performance</h1>
            <p className="text-muted-foreground mt-2">
              Terheléses tesztelési eredmények, bottleneck azonosítás és optimalizálási javaslatok
            </p>
          </div>
        </div>

        {/* K6 Test Instructions */}
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertTitle>K6 Terheléses Tesztek Futtatása</AlertTitle>
          <AlertDescription className="space-y-2 mt-2">
            <p>A K6 tesztek szerveroldalon futó CLI tool-ok, amelyeket nem lehet közvetlenül böngészőből futtatni. Két külön teszt fájl áll rendelkezésre:</p>
            <div className="mt-3 space-y-2">
              <div className="font-medium">📊 Teljes Alkalmazás Teszt:</div>
              <code className="block bg-muted p-2 rounded text-sm">k6 run k6-comprehensive-load-test.js</code>
              <p className="text-xs">Teszteli: Login, Regisztráció, Dashboard, Játék, Leaderboard, Profil, Bolt, Daily Rewards</p>
              
              <div className="font-medium mt-3">🎮 Játék Komponens Teszt:</div>
              <code className="block bg-muted p-2 rounded text-sm">k6 run k6-game-load-test.js</code>
              <p className="text-xs">Teszteli: Játékindítás, Kérdések, Válaszok, Segítségek (50/50, 2x Answer, Audience, Question Swap), Like/Dislike</p>
              
              <div className="font-medium mt-3">⚙️ Telepítés:</div>
              <code className="block bg-muted p-2 rounded text-sm">brew install k6  # MacOS{'\n'}choco install k6  # Windows{'\n'}sudo snap install k6  # Linux</code>
            </div>
          </AlertDescription>
        </Alert>

        {/* Capacity Progress Card */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Jelenlegi Kapacitás vs. Célterhelés
            </CardTitle>
            <CardDescription>
              10,000 egyidejű user/perc elérésének előrehaladása
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{currentCapacity.toLocaleString()} / {targetCapacity.toLocaleString()}</span>
                <Badge variant={capacityProgress >= 100 ? "default" : "secondary"}>
                  {capacityProgress.toFixed(0)}% Complete
                </Badge>
              </div>
              <Progress value={capacityProgress} className="h-3" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Utolsó teszt: 2025-01-22 14:35 UTC</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Alert */}
        {capacityProgress < 100 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Kritikus optimalizálás szükséges</AlertTitle>
            <AlertDescription>
              A rendszer jelenleg csak {currentCapacity.toLocaleString()} user/perc stabil terhelést bír ki. 
              {identifiedBottlenecks.filter(b => b.severity === 'critical').length} db kritikus bottleneck azonosítva.
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="metrics">
              <Activity className="h-4 w-4 mr-2" />
              Metrikák
            </TabsTrigger>
            <TabsTrigger value="bottlenecks">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Bottleneck-ek
            </TabsTrigger>
            <TabsTrigger value="optimizations">
              <Lightbulb className="h-4 w-4 mr-2" />
              Optimalizálások
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,245,892</div>
                  <p className="text-xs text-muted-foreground">Utolsó teszt során</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Failed Requests</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">2.3%</div>
                  <p className="text-xs text-muted-foreground">Target: &lt; 1%</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,340ms</div>
                  <p className="text-xs text-muted-foreground">P95: 2,340ms</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {identifiedBottlenecks.filter(b => b.severity === 'critical').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Azonnali javítás szükséges</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Összefoglaló</CardTitle>
                <CardDescription>Legfontosabb teljesítmény mutatók státusza</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">P95 Response Time</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-yellow-600">2,340ms</span>
                      <Badge variant="outline" className="text-yellow-600">Warning</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">P99 Response Time</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-red-600">3,890ms</span>
                      <Badge variant="destructive">Fail</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Error Rate</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-red-600">2.3%</span>
                      <Badge variant="destructive">Fail</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Leaderboard Success</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-red-600">89.5%</span>
                      <Badge variant="destructive">Fail</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {performanceMetrics.map((metric, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>{metric.name}</span>
                      {metric.trend === 'up' && <TrendingUp className="h-4 w-4 text-red-500" />}
                      {metric.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className={`text-2xl font-bold ${getStatusColor(metric.status)}`}>
                          {metric.value}
                        </span>
                        <Badge variant={
                          metric.status === 'pass' ? 'default' : 
                          metric.status === 'warning' ? 'secondary' : 
                          'destructive'
                        }>
                          {metric.status === 'pass' ? '✓ PASS' : 
                           metric.status === 'warning' ? '⚠ Warning' : 
                           '✗ FAIL'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Target: {metric.target}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Bottlenecks Tab */}
          <TabsContent value="bottlenecks" className="space-y-4">
            {identifiedBottlenecks.map((bottleneck) => (
              <Card key={bottleneck.id} className={
                bottleneck.severity === 'critical' ? 'border-2 border-red-500/50' : ''
              }>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {bottleneck.severity === 'critical' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                        {bottleneck.severity === 'high' && <Database className="h-5 w-5 text-orange-500" />}
                        {bottleneck.severity === 'medium' && <Zap className="h-5 w-5 text-yellow-500" />}
                        {bottleneck.component}
                      </CardTitle>
                      <CardDescription>{bottleneck.description}</CardDescription>
                    </div>
                    <Badge variant={getSeverityBadge(bottleneck.severity) as any}>
                      {bottleneck.severity.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Impact:
                    </h4>
                    <p className="text-sm text-muted-foreground">{bottleneck.impact}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                      Javasolt megoldás:
                    </h4>
                    <p className="text-sm">{bottleneck.recommendation}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Optimizations Tab */}
          <TabsContent value="optimizations" className="space-y-4">
            {optimizationTasks.map((task) => (
              <Card key={task.id} className={
                task.priority === 'critical' ? 'border-2 border-primary/50' : ''
              }>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {getPriorityIcon(task.priority)}
                        {task.title}
                      </CardTitle>
                      <CardDescription>{task.description}</CardDescription>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge variant={task.priority === 'critical' ? 'destructive' : 'secondary'}>
                        {task.priority.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {task.complexity === 'easy' ? '🟢 Easy' : 
                         task.complexity === 'medium' ? '🟡 Medium' : 
                         '🔴 Hard'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
                    <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Várható hatás:
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-400">{task.estimatedImpact}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Státusz:</span>
                    <Badge variant={
                      task.status === 'done' ? 'default' : 
                      task.status === 'in-progress' ? 'secondary' : 
                      'outline'
                    }>
                      {task.status === 'done' ? '✓ Done' : 
                       task.status === 'in-progress' ? '⏳ In Progress' : 
                       '📋 To Do'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminLoadTesting;
