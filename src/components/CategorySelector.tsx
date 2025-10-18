import { GameCategory } from '@/types/game';
import { Button } from './ui/button';
import { Heart, Brain, Palette, TrendingUp } from 'lucide-react';

interface CategorySelectorProps {
  onSelect: (category: GameCategory) => void;
}

const CategorySelector = ({ onSelect }: CategorySelectorProps) => {
  const categories = [
    {
      id: 'health' as GameCategory,
      name: 'Egészség & Fitnesz',
      icon: Heart,
      description: 'Sport, életmód, táplálkozás',
      gradient: 'from-red-500 to-pink-500'
    },
    {
      id: 'history' as GameCategory,
      name: 'Történelem & Technológia',
      icon: Brain,
      description: 'Tudomány, felfedezések, találmányok',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'culture' as GameCategory,
      name: 'Kultúra & Lifestyle',
      icon: Palette,
      description: 'Film, zene, művészet, divat',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      id: 'finance' as GameCategory,
      name: 'Pénzügy & Önismeret',
      icon: TrendingUp,
      description: 'Pszichológia, önfejlesztés, pénzügyi tudatosság',
      gradient: 'from-green-500 to-emerald-500'
    }
  ];

  return (
    <div className="h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tr from-accent/10 via-transparent to-secondary/10"></div>
      <div className="max-w-2xl w-full py-8 relative z-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-3 font-poppins">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4169E1] via-[#9370DB] to-[#FFD700]">
            Válassz témakört!
          </span>
        </h1>
        <p className="text-center text-sm text-gray-300 mb-8">
          Melyik területen méred össze tudásod?
        </p>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => onSelect(category.id)}
                className="group relative overflow-hidden rounded-2xl p-4 border border-border/50 bg-gradient-card hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-glow text-left touch-manipulation active:scale-95 aspect-square flex flex-col justify-between"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${category.gradient} text-white w-fit mb-2`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-end">
                    <h3 className="text-sm font-bold mb-1 font-poppins leading-tight">
                      {category.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {category.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            15 kérdés • 10 mp/kérdés • Akár 100 aranyérme
          </p>
        </div>
      </div>
    </div>
  );
};

export default CategorySelector;