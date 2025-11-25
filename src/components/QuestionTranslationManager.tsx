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
  const [translationStats, setTranslationStats] = useState<{
    totalMissing: number;
    totalSuccess: number;
    totalErrors: number;
  } | null>(null);
  const [initialStats, setInitialStats] = useState<InitialStats | null>(null);
  const [isCheckingContent, setIsCheckingContent] = useState(true);

  const LANGUAGE_NAMES: Record<string, string> = {
    en: 'Angol',
    de: 'Német',
    fr: 'Francia',
    es: 'Spanyol',
    it: 'Olasz',
    pt: 'Portugál',
    nl: 'Holland'
  };

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
      setStatus('Fordítás indítása...');
      setTranslationStats(null);
      
      // Process languages one by one
      const languages = ['en', 'de', 'fr', 'es', 'it', 'pt', 'nl'];
      let totalSuccess = 0;
      let totalErrors = 0;
      
      for (let i = 0; i < languages.length; i++) {
        const lang = languages[i];
        const langName = LANGUAGE_NAMES[lang];
        
        setStatus(`${langName} fordítása (${i + 1}/${languages.length})...`);
        
        // Refresh session first
        const { error: sessionError } = await supabase.auth.refreshSession();
        if (sessionError) {
          console.error('Session refresh error:', sessionError);
          toast.error('Session frissítési hiba');
          setIsTranslating(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error('Nincs aktív session');
          setIsTranslating(false);
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-question-translations`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ targetLang: lang }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'progress') {
                  if (data.processed !== undefined && data.total !== undefined) {
                    const langProgress = (data.processed / data.total) * 100;
                    const overallProgress = ((i + (langProgress / 100)) / languages.length) * 100;
                    setProgress(overallProgress);
                  }
                  setStatus(data.message || 'Folyamatban...');
                } else if (data.type === 'complete') {
                  totalSuccess += data.totalSuccess || 0;
                  totalErrors += data.totalErrors || 0;
                  
                  const overallProgress = ((i + 1) / languages.length) * 100;
                  setProgress(overallProgress);
                  
                  setStatus(data.message || 'Kész!');
                  
                  if (data.totalRemaining && data.totalRemaining > 0) {
                    setStatus(`${langName} kész, folytatás...`);
                  }
                } else if (data.type === 'error') {
                  setStatus(data.message || 'Hiba történt');
                  toast.error(data.message || 'Fordítási hiba');
                  throw new Error(data.message);
                }
              } catch (e) {
                console.error('Failed to parse SSE data:', e);
              }
            }
          }
        }
      }
      
      // All languages completed
      setTranslationStats({
        totalMissing: 0,
        totalSuccess: totalSuccess,
        totalErrors: totalErrors,
      });
      setProgress(100);
      setStatus('Minden fordítás kész!');
      toast.success(`Fordítás befejezve! ${totalSuccess} sikeres, ${totalErrors} hiba`);
      
    } catch (error) {
      console.error('Translation error:', error);
      toast.error(error instanceof Error ? error.message : 'Fordítási hiba történt');
      setStatus('Hiba történt');
    } finally {
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
        Magyar nyelvről történő AI-alapú automatikus fordítás mind a 7 célnyelvre (angol, német, francia, spanyol, olasz, portugál, holland).
        A folyamat a teljes kérdésbázist nyelvenként dolgozza fel. Várható időtartam: 20-40 perc.
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
            <p className="text-sm font-semibold text-purple-400">{Math.round(progress)}%</p>
          </div>
        </div>
      )}

      {translationStats && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-xs text-white/60">Sikeres</span>
            </div>
            <p className="text-xl font-bold text-green-400">{translationStats.totalSuccess}</p>
          </div>
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-white/60">Hibák</span>
            </div>
            <p className="text-xl font-bold text-red-400">{translationStats.totalErrors}</p>
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
            Fordítás magyarról 7 célnyelvre
          </>
        )}
      </Button>
    </div>
  );
};