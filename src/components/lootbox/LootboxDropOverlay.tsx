import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useActiveLootbox } from '@/hooks/useActiveLootbox';
import { GoldLootboxIcon } from './GoldLootboxIcon';
import { LootboxDecisionDialog } from './LootboxDecisionDialog';
import { LootboxNotificationBanner } from './LootboxNotificationBanner';
import { LootboxCountdownTimer } from './LootboxCountdownTimer';
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
  const [storedCount, setStoredCount] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [dismissedLootboxes, setDismissedLootboxes] = useState<Set<string>>(new Set());
  const [showIntroBanner, setShowIntroBanner] = useState(false);
  const [introCountdown, setIntroCountdown] = useState(3);
  const [lootboxExpiresAt, setLootboxExpiresAt] = useState<string | null>(null);

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

      // Reset for new drop
      setShowIntroBanner(true);
      setIntroCountdown(3);
      setIsVisible(false);
      setIsAnimating(false);
      
      // Set expiration time (60 seconds from now if not already set)
      const expiresAt = activeLootbox.expires_at || 
        new Date(Date.now() + 60000).toISOString();
      setLootboxExpiresAt(expiresAt);
    } else {
      setShowIntroBanner(false);
      setIsVisible(false);
      setIsAnimating(false);
      setLootboxExpiresAt(null);
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

          // Start box drop (countdown starts when it arrives)
          setIsVisible(true);
          setIsAnimating(true);

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

  const handleExpired = () => {
    setIsVisible(false);
    setLootboxExpiresAt(null);
    refetch();
  };

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
  if (isAdminPage || isAuthPage || !user || (!isVisible && !showIntroBanner) || !activeLootbox) {
    return null;
  }

  return (
    <>
      {/* Intro Banner - RED Play Now SVG with countdown */}
      {showIntroBanner && (
        <div
          className="fixed z-40 animate-fade-in"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + 80px)',
            right: 'clamp(12px, 4vw, 24px)',
          }}
        >
          <LootboxNotificationBanner countdown={introCountdown} />
        </div>
      )}

      {/* Lootbox - appears ONLY after banner disappears, drops to Speed Booster level */}
      {isVisible && (
        <div
          className="fixed z-50 cursor-pointer"
          onClick={() => setShowDialog(true)}
          style={{
            bottom: isAnimating ? '100vh' : 'calc(25vh + 80px)', // Speed Booster button level
            right: 'clamp(12px, 4vw, 24px)',
            transition: 'bottom 2.25s ease-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Lootbox Icon with countdown timer */}
          <div className="relative">
            <GoldLootboxIcon className="w-16 h-auto md:w-20 drop-shadow-[0_0_12px_rgba(250,250,250,0.9)]" />

            {/* 3D Countdown Timer - same style as life timer */}
            {!isAnimating && lootboxExpiresAt && (
              <LootboxCountdownTimer 
                expiresAt={lootboxExpiresAt}
                onExpired={handleExpired}
              />
            )}
          </div>
        </div>
      )}

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
