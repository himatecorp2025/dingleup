import { useState, useRef, useEffect } from "react";
import { MillionaireQuestion } from "./MillionaireQuestion";
import { MillionaireAnswer } from "./MillionaireAnswer";
import { Question, getSkipCost } from "@/types/game";
import { ScreenshotProtection } from "./ScreenshotProtection";
import { QuestionLikeButton } from "./QuestionLikeButton";
import { DoubleTapLikeOverlay } from "./DoubleTapLikeOverlay";
import { useQuestionLike } from "@/hooks/useQuestionLike";
import { GameHeader } from "./game/GameHeader";
import { GameTimer } from "./game/GameTimer";
import { GameLifelines } from "./game/GameLifelines";

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  timeLeft: number;
  selectedAnswer: string | null;
  firstAttempt: string | null;
  removedAnswer: string | null;
  audienceVotes: Record<string, number>;
  help5050UsageCount: number;
  help2xAnswerUsageCount: number;
  helpAudienceUsageCount: number;
  isHelp5050ActiveThisQuestion: boolean;
  isDoubleAnswerActiveThisQuestion: boolean;
  isAudienceActiveThisQuestion: boolean;
  usedQuestionSwap: boolean;
  lives: number;
  maxLives: number;
  coins: number;
  onAnswerSelect: (answerId: string) => void;
  onUseHelp5050: () => void;
  onUseHelp2xAnswer: () => void;
  onUseHelpAudience: () => void;
  onUseQuestionSwap: () => void;
  onExit: () => void;
  disabled?: boolean;
  className?: string;
}

