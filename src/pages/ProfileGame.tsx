import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUserGameProfileQuery } from '@/hooks/queries/useUserGameProfileQuery';
import { Brain, TrendingUp, Heart, ThumbsDown, Target, Info, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/i18n';

export default function ProfileGame() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const { loading, error, profile, updateSettings } = useUserGameProfileQuery(userId);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Get user ID on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const handleToggleAI = async (enabled: boolean) => {
    setSettingsLoading(true);
    await updateSettings({ aiPersonalizedQuestionsEnabled: enabled });
    setSettingsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0033] via-[#2d1b69] to-[#0f0033] p-6">
        <div className="container mx-auto max-w-6xl">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0033] via-[#2d1b69] to-[#0f0033] p-6">
        <div className="container mx-auto max-w-6xl">
          <Alert variant="destructive">
            <AlertDescription>{error || t('profile_game.error_loading')}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const questionsRemaining = Math.max(0, 1000 - profile.totalAnswered);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0033] via-[#2d1b69] to-[#0f0033] p-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Brain className="h-8 w-8 text-purple-400" />
              Játékprofilom
            </h1>
            <p className="text-white/70 mt-1">Személyre szabott kérdéssor és statisztikák</p>
          </div>
        </div>

        {/* Jogi info box */}
        <Alert className="mb-6 bg-blue-500/10 border-blue-500/30">
          <Info className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-white/90">
            A játékprofil kizárólag a játékélmény személyre szabására szolgál. Nem tartalmaz érzékeny adatot, nem reklámprofil, és bármikor kikapcsolhatod. A személyre szabás csak akkor aktiválódik, ha több mint 1000 kérdést megválaszoltál.
          </AlertDescription>
        </Alert>

        {/* Tanulási fázis / Aktív személyre szabás */}
        {!profile.personalizationReady ? (
          <Alert className="mb-6 bg-yellow-500/10 border-yellow-500/30">
            <TrendingUp className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-white/90">
              <strong>Tanulási fázis:</strong> A rendszer még tanulja a játékstílusodat. {questionsRemaining} kérdés szükséges még a személyre szabott kérdéssor aktiválásához.
              <Progress value={(profile.totalAnswered / 1000) * 100} className="mt-2" />
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-6 bg-green-500/10 border-green-500/30">
            <Target className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-white/90">
              <strong>Személyre szabás aktív:</strong> A kérdések 70%-a a kedvenc témáidból érkezik.
            </AlertDescription>
          </Alert>
        )}

        {/* AI Toggle */}
        <Card className="mb-6 bg-white/5 border-white/10 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-400" />
              AI Személyre Szabás
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="ai-toggle" className="text-white/90 cursor-pointer">
                Személyre szabott kérdéssor engedélyezése
              </Label>
              <Switch
                id="ai-toggle"
                checked={profile.aiPersonalizedQuestionsEnabled}
                onCheckedChange={handleToggleAI}
                disabled={settingsLoading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Statisztikai kártyák */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription className="text-white/70">Összes válasz</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{profile.totalAnswered}</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription className="text-white/70">Helyes válaszok</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-400">{profile.totalCorrect}</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription className="text-white/70">Helyességi arány</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-400">
                {(profile.overallCorrectRatio * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription className="text-white/70 flex items-center gap-2">
                <Heart className="h-4 w-4" /> / <ThumbsDown className="h-4 w-4" />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">
                {profile.totalLikes} / {profile.totalDislikes}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* TOP3 témák */}
        <Card className="mb-6 bg-white/5 border-white/10 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-yellow-400" />
              TOP 3 Témakörök
            </CardTitle>
            <CardDescription className="text-white/70">
              A kedvenc témáid, amelyekből a legtöbb kérdés érkezik
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profile.topTopics.map((topic, idx) => (
                <div key={topic.topicId} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-yellow-400">#{idx + 1}</span>
                    <div>
                      <p className="text-white font-semibold">{topic.topicName}</p>
                      <p className="text-white/70 text-sm">
                        {topic.answeredCount} válasz • {(topic.correctRatio * 100).toFixed(1)}% helyes
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">Pontszám: {topic.score.toFixed(2)}</p>
                    <p className="text-white/70 text-sm">
                      <Heart className="inline h-3 w-3" /> {topic.likeCount} • <ThumbsDown className="inline h-3 w-3" /> {topic.dislikeCount}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Kérdéselosztás vizualizáció */}
        {profile.personalizationReady && (
          <Card className="mb-6 bg-white/5 border-white/10 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Kérdéselosztás (70/20/10)</CardTitle>
              <CardDescription className="text-white/70">
                Személyre szabott kérdéssor megoszlása
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-white/90">Kedvenc témák (TOP3)</span>
                    <span className="text-white font-semibold">70%</span>
                  </div>
                  <Progress value={70} className="h-3" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-white/90">Új kérdések</span>
                    <span className="text-white font-semibold">20%</span>
                  </div>
                  <Progress value={20} className="h-3" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-white/90">Dislike témák</span>
                    <span className="text-white font-semibold">10%</span>
                  </div>
                  <Progress value={10} className="h-3" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Összes téma táblázat */}
        <Card className="bg-white/5 border-white/10 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Összes Témakör</CardTitle>
            <CardDescription className="text-white/70">
              Teljes statisztika témánként
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 px-4 text-white/90">Témakör</th>
                    <th className="text-right py-2 px-4 text-white/90">Válaszok</th>
                    <th className="text-right py-2 px-4 text-white/90">Helyes %</th>
                    <th className="text-right py-2 px-4 text-white/90">Like/Dislike</th>
                    <th className="text-right py-2 px-4 text-white/90">Pontszám</th>
                    <th className="text-center py-2 px-4 text-white/90">TOP3</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.allTopics.map((topic) => (
                    <tr key={topic.topicId} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4 text-white">{topic.topicName}</td>
                      <td className="text-right py-3 px-4 text-white">{topic.answeredCount}</td>
                      <td className="text-right py-3 px-4 text-white">
                        {(topic.correctRatio * 100).toFixed(1)}%
                      </td>
                      <td className="text-right py-3 px-4 text-white">
                        {topic.likeCount} / {topic.dislikeCount}
                      </td>
                      <td className="text-right py-3 px-4 text-white">{topic.score.toFixed(2)}</td>
                      <td className="text-center py-3 px-4">
                        {topic.isInTop3 && (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-yellow-500 text-white rounded-full text-xs font-bold">
                            ★
                          </span>
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
    </div>
  );
}
