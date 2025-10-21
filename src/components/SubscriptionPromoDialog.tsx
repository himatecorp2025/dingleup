import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { X, Crown, Heart, Zap, Gift, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SubscriptionPromoDialogProps {
  userId: string;
  isSubscribed: boolean;
}

const PROMO_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours
const MAX_DAILY_PROMOS = 5;

export const SubscriptionPromoDialog = ({ userId, isSubscribed }: SubscriptionPromoDialogProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isSubscribed) return;

    const checkAndShowPromo = () => {
      const lastPromoDate = localStorage.getItem(`last_promo_date_${userId}`);
      const promoCountToday = parseInt(localStorage.getItem(`promo_count_today_${userId}`) || '0');
      const now = Date.now();

      // Reset counter if it's a new day
      if (lastPromoDate) {
        const lastDate = new Date(parseInt(lastPromoDate));
        const today = new Date();
        if (lastDate.toDateString() !== today.toDateString()) {
          localStorage.setItem(`promo_count_today_${userId}`, '0');
        }
      }

      // Check if we can show promo (max 5 per day, not shown recently)
      const currentCount = parseInt(localStorage.getItem(`promo_count_today_${userId}`) || '0');
      if (currentCount < MAX_DAILY_PROMOS) {
        const lastShown = parseInt(localStorage.getItem(`last_promo_shown_${userId}`) || '0');
        const timeSinceLastPromo = now - lastShown;

        // Show promo after random interval (15-45 minutes)
        const minInterval = 15 * 60 * 1000; // 15 minutes
        const maxInterval = 45 * 60 * 1000; // 45 minutes
        const randomInterval = Math.random() * (maxInterval - minInterval) + minInterval;

        if (timeSinceLastPromo > randomInterval) {
          setOpen(true);
          localStorage.setItem(`last_promo_shown_${userId}`, now.toString());
          localStorage.setItem(`promo_count_today_${userId}`, (currentCount + 1).toString());
          localStorage.setItem(`last_promo_date_${userId}`, now.toString());
        }
      }
    };

    // Check immediately
    const initialDelay = setTimeout(checkAndShowPromo, 30000); // Wait 30 seconds after login

    // Then check periodically
    const interval = setInterval(checkAndShowPromo, 5 * 60 * 1000); // Check every 5 minutes

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [userId, isSubscribed]);

  const handleSubscribe = () => {
    setOpen(false);
    navigate('/shop');
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[95vw] max-w-md bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] border-2 border-yellow-500/50 shadow-2xl shadow-yellow-500/30 relative overflow-hidden z-[9999]">
        {/* Casino lights animation */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-red-500 to-purple-500 opacity-80 animate-pulse"></div>
        
        {/* Floating sparkles */}
        <div className="absolute inset-0 pointer-events-none">
          <Sparkles className="absolute top-10 left-10 w-6 h-6 text-yellow-400 animate-pulse" />
          <Sparkles className="absolute top-20 right-10 w-4 h-4 text-purple-400 animate-pulse delay-100" />
          <Sparkles className="absolute bottom-20 left-20 w-5 h-5 text-red-400 animate-pulse delay-200" />
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-red-600/80 hover:bg-red-700 transition-colors z-50"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-center bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 bg-clip-text text-transparent pt-4">
            💎 LEGYÉL PRÉMIUM TAG! 💎
          </DialogTitle>
        </DialogHeader>

        {/* Crown icon with glow */}
        <div className="flex justify-center py-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/50 via-orange-500/50 to-yellow-500/50 blur-3xl animate-pulse"></div>
            <Crown className="relative w-24 h-24 text-yellow-400 drop-shadow-2xl animate-bounce" strokeWidth={2} />
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-3 bg-black/60 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/30">
          <h3 className="text-center text-sm font-bold text-white mb-3">
            🎁 PRÉMIUM ELŐNYÖK:
          </h3>

          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/30">
            <Gift className="w-6 h-6 text-yellow-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-white font-bold text-sm">Dupla napi jutalom</p>
              <p className="text-white/70 text-xs">2x aranyérme minden nap!</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-lg border border-red-500/30">
            <Heart className="w-6 h-6 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-white font-bold text-sm">30 maximális élet</p>
              <p className="text-white/70 text-xs">15 helyett 30 élet tárolható!</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
            <Zap className="w-6 h-6 text-green-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-white font-bold text-sm">Játékon belüli segítség</p>
              <p className="text-white/70 text-xs">+500 arany és +15 élet azonnal!</p>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="text-center py-4 bg-gradient-to-r from-yellow-500/10 to-purple-600/10 rounded-xl border border-yellow-500/30">
          <p className="text-white/70 text-xs mb-1">Csak</p>
          <p className="text-4xl font-black text-yellow-400">$2.99</p>
          <p className="text-white/70 text-xs">/ hónap (~$0.09/nap)</p>
        </div>

        {/* CTA Button */}
        <Button
          onClick={handleSubscribe}
          className="w-full py-6 text-lg font-black bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 text-black hover:opacity-90 shadow-xl shadow-yellow-500/50 animate-pulse"
        >
          <Crown className="w-5 h-5 mr-2" />
          ELŐFIZETEK MOST!
        </Button>

        <p className="text-center text-white/50 text-xs mt-2">
          Bármikor lemondható • Azonnali hozzáférés
        </p>
      </DialogContent>
    </Dialog>
  );
};
