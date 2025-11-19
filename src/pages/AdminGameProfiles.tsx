import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAdminGameProfiles } from '@/hooks/useAdminGameProfiles';
import { Brain, Search, TrendingUp, Info, ArrowLeft } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminGameProfiles() {
  const navigate = useNavigate();
  const { loading, error, profiles } = useAdminGameProfiles();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'answered' | 'correctness' | 'active'>('answered');

  const filteredAndSorted = useMemo(() => {
    let result = [...profiles];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.userId.toLowerCase().includes(searchLower) ||
          p.username.toLowerCase().includes(searchLower)
      );
    }

    // Sort
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
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto max-w-7xl">
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto max-w-7xl">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/dashboard')}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Vissza az Admin Dashboard-ra
          </Button>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2 mb-2">
            <Brain className="h-8 w-8 text-primary" />
            Játékprofil Statisztika
          </h1>
          <p className="text-muted-foreground">
            Játékosok profilozási adatai és személyre szabási státuszok
          </p>
        </div>

        {/* Jogi info */}
        <Alert className="mb-6 bg-blue-500/10 border-blue-500/30">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            Ez a nézet a játékosok játékprofil-statisztikáit mutatja. Az adatok nem tartalmaznak érzékeny személyes adatot, és kizárólag a játékmechanika személyre szabásához és a rendszer fejlesztéséhez használjuk őket. Nem reklámcélú profilozás.
          </AlertDescription>
        </Alert>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Szűrés és Rendezés</CardTitle>
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

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Játékosok ({filteredAndSorted.length})</CardTitle>
            <CardDescription>Összes profil adatok és státuszok</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Felhasználó</th>
                    <th className="text-right py-3 px-4">Összes válasz</th>
                    <th className="text-right py-3 px-4">Helyes %</th>
                    <th className="text-right py-3 px-4">Like/Dislike</th>
                    <th className="text-center py-3 px-4">AI Státusz</th>
                    <th className="text-left py-3 px-4">TOP3 Témák</th>
                    <th className="text-center py-3 px-4">Műveletek</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSorted.map((profile) => (
                    <tr key={profile.userId} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold">{profile.username}</p>
                          <p className="text-xs text-muted-foreground">{profile.userId.slice(0, 8)}...</p>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4">{profile.totalAnswered}</td>
                      <td className="text-right py-3 px-4">
                        {(profile.overallCorrectRatio * 100).toFixed(1)}%
                      </td>
                      <td className="text-right py-3 px-4">
                        {profile.totalLikes} / {profile.totalDislikes}
                      </td>
                      <td className="text-center py-3 px-4">
                        {profile.personalizationActive ? (
                          <Badge variant="default" className="bg-green-500">
                            Személyre szabás aktív (70/20/10)
                          </Badge>
                        ) : profile.totalAnswered < 1000 ? (
                          <Badge variant="secondary">
                            Tanulási fázis ({profile.totalAnswered}/1000)
                          </Badge>
                        ) : (
                          <Badge variant="outline">AI kikapcsolva</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          {profile.topTopics.slice(0, 2).map((topic, idx) => (
                            <span key={topic.topicId} className="text-xs">
                              {idx + 1}. {topic.topicName} ({topic.score.toFixed(1)})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/game-profiles/${profile.userId}`)}
                        >
                          Részletek
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
