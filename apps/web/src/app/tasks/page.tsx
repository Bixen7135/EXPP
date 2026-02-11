'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  Loader2,
  AlertTriangle,
  FileText,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  SortAsc,
  SortDesc,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-client';
import { PageLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { useToast } from '@/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api-client';

type SortKey = 'date' | 'topic' | 'difficulty' | 'type';
type ViewMode = 'grid' | 'list';

interface Task {
  id: string;
  text: string;
  type: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  answer?: string | null;
  solution?: string | null;
  createdAt: string;
}

interface Filters {
  search: string;
  topics: Set<string>;
  difficulties: Set<string>;
  types: Set<string>;
}

const getDifficultyColor = (difficulty: string) => {
  const colors = {
    easy: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    hard: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  };
  return colors[difficulty as keyof typeof colors] || 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300';
};

const getTypeColor = (type: string) => {
  return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
};

const getTopicColor = (topic: string) => {
  return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
};

const TaskCard = ({
  task,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  showAnswer,
  onToggleAnswer,
  viewMode,
}: {
  task: Task;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  showAnswer: boolean;
  onToggleAnswer: () => void;
  viewMode: ViewMode;
}) => {
  const difficultyColors = getDifficultyColor(task.difficulty);
  const typeColors = getTypeColor(task.type);
  const topicColors = getTopicColor(task.topic);

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border ${
        isSelected
          ? 'border-blue-500 dark:border-blue-400'
          : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-500/30'
      } p-4 transition-all duration-200 hover:shadow-md cursor-pointer ${viewMode === 'grid' ? 'h-[400px] flex flex-col' : ''}`}
      onClick={onSelect}
    >
      <div className={viewMode === 'grid' ? 'flex-shrink-0' : ''}>
        <div className="flex items-center flex-wrap gap-2 mb-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyColors}`}>
            {task.difficulty.charAt(0).toUpperCase() + task.difficulty.slice(1)}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${topicColors}`}>
            {task.topic}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${typeColors}`}>
            {task.type}
          </span>
        </div>
      </div>

      <div className={viewMode === 'grid' ? 'flex flex-col flex-grow min-h-0' : ''}>
        <div className={`prose dark:prose-invert max-w-none ${viewMode === 'grid' ? 'overflow-y-auto flex-grow' : ''}`}>
          <p className="whitespace-pre-wrap">{task.text}</p>
        </div>
        {showAnswer && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="prose dark:prose-invert max-w-none">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Solution</h4>
                <div className="text-blue-800 dark:text-blue-200">
                  {task.solution || 'No solution provided'}
                </div>
              </div>
              {task.answer && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                  <h4 className="text-sm font-medium text-green-900 dark:text-green-300 mb-2">Answer</h4>
                  <div className="text-green-800 dark:text-green-200">
                    {task.answer}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleAnswer();
          }}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ChevronDown className={`w-4 h-4 transform transition-transform ${showAnswer ? 'rotate-180' : ''}`} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 text-red-500 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default function TaskLibraryPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    search: '',
    topics: new Set<string>(),
    difficulties: new Set<string>(),
    types: new Set<string>(),
  });

  // Get unique values for filters
  const topics = useMemo(() => Array.from(new Set(tasks.map((t) => t.topic))).sort(), [tasks]);
  const types = useMemo(() => Array.from(new Set(tasks.map((t) => t.type))).sort(), [tasks]);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.listTasks({ page: 1, limit: 100 });
      setTasks(data.tasks as Task[]);
    } catch (err) {
      setError('Failed to load tasks. Please try again later.');
      console.error('Error loading tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSort = (field: SortKey) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        const matchesSearch =
          !searchQuery ||
          task.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.type.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDifficulty = filters.difficulties.size === 0 || filters.difficulties.has(task.difficulty);
        const matchesType = filters.types.size === 0 || filters.types.has(task.type);
        const matchesTopic = filters.topics.size === 0 || filters.topics.has(task.topic);

        return matchesSearch && matchesDifficulty && matchesType && matchesTopic;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'topic':
            comparison = a.topic.localeCompare(b.topic);
            break;
          case 'difficulty':
            const difficultyOrder: Record<string, number> = { easy: 0, medium: 1, hard: 2 };
            comparison = (difficultyOrder[a.difficulty] || 0) - (difficultyOrder[b.difficulty] || 0);
            break;
          case 'type':
            comparison = a.type.localeCompare(b.type);
            break;
          case 'date':
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [tasks, searchQuery, filters, sortBy, sortDirection]);

  const handleTaskClick = (taskId: string) => {
    setSelectedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const toggleAnswer = (taskId: string) => {
    setExpandedAnswers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleDelete = async (taskId: string) => {
    try {
      await api.deleteTasks({ taskIds: [taskId] });
      showToast('Task deleted successfully', 'success');
      await loadTasks();
      setSelectedTasks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    } catch (error) {
      console.error('Delete error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
      showToast(errorMessage, 'error');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await api.deleteTasks({ taskIds: Array.from(selectedTasks) });
      showToast(`${selectedTasks.size} task(s) deleted successfully`, 'success');
      await loadTasks();
      setSelectedTasks(new Set());
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Delete error:', error);
      showToast('Failed to delete tasks', 'error');
    }
  };

  return (
    <PageLayout maxWidth="2xl">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Task Library</h1>
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              icon={<Plus className="w-5 h-5" />}
              onClick={() => setIsCreating(true)}
            >
              Create Task
            </Button>
          </div>
        </div>

        {/* Search and View Controls */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>

                <Button
                  variant={showFilters ? 'primary' : 'ghost'}
                  icon={<Filter className="w-5 h-5" />}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  Filters {filters.topics.size + filters.types.size + filters.difficulties.size > 0 && (
                    <span className="ml-1.5 px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-500/20 text-blue-600">
                      {filters.topics.size + filters.types.size + filters.difficulties.size}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-gray-200 dark:border-gray-700"
              >
                <div className="p-6 space-y-4">
                  {/* Difficulty Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Difficulty</label>
                    <div className="flex flex-wrap gap-2">
                      {['easy', 'medium', 'hard'].map((diff) => (
                        <button
                          key={diff}
                          onClick={() => {
                            setFilters((prev) => {
                              const newDifficulties = new Set(prev.difficulties);
                              if (newDifficulties.has(diff)) {
                                newDifficulties.delete(diff);
                              } else {
                                newDifficulties.add(diff);
                              }
                              return { ...prev, difficulties: newDifficulties };
                            });
                          }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            filters.difficulties.has(diff)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {diff.charAt(0).toUpperCase() + diff.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                    <div className="flex flex-wrap gap-2">
                      {types.map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            setFilters((prev) => {
                              const newTypes = new Set(prev.types);
                              if (newTypes.has(type)) {
                                newTypes.delete(type);
                              } else {
                                newTypes.add(type);
                              }
                              return { ...prev, types: newTypes };
                            });
                          }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            filters.types.has(type)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Sort by:
            </span>

            <div className="flex items-center gap-4">
              <button
                onClick={() => toggleSort('date')}
                className={`text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  sortBy === 'date'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Date
                {sortBy === 'date' && (sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />)}
              </button>

              <button
                onClick={() => toggleSort('topic')}
                className={`text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  sortBy === 'topic'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Topic
                {sortBy === 'topic' && (sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />)}
              </button>

              <button
                onClick={() => toggleSort('type')}
                className={`text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  sortBy === 'type'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Type
                {sortBy === 'type' && (sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />)}
              </button>
            </div>
          </div>
        </div>

        {/* Task Grid/List */}
        {isLoading ? (
          <div className="flex items-center justify-center mt-6">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        ) : error ? (
          <div className="mt-6 p-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 dark:text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Error loading tasks
            </h3>
            <p className="text-gray-500 dark:text-gray-400">{error}</p>
          </div>
        ) : filteredAndSortedTasks.length === 0 ? (
          <div className="text-center py-12 mt-6">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <FileText className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No tasks found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery ? 'Try adjusting your search or filters' : 'Start by creating your first task'}
            </p>
            {!searchQuery && (
              <Button
                variant="primary"
                size="lg"
                icon={<Plus className="w-5 h-5" />}
                onClick={() => setIsCreating(true)}
                className="mt-4"
              >
                Create New Task
              </Button>
            )}
          </div>
        ) : (
          <motion.div
            layout
            className={`${
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 auto-rows-fr'
                : 'space-y-4 mt-6'
            }`}
          >
            <AnimatePresence>
              {filteredAndSortedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isSelected={selectedTasks.has(task.id)}
                  onSelect={() => handleTaskClick(task.id)}
                  onEdit={() => {/* TODO: Implement edit modal */}}
                  onDelete={() => handleDelete(task.id)}
                  showAnswer={expandedAnswers.has(task.id)}
                  onToggleAnswer={() => toggleAnswer(task.id)}
                  viewMode={viewMode}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Selection Actions */}
        <AnimatePresence>
          {selectedTasks.size > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center gap-4 shadow-lg z-50"
            >
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="secondary"
                  className="whitespace-nowrap text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowDeleteConfirm(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700"
              >
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Confirm Deletion
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Are you sure you want to delete {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''}? This action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Task Modal Placeholder */}
        {isCreating && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-2xl w-full border border-gray-200 dark:border-gray-700"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create Task</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Task creation form will be implemented here.</p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => setIsCreating(false)}>
                  Create
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
