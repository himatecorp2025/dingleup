import React, { ButtonHTMLAttributes } from 'react';

/**
 * GemButton - Drágakő stílusú kerek gomb (kristály fényekkel)
 * - Radial highlight felül (üveg/gem hatás)
 * - Arany perem + lila belső
 * - Hover: fény átfutás + translateY
 */
interface GemButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'purple' | 'green';
}

const GemButton: React.FC<GemButtonProps> = ({ 
  children, 
  size = 'md', 
  variant = 'purple',
  className = '',
  ...props 
}) => {
  const sizeClasses = {
    sm: 'w-[11vw] h-[11vw] max-w-[56px] max-h-[56px]',
    md: 'w-[13vw] h-[13vw] max-w-[65px] max-h-[65px]',
    lg: 'w-[15vw] h-[15vw] max-w-[75px] max-h-[75px]',
  };

  const baseStyle = variant === 'purple' 
    ? {
        background: 'radial-gradient(circle at 35% 25%, hsl(var(--dup-purple-300)), hsl(var(--dup-purple-500)) 45%, hsl(var(--dup-purple-700)) 100%)',
        border: '4px solid hsl(var(--dup-gold-500))',
      }
    : {
        background: 'radial-gradient(circle at 35% 25%, hsl(142 70% 65%), hsl(142 70% 50%) 45%, hsl(142 70% 35%) 100%)',
        border: '4px solid hsl(var(--dup-gold-500))',
      };

  return (
    <button
      className={`
        ${sizeClasses[size]}
        rounded-full
        flex items-center justify-center
        shadow-[0_3px_0_rgba(0,0,0,0.3),0_0_20px_rgba(0,0,0,0.15)]
        transition-all duration-200
        hover:shadow-[0_4px_0_rgba(0,0,0,0.4),0_0_28px_rgba(255,215,0,0.4)]
        hover:-translate-y-0.5
        active:shadow-none
        active:translate-y-0
        disabled:opacity-50
        disabled:cursor-not-allowed
        relative
        overflow-hidden
        ${className}
      `}
      style={baseStyle}
      {...props}
    >
      {/* Specular highlight overlay */}
      <div 
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.5), transparent 60%)',
          mixBlendMode: 'soft-light'
        }}
      />
      
      {/* Content */}
      <span className="relative z-10 text-white font-black drop-shadow-lg" style={{ fontSize: 'clamp(1rem, 4.5vw, 1.75rem)' }}>
        {children}
      </span>
    </button>
  );
};

export default GemButton;
