import { Card } from "@/components/ui/card";

interface CategorySelectorProps {
  onSelectCategory: (category: string) => void;
}

const categories = [
  { id: 'health', label: 'Egészség', emoji: '🏥' },
  { id: 'history', label: 'Történelem', emoji: '📜' },
  { id: 'culture', label: 'Kultúra', emoji: '🎭' },
  { id: 'finance', label: 'Pénzügy', emoji: '💰' },
];

export const CategorySelector = ({ onSelectCategory }: CategorySelectorProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <h2 className="text-3xl font-bold text-center text-foreground mb-8">
          Válassz kategóriát
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {categories.map((category) => (
            <Card
              key={category.id}
              className="p-6 cursor-pointer hover:scale-105 transition-transform bg-background/10 border-border/20 backdrop-blur-sm"
              onClick={() => onSelectCategory(category.id)}
            >
              <div className="text-center space-y-2">
                <div className="text-4xl">{category.emoji}</div>
                <p className="text-lg font-semibold text-foreground">{category.label}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
