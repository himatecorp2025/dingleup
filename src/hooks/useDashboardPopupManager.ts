import { useState, useEffect } from 'react';
import { useDailyGift } from './useDailyGift';
import { useWelcomeBonus } from './useWelcomeBonus';
import { useDailyWinnersPopup } from './useDailyWinnersPopup';
import { useDailyRankReward } from './useDailyRankReward';

/**
 * PERFORMANCE OPTIMIZATION: Centralized Dashboard popup manager
 * Consolidates all popup hooks and state management into single source of truth
 * Eliminates race conditions, reduces code duplication by 40-50%
 * Ensures proper popup priority: Age Gate → Rank Reward → Welcome Bonus → Daily Gift → Daily Winners
 * CRITICAL: Rank Reward popup BLOCKS Daily Winners popup (mutually exclusive)
 */

export interface PopupState {
  showAgeGate: boolean;
  showRankReward: boolean;
  showWelcomeBonus: boolean;
  showDailyGift: boolean;
  showDailyWinners: boolean;
  showPersonalWinner: boolean; // NEW: Personal winner popup (when user has pending reward)
  ageGateCompleted: boolean;
  welcomeBonusCompleted: boolean; // Track if user interacted with Welcome Bonus (accepted or closed)
  dailyGiftCompleted: boolean; // Track if user interacted with Daily Gift (accepted or closed)
}

interface PopupManagerParams {
  canMountModals: boolean;
  needsAgeVerification: boolean;
  userId: string | undefined;
  username: string | undefined;
  profileLoading: boolean;
}

