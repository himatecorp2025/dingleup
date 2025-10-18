import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface HexagonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'yellow' | 'green' | 'dark' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const HexagonButton = ({ 
  children, 
  variant = 'dark', 
  size = 'md',
  className,
  disabled,
  ...props 
}: HexagonButtonProps) => {
  const variants = {
    yellow: 'bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white border-2 border-gold-dark hover:brightness-110',
    green: 'bg-success text-white border-2 border-success-dark shadow-lg shadow-success/30 hover:shadow-success/50',
    dark: 'bg-black text-white border-2 border-primary/50 shadow-lg shadow-primary/20',
    outline: 'bg-transparent text-white border-2 border-white/30 hover:bg-white/10'
  };

  const sizes = {
    sm: 'px-6 py-2 text-sm',
    md: 'px-8 py-3 text-base',
    lg: 'px-12 py-4 text-lg'
  };

  return (
    <button
      className={cn(
        'hexagon-button font-bold touch-manipulation',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
