import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAdminGameProfileDetail } from '@/hooks/useAdminGameProfiles';
import { Brain, TrendingUp, Heart, ThumbsDown, Clock } from 'lucide-react';
import { useParams } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminGameProfileDetail() {
  const { userId } = useParams<{ userId: string }>();
  const { loading, error, profile } = useAdminGameProfileDetail(userId);

  if (loading) {
    return (
      <AdminLayout>
        <div className="container mx-auto max-w-7xl">
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !profile) {
    return (
      <AdminLayout>
        <div className="container mx-auto max-w-7xl">
          <Alert variant="destructive">
            <AlertDescription>{error || 'Hiba történt az adatok betöltésekor'}</AlertDescription>
          </Alert>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-400" />
            {profile.username}
          </h1>
          <p className="text-white/60">Részletes játékprofil adatok</p>
        </div>

        {/* Status Alert */}
        {profile.personalizationActive ? (
          <Alert className="mb-6 bg-green-500/10 border-green-500/30">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <strong>Személyre szabás aktív:</strong> 70/20/10 kérdéselosztás használatban
            </AlertDescription>
          </Alert>
        ) : profile.personalizationReady ? (
          <Alert className="mb-6 bg-yellow-500/10 border-yellow-500/30">
            <AlertDescription>
              <strong>AI kikapcsolva:</strong> User kikapcsolta a személyre szabást
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-6 bg-blue-500/10 border-blue-500/30">
            <AlertDescription>
              <strong>Tanulási fázis:</strong> {profile.totalAnswered} / 1000 kérdés megválaszolva
            </AlertDescription>
          </Alert>
        )}

        {/* Statisztikai kártyák */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Összes válasz</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{profile.totalAnswered}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Helyes válaszok</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{profile.totalCorrect}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Helyességi arány</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {(profile.overallCorrectRatio * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Heart className="h-3 w-3" /> Likes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-pink-600">{profile.totalLikes}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <ThumbsDown className="h-3 w-3" /> Dislikes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{profile.totalDislikes}</p>
            </CardContent>
          </Card>
        </div>

        {/* Metadata */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profil Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">User ID</p>
                <p className="font-mono text-sm">{profile.userId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Regisztráció</p>
                <p className="text-sm">{new Date(profile.createdAt).toLocaleString('hu-HU')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Utolsó aktivitás</p>
                <p className="text-sm">
                  {profile.lastSeenAt
                    ? new Date(profile.lastSeenAt).toLocaleString('hu-HU')
                    : 'Nincs adat'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TOP3 témák */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-yellow-500" />
              TOP 3 Témakörök
            </CardTitle>
            <CardDescription>Legnagyobb pontszámú témák</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profile.topTopics.map((topic, idx) => (
                <div key={topic.topicId} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-yellow-500">#{idx + 1}</span>
                    <div>
                      <p className="font-semibold">{topic.topicName}</p>
                      <p className="text-sm text-muted-foreground">
                        {topic.answeredCount} válasz • {(topic.correctRatio * 100).toFixed(1)}% helyes
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Score: {topic.score.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      <Heart className="inline h-3 w-3" /> {topic.likeCount} • <ThumbsDown className="inline h-3 w-3" /> {topic.dislikeCount}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Kérdéselosztás */}
        {profile.personalizationReady && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Kérdéselosztás (70/20/10)</CardTitle>
              <CardDescription>
                {profile.aiPersonalizedQuestionsEnabled
                  ? 'Aktív személyre szabott elosztás'
                  : 'Elosztás ha be lenne kapcsolva'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Kedvenc témák (TOP3)</span>
                    <span className="font-semibold">70%</span>
                  </div>
                  <Progress value={70} className="h-3" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Új kérdések</span>
                    <span className="font-semibold">20%</span>
                  </div>
                  <Progress value={20} className="h-3" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Dislike témák</span>
                    <span className="font-semibold">10%</span>
                  </div>
                  <Progress value={10} className="h-3" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Összes téma táblázat */}
        <Card>
          <CardHeader>
            <CardTitle>Összes Témakör</CardTitle>
            <CardDescription>Teljes statisztika témánként</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Témakör</th>
                    <th className="text-right py-2 px-4">Válaszok</th>
                    <th className="text-right py-2 px-4">Helyes %</th>
                    <th className="text-right py-2 px-4">Like/Dislike</th>
                    <th className="text-right py-2 px-4">Átl. idő (ms)</th>
                    <th className="text-right py-2 px-4">Score</th>
                    <th className="text-center py-2 px-4">TOP3</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.allTopics.map((topic) => (
                    <tr key={topic.topicId} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{topic.topicName}</td>
                      <td className="text-right py-3 px-4">{topic.answeredCount}</td>
                      <td className="text-right py-3 px-4">
                        {(topic.correctRatio * 100).toFixed(1)}%
                      </td>
                      <td className="text-right py-3 px-4">
                        {topic.likeCount} / {topic.dislikeCount}
                      </td>
                      <td className="text-right py-3 px-4">
                        {topic.avgResponseMs ? `${topic.avgResponseMs}ms` : '-'}
                      </td>
                      <td className="text-right py-3 px-4">{topic.score.toFixed(2)}</td>
                      <td className="text-center py-3 px-4">
                        {topic.isInTop3 && (
                          <Badge variant="default" className="bg-yellow-500">★</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
