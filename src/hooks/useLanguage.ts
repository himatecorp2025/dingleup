import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { countryToLanguage } from '@/lib/i18n';

export const useLanguage = (countryCode: string | null | undefined) => {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (countryCode) {
      const language = countryToLanguage(countryCode);
      if (i18n.language !== language) {
        i18n.changeLanguage(language);
      }
    }
  }, [countryCode, i18n]);

  return { currentLanguage: i18n.language };
};
