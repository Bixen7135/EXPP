'use client';

import * as React from 'react';
import { Check, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MultiSelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  selectedValues: Set<string>;
  onChange: (values: Set<string>) => void;
  searchable?: boolean;
  maxVisible?: number;
  disabled?: boolean;
  selectAllLabel?: string;
  clearAllLabel?: string;
  className?: string;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  (
    {
      label,
      placeholder = 'Select...',
      options,
      selectedValues,
      onChange,
      searchable = false,
      maxVisible = 10,
      disabled = false,
      selectAllLabel = 'Select All',
      clearAllLabel = 'Clear All',
      className,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
    const [searchQuery, setSearchQuery] = React.useState('');
    const selectRef = React.useRef<HTMLDivElement>(null);
    const listRef = React.useRef<HTMLUListElement>(null);

    // Filter options based on search
    const filteredOptions = React.useMemo(() => {
      if (!searchable || !searchQuery) return options;
      const lowerQuery = searchQuery.toLowerCase();
      return options.filter((opt) =>
        opt.label.toLowerCase().includes(lowerQuery) || opt.value.toLowerCase().includes(lowerQuery)
      );
    }, [options, searchQuery, searchable]);

    // Show limited or all options
    const visibleOptions = React.useMemo(() => {
      if (maxVisible && maxVisible < filteredOptions.length) {
        return filteredOptions.slice(0, maxVisible);
      }
      return filteredOptions;
    }, [filteredOptions, maxVisible]);

    const selectedCount = selectedValues.size;
    const allSelected = selectedCount > 0 && selectedCount === visibleOptions.length;
    const hasMore = visibleOptions.length > maxVisible;

    // Toggle option selection
    const toggleOption = (value: string) => {
      const newSelection = new Set(selectedValues);
      if (newSelection.has(value)) {
        newSelection.delete(value);
      } else {
        newSelection.add(value);
      }
      onChange(newSelection);
    };

    // Select all visible
    const selectAllVisible = () => {
      const newSelection = new Set(selectedValues);
      visibleOptions.forEach((opt) => {
        if (!opt.disabled) newSelection.add(opt.value);
      });
      onChange(newSelection);
    };

    // Clear all selection
    const clearAll = () => {
      onChange(new Set());
      setSearchQuery('');
    };

    // Select/deselect an option
    const handleSelect = (optionValue: string) => {
      toggleOption(optionValue);
      if (!searchable) setIsOpen(false);
    };

    // Remove individual selection
    const handleRemove = (optionValue: string, e: React.MouseEvent) => {
      e.stopPropagation();
      toggleOption(optionValue);
    };

    // Keyboard navigation
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
            prev < visibleOptions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && visibleOptions[highlightedIndex]) {
            handleSelect(visibleOptions[highlightedIndex].value);
          }
          break;
        case 'a':
        case 'A':
          // Select/deselect all
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (allSelected) {
              clearAll();
            } else {
              selectAllVisible();
            }
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
    }, [highlightedIndex, visibleOptions]);

    return (
      <div ref={ref} className={cn('w-full', className)}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {label}
            {selectedCount > 0 && (
              <span className="ml-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
                ({selectedCount}/{options.length})
              </span>
            )}
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
              'flex items-center justify-between',
              'transition-colors duration-200',
              'cursor-pointer'
            )}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span className={cn(!selectedCount && 'text-gray-400 dark:text-gray-500')}>
              {selectedCount > 0
                ? `${selectedCount} selected`
                : placeholder}
            </span>
            {searchable && (
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            )}
            {!selectedCount && (
              <button
                type="button"
                onClick={selectAllVisible}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                {selectAllLabel}
              </button>
            )}
            {selectedCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-sm text-gray-600 dark:text-gray-400 hover:underline font-medium"
              >
                {clearAllLabel}
              </button>
            )}
          </button>

          {/* Dropdown Options */}
          {isOpen && (
            <div
              className={cn(
                'absolute z-10 w-full mt-1 max-h-60 overflow-auto rounded-lg shadow-lg',
                'bg-white dark:bg-gray-800',
                'border border-gray-300 dark:border-gray-600'
              )}
            >
              {searchable && (
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <ul
                ref={listRef}
                role="listbox"
                className="py-1 max-h-60 overflow-auto"
              >
                {visibleOptions.map((option, index) => {
                  const isSelected = selectedValues.has(option.value);
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <li
                      key={option.value}
                      role="option"
                      onClick={() => !option.disabled && handleSelect(option.value)}
                      className={cn(
                        'px-4 py-2.5 cursor-pointer',
                        'text-gray-900 dark:text-white',
                        'flex items-center justify-between',
                        'transition-colors duration-150',
                        option.disabled && 'opacity-50 cursor-not-allowed',
                        !option.disabled && 'hover:bg-gray-50 dark:hover:bg-gray-700',
                        isSelected && 'bg-blue-50 dark:bg-blue-900/20',
                        isHighlighted && 'bg-gray-100 dark:bg-gray-700'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOption(option.value)}
                          className={cn(
                            'w-5 h-5 rounded border-2',
                            'border-gray-300 dark:border-gray-600',
                            'text-blue-600 dark:text-blue-400',
                            'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                            option.disabled && 'opacity-50 cursor-not-allowed'
                          )}
                          disabled={option.disabled}
                        />
                        <span className="flex-1">{option.label}</span>
                        {isSelected && (
                          <button
                            type="button"
                            onClick={(e) => handleRemove(option.value, e)}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            aria-label={`Remove ${option.label}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              {hasMore && (
                <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-center">
                  <button
                    onClick={() => setIsOpen(true)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Show {options.length - maxVisible} more
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

MultiSelect.displayName = 'MultiSelect';
