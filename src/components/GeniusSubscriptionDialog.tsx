import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePlatformDetection } from '@/hooks/usePlatformDetection';
import shopOfferBg from '@/assets/popup-shop-offer.png';

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
  const isHandheld = usePlatformDetection();

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

  const basePrice = 2.99;
  const discountedPrice = Math.round(basePrice * 0.75 * 100) / 100;

  if (!isHandheld) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="overflow-hidden p-0 border-0 bg-transparent max-w-[95vw] w-[95vw]"
        style={{ 
          height: 'auto',
          maxHeight: '90vh'
        }}
      >
        <div 
          className="relative w-full flex flex-col items-center justify-center p-[4vw] bg-cover bg-center bg-no-repeat rounded-3xl"
          style={{ 
            backgroundImage: `url(${shopOfferBg})`,
            minHeight: '70vh',
            aspectRatio: '1'
          }}
        >
          {/* Crown icon top left */}
          <div className="absolute top-[4vh] left-[4vw] bg-yellow-500 rounded-full w-[12vw] h-[12vw] max-w-[50px] max-h-[50px] flex items-center justify-center border-4 border-yellow-600 shadow-lg">
            <span style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)' }}>👑</span>
          </div>

          {/* Banner */}
          <div className="absolute top-[8vh] left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 px-[6vw] py-[1.5vh] rounded-full shadow-lg border-4 border-white/50">
            <p className="font-black text-white text-center drop-shadow-lg" style={{ fontSize: 'clamp(0.875rem, 4vw, 1.5rem)' }}>
              One Time Sale Offer
            </p>
          </div>

          {/* Main shop area */}
          <div className="mt-[15vh] bg-gradient-to-b from-amber-800/90 to-amber-900/90 rounded-3xl border-8 border-amber-700 p-[4vw] backdrop-blur-sm shadow-2xl w-[85vw] max-w-[500px]">
            {/* Top decorative lights */}
            <div className="flex justify-around mb-[2vh]">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-[3vw] h-[3vw] max-w-[15px] max-h-[15px] bg-red-500 rounded-full border-2 border-red-700 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>

            {/* Price tag on left */}
            <div className="absolute left-[8vw] top-[35vh] bg-gradient-to-b from-pink-500 to-purple-600 rounded-xl px-[4vw] py-[2vh] border-4 border-yellow-400 shadow-xl -rotate-12">
              <div className="text-center">
                <p className="text-yellow-300 font-black line-through" style={{ fontSize: 'clamp(0.875rem, 4vw, 1.25rem)' }}>
                  ${basePrice}
                </p>
                <p className="font-black text-white drop-shadow-lg" style={{ fontSize: 'clamp(1.5rem, 7vw, 2.5rem)' }}>
                  ${discountedPrice}
                </p>
              </div>
            </div>

            {/* Discount badge */}
            <div className="absolute left-[4vw] top-[30vh] bg-yellow-400 rounded-full px-[3vw] py-[1vh] border-3 border-yellow-600 shadow-lg rotate-12">
              <p className="font-black text-red-600" style={{ fontSize: 'clamp(0.75rem, 3.5vw, 1.25rem)' }}>
                25% OFF
              </p>
            </div>

            {/* Gems/Coins visual */}
            <div className="flex justify-center mb-[2vh]">
              <div className="bg-gradient-to-b from-yellow-300 to-yellow-600 rounded-full p-[3vw] border-4 border-yellow-700 shadow-inner">
                <span style={{ fontSize: 'clamp(2rem, 10vw, 4rem)' }}>💎</span>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-[1vh] mb-[2vh]">
              <div className="flex items-center gap-[2vw]">
                <span style={{ fontSize: 'clamp(1rem, 5vw, 1.5rem)' }}>✨</span>
                <p className="text-white font-bold" style={{ fontSize: 'clamp(0.75rem, 3.5vw, 1rem)' }}>
                  Dupla napi jutalom
                </p>
              </div>
              <div className="flex items-center gap-[2vw]">
                <span style={{ fontSize: 'clamp(1rem, 5vw, 1.5rem)' }}>⚡</span>
                <p className="text-white font-bold" style={{ fontSize: 'clamp(0.75rem, 3.5vw, 1rem)' }}>
                  2x gyorsabb élet regeneráció
                </p>
              </div>
              <div className="flex items-center gap-[2vw]">
                <span style={{ fontSize: 'clamp(1rem, 5vw, 1.5rem)' }}>💰</span>
                <p className="text-white font-bold" style={{ fontSize: 'clamp(0.75rem, 3.5vw, 1rem)' }}>
                  50% coin kedvezmény
                </p>
              </div>
            </div>

            {/* Buy Now button */}
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full bg-gradient-to-b from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 disabled:from-green-300 disabled:to-green-500 text-white font-black rounded-full py-[2.5vh] shadow-[0_6px_0_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-1 transition-all border-4 border-green-800 disabled:cursor-not-allowed"
              style={{ fontSize: 'clamp(1rem, 4.5vw, 1.75rem)' }}
            >
              {isLoading ? 'Feldolgozás...' : 'Buy Now'}
            </button>
          </div>

          {/* Right side emoji icons */}
          <div className="absolute right-[4vw] top-[32vh] space-y-[2vh]">
            <div className="bg-yellow-400 rounded-full p-[2vw] border-3 border-yellow-600 shadow-lg">
              <span style={{ fontSize: 'clamp(1.25rem, 6vw, 2rem)' }}>🎁</span>
            </div>
            <div className="bg-red-400 rounded-full p-[2vw] border-3 border-red-600 shadow-lg">
              <span style={{ fontSize: 'clamp(1.25rem, 6vw, 2rem)' }}>❤️</span>
            </div>
            <div className="bg-blue-400 rounded-full p-[2vw] border-3 border-blue-600 shadow-lg">
              <span style={{ fontSize: 'clamp(1.25rem, 6vw, 2rem)' }}>💎</span>
            </div>
          </div>

          {/* Close/Later button */}
          <button
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="mt-[2vh] text-white/70 hover:text-white font-bold disabled:cursor-not-allowed"
            style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1.125rem)' }}
          >
            Később
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
