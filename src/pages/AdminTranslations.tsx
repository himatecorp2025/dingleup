import AdminLayout from '@/components/admin/AdminLayout';
import { TranslationSeeder } from '@/components/TranslationSeeder';
import { QuestionTranslationManager } from '@/components/QuestionTranslationManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

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
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-white/5 border border-white/10">
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
                Automatikusan lerövidíti az összes 61 karakternél hosszabb választ AI segítségével (554 válasz)
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
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminTranslations;
