import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useActiveLootbox } from '@/hooks/useActiveLootbox';
import { GoldLootboxIcon } from './GoldLootboxIcon';
import { LootboxDecisionDialog } from './LootboxDecisionDialog';
import { LootboxIncomingNotification } from './LootboxIncomingNotification';
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
  const [showNotification, setShowNotification] = useState(false);
  const [startDrop, setStartDrop] = useState(false);

  // Hide overlay on admin pages, auth pages, and landing page
  const isAdminPage = location.pathname.startsWith('/admin');
  const isAuthPage = location.pathname.startsWith('/auth') || location.pathname === '/login' || location.pathname === '/register';
  const isLandingPage = location.pathname === '/';

  // DEBUG: Log render state
  console.log('[🎁 LOOTBOX DEBUG] Component render:', {
    path: location.pathname,
    isAdminPage,
    isAuthPage, 
    isLandingPage,
    hasUser: !!user,
    userId: user?.id,
    hasActiveLootbox: !!activeLootbox,
    lootboxId: activeLootbox?.id,
    showNotification,
    isVisible,
    isAnimating,
    showDialog,
    viewport: `${window.innerWidth}x${window.innerHeight}`
  });

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

  // Handle notification and drop lifecycle
  useEffect(() => {
    console.log('[🎁 LOOTBOX DEBUG] Lifecycle useEffect triggered:', {
      hasActiveLootbox: !!activeLootbox,
      loading,
      isAdminPage,
      isAuthPage,
      isLandingPage,
      hasUser: !!user,
      showNotification,
      isVisible,
      isAnimating,
      isDismissed: activeLootbox ? dismissedLootboxes.has(activeLootbox.id) : false
    });

    if (!activeLootbox || loading || isAdminPage || isAuthPage || isLandingPage || !user) {
      console.log('[🎁 LOOTBOX DEBUG] Early return - conditions not met');
      return;
    }

    if (showNotification || isVisible || isAnimating) {
      console.log('[🎁 LOOTBOX DEBUG] Early return - already showing');
      return;
    }

    if (dismissedLootboxes.has(activeLootbox.id)) {
      console.log('[🎁 LOOTBOX DEBUG] Early return - dismissed');
      return;
    }

    // Show notification first (5 seconds before drop)
    console.log('[🎁 LOOTBOX DEBUG] ✅ Starting notification!');
    setShowNotification(true);
  }, [
    activeLootbox,
    loading,
    isAdminPage,
    isAuthPage,
    isLandingPage,
    user,
    dismissedLootboxes,
    showNotification,
    isVisible,
    isAnimating,
  ]);

  // Start drop after notification completes
  useEffect(() => {
    if (startDrop && !isVisible && !isAnimating) {
      setIsVisible(true);
      setIsAnimating(true);
      setStartDrop(false);
    }
  }, [startDrop, isVisible, isAnimating]);
  

  // End drop animation after 2.25s
  useEffect(() => {
    if (!isAnimating) return;

    const timer = window.setTimeout(() => {
      setIsAnimating(false);
    }, 2250);

    return () => window.clearTimeout(timer);
  }, [isAnimating]);

  const handleNotificationComplete = () => {
    setShowNotification(false);
    setStartDrop(true);
  };

  const handleExpired = () => {
    setIsVisible(false);

    if (activeLootbox) {
      setDismissedLootboxes(prev => new Set(prev).add(activeLootbox.id));
    }

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

  // Don't render on admin/auth/landing pages, if no user, or if no active lootbox
  if (isAdminPage || isAuthPage || isLandingPage || !user || !activeLootbox) {
    console.log('[🎁 LOOTBOX DEBUG] ❌ Returning null - will not render overlay');
    return null;
  }

  console.log('[🎁 LOOTBOX DEBUG] ✅ Rendering overlay!');

  return (
    <>
      {/* Incoming Notification - 5 seconds before drop */}
      {showNotification && (
        <LootboxIncomingNotification onComplete={handleNotificationComplete} />
      )}

      {/* Lootbox - drops to Speed Booster level */}
      {isVisible && (
        <div
          className="fixed z-50 cursor-pointer"
          onClick={() => setShowDialog(true)}
          style={{
            top: isAnimating ? '-100px' : 'clamp(160px, 22vh, 200px)', // Below 4 hexagons
            right: 'clamp(12px, 4vw, 24px)',
            transition: 'top 2.25s ease-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Lootbox Icon with countdown timer - 50% smaller */}
          <div className="relative">
            <GoldLootboxIcon className="w-8 h-auto md:w-10 drop-shadow-[0_0_12px_rgba(250,250,250,0.9)]" />

            {/* 3D Countdown Timer - same style as life timer */}
            {!isAnimating && (
              <LootboxCountdownTimer 
                key={activeLootbox.id}
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
