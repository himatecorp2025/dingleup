export type GameCategory = 'health' | 'history' | 'culture' | 'finance';

export interface Answer {
  key: 'A' | 'B' | 'C';
  text: string;
  correct: boolean;
}

export interface Question {
  id: string;
  question: string;
  answers: Answer[];
  audience?: { A: number; B: number; C: number };
  third?: string;
  topic: string;
}

export interface ShuffledQuestion extends Question {
  shuffledAnswers: string[];
  correctIndex: number;
}

export type GameState = 'idle' | 'category-select' | 'playing' | 'won' | 'lost' | 'out-of-lives' | 'timeout';

export interface GameResult {
  id?: string;
  user_id: string;
  category: GameCategory;
  correct_answers: number;
  total_questions: number;
  coins_earned: number;
  average_response_time: number;
  completed: boolean;
  completed_at?: string;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  coins: number;
  lives: number;
  max_lives: number;
  lives_regeneration_rate: number;
  last_life_regeneration: string;
  speed_booster_active: boolean;
  speed_booster_expires_at: string | null;
  speed_booster_multiplier: number;
  help_third_active: boolean;
  help_2x_answer_active: boolean;
  help_audience_active: boolean;
  daily_gift_streak: number;
  daily_gift_last_claimed: string | null;
  invitation_code: string;
  avatar_url: string | null;
  welcome_bonus_claimed: boolean;
  question_swaps_available: number;
  total_correct_answers: number;
  is_subscribed: boolean;
  subscriber_type: 'paid' | 'comp' | null;
  subscriber_since: string | null;
  subscriber_renew_at: string | null;
  country_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyRanking {
  id: string;
  user_id: string;
  category: GameCategory;
  week_start: string;
  total_correct_answers: number;
  average_response_time: number;
  rank: number | null;
  username?: string;
}

export interface SpeedBooster {
  name: string;
  multiplier: number;
  price: number;
  priceUsd: number; // Price in USD cents
  duration: number; // in minutes
  lives_gained: number;
  max_lives_bonus: number;
}

export const SPEED_BOOSTERS: SpeedBooster[] = [
  { name: 'DoubleSpeed', multiplier: 2, price: 500, priceUsd: 1.49, duration: 60, lives_gained: 10, max_lives_bonus: 10 },
  { name: 'MegaSpeed', multiplier: 4, price: 750, priceUsd: 1.99, duration: 60, lives_gained: 20, max_lives_bonus: 20 },
  { name: 'GigaSpeed', multiplier: 12, price: 1000, priceUsd: 2.99, duration: 60, lives_gained: 60, max_lives_bonus: 60 },
  { name: 'DingleSpeed', multiplier: 24, price: 1500, priceUsd: 4.49, duration: 60, lives_gained: 120, max_lives_bonus: 120 }
];

export const COIN_REWARDS = {
  per_correct_answer: 50
};

// Progresszív arany jutalom rendszer
export const getCoinsForQuestion = (questionIndex: number): number => {
  if (questionIndex === 0) return 1; // Start
  if (questionIndex >= 1 && questionIndex <= 4) return 1;
  if (questionIndex >= 5 && questionIndex <= 9) return 3;
  if (questionIndex >= 10 && questionIndex <= 14) return 5;
  if (questionIndex === 15) return 55;
  return 1; // fallback
};

export const HELP_REACTIVATION_COSTS = {
  'third': 15,
  '2x_answer': 20,
  'audience': 30
};

export const SKIP_COSTS = {
  '1-5': 10,
  '6-10': 20,
  '11-15': 30
};

// Dynamic skip cost based on question index (0-indexed)
export const getSkipCost = (questionIndex: number): number => {
  if (questionIndex < 5) return 10;  // Questions 1-5
  if (questionIndex < 10) return 20; // Questions 6-10
  return 30; // Questions 11-15
};

export const CONTINUE_AFTER_WRONG_COST = 50;
export const TIMEOUT_CONTINUE_COST = 150;
export const EXTRA_LIFE_COST = 100;
export const INITIAL_LIVES = 15;
export const LIVES_REGEN_MINUTES = 12;

export interface UserBooster {
  id: string;
  user_id: string;
  booster_type: 'DoubleSpeed' | 'MegaSpeed' | 'GigaSpeed' | 'DingleSpeed';
  activated: boolean;
  activated_at: string | null;
  expires_at: string | null;
  created_at: string;
}