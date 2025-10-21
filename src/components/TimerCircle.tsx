interface TimerCircleProps {
  timeLeft: number;
  maxTime?: number;
}

export const TimerCircle = ({ timeLeft, maxTime = 10 }: TimerCircleProps) => {
  // Green: 10-8s, Orange: 7-4s, Red: 3-0s
  const getTimerColor = () => {
    if (timeLeft >= 8) return "#16A34A"; // Green
    if (timeLeft >= 4) return "#F59E0B"; // Orange
    return "#DC2626"; // Red
  };
  
  const circumference = 2 * Math.PI * 54;
  const progress = (timeLeft / maxTime) * circumference;
  const timerColor = getTimerColor();
  
  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      {/* Outer decorative circle */}
      <svg className="absolute w-full h-full transform -rotate-90">
        <circle
          cx="56"
          cy="56"
          r="52"
          stroke="#3b82f6"
          strokeWidth="2"
          fill="none"
          opacity="0.3"
        />
      </svg>
      {/* Main timer circle */}
      <svg className="absolute w-full h-full transform -rotate-90">
        <circle
          cx="56"
          cy="56"
          r="42"
          stroke="#1e293b"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="56"
          cy="56"
          r="42"
          stroke={timerColor}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-1000"
        />
      </svg>
      {/* Inner background */}
      <div className="absolute w-20 h-20 rounded-full bg-slate-900 border-3 border-slate-800" />
      {/* Timer number */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-4xl font-black drop-shadow-lg" style={{ color: timerColor }}>
          {timeLeft}
        </span>
      </div>
    </div>
  );
};
