'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  Search as SearchIcon,
  FileText,
  BookOpen,
  Clock,
  Tag,
  TrendingUp,
  Filter,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/page-layout';
import { Navigation } from '@/components/layout/Navigation';
import Link from 'next/link';

interface SearchResult {
  id: string;
  text: string;
  type: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  answer?: string | null;
  tags?: string[];
}

interface SheetResult {
  id: string;
  title: string;
  description: string | null;
  taskCount: number;
  tags: string[];
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const query = searchParams.get('q') || '';
  const type = (searchParams.get('type') as 'tasks' | 'sheets' | 'all') || 'all';
  const [searchQuery, setSearchQuery] = useState(query);
  const [searchType, setSearchType] = useState<'tasks' | 'sheets' | 'all'>(type);
  const [results, setResults] = useState<{
    tasks?: SearchResult[];
    sheets?: SheetResult[];
  }>({});
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (query) {
      performSearch(query, type);
    }
  }, [query, type]);

  const performSearch = async (q: string, t: 'tasks' | 'sheets' | 'all') => {
    if (!q.trim()) {
      setResults({});
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);

      const data = await api.search({
        q,
        type: t,
        limit: 20,
      });

      setResults({
        tasks: data.results.tasks as SearchResult[] | undefined,
        sheets: data.results.sheets as SheetResult[] | undefined,
      });
    } catch (error) {
      console.error('Search failed:', error);
      showToast('Search failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set('q', searchQuery);
    }
    params.set('type', searchType);
    router.push(`/search?${params.toString()}`);
    performSearch(searchQuery, searchType);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults({});
    setHasSearched(false);
    router.push('/search');
  };

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

  const taskCount = results.tasks?.length || 0;
  const sheetCount = results.sheets?.length || 0;
  const totalResults = taskCount + sheetCount;

  return (
    <>
      <Navigation />
      <PageLayout maxWidth="4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Search Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Search
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Find tasks and sheets in our library
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for tasks or sheets..."
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as 'tasks' | 'sheets' | 'all')}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All</option>
                <option value="tasks">Tasks</option>
                <option value="sheets">Sheets</option>
              </select>
              <Button type="submit" disabled={!searchQuery.trim() || loading}>
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </form>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Searching...</p>
            </div>
          )}

          {/* No Search State */}
          {!hasSearched && !loading && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Start Searching
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Enter a search term to find tasks and sheets
              </p>
            </div>
          )}

          {/* No Results State */}
          {hasSearched && !loading && totalResults === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Results Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your search terms or filters
              </p>
            </div>
          )}

          {/* Results */}
          {hasSearched && !loading && totalResults > 0 && (
            <div>
              {/* Results Summary */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Found {totalResults} result{totalResults !== 1 ? 's' : ''}
                </p>
                <div className="flex gap-2">
                  {searchType === 'all' && (
                    <>
                      {taskCount > 0 && (
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-sm">
                          {taskCount} tasks
                        </span>
                      )}
                      {sheetCount > 0 && (
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-sm">
                          {sheetCount} sheets
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Tasks Results */}
              {results.tasks && results.tasks.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Tasks ({results.tasks.length})
                  </h2>
                  <div className="space-y-4">
                    {results.tasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Link href={`/tasks/${task.id}`}>
                          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer">
                            <div className="flex items-start justify-between mb-3">
                              <p className="text-gray-900 dark:text-white font-medium flex-1">
                                {task.text}
                              </p>
                              <TrendingUp className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(task.difficulty)}`}>
                                {task.difficulty}
                              </span>
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs capitalize">
                                {task.type}
                              </span>
                              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs capitalize">
                                {task.topic}
                              </span>
                              {task.tags && task.tags.length > 0 && (
                                <>
                                  {task.tags.slice(0, 2).map((tag) => (
                                    <span
                                      key={tag}
                                      className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </>
                              )}
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sheets Results */}
              {results.sheets && results.sheets.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Sheets ({results.sheets.length})
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {results.sheets.map((sheet, index) => (
                      <motion.div
                        key={sheet.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Link href={`/sheets/${sheet.id}`}>
                          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 transition-colors cursor-pointer h-full">
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="text-gray-900 dark:text-white font-semibold flex-1">
                                {sheet.title}
                              </h3>
                              <FileText className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                            </div>
                            {sheet.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                {sheet.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                {sheet.taskCount} tasks
                              </span>
                              {sheet.tags.length > 0 && (
                                <div className="flex gap-1">
                                  {sheet.tags.slice(0, 2).map((tag) => (
                                    <span
                                      key={tag}
                                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </PageLayout>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <>
        <Navigation />
        <PageLayout maxWidth="4xl">
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        </PageLayout>
      </>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
