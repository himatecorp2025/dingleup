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
  const [dismissedLootboxes, setDismissedLootboxes] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('dismissedLootboxes');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [countdownActive, setCountdownActive] = useState(false);

  // Hide overlay on admin pages and auth pages
  const isAdminPage = location.pathname.startsWith('/admin');
  const isAuthPage = location.pathname === '/auth/login' || location.pathname === '/auth/register' || location.pathname === '/auth/choice' || location.pathname === '/';

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

  // Handle drop animation
  useEffect(() => {
    if (activeLootbox && !loading && !isAdminPage && !isAuthPage && user) {
      // Check if this lootbox was already dismissed
      if (dismissedLootboxes.has(activeLootbox.id)) {
        return;
      }

      setIsAnimating(true);
      setIsVisible(true);
      setCountdownActive(false);
      
      // End animation after 1.5 seconds (medium speed), then start countdown
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setCountdownActive(true);
      }, 1500);

      return () => clearTimeout(timer);
    } else if (!activeLootbox || !user) {
      setIsVisible(false);
      setIsAnimating(false);
      setCountdownActive(false);
    }
  }, [activeLootbox, loading, isAdminPage, isAuthPage, user, dismissedLootboxes]);

  // Handle countdown - only start when animation is complete
  useEffect(() => {
    if (!activeLootbox?.expires_at || !countdownActive) {
      setRemainingSeconds(null);
      return;
    }

    const calculateRemaining = () => {
      const now = new Date().getTime();
      const expires = new Date(activeLootbox.expires_at!).getTime();
      const diffMs = expires - now;
      return Math.max(0, Math.floor(diffMs / 1000));
    };

    setRemainingSeconds(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setRemainingSeconds(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        setIsVisible(false);
        refetch();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeLootbox, refetch, countdownActive]);

  const handleSuccess = (decision: 'open_now' | 'store') => {
    setShowDialog(false);
    setIsVisible(false);
    
    // Mark this lootbox as dismissed and persist to localStorage
    if (activeLootbox) {
      setDismissedLootboxes(prev => {
        const updated = new Set(prev).add(activeLootbox.id);
        try {
          localStorage.setItem('dismissedLootboxes', JSON.stringify(Array.from(updated)));
        } catch (err) {
          console.error('[LootboxDropOverlay] Failed to save dismissed lootboxes:', err);
        }
        return updated;
      });
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
      {/* Global Fixed Overlay - Right Side, Drop from top */}
      <div
        className="fixed z-50 cursor-pointer right-4"
        onClick={() => setShowDialog(true)}
        style={{
          top: '50%',
          transform: `translateY(${isAnimating ? '-150%' : '-50%'})`,
          transition: 'transform 1.5s ease-out',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Lootbox Icon - 50% smaller */}
        <div className="relative">
          <GoldLootboxIcon className="w-16 h-auto md:w-20" />
          
          {/* 60s Countdown Badge - only show when countdown is active */}
          {countdownActive && remainingSeconds !== null && remainingSeconds > 0 && (
            <div
              className="absolute top-2 right-2 px-3 py-1 rounded-full bg-black/80 text-white text-sm font-semibold"
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
