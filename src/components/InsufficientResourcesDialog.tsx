import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins, Heart, CreditCard, Sparkles, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

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

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const PaymentForm = ({ 
  clientSecret, 
  onSuccess, 
  onCancel 
}: { 
  clientSecret: string; 
  onSuccess: () => void; 
  onCancel: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast.error(error.message || 'Fizetési hiba történt');
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Verify payment on backend
        const { data, error: verifyError } = await supabase.functions.invoke('verify-inline-payment', {
          body: { paymentIntentId: paymentIntent.id }
        });

        if (verifyError || !data?.granted) {
          toast.error('Fizetés ellenőrzése sikertelen');
          setIsProcessing(false);
        } else {
          toast.success(`${data.coins} aranyérme és ${data.lives} élet hozzáadva! 🎉`);
          onSuccess();
        }
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast.error('Váratlan hiba történt');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl p-4 border border-purple-500/30">
        <PaymentElement />
      </div>
      
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 border-white/30 text-white hover:bg-white/10"
        >
          Mégse
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-500 hover:from-yellow-600 hover:via-yellow-700 hover:to-yellow-600 text-black font-black text-base shadow-[0_0_20px_rgba(234,179,8,0.6)] hover:shadow-[0_0_30px_rgba(234,179,8,0.8)] transition-all duration-300"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Feldolgozás...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Vásárlás most! 💳
            </span>
          )}
        </Button>
      </div>
    </form>
  );
};

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
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const Icon = type === 'coins' ? Coins : type === 'lives' ? Heart : Coins;
  
  const getTitle = () => {
    if (type === 'both') return '⚠️ Nincs elegendő erőforrás!';
    return type === 'coins' ? '💰 Nincs elegendő aranyérme!' : '❤️ Nincs elegendő élet!';
  };
  
  const getDescription = () => {
    if (userId) {
      return '🎮 Ne hagyd abba! Folytasd most azonnal!';
    }
    if (requiredAmount && currentAmount !== undefined) {
      return `Szükséges: ${requiredAmount}, Jelenleg: ${currentAmount}`;
    }
    return 'Látogass el a boltba, hogy több erőforrást szerezz!';
  };

  const handleStartPayment = async () => {
    if (!userId) {
      toast.error('Nincs bejelentkezve');
      return;
    }

    setIsLoadingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-ingame-payment');
      
      if (error) throw error;
      
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      }
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast.error('Fizetés indítása sikertelen');
      setIsLoadingPayment(false);
    }
  };

  const handlePaymentSuccess = () => {
    setClientSecret(null);
    setIsLoadingPayment(false);
    onPurchaseComplete?.();
    onOpenChange(false);
  };

  const handlePaymentCancel = () => {
    setClientSecret(null);
    setIsLoadingPayment(false);
  };

  useEffect(() => {
    if (!open) {
      setClientSecret(null);
      setIsLoadingPayment(false);
    }
  }, [open]);

  const title = getTitle();
  const description = getDescription();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-[#1a1a3e] via-[#2a1a4e] to-[#1a1a5e] border-4 border-yellow-500/70 text-white shadow-[0_0_60px_rgba(234,179,8,0.5)] animate-in">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-3xl font-black">
            <Icon className={`w-8 h-8 ${type === 'coins' || type === 'both' ? 'text-yellow-400 animate-pulse' : 'text-red-500 animate-pulse'}`} />
            {title}
          </DialogTitle>
          <DialogDescription className="text-lg text-white/90 pt-2 font-bold">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        {userId && !clientSecret && (
          <>
            <div className="relative bg-gradient-to-br from-yellow-400/30 via-yellow-500/30 to-yellow-600/30 border-4 border-yellow-400/80 rounded-2xl p-6 my-4 overflow-hidden shadow-[0_0_30px_rgba(234,179,8,0.4)]">
              {/* Animated background sparkles */}
              <div className="absolute inset-0 opacity-20">
                <Sparkles className="absolute top-2 right-2 w-6 h-6 text-yellow-200 animate-pulse" />
                <Sparkles className="absolute bottom-2 left-2 w-5 h-5 text-yellow-200 animate-pulse delay-75" />
                <Trophy className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 text-yellow-300/20" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="flex items-center gap-2 bg-black/30 px-4 py-2 rounded-full">
                    <Coins className="w-8 h-8 text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]" />
                    <span className="text-2xl font-black text-yellow-200">500</span>
                  </div>
                  <div className="text-4xl font-black text-yellow-200 animate-pulse">+</div>
                  <div className="flex items-center gap-2 bg-black/30 px-4 py-2 rounded-full">
                    <Heart className="w-8 h-8 text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]" />
                    <span className="text-2xl font-black text-red-300">15</span>
                  </div>
                </div>
                
                <div className="text-center space-y-2">
                  <p className="text-5xl font-black text-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,0.8)] animate-pulse">
                    $0.99
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <p className="text-sm text-yellow-100 font-bold">Azonnal jóváírva • Korlátlan ideig használható</p>
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border-2 border-green-400/50 rounded-xl p-4 mb-2">
              <p className="text-center text-white font-bold text-sm flex items-center justify-center gap-2">
                <CreditCard className="w-5 h-5" />
                Biztonságos fizetés • Apple Pay • Google Pay • Kártya
              </p>
            </div>
          </>
        )}

        {clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm 
              clientSecret={clientSecret} 
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          </Elements>
        )}
        
        {userId && !clientSecret && (
          <DialogFooter className="flex gap-3 sm:gap-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1 border-white/30 text-white hover:bg-white/10"
            >
              Később
            </Button>
            
            <Button 
              onClick={handleStartPayment}
              disabled={isLoadingPayment}
              className="flex-1 bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-500 hover:from-yellow-600 hover:via-yellow-700 hover:to-yellow-600 text-black font-black text-lg gap-2 shadow-[0_0_20px_rgba(234,179,8,0.6)] hover:shadow-[0_0_30px_rgba(234,179,8,0.8)] transition-all duration-300 animate-pulse hover:animate-none"
            >
              {isLoadingPayment ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Betöltés...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  VÁSÁRLÁS MOST! 🚀
                </>
              )}
            </Button>
          </DialogFooter>
        )}

        {!userId && (
          <DialogFooter className="flex gap-2 sm:gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1 border-white/30 text-white hover:bg-white/10"
            >
              Mégse
            </Button>
            <Button 
              onClick={onGoToShop} 
              className="flex-1 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white gap-2"
            >
              Bolt megnyitása
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
