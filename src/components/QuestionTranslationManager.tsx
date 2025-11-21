import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Languages, Loader2, CheckCircle, XCircle } from 'lucide-react';
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
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Subscribe to real-time progress updates
  useEffect(() => {
    if (!isTranslating) return;

    const channel = supabase.channel('question-translation-progress');
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'progress' }, (payload: any) => {
        console.log('[QuestionTranslationManager] Progress update:', payload);
        setProgress(payload.payload.progress || 0);
        setStatus(payload.payload.status || '');
        if (payload.payload.translated !== undefined) {
          setStats({
            translated: payload.payload.translated,
            skipped: payload.payload.skipped,
            errors: payload.payload.errors
          });
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

      // Edge function will broadcast progress via channel
      const { data, error } = await supabase.functions.invoke('generate-question-translations', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) {
        console.error('[QuestionTranslationManager] Error:', error);
        toast.error('Hiba történt a fordítás közben');
        setStatus('Hiba történt');
        setIsTranslating(false);
        return;
      }

      // Final state will be set by broadcast, but ensure completion
      if (data.translated !== undefined) {
        setProgress(100);
        setStatus('Fordítás befejezve!');
        setStats({
          translated: data.translated || 0,
          skipped: data.skipped || 0,
          errors: data.errors?.length || 0
        });
      }

      toast.success(`Fordítás sikeres! ${data.translated} új fordítás létrehozva.`);

      if (data.errors && data.errors.length > 0) {
        console.warn('[QuestionTranslationManager] Errors:', data.errors);
        toast.warning(`${data.errors.length} hiba történt a fordítás során. Ellenőrizd a console-t.`);
      }

    } catch (error) {
      console.error('[QuestionTranslationManager] Exception:', error);
      toast.error('Váratlan hiba történt');
      setStatus('Váratlan hiba');
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

      <Button
        onClick={startTranslation}
        disabled={isTranslating}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
      >
        {isTranslating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Fordítás folyamatban...
          </>
        ) : (
          <>
            <Languages className="w-4 h-4 mr-2" />
            Kérdések fordítása
          </>
        )}
      </Button>
    </div>
  );
};
