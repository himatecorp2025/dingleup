import { useEffect } from 'react';
import { useWalletStore } from '@/stores/walletStore';

/**
 * CENTRALIZED WALLET HOOK
 * Uses Zustand store for global wallet state management
 * All wallet data is synchronized across all components
 * Real-time updates with 0 seconds delay
 */
export const useWallet = (userId: string | undefined) => {
  const { 
    walletData, 
    loading, 
    serverDriftMs, 
    setUserId, 
    fetchWallet,
    reset 
  } = useWalletStore();

  // Initialize wallet when userId changes
  useEffect(() => {
    if (userId) {
      setUserId(userId);
    } else {
      reset();
    }

    return () => {
      // Cleanup on unmount only if userId becomes undefined
      if (!userId) {
        reset();
      }
    };
  }, [userId, setUserId, reset]);

  return {
    walletData,
    loading,
    serverDriftMs,
    refetchWallet: fetchWallet
  };
};
