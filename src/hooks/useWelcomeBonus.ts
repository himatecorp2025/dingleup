import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useWelcomeBonus = (userId: string | undefined) => {
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
      // Check if user is on mobile/tablet
      const isMobileOrTablet = window.innerWidth <= 1024;
      if (!isMobileOrTablet) {
        console.log('[WelcomeBonus] Not mobile/tablet, skipping');
        setCanClaim(false);
        setLoading(false);
        return;
      }

      // SECURITY FIX: Check server-side instead of localStorage
      // Query the database directly instead of trusting client storage
      const { data: profile } = await supabase
        .from('profiles')
        .select('welcome_bonus_claimed')
        .eq('id', userId)
        .single();

      console.log('[WelcomeBonus] Profile check:', { 
        userId, 
        claimed: profile?.welcome_bonus_claimed,
        hasProfile: !!profile 
      });

      if (!profile || profile.welcome_bonus_claimed) {
        console.log('[WelcomeBonus] Already claimed or no profile');
        setCanClaim(false);
        setLoading(false);
        return;
      }

      // Check if user clicked "later" in this session (keep this for UX)
      const laterKey = `welcome_bonus_later_${userId}`;
      const clickedLater = sessionStorage.getItem(laterKey);
      if (clickedLater) {
        console.log('[WelcomeBonus] User clicked later in this session');
        setCanClaim(false);
        setLoading(false);
        return;
      }

      // User is eligible - show the dialog
      console.log('[WelcomeBonus] User eligible, showing dialog');
      setCanClaim(true);
      trackEvent('popup_impression', 'welcome');
    } catch (error) {
      console.error('[WelcomeBonus] Error checking welcome bonus:', error);
      if (import.meta.env.DEV) {
        console.error('Error checking welcome bonus:', error);
      }
      setCanClaim(false);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    checkWelcomeBonus();
  }, [checkWelcomeBonus]);

  const claimWelcomeBonus = async () => {
    if (!userId || claiming) return false;

    setClaiming(true);
    console.log('[WelcomeBonus] Claiming bonus for user:', userId);

    try {
      const { data, error } = await supabase.rpc('claim_welcome_bonus');
      
      console.log('[WelcomeBonus] RPC Response:', { data, error });
      
      if (error) {
        console.error('[WelcomeBonus] RPC Error:', error);
        const errorMsg = error.message || 'Hiba történt a bónusz felvételekor';
        toast.error(errorMsg);
        return false;
      }
      
      const result = data as { success: boolean; coins: number; lives: number; error?: string };
      if (result.success) {
        // Track claim BEFORE showing success message
        trackEvent('popup_cta_click', 'welcome', 'claim');
        
        setCanClaim(false);
        
        // Show success toast with actual amounts
        toast.success(`🎉 Üdvözlő bónusz felvéve! +${result.coins} aranyérme, +${result.lives} élet`);
        console.log('[WelcomeBonus] Claim successful:', result);
        
        return true;
      } else {
        console.error('[WelcomeBonus] Claim failed:', result.error);
        toast.error(result.error || 'Hiba történt a bónusz felvételekor');
        return false;
      }
    } catch (error: any) {
      console.error('[WelcomeBonus] Exception during claim:', error);
      const errorMsg = error?.message || 'Hiba történt a bónusz felvételekor';
      toast.error(errorMsg);
      return false;
    } finally {
      setClaiming(false);
    }
  };

  const handleLater = () => {
    if (!userId) return;
    
    // Save "later" choice in sessionStorage (only for this browser session)
    const laterKey = `welcome_bonus_later_${userId}`;
    sessionStorage.setItem(laterKey, 'true');
    setCanClaim(false);
    
    // Track later action
    trackEvent('popup_cta_click', 'welcome', 'later');
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
