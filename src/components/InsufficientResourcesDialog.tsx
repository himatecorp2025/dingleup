import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins, Heart, CreditCard } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InsufficientResourcesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'coins' | 'lives' | 'both';
  requiredAmount?: number;
  currentAmount?: number;
  onGoToShop: () => void;
  userId?: string;
  onPurchaseComplete?: () => void;
}

const QUICK_BUY_KEY = 'quick_buy_enabled';

export const InsufficientResourcesDialog = ({
  open,
  onOpenChange,
  type,
  requiredAmount,
  currentAmount,
  onGoToShop,
  userId,
  onPurchaseComplete
}: InsufficientResourcesDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const Icon = type === 'coins' ? Coins : type === 'lives' ? Heart : Coins;
  
  const getTitle = () => {
    if (type === 'both') return 'Nincs elegendő erőforrás!';
    return type === 'coins' ? 'Nincs elegendő aranyérme!' : 'Nincs elegendő élet!';
  };
  
  const getDescription = () => {
    if (type === 'both') {
      return 'Elfogy az életed vagy aranyérméd? Vásárolj most 500 aranyat + 15 életet csak $0.99-ért!';
    }
    if (requiredAmount && currentAmount !== undefined) {
      return `Szükséges: ${requiredAmount}, Jelenleg: ${currentAmount}`;
    }
    return 'Látogass el a boltba, hogy több erőforrást szerezz!';
  };

  const handleQuickBuy = async () => {
    if (!userId) {
      toast.error('Nincs bejelentkezve');
      return;
    }

    const quickBuyEnabled = localStorage.getItem(QUICK_BUY_KEY) === 'true';
    
    setIsProcessing(true);
    try {
      // Call create-ingame-payment edge function
      const { data, error } = await supabase.functions.invoke('create-ingame-payment');
      
      if (error) throw error;
      
      if (data.url) {
        // Open Stripe checkout in new tab
        window.open(data.url, '_blank');
        
        if (!quickBuyEnabled) {
          localStorage.setItem(QUICK_BUY_KEY, 'true');
        }
        
        onOpenChange(false);
        
        // Poll for payment completion
        const checkInterval = setInterval(async () => {
          const params = new URLSearchParams(window.location.search);
          if (params.get('payment') === 'success') {
            clearInterval(checkInterval);
            if (onPurchaseComplete) {
              onPurchaseComplete();
            }
          }
        }, 2000);
        
        // Stop checking after 5 minutes
        setTimeout(() => clearInterval(checkInterval), 300000);
      }
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast.error('Fizetés indítása sikertelen');
    } finally {
      setIsProcessing(false);
    }
  };

  const title = getTitle();
  const description = getDescription();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-[#1a1a3e] to-[#0f0f2e] border-2 border-purple-500/50 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Icon className={`w-7 h-7 ${type === 'coins' || type === 'both' ? 'text-yellow-500' : 'text-red-500'}`} />
            {title}
          </DialogTitle>
          <DialogDescription className="text-base text-white/80 pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        {type === 'both' && userId && (
          <div className="bg-gradient-to-br from-yellow-500/20 to-purple-600/20 border-2 border-yellow-500/50 rounded-xl p-4 my-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-6 h-6 text-yellow-400" />
                <span className="text-lg font-bold">500 Arany</span>
              </div>
              <div className="text-2xl font-bold">+</div>
              <div className="flex items-center gap-2">
                <Heart className="w-6 h-6 text-red-400" />
                <span className="text-lg font-bold">15 Élet</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-yellow-400">$0.99</p>
              <p className="text-xs text-white/60">Azonnal jóváírva</p>
            </div>
          </div>
        )}
        
        <DialogFooter className="flex gap-2 sm:gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1 border-white/30 text-white hover:bg-white/10"
          >
            Mégse
          </Button>
          
          {type === 'both' && userId ? (
            <Button 
              onClick={handleQuickBuy}
              disabled={isProcessing}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold gap-2"
            >
              <CreditCard className="w-4 h-4" />
              {isProcessing ? 'Feldolgozás...' : 'Azonnali vásárlás'}
            </Button>
          ) : (
            <Button 
              onClick={onGoToShop} 
              className="flex-1 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white gap-2"
            >
              Bolt megnyitása
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
