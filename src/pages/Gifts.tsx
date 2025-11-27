import { useI18n } from '@/i18n';
import BottomNav from '@/components/BottomNav';
import boxGold from '@/assets/box-gold.svg';

const Gifts = () => {
  const { t } = useI18n();

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

      <div className="relative z-10 flex-1 flex flex-col overflow-hidden pb-32">
        <div className="container mx-auto px-4 py-3 max-w-2xl flex-1 flex flex-col justify-between">
          {/* Header */}
          <h1 className="text-2xl md:text-3xl font-black text-center mb-3 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 drop-shadow-[0_2px_8px_rgba(234,179,8,0.6)]">
            {t('gifts.title')}
          </h1>

          {/* My Reward Boxes Section */}
          <div className="mb-4">
            <h2 className="text-lg md:text-xl font-bold mb-2 text-yellow-400 drop-shadow-[0_2px_4px_rgba(234,179,8,0.4)]">
              {t('gifts.my_boxes')}
            </h2>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }).map((_, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg bg-black/40 border border-yellow-500/30 flex items-center justify-center backdrop-blur-sm opacity-40"
                >
                  <img src={boxGold} alt="Gift box" className="w-3/4 h-3/4 object-contain" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-yellow-400/60">{t('gifts.inactive')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Get New Rewards Section */}
          <div className="flex-1 flex flex-col min-h-0">
            <h2 className="text-lg md:text-xl font-bold mb-2 text-yellow-400 drop-shadow-[0_2px_4px_rgba(234,179,8,0.4)]">
              {t('gifts.get_new')}
            </h2>
            <div className="grid grid-cols-2 gap-2 pb-2">
              {packages.map((pkg, index) => (
                <div
                  key={index}
                  className="relative rounded-xl p-3 backdrop-blur-sm transform-gpu hover:scale-105 transition-transform cursor-pointer"
                >
                  {/* 3D Frame Effects */}
                  <div className="absolute rounded-xl bg-black/35 blur-md" style={{ top: '3px', left: '3px', right: '-3px', bottom: '-3px' }} aria-hidden />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-yellow-700/40 via-yellow-600/30 to-yellow-900/40 border-2 border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.4),0_8px_25px_rgba(0,0,0,0.5)]" aria-hidden />
                  <div className="absolute inset-[3px] rounded-xl bg-gradient-to-b from-yellow-600/30 via-yellow-500/20 to-yellow-800/30" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)' }} aria-hidden />
                  <div className="absolute rounded-xl bg-gradient-to-b from-black/50 via-black/60 to-black/70" style={{ top: '5px', left: '5px', right: '5px', bottom: '5px', boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.1), inset 0 -8px 16px rgba(0,0,0,0.4)' }} aria-hidden />

                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center">
                    <img src={boxGold} alt="Gift box" className="w-16 h-16 object-contain mb-1" />
                    <p className="text-xl font-black text-yellow-400 mb-1">{pkg.boxes} {pkg.boxes === 1 ? t('gifts.box_singular') : t('gifts.box_plural')}</p>
                    <p className="text-xs text-yellow-300/80 mb-1">{t('gifts.random_rewards')}</p>
                    <p className="text-lg font-bold text-white mb-2">{pkg.price}</p>
                    <button className="w-full py-1.5 px-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 rounded-lg font-bold text-black text-sm shadow-lg transition-all">
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
