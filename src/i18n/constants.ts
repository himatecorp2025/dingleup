import { LangCode } from './types';

export const VALID_LANGUAGES: LangCode[] = ['en', 'de', 'fr', 'es', 'it', 'pt', 'nl', 'hu'];

export const LANGUAGE_NAMES: Record<LangCode, string> = {
  hu: 'Magyar',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
  pt: 'Português',
  nl: 'Nederlands'
};

export const COUNTRY_TO_LANG: Record<string, LangCode> = {
  // Hungarian
  HU: 'hu',

  // German
  DE: 'de',
  AT: 'de',
  CH: 'de',

  // French
  FR: 'fr',
  BE: 'fr',
  LU: 'fr',

  // Spanish
  ES: 'es',
  MX: 'es',
  AR: 'es',
  CL: 'es',
  CO: 'es',
  PE: 'es',

  // Italian
  IT: 'it',

  // Portuguese
  PT: 'pt',
  BR: 'pt',

  // Dutch
  NL: 'nl',
};

export const DEFAULT_LANG: LangCode = 'en'; // Runtime default is English
export const SOURCE_LANG: LangCode = 'hu'; // Source language in database
export const STORAGE_KEY = 'dingleup_lang';
