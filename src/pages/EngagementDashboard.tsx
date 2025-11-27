import { RefreshCw, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEngagementAnalytics } from "@/hooks/useEngagementAnalytics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import AdminLayout from '@/components/admin/AdminLayout';
import { MetricInfo } from '@/components/admin/MetricInfo';
import { useI18n } from '@/i18n';

const EngagementDashboard = () => {
  const navigate = useNavigate();
  const { analytics, loading, error, refetch } = useEngagementAnalytics();
  const { t } = useI18n();

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-lg text-white/70">{t('admin.loading')}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !analytics) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-lg text-red-400">{error || t('admin.error_loading')}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin/advanced-analytics')}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              {t('admin.engagement.title')}
            </h1>
          </div>
          <Button onClick={() => refetch()} disabled={loading} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('admin.refresh')}
          </Button>
        </div>

        <Card className="bg-primary-dark/30 border border-primary/20">
          <CardContent className="pt-6">
            <p className="text-foreground/80 leading-relaxed">
              {t('admin.engagement.description')}
            </p>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="backdrop-blur-xl bg-white/5 border border-white/10 p-1 flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">
              {t('admin.engagement.tab_overview')}
            </TabsTrigger>
            <TabsTrigger value="features" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">
              {t('admin.engagement.tab_features')}
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">
              {t('admin.engagement.tab_users')}
            </TabsTrigger>
            <TabsTrigger value="game" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">
              {t('admin.engagement.tab_game')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <Card className="backdrop-blur-xl bg-white/5 border border-white/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-foreground text-base sm:text-lg">{t('admin.engagement.avg_session_duration')}</CardTitle>
                    <MetricInfo
                      title={t('admin.engagement.avg_session_duration')}
                      description={t('admin.engagement.avg_session_duration_desc')}
                      interpretation={t('admin.engagement.avg_session_duration_interpretation')}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl sm:text-4xl font-bold text-foreground">{analytics.avgSessionDuration}s</p>
                </CardContent>
              </Card>

              <Card className="bg-primary-dark/50 border border-primary/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-foreground text-base sm:text-lg">{t('admin.engagement.avg_sessions_per_user')}</CardTitle>
                    <MetricInfo
                      title={t('admin.engagement.avg_sessions_per_user')}
                      description={t('admin.engagement.avg_sessions_per_user_desc')}
                      interpretation={t('admin.engagement.avg_sessions_per_user_interpretation')}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl sm:text-4xl font-bold text-foreground">{analytics.avgSessionsPerUser}</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-white text-base sm:text-lg">{t('admin.engagement.total_sessions')}</CardTitle>
                    <MetricInfo
                      title={t('admin.engagement.total_sessions')}
                      description={t('admin.engagement.total_sessions_desc')}
                      interpretation={t('admin.engagement.total_sessions_interpretation')}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl sm:text-4xl font-bold text-white">{analytics.totalSessions}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-white">{t('admin.engagement.engagement_by_time')}</CardTitle>
                  <MetricInfo
                    title={t('admin.engagement.engagement_by_time')}
                    description={t('admin.engagement.engagement_by_time_desc')}
                    interpretation={t('admin.engagement.engagement_by_time_interpretation')}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.engagementByTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="hour" stroke="#fff" />
                    <YAxis stroke="#fff" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #6b7280', color: '#fff' }} />
                    <Line type="monotone" dataKey="sessions" stroke="hsl(var(--primary))" name={t('admin.engagement.sessions')} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-white">{t('admin.engagement.feature_usage')}</CardTitle>
                  <MetricInfo
                    title={t('admin.engagement.feature_usage')}
                    description={t('admin.engagement.feature_usage_desc')}
                    interpretation={t('admin.engagement.feature_usage_interpretation')}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.featureUsage}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="feature_name" stroke="#fff" />
                    <YAxis stroke="#fff" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #6b7280', color: '#fff' }} />
                    <Bar dataKey="usage_count" fill="hsl(var(--primary))" name={t('admin.engagement.usage_count')} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-white">{t('admin.engagement.most_active_users')}</CardTitle>
                  <MetricInfo
                    title={t('admin.engagement.most_active_users')}
                    description={t('admin.engagement.most_active_users_desc')}
                    interpretation={t('admin.engagement.most_active_users_interpretation')}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.mostActiveUsers.map(user => (
                    <div key={user.user_id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 border border-purple-500/20 rounded bg-[#0a0a2e]/50">
                      <span className="font-medium text-white">{user.username}</span>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{user.session_count} {t('admin.engagement.session')}</p>
                        <p className="text-xs text-white/70">
                          {Math.round(user.total_duration / 60)}{t('admin.engagement.minutes_total')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="game" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-white text-base sm:text-lg">{t('admin.engagement.avg_games_per_user')}</CardTitle>
                    <MetricInfo
                      title={t('admin.engagement.avg_games_per_user')}
                      description={t('admin.engagement.avg_games_per_user_desc')}
                      interpretation={t('admin.engagement.avg_games_per_user_interpretation')}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl sm:text-4xl font-bold text-white">{analytics.gameEngagement.avgGamesPerUser}</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-white text-base sm:text-lg">{t('admin.engagement.avg_correct_answers')}</CardTitle>
                    <MetricInfo
                      title={t('admin.engagement.avg_correct_answers')}
                      description={t('admin.engagement.avg_correct_answers_desc')}
                      interpretation={t('admin.engagement.avg_correct_answers_interpretation')}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl sm:text-4xl font-bold text-white">{analytics.gameEngagement.avgCorrectAnswers}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-[#1a1a3e]/50 border border-purple-500/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-white">{t('admin.engagement.most_popular_topics')}</CardTitle>
                  <MetricInfo
                    title={t('admin.engagement.most_popular_topics')}
                    description={t('admin.engagement.most_popular_topics_desc')}
                    interpretation={t('admin.engagement.most_popular_topics_interpretation')}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.gameEngagement.mostPlayedCategories}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="category" stroke="#fff" />
                    <YAxis stroke="#fff" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #6b7280', color: '#fff' }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" name={t('admin.engagement.top_topic_score')} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default EngagementDashboard;
