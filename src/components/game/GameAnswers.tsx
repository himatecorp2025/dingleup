import { memo } from 'react';
import { MillionaireAnswer } from '@/components/MillionaireAnswer';
import { Question } from '@/types/game';

interface GameAnswersProps {
  question: Question;
  selectedAnswer: string | null;
  firstAttempt: string | null;
  secondAttempt: string | null;
  removedAnswer: string | null;
  audienceVotes: Record<string, number>;
  isDoubleAnswerActive: boolean;
  isAudienceActive: boolean;
  disabled: boolean;
  onAnswerSelect: (answerKey: string) => void;
}

export const GameAnswers = memo(({
  question,
  selectedAnswer,
  firstAttempt,
  secondAttempt,
  removedAnswer,
  audienceVotes,
  isDoubleAnswerActive,
  isAudienceActive,
  disabled,
  onAnswerSelect
}: GameAnswersProps) => {
  return (
    <div className="space-y-3 px-4 mb-6">
      {question.answers.map((answer) => {
        const isRemoved = removedAnswer === answer.key;
        const isSelected = selectedAnswer === answer.key;
        const isCorrectAnswer = answer.correct;
        const isWrongAnswer = selectedAnswer && !isCorrectAnswer && isSelected;
        const isFirstAttemptWrong = isDoubleAnswerActive && firstAttempt === answer.key && !isCorrectAnswer;
        const isSecondAttemptWrong = isDoubleAnswerActive && secondAttempt === answer.key && !isCorrectAnswer;
        const showAudienceVote = isAudienceActive && audienceVotes[answer.key];

        return (
          <MillionaireAnswer
            key={answer.key}
            letter={answer.key}
            isCorrect={isCorrectAnswer}
            isSelected={isSelected}
            isWrong={isWrongAnswer || isFirstAttemptWrong || isSecondAttemptWrong}
            isRemoved={isRemoved}
            isDoubleChoiceActive={isDoubleAnswerActive}
            onClick={() => !disabled && !isRemoved && onAnswerSelect(answer.key)}
            disabled={disabled || isRemoved}
          >
            {answer.text}
            {showAudienceVote && (
              <span className="ml-2 text-sm opacity-70">({audienceVotes[answer.key]}%)</span>
            )}
          </MillionaireAnswer>
        );
      })}
    </div>
  );
});

GameAnswers.displayName = 'GameAnswers';
