import { TimerCircle } from "@/components/TimerCircle";

interface GameTimerProps {
  timeLeft: number;
  maxTime: number;
}

export const GameTimer = ({ timeLeft, maxTime }: GameTimerProps) => {
  return (
    <div className="flex justify-center mb-2">
      <TimerCircle timeLeft={timeLeft} maxTime={maxTime} />
    </div>
  );
};
