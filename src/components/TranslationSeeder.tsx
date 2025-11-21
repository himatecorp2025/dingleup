import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Languages, Loader2, CheckCircle, XCircle } from 'lucide-react';

export const TranslationSeeder = () => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [stats, setStats] = useState<{
    total: number;
    success: number;
    errors: number;
  } | null>(null);

  const startTranslation = async () => {
    try {
      setIsTranslating(true);
      setProgress(0);
      setStatus('UI fordítás indítása...');
      setStats(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Admin session expired');
        return;
      }

      setStatus('UI szövegek fordítása folyamatban... Ez eltarthat néhány percig.');
      setProgress(10);

      // Fetch all translations that need translation (only hu column filled)
      const { data: translations, error: fetchError } = await supabase
        .from('translations')
        .select('key, hu')
        .order('key');

      if (fetchError) {
        console.error('[TranslationSeeder] Fetch error:', fetchError);
        toast.error('Hiba a fordítandó szövegek lekérésekor');
        setStatus('Hiba történt');
        return;
      }

      if (!translations || translations.length === 0) {
        toast.info('Nincs fordítandó szöveg');
        setStatus('Nincs fordítandó szöveg');
        return;
      }

      setProgress(20);
      setStatus(`${translations.length} szöveg fordítása...`);

      // Call translate-text-batch edge function
      const TARGET_LANGUAGES = ['en', 'de', 'fr', 'es', 'it', 'pt', 'nl'];
      const items = translations.map(t => ({ key: t.key, hu: t.hu }));

      const { data, error } = await supabase.functions.invoke('translate-text-batch', {
        body: { items, targetLanguages: TARGET_LANGUAGES },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) {
        console.error('[TranslationSeeder] Translation error:', error);
        toast.error('Hiba történt a fordítás közben');
        setStatus('Hiba történt');
        return;
      }

      setProgress(60);
      setStatus('Fordítások mentése az adatbázisba...');

      // Update translations in database
      let successCount = 0;
      let errorCount = 0;

      for (const result of data.results) {
        if (result.error) {
          errorCount++;
          continue;
        }

        const { error: updateError } = await supabase
          .from('translations')
          .update({
            en: result.translations.en || null,
            de: result.translations.de || null,
            fr: result.translations.fr || null,
            es: result.translations.es || null,
            it: result.translations.it || null,
            pt: result.translations.pt || null,
            nl: result.translations.nl || null,
          })
          .eq('key', result.key);

        if (updateError) {
          console.error('[TranslationSeeder] Update error:', updateError);
          errorCount++;
        } else {
          successCount++;
        }
      }

      setProgress(100);
      setStatus('Fordítás befejezve!');
      setStats({
        total: translations.length,
        success: successCount,
        errors: errorCount
      });

      toast.success(`UI fordítás sikeres! ${successCount} szöveg lefordítva.`);

      if (errorCount > 0) {
        toast.warning(`${errorCount} hiba történt a fordítás során.`);
      }

    } catch (error) {
      console.error('[TranslationSeeder] Exception:', error);
      toast.error('Váratlan hiba történt');
      setStatus('Váratlan hiba');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl p-4 lg:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Languages className="w-5 h-5 text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">UI Fordítások</h3>
      </div>

      <p className="text-sm text-white/60 mb-4">
        AI-alapú automatikus fordítás generálása az összes UI szövegre mind a 7 támogatott nyelvre (angol, német, francia, spanyol, olasz, portugál, holland).
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
          <p className="text-xs text-white/50 mt-2">Kérlek várj, a fordítás folyamatban van...</p>
        </div>
      )}

      {stats && (
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Languages className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-white/60">Összesen</span>
            </div>
            <p className="text-xl font-bold text-blue-400">{stats.total}</p>
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
        disabled={isTranslating}
        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
      >
        {isTranslating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Fordítás folyamatban...
          </>
        ) : (
          <>
            <Languages className="w-4 h-4 mr-2" />
            UI Szövegek fordítása
          </>
        )}
      </Button>
    </div>
  );
};
