import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useWelcomeBonus = (userId: string | undefined) => {
  const [canClaim, setCanClaim] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLater, setShowLater] = useState(false);

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
      // Check localStorage first
      const laterKey = `welcome_bonus_later_${userId}`;
      const showLaterStorage = localStorage.getItem(laterKey);
      
      if (showLaterStorage === 'true') {
        setShowLater(true);
        // Don't show again if user clicked "Később"
        setCanClaim(false);
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('welcome_bonus_claimed')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const claimed = profile.welcome_bonus_claimed;
      setCanClaim(!claimed);
      
      // Track impression if showing
      if (!claimed) {
        trackEvent('popup_impression', 'welcome');
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error checking welcome bonus:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const claimWelcomeBonus = async () => {
    if (!userId || claiming) return false;

    setClaiming(true);

    try {
      const { data, error } = await supabase.rpc('claim_welcome_bonus');
      
      if (error) throw error;
      
      const result = data as { success: boolean; coins: number; error?: string };
      if (result.success) {
        toast.success('🎉 Üdvözlő bónusz felvéve! +2500 arany és +50 élet!');
        setCanClaim(false);
        
        // Track claim
        trackEvent('popup_cta_click', 'welcome', 'claim');
        
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

  const handleLater = () => {
    if (!userId) return;
    
    const laterKey = `welcome_bonus_later_${userId}`;
    localStorage.setItem(laterKey, 'true');
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
