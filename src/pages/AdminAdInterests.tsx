import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdInterests, AdInterestTopicSummary, AdUserInterestRow } from '@/hooks/useAdInterests';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, BarChart3, Users, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AdminAdInterests = () => {
  const navigate = useNavigate();
  const { loading, recalculating, recalculateInterests, fetchTopicSummary, fetchUserInterests } = useAdInterests();
  
  const [topicSummary, setTopicSummary] = useState<AdInterestTopicSummary[]>([]);
  const [userInterests, setUserInterests] = useState<AdUserInterestRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>('all');
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (authChecked) {
      loadData();
    }
  }, [authChecked, currentPage, selectedTopicFilter]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/admin/login');
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .single();

      if (!roleData) {
        navigate('/dashboard');
        return;
      }

      setAuthChecked(true);
    } catch (error) {
      console.error('Error checking auth:', error);
      navigate('/admin/login');
    }
  };

  const loadData = async () => {
    const [summaryData, userData] = await Promise.all([
      fetchTopicSummary(),
      fetchUserInterests(currentPage, 50, selectedTopicFilter === 'all' ? undefined : selectedTopicFilter),
    ]);

    setTopicSummary(summaryData);
    setUserInterests(userData.items || []);
    setTotalPages(userData.totalPages || 1);
  };

  const handleRecalculate = async () => {
    await recalculateInterests();
    await loadData();
  };

  if (!authChecked) {
    return (
      <div className="min-h-dvh min-h-svh relative overflow-hidden bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#0f0a1f] flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        <div className="relative z-10">
          <p className="text-white/70 text-lg">Betöltés...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Reklámprofilok (Előkészítés)</h1>
            <p className="text-white/60">Játékadatokból származó reklám-érdeklődési analitika</p>
          </div>
          <Button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
            {recalculating ? 'Frissítés...' : 'Újraszámítás'}
          </Button>
        </div>

        {/* Legal Info Box */}
        <Alert className="bg-blue-500/10 border-blue-500/30 text-white">
          <Info className="h-5 w-5 text-blue-400" />
          <AlertDescription className="text-sm ml-2">
            Ez a nézet a játékosok tematikus érdeklődését mutatja reklám-szempontú előkészítésként. 
            A jelenlegi rendszerben ezek az adatok <strong>kizárólag analitikai és termékfejlesztési célokat</strong> szolgálnak, 
            nem használjuk őket aktív reklámcélú profilozásra, és nem jelenítünk meg személyre szabott hirdetéseket. 
            A tényleges reklám-targetálás csak akkor indul el, ha a szolgáltatás elérhetővé válik és a felhasználó ehhez 
            kifejezetten hozzájárul.
          </AlertDescription>
        </Alert>

        {/* Topic Summary Section */}
        <Card className="backdrop-blur-xl bg-white/5 border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Témakörök reklámérdeklődése</h2>
          </div>

          {loading ? (
            <div className="text-white/60 text-center py-8">Betöltés...</div>
          ) : topicSummary.length === 0 ? (
            <div className="text-white/60 text-center py-8">
              Nincs adat. Futtasd az újraszámítást!
            </div>
          ) : (
            <>
              {/* Bar Chart for Top 10 Topics */}
              <div className="mb-6 p-4 bg-white/5 rounded-lg">
                <h3 className="text-white/80 text-sm font-medium mb-4">Top 10 témakör interest score alapján</h3>
                <div className="space-y-3">
                  {topicSummary.slice(0, 10).map((topic, idx) => (
                    <div key={topic.topicId} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/80">{topic.topicName}</span>
                        <span className="text-purple-400 font-medium">
                          {(topic.avgInterestScore * 100).toFixed(2)}%
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500"
                          style={{ width: `${topic.avgInterestScore * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-white/5">
                      <TableHead className="text-white/70">#</TableHead>
                      <TableHead className="text-white/70">Témakör</TableHead>
                      <TableHead className="text-white/70">Átlagos Interest Score</TableHead>
                      <TableHead className="text-white/70">%-ban</TableHead>
                      <TableHead className="text-white/70">User Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topicSummary.map((topic, idx) => (
                      <TableRow key={topic.topicId} className="border-white/10 hover:bg-white/5">
                        <TableCell className="text-white/80">{idx + 1}</TableCell>
                        <TableCell className="text-white font-medium">{topic.topicName}</TableCell>
                        <TableCell className="text-white/80">{topic.avgInterestScore.toFixed(4)}</TableCell>
                        <TableCell className="text-purple-400 font-medium">
                          {(topic.avgInterestScore * 100).toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-white/80">{topic.userCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </Card>

        {/* User Interest List Section */}
        <Card className="backdrop-blur-xl bg-white/5 border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-bold text-white">User-szintű érdeklődés (anonim)</h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-white/60 text-sm">Szűrés témakör szerint:</span>
              <Select value={selectedTopicFilter} onValueChange={setSelectedTopicFilter}>
                <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Összes témakör" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a0b2e] border-white/10">
                  <SelectItem value="all" className="text-white">Összes témakör</SelectItem>
                  {topicSummary.map(topic => (
                    <SelectItem key={topic.topicId} value={topic.topicId} className="text-white">
                      {topic.topicName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="text-white/60 text-center py-8">Betöltés...</div>
          ) : userInterests.length === 0 ? (
            <div className="text-white/60 text-center py-8">
              Nincs adat a kiválasztott szűrővel.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-white/5">
                      <TableHead className="text-white/70">User ID (hash)</TableHead>
                      <TableHead className="text-white/70">Top témakörök</TableHead>
                      <TableHead className="text-white/70">Összes érdeklődés</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userInterests.map((user, idx) => (
                      <TableRow key={`${user.userIdHash}-${idx}`} className="border-white/10 hover:bg-white/5">
                        <TableCell className="text-white/80 font-mono text-sm">
                          {user.userIdHash}
                        </TableCell>
                        <TableCell className="text-white/80">
                          {user.topTopics.length === 0 ? (
                            <span className="text-white/40">Nincs adat</span>
                          ) : (
                            <div className="space-y-1">
                              {user.topTopics.map(topic => (
                                <div key={topic.topicId} className="text-sm">
                                  <span className="text-purple-400">{topic.topicName}</span>
                                  {' '}
                                  <span className="text-white/60">
                                    ({(topic.interestScore * 100).toFixed(2)}%)
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-white/80">{user.totalTopicsWithInterest}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <Button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                  variant="outline"
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  Előző
                </Button>
                <span className="text-white/60">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || loading}
                  variant="outline"
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  Következő
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminAdInterests;