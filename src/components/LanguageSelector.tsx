import React from 'react';
import { useI18n, LangCode, LANGUAGE_NAMES, VALID_LANGUAGES } from '@/i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from 'lucide-react';

const LANGUAGE_FLAGS: Record<LangCode, string> = {
  hu: '🇭🇺',
  en: '🇬🇧'
};

export const LanguageSelector: React.FC = () => {
  const { lang, setLang, isLoading } = useI18n();

  const handleLanguageChange = async (newLang: string) => {
    await setLang(newLang as LangCode);
  };

  if (isLoading) {
    return (
      <div className="w-[140px] h-10 bg-background/10 backdrop-blur-sm border border-border/20 rounded-md animate-pulse" />
    );
  }

  return (
    <Select value={lang} onValueChange={handleLanguageChange} disabled={isLoading}>
      <SelectTrigger 
        className="w-[140px] bg-background/10 backdrop-blur-sm border-border/20 hover:bg-background/20 transition-colors"
        aria-label="Select language"
      >
        <Globe className="w-4 h-4 mr-2" />
        <SelectValue>
          <span className="flex items-center gap-2">
            <span>{LANGUAGE_FLAGS[lang]}</span>
            <span>{LANGUAGE_NAMES[lang]}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {VALID_LANGUAGES.map((langCode) => (
          <SelectItem key={langCode} value={langCode}>
            <span className="flex items-center gap-2">
              <span>{LANGUAGE_FLAGS[langCode]}</span>
              <span>{LANGUAGE_NAMES[langCode]}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
