import AdminLayout from '@/components/admin/AdminLayout';
import { TranslationSeeder } from '@/components/TranslationSeeder';
import { QuestionTranslationManager } from '@/components/QuestionTranslationManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';
import { Loader2, Database } from 'lucide-react';

interface ProgressState {
  type: string;
  message: string;
  lang?: string;
  langName?: string;
  batchNum?: number;
  totalBatches?: number;
  processed?: number;
  total?: number;
  totalSuccess?: number;
  totalErrors?: number;
}

const AdminTranslations = () => {
  const [isShortening, setIsShortening] = useState(false);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [langProgress, setLangProgress] = useState<Record<string, { processed: number; total: number }>>({});
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  const handleGenerateMissingQuestions = async () => {
    setIsGeneratingQuestions(true);
    try {
      toast.info('Kérdések generálása elkezdődött...', {
        description: 'Ez több percig is eltarthat. Kérlek várj türelemmel.'
      });

      const { data, error } = await supabase.functions.invoke('generate-missing-questions');

      if (error) throw error;

      toast.success('Kérdések sikeresen generálva!', {
        description: `${data.questions_generated} kérdés létrehozva, ${data.questions_translated} fordítás készült`
      });

      if (data.errors?.length > 0) {
        console.warn('Errors during generation:', data.errors);
      }
    } catch (error) {
      console.error('Question generation error:', error);
      toast.error('Hiba történt a kérdések generálása során', {
        description: error instanceof Error ? error.message : 'Ismeretlen hiba'
      });
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleShortenAnswers = async () => {
    setIsShortening(true);
    setProgress(null);
    setLangProgress({});
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shorten-long-answers`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Stream error');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as ProgressState;
              setProgress(data);

              if (data.lang && data.processed !== undefined && data.total !== undefined) {
                setLangProgress(prev => ({
                  ...prev,
                  [data.lang!]: { processed: data.processed!, total: data.total! }
                }));
              }

              if (data.type === 'complete') {
                toast.success(`Kész! ${data.totalSuccess} válasz frissítve, ${data.totalErrors} hiba`);
              } else if (data.type === 'error') {
                toast.error(data.message);
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error shortening answers:', error);
      toast.error('Hiba történt a válaszok rövidítése során');
    } finally {
      setIsShortening(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Fordítások kezelése</h1>
          <p className="text-white/60">UI szövegek és játékkérdések fordítása 8 nyelvre</p>
        </div>

        <Tabs defaultValue="ui" className="w-full">
          <TabsList className="grid w-full max-w-3xl grid-cols-3 bg-white/5 border border-white/10">
            <TabsTrigger 
              value="ui"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/30 data-[state=active]:to-blue-600/30 data-[state=active]:text-white"
            >
              UI Fordítások
            </TabsTrigger>
            <TabsTrigger 
              value="questions"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/30 data-[state=active]:to-blue-600/30 data-[state=active]:text-white"
            >
              Kérdés Fordítások
            </TabsTrigger>
            <TabsTrigger 
              value="question-pools"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/30 data-[state=active]:to-blue-600/30 data-[state=active]:text-white"
            >
              Kérdés Poolok
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ui" className="mt-6">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-6">
              <TranslationSeeder />
            </div>
          </TabsContent>

          <TabsContent value="questions" className="mt-6 space-y-6">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-6">
              <QuestionTranslationManager />
            </div>

            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Válaszok rövidítése</h3>
              <p className="text-white/80 mb-4">
                Automatikusan lerövidíti az összes 50 karakternél hosszabb választ AI segítségével
              </p>
              
              {progress && (
                <div className="mb-4 space-y-3">
                  <div className="text-white font-semibold">{progress.message}</div>
                  
                  {Object.entries(langProgress).map(([lang, data]) => (
                    <div key={lang} className="space-y-1">
                      <div className="flex justify-between text-sm text-white/80">
                        <span>{lang}</span>
                        <span>{data.processed}/{data.total}</span>
                      </div>
                      <Progress value={(data.processed / data.total) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              )}
              
              <Button
                onClick={handleShortenAnswers}
                disabled={isShortening}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isShortening ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rövidítés folyamatban...
                  </>
                ) : (
                  'Hosszú válaszok rövidítése'
                )}
              </Button>
            </div>

            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Kérdés Poolok Regenerálása</h3>
              <p className="text-white/80 mb-4">
                Újragenerálja a "mixed" témakör kérdés pool-jait. Minden pool eltérő kérdéseket tartalmaz, így biztosítva a változatosságot.
              </p>
              
              <Button
                onClick={async () => {
                  try {
                    toast.loading('Pool regenerálás folyamatban...');
                    const { data: { session } } = await supabase.auth.getSession();
                    
                    const { data, error } = await supabase.functions.invoke('regenerate-question-pools', {
                      headers: { Authorization: `Bearer ${session?.access_token}` },
                      body: { topicId: 'mixed' }
                    });

                    if (error) throw error;
                    
                    toast.dismiss();
                    toast.success(`Pool regenerálás sikeres! ${data.poolsCreated} pool létrehozva ${data.totalQuestions} kérdésből`);
                  } catch (error) {
                    toast.dismiss();
                    console.error('Error regenerating pools:', error);
                    toast.error('Hiba történt a pool regenerálás során');
                  }
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                Mixed Poolok Regenerálása
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="question-pools" className="mt-6 space-y-6">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">1. Kérdésbank Feltöltése</h3>
              <p className="text-white/80 mb-4">
                Generál új kérdéseket minden témakörbe (150 db/téma célszám), automatikusan lefordítja őket minden nyelvre.
              </p>
              
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-6">
                <h4 className="text-white font-semibold mb-2">⚠️ Fontos információk:</h4>
                <ul className="text-white/70 text-sm space-y-1">
                  <li>• AI-val generál hiányzó kérdéseket témakörönként</li>
                  <li>• Automatikusan lefordítja minden nyelvre (8 nyelv)</li>
                  <li>• Betartja a karakterszám korlátokat (max 120 char kérdés, max 50 char válasz)</li>
                  <li>• Ez TÖBB PERCIG is eltarthat, legyél türelmes!</li>
                </ul>
              </div>
              
              <Button
                onClick={handleGenerateMissingQuestions}
                disabled={isGeneratingQuestions}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 mb-8"
              >
                {isGeneratingQuestions ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kérdések generálása és fordítása...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Hiányzó Kérdések Generálása + Fordítás
                  </>
                )}
              </Button>
            </div>

            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">2. Kérdés Poolok Regenerálása</h3>
              <p className="text-white/80 mb-4">
                Újragenerálja az összes kérdés pool-jait. Minden pool eltérő kérdéseket tartalmaz, így biztosítva a változatosságot.
                A rendszer automatikusan optimalizált a nagy terhelésre - akár 25.000 játékos/perc kiszolgálására is képes.
              </p>
              
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 mb-6">
                <h4 className="text-white font-semibold mb-2">📊 Pool rendszer működése:</h4>
                <ul className="text-white/70 text-sm space-y-1">
                  <li>• Minden pool különböző kérdéseket tartalmaz</li>
                  <li>• Játékosok rotációban kapják a poolokat</li>
                  <li>• Soha nem kapnak kétszer ugyanazt egymás után</li>
                  <li>• Automatikus cache 5 perc TTL-lel</li>
                </ul>
              </div>
              
              <Button
                onClick={async () => {
                  try {
                    toast.loading('Pool regenerálás folyamatban...');
                    const { data: { session } } = await supabase.auth.getSession();
                    
                    const { data, error } = await supabase.functions.invoke('regenerate-question-pools', {
                      headers: { Authorization: `Bearer ${session?.access_token}` },
                      body: { topicId: 'all' }
                    });

                    if (error) throw error;
                    
                    toast.dismiss();
                    toast.success(`Pool regenerálás sikeres! ${data.poolsCreated} pool létrehozva ${data.totalQuestions} kérdésből`);
                  } catch (error) {
                    toast.dismiss();
                    console.error('Error regenerating pools:', error);
                    toast.error('Hiba történt a pool regenerálás során');
                  }
                }}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Database className="mr-2 h-4 w-4" />
                Összes Pool Regenerálása
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminTranslations;
