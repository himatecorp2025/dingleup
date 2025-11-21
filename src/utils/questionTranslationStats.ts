import { supabase } from '@/integrations/supabase/client';

interface LanguageStats {
  code: string;
  name: string;
  total: number;
  translated: number;
  pending: number;
  percentage: number;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'German' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'nl', name: 'Dutch' },
];

export async function fetchQuestionTranslationStats() {
  // @ts-ignore - Supabase types too deep
  const { count: totalQuestions, error: countError } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error counting questions:', countError);
    throw countError;
  }
  
  const total = totalQuestions || 0;

  // Get translation stats per language
  const langStats: LanguageStats[] = [];
  
  for (const lang of LANGUAGES) {
    // @ts-ignore - Supabase types too deep
    const { count: translatedCount } = await supabase
      .from('question_translations')
      .select('*', { count: 'exact', head: true })
      .eq('lang', lang.code);

    const translated = translatedCount || 0;
    const pending = total - translated;
    
    langStats.push({
      code: lang.code,
      name: lang.name,
      total,
      translated,
      pending,
      percentage: total > 0 ? Math.round((translated / total) * 100) : 0
    });
  }

  // Calculate overall pending
  const totalTranslationsNeeded = total * LANGUAGES.length;
  // @ts-ignore - Supabase types too deep
  const { count: existingTranslations } = await supabase
    .from('question_translations')
    .select('*', { count: 'exact', head: true });

  const overallPending = totalTranslationsNeeded - (existingTranslations || 0);

  return {
    total,
    pending: overallPending,
    langStats
  };
}
