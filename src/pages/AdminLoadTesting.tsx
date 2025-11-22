import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AdminLayout from "@/components/admin/AdminLayout";
import { Terminal, FileText, PlayCircle, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";

const AdminLoadTesting = () => {
  return (
    <AdminLayout>
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Terheléses Tesztelés</h1>
          <p className="text-muted-foreground">
            K6-alapú professzionális load testing rendszer 25,000 egyidejű felhasználóra
          </p>
        </div>

        {/* Figyelmeztetés */}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Fontos!</AlertTitle>
          <AlertDescription>
            A terheléses tesztek hatással vannak az éles rendszerre. Mindig kis terheléssel kezd (500 user)
            és csak akkor skálázz fel, ha az előző teszt sikeres volt!
          </AlertDescription>
        </Alert>

        {/* Quick Start */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5" />
              Quick Start
            </CardTitle>
            <CardDescription>
              Így futtass terheléses tesztet 3 egyszerű lépésben
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  1
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Telepítsd a K6-ot</p>
                  <div className="rounded-lg bg-muted p-3 font-mono text-sm">
                    brew install k6
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  2
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Navigálj a load-tests mappába</p>
                  <div className="rounded-lg bg-muted p-3 font-mono text-sm">
                    cd load-tests/
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  3
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Futtass egy kezdő tesztet (500 user)</p>
                  <div className="rounded-lg bg-muted p-3 font-mono text-sm overflow-x-auto">
                    k6 run -e BASE_URL=$BASE_URL -e SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY -e TARGET_VUS=500 game-load-test.js
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dokumentáció linkek */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                README.md
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Teljes dokumentáció: telepítés, futtatás, metrikák értelmezése
              </p>
              <code className="text-xs bg-muted p-2 rounded block">
                load-tests/README.md
              </code>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Terminal className="h-5 w-5" />
                ENDPOINTS.md
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                API végpontok dokumentációja, request/response példákkal
              </p>
              <code className="text-xs bg-muted p-2 rounded block">
                load-tests/ENDPOINTS.md
              </code>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <PlayCircle className="h-5 w-5" />
                game-load-test.js
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Fő K6 script: login, játék, jutalmak, ranglista tesztelése
              </p>
              <code className="text-xs bg-muted p-2 rounded block">
                load-tests/game-load-test.js
              </code>
            </CardContent>
          </Card>
        </div>

        {/* Terhelési szintek */}
        <Card>
          <CardHeader>
            <CardTitle>Terhelési szintek</CardTitle>
            <CardDescription>
              Fokozatos skálázás 500 → 5,000 → 25,000 felhasználóig
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {/* Szint 1 */}
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <h3 className="font-semibold">Szint 1: Kezdő teszt (500 user)</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Biztonságos próba - ajánlott első futtatás
                </p>
                <div className="rounded-lg bg-muted p-3 font-mono text-xs overflow-x-auto">
                  k6 run -e TARGET_VUS=500 -e RAMP_UP_DURATION=60s -e HOLD_DURATION=120s game-load-test.js
                </div>
              </div>

              {/* Szint 2 */}
              <div className="border-l-4 border-yellow-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-yellow-500" />
                  <h3 className="font-semibold">Szint 2: Közepes teszt (5,000 user)</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Csak akkor, ha az 500-as teszt sikeres volt
                </p>
                <div className="rounded-lg bg-muted p-3 font-mono text-xs overflow-x-auto">
                  k6 run -e TARGET_VUS=5000 -e RAMP_UP_DURATION=180s -e HOLD_DURATION=300s game-load-test.js
                </div>
              </div>

              {/* Szint 3 */}
              <div className="border-l-4 border-red-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <h3 className="font-semibold">Szint 3: Maximum teszt (25,000 user)</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  ⚠️ Csak akkor, ha az 5,000-es teszt sikeres volt!
                </p>
                <div className="rounded-lg bg-muted p-3 font-mono text-xs overflow-x-auto">
                  k6 run -e TARGET_VUS=25000 -e RAMP_UP_DURATION=300s -e HOLD_DURATION=180s game-load-test.js
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sikerkritériumok */}
        <Card>
          <CardHeader>
            <CardTitle>Sikerkritériumok</CardTitle>
            <CardDescription>
              Ezeknek a metrikáknak kell teljesülniük
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="font-medium">p95 válaszidő</span>
                <span className="text-sm text-muted-foreground">&lt; 500ms</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="font-medium">p99 válaszidő</span>
                <span className="text-sm text-muted-foreground">&lt; 1000ms</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="font-medium">HTTP 5xx rate</span>
                <span className="text-sm text-muted-foreground">&lt; 0.5%</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="font-medium">Timeout rate</span>
                <span className="text-sm text-muted-foreground">&lt; 0.1%</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="font-medium">Login success rate</span>
                <span className="text-sm text-muted-foreground">&gt; 99%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Következő lépések */}
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Következő lépések</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>1. Olvasd el a README.md-t a load-tests mappában</p>
            <p>2. Hozd létre a teszt felhasználókat: <code className="bg-muted px-1 rounded">node scripts/create-test-users.js</code></p>
            <p>3. Futtasd az első 500 felhasználós tesztet</p>
            <p>4. Értékeld ki az eredményeket és skálázz fel ha sikeres</p>
          </AlertDescription>
        </Alert>
      </div>
    </AdminLayout>
  );
};

export default AdminLoadTesting;
