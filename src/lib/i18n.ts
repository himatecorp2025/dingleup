import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import huTranslation from '@/locales/hu/translation.json';
import enTranslation from '@/locales/en/translation.json';
import deTranslation from '@/locales/de/translation.json';
import frTranslation from '@/locales/fr/translation.json';
import esTranslation from '@/locales/es/translation.json';
import itTranslation from '@/locales/it/translation.json';
import ptTranslation from '@/locales/pt/translation.json';
import nlTranslation from '@/locales/nl/translation.json';

// Country code to language mapping
export const countryToLanguage = (countryCode: string): string => {
  const code = countryCode.toUpperCase();
  
  // English-speaking countries
  if (['US', 'GB', 'CA', 'AU', 'NZ', 'IE', 'ZA', 'SG', 'IN', 'PH', 'MY', 'PK', 'NG', 'KE', 'GH', 'ZW', 'UG', 'TZ', 'JM', 'TT', 'BB', 'BS', 'BZ', 'GD', 'GY', 'LC', 'VC', 'AG', 'DM', 'KN', 'MT', 'CY', 'FJ', 'PG', 'SB', 'VU', 'WS', 'TO', 'TV', 'KI', 'NR', 'PW', 'MH', 'FM'].includes(code)) {
    return 'en';
  }
  
  // German-speaking countries
  if (['DE', 'AT', 'CH', 'LI', 'LU'].includes(code)) {
    return 'de';
  }
  
  // French-speaking countries
  if (['FR', 'BE', 'CH', 'LU', 'MC', 'CD', 'CI', 'CM', 'SN', 'ML', 'BF', 'NE', 'TD', 'MG', 'BJ', 'TG', 'CF', 'CG', 'GA', 'GN', 'RW', 'BI', 'DJ', 'KM', 'SC', 'VU', 'HT', 'GF', 'GP', 'MQ', 'RE', 'YT', 'PM', 'BL', 'MF', 'WF', 'PF', 'NC'].includes(code)) {
    return 'fr';
  }
  
  // Spanish-speaking countries
  if (['ES', 'MX', 'AR', 'CO', 'PE', 'VE', 'CL', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY', 'GQ', 'PR'].includes(code)) {
    return 'es';
  }
  
  // Italian-speaking countries
  if (['IT', 'CH', 'SM', 'VA'].includes(code)) {
    return 'it';
  }
  
  // Portuguese-speaking countries
  if (['PT', 'BR', 'AO', 'MZ', 'GW', 'TL', 'GQ', 'MO', 'CV', 'ST'].includes(code)) {
    return 'pt';
  }
  
  // Dutch-speaking countries
  if (['NL', 'BE', 'SR', 'AW', 'CW', 'SX', 'BQ'].includes(code)) {
    return 'nl';
  }
  
  // Hungarian (default)
  if (code === 'HU') {
    return 'hu';
  }
  
  // Default to Hungarian for unknown countries
  return 'hu';
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      hu: { translation: huTranslation },
      en: { translation: enTranslation },
      de: { translation: deTranslation },
      fr: { translation: frTranslation },
      es: { translation: esTranslation },
      it: { translation: itTranslation },
      pt: { translation: ptTranslation },
      nl: { translation: nlTranslation },
    },
    lng: 'hu', // Default language
    fallbackLng: 'hu',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Disable suspense for smoother loading
    },
  });

export default i18n;