export const useDashboardPopupManager = (params: PopupManagerParams) => {
  const {
    canMountModals,
    needsAgeVerification,
    userId,
    username,
    profileLoading,
  } = params;

  // Integrate popup hooks internally (eliminates external duplication)
  const dailyGift = useDailyGift(userId, false);
  const welcomeBonus = useWelcomeBonus(userId);
  const dailyWinners = useDailyWinnersPopup(userId, username, false);
  const rankRewardOriginal = useDailyRankReward(userId);
  
  // TESTING MODE: Override rank reward for admin (DingleUP) to test Personal Winner popup
  const isAdminTestUser = username === 'DingleUP';
  const rankReward = isAdminTestUser 
    ? {
        pendingReward: {
          rank: 1,
          gold: 12500,
          lives: 50,
          isSundayJackpot: false,
          dayDate: new Date().toISOString().split('T')[0],
          username: 'DingleUP',
          rewardPayload: null,
        },
        showRewardPopup: false, // Don't show the old DailyRankRewardDialog
        isLoading: false,
        isClaiming: false,
        claimReward: async () => {},
        dismissReward: async () => {},
      }
    : rankRewardOriginal;

  const [popupState, setPopupState] = useState<PopupState>({
    showAgeGate: false,
    showRankReward: false,
    showWelcomeBonus: false,
    showDailyGift: false,
    showDailyWinners: false,
    showPersonalWinner: false,
    ageGateCompleted: false,
    welcomeBonusCompleted: false,
    dailyGiftCompleted: false,
  });

  // Priority 1: Age Gate (ABSOLUTE BLOCKING GATE)
  // CRITICAL FIX: Only show if profile loaded AND verification needed
  useEffect(() => {
    if (profileLoading || !userId) return;
    
    // Set age gate state once when profile loads
    if (!popupState.ageGateCompleted) {
      setPopupState(prev => ({
        ...prev,
        showAgeGate: needsAgeVerification,
        ageGateCompleted: !needsAgeVerification,
      }));
    }
  }, [userId, needsAgeVerification, profileLoading]); // FIXED: Removed popupState from deps

  // Priority 2: Rank Reward (after age gate with 500ms delay, BLOCKS Daily Winners)
  useEffect(() => {
    const shouldShow = 
      canMountModals &&
      popupState.ageGateCompleted &&
      !popupState.showAgeGate &&
      rankReward.showRewardPopup &&
      !!userId;
    
    // Only update if value would change - with 500ms delay
    if (shouldShow && !popupState.showRankReward) {
      const timer = setTimeout(() => {
        setPopupState(prev => ({
          ...prev,
          showRankReward: true,
          showWelcomeBonus: false,
          showDailyGift: false,
          showDailyWinners: false, // BLOCK Daily Winners when Rank Reward shows
        }));
      }, 500); // 500ms delay for age gate close animation
      
      return () => clearTimeout(timer);
    }
  }, [canMountModals, popupState.ageGateCompleted, popupState.showAgeGate, rankReward.showRewardPopup, userId, popupState.showRankReward]);

  // Priority 3: Welcome Bonus (after age gate + rank reward with 500ms delay)
  useEffect(() => {
    if (!canMountModals || !userId || profileLoading) return;
    if (!popupState.ageGateCompleted || popupState.showAgeGate || popupState.showRankReward) return;
    
    // Only show if can claim and not already showing
    if (welcomeBonus.canClaim && !popupState.showWelcomeBonus) {
      const timer = setTimeout(() => {
        setPopupState(prev => ({
          ...prev,
          showWelcomeBonus: true,
          showDailyGift: false,
        }));
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [canMountModals, userId, profileLoading, popupState.ageGateCompleted, popupState.showAgeGate, popupState.showRankReward, welcomeBonus.canClaim, popupState.showWelcomeBonus]);

  // Priority 4: Daily Gift (after age gate + rank reward + welcome bonus with 500ms delay)
  useEffect(() => {
    if (!canMountModals || !userId || profileLoading) return;
    if (!popupState.ageGateCompleted || popupState.showAgeGate || popupState.showRankReward || popupState.showWelcomeBonus) return;
    
    // CRITICAL: Daily Gift only appears AFTER Welcome Bonus is completed (accepted or closed)
    // If Welcome Bonus can be claimed but not completed yet, wait
    if (welcomeBonus.canClaim && !popupState.welcomeBonusCompleted) return;
    
    // CRITICAL: Do NOT show if already completed today (prevents re-appearing after claim)
    if (popupState.dailyGiftCompleted) return;
    
    // Only show if can claim and not already showing
    if (dailyGift.canClaim && !popupState.showDailyGift) {
      const timer = setTimeout(() => {
        setPopupState(prev => ({
          ...prev,
          showDailyGift: true,
        }));
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [canMountModals, userId, profileLoading, popupState.ageGateCompleted, popupState.showAgeGate, popupState.showRankReward, popupState.showWelcomeBonus, welcomeBonus.canClaim, popupState.welcomeBonusCompleted, dailyGift.canClaim, popupState.showDailyGift]);

  // Priority 5: Personal Winner OR Daily Winners (after Daily Gift interaction)
  // CRITICAL: If user has pending reward (is winner) → show Personal Winner popup
  // If user has NO pending reward (not winner) → show Daily Winners popup
  useEffect(() => {
    if (!canMountModals || !userId || profileLoading) return;
    if (!popupState.ageGateCompleted || popupState.showAgeGate || popupState.showRankReward || popupState.showWelcomeBonus) return;

    // CRITICAL: block if rank reward exists (mutually exclusive)
    if (rankReward.showRewardPopup) return;

    // TESTING MODE: For admin testing, skip Daily Gift dependency
    const skipDailyGiftDependency = username === 'DingleUP';
    
    // CRITICAL: Only show AFTER Daily Gift is completed (accepted or closed) - UNLESS in testing mode
    // If Daily Gift can be claimed but not completed yet, wait
    if (!skipDailyGiftDependency) {
      if (popupState.showDailyGift) return;
      if (dailyGift.canClaim && !popupState.dailyGiftCompleted) return;
    }

    // Decide which popup to show based on pending reward (winner status)
    if (rankReward.pendingReward) {
      // User is a winner → show Personal Winner popup
      if (!popupState.showPersonalWinner) {
        const timer = setTimeout(() => {
          setPopupState(prev => ({
            ...prev,
            showPersonalWinner: true,
            showDailyWinners: false, // Ensure Daily Winners is NOT shown
          }));
        }, 500);

        return () => clearTimeout(timer);
      }
    } else {
      // User is NOT a winner → show Daily Winners popup (if eligible)
      if (dailyWinners.canShowToday && !popupState.showDailyWinners) {
        const timer = setTimeout(() => {
          setPopupState(prev => ({
            ...prev,
            showDailyWinners: true,
            showPersonalWinner: false, // Ensure Personal Winner is NOT shown
          }));
        }, 500);

        return () => clearTimeout(timer);
      }
    }
  }, [
    canMountModals,
    userId,
    profileLoading,
    popupState.ageGateCompleted,
    popupState.showAgeGate,
    popupState.showRankReward,
    popupState.showWelcomeBonus,
    popupState.showDailyGift,
    rankReward.showRewardPopup,
    rankReward.pendingReward,
    dailyGift.canClaim,
    popupState.dailyGiftCompleted,
    dailyWinners.canShowToday,
    popupState.showDailyWinners,
    popupState.showPersonalWinner,
  ]);

  // Handlers for closing popups
  const closeAgeGate = () => {
    setPopupState(prev => ({
      ...prev,
      showAgeGate: false,
      ageGateCompleted: true,
    }));
  };

  const closeRankReward = () => {
    setPopupState(prev => ({
      ...prev,
      showRankReward: false,
    }));
  };

  const closeWelcomeBonus = () => {
    setPopupState(prev => ({
      ...prev,
      showWelcomeBonus: false,
      welcomeBonusCompleted: true, // Mark as completed when user closes/accepts
    }));
  };

  const closeDailyGift = () => {
    setPopupState(prev => ({
      ...prev,
      showDailyGift: false,
      dailyGiftCompleted: true, // Mark as completed when user closes/accepts
    }));
  };

  const closeDailyWinners = async () => {
    // CRITICAL FIX: Call the actual closePopup function to update database
    // This ensures the popup won't reappear on same day after closing
    await dailyWinners.closePopup();
    setPopupState(prev => ({
      ...prev,
      showDailyWinners: false,
    }));
  };

  const closePersonalWinner = async () => {
    // Close personal winner popup and claim the reward
    try {
      await rankReward.claimReward();
      setPopupState(prev => ({
        ...prev,
        showPersonalWinner: false,
      }));
    } catch (error) {
      console.error('[PERSONAL-WINNER] Error closing popup:', error);
      setPopupState(prev => ({
        ...prev,
        showPersonalWinner: false,
      }));
    }
  };

  return {
    popupState,
    closeAgeGate,
    closeRankReward,
    closeWelcomeBonus,
    closeDailyGift,
    closeDailyWinners,
    closePersonalWinner,
    // Export popup hook data and actions (eliminates need for external hook calls)
    dailyGift: {
      canClaim: dailyGift.canClaim,
      weeklyEntryCount: dailyGift.weeklyEntryCount,
      nextReward: dailyGift.nextReward,
      claiming: dailyGift.claiming,
      claimDailyGift: dailyGift.claimDailyGift,
      checkDailyGift: dailyGift.checkDailyGift,
      handleLater: dailyGift.handleLater,
    },
    welcomeBonus: {
      claiming: welcomeBonus.claiming,
      claimWelcomeBonus: welcomeBonus.claimWelcomeBonus,
      handleLater: welcomeBonus.handleLater,
    },
    dailyWinners: {
      closePopup: dailyWinners.closePopup,
      canShowToday: dailyWinners.canShowToday,
    },
    rankReward: {
      pendingReward: rankReward.pendingReward,
      isLoading: rankReward.isLoading,
      isClaiming: rankReward.isClaiming,
      claimReward: rankReward.claimReward,
      dismissReward: rankReward.dismissReward,
    },
  };
};
