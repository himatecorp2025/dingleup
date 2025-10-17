export type GameCategory = 'health' | 'history' | 'culture' | 'finance';

export interface Question {
  id: string;
  question: string;
  answers: string[];
  correct: string;
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
  help_50_50_active: boolean;
  help_2x_answer_active: boolean;
  help_audience_active: boolean;
  daily_gift_streak: number;
  daily_gift_last_claimed: string | null;
  invitation_code: string;
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
  duration: number; // in minutes
  lives_gained: number;
  max_lives_bonus: number;
}

export const SPEED_BOOSTERS: SpeedBooster[] = [
  { name: 'DoubleSpeed', multiplier: 2, price: 500, duration: 60, lives_gained: 10, max_lives_bonus: 10 },
  { name: 'MegaSpeed', multiplier: 4, price: 750, duration: 60, lives_gained: 20, max_lives_bonus: 20 },
  { name: 'GigaSpeed', multiplier: 12, price: 1000, duration: 60, lives_gained: 60, max_lives_bonus: 60 },
  { name: 'DingleSpeed', multiplier: 24, price: 1500, duration: 60, lives_gained: 120, max_lives_bonus: 120 }
];

export const COIN_REWARDS = {
  start: 1,
  questions_1_4: 1,
  questions_5_9: 3,
  questions_10_14: 5,
  question_15: 55
};

export const HELP_REACTIVATION_COSTS = {
  '50_50': 15,
  '2x_answer': 20,
  'audience': 30
};

export const SKIP_COSTS = {
  '1-5': 10,
  '6-10': 20,
  '11-15': 30
};

export const CONTINUE_AFTER_WRONG_COST = 50;
export const EXTRA_LIFE_COST = 100;
export const INITIAL_LIVES = 15;
export const LIVES_REGEN_MINUTES = 12;