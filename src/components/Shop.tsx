import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Heart, Zap, HelpCircle, Users, Eye, ShoppingCart, Coins } from 'lucide-react';
import { toast } from 'sonner';
import { useGameProfile } from '@/hooks/useGameProfile';

interface ShopProps {
  userId: string;
}

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: any;
  action: () => Promise<void>;
  disabled?: boolean;
}

const Shop = ({ userId }: ShopProps) => {
  const { profile, updateProfile, spendCoins } = useGameProfile(userId);
  const [loading, setLoading] = useState<string | null>(null);

  if (!profile) return null;

  const buyLife = async () => {
    setLoading('life');
    const success = await spendCoins(25);
    if (success) {
      await updateProfile({ lives: profile.lives + 1 });
      toast.success('1 élet vásárolva!');
    }
    setLoading(null);
  };

  const buySpeedBooster = async () => {
    setLoading('speed');
    const success = await spendCoins(150);
    if (success) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      await updateProfile({
        speed_booster_active: true,
        speed_booster_expires_at: expiresAt.toISOString(),
        speed_booster_multiplier: 2
      });
      toast.success('Speed Booster aktiválva 24 órára!');
    }
    setLoading(null);
  };

  const reactivateHelp5050 = async () => {
    setLoading('help5050');
    const success = await spendCoins(30);
    if (success) {
      await updateProfile({ help_50_50_active: true });
      toast.success('50:50 segítség újraaktiválva!');
    }
    setLoading(null);
  };

  const reactivateHelp2x = async () => {
    setLoading('help2x');
    const success = await spendCoins(30);
    if (success) {
      await updateProfile({ help_2x_answer_active: true });
      toast.success('2x válasz segítség újraaktiválva!');
    }
    setLoading(null);
  };

  const reactivateHelpAudience = async () => {
    setLoading('helpaudience');
    const success = await spendCoins(30);
    if (success) {
      await updateProfile({ help_audience_active: true });
      toast.success('Közönség segítség újraaktiválva!');
    }
    setLoading(null);
  };

  const shopItems: ShopItem[] = [
    {
      id: 'life',
      name: '1 Élet',
      description: 'Egy extra élet a játékokhoz',
      price: 25,
      icon: Heart,
      action: buyLife,
      disabled: profile.lives >= profile.max_lives
    },
    {
      id: 'speed',
      name: 'Speed Booster',
      description: '24 órás 2x gyorsabb életregeneráció',
      price: 150,
      icon: Zap,
      action: buySpeedBooster,
      disabled: profile.speed_booster_active
    },
    {
      id: 'help5050',
      name: '50:50 Segítség',
      description: 'Újraaktiválás következő játékhoz',
      price: 30,
      icon: HelpCircle,
      action: reactivateHelp5050,
      disabled: profile.help_50_50_active
    },
    {
      id: 'help2x',
      name: '2x Válasz Segítség',
      description: 'Újraaktiválás következő játékhoz',
      price: 30,
      icon: Eye,
      action: reactivateHelp2x,
      disabled: profile.help_2x_answer_active
    },
    {
      id: 'helpaudience',
      name: 'Közönség Segítség',
      description: 'Újraaktiválás következő játékhoz',
      price: 30,
      icon: Users,
      action: reactivateHelpAudience,
      disabled: profile.help_audience_active
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-primary" />
          Bolt
        </CardTitle>
        <CardDescription>
          Vásárolj extra életeket és segítségeket aranyérméért
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 bg-accent/50 rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Egyenleged</p>
          <p className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
            <Coins className="w-8 h-8" />
            {profile.coins}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shopItems.map((item) => {
            const Icon = item.icon;
            const isLoading = loading === item.id;
            const canAfford = profile.coins >= item.price;
            
            return (
              <div
                key={item.id}
                className={`
                  border-2 rounded-xl p-4 transition-all
                  ${item.disabled ? 'border-border/30 bg-muted/30 opacity-50' : 'border-border/50 hover:border-primary/50'}
                `}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold mb-1">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg flex items-center gap-1">
                    <Coins className="w-5 h-5" />
                    {item.price}
                  </span>
                  <Button
                    onClick={item.action}
                    disabled={item.disabled || !canAfford || isLoading}
                    size="sm"
                  >
                    {isLoading ? 'Vásárlás...' : 'Vásárlás'}
                  </Button>
                </div>

                {item.disabled && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Már aktív vagy maximális szinten
                  </p>
                )}
                {!canAfford && !item.disabled && (
                  <p className="text-xs text-red-500 mt-2">
                    Nincs elég aranyérméd
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default Shop;
