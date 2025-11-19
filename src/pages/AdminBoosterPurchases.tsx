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
      
      // Fetch purchases with user and booster info
      const { data, error } = await supabase
        .from('booster_purchases')
        .select(`
          id,
          user_id,
          purchase_source,
          gold_spent,
          usd_cents_spent,
          created_at,
          booster_types!inner (
            code,
            name
          ),
          profiles!inner (
            username
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const formattedData: BoosterPurchase[] = (data || []).map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        booster_code: p.booster_types.code,
        booster_name: p.booster_types.name,
        username: p.profiles.username,
        purchase_source: p.purchase_source,
        gold_spent: p.gold_spent,
        usd_cents_spent: p.usd_cents_spent,
        created_at: p.created_at
      }));

      setPurchases(formattedData);

      // Calculate summary
      const totalFree = formattedData.filter(p => p.purchase_source === 'GOLD').length;
      const totalPremium = formattedData.filter(p => p.purchase_source === 'IAP').length;
      const totalGold = formattedData.reduce((sum, p) => sum + p.gold_spent, 0);
      const totalUsd = formattedData.reduce((sum, p) => sum + p.usd_cents_spent, 0);

      setSummary({
        total_free: totalFree,
        total_premium: totalPremium,
        total_gold_spent: totalGold,
        total_usd_revenue: totalUsd / 100
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
