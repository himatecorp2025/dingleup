import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useActiveLootbox } from '@/hooks/useActiveLootbox';
import { GoldLootboxIcon } from './GoldLootboxIcon';
import { LootboxDecisionDialog } from './LootboxDecisionDialog';
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export const LootboxDropOverlay = () => {
  const location = useLocation();
  const { activeLootbox, loading, refetch } = useActiveLootbox(undefined);
  const { walletData } = useWallet(undefined);
  
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [storedCount, setStoredCount] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [dismissedLootboxes, setDismissedLootboxes] = useState<Set<string>>(new Set());
  const [countdownActive, setCountdownActive] = useState(false);
  const [showIntroBanner, setShowIntroBanner] = useState(false);
  const [introCountdown, setIntroCountdown] = useState(3);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Hide overlay on admin pages and auth pages
  const isAdminPage = location.pathname.startsWith('/admin');
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/auth-choice';

  // Check user authentication
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch stored lootbox count
  useEffect(() => {
    const fetchStoredCount = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data } = await supabase.functions.invoke('lootbox-stored', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });

        if (data?.count !== undefined) {
          setStoredCount(data.count);
        }
      } catch (err) {
        console.error('[LootboxDropOverlay] Failed to fetch stored count:', err);
      }
    };

    if (activeLootbox && user) {
      fetchStoredCount();
    }
  }, [activeLootbox, user]);

  // Handle drop lifecycle: intro banner + drop animation
  useEffect(() => {
    if (activeLootbox && !loading && !isAdminPage && !isAuthPage && user) {
      // Check if this lootbox was already dismissed
      if (dismissedLootboxes.has(activeLootbox.id)) {
        return;
      }

      // Reset state for new drop
      setShowIntroBanner(true);
      setIntroCountdown(3);
      setIsVisible(false);
      setIsAnimating(false);
      setCountdownActive(false);
      setIsFadingOut(false);
      setRemainingSeconds(null);
    } else {
      setShowIntroBanner(false);
      setIsVisible(false);
      setIsAnimating(false);
      setCountdownActive(false);
      setIsFadingOut(false);
      setRemainingSeconds(null);
    }
  }, [activeLootbox, loading, isAdminPage, isAuthPage, user, dismissedLootboxes]);
  
  // Intro banner 3-2-1 countdown
  useEffect(() => {
    if (!showIntroBanner) return;

    const interval = window.setInterval(() => {
      setIntroCountdown(prev => {
        if (prev <= 1) {
          window.clearInterval(interval);
          setShowIntroBanner(false);

          // Start box drop + main countdown
          setIsVisible(true);
          setIsAnimating(true);
          setCountdownActive(true);

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [showIntroBanner]);

  // End drop animation after 2.25s
  useEffect(() => {
    if (!isAnimating) return;

    const timer = window.setTimeout(() => {
      setIsAnimating(false);
    }, 2250);

    return () => window.clearTimeout(timer);
  }, [isAnimating]);

  // Handle countdown - only start when animation intro is complete and box is visible
  useEffect(() => {
    if (!activeLootbox || !countdownActive) {
      setRemainingSeconds(null);
      return;
    }

    let interval: number | undefined;
    let timeout: number | undefined;

    // If expires_at is set, use it; otherwise count down from 60 seconds locally
    if (activeLootbox.expires_at) {
      const calculateRemaining = () => {
        const now = new Date().getTime();
        const expires = new Date(activeLootbox.expires_at!).getTime();
        const diffMs = expires - now;
        return Math.max(0, Math.floor(diffMs / 1000));
      };

      setRemainingSeconds(calculateRemaining());

      interval = window.setInterval(() => {
        const remaining = calculateRemaining();
        setRemainingSeconds(remaining);
        
        if (remaining <= 0) {
          if (interval) window.clearInterval(interval);
          setCountdownActive(false);
          setIsFadingOut(true);

          timeout = window.setTimeout(() => {
            setIsVisible(false);
            setIsFadingOut(false);
            refetch();
          }, 400);
        }
      }, 1000);
    } else {
      // No expires_at - count down from 60 seconds locally (after animation)
      setRemainingSeconds(60);

      interval = window.setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev === null || prev <= 1) {
            if (interval) window.clearInterval(interval);
            setCountdownActive(false);
            setIsFadingOut(true);

            timeout = window.setTimeout(() => {
              setIsVisible(false);
              setIsFadingOut(false);
              refetch();
            }, 400);

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) window.clearInterval(interval);
      if (timeout) window.clearTimeout(timeout);
    };
  }, [activeLootbox, refetch, countdownActive]);

  const handleSuccess = (decision: 'open_now' | 'store') => {
    setShowDialog(false);
    setIsVisible(false);
    
    // Mark this lootbox as dismissed
    if (activeLootbox) {
      setDismissedLootboxes(prev => new Set(prev).add(activeLootbox.id));
    }
    
    refetch();
    
    if (decision === 'store') {
      setStoredCount(prev => prev + 1);
    }
  };

  // Don't render on admin/auth pages, if no user, or if no active lootbox
  if (isAdminPage || isAuthPage || !user || !isVisible || !activeLootbox) {
    return null;
  }

  return (
    <>
      {/* Intro Banner - appears before lootbox drop */}
      {showIntroBanner && (
        <div className="fixed z-40 right-4 top-4 px-4 py-2 rounded-full bg-primary text-primary-foreground shadow-lg hover-scale">
          <div className="text-xs font-semibold whitespace-nowrap">
            Ajándékod érkezett, fogadd el, mielőtt elvész!
          </div>
          <div className="mt-1 text-center text-xs font-bold">
            {introCountdown > 0 ? `${introCountdown}…` : ''}
          </div>
        </div>
      )}

      {/* Global Fixed Overlay - Right Side, Drop from top (below profile hexagon) */}
      <div
        className="fixed z-50 cursor-pointer right-4"
        onClick={() => setShowDialog(true)}
        style={{
          top: isAnimating ? '80px' : '50%',
          transform: isAnimating ? 'translateY(0)' : 'translateY(-50%)',
          transition: 'top 2.25s ease-out, transform 2.25s ease-out, opacity 0.4s ease-out',
          opacity: isFadingOut ? 0 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Lootbox Icon - 50% smaller */}
        <div className="relative">
          <GoldLootboxIcon className="w-16 h-auto md:w-20" />
          
          {/* 60s Countdown Badge - only show when countdown is active - positioned at bottom */}
          {countdownActive && remainingSeconds !== null && remainingSeconds > 0 && (
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full mt-2 px-3 py-1 rounded-full bg-black/80 text-white text-sm font-semibold"
              style={{
                boxShadow: '0 0 12px rgba(0,0,0,0.6)'
              }}
            >
              {remainingSeconds}s
            </div>
          )}
        </div>
      </div>

      {/* Decision Dialog */}
      {showDialog && (
        <LootboxDecisionDialog
          open={showDialog}
          onClose={() => setShowDialog(false)}
          lootboxId={activeLootbox.id}
          userGold={walletData?.coinsCurrent || 0}
          storedCount={storedCount}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
};
