interface TimerCircleProps {
  timeLeft: number;
  maxTime?: number;
}

export const TimerCircle = ({ timeLeft, maxTime = 10 }: TimerCircleProps) => {
  const isLowTime = timeLeft <= 3;
  
  return (
    <div className={`timer-circle ${isLowTime ? 'timer-circle-red' : 'timer-circle-green'}`}>
      {timeLeft}
    </div>
  );
};
