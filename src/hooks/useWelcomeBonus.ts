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
      // TEMP: Force always show for admin testing - minden frissítésnél megjelenik
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
      const { data, error } = await supabase.rpc('claim_welcome_bonus');
      
      if (error) {
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
        
        return true;
      } else {
        toast.error(result.error || 'Hiba történt a bónusz felvételekor');
        return false;
      }
    } catch (error: any) {
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
