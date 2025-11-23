interface LoadingSpinner3DProps {
  className?: string;
  size?: number;
}

export const LoadingSpinner3D = ({ className = "", size = 24 }: LoadingSpinner3DProps) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <filter id="spinnerGlow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <g filter="url(#spinnerGlow)">
        <circle
          cx="24"
          cy="24"
          r="18"
          fill="none"
          stroke="url(#spinnerGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="80 30"
          opacity="0.9"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 24 24"
            to="360 24 24"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>
        
        <circle
          cx="24"
          cy="24"
          r="12"
          fill="none"
          stroke="#fde047"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="60 20"
          opacity="0.7"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="360 24 24"
            to="0 24 24"
            dur="0.8s"
            repeatCount="indefinite"
          />
        </circle>
        
        <circle
          cx="24"
          cy="6"
          r="3"
          fill="#ffffff"
          opacity="0.95"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 24 24"
            to="360 24 24"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>
      </g>
    </svg>
  );
};
