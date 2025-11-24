import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { RefreshCw, Database, PlayCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PoolStats {
  topic_id: number;
  topic_name: string;
  total_pools: number;
  total_questions: number;
  avg_questions_per_pool: number;
  min_questions: number;
  max_questions: number;
}

interface Topic {
  id: number;
  name: string;
}

export default function AdminQuestionPools() {
  const [poolStats, setPoolStats] = useState<PoolStats[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState<number | null>(null);

  useEffect(() => {
    loadTopicsAndStats();
  }, []);

  const loadTopicsAndStats = async () => {
    setLoading(true);
    try {
      // Load all topics from database
      const { data: topicsData, error: topicsError } = await supabase
        .from('topics')
        .select('id, name')
        .order('id');

      if (topicsError) throw topicsError;
      setTopics(topicsData || []);

      // Get pool statistics per topic
      const { data: pools, error } = await supabase
        .from('question_pools')
        .select('topic_id, question_count')
        .returns<{ topic_id: number; question_count: number }[]>();

      if (error) throw error;

      // Get question counts per topic
      const { data: questions, error: qError } = await supabase
        .from('questions')
        .select('topic_id')
        .returns<{ topic_id: number }[]>();

      if (qError) throw qError;

      // Calculate stats for ALL topics (27 total)
      const stats: PoolStats[] = (topicsData || []).map(topic => {
        const topicPools = pools?.filter(p => p.topic_id === topic.id) || [];
        const topicQuestions = questions?.filter(q => q.topic_id === topic.id) || [];
        
        const questionCounts = topicPools.map(p => p.question_count || 0);
        
        return {
          topic_id: topic.id,
          topic_name: topic.name,
          total_pools: topicPools.length,
          total_questions: topicQuestions.length,
          avg_questions_per_pool: questionCounts.length > 0 
            ? Math.round(questionCounts.reduce((a, b) => a + b, 0) / questionCounts.length)
            : 0,
          min_questions: questionCounts.length > 0 ? Math.min(...questionCounts) : 0,
          max_questions: questionCounts.length > 0 ? Math.max(...questionCounts) : 0,
        };
      });

      setPoolStats(stats);
    } catch (error) {
      console.error('Error loading pool stats:', error);
      toast.error('Hiba a pool statisztikák betöltésekor');
    } finally {
      setLoading(false);
    }
  };

  const regeneratePools = async (topicId: number) => {
    setRegenerating(topicId);
    try {
      const { data, error } = await supabase.functions.invoke('regenerate-question-pools', {
        body: { topic_id: topicId },
      });

      if (error) throw error;

      toast.success(`${data.pools_created} pool létrehozva (Topic ID: ${topicId})`);
      await loadTopicsAndStats();
    } catch (error) {
      console.error('Error regenerating pools:', error);
      toast.error(`Hiba a poolok generálásakor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setRegenerating(null);
    }
  };

  const regenerateAllPools = async () => {
    setRegenerating(-1);
    const allTopicIds = topics.map(t => t.id);
    
    try {
      let successCount = 0;
      for (const topicId of allTopicIds) {
        try {
          const { data, error } = await supabase.functions.invoke('regenerate-question-pools', {
            body: { topic_id: topicId },
          });
          if (!error) successCount++;
        } catch (err) {
          console.error(`Failed to regenerate pools for topic ${topicId}:`, err);
        }
      }
      toast.success(`${successCount}/${allTopicIds.length} témakör pooljai újragenerálva`);
      await loadTopicsAndStats();
    } catch (error) {
      console.error('Error regenerating all pools:', error);
      toast.error('Hiba történt az újragenerálás során');
    } finally {
      setRegenerating(null);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Question Pools (Kérdésbázis)</h1>
            <p className="text-muted-foreground mt-1">
              27 témakör × 40 pool × ~500 kérdés/pool = rotációs kérdésbetöltés
            </p>
          </div>
          <Button 
            onClick={regenerateAllPools}
            disabled={regenerating !== null}
            size="lg"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${regenerating === -1 ? 'animate-spin' : ''}`} />
            Összes Pool Újragenerálása
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Pool Rendszer Áttekintés
            </CardTitle>
            <CardDescription>
              Mind a 27 témakör 40 pool-ra van osztva (~500 kérdés/pool). Pool-rotáció: 1→2→3→...→40→1
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Betöltés...
                </div>
              ) : poolStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Még nincs egyetlen pool sem generálva. Kattints a gombra a poolok létrehozásához.
                </div>
              ) : (
                poolStats.map(stat => (
                  <Card key={stat.topic_id} className="bg-muted/30">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl">{stat.topic_name}</CardTitle>
                          <CardDescription className="mt-1">
                            Topic ID: {stat.topic_id}
                          </CardDescription>
                        </div>
                        <Button
                          onClick={() => regeneratePools(stat.topic_id)}
                          disabled={regenerating !== null}
                          variant="outline"
                        >
                          <RefreshCw 
                            className={`mr-2 h-4 w-4 ${regenerating === stat.topic_id ? 'animate-spin' : ''}`} 
                          />
                          Újragenerálás
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                          <div className="text-2xl font-bold">{stat.total_pools}</div>
                          <div className="text-sm text-muted-foreground">Poolok száma</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{stat.total_questions}</div>
                          <div className="text-sm text-muted-foreground">Összes kérdés</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{stat.avg_questions_per_pool}</div>
                          <div className="text-sm text-muted-foreground">Átlag kérdés/pool</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{stat.min_questions}</div>
                          <div className="text-sm text-muted-foreground">Min kérdés/pool</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{stat.max_questions}</div>
                          <div className="text-sm text-muted-foreground">Max kérdés/pool</div>
                        </div>
                      </div>
                      
                      {stat.total_pools === 0 && (
                        <Badge variant="destructive" className="mt-4">
                          Nincs pool generálva - kattints az újragenerálás gombra
                        </Badge>
                      )}
                      {stat.total_pools > 0 && stat.min_questions < 15 && (
                        <Badge variant="outline" className="mt-4 border-yellow-500 text-yellow-600">
                          Figyelem: Néhány pool kevés kérdést tartalmaz (&lt;15)
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5" />
              Pool Rotációs Rendszer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>✅ Minden játékos pool-rotációval kapja a kérdéseket (1→2→3→...→40→1)</p>
            <p>✅ Egy kérdés csak egy poolban szerepel → garantált változatosság</p>
            <p>✅ A poolok memóriában cache-eltek → 25.000 egyidejű játékos támogatás</p>
            <p>✅ Kisebb poolok (&lt;15 kérdés) automatikusan átugrásra kerülnek</p>
            <p>✅ Új kérdések hozzáadása után újragenerálással frissíthetők a poolok</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
