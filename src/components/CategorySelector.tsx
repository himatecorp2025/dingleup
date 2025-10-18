import { GameCategory } from '@/types/game';
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
    <div className="min-h-screen flex items-start justify-center p-4 pt-24 bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] overflow-y-auto">
      <div className="absolute inset-0 bg-gradient-to-tr from-accent/10 via-transparent to-secondary/10"></div>
      <div className="max-w-2xl w-full relative z-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 font-poppins text-white">
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
                onClick={() => onSelect(category.id)}
                className="group relative overflow-hidden rounded-2xl p-4 border border-border/50 bg-gradient-card hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-glow text-left touch-manipulation active:scale-95 aspect-square flex flex-col justify-between"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                <div className="relative z-10 flex flex-col h-full items-center justify-between">
                  <div className={`p-4 rounded-xl bg-gradient-to-br ${category.gradient} text-white w-fit mt-4`}>
                    <Icon className="w-16 h-16" />
                  </div>
                  
                  <div className="text-center pb-4">
                    <h3 className="text-sm font-bold mb-1 font-poppins leading-tight text-white">
                      {category.name}
                    </h3>
                    <p className="text-xs text-white/70 line-clamp-2">
                      {category.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-white/70">
            15 kérdés • 10 mp/kérdés • Akár 100 aranyérme
          </p>
        </div>
      </div>
    </div>
  );
};

export default CategorySelector;