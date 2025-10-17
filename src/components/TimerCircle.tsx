interface TimerCircleProps {
  timeLeft: number;
  maxTime?: number;
}

export const TimerCircle = ({ timeLeft, maxTime = 10 }: TimerCircleProps) => {
  const isLowTime = timeLeft <= 3;
  const circumference = 2 * Math.PI * 45;
  const progress = (timeLeft / maxTime) * circumference;
  
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke="#1e293b"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke={isLowTime ? "#ef4444" : "#10b981"}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-5xl font-black ${isLowTime ? 'text-red-500' : 'text-green-500'}`}>
          {timeLeft}
        </span>
      </div>
    </div>
  );
};
