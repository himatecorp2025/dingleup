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
    yellow: 'bg-yellow-500 text-gray-100 border-2 border-yellow-600',
    green: 'bg-green-600 text-white border-2 border-green-700',
    dark: 'bg-black text-white border-2 border-blue-500/50',
    outline: 'bg-transparent text-white border-2 border-white/30'
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
