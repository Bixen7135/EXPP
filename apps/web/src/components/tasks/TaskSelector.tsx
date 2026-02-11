'use client';

import { useState, useEffect } from 'react';
import { Search, Check, BookOpen, Clock } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select, SelectOption } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api-client';
import type { Task } from '@/types';

interface TaskSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTasks: (taskIds: string[]) => void;
  excludeTaskIds?: string[]; // Tasks to exclude (already in sheet)
}

const TOPICS: SelectOption[] = [
  { value: 'all', label: 'All Topics' },
  { value: 'math', label: 'Mathematics' },
  { value: 'physics', label: 'Physics' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'biology', label: 'Biology' },
  { value: 'history', label: 'History' },
  { value: 'geography', label: 'Geography' },
  { value: 'literature', label: 'Literature' },
  { value: 'computer-science', label: 'Computer Science' },
  { value: 'economics', label: 'Economics' },
  { value: 'other', label: 'Other' },
];

const DIFFICULTIES: SelectOption[] = [
  { value: 'all', label: 'All Difficulties' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export function TaskSelector({ isOpen, onClose, onAddTasks, excludeTaskIds = [] }: TaskSelectorProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  // Fetch tasks when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTasks();
    }
  }, [isOpen]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.listTasks({
        limit: 100,
      });

      // Filter out excluded tasks
      const filteredTasks = (response.tasks as any[]).filter(
        (task) => !excludeTaskIds.includes(task.id)
      );

      setTasks(filteredTasks);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      showToast('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Toggle task selection
  const toggleTaskSelection = (taskId: string) => {
    const newSelection = new Set(selectedTaskIds);
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId);
    } else {
      newSelection.add(taskId);
    }
    setSelectedTaskIds(newSelection);
  };

  // Select all visible tasks
  const selectAllVisible = () => {
    const newSelection = new Set(selectedTaskIds);
    filteredTasks.forEach((task) => newSelection.add(task.id));
    setSelectedTaskIds(newSelection);
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedTaskIds(new Set());
  };

  // Add selected tasks to sheet
  const handleAddTasks = () => {
    if (selectedTaskIds.size === 0) {
      showToast('Please select at least one task', 'error');
      return;
    }

    onAddTasks(Array.from(selectedTaskIds));
    setSelectedTaskIds(new Set());
    setSearchQuery('');
    setTopicFilter('all');
    setDifficultyFilter('all');
    onClose();
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      !searchQuery ||
      task.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesTopic =
      topicFilter === 'all' || task.topic === topicFilter;

    const matchesDifficulty =
      difficultyFilter === 'all' || task.difficulty === difficultyFilter;

    return matchesSearch && matchesTopic && matchesDifficulty;
  });

  const selectedCount = selectedTaskIds.size;
  const visibleCount = filteredTasks.length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Tasks" size="xl">
      <div className="space-y-4">
        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by text or tags..."
              className="pl-12"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Topic"
              options={TOPICS}
              value={topicFilter}
              onChange={setTopicFilter}
            />
            <Select
              label="Difficulty"
              options={DIFFICULTIES}
              value={difficultyFilter}
              onChange={setDifficultyFilter}
            />
          </div>
        </div>

        {/* Selection Controls */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white">
              {selectedCount}
            </span>{' '}
            / {visibleCount} tasks selected
          </span>
          <div className="flex gap-2">
            {selectedCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Clear
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={selectAllVisible}>
              Select All ({visibleCount})
            </Button>
          </div>
        </div>

        {/* Task List */}
        <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                No tasks found
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Try adjusting your filters or search query
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTaskSelection(task.id)}
                  className={`
                    flex items-start gap-3 p-4 cursor-pointer transition-colors
                    hover:bg-gray-50 dark:hover:bg-gray-800
                    ${selectedTaskIds.has(task.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  `}
                >
                  {/* Checkbox */}
                  <div className={`
                    w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                    ${selectedTaskIds.has(task.id)
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-300 dark:border-gray-600'
                    }
                  `}>
                    {selectedTaskIds.has(task.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {task.text}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${getDifficultyColor(task.difficulty)}`}>
                        {task.difficulty}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full capitalize">
                        {task.type}
                      </span>
                      <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full capitalize">
                        {task.topic}
                      </span>
                      {task.tags?.slice(0, 2).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAddTasks}
            disabled={selectedCount === 0}
            icon={selectedCount > 0 ? <Check className="w-4 h-4" /> : undefined}
          >
            Add {selectedCount > 0 ? `(${selectedCount})` : ''} Tasks
          </Button>
        </div>
      </div>
    </Modal>
  );
}
