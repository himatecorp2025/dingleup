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
    <div className="relative w-28 h-28 flex items-center justify-center" style={{ perspective: '800px' }}>
      {/* BASE SHADOW */}
      <div className="absolute inset-0 bg-black/60 rounded-full" style={{ transform: 'translate(4px, 4px)', filter: 'blur(6px)' }} aria-hidden />
      
      {/* OUTER DECORATIVE RING */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600 via-blue-500 to-blue-800 border-2 border-blue-400/50 shadow-xl" style={{ transform: 'translateZ(0px)' }} aria-hidden />
      
      {/* MIDDLE FRAME */}
      <div className="absolute inset-[4px] rounded-full bg-gradient-to-b from-black/50 via-transparent to-black/70" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.5)', transform: 'translateZ(10px)' }} aria-hidden />
      
      {/* INNER LAYER */}
      <div className="absolute inset-[6px] rounded-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" style={{ boxShadow: 'inset 0 12px 24px rgba(255,255,255,0.1), inset 0 -12px 24px rgba(0,0,0,0.5)', transform: 'translateZ(20px)' }} aria-hidden />
      
      {/* SPECULAR HIGHLIGHT */}
      <div className="absolute inset-[6px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 30%, transparent 60%)', transform: 'translateZ(30px)' }} aria-hidden />
      
      {/* Timer SVG Rings */}
      <div className="relative" style={{ transform: 'translateZ(40px)' }}>
        {/* Outer decorative circle */}
        <svg className="absolute w-full h-full transform -rotate-90 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" width="112" height="112">
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
        <svg className="absolute w-full h-full transform -rotate-90 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" width="112" height="112">
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
            style={{ filter: `drop-shadow(0 0 8px ${timerColor})` }}
          />
        </svg>
        
        {/* Inner background with 3D effect */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full" style={{ background: 'radial-gradient(circle, #0f172a 0%, #020617 100%)', boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.6), inset 0 -4px 8px rgba(255,255,255,0.1)' }} />
        
        {/* Timer number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-black drop-shadow-[0_0_12px_currentColor]" style={{ color: timerColor }}>
            {timeLeft}
          </span>
        </div>
      </div>
    </div>
  );
};
