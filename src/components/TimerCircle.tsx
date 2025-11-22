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
  
  const getTimerGlow = () => {
    if (timeLeft >= 8) return "rgba(74, 222, 128, 0.8)"; // Green glow
    if (timeLeft >= 4) return "rgba(251, 146, 60, 0.8)"; // Orange glow
    return "rgba(248, 113, 113, 0.8)"; // Red glow
  };
  
  // Determine if blinking animation should be active (3 seconds or less)
  const shouldBlink = timeLeft <= 3;
  
  const circumference = 2 * Math.PI * 54;
  const progress = (timeLeft / maxTime) * circumference;
  const timerColor = getTimerColor();
  const glowColor = getTimerGlow();
  
  return (
    <div className="relative flex items-center justify-center" style={{ 
      width: '30%', 
      height: 'auto',
      aspectRatio: '1 / 1',
      perspective: '1500px', 
      transformStyle: 'preserve-3d' 
    }}>
      {/* DEEP BASE SHADOW - Enhanced 3D depth */}
      <div 
        className="absolute inset-0 rounded-full" 
        style={{ 
          transform: 'translate(8px, 8px) translateZ(-30px)', 
          filter: 'blur(16px)',
          background: 'radial-gradient(circle, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)'
        }} 
        aria-hidden 
      />
      
      {/* OUTER METALLIC FRAME - Chrome effect */}
      <div 
        className="absolute inset-0 rounded-full border-4"
        style={{ 
          transform: 'translateZ(5px)',
          background: 'linear-gradient(135deg, #ffffff 0%, #a0a0a0 25%, #ffffff 50%, #707070 75%, #ffffff 100%)',
          borderColor: 'rgba(255,255,255,0.3)',
          boxShadow: `0 0 40px ${glowColor}, 0 16px 48px rgba(0,0,0,0.8), inset 0 3px 10px rgba(255,255,255,0.5), inset 0 -3px 10px rgba(0,0,0,0.5)`
        }} 
        aria-hidden 
      />
      
      {/* MIDDLE DEPTH RING - 3D bevel */}
      <div 
        className="absolute inset-[6px] rounded-full" 
        style={{ 
          transform: 'translateZ(20px)',
          background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(30,30,30,0.9) 50%, rgba(0,0,0,0.8) 100%)',
          boxShadow: 'inset 0 4px 12px rgba(255,255,255,0.3), inset 0 -4px 12px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.5)'
        }} 
        aria-hidden 
      />
      
      {/* INNER CRYSTAL LAYER - Glossy depth */}
      <div 
        className="absolute inset-[10px] rounded-full" 
        style={{ 
          transform: 'translateZ(35px)',
          background: `radial-gradient(circle at 30% 30%, 
            rgba(60,60,80,1) 0%, 
            rgba(30,30,40,1) 40%, 
            rgba(15,15,20,1) 100%)`,
          boxShadow: `inset 0 20px 40px rgba(255,255,255,0.12), 
                      inset 0 -20px 40px rgba(0,0,0,0.8),
                      0 0 30px ${glowColor}`
        }} 
        aria-hidden 
      />
      
      {/* SPECULAR HIGHLIGHT - Top glass shine */}
      <div 
        className="absolute inset-[10px] rounded-full pointer-events-none" 
        style={{ 
          transform: 'translateZ(50px)',
          background: 'radial-gradient(ellipse 140% 90% at 35% 15%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 25%, transparent 60%)',
        }} 
        aria-hidden 
      />
      
      {/* Timer SVG Rings */}
      <div className="relative" style={{ transform: 'translateZ(55px)', width: '100%', height: '100%' }}>
        {/* Outer decorative circle - animated color */}
        <svg className="absolute w-full h-full transform -rotate-90 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" viewBox="0 0 112 112">
          <circle
            cx="56"
            cy="56"
            r="52"
            stroke={timerColor}
            strokeWidth="2"
            fill="none"
            opacity="0.4"
            className="transition-all duration-500"
            style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
          />
        </svg>
        
        {/* Main timer circle with glow */}
        <svg className="absolute w-full h-full transform -rotate-90 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" viewBox="0 0 112 112">
          <circle
            cx="56"
            cy="56"
            r="42"
            stroke="rgba(30,30,40,0.8)"
            strokeWidth="10"
            fill="none"
          />
          <circle
            cx="56"
            cy="56"
            r="42"
            stroke={timerColor}
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            className={`transition-all duration-1000 ${shouldBlink ? 'animate-pulse' : ''}`}
            style={{ 
              filter: `drop-shadow(0 0 12px ${glowColor}) drop-shadow(0 0 20px ${glowColor})`,
              strokeLinecap: 'round'
            }}
          />
        </svg>
        
        {/* Inner background with deep 3D inset */}
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full" 
          style={{ 
            width: '60%',
            height: '60%',
            background: 'radial-gradient(circle at 40% 40%, rgba(40,40,50,1) 0%, rgba(20,20,25,1) 60%, rgba(10,10,15,1) 100%)', 
            boxShadow: 'inset 0 6px 16px rgba(0,0,0,0.9), inset 0 -6px 16px rgba(255,255,255,0.08)'
          }} 
        />
        
        {/* Timer number with enhanced shadow and glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span 
            className={`font-black transition-all duration-500 ${shouldBlink ? 'animate-pulse' : ''}`}
            style={{ 
              color: timerColor,
              fontSize: 'clamp(2rem, 8vw, 3rem)',
              textShadow: `0 0 20px ${glowColor}, 0 0 40px ${glowColor}, 0 4px 8px rgba(0,0,0,0.8)`,
              filter: `drop-shadow(0 0 12px ${glowColor})`
            }}
          >
            {timeLeft}
          </span>
        </div>
      </div>
    </div>
  );
};