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
  gold: 150000,
  life: 3000,
};

// Napi bázis jutalmak (TOP10 számításhoz)
export const DAILY_BASE_REWARDS: Record<Weekday, DailyBaseReward> = {
  MONDAY:    { gold: 12000,  life: 240 },   // 8%
  TUESDAY:   { gold: 18000,  life: 360 },   // 12%
  WEDNESDAY: { gold: 27000,  life: 540 },   // 18%
  THURSDAY:  { gold: 37500,  life: 750 },   // 25%
  FRIDAY:    { gold: 52500,  life: 1050 },  // 35%
  SATURDAY:  { gold: 75000,  life: 1500 },  // 50%
  SUNDAY:    { gold: 150000, life: 3000 },  // 100% (csak referencia, vasárnap a Jackpot táblázat az irányadó)
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
  { rank: 1,  gold: 150000, life: 3000 },
  { rank: 2,  gold: 105000, life: 2100 },
  { rank: 3,  gold: 75000,  life: 1500 },
  { rank: 4,  gold: 45000,  life: 900 },
  { rank: 5,  gold: 37500,  life: 750 },
  { rank: 6,  gold: 30000,  life: 600 },
  { rank: 7,  gold: 22500,  life: 450 },
  { rank: 8,  gold: 18000,  life: 360 },
  { rank: 9,  gold: 15000,  life: 300 },
  { rank: 10, gold: 12000,  life: 240 },
  { rank: 11, gold: 10000,  life: 200 },
  { rank: 12, gold: 9000,   life: 180 },
  { rank: 13, gold: 8000,   life: 160 },
  { rank: 14, gold: 7000,   life: 140 },
  { rank: 15, gold: 6000,   life: 120 },
  { rank: 16, gold: 5000,   life: 100 },
  { rank: 17, gold: 4000,   life: 80 },
  { rank: 18, gold: 3500,   life: 70 },
  { rank: 19, gold: 3000,   life: 60 },
  { rank: 20, gold: 2500,   life: 50 },
  { rank: 21, gold: 2000,   life: 40 },
  { rank: 22, gold: 1800,   life: 36 },
  { rank: 23, gold: 1500,   life: 30 },
  { rank: 24, gold: 1300,   life: 26 },
  { rank: 25, gold: 1200,   life: 24 },
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
