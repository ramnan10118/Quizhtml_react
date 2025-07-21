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
      'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium',
      'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2',
      'focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      'border border-transparent'
    ];

    const variants = {
      default: [
        'bg-gray-900 text-white hover:bg-gray-800',
        'dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200',
        'shadow-sm hover:shadow-md'
      ],
      destructive: [
        'bg-red-600 text-white hover:bg-red-700',
        'dark:bg-red-500 dark:hover:bg-red-600',
        'shadow-sm hover:shadow-md'
      ],
      outline: [
        'border-gray-200 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-300',
        'dark:border-dark-600 dark:bg-dark-700 dark:text-gray-100 dark:hover:bg-dark-600 dark:hover:border-dark-500'
      ],
      secondary: [
        'bg-primary-600 text-white hover:bg-primary-700',
        'dark:bg-primary-500 dark:hover:bg-primary-600',
        'shadow-sm hover:shadow-md'
      ],
      ghost: [
        'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        'dark:text-gray-400 dark:hover:bg-dark-700 dark:hover:text-gray-100'
      ],
      link: [
        'text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline',
        'dark:text-primary-400 dark:hover:text-primary-300'
      ],
      buzz: [
        'bg-red-600 text-white hover:bg-red-700',
        'shadow-[0_8px_0_#dc2626] hover:shadow-[0_6px_0_#dc2626]',
        'active:transform active:translate-y-2 active:shadow-[0_0_0_#dc2626]',
        'disabled:bg-gray-400 disabled:shadow-[0_4px_0_#9ca3af]',
        'dark:disabled:bg-gray-600 dark:disabled:shadow-[0_4px_0_#4b5563]',
        'touch-manipulation select-none rounded-2xl'
      ]
    };

    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
      buzz: 'h-16 sm:h-20 min-w-[250px] sm:min-w-[300px] px-6 sm:px-8 py-3 sm:py-4 text-xl sm:text-2xl font-bold rounded-2xl'
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