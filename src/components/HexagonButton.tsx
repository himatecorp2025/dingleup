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
    yellow: 'bg-gradient-to-r from-accent to-accent-dark text-accent-foreground border-2 border-accent-dark hover:brightness-110',
    green: 'bg-success text-foreground border-2 border-success/90 shadow-lg shadow-success/30 hover:shadow-success/50',
    dark: 'bg-background text-foreground border-2 border-primary/50 shadow-lg shadow-primary/20',
    outline: 'bg-transparent text-foreground border-2 border-border/30 hover:bg-background/10'
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
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
        'transition-all duration-200',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          props.onClick?.(e as any);
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
};
