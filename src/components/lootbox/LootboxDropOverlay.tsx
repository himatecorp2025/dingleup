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

  // Handle drop animation
  useEffect(() => {
    if (activeLootbox && !loading && !isAdminPage && !isAuthPage && user) {
      setIsAnimating(true);
      setIsVisible(true);
      
      // End animation after 1 second
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (!activeLootbox || !user) {
      setIsVisible(false);
      setIsAnimating(false);
    }
  }, [activeLootbox, loading, isAdminPage, isAuthPage, user]);

  // Handle countdown
  useEffect(() => {
    if (!activeLootbox?.expires_at) {
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
  }, [activeLootbox, refetch]);

  const handleSuccess = (decision: 'open_now' | 'store') => {
    setShowDialog(false);
    setIsVisible(false);
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
      {/* Global Fixed Overlay - Centered */}
      <div
        className={`fixed z-50 cursor-pointer transition-all duration-1000 ${
          isAnimating 
            ? 'scale-0 opacity-0' 
            : 'scale-100 opacity-100'
        }`}
        onClick={() => setShowDialog(true)}
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          height: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Lootbox Icon */}
        <div className="relative">
          <GoldLootboxIcon className="w-32 h-auto md:w-40" />
          
          {/* 60s Countdown Badge */}
          {remainingSeconds !== null && remainingSeconds > 0 && (
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
