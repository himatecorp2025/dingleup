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
      // Check if user is on mobile/tablet
      const isMobileOrTablet = window.innerWidth <= 1024;
      if (!isMobileOrTablet) {
        setCanClaim(false);
        setLoading(false);
        return;
      }

      // Check if user clicked "later" in this session
      const laterKey = `welcome_bonus_later_${userId}`;
      const clickedLater = localStorage.getItem(laterKey);
      if (clickedLater) {
        setCanClaim(false);
        setLoading(false);
        return;
      }

      // Try to claim to check eligibility (without actually claiming)
      // The claim_welcome_bonus RPC will return success: false if already claimed
      // We'll show the dialog optimistically and let the claim function handle validation
      setCanClaim(true);
      trackEvent('popup_impression', 'welcome');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error checking welcome bonus:', error);
      }
      setCanClaim(false);
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
    
    // Save "later" choice in localStorage for this session
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
