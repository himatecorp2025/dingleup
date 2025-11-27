import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useI18n } from '@/i18n';

export const useWelcomeBonus = (userId: string | undefined) => {
  const { t } = useI18n();
  const [canClaim, setCanClaim] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLater, setShowLater] = useState(false);

  const checkWelcomeBonus = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // TESTING MODE: Check if this is DingleUP admin user
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('welcome_bonus_claimed, username')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // TESTING MODE: Always show for DingleUP admin user (design testing)
      if (profile?.username === 'DingleUP' || profile?.username === 'DingelUP!') {
        setCanClaim(true);
        trackEvent('popup_impression', 'welcome');
        setLoading(false);
        return;
      }

      // Normal logic for other users
      if (profile?.welcome_bonus_claimed) {
        setCanClaim(false);
        setLoading(false);
        return;
      }

      setCanClaim(true);
      trackEvent('popup_impression', 'welcome');
      setLoading(false);
    } catch (error) {
      setCanClaim(false);
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    checkWelcomeBonus();
  }, [checkWelcomeBonus]);

  const claimWelcomeBonus = async () => {
    if (!userId || claiming) return false;

    setClaiming(true);

    try {
      // TESTING MODE: Check if this is DingleUP admin user
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();

      // TESTING MODE: Don't actually claim for DingleUP admin (allow re-testing)
      if (profile?.username === 'DingleUP' || profile?.username === 'DingelUP!') {
        trackEvent('popup_cta_click', 'welcome', 'claim');
        setCanClaim(false);
        toast.success(`${t('welcome.claimed_success_emoji')} +2500 ${t('welcome.gold')}, +50 ${t('welcome.life')} (TESZT MÓD)`);
        return true;
      }

      // Normal claim logic for other users
      const { data, error } = await supabase.rpc('claim_welcome_bonus');
      
      if (error) {
        const errorMsg = error.message || t('welcome.claim_error');
        toast.error(errorMsg);
        return false;
      }
      
      const result = data as { success: boolean; coins: number; lives: number; error?: string };
      if (result.success) {
        // Track claim BEFORE showing success message
        trackEvent('popup_cta_click', 'welcome', 'claim');
        
        setCanClaim(false);
        
        // Show success toast with actual amounts
        toast.success(`${t('welcome.claimed_success_emoji')} +${result.coins} ${t('welcome.gold')}, +${result.lives} ${t('welcome.life')}`);
        
        return true;
      } else {
        toast.error(result.error || t('welcome.claim_error'));
        return false;
      }
    } catch (error: any) {
      const errorMsg = error?.message || t('welcome.claim_error');
      toast.error(errorMsg);
      return false;
    } finally {
      setClaiming(false);
    }
  };

  const handleLater = async () => {
    if (!userId) return;
    
    try {
      // TESTING MODE: Check if this is DingleUP admin user
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();

      // TESTING MODE: Don't mark as claimed for DingleUP admin (allow re-testing)
      if (profile?.username === 'DingleUP' || profile?.username === 'DingelUP!') {
        setCanClaim(false);
        trackEvent('popup_cta_click', 'welcome', 'dismissed');
        return;
      }

      // Normal logic: mark as claimed for other users
      await supabase
        .from('profiles')
        .update({ welcome_bonus_claimed: true })
        .eq('id', userId);
      
      setCanClaim(false);
      
      // Track later action (user dismissed without claiming)
      trackEvent('popup_cta_click', 'welcome', 'dismissed');
    } catch (error) {
      console.error('Error marking welcome bonus as dismissed:', error);
      // Even if error, close the popup locally
      setCanClaim(false);
    }
  };

  return {
    canClaim,
    claiming,
    loading,
    claimWelcomeBonus,
    handleLater
  };
};

// Analytics helper
const trackEvent = (event: string, type: string, action?: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', event, {
      type,
      action,
      timestamp: new Date().toISOString()
    });
  }
  
  if (import.meta.env.DEV) {
    console.log(`[Analytics] ${event}`, { type, action });
  }
};
