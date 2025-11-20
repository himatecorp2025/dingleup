import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { seedTranslationsWithAI } from '@/utils/seedTranslations';
import { toast } from 'sonner';
import { Loader2, Languages } from 'lucide-react';

/**
 * Utility component for admins to seed translations with AI
 * Add this to admin interface or call once from console
 */
export const TranslationSeeder: React.FC = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [progress, setProgress] = useState('');

  const handleSeed = async () => {
    setIsSeeding(true);
    setProgress('Fordítások betöltése...');
    
    try {
      await seedTranslationsWithAI();
      toast.success('AI fordítások sikeresen elkészültek!');
      setProgress('Kész! ✓');
    } catch (error) {
      console.error('Seeding error:', error);
      toast.error('Hiba történt a fordítások elkészítésekor');
      setProgress('Hiba történt');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="p-6 bg-background border border-border rounded-lg max-w-md">
      <div className="flex items-center gap-3 mb-4">
        <Languages className="w-6 h-6 text-primary" />
        <h3 className="text-lg font-bold">AI Fordítások Generálása</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Ez a funkció AI fordításokat generál minden magyar szöveghez az összes támogatott nyelvre (en, de, fr, es, it, pt, nl).
      </p>
      
      {progress && (
        <p className="text-sm font-medium mb-4 text-primary">
          {progress}
        </p>
      )}
      
      <Button 
        onClick={handleSeed} 
        disabled={isSeeding}
        className="w-full"
      >
        {isSeeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isSeeding ? 'Fordítás folyamatban...' : 'AI Fordítások Indítása'}
      </Button>
      
      <p className="text-xs text-muted-foreground mt-2">
        Ez körülbelül 1-2 percet vesz igénybe.
      </p>
    </div>
  );
};
