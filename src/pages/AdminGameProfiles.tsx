import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAdminGameProfiles } from '@/hooks/useAdminGameProfiles';
import { Brain, Search, Info } from 'lucide-react';
import { useState, useMemo, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminGameProfiles() {
  const navigate = useNavigate();
  const { loading, error, profiles } = useAdminGameProfiles();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'answered' | 'correctness' | 'active'>('answered');

  const filteredAndSorted = useMemo(() => {
    let result = [...profiles];

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.userId.toLowerCase().includes(searchLower) ||
          p.username.toLowerCase().includes(searchLower)
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'answered') return b.totalAnswered - a.totalAnswered;
      if (sortBy === 'correctness') return b.overallCorrectRatio - a.overallCorrectRatio;
      if (sortBy === 'active') return (b.personalizationActive ? 1 : 0) - (a.personalizationActive ? 1 : 0);
      return 0;
    });

    return result;
  }, [profiles, search, sortBy]);

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

  if (error) {
    return (
      <AdminLayout>
        <div className="container mx-auto max-w-7xl">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3 mb-2">
            <Brain className="h-8 w-8 text-purple-400" />
            Játékprofil Statisztika
          </h1>
          <p className="text-white/60">
            Játékosok profilozási adatai és személyre szabási státuszok
          </p>
        </div>

        <Alert className="mb-6 backdrop-blur-xl bg-blue-500/10 border-blue-500/30">
          <Info className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-white/80">
            Ez a nézet a játékosok játékprofil-statisztikáit mutatja. Az adatok nem tartalmaznak érzékeny személyes adatot, és kizárólag a játékmechanika személyre szabásához és a rendszer fejlesztéséhez használjuk őket. Nem reklámcélú profilozás.
          </AlertDescription>
        </Alert>

        <Card className="mb-6 backdrop-blur-xl bg-white/5 border border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Szűrés és Rendezés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Keresés user ID vagy felhasználónév alapján..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={sortBy === 'answered' ? 'default' : 'outline'}
                  onClick={() => setSortBy('answered')}
                >
                  Válaszok száma
                </Button>
                <Button
                  variant={sortBy === 'correctness' ? 'default' : 'outline'}
                  onClick={() => setSortBy('correctness')}
                >
                  Helyesség
                </Button>
                <Button
                  variant={sortBy === 'active' ? 'default' : 'outline'}
                  onClick={() => setSortBy('active')}
                >
                  Aktív AI
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Optimized Scrollable Table */}
        <Card>
          <CardHeader>
            <CardTitle>Játékosok ({filteredAndSorted.length})</CardTitle>
            <CardDescription>Összes profil adatok és státuszok</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Table Header */}
            <div className="grid grid-cols-7 gap-4 border-b pb-3 mb-2 font-semibold text-sm sticky top-0 bg-background z-10">
              <div className="text-left">Felhasználó</div>
              <div className="text-right">Összes válasz</div>
              <div className="text-right">Helyes %</div>
              <div className="text-right">Like/Dislike</div>
              <div className="text-center">AI Státusz</div>
              <div className="text-left">TOP3 Témák</div>
              <div className="text-center">Műveletek</div>
            </div>
            
            {/* Scrollable Container */}
            <div className="max-h-[600px] overflow-y-auto">
              {filteredAndSorted.map((profile) => (
                <div key={profile.userId} className="grid grid-cols-7 gap-4 items-center border-b py-3 hover:bg-muted/50">
                  <div>
                    <p className="font-semibold text-sm">{profile.username}</p>
                    <p className="text-xs text-muted-foreground">{profile.userId.slice(0, 8)}...</p>
                  </div>
                  <div className="text-right text-sm">{profile.totalAnswered}</div>
                  <div className="text-right text-sm">
                    {(profile.overallCorrectRatio * 100).toFixed(1)}%
                  </div>
                  <div className="text-right text-sm">
                    {profile.totalLikes} / {profile.totalDislikes}
                  </div>
                  <div className="text-center">
                    {profile.personalizationActive ? (
                      <Badge variant="default" className="bg-green-500 text-xs">
                        AI aktív
                      </Badge>
                    ) : profile.totalAnswered < 1000 ? (
                      <Badge variant="secondary" className="text-xs">
                        Tanulás ({profile.totalAnswered}/1000)
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">AI ki</Badge>
                    )}
                  </div>
                  <div>
                    <div className="flex flex-col gap-1">
                      {profile.topTopics.slice(0, 2).map((topic, idx) => (
                        <span key={topic.topicId} className="text-xs">
                          {idx + 1}. {topic.topicName.slice(0, 15)}... ({topic.score.toFixed(1)})
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/game-profiles/${profile.userId}`)}
                    >
                      Részletek
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
