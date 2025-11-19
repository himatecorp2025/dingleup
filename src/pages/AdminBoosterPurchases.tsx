import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '@/components/admin/AdminLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface BoosterPurchase {
  id: string;
  user_id: string;
  booster_code: string;
  booster_name: string;
  username: string;
  purchase_source: string;
  gold_spent: number;
  usd_cents_spent: number;
  created_at: string;
  purchase_context: string;
}

interface PurchaseSummary {
  total_free: number;
  total_premium: number;
  total_gold_spent: number;
  total_usd_revenue: number;
}

export default function AdminBoosterPurchases() {
  const [purchases, setPurchases] = useState<BoosterPurchase[]>([]);
  const [summary, setSummary] = useState<PurchaseSummary>({
    total_free: 0,
    total_premium: 0,
    total_gold_spent: 0,
    total_usd_revenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [boosterFilter, setBoosterFilter] = useState<string>('all');

  useEffect(() => {
    fetchPurchases();
  }, []);

  async function fetchPurchases() {
    try {
      setLoading(true);

      // Prefer backend aggregation via admin edge function for correctness & RLS
      const { data, error } = await supabase.functions.invoke('admin-booster-purchases', {
        body: {
          limit: 100,
          offset: 0,
        },
      });

      if (error) throw error;

      const purchasesResponse = (data as any)?.purchases || [];
      const summaryResponse = (data as any)?.summary || {};

      const formattedData: BoosterPurchase[] = purchasesResponse.map((p: any) => ({
        id: p.id,
        user_id: p.userId,
        booster_code: p.boosterCode,
        booster_name: p.boosterName,
        username: p.userDisplayName || 'Ismeretlen felhasználó',
        purchase_source: p.purchaseSource,
        gold_spent: p.goldSpent || 0,
        usd_cents_spent: p.usdCentsSpent || 0,
        created_at: p.createdAt,
        // Edge function jelenleg nem küld contextet – idővel bővíthető
        purchase_context: 'UNKNOWN',
      }));

      setPurchases(formattedData);

      setSummary({
        total_free: summaryResponse.totalFreePurchases || 0,
        total_premium: summaryResponse.totalPremiumPurchases || 0,
        total_gold_spent: summaryResponse.totalGoldSpent || 0,
        total_usd_revenue: summaryResponse.totalUsdRevenue || 0,
      });
    } catch (error) {
      console.error('Error fetching purchases:', error);
      toast.error('Hiba történt a vásárlások betöltésekor');
    } finally {
      setLoading(false);
    }
  }

  const filteredPurchases = purchases.filter(p => {
    const matchesSearch = p.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = sourceFilter === 'all' || p.purchase_source === sourceFilter;
    const matchesBooster = boosterFilter === 'all' || p.booster_code === boosterFilter;
    return matchesSearch && matchesSource && matchesBooster;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-6 md:grid-cols-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Booster Vásárlások</h1>
          <span className="text-sm text-muted-foreground">
            {filteredPurchases.length} / {purchases.length} vásárlás
          </span>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Free Booster</p>
              <p className="text-3xl font-bold text-yellow-400">{summary.total_free}</p>
              <p className="text-xs text-muted-foreground">aranyért vásárolva</p>
            </div>
          </Card>
          <Card className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Premium Booster</p>
              <p className="text-3xl font-bold text-green-400">{summary.total_premium}</p>
              <p className="text-xs text-muted-foreground">IAP vásárlás</p>
            </div>
          </Card>
          <Card className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Arany kiadás</p>
              <p className="text-3xl font-bold text-yellow-400">{summary.total_gold_spent.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">összesen</p>
            </div>
          </Card>
          <Card className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">USD bevétel</p>
              <p className="text-3xl font-bold text-green-400">${summary.total_usd_revenue.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">IAP-ből</p>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              placeholder="Keresés felhasználónév alapján..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Forrás szűrése" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Minden forrás</SelectItem>
                <SelectItem value="GOLD">Arany</SelectItem>
                <SelectItem value="IAP">IAP</SelectItem>
              </SelectContent>
            </Select>
            <Select value={boosterFilter} onValueChange={setBoosterFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Booster szűrése" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Minden booster</SelectItem>
                <SelectItem value="FREE">Free Booster</SelectItem>
                <SelectItem value="PREMIUM">Premium Booster</SelectItem>
                <SelectItem value="GOLD_SAVER">Gold Saver</SelectItem>
                <SelectItem value="INSTANT_RESCUE">Instant Rescue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Purchases Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Felhasználó</TableHead>
                <TableHead>Booster</TableHead>
                <TableHead>Forrás</TableHead>
                <TableHead>Context</TableHead>
                <TableHead className="text-right">Arany</TableHead>
                <TableHead className="text-right">USD</TableHead>
                <TableHead>Dátum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-medium">{purchase.username}</TableCell>
                  <TableCell>{purchase.booster_name}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      purchase.purchase_source === 'GOLD'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {purchase.purchase_source}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      purchase.purchase_context === 'INGAME'
                        ? 'bg-red-500/20 text-red-400'
                        : purchase.purchase_context === 'DASHBOARD'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {purchase.purchase_context || 'UNKNOWN'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-yellow-400">
                    {purchase.gold_spent > 0 ? purchase.gold_spent : '-'}
                  </TableCell>
                  <TableCell className="text-right text-green-400">
                    {purchase.usd_cents_spent > 0 ? `$${(purchase.usd_cents_spent / 100).toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(purchase.created_at).toLocaleString('hu-HU')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AdminLayout>
  );
}
