import { supabase } from '@/integrations/supabase/client';

const BATCH_SIZE = 30; // Process 30 translations at once (optimized for speed + quality)
const TARGET_LANGUAGES = ['en', 'de', 'fr', 'es', 'it', 'pt', 'nl'];

/**
 * High-performance batch translation with idempotency
 * Only translates keys where target language fields are NULL/empty
 * Processes multiple keys in parallel for maximum speed
 */
export async function seedTranslationsWithAI() {
  console.log('[seedTranslations] Starting optimized batch translation...');
  
  try {
    // Get current session for JWT token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Jelentkezz be admin fiókkal a fordítások indításához');
    }

    // 1. Fetch only translations that need translation (idempotent: where any lang is NULL)
    const { data: translations, error: fetchError } = await supabase
      .from('translations')
      .select('key, hu, en, de, fr, es, it, pt, nl')
      .not('hu', 'is', null)
      .or('en.is.null,de.is.null,fr.is.null,es.is.null,it.is.null,pt.is.null,nl.is.null')
      .order('key');
    
    if (fetchError) throw fetchError;
    if (!translations || translations.length === 0) {
      console.log('[seedTranslations] No translations to process - all complete!');
      return { success: true, processed: 0, errors: [] };
    }

    console.log(`[seedTranslations] Found ${translations.length} translations needing work`);
    
    const errors: string[] = [];
    let processedCount = 0;

    // 2. Process in batches for maximum speed
    for (let i = 0; i < translations.length; i += BATCH_SIZE) {
      const batch = translations.slice(i, i + BATCH_SIZE);
      console.log(`[seedTranslations] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(translations.length / BATCH_SIZE)} (${batch.length} items)`);
      
      try {
        // Prepare batch items
        const batchItems = batch.map(t => ({ key: t.key, hu: t.hu }));
        
        // Call batch translation edge function
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-text-batch`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              items: batchItems,
              targetLanguages: TARGET_LANGUAGES
            })
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[seedTranslations] Batch translation failed:`, response.status, errorText);
          errors.push(`Batch ${i}-${i + batch.length}: ${response.status} ${errorText}`);
          continue;
        }

        const result = await response.json();
        const batchResults = result.results;

        // 3. Update database with translated results
        for (const item of batchResults) {
          try {
            const original = batch.find(t => t.key === item.key);
            if (!original) continue;

            // Only update fields that are NULL (idempotent)
            const updates: any = {};
            for (const lang of TARGET_LANGUAGES) {
              if (!original[lang as keyof typeof original]) {
                updates[lang] = item.translations[lang] || original.hu;
              }
            }

            if (Object.keys(updates).length > 0) {
              const { error: updateError } = await supabase
                .from('translations')
                .update(updates)
                .eq('key', item.key);

              if (updateError) {
                console.error(`[seedTranslations] Update failed for ${item.key}:`, updateError);
                errors.push(`Update error for ${item.key}: ${updateError.message}`);
              } else {
                processedCount++;
                console.log(`[seedTranslations] ✓ ${item.key} (${Object.keys(updates).length} langs)`);
              }
            }
            
          } catch (itemError) {
            console.error(`[seedTranslations] Error processing result for ${item.key}:`, itemError);
            errors.push(`Result error for ${item.key}: ${itemError instanceof Error ? itemError.message : 'Unknown'}`);
          }
        }

        // Small delay between batches to avoid overwhelming the system
        if (i + BATCH_SIZE < translations.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
      } catch (batchError) {
        console.error(`[seedTranslations] Batch error:`, batchError);
        errors.push(`Batch ${i}-${i + BATCH_SIZE}: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`);
      }
    }

    console.log(`[seedTranslations] Complete! Processed: ${processedCount}, Errors: ${errors.length}`);
    
    return { 
      success: true, 
      processed: processedCount, 
      errors 
    };
    
  } catch (error) {
    console.error('[seedTranslations] Fatal error:', error);
    throw error;
  }
}
