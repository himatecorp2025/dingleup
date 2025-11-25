export type LangCode = 'hu' | 'en';

export const COUNTRY_TO_LANG: Record<string, LangCode> = {
  // Hungarian
  HU: 'hu'
  // All other countries default to English
};

export const ALLOWED_LANGS: LangCode[] = ['hu', 'en'];

export function resolveLangFromCountry(countryCode?: string | null): LangCode {
  if (!countryCode) return 'en';
  const upper = countryCode.toUpperCase();
  return COUNTRY_TO_LANG[upper] ?? 'en';
}
