import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { seedTranslationsWithAI } from '@/utils/seedTranslations';
import { toast } from 'sonner';
import { Loader2, Languages, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';

interface LanguageStats {
  code: string;
  name: string;
  total: number;
  translated: number;
  pending: number;
  percentage: number;
}

interface ErrorKey {
  key: string;
  error: string;
}

/**
 * Real-time admin monitor for UI translation status with language-level analytics
 * Maximum performance batch translation with live progress tracking
 */
export const TranslationSeeder: React.FC = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [progress, setProgress] = useState('');
  const [overallStats, setOverallStats] = useState<{ total: number; pending: number } | null>(null);
  const [languageStats, setLanguageStats] = useState<LanguageStats[]>([]);
  const [errorKeys, setErrorKeys] = useState<ErrorKey[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'de', name: 'German' },
    { code: 'fr', name: 'French' },
    { code: 'es', name: 'Spanish' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'nl', name: 'Dutch' },
  ];

  useEffect(() => {
    fetchDetailedStats();
    
    // Real-time subscription for instant stats updates (zero delay)
    const channel = supabase
      .channel('translation-stats-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'translations'
        },
        () => {
          fetchDetailedStats();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDetailedStats = async () => {
    setIsLoadingStats(true);
    try {
      // Fetch all translations for detailed analysis
      const { data: translations, error } = await supabase
        .from('translations')
        .select('key, hu, en, de, fr, es, it, pt, nl')
        .not('hu', 'is', null);

      if (error) throw error;
      if (!translations) return;

      const total = translations.length;
      let overallPending = 0;
      const langStats: LanguageStats[] = [];

      // Calculate per-language statistics
      for (const lang of LANGUAGES) {
        const langCode = lang.code;
        const translated = translations.filter(t => t[langCode as keyof typeof t]).length;
        const pending = total - translated;
        
        langStats.push({
          code: langCode,
          name: lang.name,
          total,
          translated,
          pending,
          percentage: total > 0 ? Math.round((translated / total) * 100) : 0
        });

        overallPending += pending;
      }

      setLanguageStats(langStats);
      setOverallStats({
        total,
        pending: translations.filter(t => 
          !t.en || !t.de || !t.fr || !t.es || !t.it || !t.pt || !t.nl
        ).length
      });

    } catch (error) {
      console.error('Error fetching translation stats:', error);
      toast.error('Statisztikák betöltése sikertelen');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    setProgress('Fordítás indítása...');
    setErrorKeys([]);
    
    try {
      const result = await seedTranslationsWithAI();
      
      if (result.success) {
        toast.success(`Fordítás kész! ${result.processed} kulcs lefordítva.`);
        setProgress(`✓ Befejezve: ${result.processed} kulcs`);
        
        if (result.errors && result.errors.length > 0) {
          setErrorKeys(result.errors.map(err => ({ key: 'batch', error: err })));
          toast.warning(`${result.errors.length} hiba történt - részletek alább`);
        }
      }
      
      await fetchDetailedStats();
    } catch (error) {
      console.error('Seeding error:', error);
      toast.error('Fordítási hiba történt');
      setProgress('❌ Hiba történt');
    } finally {
      setIsSeeding(false);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="p-6 bg-background border border-border rounded-lg max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Languages className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-bold">UI Fordítási Analitika (Real-time)</h3>
        </div>
        {isSeeding && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Fordítás folyamatban...</span>
          </div>
        )}
      </div>

      {/* Overall Summary */}
      {isLoadingStats ? (
        <div className="flex items-center gap-2 mb-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Statisztikák betöltése...</span>
        </div>
      ) : overallStats && (
        <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Összes UI kulcs</span>
              <span className="text-2xl font-bold">{overallStats.total}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Teljesen lefordítva</span>
              <span className="text-2xl font-bold text-green-600">
                {overallStats.total - overallStats.pending}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Hiányzik fordítás</span>
              <span className="text-2xl font-bold text-orange-500">{overallStats.pending}</span>
            </div>
          </div>
          
          {overallStats.pending === 0 && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950/20 p-3 rounded-md">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">Minden UI szöveg le van fordítva minden nyelvre!</span>
            </div>
          )}
        </div>
      )}

      {/* Per-Language Progress Bars */}
      <div className="mb-6 space-y-4">
        <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Nyelvenként (Real-time)
        </h4>
        
        {languageStats.map(lang => (
          <div key={lang.code} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold uppercase">{lang.code}</span>
                <span className="text-sm text-muted-foreground">({lang.name})</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono">
                  {lang.translated}/{lang.total}
                </span>
                <span className={`text-sm font-bold ${lang.percentage >= 90 ? 'text-green-600' : lang.percentage >= 70 ? 'text-blue-600' : 'text-orange-500'}`}>
                  {lang.percentage}%
                </span>
              </div>
            </div>
            <Progress 
              value={lang.percentage} 
              className="h-2"
            />
          </div>
        ))}
      </div>

      {/* Error Keys List */}
      {errorKeys.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h4 className="font-semibold text-red-900 dark:text-red-100">
              Hibás vagy hiányzó fordítások ({errorKeys.length})
            </h4>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {errorKeys.map((err, idx) => (
              <div key={idx} className="text-xs font-mono bg-white dark:bg-gray-900 p-2 rounded border border-red-200 dark:border-red-800">
                <span className="text-red-700 dark:text-red-300">{err.key}</span>
                <span className="text-muted-foreground ml-2">- {err.error}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Message */}
      {progress && (
        <p className="text-sm font-medium mb-4 text-primary">
          {progress}
        </p>
      )}

      {/* Action Button */}
      <Button 
        onClick={handleSeed} 
        disabled={isSeeding || (overallStats?.pending === 0)}
        className="w-full"
        size="lg"
      >
        {isSeeding && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        {overallStats?.pending === 0 ? (
          <>
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Minden UI szöveg lefordítva
          </>
        ) : (
          isSeeding ? 'Batch fordítás folyamatban...' : 'Hiányzó UI-fordítások generálása (30 kulcs/batch)'
        )}
      </Button>

      {overallStats && overallStats.pending > 0 && (
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Becsült idő: ~{Math.ceil(overallStats.pending / 30)} batch (~{Math.ceil(overallStats.pending / 30 * 3)} másodperc)
        </p>
      )}
    </div>
  );
};
