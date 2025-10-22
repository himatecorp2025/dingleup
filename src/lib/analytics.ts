// Analytics tracking utilities for Genius subscription and pricing

export type AnalyticsEvent = 
  | 'sub_view'               // Subscription promo modal opened
  | 'sub_start'              // User clicks subscribe button
  | 'sub_success'            // Subscription completed
  | 'sub_cancel'             // Subscription cancelled
  | 'price_render'           // Discounted price shown
  | 'daily_reward_double_shown' // Double reward shown in daily gift
  | 'tips_open'              // Tips & Tricks section opened
  | 'tips_play'              // Video playback started
  | 'tips_complete'          // Video playback completed
  | 'genius_crown_view';     // Genius crown badge viewed

interface AnalyticsData {
  userId?: string;
  isSubscriber?: boolean;
  route?: string;
  itemType?: string;
  basePrice?: number;
  discountedPrice?: number;
  discountPercent?: number;
  videoId?: string;
  videoTitle?: string;
  ts?: string;
}

/**
 * Track an analytics event
 */
export const trackEvent = (event: AnalyticsEvent, data?: AnalyticsData) => {
  const eventData = {
    event,
    timestamp: new Date().toISOString(),
    ...data,
  };

  // Log in development
  if (import.meta.env.DEV) {
    console.log('[Analytics]', eventData);
  }

  // Send to Google Analytics if available
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', event, eventData);
  }

  // Can also integrate with other analytics platforms here
  // Example: Mixpanel, Amplitude, etc.
};

/**
 * Track subscription modal view
 */
export const trackSubscriptionView = (userId: string, route: string) => {
  trackEvent('sub_view', { userId, route });
};

/**
 * Track subscription start (button click)
 */
export const trackSubscriptionStart = (userId: string) => {
  trackEvent('sub_start', { userId });
};

/**
 * Track successful subscription
 */
export const trackSubscriptionSuccess = (userId: string) => {
  trackEvent('sub_success', { userId });
};

/**
 * Track subscription cancellation
 */
export const trackSubscriptionCancel = (userId: string) => {
  trackEvent('sub_cancel', { userId });
};

/**
 * Track price render with discount
 */
export const trackPriceRender = (
  userId: string,
  itemType: string,
  basePrice: number,
  discountedPrice: number,
  discountPercent: number
) => {
  trackEvent('price_render', {
    userId,
    itemType,
    basePrice,
    discountedPrice,
    discountPercent,
  });
};

/**
 * Track daily reward double shown
 */
export const trackDailyRewardDouble = (userId: string, baseReward: number, doubleReward: number) => {
  trackEvent('daily_reward_double_shown', {
    userId,
    basePrice: baseReward,
    discountedPrice: doubleReward,
  });
};

/**
 * Track tips video interaction
 */
export const trackTipsOpen = (userId: string, isSubscriber: boolean) => {
  trackEvent('tips_open', { userId, isSubscriber });
};

export const trackTipsPlay = (userId: string, videoId: string, videoTitle: string) => {
  trackEvent('tips_play', { userId, videoId, videoTitle });
};

export const trackTipsComplete = (userId: string, videoId: string, videoTitle: string) => {
  trackEvent('tips_complete', { userId, videoId, videoTitle });
};

/**
 * Track Genius crown badge view
 */
export const trackGeniusCrownView = (userId: string, location: string) => {
  trackEvent('genius_crown_view', { userId, route: location });
};
