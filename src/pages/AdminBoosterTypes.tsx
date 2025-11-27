import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Coins, Heart, Zap, DollarSign } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useI18n } from '@/i18n';

interface BoosterType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  price_gold: number | null;
  price_usd_cents: number | null;
  reward_gold: number;
  reward_lives: number;
  reward_speed_count: number;
  reward_speed_duration_min: number;
  created_at: string;
  updated_at: string;
}

export default function AdminBoosterTypes() {
  const { t } = useI18n();
  const [boosterTypes, setBoosterTypes] = useState<BoosterType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBoosterTypes();
  }, []);

  async function fetchBoosterTypes() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('booster_types')
        .select('*')
        .order('code', { ascending: true });

      if (error) throw error;

      setBoosterTypes(data || []);
    } catch (error) {
      console.error('Error fetching booster types:', error);
      toast.error(t('admin.error_loading_booster_types'));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">{t('admin.boosters.title')}</h1>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">{t('admin.boosters.title')}</h1>
          <span className="text-sm text-muted-foreground">
            {boosterTypes.length} {t('admin.boosters.types')}
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {boosterTypes.map((booster) => (
            <Card key={booster.id} className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">{booster.name}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    booster.is_active 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {booster.is_active ? t('admin.boosters.active') : t('admin.boosters.inactive')}
                  </span>
                </div>

                {booster.description && (
                  <p className="text-sm text-muted-foreground">{booster.description}</p>
                )}

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">{t('admin.boosters.price')}</h3>
                  <div className="flex gap-3">
                    {booster.price_gold && (
                      <div className="flex items-center gap-2 bg-yellow-500/10 px-3 py-2 rounded-lg border border-yellow-500/20">
                        <Coins className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400 font-bold">{booster.price_gold}</span>
                      </div>
                    )}
                    {booster.price_usd_cents && (
                      <div className="flex items-center gap-2 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 font-bold">${(booster.price_usd_cents / 100).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">{t('admin.boosters.rewards')}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {booster.reward_gold > 0 && (
                      <div className="flex items-center gap-2 bg-yellow-500/10 px-3 py-2 rounded-lg border border-yellow-500/20">
                        <Coins className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-yellow-400">+{booster.reward_gold}</span>
                      </div>
                    )}
                    {booster.reward_lives > 0 && (
                      <div className="flex items-center gap-2 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                        <Heart className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-red-400">+{booster.reward_lives}</span>
                      </div>
                    )}
                    {booster.reward_speed_count > 0 && (
                      <div className="col-span-2 flex items-center gap-2 bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20">
                        <Zap className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-blue-400">
                          {booster.reward_speed_count}× {booster.reward_speed_duration_min} {t('admin.boosters.minutes')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t('admin.boosters.code')}: {booster.code}</span>
                    <span>{t('admin.boosters.created')}: {new Date(booster.created_at).toLocaleDateString('hu-HU')}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
