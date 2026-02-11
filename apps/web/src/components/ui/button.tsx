'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', icon, isLoading, children, className, ...props }, ref) => {
    const baseStyles = "rounded-full font-semibold transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-700",
      secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 hover:scale-105 active:scale-95 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600",
      ghost: "text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:scale-105 active:scale-95 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
    };
    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2",
      lg: "px-6 py-3 text-lg"
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={isLoading || props.disabled}
        {...props}
      >
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />}
          {icon && !isLoading && icon}
          {children}
        </div>
      </button>
    );
  }
);

Button.displayName = 'Button';
