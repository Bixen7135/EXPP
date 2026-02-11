'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DateRangeOption = '7d' | '30d' | '90d' | '1y' | 'all';

export interface DateRangeFilterProps {
  selectedRange: DateRangeOption;
  onChange: (range: DateRangeOption) => void;
  label?: string;
}

export const DateRangeFilter = React.forwardRef<HTMLDivElement, DateRangeFilterProps>(
  ({ selectedRange, onChange, label }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);

    const ranges: Array<{ value: DateRangeOption; label: string; dateRange: string }> = [
      { value: '7d', label: 'Last 7 days', dateRange: '7d' },
      { value: '30d', label: 'Last 30 days', dateRange: '30d' },
      { value: '90d', label: 'Last 90 days', dateRange: '90d' },
      { value: '1y', label: 'Last year', dateRange: '1y' },
      { value: 'all', label: 'All time', dateRange: 'all' },
    ];

    const selectedRangeData = ranges.find((r) => r.value === selectedRange);

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        // Check if ref is a RefObject and has a current property
        if (ref && 'current' in ref && ref.current && !ref.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    return (
      <div ref={ref} className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {label}
          </label>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            className={cn(
              'w-full px-4 py-2.5 rounded-lg border',
              'bg-white dark:bg-gray-800',
              'text-gray-900 dark:text-white',
              'border-gray-300 dark:border-gray-600',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              'flex items-center justify-between',
              'transition-colors duration-200',
              'cursor-pointer'
            )}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span className={cn(!selectedRangeData && 'text-gray-400 dark:text-gray-500')}>
              {selectedRangeData?.label || 'Select date range'}
            </span>
            <ChevronDown
              className={cn(
                'w-4 h-4 ml-2 text-gray-400 transition-transform',
                isOpen && 'rotate-180'
              )}
            />
          </button>

          {isOpen && (
            <div
              className={cn(
                'absolute z-10 w-full mt-1 max-h-60 overflow-auto rounded-lg shadow-xl',
                'bg-white dark:bg-gray-800',
                'border border-gray-300 dark:border-gray-600'
              )}
            >
              {ranges.map((range) => (
                <button
                  key={range.value}
                  type="button"
                  onClick={() => {
                    onChange(range.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full px-4 py-2.5 text-left',
                    'transition-colors duration-150',
                    'hover:bg-gray-50 dark:hover:bg-gray-700',
                    range.value === selectedRange &&
                      'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
                    range.value !== selectedRange &&
                      'text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>{range.label}</span>
                    {range.value === selectedRange && (
                      <span className="ml-2 text-blue-600 dark:text-blue-400">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);

DateRangeFilter.displayName = 'DateRangeFilter';
