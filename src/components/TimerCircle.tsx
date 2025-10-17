interface TimerCircleProps {
  timeLeft: number;
  maxTime?: number;
}

export const TimerCircle = ({ timeLeft, maxTime = 10 }: TimerCircleProps) => {
  const isLowTime = timeLeft <= 3;
  
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <div className={`absolute inset-0 rounded-full border-4 ${isLowTime ? 'border-red-500' : 'border-green-500'}`}></div>
      <div className="absolute inset-2 rounded-full bg-black flex items-center justify-center">
        <span className="text-4xl font-bold text-white">{timeLeft}</span>
      </div>
    </div>
  );
};
