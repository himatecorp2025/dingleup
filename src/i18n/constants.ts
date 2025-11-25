import { LangCode } from './types';

export const VALID_LANGUAGES: LangCode[] = ['en', 'hu'];

export const LANGUAGE_NAMES: Record<LangCode, string> = {
  hu: 'Magyar',
  en: 'English'
};

export const COUNTRY_TO_LANG: Record<string, LangCode> = {
  // Hungarian
  HU: 'hu'
  // All other countries default to English
};

export const DEFAULT_LANG: LangCode = 'en'; // Runtime default is English
export const SOURCE_LANG: LangCode = 'hu'; // Source language in database
export const STORAGE_KEY = 'dingleup_lang';
