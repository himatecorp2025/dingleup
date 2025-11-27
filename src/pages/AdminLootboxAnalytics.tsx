import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, TrendingUp, Users, Package, PieChart, Calendar } from 'lucide-react';
import { useI18n } from '@/i18n';

interface LootboxAnalytics {
  overview: {
    totalDrops: number;
    openedNow: number;
    stored: number;
    expired: number;
    activeDrop: number;
  };
  dropsBySource: Record<string, number>;
  tierDistribution: Record<string, number>;
  averageRewards: {
    gold: number;
    life: number;
  };
  dailyFrequency: Array<{ date: string; count: number }>;
  topUsers: Array<{
    userId: string;
    totalDrops: number;
    opened: number;
    stored: number;
    totalGold: number;
    totalLife: number;
  }>;
  decisionRate: {
    openNowPercentage: number;
    storePercentage: number;
  };
}

const AdminLootboxAnalytics = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [analytics, setAnalytics] = useState<LootboxAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchAnalytics();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/admin/login');
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('admin-lootbox-analytics', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Error fetching lootbox analytics:', error);
      } else {
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!analytics) {
    return (
      <AdminLayout>
        <div className="text-white text-center py-12">
          {t('admin.lootbox.no_data')}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('admin.lootbox.title')}</h1>
          <p className="text-white/60">{t('admin.lootbox.subtitle')}</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                {t('admin.lootbox.total_drops')}
              </CardTitle>
              <Gift className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{analytics.overview.totalDrops}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                {t('admin.lootbox.opened_now')}
              </CardTitle>
              <Package className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{analytics.overview.openedNow}</div>
              <p className="text-xs text-white/60 mt-1">
                {analytics.decisionRate.openNowPercentage}% {t('admin.lootbox.of_total')}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                {t('admin.lootbox.stored')}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{analytics.overview.stored}</div>
              <p className="text-xs text-white/60 mt-1">
                {analytics.decisionRate.storePercentage}% {t('admin.lootbox.of_total')}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                {t('admin.lootbox.expired')}
              </CardTitle>
              <Calendar className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{analytics.overview.expired}</div>
            </CardContent>
          </Card>
        </div>

        {/* Drop Sources & Tier Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Drop Sources */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <PieChart className="h-5 w-5 text-yellow-400" />
                {t('admin.lootbox.drop_sources')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analytics.dropsBySource).map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between">
                    <span className="text-white/80 capitalize">{source.replace(/_/g, ' ')}</span>
                    <span className="text-white font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tier Distribution */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-400" />
                {t('admin.lootbox.tier_distribution')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analytics.tierDistribution).map(([tier, count]) => (
                  <div key={tier} className="flex items-center justify-between">
                    <span className="text-white/80">
                      {t('admin.lootbox.tier')} {tier}
                    </span>
                    <span className="text-white font-bold">{count}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">{t('admin.lootbox.avg_rewards')}</span>
                  <span className="text-yellow-400 font-bold">
                    {analytics.averageRewards.gold} {t('common.gold')}, {analytics.averageRewards.life} {t('common.life')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Frequency Chart */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-400" />
              {t('admin.lootbox.daily_frequency')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {analytics.dailyFrequency.slice(-14).map((day) => (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="text-white/60 text-sm w-28">{day.date}</span>
                  <div className="flex-1 bg-white/10 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-blue-600 h-full rounded-full"
                      style={{
                        width: `${Math.min((day.count / Math.max(...analytics.dailyFrequency.map(d => d.count))) * 100, 100)}%`
                      }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                      {day.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Users */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-green-400" />
              {t('admin.lootbox.top_users')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 text-white/70">{t('admin.lootbox.user_id')}</th>
                    <th className="text-right py-2 text-white/70">{t('admin.lootbox.total_drops')}</th>
                    <th className="text-right py-2 text-white/70">{t('admin.lootbox.opened')}</th>
                    <th className="text-right py-2 text-white/70">{t('admin.lootbox.stored')}</th>
                    <th className="text-right py-2 text-white/70">{t('admin.lootbox.total_gold')}</th>
                    <th className="text-right py-2 text-white/70">{t('admin.lootbox.total_life')}</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topUsers.map((user, index) => (
                    <tr key={user.userId} className="border-b border-white/5">
                      <td className="py-2 text-white/80 font-mono text-xs">
                        {user.userId.substring(0, 8)}...
                      </td>
                      <td className="text-right py-2 text-white font-bold">{user.totalDrops}</td>
                      <td className="text-right py-2 text-green-400">{user.opened}</td>
                      <td className="text-right py-2 text-purple-400">{user.stored}</td>
                      <td className="text-right py-2 text-yellow-400">{user.totalGold}</td>
                      <td className="text-right py-2 text-red-400">{user.totalLife}</td>
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
};

export default AdminLootboxAnalytics;
