import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Languages, Loader2, CheckCircle, XCircle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface LanguageStats {
  total: number;
  translated: number;
  percentage: number;
}

interface InitialStats {
  totalQuestions: number;
  totalAnswers: number;
  languages: {
    en: LanguageStats;
    de: LanguageStats;
    fr: LanguageStats;
    es: LanguageStats;
    it: LanguageStats;
    pt: LanguageStats;
    nl: LanguageStats;
  };
}

export const QuestionTranslationManager = () => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [stats, setStats] = useState<{
    translated: number;
    skipped: number;
    errors: number;
  } | null>(null);
  const [initialStats, setInitialStats] = useState<InitialStats | null>(null);
  const [hasUntranslated, setHasUntranslated] = useState<boolean | null>(null);
  const [isCheckingContent, setIsCheckingContent] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Load initial statistics with per-language breakdown
  useEffect(() => {
    const loadInitialStats = async () => {
      try {
        setIsCheckingContent(true);

        const TARGET_LANGUAGES = ['en', 'de', 'fr', 'es', 'it', 'pt', 'nl'] as const;
        
        // Get total questions count
        const { count: totalQuestions, error: questionsError } = await supabase
          .from('questions')
          .select('id', { count: 'exact', head: true });

        if (questionsError || !totalQuestions) {
          console.error('[QuestionTranslationManager] Error fetching questions:', questionsError);
          return;
        }

        // Total answers = total questions * 3 (A, B, C)
        const totalAnswers = totalQuestions * 3;

        // Get per-language statistics
        const languageStats: Partial<InitialStats['languages']> = {};
        let hasAnyUntranslated = false;

        for (const lang of TARGET_LANGUAGES) {
          const { count: translatedCount, error } = await supabase
            .from('question_translations')
            .select('id', { count: 'exact', head: true })
            .eq('lang', lang);

          if (error) {
            console.error(`[QuestionTranslationManager] Error fetching ${lang} stats:`, error);
            continue;
          }

          const translated = translatedCount || 0;
          const total = totalQuestions;
          const percentage = total > 0 ? Math.round((translated / total) * 100) : 0;

          languageStats[lang] = {
            total,
            translated,
            percentage
          };

          if (translated < total) {
            hasAnyUntranslated = true;
          }
        }

        setInitialStats({
          totalQuestions,
          totalAnswers,
          languages: languageStats as InitialStats['languages']
        });

        setHasUntranslated(hasAnyUntranslated);

      } catch (error) {
        console.error('[QuestionTranslationManager] Exception loading stats:', error);
        setHasUntranslated(false);
      } finally {
        setIsCheckingContent(false);
      }
    };

    loadInitialStats();
  }, []);

  // This useEffect is now REMOVED - channel subscription happens in startTranslation BEFORE invoking edge function

  const startTranslation = async () => {
    try {
      setProgress(0);
      setStatus('Fordítás indítása...');
      setStats(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Admin session expired');
        return;
      }

      // CRITICAL: Subscribe to channel BEFORE setting isTranslating to ensure we catch all broadcasts
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
        })
        .subscribe();

      // Small delay to ensure subscription is active
      await new Promise(resolve => setTimeout(resolve, 500));

      // NOW set isTranslating to show loading state
      setIsTranslating(true);

      // ITERATIVE APPROACH: Invoke edge function repeatedly until all translations complete
      let continueProcessing = true;
      let iterationCount = 0;

      while (continueProcessing) {
        iterationCount++;
        console.log(`[QuestionTranslationManager] Starting iteration ${iterationCount}...`);

        const { data, error } = await supabase.functions.invoke('generate-question-translations', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });

        if (error) {
          console.error('[QuestionTranslationManager] Edge function error:', error);
          
          // Check if payment required (out of credits)
          const errorMessage = error.message || String(error);
          if (errorMessage.includes('credits exhausted') || errorMessage.includes('PAYMENT_REQUIRED')) {
            toast.error('Elfogytak a Lovable AI kredit-ek! Töltsd fel a workspace-t a Settings → Workspace → Usage menüpontban.', {
              duration: 8000,
            });
          } else {
            toast.error(`Hiba az ${iterationCount}. futás során`);
          }
          
          setIsTranslating(false);
          break;
        }

        console.log('[QuestionTranslationManager] Iteration complete:', data);

        // Check if there's more work to do
        const { data: remainingCheck } = await supabase
          .from('questions')
          .select('id')
          .limit(1);

        if (!remainingCheck || remainingCheck.length === 0) {
          continueProcessing = false;
          toast.success('Minden kérdés lefordítva!');
          setIsTranslating(false);
        } else {
          // Check if we actually have untranslated content remaining
          const { count: totalQuestions } = await supabase
            .from('questions')
            .select('id', { count: 'exact', head: true });

          const { count: totalTranslations } = await supabase
            .from('question_translations')
            .select('id', { count: 'exact', head: true })
            .in('lang', ['en', 'de', 'fr', 'es', 'it', 'pt', 'nl']);

          const expectedTranslations = (totalQuestions || 0) * 7;
          if ((totalTranslations || 0) >= expectedTranslations) {
            continueProcessing = false;
            toast.success('Minden kérdés lefordítva!');
            setIsTranslating(false);
          } else {
            // Wait 2 seconds between iterations
            console.log(`[QuestionTranslationManager] ${expectedTranslations - (totalTranslations || 0)} fordítás hiányzik még, folytatás...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }

    } catch (error) {
      console.error('[QuestionTranslationManager] Exception:', error);
      toast.error('Hiba történt a fordítás során');
    } finally {
      setIsTranslating(false);
      // Cleanup channel
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    }
  };

  const LANGUAGE_NAMES: Record<string, string> = {
    en: 'Angol',
    de: 'Német',
    fr: 'Francia',
    es: 'Spanyol',
    it: 'Olasz',
    pt: 'Portugál',
    nl: 'Holland'
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

      {/* Initial Statistics Display */}
      {initialStats && (
        <div className="mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">Összes kérdés:</span>
                <span className="text-lg font-bold text-purple-400">{initialStats.totalQuestions}</span>
              </div>
            </div>
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">Összes válasz:</span>
                <span className="text-lg font-bold text-purple-400">{initialStats.totalAnswers}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {Object.entries(initialStats.languages).map(([lang, langStats]) => (
              <div key={lang} className="p-3 bg-white/5 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{LANGUAGE_NAMES[lang]}:</span>
                  <span className="text-sm font-bold text-purple-400">{langStats.percentage}%</span>
                </div>
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>{langStats.translated} / {langStats.total} kérdés lefordítva</span>
                  <span>{langStats.total - langStats.translated} hátra</span>
                </div>
                <Progress value={langStats.percentage} className="h-1.5 mt-2" />
              </div>
            ))}
          </div>
        </div>
      )}

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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg cursor-help">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-white/60">Kihagyva</span>
                    <Info className="w-3 h-3 text-blue-400/60" />
                  </div>
                  <p className="text-xl font-bold text-blue-400">{stats.skipped}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ez nyelvfordításokat jelent (nem kérdéseket)</p>
                <p className="text-xs text-white/60 mt-1">Például: 1 kérdés × 7 nyelv = 7 fordítás</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
