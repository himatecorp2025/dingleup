import { Card } from "@/components/ui/card";
import { CheckCircle2, HelpCircle, Clock } from "lucide-react";

const GamePreview = () => {
  return (
    <section className="py-24 px-4 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-poppins">
            Hogyan <span className="text-transparent bg-clip-text bg-gradient-gold">Működik?</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Egyszerű, gyors és szórakoztató - pont mint a klasszikus Milliomos!
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Question Example */}
          <Card className="bg-gradient-card border-primary/30 p-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-accent/20 w-10 h-10 rounded-full flex items-center justify-center">
                <span className="text-accent font-bold">15</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="text-sm">10 másodperc</span>
              </div>
            </div>

            <div className="bg-primary/20 border border-primary/30 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                <h3 className="text-xl font-semibold">
                  Melyik magyar király beszélt hat nyelven?
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              {['A: Szent István', 'B: Hunyadi Mátyás', 'C: II. András'].map((option, index) => (
                <button
                  key={index}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                    index === 1 
                      ? 'bg-accent/20 border-accent text-accent font-semibold' 
                      : 'bg-muted/30 border-border hover:border-accent/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {index === 1 && <CheckCircle2 className="w-5 h-5" />}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 flex gap-3 justify-center flex-wrap">
              <div className="bg-secondary/20 border border-secondary/30 rounded-lg px-4 py-2 text-sm">
                🎯 Harmadoló
              </div>
              <div className="bg-secondary/20 border border-secondary/30 rounded-lg px-4 py-2 text-sm">
                2️⃣ 2× Válasz
              </div>
              <div className="bg-secondary/20 border border-secondary/30 rounded-lg px-4 py-2 text-sm">
                👥 Közönség
              </div>
            </div>
          </Card>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Card className="bg-gradient-card border-accent/30 p-6 text-center">
              <div className="text-4xl font-bold text-accent mb-2">100</div>
              <div className="text-sm text-muted-foreground">Arany / Teljes Játék</div>
            </Card>
            <Card className="bg-gradient-card border-accent/30 p-6 text-center">
              <div className="text-4xl font-bold text-accent mb-2">3</div>
              <div className="text-sm text-muted-foreground">Segítség Típus</div>
            </Card>
            <Card className="bg-gradient-card border-accent/30 p-6 text-center">
              <div className="text-4xl font-bold text-accent mb-2">∞</div>
              <div className="text-sm text-muted-foreground">Kategória</div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GamePreview;
