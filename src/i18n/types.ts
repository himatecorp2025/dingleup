export type LangCode = 'hu' | 'en' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'nl';

export interface TranslationMap {
  [key: string]: string;
}

export interface I18nContextValue {
  lang: LangCode;
  translations: TranslationMap;
  t: (key: string) => string;
  setLang: (lang: LangCode) => Promise<void>;
  isLoading: boolean;
}
