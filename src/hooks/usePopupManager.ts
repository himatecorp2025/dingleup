import { useState, useEffect } from 'react';

export type PopupType = 'welcome' | 'daily' | 'promo' | null;

interface PopupQueue {
  welcome: boolean;
  daily: boolean;
  promo: boolean;
}

export const usePopupManager = (
  canShowWelcome: boolean,
  canShowDaily: boolean,
  canShowPromo: boolean
) => {
  const [activePopup, setActivePopup] = useState<PopupType>(null);
  const [queue, setQueue] = useState<PopupQueue>({
    welcome: false,
    daily: false,
    promo: false
  });

  useEffect(() => {
    // Update queue based on what can be shown
    setQueue({
      welcome: canShowWelcome,
      daily: canShowDaily,
      promo: canShowPromo
    });
  }, [canShowWelcome, canShowDaily, canShowPromo]);

  useEffect(() => {
    // If nothing is currently showing, show the highest priority popup
    if (activePopup === null) {
      if (queue.welcome) {
        setActivePopup('welcome');
      } else if (queue.promo) {
        setActivePopup('promo');
      } else if (queue.daily) {
        setActivePopup('daily');
      }
    }
  }, [activePopup, queue]);

  const closePopup = (type: PopupType) => {
    if (activePopup === type) {
      setActivePopup(null);
      
      // Remove from queue
      setQueue(prev => ({
        ...prev,
        [type as string]: false
      }));

      // Track analytics
      trackPopupEvent('popup_close', type);
    }
  };

  const handleCTA = (type: PopupType, action: string) => {
    // Track analytics
    trackPopupEvent('popup_cta_click', type, action);
    
    // Close the popup
    closePopup(type);
  };

  return {
    activePopup,
    closePopup,
    handleCTA,
    showWelcome: activePopup === 'welcome',
    showDaily: activePopup === 'daily',
    showPromo: activePopup === 'promo'
  };
};

// Analytics tracking helper
const trackPopupEvent = (event: string, type: PopupType, action?: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', event, {
      type,
      action,
      timestamp: new Date().toISOString()
    });
  }
  
  // Console log for development
  if (import.meta.env.DEV) {
    console.log(`[Analytics] ${event}`, { type, action });
  }
};
