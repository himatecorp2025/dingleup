import { ALLOWED_LANGS, LangCode } from './langMapping';

export function resolveInitialLang(options: {
  loggedInUserPreferredLanguage?: string | null;
}): LangCode {
  const { loggedInUserPreferredLanguage } = options;

  if (loggedInUserPreferredLanguage && ALLOWED_LANGS.includes(loggedInUserPreferredLanguage as LangCode)) {
    return loggedInUserPreferredLanguage as LangCode;
  }

  const ls = typeof window !== 'undefined'
    ? window.localStorage.getItem('dingleup_lang')
    : null;

  if (ls && ALLOWED_LANGS.includes(ls as LangCode)) {
    return ls as LangCode;
  }

  return 'en';
}
