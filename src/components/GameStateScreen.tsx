import { usePlatformDetection } from '@/hooks/usePlatformDetection';

interface GameStateScreenProps {
  type: 'timeout' | 'lose' | 'out-of-lives' | 'win';
  onContinue: () => void;
  onSkip?: () => void;
  score?: number;
  totalScore?: number;
  reward?: number;
}

export const GameStateScreen = ({ 
  type, 
  onContinue, 
  onSkip,
  score = 0,
  totalScore = 0,
  reward = 0
}: GameStateScreenProps) => {
  const isHandheld = usePlatformDetection();
  
  const isWinState = type === 'win';
  const isLoseState = type === 'lose' || type === 'timeout' || type === 'out-of-lives';

  const config = {
    win: {
      title: 'YOU WIN!',
      bgColor: 'from-purple-600 to-purple-800',
      titleColor: 'from-white to-purple-100',
      borderColor: 'border-yellow-400',
      stars: [true, true, true],
      buttonText: 'OK',
      buttonColor: 'from-pink-500 to-pink-700'
    },
    lose: {
      title: 'YOU LOSE!',
      bgColor: 'from-red-600 to-red-800',
      titleColor: 'from-white to-red-100',
      borderColor: 'border-gray-400',
      stars: [false, false, false],
      buttonText: 'Továbbjutás 50 aranyért',
      buttonColor: 'from-pink-500 to-pink-700'
    },
    timeout: {
      title: 'YOU LOSE!',
      bgColor: 'from-orange-600 to-orange-800',
      titleColor: 'from-white to-orange-100',
      borderColor: 'border-gray-400',
      stars: [false, false, false],
      buttonText: 'Továbbjutás 150 aranyért',
      buttonColor: 'from-pink-500 to-pink-700'
    },
    'out-of-lives': {
      title: 'YOU LOSE!',
      bgColor: 'from-red-600 to-red-800',
      titleColor: 'from-white to-red-100',
      borderColor: 'border-gray-400',
      stars: [false, false, false],
      buttonText: 'Vásárolj +5 életet',
      buttonColor: 'from-green-500 to-green-700'
    }
  };

  const { title, bgColor, titleColor, borderColor, stars, buttonText, buttonColor } = config[type];

  if (!isHandheld) {
    // Fallback for desktop
    return (
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/80">
        <div className="text-center space-y-6 max-w-md w-full">
          <h1 className="text-4xl font-black text-white">{title}</h1>
          <button onClick={onContinue} className="px-8 py-4 bg-purple-600 text-white rounded-lg font-bold">
            {buttonText}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div 
        className="relative w-full h-full flex items-center justify-center p-[4vw]"
      >
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/20 animate-pulse"
              style={{
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${Math.random() * 3 + 2}s`
              }}
            />
          ))}
        </div>
        {/* Main hexagon card */}
        <div 
          className={`relative bg-gradient-to-b ${bgColor} rounded-3xl border-8 ${borderColor} shadow-2xl p-[5vw] w-[85vw] max-w-[500px] z-10`}
          style={{
            clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
            aspectRatio: '0.85'
          }}
        >
          {/* Inner border effect */}
          <div className="absolute inset-[12px] bg-gradient-to-b from-purple-400/20 to-transparent rounded-2xl"
               style={{
                 clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'
               }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-between h-full">
            {/* Title banner */}
            <div className={`bg-gradient-to-b ${isWinState ? 'from-purple-700 to-purple-900' : 'from-red-700 to-red-900'} px-[8vw] py-[2vh] rounded-2xl border-4 ${borderColor} -mt-[2vh] shadow-xl`}
                 style={{
                   clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)'
                 }}>
              <h1 className={`font-black text-center bg-gradient-to-b ${titleColor} bg-clip-text text-transparent drop-shadow-lg`}
                  style={{ fontSize: 'clamp(1.5rem, 7vw, 2.5rem)' }}>
                {title}
              </h1>
            </div>

            {/* Stars */}
            <div className="flex gap-[4vw] my-[2vh]">
              {stars.map((filled, i) => (
                <div key={i} style={{ fontSize: 'clamp(2.5rem, 12vw, 5rem)' }}>
                  {filled ? '⭐' : '☆'}
                </div>
              ))}
            </div>

            {/* Score display */}
            <div className="text-center space-y-[1vh]">
              <p className="text-white font-black drop-shadow-lg" style={{ fontSize: 'clamp(1rem, 4.5vw, 1.5rem)' }}>
                YOUR SCORE: {score}
              </p>
              <p className="text-white/80 font-bold drop-shadow-md" style={{ fontSize: 'clamp(0.875rem, 4vw, 1.25rem)' }}>
                TOTAL SCORE: {totalScore}
              </p>
            </div>

            {/* Reward box */}
            {isWinState && reward > 0 && (
              <div className="bg-purple-800/80 border-4 border-purple-400 rounded-xl px-[6vw] py-[2vh] backdrop-blur-sm">
                <div className="flex items-center gap-[2vw]">
                  <span style={{ fontSize: 'clamp(2rem, 10vw, 3rem)' }}>💎</span>
                  <span className="font-black text-cyan-300 drop-shadow-lg" style={{ fontSize: 'clamp(1.5rem, 7vw, 2.5rem)' }}>
                    +{reward}
                  </span>
                </div>
              </div>
            )}

            {/* Action buttons as circular icons */}
            <div className="flex gap-[6vw] mt-[3vh]">
              {/* List/Menu button */}
              {onSkip && (
                <button
                  onClick={onSkip}
                  className="bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 rounded-full p-[3vw] border-4 border-purple-300 shadow-[0_4px_0_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-1 transition-all"
                  style={{ width: 'clamp(50px, 15vw, 80px)', height: 'clamp(50px, 15vw, 80px)' }}
                >
                  <span style={{ fontSize: 'clamp(1.5rem, 6vw, 2.5rem)' }}>📋</span>
                </button>
              )}

              {/* OK button */}
              <button
                onClick={onContinue}
                className={`bg-gradient-to-b ${buttonColor} hover:opacity-90 rounded-full p-[3vw] border-4 border-white/50 shadow-[0_4px_0_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-1 transition-all`}
                style={{ width: 'clamp(50px, 15vw, 80px)', height: 'clamp(50px, 15vw, 80px)' }}
              >
                <span className="font-black text-white drop-shadow-lg" style={{ fontSize: 'clamp(1rem, 4.5vw, 1.75rem)' }}>
                  OK
                </span>
              </button>

              {/* Replay button */}
              <button
                onClick={onContinue}
                className="bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 rounded-full p-[3vw] border-4 border-purple-300 shadow-[0_4px_0_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-1 transition-all"
                style={{ width: 'clamp(50px, 15vw, 80px)', height: 'clamp(50px, 15vw, 80px)' }}
              >
                <span style={{ fontSize: 'clamp(1.5rem, 6vw, 2.5rem)' }}>🔄</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
