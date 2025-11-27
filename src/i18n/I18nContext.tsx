import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LangCode, TranslationMap, I18nContextValue } from './types';
import { VALID_LANGUAGES, DEFAULT_LANG, SOURCE_LANG, STORAGE_KEY } from './constants';
import { resolveLangFromCountry, ALLOWED_LANGS } from '@/lib/i18n/langMapping';
import { resolveInitialLang } from '@/lib/i18n/resolveInitialLang';

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

const CACHE_KEY_PREFIX = 'dingleup_translations_';
const CACHE_VERSION_KEY = 'dingleup_translations_version';
const CACHE_VERSION = '1.8'; // Bumped to force cache refresh for new gifts navigation
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface CachedTranslations {
  translations: TranslationMap;
  timestamp: number;
  version: string;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [lang, setLangState] = useState<LangCode>(DEFAULT_LANG);
  const [translations, setTranslations] = useState<TranslationMap>({});
  const [isLoading, setIsLoading] = useState(true);

  const getCacheKey = (targetLang: LangCode) => `${CACHE_KEY_PREFIX}${targetLang}`;

  const getCachedTranslations = (targetLang: LangCode): TranslationMap | null => {
    try {
      const cached = localStorage.getItem(getCacheKey(targetLang));
      if (!cached) return null;

      const data: CachedTranslations = JSON.parse(cached);
      const now = Date.now();
      
      // Check version first - if version changed, invalidate cache
      if (data.version !== CACHE_VERSION) {
        localStorage.removeItem(getCacheKey(targetLang));
        return null;
      }
      
      // Check if cache is still valid (within TTL)
      if (now - data.timestamp > CACHE_TTL) {
        localStorage.removeItem(getCacheKey(targetLang));
        return null;
      }

      return data.translations;
    } catch (error) {
      console.error('[I18n] Cache read error:', error);
      return null;
    }
  };

  const setCachedTranslations = (targetLang: LangCode, translations: TranslationMap) => {
    try {
      const data: CachedTranslations = {
        translations,
        timestamp: Date.now(),
        version: CACHE_VERSION
      };
      localStorage.setItem(getCacheKey(targetLang), JSON.stringify(data));
    } catch (error) {
      console.error('[I18n] Cache write error:', error);
    }
  };

  const fetchTranslations = async (targetLang: LangCode): Promise<TranslationMap> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-translations?lang=${targetLang}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const fetchedTranslations = data?.translations || {};
      
      // Cache the fetched translations
      setCachedTranslations(targetLang, fetchedTranslations);
      
      return fetchedTranslations;
    } catch (error) {
      console.error('[I18n] Failed to fetch translations:', error);
      return {};
    }
  };


  const initializeLanguage = async () => {
    try {
      // Clear old cache versions immediately
      const storedVersion = localStorage.getItem(CACHE_VERSION_KEY);
      if (storedVersion !== CACHE_VERSION) {
        // Clear all translation caches
        VALID_LANGUAGES.forEach(lang => {
          localStorage.removeItem(getCacheKey(lang));
        });
        localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);
      }

      // 1. Get user profile with preferred_language
      const { data: { user } } = await supabase.auth.getUser();
      let targetLang: LangCode = DEFAULT_LANG; // DEFAULT_LANG is already 'en'

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('preferred_language, preferred_country')
          .eq('id', user.id)
          .single();

        if (profile) {
          // Use resolveInitialLang with user's preferred_language
          targetLang = resolveInitialLang({ 
            loggedInUserPreferredLanguage: profile.preferred_language 
          });
          
          // If no preferred_language set, derive from country
          if (!profile.preferred_language && profile.preferred_country) {
            targetLang = resolveLangFromCountry(profile.preferred_country);
            // Update database with derived language
            await supabase
              .from('profiles')
              .update({ preferred_language: targetLang })
              .eq('id', user.id);
          }
          
          localStorage.setItem(STORAGE_KEY, targetLang);
        }
      } else {
        // No user logged in - detect timezone for login/register pages
        try {
          const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const countryCode = await import('@/lib/utils').then(m => m.getCountryFromTimezone(detectedTimezone));
          targetLang = countryCode === 'HU' ? 'hu' : 'en';
        } catch (error) {
          console.error('[I18n] Timezone detection failed:', error);
          targetLang = 'en';
        }
        localStorage.setItem(STORAGE_KEY, targetLang);
      }

      setLangState(targetLang);

      // Try to load from cache first (instant)
      const cachedTranslations = getCachedTranslations(targetLang);
      if (cachedTranslations && Object.keys(cachedTranslations).length > 0) {
        setTranslations(cachedTranslations);
        setIsLoading(false);
        
        // Fetch fresh translations in background (don't await)
        fetchTranslations(targetLang).then(freshTranslations => {
          if (Object.keys(freshTranslations).length > 0) {
            setTranslations(freshTranslations);
          }
        });
      } else {
        // No cache - must fetch before rendering
        const trans = await fetchTranslations(targetLang);
        setTranslations(trans);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('[I18n] Language initialization failed:', error);
      // Fallback to default (en) with cache check
      setLangState(DEFAULT_LANG);
      const cachedTranslations = getCachedTranslations(DEFAULT_LANG);
      if (cachedTranslations && Object.keys(cachedTranslations).length > 0) {
        setTranslations(cachedTranslations);
      } else {
        const trans = await fetchTranslations(DEFAULT_LANG);
        setTranslations(trans);
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeLanguage();

    // Listen for auth state changes - when user logs in/out or switches accounts,
    // reinitialize language based on the new user's preferred_language
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        // Re-initialize language for the newly logged-in user
        initializeLanguage();
      } else if (event === 'SIGNED_OUT') {
        // On logout, reset to English default
        setLangState('en');
        localStorage.setItem(STORAGE_KEY, 'en');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const setLang = async (newLang: LangCode, skipDbUpdate = false) => {
    if (!ALLOWED_LANGS.includes(newLang)) {
      console.warn(`[I18n] Invalid language code: ${newLang}`);
      return;
    }

    try {
      // Update state and localStorage immediately
      setLangState(newLang);
      localStorage.setItem(STORAGE_KEY, newLang);

      // Try to load from cache first (instant language switch)
      const cachedTranslations = getCachedTranslations(newLang);
      if (cachedTranslations && Object.keys(cachedTranslations).length > 0) {
        setTranslations(cachedTranslations);
        setIsLoading(false);
        
        // Fetch fresh translations in background
        fetchTranslations(newLang).then(freshTranslations => {
          if (Object.keys(freshTranslations).length > 0) {
            setTranslations(freshTranslations);
          }
        });
      } else {
        // No cache - show loading and fetch
        setIsLoading(true);
        const trans = await fetchTranslations(newLang);
        setTranslations(trans);
        setIsLoading(false);
      }

      // Update database in background (don't block UI)
      if (!skipDbUpdate) {
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            supabase
              .from('profiles')
              .update({ preferred_language: newLang })
              .eq('id', user.id);
          }
        });
      }
    } catch (error) {
      console.error('[I18n] Failed to change language:', error);
      setIsLoading(false);
    }
  };

  const t = (key: string): string => {
    // The edge function already returns the correct language with fallback to Hungarian
    // So we just need to return the value directly from the translations map
    const value = translations[key];
    
    if (value && value.trim() !== '') {
      return value;
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
