import { RefreshCw, LogOut, Users, SkipForward } from "lucide-react";
import { MillionaireQuestion } from "./MillionaireQuestion";
import { MillionaireAnswer } from "./MillionaireAnswer";
import { TimerCircle } from "./TimerCircle";
import { Button } from "./ui/button";
import { Question } from "@/types/game";

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  timeLeft: number;
  selectedAnswer: string | null;
  firstAttempt: string | null;
  removedAnswer: string | null;
  audienceVotes: Record<string, number>;
  usedHelp5050: boolean;
  usedHelp2xAnswer: boolean;
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
  usedHelp2xAnswer,
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

  return (
    <div className={`w-full h-full flex flex-col justify-between p-4 ${className}`}>
      {/* Top section: Exit button, Lives, Coins */}
      <div className="flex justify-between items-start mb-4">
        <button
          onClick={onExit}
          className="p-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-full shadow-lg hover:from-red-700 hover:to-red-900 transition-all hover:scale-110 border-2 border-red-400/50"
          title="Vissza"
        >
          <LogOut className="w-6 h-6 -scale-x-100" />
        </button>

        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full">
            <span className="text-red-500 text-xl">❤️</span>
            <span className="text-white font-bold">{lives}/{maxLives}</span>
          </div>
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full">
            <span className="text-yellow-500 text-xl">🪙</span>
            <span className="text-white font-bold">{coins}</span>
          </div>
        </div>
      </div>

      {/* Middle section: Question and Answers */}
      <div className="flex-1 flex flex-col justify-center space-y-6">
        <div className="flex justify-center mb-4">
          <TimerCircle timeLeft={timeLeft} />
        </div>

        <MillionaireQuestion questionNumber={questionNumber}>
          {question.question}
        </MillionaireQuestion>

        <div className="space-y-3">
          {question.answers.map((answer) => {
            const isRemoved = removedAnswer === answer.key;
            const isSelected = selectedAnswer === answer.key;
            const isCorrect = isSelected && answer.key === correctAnswerKey;
            const isWrong = isSelected && answer.key !== correctAnswerKey;
            const isSecondAttemptOrange = firstAttempt && firstAttempt === answer.key && !isSelected;

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

                {/* Orange highlight for first wrong attempt */}
                {isSecondAttemptOrange && (
                  <div className="absolute inset-0 border-4 border-orange-500 rounded pointer-events-none animate-pulse" 
                       style={{ clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)' }} 
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom section: Help buttons - 1 row below answer C */}
      <div className="grid grid-cols-4 gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onUseHelp5050}
          disabled={disabled || usedHelp5050}
          className={`text-xs font-bold ${usedHelp5050 ? 'opacity-50' : ''}`}
        >
          1/3
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onUseHelp2xAnswer}
          disabled={disabled || usedHelp2xAnswer}
          className={`text-xs font-bold ${usedHelp2xAnswer ? 'opacity-50' : ''}`}
        >
          2x
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onUseHelpAudience}
          disabled={disabled || usedHelpAudience}
          className={`text-xs ${usedHelpAudience ? 'opacity-50' : ''}`}
        >
          <Users className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onUseQuestionSwap}
          disabled={disabled || usedQuestionSwap}
          className={`text-xs ${usedQuestionSwap ? 'opacity-50' : ''}`}
        >
          <SkipForward className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
