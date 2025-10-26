import { Dialog, DialogContent } from '@/components/ui/dialog';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';

interface QuickBuyOptInDialogProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function QuickBuyOptInDialogFixed({ open, onAccept, onDecline }: QuickBuyOptInDialogProps) {
  const isHandheld = usePlatformDetection();

  if (!isHandheld) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDecline()}>
      <DialogContent 
        className="overflow-y-auto p-0 border-0 bg-transparent max-w-[95vw] w-[95vw] flex items-center justify-center"
        style={{ 
          maxHeight: '95vh'
        }}
      >
        <div 
          className="relative w-full flex flex-col items-center justify-center p-[4vw] bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-400 rounded-3xl overflow-y-auto"
          style={{ 
            maxHeight: '90vh'
          }}
        >
          {/* Animated stars */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-pulse"
                style={{
                  fontSize: `${Math.random() * 20 + 10}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.15}s`
                }}
              >
                ⭐
              </div>
            ))}
          </div>

          {/* Lightning icon top left */}
          <div className="absolute top-[4vh] left-[4vw] bg-yellow-500 rounded-full w-[12vw] h-[12vw] max-w-[50px] max-h-[50px] flex items-center justify-center border-4 border-yellow-600 shadow-lg animate-bounce z-10">
            <span style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)' }}>⚡</span>
          </div>

          {/* Banner */}
          <div className="absolute top-[8vh] left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 px-[6vw] py-[1.5vh] rounded-full shadow-lg border-4 border-white/50 z-10">
            <p className="font-black text-white text-center drop-shadow-lg" style={{ fontSize: 'clamp(0.875rem, 4vw, 1.5rem)' }}>
              Quick Buy Feature
            </p>
          </div>

          {/* Main shop area */}
          <div className="mt-[15vh] bg-gradient-to-b from-amber-800/90 to-amber-900/90 rounded-3xl border-8 border-amber-700 p-[5vw] backdrop-blur-sm shadow-2xl w-[85vw] max-w-[500px] z-10">
            {/* Top decorative lights */}
            <div className="flex justify-around mb-[2vh]">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-[3vw] h-[3vw] max-w-[15px] max-h-[15px] bg-yellow-500 rounded-full border-2 border-yellow-700 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>

            {/* Lightning visual */}
            <div className="flex justify-center mb-[2vh]">
              <div className="bg-gradient-to-b from-yellow-300 to-orange-600 rounded-full p-[3vw] border-4 border-yellow-700 shadow-inner animate-pulse">
                <span style={{ fontSize: 'clamp(2rem, 10vw, 4rem)' }}>⚡</span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-purple-900/50 rounded-xl border-3 border-purple-700 p-[4vw] mb-[2vh]">
              <p className="text-white font-bold text-center leading-relaxed" style={{ fontSize: 'clamp(0.75rem, 3.5vw, 1rem)' }}>
                A Gyorsvásárlás aktiválásával az első vásárlás után minden további vásárlás egyetlen gombnyomással történhet.
              </p>
            </div>

            {/* Legal notice */}
            <div className="bg-blue-900/50 rounded-xl border-3 border-blue-700 p-[3vw] mb-[3vh] flex items-start gap-[2vw]">
              <span style={{ fontSize: 'clamp(1rem, 5vw, 1.5rem)' }} className="flex-shrink-0">🛡️</span>
              <p className="text-white/90 text-left leading-relaxed" style={{ fontSize: 'clamp(0.625rem, 3vw, 0.875rem)' }}>
                Azonnali teljesítést kérek. Tudomásul veszem, hogy a 14 napos elállási jog a teljesítés megkezdését követően nem gyakorolható.
              </p>
            </div>

            {/* Buttons */}
            <div className="space-y-[2vh]">
              <button
                onClick={onAccept}
                className="w-full bg-gradient-to-b from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-black rounded-full py-[2.5vh] shadow-[0_6px_0_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-1 transition-all border-4 border-green-800"
                style={{ fontSize: 'clamp(0.875rem, 4vw, 1.5rem)' }}
              >
                Elfogadom
              </button>
              
              <button
                onClick={onDecline}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-full py-[2vh] border-3 border-gray-800 transition-all"
                style={{ fontSize: 'clamp(0.75rem, 3.5vw, 1.25rem)' }}
              >
                Nem most
              </button>
            </div>
          </div>

          {/* Right side emoji icons */}
          <div className="absolute right-[4vw] top-[32vh] space-y-[2vh]">
            <div className="bg-green-400 rounded-full p-[2vw] border-3 border-green-600 shadow-lg">
              <span style={{ fontSize: 'clamp(1.25rem, 6vw, 2rem)' }}>✅</span>
            </div>
            <div className="bg-yellow-400 rounded-full p-[2vw] border-3 border-yellow-600 shadow-lg">
              <span style={{ fontSize: 'clamp(1.25rem, 6vw, 2rem)' }}>⚡</span>
            </div>
            <div className="bg-blue-400 rounded-full p-[2vw] border-3 border-blue-600 shadow-lg">
              <span style={{ fontSize: 'clamp(1.25rem, 6vw, 2rem)' }}>🛒</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
