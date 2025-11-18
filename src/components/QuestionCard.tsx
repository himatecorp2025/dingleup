import { useState, useRef, useEffect } from "react";
import { Users } from "lucide-react";
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
        {/* Top section: Exit button, Lives, Coins */}
        <GameHeader
          lives={lives}
          maxLives={maxLives}
          coins={coins}
          onExit={onExit}
        />

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
              <GameTimer timeLeft={timeLeft} maxTime={30} />
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

        {/* Bottom section: Help buttons */}
        <GameLifelines
          help5050UsageCount={help5050UsageCount}
          help2xAnswerUsageCount={help2xAnswerUsageCount}
          helpAudienceUsageCount={helpAudienceUsageCount}
          isHelp5050ActiveThisQuestion={isHelp5050ActiveThisQuestion}
          isDoubleAnswerActiveThisQuestion={isDoubleAnswerActiveThisQuestion}
          isAudienceActiveThisQuestion={isAudienceActiveThisQuestion}
          usedQuestionSwap={usedQuestionSwap}
          skipCost={skipCost}
          coins={coins}
          onUseHelp5050={onUseHelp5050}
          onUseHelp2xAnswer={onUseHelp2xAnswer}
          onUseHelpAudience={onUseHelpAudience}
          onUseQuestionSwap={onUseQuestionSwap}
        />
      </div>
    </div>
    </ScreenshotProtection>
  );
};
