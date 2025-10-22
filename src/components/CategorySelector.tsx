import { GameCategory } from '@/types/game';
import { Heart, Brain, Palette, TrendingUp, ArrowLeft, LogOut } from 'lucide-react';
import { MusicControls } from './MusicControls';
import { InsufficientResourcesDialog } from './InsufficientResourcesDialog';
import { useGameProfile } from '@/hooks/useGameProfile';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface CategorySelectorProps {
  onSelect: (category: GameCategory) => void;
}

const CategorySelector = ({ onSelect }: CategorySelectorProps) => {
  const [userId, setUserId] = useState<string | undefined>();
  const { profile, refreshProfile } = useGameProfile(userId);
  const [showInsufficientDialog, setShowInsufficientDialog] = useState(false);

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      }
    });
  }, []);

  const handleCategorySelect = (category: GameCategory) => {
    // Check if user has enough lives
    if (profile && profile.lives < 1) {
      setShowInsufficientDialog(true);
      return;
    }
    onSelect(category);
  };

  const handleGoToShop = () => {
    window.location.href = '/shop';
  };

  const handlePurchaseComplete = () => {
    refreshProfile();
    toast.success('Vásárlás sikeres! Most már játszhatsz! 🎉');
  };
  const categories = [
    {
      id: 'health' as GameCategory,
      name: 'Egészség & Fitnesz',
      icon: Heart,
      description: 'Sport, életmód, táplálkozás',
      gradient: 'from-red-500 via-red-600 to-pink-600',
      borderColor: 'border-red-500/50',
      shadowColor: 'shadow-red-500/40'
    },
    {
      id: 'history' as GameCategory,
      name: 'Történelem & Technológia',
      icon: Brain,
      description: 'Tudomány, felfedezések, találmányok',
      gradient: 'from-blue-500 via-blue-600 to-cyan-600',
      borderColor: 'border-blue-500/50',
      shadowColor: 'shadow-blue-500/40'
    },
    {
      id: 'culture' as GameCategory,
      name: 'Kultúra & Lifestyle',
      icon: Palette,
      description: 'Film, zene, művészet, divat',
      gradient: 'from-purple-500 via-purple-600 to-pink-600',
      borderColor: 'border-purple-500/50',
      shadowColor: 'shadow-purple-500/40'
    },
    {
      id: 'finance' as GameCategory,
      name: 'Pénzügy & Önismeret',
      icon: TrendingUp,
      description: 'Pszichológia, önfejlesztés, pénzügyi tudatosság',
      gradient: 'from-green-500 via-green-600 to-emerald-600',
      borderColor: 'border-green-500/50',
      shadowColor: 'shadow-green-500/40'
    }
  ];

  return (
    <div className="h-screen w-screen flex flex-col items-start justify-start p-4 pt-12 bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] overflow-hidden fixed inset-0">
      <div className="absolute inset-0 bg-gradient-to-tr from-yellow-600/10 via-red-600/10 to-purple-600/10 pointer-events-none"></div>
      
      {/* Casino lights animation */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-red-500 to-purple-500 opacity-60 animate-pulse"></div>
      
      {/* Back button */}
      <button
        onClick={() => window.location.href = '/dashboard'}
        className="p-3 mb-4 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-full shadow-lg hover:from-red-700 hover:to-red-900 transition-all hover:scale-110 border-2 border-red-400/50 neon-border"
        title="Vissza"
      >
        <LogOut className="w-6 h-6 -scale-x-100" />
      </button>
      
      <div className="max-w-2xl w-full relative z-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 font-poppins bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-red-400 to-purple-400 animate-pulse">
          Válassz témakört!
        </h1>
          <p className="text-center text-sm text-white mb-6">
            Melyik területen méred össze tudásod?
          </p>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={`group relative overflow-hidden rounded-2xl p-4 border-3 ${category.borderColor} bg-black/80 hover:border-yellow-400/70 transition-all duration-300 hover:scale-105 ${category.shadowColor} shadow-xl text-left touch-manipulation active:scale-95 aspect-square flex flex-col justify-between casino-card`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-20 group-hover:opacity-30 transition-opacity duration-300`}></div>
                
                <div className="relative z-10 flex flex-col h-full items-center justify-between">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${category.gradient} text-white w-fit mt-3 shadow-lg gold-glow`}>
                    <Icon className="w-12 h-12" />
                  </div>
                  
                  <div className="text-center pb-4">
                    <h3 className="text-sm font-bold mb-1 font-poppins leading-tight text-white drop-shadow-lg">
                      {category.name}
                    </h3>
                    <p className="text-xs text-yellow-200/90 line-clamp-2 drop-shadow">
                      {category.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-yellow-300/90 drop-shadow font-semibold mb-4">
            15 kérdés • 10 mp/kérdés • Akár 100 aranyérme
          </p>
        </div>

        {/* Music Controls */}
        <div className="mt-4 max-w-md mx-auto">
          <MusicControls />
        </div>
      </div>
      
      {/* Note: Daily Gift dialog is now ONLY shown on Dashboard if canClaim is true */}
      
      <InsufficientResourcesDialog
        open={showInsufficientDialog}
        onOpenChange={setShowInsufficientDialog}
        type="lives"
        requiredAmount={1}
        currentAmount={profile?.lives || 0}
        onGoToShop={handleGoToShop}
        userId={userId}
        onPurchaseComplete={handlePurchaseComplete}
      />
    </div>
  );
};

export default CategorySelector;