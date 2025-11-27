import { useI18n } from '@/i18n';
import BottomNav from '@/components/BottomNav';
import boxGold from '@/assets/box-gold.svg';
import { useNavigate } from 'react-router-dom';
import { LogOut, Play } from 'lucide-react';

const Gifts = () => {
  const { t } = useI18n();
  const navigate = useNavigate();

  const packages = [
    { boxes: 1, price: '$1.99' },
    { boxes: 3, price: '$4.99' },
    { boxes: 5, price: '$9.99' },
    { boxes: 10, price: '$17.99' }
  ];

  return (
    <div className="h-[100dvh] bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900 text-white relative overflow-hidden flex flex-col">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.1),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/game-background.png')] bg-cover bg-center opacity-10 pointer-events-none" />

      <div
        className="relative z-10 flex-1 flex justify-center overflow-hidden"
        style={{ height: 'calc(100dvh - var(--bottom-nav-h) - env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="container mx-auto px-3 sm:px-4 py-2 max-w-2xl flex-1 flex flex-col justify-between">
          {/* Header with Back and Play buttons */}
          <div className="flex items-center justify-between mb-2 gap-2">
            {/* Back Button - Left */}
            <button
              onClick={() => navigate('/dashboard')}
              className="relative rounded-full hover:scale-110 transition-all flex-shrink-0"
              style={{ 
                padding: 'clamp(8px, 2vw, 12px)',
                minWidth: 'clamp(40px, 10vw, 56px)',
                minHeight: 'clamp(40px, 10vw, 56px)'
              }}
              title={t('profile.back_to_dashboard')}
            >
              {/* BASE SHADOW */}
              <div className="absolute inset-0 bg-black/40 rounded-full" style={{ transform: 'translate(3px, 3px)', filter: 'blur(4px)' }} aria-hidden />
              
              {/* OUTER FRAME */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-700 via-red-600 to-red-900 border-2 border-red-400/50 shadow-lg" aria-hidden />
              
              {/* MIDDLE FRAME */}
              <div className="absolute inset-[3px] rounded-full bg-gradient-to-b from-red-600 via-red-500 to-red-800" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }} aria-hidden />
              
              {/* INNER LAYER */}
              <div className="absolute inset-[5px] rounded-full bg-gradient-to-b from-red-500 via-red-600 to-red-700" style={{ boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.2), inset 0 -8px 16px rgba(0,0,0,0.3)' }} aria-hidden />
              
              {/* SPECULAR HIGHLIGHT */}
              <div className="absolute inset-[5px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)' }} aria-hidden />
              
              {/* Icon */}
              <LogOut 
                className="text-white relative z-10 -scale-x-100" 
                style={{ width: 'clamp(20px, 5vw, 24px)', height: 'clamp(20px, 5vw, 24px)' }}
              />
            </button>

            {/* Title - Center */}
            <h1 
              className="flex-1 font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 drop-shadow-[0_2px_8px_rgba(234,179,8,0.6)]"
              style={{ fontSize: 'clamp(1.125rem, 4.5vw, 1.875rem)' }}
            >
              {t('gifts.title')}
            </h1>

            {/* Play Button - Right */}
            <button
              onClick={() => navigate('/game')}
              className="relative rounded-full hover:scale-110 transition-all flex-shrink-0"
              style={{ 
                padding: 'clamp(8px, 2vw, 12px)',
                minWidth: 'clamp(40px, 10vw, 56px)',
                minHeight: 'clamp(40px, 10vw, 56px)'
              }}
              title="Play Game"
            >
              {/* BASE SHADOW */}
              <div className="absolute inset-0 bg-black/40 rounded-full" style={{ transform: 'translate(3px, 3px)', filter: 'blur(4px)' }} aria-hidden />
              
              {/* OUTER FRAME - Green */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-700 via-green-600 to-green-900 border-2 border-green-400/50 shadow-lg" aria-hidden />
              
              {/* MIDDLE FRAME */}
              <div className="absolute inset-[3px] rounded-full bg-gradient-to-b from-green-600 via-green-500 to-green-800" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }} aria-hidden />
              
              {/* INNER LAYER */}
              <div className="absolute inset-[5px] rounded-full bg-gradient-to-b from-green-500 via-green-600 to-green-700" style={{ boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.2), inset 0 -8px 16px rgba(0,0,0,0.3)' }} aria-hidden />
              
              {/* SPECULAR HIGHLIGHT */}
              <div className="absolute inset-[5px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)' }} aria-hidden />
              
              {/* Icon */}
              <Play 
                className="text-white relative z-10 fill-white" 
                style={{ width: 'clamp(20px, 5vw, 24px)', height: 'clamp(20px, 5vw, 24px)' }}
              />
            </button>
          </div>

          {/* Header removed from here as it's now part of the button row above */}

          {/* My Reward Boxes Section */}
          <div style={{ marginBottom: 'clamp(12px, 3vh, 24px)' }}>
            <h2 
              className="font-bold text-yellow-400 drop-shadow-[0_2px_4px_rgba(234,179,8,0.4)]"
              style={{ 
                fontSize: 'clamp(1rem, 3.5vw, 1.25rem)',
                marginBottom: 'clamp(6px, 1.5vh, 12px)'
              }}
            >
              {t('gifts.my_boxes')}
            </h2>
            <div 
              className="grid grid-cols-5"
              style={{ gap: 'clamp(6px, 1.5vw, 12px)' }}
            >
              {Array.from({ length: 10 }).map((_, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg bg-black/40 border border-yellow-500/30 flex items-center justify-center backdrop-blur-sm opacity-40"
                >
                  <img src={boxGold} alt="Gift box" className="w-3/4 h-3/4 object-contain" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span 
                      className="font-bold text-yellow-400/60"
                      style={{ fontSize: 'clamp(8px, 2vw, 10px)' }}
                    >
                      {t('gifts.inactive')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Get New Rewards Section */}
          <div className="flex-1 flex flex-col min-h-0">
            <h2 
              className="font-bold text-yellow-400 drop-shadow-[0_2px_4px_rgba(234,179,8,0.4)]"
              style={{ 
                fontSize: 'clamp(1rem, 3.5vw, 1.25rem)',
                marginBottom: 'clamp(6px, 1.5vh, 12px)'
              }}
            >
              {t('gifts.get_new')}
            </h2>
            <div 
              className="grid grid-cols-2 flex-1"
              style={{ gap: 'clamp(6px, 1.5vw, 12px)', paddingBottom: 'clamp(4px, 1vh, 8px)' }}
            >
              {packages.map((pkg, index) => (
                <div
                  key={index}
                  className="relative rounded-xl backdrop-blur-sm transform-gpu hover:scale-105 transition-transform cursor-pointer"
                  style={{ padding: 'clamp(8px, 2vw, 16px)' }}
                >
                  {/* 3D Frame Effects */}
                  <div className="absolute rounded-xl bg-black/35 blur-md" style={{ top: '3px', left: '3px', right: '-3px', bottom: '-3px' }} aria-hidden />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-yellow-700/40 via-yellow-600/30 to-yellow-900/40 border-2 border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.4),0_8px_25px_rgba(0,0,0,0.5)]" aria-hidden />
                  <div className="absolute inset-[3px] rounded-xl bg-gradient-to-b from-yellow-600/30 via-yellow-500/20 to-yellow-800/30" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)' }} aria-hidden />
                  <div className="absolute rounded-xl bg-gradient-to-b from-black/50 via-black/60 to-black/70" style={{ top: '5px', left: '5px', right: '5px', bottom: '5px', boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.1), inset 0 -8px 16px rgba(0,0,0,0.4)' }} aria-hidden />

                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center">
                    <img 
                      src={boxGold} 
                      alt="Gift box" 
                      className="object-contain"
                      style={{ 
                        width: 'clamp(48px, 12vw, 80px)', 
                        height: 'clamp(48px, 12vw, 80px)',
                        marginBottom: 'clamp(4px, 1vh, 8px)'
                      }}
                    />
                    <p 
                      className="font-black text-yellow-400"
                      style={{ 
                        fontSize: 'clamp(1rem, 4vw, 1.5rem)',
                        marginBottom: 'clamp(2px, 0.5vh, 4px)'
                      }}
                    >
                      {pkg.boxes} {pkg.boxes === 1 ? t('gifts.box_singular') : t('gifts.box_plural')}
                    </p>
                    <p 
                      className="text-yellow-300/80"
                      style={{ 
                        fontSize: 'clamp(0.625rem, 2.5vw, 0.875rem)',
                        marginBottom: 'clamp(2px, 0.5vh, 4px)'
                      }}
                    >
                      {t('gifts.random_rewards')}
                    </p>
                    <p 
                      className="font-bold text-white"
                      style={{ 
                        fontSize: 'clamp(0.875rem, 3.5vw, 1.25rem)',
                        marginBottom: 'clamp(4px, 1vh, 8px)'
                      }}
                    >
                      {pkg.price}
                    </p>
                    <button 
                      className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 rounded-lg font-bold text-black shadow-lg transition-all"
                      style={{ 
                        padding: 'clamp(4px, 1vh, 8px) clamp(8px, 2vw, 16px)',
                        fontSize: 'clamp(0.75rem, 3vw, 1rem)'
                      }}
                    >
                      {t('gifts.buy')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Gifts;
