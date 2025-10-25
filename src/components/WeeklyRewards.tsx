import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const WeeklyRewards = () => {
  const rewards = [
    { place: '🥇 1.', coins: 5000, lives: 100 },
    { place: '🥈 2.', coins: 2500, lives: 50 },
    { place: '🥉 3.', coins: 1500, lives: 30 },
    { place: '4.', coins: 1000, lives: 20 },
    { place: '5.', coins: 800, lives: 15 },
    { place: '6.', coins: 700, lives: 10 },
    { place: '7.', coins: 600, lives: 10 },
    { place: '8.', coins: 500, lives: 8 },
    { place: '9.', coins: 500, lives: 6 },
    { place: '10.', coins: 500, lives: 5 }
  ];

  return (
    <div 
      className="relative mb-3 sm:mb-4 px-3 py-4 sm:px-4 sm:py-5 overflow-hidden rounded-2xl mx-2"
      style={{ 
        background: 'linear-gradient(135deg, #0B6A3D 0%, #0D7C4C 25%, #0F8B59 50%, #0D7C4C 75%, #0B6A3D 100%)',
        border: '3px solid #0F8B59',
      }}
    >
      {/* BASE SHADOW (3D depth) */}
      <div
        className="absolute rounded-2xl"
        style={{
          top: '4px',
          left: '4px',
          right: '-4px',
          bottom: '-4px',
          background: 'rgba(0,0,0,0.4)',
          filter: 'blur(6px)',
        }}
        aria-hidden
      />

      {/* Arany ragyogás effekt - 3D enhanced */}
      <div 
        className="absolute inset-0 opacity-20 rounded-2xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.5) 0%, transparent 70%)',
          animation: 'pulse 2s ease-in-out infinite'
        }}
        aria-hidden
      />
      
      {/* SPECULAR HIGHLIGHT */}
      <div
        className="absolute inset-[6px] rounded-2xl pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 30%, transparent 60%)',
        }}
        aria-hidden
      />

      {/* DIAGONAL LIGHT STREAKS */}
      <div
        className="absolute inset-[6px] rounded-2xl pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.08) 10px, rgba(255,255,255,0.08) 14px)',
          opacity: 0.6,
        }}
        aria-hidden
      />
      
      {/* Belső arany keret - 3D enhanced */}
      <div 
        className="absolute inset-2 rounded-xl pointer-events-none"
        style={{
          border: '2px solid rgba(255, 215, 0, 0.5)',
          boxShadow: 'inset 0 0 20px rgba(15, 139, 89, 0.5), inset 0 4px 12px rgba(255,255,255,0.2), inset 0 -4px 12px rgba(0,0,0,0.3)'
        }}
        aria-hidden
      />

      <div className="relative z-10 text-center">
        <div className="flex items-center gap-1.5 sm:gap-2 justify-center mb-2 flex-wrap">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 animate-pulse drop-shadow-lg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L15 8.5L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L9 8.5L12 2Z" stroke="currentColor" strokeWidth="2" fill="currentColor" strokeLinejoin="round"/>
          </svg>
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 drop-shadow-lg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 9H4.5C4.10218 9 3.72064 9.15804 3.43934 9.43934C3.15804 9.72064 3 10.1022 3 10.5V19.5C3 19.8978 3.15804 20.2794 3.43934 20.5607C3.72064 20.842 4.10218 21 4.5 21H19.5C19.8978 21 20.2794 20.842 20.5607 20.5607C20.842 20.2794 21 19.8978 21 19.5V10.5C21 10.1022 20.842 9.72064 20.5607 9.43934C20.2794 9.15804 19.8978 9 19.5 9H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 3L6 9H18L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 9V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-yellow-400 font-black text-base sm:text-lg drop-shadow-lg">HETI JUTALMAK</span>
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 drop-shadow-lg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 9H4.5C4.10218 9 3.72064 9.15804 3.43934 9.43934C3.15804 9.72064 3 10.1022 3 10.5V19.5C3 19.8978 3.15804 20.2794 3.43934 20.5607C3.72064 20.842 4.10218 21 4.5 21H19.5C19.8978 21 20.2794 20.842 20.5607 20.5607C20.842 20.2794 21 19.8978 21 19.5V10.5C21 10.1022 20.842 9.72064 20.5607 9.43934C20.2794 9.15804 19.8978 9 19.5 9H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 3L6 9H18L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 9V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 animate-pulse drop-shadow-lg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L15 8.5L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L9 8.5L12 2Z" stroke="currentColor" strokeWidth="2" fill="currentColor" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="text-[10px] sm:text-[11px] text-yellow-300/90 font-semibold drop-shadow-lg px-2">
          Minden vasárnap 23:55-kor lezárul a rangsorolás. 5 perc szünet után hétfő 00:00-kor kihirdetjük a nyerteseket!
        </p>
      </div>
      
      <div className="relative z-10 mt-3 sm:mt-4 grid grid-cols-2 gap-2 sm:gap-3">
        {rewards.map((reward, index) => (
          <div
            key={index}
            className={`relative rounded-xl p-1.5 sm:p-2 backdrop-blur-sm transition-all hover:scale-105 overflow-hidden ${
              index < 3
                ? 'bg-gradient-to-br from-emerald-700/95 to-emerald-800/95 border-2 sm:border-3 border-yellow-500'
                : 'bg-gradient-to-br from-emerald-800/90 to-emerald-900/90 border border-yellow-500/60'
            }`}
          >
            {/* 3D Box Effect for reward cards */}
            <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.15) 0%, transparent 60%)' }} aria-hidden />
            <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.06) 8px, rgba(255,255,255,0.06) 10px)', opacity: 0.5 }} aria-hidden />
            <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ boxShadow: index < 3 ? 'inset 0 2px 8px rgba(255,255,255,0.2), inset 0 -2px 8px rgba(0,0,0,0.3)' : 'inset 0 1px 4px rgba(255,255,255,0.15), inset 0 -1px 4px rgba(0,0,0,0.2)' }} aria-hidden />

            <div className="relative z-10">
              {index < 3 && (
                <div className="absolute -top-0.5 -right-0.5">
                  <svg className="w-3 h-3 text-yellow-400 animate-pulse" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15 8.5L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L9 8.5L12 2Z" stroke="currentColor" strokeWidth="2" fill="currentColor" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              <div className="flex items-center justify-between mb-1">
                <span className="text-yellow-400 font-black text-xs sm:text-sm drop-shadow-lg">{reward.place}</span>
              </div>
              <div className="flex items-center gap-1 text-xs mb-0.5">
                <svg className="w-3 h-3 text-yellow-400 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="9" fill="currentColor" stroke="#d97706" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="6" fill="none" stroke="#d97706" strokeWidth="1.5" opacity="0.5"/>
                  <text x="12" y="16" textAnchor="middle" fill="#d97706" fontSize="10" fontWeight="bold">$</text>
                </svg>
                <span className="text-yellow-300 font-bold drop-shadow-lg">{reward.coins}</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <svg className="w-3 h-3 text-red-400 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="#dc2626" strokeWidth="1.5"/>
                </svg>
                <span className="text-yellow-300 font-bold drop-shadow-lg">{reward.lives}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <p className="relative z-10 text-[10px] sm:text-[11px] text-yellow-300/90 font-semibold text-center mt-3 sm:mt-4 drop-shadow-lg px-2">
        💰 A jóváírás automatikusan történik a hét lezárása után 💰
      </p>
    </div>
  );
};

export default WeeklyRewards;
