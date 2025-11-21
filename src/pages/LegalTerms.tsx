import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LegalTerms = () => {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/dashboard">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Vissza
          </Button>
        </Link>
        
        <div className="bg-card border border-border rounded-lg p-6 md:p-8">
          <h1 className="text-3xl font-bold mb-6">Általános Szerződési Feltételek</h1>
          
          <div className="prose prose-sm max-w-none space-y-4 text-muted-foreground">
            <p className="text-center text-xl font-semibold text-primary mt-8">
              [Tartalommal hamarosan frissülünk]
            </p>
            
            <p className="text-center text-sm">
              Az Általános Szerződési Feltételek hamarosan elérhetőek lesznek ezen az oldalon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalTerms;
