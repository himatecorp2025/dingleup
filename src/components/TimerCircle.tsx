interface TimerCircleProps {
  timeLeft: number;
  maxTime?: number;
}

export const TimerCircle = ({ timeLeft, maxTime = 10 }: TimerCircleProps) => {
  // Green: 10-8s, Orange: 7-4s, Red: 3-0s
  const getTimerColor = () => {
    if (timeLeft >= 8) return "hsl(var(--success))"; // Green
    if (timeLeft >= 4) return "hsl(var(--accent))"; // Orange
    return "hsl(var(--destructive))"; // Red
  };
  
  // Determine if blinking animation should be active (3 seconds or less)
  const shouldBlink = timeLeft <= 3;
  
  const circumference = 2 * Math.PI * 54;
  const progress = (timeLeft / maxTime) * circumference;
  const timerColor = getTimerColor();
  
  return (
    <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center" style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}>
      {/* BASE SHADOW - Enhanced */}
      <div className="absolute inset-0 bg-background/70 rounded-full" style={{ transform: 'translate(6px, 6px) translateZ(-20px)', filter: 'blur(10px)' }} aria-hidden />
      
      {/* OUTER DECORATIVE RING - Animated based on time with enhanced 3D */}
      <div 
        className={`absolute inset-0 rounded-full border-4 shadow-2xl transition-all duration-500 ${shouldBlink ? 'animate-pulse' : ''}`}
        style={{ 
          transform: 'translateZ(5px)',
          background: timeLeft >= 8 
            ? 'linear-gradient(135deg, hsl(var(--success)), hsl(var(--success)), hsl(var(--success)))' 
            : timeLeft >= 4 
            ? 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent)), hsl(var(--accent)))' 
            : 'linear-gradient(135deg, hsl(var(--destructive)), hsl(var(--destructive)), hsl(var(--destructive)))', 
          borderColor: timeLeft >= 8 
            ? 'hsl(var(--success) / 0.9)' 
            : timeLeft >= 4 
            ? 'hsl(var(--accent) / 0.9)' 
            : 'hsl(var(--destructive) / 0.9)', 
          boxShadow: timeLeft >= 8
            ? '0 0 35px hsl(var(--success)), 0 12px 35px rgba(0,0,0,0.7), inset 0 2px 8px rgba(255,255,255,0.4)' 
            : timeLeft >= 4
            ? '0 0 35px hsl(var(--accent)), 0 12px 35px rgba(0,0,0,0.7), inset 0 2px 8px rgba(255,255,255,0.4)' 
            : '0 0 35px hsl(var(--destructive)), 0 12px 35px rgba(0,0,0,0.7), inset 0 2px 8px rgba(255,255,255,0.4)' 
        }} 
        aria-hidden 
      />
      
      {/* MIDDLE FRAME - Enhanced depth */}
      <div className="absolute inset-[4px] rounded-full bg-gradient-to-b from-black/60 via-transparent to-black/80" style={{ boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.4), inset 0 -3px 6px rgba(0,0,0,0.6)', transform: 'translateZ(15px)' }} aria-hidden />
      
      {/* INNER LAYER - Enhanced 3D */}
      <div className="absolute inset-[6px] rounded-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" style={{ boxShadow: 'inset 0 16px 32px rgba(255,255,255,0.15), inset 0 -16px 32px rgba(0,0,0,0.6)', transform: 'translateZ(25px)' }} aria-hidden />
      
      {/* SPECULAR HIGHLIGHT - Enhanced */}
      <div className="absolute inset-[6px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)', transform: 'translateZ(35px)' }} aria-hidden />
      
      {/* Timer SVG Rings */}
      <div className="relative" style={{ transform: 'translateZ(40px)' }}>
        {/* Outer decorative circle - animated color */}
        <svg className="absolute w-full h-full transform -rotate-90 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" viewBox="0 0 112 112">
          <circle
            cx="56"
            cy="56"
            r="52"
            stroke={timerColor}
            strokeWidth="2"
            fill="none"
            opacity="0.3"
            className="transition-all duration-500"
          />
        </svg>
        
        {/* Main timer circle */}
        <svg className="absolute w-full h-full transform -rotate-90 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" viewBox="0 0 112 112">
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
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full" style={{ background: 'radial-gradient(circle, hsl(var(--background)) 0%, hsl(var(--background)) 100%)', boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.6), inset 0 -4px 8px rgba(255,255,255,0.1)' }} />
        
        {/* Timer number with blink animation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span 
            className={`text-2xl sm:text-3xl md:text-4xl font-black drop-shadow-[0_0_12px_currentColor] transition-all duration-500 ${shouldBlink ? 'animate-pulse' : ''}`}
            style={{ color: timerColor }}
          >
            {timeLeft}
          </span>
        </div>
      </div>
    </div>
  );
};