import { HexagonButton } from './HexagonButton';

interface GameStateScreenProps {
  type: 'lose' | 'out-of-lives';
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
    lose: {
      title: 'you lose!',
      titleColor: 'text-red-600',
      buttonText: 'Keep going, you get 2 bonus lives!',
      buttonSubtext: undefined,
      subtitle: 'Restarting with one life!',
      emoji: '❓'
    },
    'out-of-lives': {
      title: "Sadly, you're out of lives!",
      titleColor: 'text-red-600',
      buttonText: 'Get your +5 extra lives now!',
      buttonSubtext: '0.99$',
      subtitle: 'Restarting with one life!',
      emoji: '💔'
    }
  };

  const { title, titleColor, buttonText, buttonSubtext, subtitle, emoji } = config[type];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a] flex items-center justify-center p-4 z-50">
      <div className="text-center space-y-6 max-w-md w-full">
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
