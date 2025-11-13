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
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setProfile(data as UserProfile);
      } else {
        // Profile doesn't exist yet, retry after a short delay
        setTimeout(() => fetchProfile(), 1000);
        return;
      }
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('Error fetching profile:', error);
      }
      // Only show toast for real errors, not missing profiles
      if (error.code !== 'PGRST116') {
        toast({
          title: 'Hiba',
          description: 'Nem sikerült betölteni a profilt',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!userId) return;

    try {
      // Only allow updating safe fields (username, avatar_url) directly
      // All other fields use RPC functions
      const safeUpdates: Partial<UserProfile> = {};
      if ('username' in updates) safeUpdates.username = updates.username;
      if ('avatar_url' in updates) safeUpdates.avatar_url = updates.avatar_url;

      if (Object.keys(safeUpdates).length > 0) {
        const { data, error } = await supabase
          .from('profiles')
          .update(safeUpdates)
          .eq('id', userId)
          .select()
          .single();

        if (error) throw error;
        setProfile(data as UserProfile);
        return data;
      }
      
      // For other updates, just refetch the profile
      await fetchProfile();
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('Error updating profile:', error);
      }
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

    // Just call the regenerate_lives RPC function
    // It handles all the logic server-side
    try {
      await supabase.rpc('regenerate_lives');
      await fetchProfile(); // Refresh to get updated data
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error regenerating lives:', error);
      }
    }
  };

  const spendCoins = async (amount: number): Promise<boolean> => {
    if (!profile || profile.coins < amount) {
      // Nincs toast - a felhasználó látja a coin countert
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('spend_coins', { amount });
      
      if (error || !data) {
        return false;
      }
      
      setProfile({ ...profile, coins: profile.coins - amount });
      // Nincs toast - a felhasználó látja a coin countert
      return true;
    } catch {
      return false;
    }
  };

  const addCoins = async (amount: number) => {
    if (!profile) return;
    
    try {
      const { error } = await supabase.rpc('award_coins', { amount });
      
      if (error) {
        if (import.meta.env.DEV) {
          console.error('Error awarding coins:', error);
        }
        return;
      }
      
      setProfile({ ...profile, coins: profile.coins + amount });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error in addCoins:', error);
      }
    }
  };

  const spendLife = async (): Promise<boolean> => {
    if (!profile || profile.lives < 1) {
      // Nincs toast - a game UI kezeli a hibaüzenetet
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('use_life');
      
      if (error || !data) {
        return false;
      }
      
      setProfile({ ...profile, lives: profile.lives - 1 });
      // Nincs toast - azonnali UI frissítés van
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    fetchProfile();

    // Subscribe to profile changes with optimistic updates
    const channel = supabase
      .channel(`profile_optimized_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        (payload: any) => {
          // Optimistic update
          if (payload.new && typeof payload.new === 'object') {
            setProfile(prev => prev ? { ...prev, ...(payload.new as Partial<UserProfile>) } : null);
          }
          // Full refetch as backup
          fetchProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Life regeneration is now handled by get-wallet edge function + realtime updates
  // No need for client-side regenerate_lives calls

  return {
    profile,
    loading,
    fetchProfile,
    updateProfile,
    regenerateLives,
    spendCoins,
    addCoins,
    spendLife,
    refreshProfile: fetchProfile
  };
};