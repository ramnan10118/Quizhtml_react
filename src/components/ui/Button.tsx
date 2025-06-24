import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'buzz';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'buzz';
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', children, ...props }, ref) => {
    const baseClasses = [
      'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium',
      'ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2',
      'focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      'active:scale-95 transition-transform'
    ];

    const variants = {
      default: [
        'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800',
        'shadow-lg shadow-blue-500/25 hover:shadow-blue-500/30'
      ],
      destructive: [
        'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800',
        'shadow-lg shadow-red-500/25 hover:shadow-red-500/30'
      ],
      outline: [
        'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50',
        'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700'
      ],
      secondary: [
        'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800',
        'shadow-lg shadow-purple-500/25 hover:shadow-purple-500/30'
      ],
      ghost: [
        'hover:bg-gray-100 hover:text-gray-900',
        'dark:hover:bg-gray-800 dark:hover:text-gray-100'
      ],
      link: [
        'text-blue-600 underline-offset-4 hover:underline',
        'dark:text-blue-400'
      ],
      buzz: [
        'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700',
        'shadow-[0_12px_0_#dc2626,0_14px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_10px_0_#dc2626,0_12px_20px_rgba(0,0,0,0.4)]',
        'active:transform active:translate-y-2 active:shadow-[0_0_0_#dc2626,0_0_0_rgba(0,0,0,0.3)]',
        'disabled:bg-gradient-to-r disabled:from-gray-400 disabled:to-gray-500',
        'disabled:shadow-[0_6px_0_#9ca3af,0_8px_10px_rgba(0,0,0,0.1)]',
        'touch-manipulation select-none'
      ]
    };

    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
      buzz: 'h-20 min-w-[300px] px-8 py-4 text-2xl font-bold rounded-2xl'
    };

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };