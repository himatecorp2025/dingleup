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

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null as any;

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
      <DialogContent className="sm:max-w-sm bg-gradient-to-br from-[#1a1a3e] via-[#2a1a4e] to-[#1a1a5e] border-4 border-yellow-500/70 text-white shadow-[0_0_60px_rgba(234,179,8,0.5)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 duration-[3000ms]">
        <div className="animate-scale-in duration-[3000ms] origin-center will-change-transform">
        <DialogHeader className="animate-in fade-in-0 duration-[2500ms] delay-500">
          <DialogTitle className="flex items-center gap-2 text-2xl font-black animate-in fade-in-0 zoom-in-90 duration-[2000ms] delay-1000">
            <Icon className={`w-7 h-7 ${type === 'coins' || type === 'both' ? 'text-yellow-400' : 'text-red-500'}`} />
            {title}
          </DialogTitle>
          <DialogDescription className="text-base text-white/90 pt-2 font-bold animate-in fade-in-0 slide-in-from-top-1 duration-[2000ms] delay-1500">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        {userId && !clientSecret && (
          <>
            <div className="relative bg-gradient-to-br from-yellow-400/20 via-yellow-500/20 to-yellow-600/20 border-4 border-yellow-400/60 rounded-2xl p-6 my-3 overflow-hidden shadow-[0_0_40px_rgba(234,179,8,0.5)] animate-in fade-in-0 zoom-in-75 duration-[2000ms] delay-1700">
              {/* Animated background sparkles */}
              <div className="absolute inset-0 opacity-30">
                <Sparkles className="absolute top-2 right-2 w-6 h-6 text-yellow-200" />
                <Sparkles className="absolute bottom-2 left-2 w-5 h-5 text-yellow-200" />
                <Sparkles className="absolute top-1/2 right-1/4 w-4 h-4 text-yellow-300" />
                <Trophy className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 text-yellow-300/10" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full shadow-lg">
                    <Coins className="w-8 h-8 text-yellow-300 drop-shadow-[0_0_12px_rgba(253,224,71,1)]" />
                    <span className="text-2xl font-black text-yellow-200 drop-shadow-lg">500</span>
                  </div>
                  <div className="text-4xl font-black text-yellow-200 drop-shadow-lg">+</div>
                  <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full shadow-lg">
                    <Heart className="w-8 h-8 text-red-400 drop-shadow-[0_0_12px_rgba(248,113,113,1)]" />
                    <span className="text-2xl font-black text-red-300 drop-shadow-lg">15</span>
                  </div>
                </div>
                
                <div className="text-center space-y-2">
                  <p className="text-4xl font-black text-yellow-300 drop-shadow-[0_0_20px_rgba(253,224,71,1)]">
                    $0.99
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <p className="text-sm text-yellow-100 font-bold drop-shadow-md">Azonnal jóváírva • Játék folytatása</p>
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border-2 border-green-400/50 rounded-xl p-3 mb-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-[1500ms] delay-2000">
              <p className="text-center text-white font-bold text-xs flex items-center justify-center gap-2">
                <CreditCard className="w-4 h-4" />
                Biztonságos fizetés • Apple Pay • Google Pay • Kártya
              </p>
            </div>
          </>
        )}

        {clientSecret && stripePromise && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm 
              clientSecret={clientSecret} 
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          </Elements>
        )}
        {clientSecret && !stripePromise && (
          <div className="text-center text-sm text-red-300">
            Fizetés nem elérhető: hiányzó Stripe kulcs.
          </div>
        )}
        
        {userId && !clientSecret && (
          <DialogFooter className="flex flex-col gap-3 sm:gap-3 animate-in fade-in-0 slide-in-from-bottom-3 duration-[1500ms] delay-2300">
            <Button 
              onClick={handleStartPayment}
              disabled={isLoadingPayment}
              className="w-full bg-gradient-to-r from-green-500 via-green-600 to-green-500 hover:from-green-600 hover:via-green-700 hover:to-green-600 text-black font-black text-xl gap-3 py-6 shadow-[0_0_25px_rgba(34,197,94,0.6)] hover:shadow-[0_0_35px_rgba(34,197,94,0.8)] transition-all duration-300 animate-pulse hover:animate-none border-4 border-yellow-400"
            >
              {isLoadingPayment ? (
                <>
                  <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin" />
                  Betöltés...
                </>
              ) : (
                <>
                  <CreditCard className="w-6 h-6" />
                  VÁSÁRLÁS $0.99 🎰
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
        )}

        {!userId && (
          <DialogFooter className="flex flex-col gap-3 sm:gap-3 mt-4">
            <Button 
              onClick={onGoToShop} 
              className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white gap-2 py-5 text-lg font-bold"
            >
              Bejelentkezés és vásárlás
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="text-white/60 hover:text-white/80 hover:bg-transparent text-sm"
            >
              Mégse
            </Button>
          </DialogFooter>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
