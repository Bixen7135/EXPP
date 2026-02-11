'use client';

import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  error?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

// Generic select with typed value
export interface TypedSelectProps<T extends string> extends Omit<SelectProps, 'value' | 'onChange'> {
  value?: T;
  onChange: (value: T) => void;
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      label,
      error,
      placeholder = 'Select...',
      options,
      value,
      onChange,
      disabled = false,
      className,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
    const selectRef = React.useRef<HTMLDivElement>(null);
    const listRef = React.useRef<HTMLUListElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
      onChange(optionValue);
      setIsOpen(false);
      setHighlightedIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          setIsOpen(true);
          setHighlightedIndex(0);
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && options[highlightedIndex]) {
            handleSelect(options[highlightedIndex].value);
          }
          break;
      }
    };

    // Scroll highlighted option into view
    React.useEffect(() => {
      if (highlightedIndex >= 0 && listRef.current) {
        const highlightedElement = listRef.current.children[
          highlightedIndex
        ] as HTMLElement;
        if (highlightedElement) {
          highlightedElement.scrollIntoView({ block: 'nearest' });
        }
      }
    }, [highlightedIndex]);

    return (
      <div ref={ref} className={cn('w-full', className)}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {label}
          </label>
        )}

        <div ref={selectRef} className="relative">
          {/* Trigger Button */}
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={cn(
              'w-full px-4 py-2.5 rounded-lg border',
              'bg-white dark:bg-gray-800',
              'text-gray-900 dark:text-white',
              'border-gray-300 dark:border-gray-600',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-red-500 focus:ring-red-500',
              'flex items-center justify-between',
              'transition-colors duration-200',
              'cursor-pointer'
            )}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span className={cn(!value && 'text-gray-400 dark:text-gray-500')}>
              {selectedOption?.label || placeholder}
            </span>
            <ChevronDown
              className={cn(
                'w-4 h-4 ml-2 text-gray-400 transition-transform',
                isOpen && 'rotate-180'
              )}
            />
          </button>

          {/* Dropdown Options */}
          {isOpen && (
            <ul
              ref={listRef}
              role="listbox"
              className={cn(
                'absolute z-10 w-full mt-1 max-h-60 overflow-auto rounded-lg',
                'bg-white dark:bg-gray-800',
                'border border-gray-300 dark:border-gray-600',
                'shadow-lg',
                'py-1'
              )}
            >
              {options.map((option, index) => (
                <li
                  key={option.value}
                  role="option"
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  className={cn(
                    'px-4 py-2 cursor-pointer',
                    'text-gray-900 dark:text-white',
                    'flex items-center justify-between',
                    'transition-colors duration-150',
                    option.disabled && 'opacity-50 cursor-not-allowed',
                    !option.disabled && 'hover:bg-gray-100 dark:hover:bg-gray-700',
                    index === highlightedIndex &&
                      'bg-gray-100 dark:bg-gray-700'
                  )}
                >
                  <span>{option.label}</span>
                  {option.value === value && (
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  )}
                </li>
              ))}
              {options.length === 0 && (
                <li className="px-4 py-2 text-gray-500 dark:text-gray-400 text-sm">
                  No options available
                </li>
              )}
            </ul>
          )}

          {error && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';

// Helper to create a typed select component
export function createTypedSelect<T extends string>(defaultValue: T) {
  return React.forwardRef<HTMLDivElement, TypedSelectProps<T>>(
    ({ onChange, ...props }, ref) => {
      return <Select ref={ref} value={defaultValue as any} onChange={onChange as any} {...props} />;
    }
  );
}
