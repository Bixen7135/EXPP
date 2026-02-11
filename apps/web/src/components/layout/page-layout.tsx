import React from 'react';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '6xl' | 'full';
  className?: string;
}

export const PageLayout = ({ children, maxWidth = 'xl', className }: PageLayoutProps) => {
  const maxWidths = {
    sm: 'max-w-2xl',
    md: 'max-w-3xl',
    lg: 'max-w-3xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
    '6xl': 'max-w-7xl',
    full: 'max-w-full'
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[40px] min-h-screen">
      <main className={cn("container mx-auto px-4 py-20", maxWidths[maxWidth], className)}>
        {children}
      </main>
    </div>
  );
};
