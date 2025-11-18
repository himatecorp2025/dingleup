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
