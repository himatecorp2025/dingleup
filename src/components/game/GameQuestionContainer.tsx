import { memo, ReactNode } from 'react';

interface GameQuestionContainerProps {
  isAnimating: boolean;
  translateY: number;
  questionVisible: boolean;
  children: ReactNode;
}

export const GameQuestionContainer = memo(({
  isAnimating,
  translateY,
  questionVisible,
  children
}: GameQuestionContainerProps) => {
  return (
    <div 
      className="absolute inset-0 w-full h-full"
      style={{ 
        transform: isAnimating 
          ? 'translate3d(0, -100%, 0)' // GPU-accelerated
          : `translate3d(0, ${translateY}px, 0)`, // GPU-accelerated
        transition: isAnimating 
          ? 'transform 400ms cubic-bezier(0.25, 0.1, 0.25, 1.0)' // Ultra-smooth ease-in-out
          : 'transform 0ms',
        willChange: isAnimating || translateY !== 0 ? 'transform' : 'auto',
        backfaceVisibility: 'hidden', // Prevent flickering
        WebkitBackfaceVisibility: 'hidden',
        WebkitFontSmoothing: 'antialiased', // Smoother text rendering during animation
      }}
    >
      <div 
        className="w-full h-full"
        style={{ 
          opacity: questionVisible ? 1 : 0,
          transition: 'opacity 200ms ease-in-out',
        }}
      >
        {children}
      </div>
    </div>
  );
});

GameQuestionContainer.displayName = 'GameQuestionContainer';
