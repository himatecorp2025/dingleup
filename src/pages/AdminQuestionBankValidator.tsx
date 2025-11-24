import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminQuestionBankValidator() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runValidation = async () => {
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('validate-question-bank');

      if (funcError) throw funcError;

      setReport(data);
      console.log('Question Bank Validation Report:', data);
    } catch (err) {
      console.error('Validation error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Kérdésbank Integritás Ellenőrzés</h1>
        <p className="text-white/70">Automatikus validáció: témakörönkénti darabszám, karakterhossz-korlátok, duplikációk</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Validáció Indítása</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Az ellenőrzés végigellenőrzi az összes témakört, megszámolja a kérdéseket,
              ellenőrzi a karakterhossz-korlátokat (kérdés ≤75, válasz ≤50),
              és felderíti a duplikációkat. Nem módosítja az adatbázist.
            </p>
            <Button
              onClick={runValidation}
              disabled={loading}
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ellenőrzés folyamatban...
                </>
              ) : (
                'Kérdésbank Ellenőrzés Indítása'
              )}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {report && (
          <Card>
            <CardHeader>
              <CardTitle>Validációs Riport</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-4 rounded font-mono text-xs overflow-auto max-h-[600px]">
                <pre>{JSON.stringify(report, null, 2)}</pre>
              </div>
              
              <div className="mt-4 text-sm text-muted-foreground">
                <p>A teljes riport elérhető a böngésző konzoljában is (F12 → Console)</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
