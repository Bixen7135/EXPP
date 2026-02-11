'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-client';
import { api } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Download,
  Share2,
  Edit2,
  Trash2,
  Copy,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/page-layout';
import { Navigation } from '@/components/layout/Navigation';
import { SheetAnalytics } from '@/components/sheets/SheetAnalytics';
import type { SheetWithTasks, Task } from '@/types';
import Link from 'next/link';

interface Sheet {
  id: string;
  title: string;
  description: string | null;
  tasks: Task[];
  tags: string[];
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
}

// Convert Sheet to SheetWithTasks for analytics
const convertToSheetWithTasks = (sheet: Sheet | null): SheetWithTasks | null => {
  if (!sheet) return null;
  return {
    ...sheet,
    userId: sheet.ownerId,
    taskCount: sheet.tasks.length,
    deletedAt: null,
  };
};

export default function SheetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const sheetId = params.id as string;

  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submittedTasks, setSubmittedTasks] = useState<Set<string>>(new Set());
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
      return;
    }
    if (user && sheetId) {
      fetchSheet();
    }
  }, [user, authLoading, sheetId]);

  const fetchSheet = async () => {
    try {
      setLoading(true);
      const data = await api.getSheet(sheetId);
      setSheet(data.sheet as Sheet);
    } catch (error) {
      console.error('Failed to fetch sheet:', error);
      showToast('Failed to load sheet', 'error');
      router.push('/sheets');
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleAnswerChange = (taskId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [taskId]: answer,
    }));
  };

  const handleSubmitTask = async (taskId: string) => {
    const answer = answers[taskId];
    if (!answer?.trim()) {
      showToast('Please enter your answer', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const timeSpent = Math.round((Date.now() - startTime) / 1000);

      await api.submitTask({
        taskId,
        answer,
        timeSpent,
      });

      setSubmittedTasks((prev) => new Set(prev).add(taskId));
      showToast('Answer submitted!', 'success');
    } catch (error) {
      console.error('Failed to submit answer:', error);
      showToast('Failed to submit answer', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAll = async () => {
    const submissions = Object.entries(answers)
      .filter(([taskId]) => !submittedTasks.has(taskId))
      .map(([taskId, answer]) => ({ taskId, answer }));

    if (submissions.length === 0) {
      showToast('No new answers to submit', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const timeSpent = Math.round((Date.now() - startTime) / 1000);

      await api.submitSheet({
        sheetId,
        submissions,
        timeSpent,
      });

      // Mark all as submitted
      submissions.forEach(({ taskId }) => {
        setSubmittedTasks((prev) => new Set(prev).add(taskId));
      });

      showToast('All answers submitted!', 'success');
    } catch (error) {
      console.error('Failed to submit sheet:', error);
      showToast('Failed to submit sheet', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'docx') => {
    try {
      const blob = await api.export({
        type: format,
        sheetId,
        options: {
          includeSolutions: false,
          includeExplanations: true,
        },
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sheet?.title || 'sheet'}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`Exported as ${format.toUpperCase()}`, 'success');
    } catch (error) {
      console.error('Failed to export:', error);
      showToast('Failed to export sheet', 'error');
    }
  };

  const handleCopy = async () => {
    try {
      await api.copySheet(sheetId);
      showToast('Sheet copied successfully', 'success');
      router.push('/sheets');
    } catch (error) {
      console.error('Failed to copy sheet:', error);
      showToast('Failed to copy sheet', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteSheets({ sheetIds: [sheetId] });
      showToast('Sheet deleted', 'success');
      router.push('/sheets');
    } catch (error) {
      console.error('Failed to delete sheet:', error);
      showToast('Failed to delete sheet', 'error');
    }
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

  const completedCount = submittedTasks.size;
  const totalCount = sheet?.tasks.length || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isOwner = user?.id === sheet?.ownerId;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  if (!sheet) {
    return (
      <>
        <Navigation />
        <PageLayout maxWidth="4xl">
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Sheet not found</p>
          </div>
        </PageLayout>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <PageLayout maxWidth="4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Link href="/sheets">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sheets
              </Button>
            </Link>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAnalyticsModal(true)}
                title="View analytics"
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleExport('pdf')}
                title="Export as PDF"
              >
                <Download className="w-4 h-4" />
              </Button>
              {isOwner && (
                <>
                  <Link href={`/sheets/${sheetId}/edit`}>
                    <Button variant="ghost" size="sm" title="Edit sheet">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    title="Copy sheet"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteModal(true)}
                    title="Delete sheet"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Sheet Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {sheet.title}
                </h1>
                {sheet.description && (
                  <p className="text-gray-600 dark:text-gray-400">
                    {sheet.description}
                  </p>
                )}
              </div>
            </div>

            {/* Tags */}
            {sheet.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {sheet.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Progress Bar */}
            <div className="mb-2">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">
                  Progress
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {completedCount} / {totalCount} tasks
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mt-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {totalCount} tasks
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {Math.round((Date.now() - startTime) / 1000)}s elapsed
              </span>
            </div>
          </div>

          {/* Submit All Button */}
          {completedCount < totalCount && (
            <div className="mb-6 flex justify-end">
              <Button
                onClick={handleSubmitAll}
                disabled={submitting}
                isLoading={submitting}
              >
                Submit All Answers
              </Button>
            </div>
          )}

          {/* Tasks List */}
          <div className="space-y-4">
            {sheet.tasks.map((task, index) => {
              const isExpanded = expandedTasks.has(task.id);
              const isSubmitted = submittedTasks.has(task.id);
              const hasAnswer = answers[task.id]?.trim();

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {/* Task Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    onClick={() => toggleTaskExpanded(task.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 dark:text-white font-medium mb-2">
                            {task.text}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(task.difficulty)}`}>
                              {task.difficulty}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs capitalize">
                              {task.type}
                            </span>
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs capitalize">
                              {task.topic}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {isSubmitted && (
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Task Answer Section (Expanded) */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700/30"
                    >
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Your Answer
                      </label>
                      <textarea
                        value={answers[task.id] || ''}
                        onChange={(e) => handleAnswerChange(task.id, e.target.value)}
                        placeholder="Type your answer here..."
                        className="w-full min-h-[100px] p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-y text-sm"
                        disabled={isSubmitted}
                      />
                      <div className="flex justify-end mt-3">
                        {!isSubmitted ? (
                          <Button
                            size="sm"
                            onClick={() => handleSubmitTask(task.id)}
                            disabled={!hasAnswer || submitting}
                            isLoading={submitting}
                          >
                            Submit Answer
                          </Button>
                        ) : (
                          <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Submitted
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Completion Message */}
          {completedCount === totalCount && totalCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 text-center"
            >
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-2">
                Sheet Complete!
              </h3>
              <p className="text-green-700 dark:text-green-400">
                You've completed all {totalCount} tasks in this sheet.
              </p>
            </motion.div>
          )}
        </motion.div>
      </PageLayout>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete Sheet?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This action cannot be undone. Are you sure you want to delete this sheet?
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {sheet && (
        <SheetAnalytics
          isOpen={showAnalyticsModal}
          onClose={() => setShowAnalyticsModal(false)}
          sheet={convertToSheetWithTasks(sheet)!}
        />
      )}
    </>
  );
}
