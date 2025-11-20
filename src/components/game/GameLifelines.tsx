import { HexagonButton } from "@/components/HexagonButton";
import { RefreshCw, Users, SkipForward } from "lucide-react";

interface GameLifelinesProps {
  help5050UsageCount: number;
  help2xAnswerUsageCount: number;
  helpAudienceUsageCount: number;
  isHelp5050ActiveThisQuestion: boolean;
  isDoubleAnswerActiveThisQuestion: boolean;
  isAudienceActiveThisQuestion: boolean;
  usedQuestionSwap: boolean;
  skipCost: number;
  coins: number;
  onUseHelp5050: () => void;
  onUseHelp2xAnswer: () => void;
  onUseHelpAudience: () => void;
  onUseQuestionSwap: () => void;
}

export const GameLifelines = ({
  help5050UsageCount,
  help2xAnswerUsageCount,
  helpAudienceUsageCount,
  isHelp5050ActiveThisQuestion,
  isDoubleAnswerActiveThisQuestion,
  isAudienceActiveThisQuestion,
  usedQuestionSwap,
  skipCost,
  coins,
  onUseHelp5050,
  onUseHelp2xAnswer,
  onUseHelpAudience,
  onUseQuestionSwap
}: GameLifelinesProps) => {
  return (
    <div className="flex justify-center items-center gap-2 sm:gap-3 md:gap-4 mb-2">
      <button
        onClick={onUseHelp5050}
        disabled={help5050UsageCount >= 3}
        className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex flex-col items-center justify-center gap-0.5 rounded-lg border-2 transition-all ${
          isHelp5050ActiveThisQuestion
            ? 'bg-primary border-primary text-primary-foreground'
            : help5050UsageCount >= 3
            ? 'bg-muted border-muted text-muted-foreground opacity-50 cursor-not-allowed'
            : 'bg-background border-border text-foreground hover:bg-muted'
        }`}
      >
        <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-[9px] sm:text-[10px] font-bold">50/50</span>
      </button>
      <button
        onClick={onUseHelp2xAnswer}
        disabled={help2xAnswerUsageCount >= 3}
        className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex flex-col items-center justify-center gap-0.5 rounded-lg border-2 transition-all ${
          isDoubleAnswerActiveThisQuestion
            ? 'bg-primary border-primary text-primary-foreground'
            : help2xAnswerUsageCount >= 3
            ? 'bg-muted border-muted text-muted-foreground opacity-50 cursor-not-allowed'
            : 'bg-background border-border text-foreground hover:bg-muted'
        }`}
      >
        <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-[9px] sm:text-[10px] font-bold">2x</span>
      </button>
      <button
        onClick={onUseHelpAudience}
        disabled={helpAudienceUsageCount >= 3}
        className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex flex-col items-center justify-center gap-0.5 rounded-lg border-2 transition-all ${
          isAudienceActiveThisQuestion
            ? 'bg-primary border-primary text-primary-foreground'
            : helpAudienceUsageCount >= 3
            ? 'bg-muted border-muted text-muted-foreground opacity-50 cursor-not-allowed'
            : 'bg-background border-border text-foreground hover:bg-muted'
        }`}
      >
        <Users className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-[9px] sm:text-[10px] font-bold">Közönség</span>
      </button>
      <button
        onClick={onUseQuestionSwap}
        disabled={usedQuestionSwap || coins < skipCost}
        className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex flex-col items-center justify-center gap-0.5 rounded-lg border-2 transition-all ${
          usedQuestionSwap || coins < skipCost
            ? 'bg-muted border-muted text-muted-foreground opacity-50 cursor-not-allowed'
            : 'bg-background border-border text-foreground hover:bg-muted'
        }`}
      >
        <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-[9px] sm:text-[10px] font-bold">{skipCost}</span>
      </button>
    </div>
  );
};
