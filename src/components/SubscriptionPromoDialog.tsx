import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Crown, Heart, Zap, Gift, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HexagonButton } from './HexagonButton';

interface SubscriptionPromoDialogProps {
  open: boolean;
  onClose: () => void;
}

export const SubscriptionPromoDialog = ({ open, onClose }: SubscriptionPromoDialogProps) => {
  const navigate = useNavigate();

  console.log('[PROMO DIALOG] Render with open=', open);

  const handleSubscribe = () => {
    console.log('[PROMO DIALOG] Subscribe button clicked');
    onClose();
    navigate('/shop');
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      console.log('[PROMO DIALOG] onOpenChange called with:', newOpen);
      if (!newOpen) {
        onClose();
      }
    }}>
      <DialogContent className="w-[95vw] max-w-md h-auto max-h-[70vh] overflow-y-auto bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] border-2 border-yellow-500/50 shadow-2xl shadow-yellow-500/30 flex flex-col relative overflow-hidden z-[9999]">
        {/* Casino lights animation */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-red-500 to-purple-500 opacity-80 animate-pulse z-50"></div>
        
        {/* Floating sparkles */}
        <div className="absolute inset-0 pointer-events-none">
          <Sparkles className="absolute top-10 left-10 w-6 h-6 text-yellow-400 animate-pulse" />
          <Sparkles className="absolute top-20 right-10 w-4 h-4 text-purple-400 animate-pulse delay-100" />
          <Sparkles className="absolute bottom-20 left-20 w-5 h-5 text-red-400 animate-pulse delay-200" />
        </div>

        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl font-black text-center bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 bg-clip-text text-transparent">
            💎 LEGYÉL PRÉMIUM TAG! 💎
          </DialogTitle>
        </DialogHeader>

        {/* Crown icon with glow - KOMPAKT */}
        <div className="flex justify-center py-1 flex-shrink-0">
          <div className="relative w-full flex items-center justify-center h-20 sm:h-24">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/50 via-orange-500/50 to-yellow-500/50 blur-3xl animate-pulse"></div>
              <Crown className="relative w-16 h-16 sm:w-20 sm:h-20 text-yellow-400 drop-shadow-2xl animate-bounce" strokeWidth={2} />
            </div>
          </div>
        </div>

        {/* Benefits - KOMPAKT */}
        <div className="space-y-1 sm:space-y-1.5 bg-black/80 backdrop-blur-sm rounded-lg p-2 sm:p-3 border-2 border-yellow-500/50 flex-shrink-0">
          <h3 className="text-center text-[10px] sm:text-xs font-bold mb-1 text-white">
            🎁 PRÉMIUM ELŐNYÖK:
          </h3>

          <div className="flex items-center justify-between p-1 sm:p-1.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/30">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Gift className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
              <span className="font-bold text-[10px] sm:text-xs text-white">Dupla napi jutalom</span>
            </div>
            <span className="text-[10px] sm:text-xs text-white/70">2x arany</span>
          </div>

          <div className="flex items-center justify-between p-1 sm:p-1.5 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-lg border border-red-500/30">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
              <span className="font-bold text-[10px] sm:text-xs text-white">30 max élet</span>
            </div>
            <span className="text-[10px] sm:text-xs text-white/70">15 helyett</span>
          </div>

          <div className="flex items-center justify-between p-1 sm:p-1.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
              <span className="font-bold text-[10px] sm:text-xs text-white">Játék segítség</span>
            </div>
            <span className="text-[10px] sm:text-xs text-white/70">+500 arany</span>
          </div>
        </div>

        {/* Price - KOMPAKT */}
        <div className="text-center py-2 bg-gradient-to-r from-yellow-500/10 to-purple-600/10 rounded-lg border border-yellow-500/30 flex-shrink-0">
          <p className="text-white/70 text-[9px] sm:text-[10px]">Csak</p>
          <p className="text-2xl sm:text-3xl font-black text-yellow-400">$2.99</p>
          <p className="text-white/70 text-[9px] sm:text-[10px]">/ hónap</p>
        </div>

        {/* CTA Button */}
        <HexagonButton
          variant="yellow"
          size="lg"
          onClick={handleSubscribe}
          className="w-full text-sm sm:text-base font-black py-1.5 sm:py-2 flex-shrink-0"
        >
          <Crown className="inline w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
          ELŐFIZETEK MOST!
        </HexagonButton>

        <p className="text-center text-white/70 text-[9px] sm:text-[10px] flex-shrink-0">
          Bármikor lemondható • Azonnali hozzáférés
        </p>
      </DialogContent>
    </Dialog>
  );
};
