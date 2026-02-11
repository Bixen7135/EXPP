'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface FilterPill {
  key: string;
  label: string;
  value: string;
  color?: string;
}

export interface FilterPillsProps {
  filters: FilterPill[];
  onRemove: (key: string, value: string) => void;
  onClearAll: () => void;
  className?: string;
}

export const FilterPills = React.forwardRef<HTMLDivElement, FilterPillsProps>(
  ({ filters, onRemove, onClearAll, className }, ref) => {
    return (
      <div ref={ref} className={cn('flex flex-wrap gap-2 overflow-x-auto', className)}>
        <AnimatePresence mode="wait">
          {filters.map((filter) => (
            <motion.div
              key={filter.key}
              initial={{ opacity: 0, scale: 0.9, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 10 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
                filter.color || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
                'border border-gray-300 dark:border-gray-600',
                'text-sm'
              )}
            >
              <span className="font-medium">{filter.label}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(filter.key, filter.value);
                }}
                className={cn(
                  'p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full',
                  'text-gray-600 dark:text-gray-300',
                  'transition-colors duration-150'
                )}
                aria-label={`Remove ${filter.label} filter`}
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {filters.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 font-medium px-3 py-1.5 border border-transparent hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-150"
          >
            Clear All
          </button>
        )}
      </div>
    );
  }
);

FilterPills.displayName = 'FilterPills';
