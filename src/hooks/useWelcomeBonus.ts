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
      if (import.meta.env.DEV) {
        console.error('Error checking welcome bonus:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const claimWelcomeBonus = async () => {
    if (!userId || claiming) return;

    setClaiming(true);

    try {
      const { data, error } = await supabase.rpc('claim_welcome_bonus');
      
      if (error) throw error;
      
      const result = data as { success: boolean; coins: number; error?: string };
      if (result.success) {
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
      } else {
        toast.error(result.error || 'Hiba történt a bónusz felvételekor');
        return false;
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error claiming welcome bonus:', error);
      }
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
