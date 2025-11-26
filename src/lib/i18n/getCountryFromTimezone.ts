// Map timezone to country code
export function getCountryFromTimezone(timezone: string): string {
  // Common timezone to country mappings
  const timezoneToCountry: Record<string, string> = {
    'Europe/Budapest': 'HU',
    'Europe/London': 'GB',
    'Europe/Paris': 'FR',
    'Europe/Berlin': 'DE',
    'Europe/Rome': 'IT',
    'Europe/Madrid': 'ES',
    'Europe/Amsterdam': 'NL',
    'Europe/Lisbon': 'PT',
    'America/New_York': 'US',
    'America/Los_Angeles': 'US',
    'America/Chicago': 'US',
    'America/Denver': 'US',
    'America/Toronto': 'CA',
    'America/Vancouver': 'CA',
    'Asia/Tokyo': 'JP',
    'Asia/Shanghai': 'CN',
    'Asia/Dubai': 'AE',
    'Australia/Sydney': 'AU',
    'Australia/Melbourne': 'AU',
  };

  // Direct mapping
  if (timezoneToCountry[timezone]) {
    return timezoneToCountry[timezone];
  }

  // Try to extract country from timezone string (e.g., Europe/Budapest -> HU)
  const parts = timezone.split('/');
  if (parts.length >= 2) {
    const city = parts[parts.length - 1];
    
    // Special cases for Hungarian cities
    if (city === 'Budapest') return 'HU';
  }

  // Default to international (non-Hungarian)
  return 'XX';
}
