import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Languages, Loader2, CheckCircle, XCircle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { RealtimeChannel } from '@supabase/supabase-js';

export const QuestionTranslationManager = () => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [stats, setStats] = useState<{
    translated: number;
    skipped: number;
    errors: number;
  } | null>(null);
  const [hasUntranslated, setHasUntranslated] = useState<boolean | null>(null);
  const [isCheckingContent, setIsCheckingContent] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Check if there are untranslated questions
  useEffect(() => {
    const checkUntranslatedQuestions = async () => {
      try {
        setIsCheckingContent(true);

        // OPTIMIZED: Single aggregated query instead of 2748 separate queries
        const TARGET_LANGUAGES = ['en', 'de', 'fr', 'es', 'it', 'pt', 'nl'];
        
        // Get total questions count
        const { count: totalQuestions, error: questionsError } = await supabase
          .from('questions')
          .select('id', { count: 'exact', head: true });

        if (questionsError || !totalQuestions) {
          setHasUntranslated(false);
          return;
        }

        // Count translations for each target language
        const { count: totalTranslations, error: translationsError } = await supabase
          .from('question_translations')
          .select('id', { count: 'exact', head: true })
          .in('lang', TARGET_LANGUAGES);

        if (translationsError) {
          setHasUntranslated(false);
          return;
        }

        // Calculate expected translations (totalQuestions * 7 languages)
        const expectedTranslations = totalQuestions * TARGET_LANGUAGES.length;
        const hasUntranslated = (totalTranslations || 0) < expectedTranslations;

        setHasUntranslated(hasUntranslated);

        if (hasUntranslated) {
          console.log(`[QuestionTranslationManager] Untranslated questions found: ${expectedTranslations - (totalTranslations || 0)} translations missing`);
        }

      } catch (error) {
        console.error('[QuestionTranslationManager] Error checking content:', error);
        setHasUntranslated(false);
      } finally {
        setIsCheckingContent(false);
      }
    };

    checkUntranslatedQuestions();
  }, []);

  // Subscribe to real-time progress updates
  useEffect(() => {
    if (!isTranslating) return;

    const channel = supabase.channel('question-translation-progress');
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'progress' }, (payload: any) => {
        console.log('[QuestionTranslationManager] Progress update:', payload);
        const newProgress = payload.payload.progress || 0;
        const newStatus = payload.payload.status || '';
        setProgress(newProgress);
        setStatus(newStatus);
        if (payload.payload.translated !== undefined) {
          setStats({
            translated: payload.payload.translated,
            skipped: payload.payload.skipped,
            errors: payload.payload.errors
          });
        }
        
        // Ha befejezett, állítsuk le a loading állapotot
        if (newProgress === 100 || newStatus.includes('befejezve')) {
          setIsTranslating(false);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [isTranslating]);

  const startTranslation = async () => {
    try {
      setIsTranslating(true);
      setProgress(0);
      setStatus('Fordítás indítása...');
      setStats(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Admin session expired');
        setIsTranslating(false);
        return;
      }

      // FIRE AND FORGET: Don't wait for response, just monitor broadcast channel
      // The edge function will take 15-20 minutes to complete, which exceeds timeout
      supabase.functions.invoke('generate-question-translations', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      }).then(({ data, error }) => {
        if (error) {
          console.error('[QuestionTranslationManager] Edge function error:', error);
          // Don't show error to user if it's timeout - real-time updates will continue
          if (error.message && !error.message.includes('Failed to send')) {
            toast.error('Hiba történt a fordítás indításakor');
            setIsTranslating(false);
          }
          return;
        }

        // Final success confirmation (if edge function completes before timeout)
        console.log('[QuestionTranslationManager] Edge function completed:', data);
        if (data?.translated !== undefined) {
          toast.success(`Fordítás befejezve! ${data.translated} új fordítás létrehozva.`);
        }
      });

      // Show confirmation that translation started
      toast.info('Fordítás elindítva! Figyeld a folyamatjelzőt a valós idejű frissítésekhez.');

    } catch (error) {
      console.error('[QuestionTranslationManager] Exception:', error);
      toast.error('Hiba történt a fordítás indításakor');
      setIsTranslating(false);
    }
  };

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl p-4 lg:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <Languages className="w-5 h-5 text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Kérdés Fordítások</h3>
      </div>

      <p className="text-sm text-white/60 mb-4">
        AI-alapú automatikus fordítás generálása mind a 7 támogatott nyelvre (angol, német, francia, spanyol, olasz, portugál, holland).
        A folyamat eltarthat néhány percig.
      </p>

      {status && (
        <div className="mb-4 p-3 bg-white/5 rounded-lg">
          <p className="text-sm text-white/80">{status}</p>
        </div>
      )}

      {isTranslating && (
        <div className="mb-4">
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-white/50">Folyamat:</p>
            <p className="text-sm font-semibold text-purple-400">{progress}%</p>
          </div>
        </div>
      )}

      {stats && (
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-xs text-white/60">Lefordítva</span>
            </div>
            <p className="text-xl font-bold text-green-400">{stats.translated}</p>
          </div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-white/60">Kihagyva</span>
            </div>
            <p className="text-xl font-bold text-blue-400">{stats.skipped}</p>
          </div>
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-white/60">Hibák</span>
            </div>
            <p className="text-xl font-bold text-red-400">{stats.errors}</p>
          </div>
        </div>
      )}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-full">
              <Button
                onClick={startTranslation}
                disabled={isTranslating || isCheckingContent || !hasUntranslated}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCheckingContent ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Tartalom ellenőrzése...
                  </>
                ) : isTranslating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Fordítás folyamatban...
                  </>
                ) : !hasUntranslated ? (
                  <>
                    <Info className="w-4 h-4 mr-2" />
                    Nincs fordítandó kérdés
                  </>
                ) : (
                  <>
                    <Languages className="w-4 h-4 mr-2" />
                    Kérdések fordítása
                  </>
                )}
              </Button>
            </div>
          </TooltipTrigger>
          {!hasUntranslated && !isCheckingContent && (
            <TooltipContent>
              <p>Minden kérdés már le van fordítva mind a 7 nyelvre</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
