export type LangCode = 'hu' | 'en';

export interface TranslationMap {
  [key: string]: string;
}

export interface I18nContextValue {
  lang: LangCode;
  translations: TranslationMap;
  t: (key: string) => string;
  setLang: (lang: LangCode, skipDbUpdate?: boolean) => Promise<void>;
  isLoading: boolean;
}
