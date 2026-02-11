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
  XCircle,
  Lightbulb,
  BookOpen,
  Clock,
  Target,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/page-layout';
import { Navigation } from '@/components/layout/Navigation';
import Link from 'next/link';

interface Task {
  id: string;
  text: string;
  type: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  answer: string | null;
  solution: string | null;
  explanation: string | null;
  context: string | null;
  instructions: string | null;
  learningOutcome: string | null;
  tags: string[];
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
      return;
    }
    if (user && taskId) {
      fetchTask();
    }
  }, [user, authLoading, taskId]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const data = await api.getTask(taskId);
      setTask(data as Task);
    } catch (error) {
      console.error('Failed to fetch task:', error);
      showToast('Failed to load task', 'error');
      router.push('/tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!userAnswer.trim()) {
      showToast('Please enter your answer', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const timeSpent = Math.round((Date.now() - startTime) / 1000);

      await api.submitTask({
        taskId,
        answer: userAnswer,
        timeSpent,
      });

      // Check if answer is correct
      const correct = task?.answer?.toLowerCase().trim() === userAnswer.toLowerCase().trim();
      setIsCorrect(correct);
      setSubmitted(true);

      showToast(
        correct ? 'Correct! Well done!' : 'Answer submitted',
        correct ? 'success' : 'info'
      );
    } catch (error) {
      console.error('Failed to submit answer:', error);
      showToast('Failed to submit answer', 'error');
    } finally {
      setSubmitting(false);
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <>
        <Navigation />
        <PageLayout maxWidth="4xl">
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Task not found</p>
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
          {/* Back Button */}
          <Link href="/tasks">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Library
            </Button>
          </Link>

          {/* Task Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(task.difficulty)}`}>
                {task.difficulty.charAt(0).toUpperCase() + task.difficulty.slice(1)}
              </span>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-sm font-medium capitalize">
                {task.type}
              </span>
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 rounded-full text-sm font-medium capitalize">
                {task.topic}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {task.text}
            </h1>

            {task.instructions && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                      Instructions
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-400">
                      {task.instructions}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {task.context && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Context: </span>
                  {task.context}
                </p>
              </div>
            )}
          </div>

          {/* Answer Section */}
          {!submitted ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Your Answer
              </h2>
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full min-h-[150px] p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-y"
                disabled={submitting}
              />
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {Math.round((Date.now() - startTime) / 1000)}s elapsed
                </span>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !userAnswer.trim()}
                  isLoading={submitting}
                >
                  Submit Answer
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
              <div className={`flex items-center gap-3 mb-4 ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {isCorrect ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <XCircle className="w-6 h-6" />
                )}
                <span className="text-lg font-semibold">
                  {isCorrect ? 'Correct!' : 'Answer Submitted'}
                </span>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Your answer:</p>
                <p className="text-gray-900 dark:text-white">{userAnswer}</p>
              </div>

              {!isCorrect && task.answer && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg mb-4">
                  <p className="text-sm text-green-600 dark:text-green-400 mb-1">Correct answer:</p>
                  <p className="text-green-900 dark:text-green-300">{task.answer}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSubmitted(false);
                    setUserAnswer('');
                    setShowSolution(false);
                  }}
                >
                  Try Again
                </Button>
                {task.solution && (
                  <Button
                    variant="ghost"
                    onClick={() => setShowSolution(!showSolution)}
                  >
                    {showSolution ? 'Hide' : 'Show'} Solution
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Solution Section */}
          {submitted && showSolution && task.solution && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                Solution
              </h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {task.solution}
              </p>
            </motion.div>
          )}

          {/* Explanation Section */}
          {task.explanation && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                Explanation
              </h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {task.explanation}
              </p>
            </div>
          )}

          {/* Learning Outcome */}
          {task.learningOutcome && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                Learning Outcome
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                {task.learningOutcome}
              </p>
            </div>
          )}

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      </PageLayout>
    </>
  );
}
