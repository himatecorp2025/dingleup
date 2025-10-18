import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserBooster } from '@/types/game';

export const useUserBoosters = (userId: string | undefined) => {
  const [boosters, setBoosters] = useState<UserBooster[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBoosters = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_boosters')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBoosters((data || []) as UserBooster[]);
    } catch (error) {
      console.error('Error fetching boosters:', error);
      toast.error('Hiba a boosterek betöltésekor');
    } finally {
      setLoading(false);
    }
  };

  const activateBooster = async (boosterId: string) => {
    if (!userId) return false;

    try {
      const booster = boosters.find(b => b.id === boosterId);
      if (!booster || booster.activated) {
        toast.error('Érvénytelen booster');
        return false;
      }

      const boosterConfig = {
        DoubleSpeed: { multiplier: 2, duration: 60, maxLives: 20 },
        MegaSpeed: { multiplier: 4, duration: 60, maxLives: 25 },
        GigaSpeed: { multiplier: 12, duration: 60, maxLives: 30 },
        DingleSpeed: { multiplier: 24, duration: 60, maxLives: 35 }
      }[booster.booster_type];

      const now = new Date();
      const expiresAt = new Date(now.getTime() + boosterConfig.duration * 60000);

      const { data: ok, error: rpcError } = await supabase.rpc('activate_speed_booster', { booster_id: boosterId });
      if (rpcError || !ok) throw rpcError || new Error('activate_speed_booster failed');
      toast.success(`${booster.booster_type} aktiválva! Max élet: ${boosterConfig.maxLives}, Regeneráció: ${12 / boosterConfig.multiplier} perc`);
      await fetchBoosters();
      return true;
    } catch (error) {
      console.error('Error activating booster:', error);
      toast.error('Hiba a booster aktiválásakor');
      return false;
    }
  };

  const purchaseBooster = async (boosterType: 'DoubleSpeed' | 'MegaSpeed' | 'GigaSpeed' | 'DingleSpeed') => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('user_boosters')
        .insert({
          user_id: userId,
          booster_type: boosterType
        });

      if (error) throw error;

      toast.success('Booster megvásárolva!');
      await fetchBoosters();
      return true;
    } catch (error) {
      console.error('Error purchasing booster:', error);
      toast.error('Hiba a booster vásárlásakor');
      return false;
    }
  };

  const getAvailableBoosters = () => {
    return boosters.filter(b => !b.activated);
  };

  const getBoosterCounts = () => {
    const counts = {
      DoubleSpeed: 0,
      MegaSpeed: 0,
      GigaSpeed: 0,
      DingleSpeed: 0
    };

    boosters.filter(b => !b.activated).forEach(b => {
      counts[b.booster_type]++;
    });

    return counts;
  };

  useEffect(() => {
    fetchBoosters();
  }, [userId]);

  return {
    boosters,
    loading,
    activateBooster,
    purchaseBooster,
    getAvailableBoosters,
    getBoosterCounts,
    refetchBoosters: fetchBoosters
  };
};
