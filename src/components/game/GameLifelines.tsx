import { RefreshCw, Users, SkipForward, Slash } from "lucide-react";
import { useI18n } from "@/i18n";

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

const Lifeline3DButton = ({ 
  onClick, 
  disabled, 
  isActive, 
  icon: Icon, 
  label, 
  cost 
}: { 
  onClick: () => void;
  disabled: boolean;
  isActive: boolean;
  icon: React.ElementType;
  label?: string;
  cost?: number;
}) => {
  const getColor = () => {
    if (isActive) return "hsl(var(--primary))";
    if (disabled) return "hsl(var(--muted-foreground))";
    return "hsl(var(--primary))";
  };

  const getGlow = () => {
    if (isActive) return "rgba(156, 39, 243, 0.9)";
    if (disabled) return "rgba(100, 100, 100, 0.3)";
    return "rgba(156, 39, 243, 0.6)";
  };
  
  const getGradient = () => {
    if (isActive) return "linear-gradient(135deg, #9C27F3 0%, #7B1ED6 50%, #6A0BB8 100%)";
    if (disabled) return "linear-gradient(135deg, #505050 0%, #3a3a3a 50%, #2a2a2a 100%)";
    return "linear-gradient(135deg, #B85AFF 0%, #9C27F3 50%, #7B1ED6 100%)";
  };
  
  const getInnerGradient = () => {
    if (isActive) return "radial-gradient(circle at 30% 30%, rgba(156, 39, 243, 1) 0%, rgba(123, 30, 214, 1) 40%, rgba(106, 11, 184, 1) 100%)";
    if (disabled) return "radial-gradient(circle at 30% 30%, rgba(80, 80, 90, 1) 0%, rgba(50, 50, 60, 1) 40%, rgba(30, 30, 40, 1) 100%)";
    return "radial-gradient(circle at 30% 30%, rgba(184, 90, 255, 1) 0%, rgba(156, 39, 243, 1) 40%, rgba(123, 30, 214, 1) 100%)";
  };

  const color = getColor();
  const glowColor = getGlow();
  const gradient = getGradient();
  const innerGradient = getInnerGradient();

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-105'} transition-transform duration-200`}
      style={{ 
        width: '56px', 
        height: '56px',
        perspective: '1000px', 
        transformStyle: 'preserve-3d' 
      }}
    >
      {/* DEEP BASE SHADOW */}
      <div 
        className="absolute inset-0 rounded-lg" 
        style={{ 
          transform: 'translate(4px, 4px) translateZ(-15px)', 
          filter: 'blur(8px)',
          background: 'radial-gradient(circle, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)'
        }} 
        aria-hidden 
      />
      
      {/* OUTER METALLIC FRAME */}
      <div 
        className="absolute inset-0 rounded-lg border-2"
        style={{ 
          transform: 'translateZ(3px)',
          background: gradient,
          borderColor: 'rgba(255,255,255,0.3)',
          boxShadow: `0 0 20px ${glowColor}, 0 8px 24px rgba(0,0,0,0.7), inset 0 2px 6px rgba(255,255,255,0.5), inset 0 -2px 6px rgba(0,0,0,0.5)`
        }} 
        aria-hidden 
      />
      
      {/* MIDDLE DEPTH RING */}
      <div 
        className="absolute inset-[3px] rounded-lg" 
        style={{ 
          transform: 'translateZ(12px)',
          background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(30,30,30,0.9) 50%, rgba(0,0,0,0.8) 100%)',
          boxShadow: 'inset 0 2px 8px rgba(255,255,255,0.3), inset 0 -2px 8px rgba(0,0,0,0.8)'
        }} 
        aria-hidden 
      />
      
      {/* INNER CRYSTAL LAYER */}
      <div 
        className="absolute inset-[5px] rounded-lg" 
        style={{ 
          transform: 'translateZ(20px)',
          background: innerGradient,
          boxShadow: `inset 0 10px 20px rgba(255,255,255,0.12), 
                      inset 0 -10px 20px rgba(0,0,0,0.8),
                      0 0 15px ${glowColor}`
        }} 
        aria-hidden 
      />
      
      {/* SPECULAR HIGHLIGHT */}
      <div 
        className="absolute inset-[5px] rounded-lg pointer-events-none" 
        style={{ 
          transform: 'translateZ(28px)',
          background: 'radial-gradient(ellipse 120% 80% at 35% 15%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.25) 25%, transparent 60%)',
        }} 
        aria-hidden 
      />
      
      {/* ICON AND LABEL */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5" style={{ transform: 'translateZ(32px)' }}>
        <Icon 
          className="w-5 h-5 transition-all duration-300" 
          style={{ 
            color: color,
            filter: `drop-shadow(0 0 8px ${glowColor})`,
            opacity: disabled ? 0.5 : 1
          }} 
        />
        <span 
          className="text-[10px] font-bold transition-all duration-300" 
          style={{ 
            color: color,
            textShadow: `0 0 10px ${glowColor}`,
            opacity: disabled ? 0.5 : 1
          }}
        >
          {cost !== undefined ? cost : (label || '')}
        </span>
      </div>
    </button>
  );
};

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
  const { t } = useI18n();
  
  return (
    <div className="flex justify-center items-center gap-2 sm:gap-3 md:gap-4 mb-2 mt-6">
      <Lifeline3DButton
        onClick={onUseHelp5050}
        disabled={help5050UsageCount >= 3}
        isActive={isHelp5050ActiveThisQuestion}
        icon={Slash}
        label="1/3"
      />
      <Lifeline3DButton
        onClick={onUseHelp2xAnswer}
        disabled={help2xAnswerUsageCount >= 3}
        isActive={isDoubleAnswerActiveThisQuestion}
        icon={RefreshCw}
        label="2x"
      />
      <Lifeline3DButton
        onClick={onUseHelpAudience}
        disabled={helpAudienceUsageCount >= 3}
        isActive={isAudienceActiveThisQuestion}
        icon={Users}
        label={t('game.lifeline_audience')}
      />
      <Lifeline3DButton
        onClick={onUseQuestionSwap}
        disabled={usedQuestionSwap || coins < skipCost}
        isActive={false}
        icon={SkipForward}
        cost={skipCost}
      />
    </div>
  );
};