export const QuestionCard = ({
  question,
  questionNumber,
  timeLeft,
  selectedAnswer,
  firstAttempt,
  removedAnswer,
  audienceVotes,
  help5050UsageCount,
  help2xAnswerUsageCount,
  helpAudienceUsageCount,
  isHelp5050ActiveThisQuestion,
  isDoubleAnswerActiveThisQuestion,
  isAudienceActiveThisQuestion,
  usedQuestionSwap,
  lives,
  maxLives,
  coins,
  onAnswerSelect,
  onUseHelp5050,
  onUseHelp2xAnswer,
  onUseHelpAudience,
  onUseQuestionSwap,
  onExit,
  disabled = false,
  className = ""
}: QuestionCardProps) => {
  const answers = Array.isArray(question.answers) ? question.answers : [];
  const correctAnswerKey = answers.find(a => a.correct)?.key || "";
  const skipCost = getSkipCost(questionNumber - 1); // Convert to 0-indexed

  // Double tap detection for like
  const { toggleLike } = useQuestionLike(question.id);
  const [showDoubleTapAnimation, setShowDoubleTapAnimation] = useState(false);
  const lastTapRef = useRef<number>(0);
  const doubleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDoubleTap = async () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < 300) {
      // Double tap detected
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current);
      }
      
      const wasLiked = await toggleLike();
      if (wasLiked) {
        setShowDoubleTapAnimation(true);
      }
      lastTapRef.current = 0;
    } else {
      // First tap
      lastTapRef.current = now;
      
      // Clear any existing timeout
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current);
      }
      
      // Reset after 300ms
      doubleTapTimeoutRef.current = setTimeout(() => {
        lastTapRef.current = 0;
      }, 300);
    }
  };

  useEffect(() => {
    return () => {
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current);
      }
    };
  }, []);

  return (
    <ScreenshotProtection enabled={true}>
      {/* Double tap like overlay */}
      <DoubleTapLikeOverlay 
        show={showDoubleTapAnimation} 
        onAnimationEnd={() => setShowDoubleTapAnimation(false)} 
      />
      
      <div className={`w-full h-full flex flex-col pt-0 px-2 sm:px-3 md:px-4 pb-2 gap-0 ${className} relative`}>
        {/* Top section: Exit button, Lives, Coins - Moved higher */}
      <div className="flex justify-between items-start pt-2 sm:pt-3">
        {/* Back Button - 3D Round Style */}
        <div className="relative">
          <button
            onClick={onExit}
            className="relative p-3 rounded-full hover:scale-110 transition-all"
            title="Vissza a témakategóriára"
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
            <LogOut className="w-6 h-6 text-white relative z-10 -scale-x-100" />
          </button>
        </div>

        <div className="flex gap-1.5 sm:gap-2 md:gap-4">
          {/* Lives indicator with deep 3D */}
          <div className="relative rounded-full" style={{ perspective: '500px' }}>
            {/* BASE SHADOW */}
            <div className="absolute inset-0 bg-black/60 rounded-full" style={{ transform: 'translate(3px, 3px)', filter: 'blur(4px)' }} aria-hidden />
            
            {/* OUTER FRAME */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-700 via-red-600 to-red-900 border border-red-400/50 shadow-lg" aria-hidden />
            
            {/* MIDDLE FRAME */}
            <div className="absolute inset-[2px] rounded-full bg-gradient-to-b from-black/60 via-black/40 to-black/80" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.2), inset 0 -2px 0 rgba(0,0,0,0.4)' }} aria-hidden />
            
            {/* SPECULAR HIGHLIGHT */}
            <div className="absolute inset-[2px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 30%, transparent 60%)' }} aria-hidden />
            
            <div className="relative flex items-center gap-1 sm:gap-1.5 md:gap-2 px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 z-10">
              <span className="text-red-500 text-base sm:text-lg md:text-xl">❤️</span>
              <span className="text-white font-bold text-xs sm:text-sm md:text-base drop-shadow-lg">{lives}/{maxLives}</span>
            </div>
          </div>
          
          {/* Coins indicator with deep 3D */}
          <div className="relative rounded-full" style={{ perspective: '500px' }}>
            {/* BASE SHADOW */}
            <div className="absolute inset-0 bg-black/60 rounded-full" style={{ transform: 'translate(3px, 3px)', filter: 'blur(4px)' }} aria-hidden />
            
            {/* OUTER FRAME */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-700 via-yellow-600 to-yellow-900 border border-yellow-400/50 shadow-lg" aria-hidden />
            
            {/* MIDDLE FRAME */}
            <div className="absolute inset-[2px] rounded-full bg-gradient-to-b from-black/60 via-black/40 to-black/80" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.2), inset 0 -2px 0 rgba(0,0,0,0.4)' }} aria-hidden />
            
            {/* SPECULAR HIGHLIGHT */}
            <div className="absolute inset-[2px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 30%, transparent 60%)' }} aria-hidden />
            
            <div className="relative flex items-center gap-1 sm:gap-1.5 md:gap-2 px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 z-10">
              <span className="text-yellow-500 text-base sm:text-lg md:text-xl">🪙</span>
              <span className="text-white font-bold text-xs sm:text-sm md:text-base drop-shadow-lg">{coins}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Wrapper for Timer + Question + Answers + Help - Vertically centered on mobile/tablet */}
      <div className="flex-grow flex flex-col justify-center md:justify-start space-y-1 sm:space-y-1.5 md:space-y-2 pt-[7.2rem] sm:pt-[9rem] pb-[7.2rem] sm:pb-[9rem] md:pt-0 md:pb-0 md:mt-[5.5vh]">
        {/* Middle section: Question and Answers with Like Button */}
        <div className="relative flex">
          {/* Question and Answers - with double tap detection */}
          <div 
            className="flex-1 flex flex-col space-y-1 sm:space-y-1.5 md:space-y-2"
            onClick={handleDoubleTap}
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          >
            <div className="flex justify-center -mt-[7.2rem] sm:-mt-[9rem] md:-mt-[10.8rem]">
              <TimerCircle timeLeft={timeLeft} />
            </div>

            <div className="-mt-[0.1rem] sm:-mt-[0.2rem] md:-mt-[0.3rem] pb-10 sm:pb-12 md:pb-16">
              <MillionaireQuestion questionNumber={questionNumber}>
                {question.question}
              </MillionaireQuestion>
            </div>

            {/* Answers with exact spacing */}
            <div className="mt-0">
              <div className="space-y-4 sm:space-y-6 mb-4 sm:mb-6">{question.answers.map((answer) => {
                const isRemoved = removedAnswer === answer.key;
                const isSelected = selectedAnswer === answer.key;
                const isCorrect = answer.key === correctAnswerKey;
                const isSelectedCorrect = isSelected && isCorrect;
                const isSelectedWrong = isSelected && !isCorrect;
                const isFirstAttempt = firstAttempt === answer.key;
                const isDoubleChoiceActive = isDoubleAnswerActiveThisQuestion && isFirstAttempt && !selectedAnswer;
                const showCorrectPulse = selectedAnswer && !isSelected && isCorrect; // Show green pulse on correct when user selected wrong

                return (
                  <div key={answer.key} className="relative">
                    <MillionaireAnswer
                      letter={answer.key as 'A' | 'B' | 'C'}
                      onClick={() => !disabled && onAnswerSelect(answer.key)}
                      isSelected={isSelected}
                      isCorrect={isSelectedCorrect}
                      isWrong={isSelectedWrong}
                      disabled={disabled || isRemoved}
                      isRemoved={isRemoved}
                      isDoubleChoiceActive={isDoubleChoiceActive}
                      showCorrectPulse={showCorrectPulse}
                    >
                      {answer.text}
                    </MillionaireAnswer>
                    
                    {/* Audience percentage */}
                    {isAudienceActiveThisQuestion && audienceVotes[answer.key] && (
                      <div className="absolute right-2 sm:right-3 md:right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-1.5 md:gap-2 bg-purple-600/90 px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 rounded-full">
                        <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white" />
                        <span className="text-white font-bold text-xs sm:text-sm">
                          {audienceVotes[answer.key]}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            </div>
          </div>

          {/* TikTok-style Like Button - Right Action Bar */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
            <QuestionLikeButton questionId={question.id} />
          </div>
        </div>

        {/* Bottom section: Help buttons - hexagon shaped with deep 3D */}
        <div className="grid grid-cols-4 gap-1 sm:gap-2 md:gap-3 mt-0">
        {/* 1/3 Help Button */}
        <div className="relative" style={{ perspective: '600px' }}>
          <button
            onClick={onUseHelp5050}
            disabled={disabled || help5050UsageCount >= 2}
            className={`relative w-full clip-hexagon-tall text-white font-bold text-[10px] sm:text-xs md:text-sm flex flex-col items-center justify-center gap-0.5 transition-all ${help5050UsageCount >= 2 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
          >
            {/* BASE SHADOW */}
            <div className="absolute inset-0 bg-black/60" style={{ transform: 'translate(3px, 3px)', filter: 'blur(4px)', clipPath: 'inherit' }} aria-hidden />
            
            {/* OUTER FRAME */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 border-2 border-blue-300/80 shadow-lg" style={{ clipPath: 'inherit', transform: 'translateZ(0px)' }} aria-hidden />
            
            {/* MIDDLE FRAME */}
            <div className="absolute inset-[3px] bg-gradient-to-b from-black/40 via-transparent to-black/60" style={{ clipPath: 'inherit', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.4)', transform: 'translateZ(8px)' }} aria-hidden />
            
            {/* INNER LAYER */}
            <div className="absolute inset-[4px] bg-gradient-to-br from-blue-500/80 to-blue-700/80" style={{ clipPath: 'inherit', boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.15), inset 0 -8px 16px rgba(0,0,0,0.3)', transform: 'translateZ(15px)' }} aria-hidden />
            
            {/* SPECULAR HIGHLIGHT */}
            <div className="absolute inset-[4px] pointer-events-none" style={{ clipPath: 'inherit', background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 30%, transparent 60%)', transform: 'translateZ(20px)' }} aria-hidden />
            
            <div className="relative z-10 font-poppins" style={{ transform: 'translateZ(25px)', textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)' }}>
              <span className="font-bold text-base sm:text-lg">1/3</span>
              {help5050UsageCount === 1 && (
                <span className="text-xs sm:text-sm flex items-center gap-1 font-bold">
                  <Coins className="w-4 h-4 sm:w-5 sm:h-5" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))' }} />
                  15
                </span>
              )}
            </div>
          </button>
        </div>
        
        {/* 2x Help Button */}
        <div className="relative" style={{ perspective: '600px' }}>
          <button
            onClick={onUseHelp2xAnswer}
            disabled={disabled || help2xAnswerUsageCount >= 2}
            className={`relative w-full clip-hexagon-tall text-white font-bold text-[10px] sm:text-xs md:text-sm flex flex-col items-center justify-center gap-0.5 transition-all ${help2xAnswerUsageCount >= 2 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
          >
            {/* BASE SHADOW */}
            <div className="absolute inset-0 bg-black/60" style={{ transform: 'translate(3px, 3px)', filter: 'blur(4px)', clipPath: 'inherit' }} aria-hidden />
            
            {/* OUTER FRAME */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-green-500 to-green-600 border-2 border-green-300/80 shadow-lg" style={{ clipPath: 'inherit', transform: 'translateZ(0px)' }} aria-hidden />
            
            {/* MIDDLE FRAME */}
            <div className="absolute inset-[3px] bg-gradient-to-b from-black/40 via-transparent to-black/60" style={{ clipPath: 'inherit', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.4)', transform: 'translateZ(8px)' }} aria-hidden />
            
            {/* INNER LAYER */}
            <div className="absolute inset-[4px] bg-gradient-to-br from-green-500/80 to-green-700/80" style={{ clipPath: 'inherit', boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.15), inset 0 -8px 16px rgba(0,0,0,0.3)', transform: 'translateZ(15px)' }} aria-hidden />
            
            {/* SPECULAR HIGHLIGHT */}
            <div className="absolute inset-[4px] pointer-events-none" style={{ clipPath: 'inherit', background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 30%, transparent 60%)', transform: 'translateZ(20px)' }} aria-hidden />
            
            <div className="relative z-10 font-poppins" style={{ transform: 'translateZ(25px)', textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)' }}>
              <span className="font-bold text-base sm:text-lg">2x</span>
              {help2xAnswerUsageCount === 1 && (
                <span className="text-xs sm:text-sm flex items-center gap-1 font-bold">
                  <Coins className="w-4 h-4 sm:w-5 sm:h-5" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))' }} />
                  20
                </span>
              )}
            </div>
          </button>
        </div>
        
        {/* Audience Help Button */}
        <div className="relative" style={{ perspective: '600px' }}>
          <button
            onClick={onUseHelpAudience}
            disabled={disabled || helpAudienceUsageCount >= 2}
            className={`relative w-full clip-hexagon-tall text-white text-[10px] sm:text-xs md:text-sm flex flex-col items-center justify-center gap-0.5 transition-all ${helpAudienceUsageCount >= 2 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
          >
            {/* BASE SHADOW */}
            <div className="absolute inset-0 bg-black/60" style={{ transform: 'translate(3px, 3px)', filter: 'blur(4px)', clipPath: 'inherit' }} aria-hidden />
            
            {/* OUTER FRAME */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 border-2 border-purple-300/80 shadow-lg" style={{ clipPath: 'inherit', transform: 'translateZ(0px)' }} aria-hidden />
            
            {/* MIDDLE FRAME */}
            <div className="absolute inset-[3px] bg-gradient-to-b from-black/40 via-transparent to-black/60" style={{ clipPath: 'inherit', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.4)', transform: 'translateZ(8px)' }} aria-hidden />
            
            {/* INNER LAYER */}
            <div className="absolute inset-[4px] bg-gradient-to-br from-purple-500/80 to-purple-700/80" style={{ clipPath: 'inherit', boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.15), inset 0 -8px 16px rgba(0,0,0,0.3)', transform: 'translateZ(15px)' }} aria-hidden />
            
            {/* SPECULAR HIGHLIGHT */}
            <div className="absolute inset-[4px] pointer-events-none" style={{ clipPath: 'inherit', background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 30%, transparent 60%)', transform: 'translateZ(20px)' }} aria-hidden />
            
            <div className="relative z-10 font-poppins" style={{ transform: 'translateZ(25px)', textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)' }}>
              <Users className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))' }} />
              {helpAudienceUsageCount === 1 && (
                <span className="text-xs sm:text-sm flex items-center gap-1 font-bold">
                  <Coins className="w-4 h-4 sm:w-5 sm:h-5" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))' }} />
                  30
                </span>
              )}
            </div>
          </button>
        </div>
        
        {/* Skip Question Button */}
        <div className="relative" style={{ perspective: '600px' }}>
          <button
            onClick={onUseQuestionSwap}
            disabled={disabled || usedQuestionSwap}
            className={`relative w-full clip-hexagon-tall text-white text-[10px] sm:text-xs md:text-sm flex flex-col items-center justify-center gap-0.5 transition-all ${usedQuestionSwap ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
          >
            {/* BASE SHADOW */}
            <div className="absolute inset-0 bg-black/60" style={{ transform: 'translate(3px, 3px)', filter: 'blur(4px)', clipPath: 'inherit' }} aria-hidden />
            
            {/* OUTER FRAME */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-400 via-red-500 to-red-600 border-2 border-red-300/80 shadow-lg" style={{ clipPath: 'inherit', transform: 'translateZ(0px)' }} aria-hidden />
            
            {/* MIDDLE FRAME */}
            <div className="absolute inset-[3px] bg-gradient-to-b from-black/40 via-transparent to-black/60" style={{ clipPath: 'inherit', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.4)', transform: 'translateZ(8px)' }} aria-hidden />
            
            {/* INNER LAYER */}
            <div className="absolute inset-[4px] bg-gradient-to-br from-red-500/80 to-red-700/80" style={{ clipPath: 'inherit', boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.15), inset 0 -8px 16px rgba(0,0,0,0.3)', transform: 'translateZ(15px)' }} aria-hidden />
            
            {/* SPECULAR HIGHLIGHT */}
            <div className="absolute inset-[4px] pointer-events-none" style={{ clipPath: 'inherit', background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 30%, transparent 60%)', transform: 'translateZ(20px)' }} aria-hidden />
            
            <div className="relative z-10 font-poppins flex flex-col items-center gap-0.5" style={{ transform: 'translateZ(25px)', textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)' }}>
              <SkipForward className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))' }} />
              <span className="text-xs sm:text-sm flex items-center gap-1 font-bold">
                <Coins className="w-4 h-4 sm:w-5 sm:h-5" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))' }} />
                {skipCost}
              </span>
            </div>
          </button>
        </div>
      </div>
      </div>
    </div>
    </ScreenshotProtection>
  );
};
