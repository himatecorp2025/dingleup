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
    total: number;
    success: number;
    errors: number;
  } | null>(null);
  const [initialStats, setInitialStats] = useState<InitialStats | null>(null);
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
          .select('*', { count: 'exact', head: true });

        if (questionsError || !totalQuestions) {
          console.error('[QuestionTranslationManager] Error fetching questions:', questionsError);
          return;
        }

        // Total answers = total questions * 3 (A, B, C)
        const totalAnswers = totalQuestions * 3;

        // Get per-language statistics
        const languageStats: Partial<InitialStats['languages']> = {};

        for (const lang of TARGET_LANGUAGES) {
          const { count: translatedCount, error } = await supabase
            .from('question_translations')
            .select('*', { count: 'exact', head: true })
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
        }

        setInitialStats({
          totalQuestions,
          totalAnswers,
          languages: languageStats as InitialStats['languages']
        });

      } catch (error) {
        console.error('[QuestionTranslationManager] Exception loading stats:', error);
      } finally {
        setIsCheckingContent(false);
      }
    };

    loadInitialStats();
  }, []);

  const startTranslation = async () => {
    try {
      setIsTranslating(true);
      setProgress(0);
      setStatus('Csonka fordítások keresése...');
      setStats(null);

      // CRITICAL: Refresh session to ensure valid JWT token
      let { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError || !session) {
        console.error('[QuestionTranslationManager] Session refresh failed:', sessionError);
        toast.error('Admin munkamenet lejárt, kérlek jelentkezz be újra');
        setIsTranslating(false);
        return;
      }

      console.log('[QuestionTranslationManager] Starting truncated translations scan and re-translation');

      // Single invocation - scans ALL question_translations, finds truncated, deletes, and re-translates
      setStatus('Csonka fordítások törlése és újrafordítása...');
      setProgress(10);

      const { data, error } = await supabase.functions.invoke('generate-question-translations', {
        body: {}, // No parameters needed - scans entire table
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) {
        console.error('[QuestionTranslationManager] Translation error:', error);
        toast.error('Hiba történt a fordítás közben');
        setStatus('Hiba történt');
        setIsTranslating(false);
        return;
      }

      console.log('[QuestionTranslationManager] Translation response:', data);

      if (data?.phase === 'scan' && data?.stats?.totalTruncated === 0) {
        setProgress(100);
        setStatus('Nincs csonka fordítás!');
        toast.success('Minden kérdés fordítása teljes és rendben van!');
        setStats({
          total: 0,
          success: 0,
          errors: 0
        });
        setIsTranslating(false);
        return;
      }

      setProgress(50);

      if (data?.stats) {
        const totalSuccess = data.stats.retranslated || 0;
        const totalErrors = data.stats.errors || 0;
        const totalTruncated = data.stats.totalTruncated || 0;

        setProgress(100);
        setStatus('Fordítás befejezve!');
        setStats({
          total: totalTruncated,
          success: totalSuccess,
          errors: totalErrors
        });

        if (totalTruncated > 0) {
          toast.success(`${totalTruncated} csonka fordítás törölve és újrafordítva! ${totalSuccess} sikeres.`);
        }

        if (totalErrors > 0) {
          toast.warning(`${totalErrors} hiba történt a fordítás során.`);
        }
      } else {
        setProgress(100);
        setStatus('Ismeretlen eredmény');
        toast.warning('A fordítás eredménye nem ismert');
      }

    } catch (error) {
      console.error('[QuestionTranslationManager] Exception:', error);
      toast.error('Váratlan hiba történt');
      setStatus('Váratlan hiba');
    } finally {
      setIsTranslating(false);
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
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Languages className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-white/60">Összesen</span>
            </div>
            <p className="text-xl font-bold text-purple-400">{stats.total}</p>
          </div>
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-xs text-white/60">Sikeres</span>
            </div>
            <p className="text-xl font-bold text-green-400">{stats.success}</p>
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

      <Button
        onClick={startTranslation}
        disabled={isTranslating || isCheckingContent}
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
        ) : (
          <>
            <Languages className="w-4 h-4 mr-2" />
            Hiányzó fordítások generálása
          </>
        )}
      </Button>
    </div>
  );
};