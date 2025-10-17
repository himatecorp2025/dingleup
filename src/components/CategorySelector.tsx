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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-accent/10">
      <div className="max-w-4xl w-full">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-3 font-poppins">
          <span className="text-transparent bg-clip-text bg-gradient-gold">
            Válassz témakört!
          </span>
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          Melyik területen méred össze tudásod?
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => onSelect(category.id)}
                className="group relative overflow-hidden rounded-2xl p-6 border border-border/50 bg-gradient-card hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-glow text-left"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                <div className="relative z-10">
                  <div className="flex items-start gap-4 mb-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${category.gradient} text-white`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1 font-poppins">
                        {category.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end gap-2 text-sm text-primary font-medium">
                    <span>Játék indítása</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            15 kérdés • 10 mp/kérdés • Akár 100 aranyérme
          </p>
        </div>
      </div>
    </div>
  );
};

export default CategorySelector;