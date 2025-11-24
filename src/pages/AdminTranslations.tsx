import AdminLayout from '@/components/admin/AdminLayout';
import { TranslationSeeder } from '@/components/TranslationSeeder';
import { QuestionTranslationManager } from '@/components/QuestionTranslationManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const AdminTranslations = () => {
  const [isShortening, setIsShortening] = useState(false);

  const handleShortenAnswers = async () => {
    setIsShortening(true);
    try {
      const { data, error } = await supabase.functions.invoke('shorten-long-answers');
      
      if (error) throw error;
      
      if (data?.success) {
        toast.success(`Sikeres rövidítés! ${data.totalSuccess} válasz frissítve.`);
      } else {
        toast.error(data?.error || 'Hiba történt a rövidítés során');
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
