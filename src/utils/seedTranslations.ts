import { supabase } from '@/integrations/supabase/client';

/**
 * Batch translate all translations that have hu text but missing other languages
 * This should be run once after initial translation keys are inserted
 */
export async function seedTranslationsWithAI() {
  console.log('[seedTranslations] Starting batch translation...');
  
  try {
    // 1. Fetch all translations that need translation
    const { data: translations, error: fetchError } = await supabase
      .from('translations')
      .select('key, hu')
      .order('key');
    
    if (fetchError) throw fetchError;
    if (!translations || translations.length === 0) {
      console.log('[seedTranslations] No translations to process');
      return;
    }

    console.log(`[seedTranslations] Found ${translations.length} translations to process`);
    
    // 2. Process each translation
    for (const translation of translations) {
      console.log(`[seedTranslations] Translating: ${translation.key}`);
      
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-text`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              hungarianText: translation.hu,
              targetLanguages: ['en', 'de', 'fr', 'es', 'it', 'pt', 'nl']
            })
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[seedTranslations] Translation failed for ${translation.key}:`, response.status, errorText);
          continue;
        }

        const result = await response.json();
        const allTranslations = result.translations;

        // 3. Update the translation row with all languages
        const { error: updateError } = await supabase
          .from('translations')
          .update({
            en: allTranslations.en || translation.hu,
            de: allTranslations.de || translation.hu,
            fr: allTranslations.fr || translation.hu,
            es: allTranslations.es || translation.hu,
            it: allTranslations.it || translation.hu,
            pt: allTranslations.pt || translation.hu,
            nl: allTranslations.nl || translation.hu
          })
          .eq('key', translation.key);

        if (updateError) {
          console.error(`[seedTranslations] Update failed for ${translation.key}:`, updateError);
          continue;
        }

        console.log(`[seedTranslations] ✓ ${translation.key} translated`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`[seedTranslations] Error processing ${translation.key}:`, error);
      }
    }

    console.log('[seedTranslations] Batch translation complete!');
    return true;
    
  } catch (error) {
    console.error('[seedTranslations] Fatal error:', error);
    throw error;
  }
}
