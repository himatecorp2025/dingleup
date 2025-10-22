import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Zap, Trophy, CreditCard, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GeniusSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscribeComplete?: () => void;
}

export const GeniusSubscriptionDialog = ({
  open,
  onOpenChange,
  onSubscribeComplete
}: GeniusSubscriptionDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);

  // Track subscription modal view
  useEffect(() => {
    if (open) {
      const trackView = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'sub_view', { userId: user.id, route: window.location.pathname });
        }
      };
      trackView();
    }
  }, [open]);

  const handleSubscribe = async () => {
    setIsLoading(true);
    
    // Track subscription start
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'sub_start', { userId: user.id });
      }
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription');
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
        toast.info('Átirányítás a fizetési oldalra...');
        onOpenChange(false);
        onSubscribeComplete?.();
      }
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      toast.error('Hiba történt az előfizetés indításakor');
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-gradient-to-br from-[#1a1a3e] via-[#2a1a4e] to-[#1a1a5e] border-4 border-yellow-500/70 text-white shadow-[0_0_60px_rgba(234,179,8,0.5)] dialog-enter-slow">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-black text-center justify-center flex items-center gap-2">
            <Crown className="w-8 h-8 text-yellow-400 animate-bounce" />
            GENIUS ELŐFIZETÉS
          </DialogTitle>
          <DialogDescription className="text-base text-white/90 pt-2 font-bold text-center">
            🎮 Légy Genius – duplázd meg a napi jutalmad!
          </DialogDescription>
        </DialogHeader>
        
        {/* Price Box - Casino Style */}
        <div className="relative bg-gradient-to-br from-yellow-400/20 via-yellow-500/20 to-yellow-600/20 border-4 border-yellow-400/60 rounded-2xl p-6 my-3 overflow-hidden shadow-[0_0_40px_rgba(234,179,8,0.5)]">
          {/* Animated sparkles */}
          <div className="absolute inset-0 opacity-30">
            <Sparkles className="absolute top-2 right-2 w-6 h-6 text-yellow-200 animate-pulse" />
            <Sparkles className="absolute bottom-2 left-2 w-5 h-5 text-yellow-200 animate-pulse" style={{ animationDelay: '0.5s' }} />
            <Crown className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 text-yellow-300/10" />
          </div>
          
          <div className="relative z-10 text-center space-y-3">
            <p className="text-yellow-200 text-sm font-bold">Csak</p>
            <p className="text-5xl font-black text-yellow-300 drop-shadow-[0_0_20px_rgba(253,224,71,1)]">
              $2.99
            </p>
            <p className="text-yellow-200 text-base font-semibold">/ hónap</p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Zap className="w-4 h-4 text-yellow-300" />
              <p className="text-sm text-yellow-100 font-bold">Bármikor lemondható</p>
              <Zap className="w-4 h-4 text-yellow-300" />
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-3 p-3 bg-yellow-400/10 rounded-lg border border-yellow-400/30">
            <div className="w-6 h-6 rounded-full bg-yellow-400/30 flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-yellow-300" />
            </div>
            <p className="text-white font-bold text-sm">Dupla napi jutalom (2x arany)</p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-green-400/10 rounded-lg border border-green-400/30">
            <div className="w-6 h-6 rounded-full bg-green-400/30 flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-green-300" />
            </div>
            <p className="text-white font-bold text-sm">Élet regeneráció 2x gyorsabb (6 perc)</p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-red-400/10 rounded-lg border border-red-400/30">
            <div className="w-6 h-6 rounded-full bg-red-400/30 flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-red-300" />
            </div>
            <p className="text-white font-bold text-sm">–50% coin kedvezmény boosterekre</p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-purple-400/10 rounded-lg border border-purple-400/30">
            <div className="w-6 h-6 rounded-full bg-purple-400/30 flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-purple-300" />
            </div>
            <p className="text-white font-bold text-sm">–25% USD kedvezmény boosterekre</p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-blue-400/10 rounded-lg border border-blue-400/30">
            <div className="w-6 h-6 rounded-full bg-blue-400/30 flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-blue-300" />
            </div>
            <p className="text-white font-bold text-sm">Exkluzív Tippek & Trükkök videók</p>
          </div>
        </div>

        {/* Payment info */}
        <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border-2 border-green-400/50 rounded-xl p-3 mb-2">
          <p className="text-center text-white font-bold text-xs flex items-center justify-center gap-2">
            <CreditCard className="w-4 h-4" />
            Biztonságos fizetés • Stripe
          </p>
        </div>
        
        <DialogFooter className="flex flex-col gap-3 sm:gap-3">
          <Button 
            onClick={handleSubscribe}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-500 via-green-600 to-green-500 hover:from-green-600 hover:via-green-700 hover:to-green-600 text-black font-black text-xl gap-3 py-6 shadow-[0_0_25px_rgba(34,197,94,0.6)] hover:shadow-[0_0_35px_rgba(34,197,94,0.8)] transition-all duration-300 animate-pulse hover:animate-none border-4 border-yellow-400"
          >
            {isLoading ? (
              <>
                <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin" />
                Átirányítás...
              </>
            ) : (
              <>
                <Crown className="w-6 h-6" />
                ELŐFIZETEK $2.99/HÓ 🎰
              </>
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="text-white/60 hover:text-white/80 hover:bg-transparent text-sm"
          >
            Később
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};