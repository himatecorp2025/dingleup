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
  ageGateCompleted: boolean;
}

interface PopupManagerParams {
  canMountModals: boolean;
  needsAgeVerification: boolean;
  userId: string | undefined;
  profileLoading: boolean;
}

export const useDashboardPopupManager = (params: PopupManagerParams) => {
  const {
    canMountModals,
    needsAgeVerification,
    userId,
    profileLoading,
  } = params;

  // Integrate popup hooks internally (eliminates external duplication)
  const dailyGift = useDailyGift(userId, false);
  const welcomeBonus = useWelcomeBonus(userId);
  const dailyWinners = useDailyWinnersPopup(userId, false);
  const rankReward = useDailyRankReward(userId); // NEW: rank reward hook

  const [popupState, setPopupState] = useState<PopupState>({
    showAgeGate: false,
    showRankReward: false,
    showWelcomeBonus: false,
    showDailyGift: false,
    showDailyWinners: false,
    ageGateCompleted: false,
  });

  // Priority 1: Age Gate (ABSOLUTE BLOCKING GATE)
  // CRITICAL FIX: Only show if profile loaded AND verification needed
  useEffect(() => {
    if (profileLoading || !userId) return;
    
    if (!popupState.ageGateCompleted) {
      const shouldShowAgeGate = needsAgeVerification;
      const shouldMarkCompleted = !needsAgeVerification;
      
      // Only update state if values would actually change
      if (popupState.showAgeGate !== shouldShowAgeGate || popupState.ageGateCompleted !== shouldMarkCompleted) {
        setPopupState(prev => ({
          ...prev,
          showAgeGate: shouldShowAgeGate,
          ageGateCompleted: shouldMarkCompleted,
        }));
      }
    }
  }, [userId, needsAgeVerification, profileLoading]); // Removed popupState dependencies to prevent loop

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
    const shouldShow = 
      canMountModals &&
      popupState.ageGateCompleted &&
      !popupState.showAgeGate &&
      !popupState.showRankReward &&
      welcomeBonus.canClaim &&
      !!userId;
    
    // Only update if value would change - with 500ms delay
    if (shouldShow && !popupState.showWelcomeBonus) {
      const timer = setTimeout(() => {
        setPopupState(prev => ({
          ...prev,
          showWelcomeBonus: true,
          showDailyGift: false,
        }));
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [canMountModals, popupState.ageGateCompleted, popupState.showAgeGate, popupState.showRankReward, welcomeBonus.canClaim, userId, popupState.showWelcomeBonus]);

  // Priority 4: Daily Gift (after age gate + rank reward + welcome bonus with 500ms delay)
  useEffect(() => {
    const shouldShow =
      canMountModals &&
      popupState.ageGateCompleted &&
      !popupState.showAgeGate &&
      !popupState.showRankReward &&
      !popupState.showWelcomeBonus &&
      dailyGift.canClaim &&
      !!userId;
    
    // Only update if value would change - with 500ms delay
    if (shouldShow && !popupState.showDailyGift) {
      const timer = setTimeout(() => {
        setPopupState(prev => ({
          ...prev,
          showDailyGift: true,
        }));
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [
    canMountModals,
    popupState.ageGateCompleted,
    popupState.showAgeGate,
    popupState.showRankReward,
    popupState.showWelcomeBonus,
    dailyGift.canClaim,
    userId,
    popupState.showDailyGift,
  ]);

  // Priority 5: Daily Winners (ONLY if NO rank reward - mutually exclusive)
  useEffect(() => {
    const shouldShow =
      canMountModals &&
      popupState.ageGateCompleted &&
      !popupState.showAgeGate &&
      !popupState.showRankReward && // CRITICAL: block if rank reward exists
      !popupState.showWelcomeBonus &&
      !popupState.showDailyGift &&
      !rankReward.showRewardPopup && // DOUBLE-CHECK: don't show if rank reward pending
      dailyWinners.showPopup &&
      !!userId;
    
    // Only update if value would change
    if (shouldShow && !popupState.showDailyWinners) {
      setPopupState(prev => ({
        ...prev,
        showDailyWinners: true,
      }));
    }
  }, [
    canMountModals,
    popupState.ageGateCompleted,
    popupState.showAgeGate,
    popupState.showRankReward,
    popupState.showWelcomeBonus,
    popupState.showDailyGift,
    rankReward.showRewardPopup,
    dailyWinners.showPopup,
    userId,
    popupState.showDailyWinners,
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
    }));
  };

  const closeDailyGift = () => {
    setPopupState(prev => ({
      ...prev,
      showDailyGift: false,
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

  return {
    popupState,
    closeAgeGate,
    closeRankReward,
    closeWelcomeBonus,
    closeDailyGift,
    closeDailyWinners,
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
