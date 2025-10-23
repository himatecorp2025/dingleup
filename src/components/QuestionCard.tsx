import { RefreshCw, LogOut, Users, SkipForward, Coins } from "lucide-react";
import { MillionaireQuestion } from "./MillionaireQuestion";
import { MillionaireAnswer } from "./MillionaireAnswer";
import { TimerCircle } from "./TimerCircle";
import { HexagonButton } from "./HexagonButton";
import { Question, getSkipCost } from "@/types/game";

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  timeLeft: number;
  selectedAnswer: string | null;
  firstAttempt: string | null;
  removedAnswer: string | null;
  audienceVotes: Record<string, number>;
  usedHelp5050: boolean;
  isDoubleAnswerActiveThisQuestion: boolean;
  usedHelpAudience: boolean;
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
  usedHelp5050,
  isDoubleAnswerActiveThisQuestion,
  usedHelpAudience,
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
  const correctAnswerKey = question.answers.find(a => a.correct)?.key || "";
  const skipCost = getSkipCost(questionNumber - 1); // Convert to 0-indexed

  return (
    <div className={`w-full h-full flex flex-col p-1 sm:p-2 gap-1 sm:gap-2 ${className}`}>
      {/* Top section: Exit button, Lives, Coins */}
      <div className="flex justify-between items-start mb-1">
        <button
          onClick={onExit}
          className="p-2 sm:p-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-full shadow-lg hover:from-red-700 hover:to-red-900 transition-all hover:scale-110 border-2 border-red-400/50"
          title="Vissza"
        >
          <LogOut className="w-5 h-5 sm:w-6 sm:h-6 -scale-x-100" />
        </button>

        <div className="flex gap-2 sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-2 bg-black/40 px-2 sm:px-3 py-1 rounded-full">
            <span className="text-red-500 text-lg sm:text-xl">❤️</span>
            <span className="text-white font-bold text-sm sm:text-base">{lives}/{maxLives}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 bg-black/40 px-2 sm:px-3 py-1 rounded-full">
            <span className="text-yellow-500 text-lg sm:text-xl">🪙</span>
            <span className="text-white font-bold text-sm sm:text-base">{coins}</span>
          </div>
        </div>
      </div>

      {/* Middle section: Question and Answers */}
      <div className="flex flex-col justify-start space-y-1 sm:space-y-1.5">
        <div className="flex justify-center mb-0.5 sm:mb-1">
          <TimerCircle timeLeft={timeLeft} />
        </div>

        <MillionaireQuestion questionNumber={questionNumber}>
          {question.question}
        </MillionaireQuestion>

        <div className="space-y-1.5">{question.answers.map((answer) => {
            const isRemoved = removedAnswer === answer.key;
            const isSelected = selectedAnswer === answer.key;
            const isCorrect = isSelected && answer.key === correctAnswerKey;
            const isWrong = isSelected && answer.key !== correctAnswerKey;
            const isFirstAttempt = firstAttempt === answer.key;
            const isDoubleChoiceActive = isDoubleAnswerActiveThisQuestion && isFirstAttempt && !selectedAnswer;

            return (
              <div key={answer.key} className="relative">
                <MillionaireAnswer
                  letter={answer.key as 'A' | 'B' | 'C'}
                  onClick={() => !disabled && onAnswerSelect(answer.key)}
                  isSelected={isSelected}
                  isCorrect={isCorrect}
                  isWrong={isWrong}
                  disabled={disabled || isRemoved}
                  isRemoved={isRemoved}
                  isDoubleChoiceActive={isDoubleChoiceActive}
                >
                  {answer.text}
                </MillionaireAnswer>
                
                {/* Audience percentage */}
                {usedHelpAudience && audienceVotes[answer.key] && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-purple-600/90 px-3 py-1 rounded-full">
                    <Users className="w-4 h-4 text-white" />
                    <span className="text-white font-bold text-sm">
                      {audienceVotes[answer.key]}%
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom section: Help buttons - hexagon shaped with centered text */}
      <div className="grid grid-cols-4 gap-1 sm:gap-1.5 mt-2 mb-2">
        <button
          onClick={onUseHelp5050}
          disabled={disabled || usedHelp5050}
          className={`clip-hexagon-tall bg-gradient-to-br from-blue-600 to-blue-900 border-2 border-blue-400 shadow-lg shadow-blue-500/50 hover:scale-105 transition-all casino-card text-white font-bold text-xs sm:text-sm ${usedHelp5050 ? 'opacity-50' : ''}`}
        >
          1/3
        </button>
        
        <button
          onClick={onUseHelp2xAnswer}
          disabled={disabled || isDoubleAnswerActiveThisQuestion}
          className={`clip-hexagon-tall bg-gradient-to-br from-green-600 to-green-900 border-2 border-green-400 shadow-lg shadow-green-500/50 hover:scale-105 transition-all casino-card text-white font-bold text-xs sm:text-sm ${isDoubleAnswerActiveThisQuestion ? 'opacity-50' : ''}`}
        >
          2x
        </button>
        
        <button
          onClick={onUseHelpAudience}
          disabled={disabled || usedHelpAudience}
          className={`clip-hexagon-tall bg-gradient-to-br from-purple-600 to-purple-900 border-2 border-purple-400 shadow-lg shadow-purple-500/50 hover:scale-105 transition-all casino-card text-white ${usedHelpAudience ? 'opacity-50' : ''}`}
        >
          <Users className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        
        <button
          onClick={onUseQuestionSwap}
          disabled={disabled || usedQuestionSwap}
          className={`clip-hexagon-tall bg-gradient-to-br from-red-600 to-red-900 border-2 border-red-400 shadow-lg shadow-red-500/50 hover:scale-105 transition-all casino-card text-white flex flex-col items-center justify-center ${usedQuestionSwap ? 'opacity-50' : ''}`}
        >
          <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] sm:text-xs font-bold flex items-center gap-0.5 mt-1">
            <Coins className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            {skipCost}
          </span>
        </button>
      </div>
    </div>
  );
};
