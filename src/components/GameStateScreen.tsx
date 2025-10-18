import { HexagonButton } from './HexagonButton';
import gameBackground from '@/assets/game-background.jpg';

interface GameStateScreenProps {
  type: 'timeout' | 'lose' | 'out-of-lives';
  onContinue: () => void;
  onSkip?: () => void;
  characterImage?: string;
}

export const GameStateScreen = ({ 
  type, 
  onContinue, 
  onSkip,
  characterImage 
}: GameStateScreenProps) => {
  const config = {
    timeout: {
      title: "Lejárt az idő!",
      titleColor: 'text-orange-600',
      buttonText: 'Továbbjutás 150 aranyért',
      buttonSubtext: undefined,
      subtitle: 'Elviszem az alap mennyiséget',
      emoji: '⏰'
    },
    lose: {
      title: 'Rossz válasz!',
      titleColor: 'text-red-600',
      buttonText: 'Továbbjutás 50 aranyért',
      buttonSubtext: undefined,
      subtitle: 'Elviszem az alap mennyiséget',
      emoji: '❌'
    },
    'out-of-lives': {
      title: "Elfogyott az életed!",
      titleColor: 'text-red-600',
      buttonText: 'Vásárolj +5 életet',
      buttonSubtext: '0.99$',
      subtitle: 'Vissza a főoldalra',
      emoji: '💔'
    }
  };

  const { title, titleColor, buttonText, buttonSubtext, subtitle, emoji } = config[type];

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${gameBackground})` }}
      />
      <div className="text-center space-y-6 max-w-md w-full relative z-10">
        {/* Character/Emoji */}
        <div className="text-8xl mb-4 animate-bounce">
          {characterImage ? (
            <img src={characterImage} alt={type} className="w-48 h-48 mx-auto" />
          ) : (
            emoji
          )}
        </div>

        {/* Title */}
        <h1 className={`text-4xl md:text-5xl font-black ${titleColor} drop-shadow-lg`}>
          {title}
        </h1>

        {/* Main Button */}
        <HexagonButton 
          variant="yellow" 
          size="lg" 
          onClick={onContinue}
          className="w-full max-w-sm mx-auto"
        >
          <div className="flex flex-col items-center">
            <span>{buttonText}</span>
            {buttonSubtext && <span className="text-xs mt-1">{buttonSubtext}</span>}
          </div>
        </HexagonButton>

        {/* Subtitle */}
        {onSkip && (
          <button 
            onClick={onSkip}
            className="text-white text-sm hover:underline"
          >
            {subtitle}
          </button>
        )}
      </div>
    </div>
  );
};
