interface TimerCircleProps {
  timeLeft: number;
  maxTime?: number;
}

export const TimerCircle = ({ timeLeft, maxTime = 10 }: TimerCircleProps) => {
  const isLowTime = timeLeft <= 3;
  const circumference = 2 * Math.PI * 54;
  const progress = (timeLeft / maxTime) * circumference;
  
  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      {/* Outer decorative circle */}
      <svg className="absolute w-full h-full transform -rotate-90">
        <circle
          cx="72"
          cy="72"
          r="68"
          stroke="#3b82f6"
          strokeWidth="2"
          fill="none"
          opacity="0.3"
        />
      </svg>
      {/* Main timer circle */}
      <svg className="absolute w-full h-full transform -rotate-90">
        <circle
          cx="72"
          cy="72"
          r="54"
          stroke="#1e293b"
          strokeWidth="10"
          fill="none"
        />
        <circle
          cx="72"
          cy="72"
          r="54"
          stroke={isLowTime ? "#ef4444" : "#06b6d4"}
          strokeWidth="10"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-1000"
        />
      </svg>
      {/* Inner background */}
      <div className="absolute w-28 h-28 rounded-full bg-slate-900 border-4 border-slate-800" />
      {/* Timer number */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-6xl font-black ${isLowTime ? 'text-red-400' : 'text-cyan-400'} drop-shadow-lg`}>
          {timeLeft}
        </span>
      </div>
    </div>
  );
};
