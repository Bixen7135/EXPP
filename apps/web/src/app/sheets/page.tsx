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
  Copy,
  Share2,
  LayoutGrid,
  List,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-client';
import { PageLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { useToast } from '@/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

type ViewMode = 'grid' | 'list';
type SortField = 'created_at' | 'title' | 'tasks';

interface Sheet {
  id: string;
  title: string;
  description?: string | null;
  tasks: string[];
  tags?: string[] | null;
  isTemplate?: boolean;
  createdAt: string;
  updatedAt: string;
}

const SheetCard = ({
  sheet,
  taskCount,
  onView,
  onEdit,
  viewMode,
}: {
  sheet: Sheet;
  taskCount: number;
  onView: () => void;
  onEdit: (e: React.MouseEvent) => void;
  viewMode: ViewMode;
}) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-500/30 p-6 transition-all duration-200 hover:shadow-md cursor-pointer ${viewMode === 'grid' ? 'h-full' : ''}`}
      onClick={onView}
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">{sheet.title}</h3>
        <button
          onClick={onEdit}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      {sheet.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {sheet.description}
        </p>
      )}

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="text-gray-500 dark:text-gray-400">
            {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
          </span>
          {sheet.isTemplate && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium">
              Template
            </span>
          )}
        </div>
      </div>

      {sheet.tags && sheet.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {sheet.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs"
            >
              {tag}
            </span>
          ))}
          {sheet.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
              +{sheet.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default function SheetsLibraryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [tasksMap, setTasksMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadSheets();
  }, []);

  const loadSheets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.listSheets({ page: 1, limit: 50 });
      setSheets(data.sheets as Sheet[]);

      // Build tasks count map
      const tasksCount: Record<string, number> = {};
      for (const sheet of data.sheets as Sheet[]) {
        tasksCount[sheet.id] = sheet.tasks?.length || 0;
      }
      setTasksMap(tasksCount);
    } catch (err) {
      setError('Failed to load sheets');
      console.error('Error loading sheets:', err);
      showToast('Failed to load sheets', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedSheets = useMemo(() => {
    let result = [...sheets];

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      result = result.filter((sheet) =>
        sheet.title.toLowerCase().includes(searchLower) ||
        (sheet.description && sheet.description.toLowerCase().includes(searchLower))
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'created_at':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'tasks':
          comparison = (a.tasks?.length || 0) - (b.tasks?.length || 0);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [sheets, searchQuery, sortField, sortDirection]);

  const handleCreateSheet = async (title: string, description: string | undefined) => {
    try {
      await api.createSheet({
        title,
        description,
        tasks: [],
      });
      showToast('Sheet created successfully', 'success');
      setShowCreateModal(false);
      loadSheets();
    } catch (err) {
      console.error('Error creating sheet:', err);
      showToast('Failed to create sheet', 'error');
    }
  };

  const handleDeleteSheet = async (sheetId: string) => {
    try {
      await api.deleteSheets({ sheetIds: [sheetId] });
      showToast('Sheet deleted successfully', 'success');
      loadSheets();
    } catch (err) {
      console.error('Error deleting sheet:', err);
      showToast('Failed to delete sheet', 'error');
    }
  };

  const handleCopySheet = async (sheetId: string) => {
    try {
      await api.copySheet(sheetId);
      showToast('Sheet copied successfully', 'success');
      loadSheets();
    } catch (err) {
      console.error('Error copying sheet:', err);
      showToast('Failed to copy sheet', 'error');
    }
  };

  return (
    <PageLayout maxWidth="2xl">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Task Sheets</h1>
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              icon={<Plus className="w-5 h-5" />}
              onClick={() => setShowCreateModal(true)}
            >
              New Sheet
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
                  placeholder="Search sheets..."
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
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Sort by:</span>

            <div className="flex items-center gap-4">
              <button
                onClick={() => toggleSort('created_at')}
                className={`text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  sortField === 'created_at'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Date
                {sortField === 'created_at' && (sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />)}
              </button>

              <button
                onClick={() => toggleSort('title')}
                className={`text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  sortField === 'title'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Title
                {sortField === 'title' && (sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />)}
              </button>

              <button
                onClick={() => toggleSort('tasks')}
                className={`text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  sortField === 'tasks'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Tasks
                {sortField === 'tasks' && (sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />)}
              </button>
            </div>
          </div>
        </div>

        {/* Sheets Grid/List */}
        {isLoading ? (
          <div className="flex items-center justify-center mt-6">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        ) : error ? (
          <div className="mt-6 p-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 dark:text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Error loading sheets
            </h3>
            <p className="text-gray-500 dark:text-gray-400">{error}</p>
          </div>
        ) : filteredAndSortedSheets.length === 0 ? (
          <div className="text-center py-12 mt-6">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <FileText className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No sheets found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Create a new sheet to get started
            </p>
            <div className="flex justify-center mt-4">
              <Button
                variant="primary"
                size="lg"
                icon={<Plus className="w-5 h-5" />}
                onClick={() => setShowCreateModal(true)}
              >
                Create New Sheet
              </Button>
            </div>
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
              {filteredAndSortedSheets.map((sheet) => (
                <div key={sheet.id} className="relative group">
                  <SheetCard
                    sheet={sheet}
                    taskCount={tasksMap[sheet.id] || 0}
                    onView={() => router.push(`/sheets/${sheet.id}`)}
                    onEdit={(e) => {
                      e.stopPropagation();
                      router.push(`/sheets/${sheet.id}/edit`);
                    }}
                    viewMode={viewMode}
                  />
                  {/* Action buttons on hover */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopySheet(sheet.id);
                      }}
                      className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                      title="Copy"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSheet(sheet.id);
                      }}
                      className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Create Sheet Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowCreateModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create New Sheet</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const title = formData.get('title') as string;
                    const description = formData.get('description') as string;
                    handleCreateSheet(title, description || undefined);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter sheet title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description (optional)
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter sheet description"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary">
                      Create Sheet
                    </Button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageLayout>
  );
}
