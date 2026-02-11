'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { api, UserStatistics } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Target,
  CheckCircle2,
  Clock,
  Award,
  BookOpen,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/page-layout';
import { Navigation } from '@/components/layout/Navigation';

type TimeRange = 7 | 30 | 90;

export default function StatisticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [progress, setProgress] = useState<{
    date: string;
    tasksCompleted: number;
    sheetsCompleted: number;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>(30);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
      return;
    }
    if (user) {
      fetchStatistics();
      fetchProgress();
    }
  }, [user, authLoading, timeRange]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const stats = await api.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      showToast('Failed to load statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const data = await api.getProgress();
      setProgress(data as {
        date: string;
        tasksCompleted: number;
        sheetsCompleted: number;
      }[]);
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <>
        <Navigation />
        <PageLayout maxWidth="4xl">
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No statistics available</p>
          </div>
        </PageLayout>
      </>
    );
  }

  // Calculate completion percentages
  const getDifficultyPercentage = (correct: number) => {
    const total = statistics.totalTaskAttempts;
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  };

  const difficultyData = [
    {
      name: 'Easy',
      correct: statistics.tasksByDifficulty.easy,
      color: 'bg-green-500',
      percentage: getDifficultyPercentage(statistics.tasksByDifficulty.easy),
    },
    {
      name: 'Medium',
      correct: statistics.tasksByDifficulty.medium,
      color: 'bg-yellow-500',
      percentage: getDifficultyPercentage(statistics.tasksByDifficulty.medium),
    },
    {
      name: 'Hard',
      correct: statistics.tasksByDifficulty.hard,
      color: 'bg-red-500',
      percentage: getDifficultyPercentage(statistics.tasksByDifficulty.hard),
    },
  ];

  // Process topic data
  const topicData = Object.entries(statistics.tasksByTopic)
    .map(([topic, data]) => ({
      topic,
      correct: (data as { correct: number; total: number }).correct,
      total: (data as { correct: number; total: number }).total,
      percentage: Math.round(
        ((data as { correct: number; total: number }).correct /
          (data as { correct: number; total: number }).total) * 100
      ),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  // Process type data
  const typeData = Object.entries(statistics.tasksByType)
    .map(([type, data]) => ({
      type,
      correct: (data as { correct: number; total: number }).correct,
      total: (data as { correct: number; total: number }).total,
      percentage: Math.round(
        ((data as { correct: number; total: number }).correct /
          (data as { correct: number; total: number }).total) * 100
      ),
    }))
    .sort((a, b) => b.total - a.total);

  // Format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <>
      <Navigation />
      <PageLayout maxWidth="6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Your Statistics
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your learning progress and performance
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="mb-6 flex gap-2">
            <Button
              size="sm"
              variant={timeRange === 7 ? 'primary' : 'ghost'}
              onClick={() => setTimeRange(7)}
            >
              7 Days
            </Button>
            <Button
              size="sm"
              variant={timeRange === 30 ? 'primary' : 'ghost'}
              onClick={() => setTimeRange(30)}
            >
              30 Days
            </Button>
            <Button
              size="sm"
              variant={timeRange === 90 ? 'primary' : 'ghost'}
              onClick={() => setTimeRange(90)}
            >
              90 Days
            </Button>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<Target className="w-6 h-6" />}
              label="Tasks Solved"
              value={statistics.solvedTasks}
              total={statistics.totalTaskAttempts}
              color="blue"
            />
            <StatCard
              icon={<BookOpen className="w-6 h-6" />}
              label="Sheets Completed"
              value={statistics.solvedSheets}
              total={statistics.totalSheetAttempts}
              color="green"
            />
            <StatCard
              icon={<TrendingUp className="w-6 h-6" />}
              label="Success Rate"
              value={`${statistics.successRate.toFixed(1)}%`}
              color="purple"
            />
            <StatCard
              icon={<Clock className="w-6 h-6" />}
              label="Time Spent"
              value={formatTime(statistics.totalTimeSpent)}
              color="amber"
            />
          </div>

          {/* Difficulty Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Performance by Difficulty
            </h2>
            <div className="space-y-4">
              {difficultyData.map((item) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {item.name}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {item.correct} / {statistics.totalTaskAttempts} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Topic Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Performance by Topic
            </h2>
            <div className="space-y-4">
              {topicData.map((item) => (
                <div key={item.topic}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {item.topic}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {item.correct} / {item.total} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Type Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Performance by Question Type
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {typeData.map((item) => (
                <div
                  key={item.type}
                  className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize mb-2">
                    {item.type}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {item.correct}/{item.total}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.percentage}% success
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          {statistics.recentActivity.length > 0 && (
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Activity
              </h2>
              <div className="space-y-3">
                {statistics.recentActivity.slice(0, 5).map((activity: unknown, index: number) => {
                  const act = activity as { type: string; timestamp: string; details?: string };
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {act.type === 'task' ? 'Task Completed' : 'Sheet Completed'}
                        </p>
                        {act.details && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {act.details}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(act.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </PageLayout>
    </>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  total,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  total?: number;
  color: 'blue' | 'green' | 'purple' | 'amber';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className={`p-3 rounded-lg ${colorClasses[color]} mb-4 w-fit`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
        {total !== undefined && (
          <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2">
            / {total}
          </span>
        )}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{label}</p>
    </div>
  );
}
