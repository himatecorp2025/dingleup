/**
 * Timezone-aware date helper functions
 * Used for consistent date calculations across the application
 */

/**
 * Get yesterday's date in user's timezone
 * Returns date in YYYY-MM-DD format (ISO 8601 date string)
 * 
 * @param userTimezone - IANA timezone string (e.g., 'Europe/Budapest', 'America/New_York')
 * @returns Yesterday's date as 'YYYY-MM-DD' string
 * 
 * @example
 * getYesterdayDateInUserTimezone('Europe/Budapest') // '2025-12-01'
 */
export function getYesterdayDateInUserTimezone(userTimezone: string): string {
  try {
    // Get current UTC time
    const nowUtc = new Date();
    
    // Convert to user's local time using timezone
    const localTimeString = nowUtc.toLocaleString('en-US', { 
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    // Parse the local time string back to Date object
    const localNow = new Date(localTimeString);
    
    // Subtract 1 day
    const yesterday = new Date(localNow);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Format as YYYY-MM-DD
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('[DATE-HELPERS] Error calculating yesterday date:', error);
    // Fallback: UTC-based yesterday
    const utcYesterday = new Date();
    utcYesterday.setUTCDate(utcYesterday.getUTCDate() - 1);
    utcYesterday.setUTCHours(0, 0, 0, 0);
    return utcYesterday.toISOString().split('T')[0];
  }
}

/**
 * Get today's date in user's timezone
 * Returns date in YYYY-MM-DD format (ISO 8601 date string)
 * 
 * @param userTimezone - IANA timezone string
 * @returns Today's date as 'YYYY-MM-DD' string
 */
export function getTodayDateInUserTimezone(userTimezone: string): string {
  try {
    const nowUtc = new Date();
    
    const localTimeString = nowUtc.toLocaleString('en-US', { 
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const localNow = new Date(localTimeString);
    
    const year = localNow.getFullYear();
    const month = String(localNow.getMonth() + 1).padStart(2, '0');
    const day = String(localNow.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('[DATE-HELPERS] Error calculating today date:', error);
    // Fallback: UTC-based today
    const utcToday = new Date();
    utcToday.setUTCHours(0, 0, 0, 0);
    return utcToday.toISOString().split('T')[0];
  }
}

/**
 * Get day of week for yesterday in user's timezone
 * Returns 1=Monday, 2=Tuesday, ..., 7=Sunday (database format)
 * 
 * @param userTimezone - IANA timezone string
 * @returns Day of week (1-7)
 */
export function getYesterdayDayOfWeek(userTimezone: string): number {
  try {
    const nowUtc = new Date();
    const localTimeString = nowUtc.toLocaleString('en-US', { 
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const localNow = new Date(localTimeString);
    const yesterday = new Date(localNow);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const jsDay = yesterday.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    // Convert to database format: 1=Monday, 2=Tuesday, ..., 7=Sunday
    return jsDay === 0 ? 7 : jsDay;
  } catch (error) {
    console.error('[DATE-HELPERS] Error calculating yesterday day of week:', error);
    return 1; // Default to Monday
  }
}

/**
 * Check if yesterday was Sunday in user's timezone
 * Used for jackpot determination (Sunday = TOP 25, other days = TOP 10)
 * 
 * @param userTimezone - IANA timezone string
 * @returns true if yesterday was Sunday
 */
export function wasYesterdaySunday(userTimezone: string): boolean {
  return getYesterdayDayOfWeek(userTimezone) === 7;
}
