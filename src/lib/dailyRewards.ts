// Napi Jutalom központi konfiguráció
// Frontend és backend között megosztott reward logika

export type Weekday =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface DailyBaseReward {
  gold: number;
  life: number;
}

export interface RankReward {
  rank: number;
  gold: number;
  life: number;
}

// Elméleti heti bázis (csak referencia, NEM kerül kiosztásra)
export const WEEKLY_BASE: DailyBaseReward = {
  gold: 30000,
  life: 600,
};

// Napi bázis jutalmak (TOP10 számításhoz)
export const DAILY_BASE_REWARDS: Record<Weekday, DailyBaseReward> = {
  MONDAY:    { gold: 2400,   life: 48 },    // 8%
  TUESDAY:   { gold: 3600,   life: 72 },    // 12%
  WEDNESDAY: { gold: 5400,   life: 108 },   // 18%
  THURSDAY:  { gold: 7500,   life: 150 },   // 25%
  FRIDAY:    { gold: 10500,  life: 210 },   // 35%
  SATURDAY:  { gold: 15000,  life: 300 },   // 50%
  SUNDAY:    { gold: 30000,  life: 600 },   // 100% (csak referencia, vasárnap a Jackpot táblázat az irányadó)
};

// TOP10 helyezési szorzók (normál napokon H-Szo)
export const TOP10_MULTIPLIERS = [
  1.00,  // 1. hely: 100%
  0.70,  // 2. hely: 70%
  0.50,  // 3. hely: 50%
  0.30,  // 4. hely: 30%
  0.25,  // 5. hely: 25%
  0.20,  // 6. hely: 20%
  0.15,  // 7. hely: 15%
  0.12,  // 8. hely: 12%
  0.10,  // 9. hely: 10%
  0.08,  // 10. hely: 8%
];

// Vasárnapi Jackpot TOP25 (fix értékek)
export const SUNDAY_JACKPOT_TOP25: RankReward[] = [
  { rank: 1,  gold: 30000, life: 600 },
  { rank: 2,  gold: 21000, life: 420 },
  { rank: 3,  gold: 15000, life: 300 },
  { rank: 4,  gold: 9000,  life: 180 },
  { rank: 5,  gold: 7500,  life: 150 },
  { rank: 6,  gold: 6000,  life: 120 },
  { rank: 7,  gold: 4500,  life: 90 },
  { rank: 8,  gold: 3600,  life: 72 },
  { rank: 9,  gold: 3000,  life: 60 },
  { rank: 10, gold: 2400,  life: 48 },
  { rank: 11, gold: 2000,  life: 40 },
  { rank: 12, gold: 1800,  life: 36 },
  { rank: 13, gold: 1600,  life: 32 },
  { rank: 14, gold: 1400,  life: 28 },
  { rank: 15, gold: 1200,  life: 24 },
  { rank: 16, gold: 1000,  life: 20 },
  { rank: 17, gold: 800,   life: 16 },
  { rank: 18, gold: 700,   life: 14 },
  { rank: 19, gold: 600,   life: 12 },
  { rank: 20, gold: 500,   life: 10 },
  { rank: 21, gold: 400,   life: 8 },
  { rank: 22, gold: 360,   life: 7 },
  { rank: 23, gold: 320,   life: 6 },
  { rank: 24, gold: 280,   life: 6 },
  { rank: 25, gold: 240,   life: 5 },
];

/**
 * Megadja a weekday-t egy Date objektumból (EU időzóna)
 */
export function getWeekday(date: Date): Weekday {
  const dayIndex = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  const days: Weekday[] = [
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
  ];
  return days[dayIndex];
}

/**
 * Kiszámolja egy adott napra vonatkozó napi jutalmakat
 */
export function getDailyRewardsForDate(date: Date): {
  day: Weekday;
  type: 'NORMAL' | 'JACKPOT';
  rewards: RankReward[];
} {
  const day = getWeekday(date);

  // Vasárnap: Jackpot TOP25
  if (day === 'SUNDAY') {
    return {
      day,
      type: 'JACKPOT',
      rewards: SUNDAY_JACKPOT_TOP25,
    };
  }

  // Normál napok (H-Szo): TOP10 szorzókkal
  const base = DAILY_BASE_REWARDS[day];
  const rewards: RankReward[] = TOP10_MULTIPLIERS.map((multiplier, index) => {
    const rank = index + 1;
    return {
      rank,
      gold: Math.round(base.gold * multiplier),
      life: Math.round(base.life * multiplier),
    };
  });

  return {
    day,
    type: 'NORMAL',
    rewards,
  };
}

/**
 * Helper: nap neve magyarul
 */
export function getWeekdayNameHU(day: Weekday): string {
  const names: Record<Weekday, string> = {
    MONDAY: 'Hétfő',
    TUESDAY: 'Kedd',
    WEDNESDAY: 'Szerda',
    THURSDAY: 'Csütörtök',
    FRIDAY: 'Péntek',
    SATURDAY: 'Szombat',
    SUNDAY: 'Vasárnap',
  };
  return names[day];
}
