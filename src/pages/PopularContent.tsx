import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, TrendingUp, Heart, Search } from 'lucide-react';
import { toast } from 'sonner';

interface TopicPopularity {
  topic_id: number;
  topic_name: string;
  topic_description: string | null;
  total_likes: number;
  question_count: number;
}

export default function PopularContent() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<TopicPopularity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof TopicPopularity; direction: 'asc' | 'desc' }>({
    key: 'total_likes',
    direction: 'desc',
  });

  useEffect(() => {
    fetchPopularityData();
  }, []);

  const fetchPopularityData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-topic-popularity');

      if (error) throw error;

      if (data?.success && data.topics) {
        setTopics(data.topics);
      }
    } catch (error) {
      console.error('[PopularContent] Fetch error:', error);
      toast.error('Nem sikerült betölteni a népszerű tartalmakat');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: keyof TopicPopularity) => {
    setSortConfig((prevConfig) => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const filteredAndSortedTopics = [...topics]
    .filter((topic) =>
      topic.topic_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue, 'hu')
          : bValue.localeCompare(aValue, 'hu');
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin-dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Vissza
          </Button>
        </div>

        {/* Page Title */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-primary" />
              <div>
                <CardTitle className="text-3xl">Népszerű tartalmak</CardTitle>
                <CardDescription className="mt-2">
                  Témakörönkénti összesített lájkok – segít megérteni, melyik témák a legkedveltebbek a játékosok körében.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Témakör keresése név szerint..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filteredAndSortedTopics.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery
                  ? 'Nincs találat a keresési feltételeknek megfelelően.'
                  : 'Még nincsenek lájkolt kérdések.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort('topic_name')}
                      >
                        <div className="flex items-center gap-2">
                          Témakör neve
                          {sortConfig.key === 'topic_name' && (
                            <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 transition-colors text-right"
                        onClick={() => handleSort('total_likes')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <Heart className="w-4 h-4" />
                          Összes lájk
                          {sortConfig.key === 'total_likes' && (
                            <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 transition-colors text-right"
                        onClick={() => handleSort('question_count')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          Kérdések száma
                          {sortConfig.key === 'question_count' && (
                            <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedTopics.map((topic, index) => (
                      <TableRow key={topic.topic_id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-semibold">{topic.topic_name}</div>
                            {topic.topic_description && (
                              <div className="text-sm text-muted-foreground mt-0.5">
                                {topic.topic_description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Heart
                              className={`w-4 h-4 ${
                                topic.total_likes > 0 ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                              }`}
                            />
                            <span className={`font-bold ${topic.total_likes > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {topic.total_likes}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {topic.question_count}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}