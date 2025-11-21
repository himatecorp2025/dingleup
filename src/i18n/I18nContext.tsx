import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LangCode, TranslationMap, I18nContextValue } from './types';
import { VALID_LANGUAGES, DEFAULT_LANG, SOURCE_LANG, STORAGE_KEY } from './constants';

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [lang, setLangState] = useState<LangCode>(DEFAULT_LANG);
  const [translations, setTranslations] = useState<TranslationMap>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchTranslations = async (targetLang: LangCode): Promise<TranslationMap> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-translations?lang=${targetLang}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data?.translations || {};
    } catch (error) {
      console.error('[I18n] Failed to fetch translations:', error);
      return {};
    }
  };


  const initializeLanguage = async () => {
    setIsLoading(true);
    
    try {
      // 1. Check localStorage first
      const storedLang = localStorage.getItem(STORAGE_KEY);
      if (storedLang && VALID_LANGUAGES.includes(storedLang as LangCode)) {
        const validLang = storedLang as LangCode;
        setLangState(validLang);
        const trans = await fetchTranslations(validLang);
        setTranslations(trans);
        setIsLoading(false);
        return;
      }

      // 2. Check if user is logged in and has preferred_language
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('preferred_language')
          .eq('id', user.id)
          .single();

        if (profile?.preferred_language && VALID_LANGUAGES.includes(profile.preferred_language as LangCode)) {
          const preferredLang = profile.preferred_language as LangCode;
          setLangState(preferredLang);
          localStorage.setItem(STORAGE_KEY, preferredLang);
          const trans = await fetchTranslations(preferredLang);
          setTranslations(trans);
          setIsLoading(false);
          return;
        }
      }

      // 3. Default to English
      setLangState(DEFAULT_LANG);
      localStorage.setItem(STORAGE_KEY, DEFAULT_LANG);
      const trans = await fetchTranslations(DEFAULT_LANG);
      setTranslations(trans);
    } catch (error) {
      console.error('[I18n] Language initialization failed:', error);
      // Fallback to default
      setLangState(DEFAULT_LANG);
      const trans = await fetchTranslations(DEFAULT_LANG);
      setTranslations(trans);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeLanguage();
  }, []);

  const setLang = async (newLang: LangCode, skipDbUpdate = false) => {
    if (!VALID_LANGUAGES.includes(newLang)) {
      console.warn(`[I18n] Invalid language code: ${newLang}`);
      return;
    }

    setIsLoading(true);
    try {
      // Update state and localStorage immediately
      setLangState(newLang);
      localStorage.setItem(STORAGE_KEY, newLang);

      // Only update database if not already updated by caller
      if (!skipDbUpdate) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({ preferred_language: newLang })
            .eq('id', user.id);
        }
      }

      // Fetch new translations
      const trans = await fetchTranslations(newLang);
      setTranslations(trans);
    } catch (error) {
      console.error('[I18n] Failed to change language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const t = (key: string): string => {
    // Try current language
    if (translations[key] && translations[key].trim() !== '') {
      return translations[key];
    }

    // Fallback to English if current lang failed
    if (lang !== 'en' && translations[`${key}_en`] && translations[`${key}_en`].trim() !== '') {
      return translations[`${key}_en`];
    }

    // Fallback to Hungarian (source language)
    if (translations[`${key}_hu`] && translations[`${key}_hu`].trim() !== '') {
      return translations[`${key}_hu`];
    }

    // Log missing translation in development
    if (import.meta.env.DEV) {
      console.warn(`[I18n] Missing translation for key: ${key} (lang: ${lang})`);
    }

    // Return key itself as last resort (debug mode)
    return key;
  };

  const value: I18nContextValue = {
    lang,
    translations,
    t,
    setLang,
    isLoading
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export default I18nContext;
