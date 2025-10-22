// Genius Subscription Pricing Utilities

interface UserProfile {
  is_subscriber?: boolean;
}

/**
 * Calculate USD price for a shop item (boosters, recharges)
 * Genius members get 25% discount
 */
export const calculateUsdPrice = (basePrice: number, user: UserProfile): number => {
  if (user.is_subscriber) {
    return Math.ceil((basePrice * 0.75) * 100) / 100; // Round to 2 decimals, ceiling
  }
  return basePrice;
};

/**
 * Calculate coin cost for speed boosters
 * Genius members get 50% discount
 */
export const calculateCoinCost = (baseCost: number, user: UserProfile): number => {
  if (user.is_subscriber) {
    return Math.floor(baseCost * 0.5);
  }
  return baseCost;
};

/**
 * Get life regeneration time in minutes
 * Genius members: 6 minutes
 * Regular users: 12 minutes
 */
export const getLifeRegenMinutes = (user: UserProfile): number => {
  return user.is_subscriber ? 6 : 12;
};

/**
 * Calculate daily reward amount
 * Genius members get double reward
 */
export const calculateDailyReward = (baseCoins: number, user: UserProfile): number => {
  return user.is_subscriber ? baseCoins * 2 : baseCoins;
};

/**
 * Format price display with old/new price for Genius members
 */
export const formatPriceDisplay = (basePrice: number, user: UserProfile): {
  displayPrice: number;
  hasDiscount: boolean;
  discountPercent: number;
} => {
  const hasDiscount = !!user.is_subscriber;
  const displayPrice = hasDiscount ? calculateUsdPrice(basePrice, user) : basePrice;
  const discountPercent = hasDiscount ? 25 : 0;

  return {
    displayPrice,
    hasDiscount,
    discountPercent
  };
};

/**
 * Format coin cost display with old/new price for Genius members
 */
export const formatCoinDisplay = (baseCost: number, user: UserProfile): {
  displayCost: number;
  hasDiscount: boolean;
  discountPercent: number;
} => {
  const hasDiscount = !!user.is_subscriber;
  const displayCost = hasDiscount ? calculateCoinCost(baseCost, user) : baseCost;
  const discountPercent = hasDiscount ? 50 : 0;

  return {
    displayCost,
    hasDiscount,
    discountPercent
  };
};