import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/game';
import { toast } from '@/hooks/use-toast';

export const useGameProfile = (userId: string | undefined) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data as UserProfile);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Hiba',
        description: 'Nem sikerült betölteni a profilt',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      setProfile(data as UserProfile);
      return data;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Hiba',
        description: 'Nem sikerült frissíteni a profilt',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const regenerateLives = async () => {
    if (!profile) return;

    const now = new Date();
    const lastRegen = new Date(profile.last_life_regeneration);
    const minutesPassed = Math.floor((now.getTime() - lastRegen.getTime()) / 60000);
    
    // Check if booster expired
    if (profile.speed_booster_active && profile.speed_booster_expires_at) {
      const expiresAt = new Date(profile.speed_booster_expires_at);
      if (now > expiresAt) {
        await updateProfile({
          speed_booster_active: false,
          speed_booster_expires_at: null,
          speed_booster_multiplier: 1
        });
      }
    }

    const regenRate = profile.speed_booster_active 
      ? Math.floor(profile.lives_regeneration_rate / profile.speed_booster_multiplier)
      : profile.lives_regeneration_rate;

    const livesToAdd = Math.floor(minutesPassed / regenRate);

    if (livesToAdd > 0 && profile.lives < profile.max_lives) {
      const newLives = Math.min(profile.lives + livesToAdd, profile.max_lives);
      const newLastRegen = new Date(lastRegen.getTime() + (livesToAdd * regenRate * 60000));
      
      await updateProfile({
        lives: newLives,
        last_life_regeneration: newLastRegen.toISOString()
      });
    }
  };

  const spendCoins = async (amount: number): Promise<boolean> => {
    if (!profile || profile.coins < amount) {
      toast({
        title: 'Nincs elég aranyérme',
        description: `${amount} aranyérme szükséges`,
        variant: 'destructive'
      });
      return false;
    }

    try {
      await updateProfile({ coins: profile.coins - amount });
      toast({ title: 'Levonás', description: `-${amount} aranyérme levonva` });
      return true;
    } catch {
      return false;
    }
  };

  const addCoins = async (amount: number) => {
    if (!profile) return;
    await updateProfile({ coins: profile.coins + amount });
  };

  const spendLife = async (): Promise<boolean> => {
    if (!profile || profile.lives < 1) {
      toast({
        title: 'Nincs elég élet',
        description: 'Vásárolj vagy várj az újratöltődésre',
        variant: 'destructive'
      });
      return false;
    }

    try {
      await updateProfile({ lives: profile.lives - 1 });
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  useEffect(() => {
    if (profile) {
      const interval = setInterval(regenerateLives, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [profile]);

  return {
    profile,
    loading,
    fetchProfile,
    updateProfile,
    regenerateLives,
    spendCoins,
    addCoins,
    spendLife
  };
};