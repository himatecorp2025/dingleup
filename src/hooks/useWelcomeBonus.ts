import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useWelcomeBonus = (userId: string | undefined) => {
  const [canClaim, setCanClaim] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    checkWelcomeBonus();
  }, [userId]);

  const checkWelcomeBonus = async () => {
    if (!userId) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('welcome_bonus_claimed')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setCanClaim(!profile.welcome_bonus_claimed);
    } catch (error) {
      console.error('Error checking welcome bonus:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimWelcomeBonus = async () => {
    if (!userId || claiming) return;

    setClaiming(true);

    try {
      // Get current profile
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('coins, lives, welcome_bonus_claimed')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      if (profile.welcome_bonus_claimed) {
        toast.error('Már felvetted a welcome bónuszt!');
        setCanClaim(false);
        return false;
      }

      // Update profile with bonus
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          coins: profile.coins + 2500,
          lives: profile.lives + 50,
          welcome_bonus_claimed: true
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Add DingleSpeed booster
      const { error: boosterError } = await supabase
        .from('user_boosters')
        .insert({
          user_id: userId,
          booster_type: 'DingleSpeed'
        });

      if (boosterError) throw boosterError;

      toast.success('🎉 Welcome bónusz felvéve! +2500 arany, +50 élet és +1 DingleSpeed booster!');
      setCanClaim(false);
      return true;
    } catch (error) {
      console.error('Error claiming welcome bonus:', error);
      toast.error('Hiba történt a bónusz felvételekor');
      return false;
    } finally {
      setClaiming(false);
    }
  };

  return {
    canClaim,
    claiming,
    loading,
    claimWelcomeBonus
  };
};
