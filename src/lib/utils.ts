import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the Monday of the current week in UTC timezone
 * Returns YYYY-MM-DD matching backend calculation
 * MUST match get_current_week_start() PostgreSQL function
 */
export function getWeekStartInUserTimezone(): string {
  // Use UTC time to match backend calculation
  const now = new Date();
  const utcDate = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
  const dayOfWeek = utcDate.getUTCDay();
  
  // Calculate Monday of current week (UTC)
  let diff: number;
  if (dayOfWeek === 0) {
    // Sunday -> go back 6 days
    diff = 6;
  } else {
    diff = dayOfWeek - 1;
  }
  
  const monday = new Date(utcDate);
  monday.setUTCDate(utcDate.getUTCDate() - diff);
  monday.setUTCHours(0, 0, 0, 0);
  
  const y = monday.getUTCFullYear();
  const m = String(monday.getUTCMonth() + 1).padStart(2, '0');
  const d = String(monday.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculate milliseconds until next midnight in user's timezone
 * @param userTimezone - IANA timezone string (e.g., 'Europe/Budapest', 'America/New_York')
 * @returns milliseconds until midnight in the user's timezone
 */
export function getMillisecondsUntilMidnight(userTimezone: string): number {
  try {
    const now = new Date();
    
    // Get current time in user's timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    
    const parts = formatter.formatToParts(now);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '0');
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
    const second = parseInt(parts.find(p => p.type === 'second')?.value || '0');
    
    // Create next midnight in user's timezone
    const tomorrowParts = formatter.formatToParts(new Date(now.getTime() + 24 * 60 * 60 * 1000));
    const tomorrowYear = parseInt(tomorrowParts.find(p => p.type === 'year')?.value || '0');
    const tomorrowMonth = parseInt(tomorrowParts.find(p => p.type === 'month')?.value || '0');
    const tomorrowDay = parseInt(tomorrowParts.find(p => p.type === 'day')?.value || '0');
    
    // Build midnight date string in user's timezone
    const midnightStr = `${tomorrowYear}-${String(tomorrowMonth).padStart(2, '0')}-${String(tomorrowDay).padStart(2, '0')}T00:00:00`;
    
    // Calculate difference
    const currentMs = hour * 3600000 + minute * 60000 + second * 1000 + now.getMilliseconds();
    const msInDay = 24 * 60 * 60 * 1000;
    const msUntilMidnight = msInDay - currentMs;
    
    return Math.max(0, msUntilMidnight);
  } catch (error) {
    console.error('[TIMEZONE] Error calculating midnight:', error);
    // Fallback: calculate midnight in local timezone
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime() - now.getTime();
  }
}
