/**
 * Lootbox Reward System
 * 
 * Fixed tier-based reward generation for lootboxes.
 * Each tier has a specific probability and fixed reward values.
 */

export type LootboxTier = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface LootboxReward {
  gold: number;
  life: number;
  tier: LootboxTier;
}

/**
 * Tier configuration with probabilities and rewards
 */
const TIER_CONFIG: Record<LootboxTier, { probability: number; gold: number; life: number }> = {
  A: { probability: 35, gold: 75, life: 4 },
  B: { probability: 30, gold: 120, life: 5 },
  C: { probability: 18, gold: 150, life: 6 },
  D: { probability: 10, gold: 225, life: 8 },
  E: { probability: 5, gold: 500, life: 15 },   // Nagy ritka win
  F: { probability: 2, gold: 1000, life: 25 },  // Mini Jackpot
};

/**
 * Cumulative probability ranges for each tier
 * A: 0-35
 * B: 35-65
 * C: 65-83
 * D: 83-93
 * E: 93-98
 * F: 98-100
 */
const CUMULATIVE_RANGES: Array<{ tier: LootboxTier; max: number }> = [
  { tier: 'A', max: 35 },
  { tier: 'B', max: 65 },
  { tier: 'C', max: 83 },
  { tier: 'D', max: 93 },
  { tier: 'E', max: 98 },
  { tier: 'F', max: 100 },
];

/**
 * Generate lootbox rewards based on tier probabilities
 * 
 * Returns fixed gold and life amounts based on randomly selected tier.
 * Uses weighted random selection with cumulative probability ranges.
 * 
 * @returns {LootboxReward} Fixed reward values and tier
 */
export function generateLootboxRewards(): LootboxReward {
  // Generate random value 0-100
  const roll = Math.random() * 100;

  // Find matching tier based on cumulative ranges
  let selectedTier: LootboxTier = 'A'; // Default fallback
  for (const range of CUMULATIVE_RANGES) {
    if (roll < range.max) {
      selectedTier = range.tier;
      break;
    }
  }

  // Get fixed reward values for selected tier
  const config = TIER_CONFIG[selectedTier];

  return {
    gold: config.gold,
    life: config.life,
    tier: selectedTier,
  };
}

/**
 * Test function to validate tier distribution
 * Run with: deno test lootboxRewards.test.ts
 * 
 * Generates N samples and checks if distribution matches expected probabilities
 */
export function testTierDistribution(samples: number = 10000): Record<LootboxTier, number> {
  const results: Record<LootboxTier, number> = {
    A: 0, B: 0, C: 0, D: 0, E: 0, F: 0,
  };

  for (let i = 0; i < samples; i++) {
    const reward = generateLootboxRewards();
    results[reward.tier]++;
  }

  return results;
}
