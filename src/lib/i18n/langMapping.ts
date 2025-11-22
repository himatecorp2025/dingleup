export type LangCode = 'hu' | 'en' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'nl';

export const COUNTRY_TO_LANG: Record<string, LangCode> = {
  // Magyar
  HU: 'hu',

  // Német
  DE: 'de',
  AT: 'de',
  CH: 'de',

  // Francia
  FR: 'fr',
  BE: 'fr',
  LU: 'fr',

  // Spanyol
  ES: 'es',
  MX: 'es',
  AR: 'es',
  CL: 'es',
  CO: 'es',
  PE: 'es',

  // Olasz
  IT: 'it',

  // Portugál
  PT: 'pt',
  BR: 'pt',

  // Holland
  NL: 'nl',
};

export const ALLOWED_LANGS: LangCode[] = ['hu', 'en', 'de', 'fr', 'es', 'it', 'pt', 'nl'];

export function resolveLangFromCountry(countryCode?: string | null): LangCode {
  if (!countryCode) return 'en';
  const upper = countryCode.toUpperCase();
  return COUNTRY_TO_LANG[upper] ?? 'en';
}
