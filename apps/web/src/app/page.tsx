'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-client';
import { api } from '@/lib/api-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BookOpen,
  FileText,
  TrendingUp,
  Target,
  ArrowRight,
  CheckCircle2,
  Clock,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [statistics, setStatistics] = useState<{
    solvedTasks: number;
    solvedSheets: number;
    successRate: number;
    averageScore: number;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const fetchQuickStats = async () => {
    try {
      setStatsLoading(true);
      const stats = await api.getStatistics();
      setStatistics({
        solvedTasks: stats.solvedTasks,
        solvedSheets: stats.solvedSheets,
        successRate: stats.successRate,
        averageScore: stats.averageScore,
      });
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      setFetchError(true);

      // Only show toast for non-503 errors (avoid spamming during startup)
      if (error instanceof Error && !error.message.includes('503')) {
        showToast('Unable to fetch your statistics. Please try refreshing the page.', 'error');
      }

      // Set empty statistics on error to prevent infinite retry loop
      setStatistics({
        solvedTasks: 0,
        solvedSheets: 0,
        successRate: 0,
        averageScore: 0,
      });
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    // Guard against repeated fetches if error already occurred
    if (user && initialized && !fetchError) {
      fetchQuickStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, initialized]);

  // Show loading state while checking auth
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  // Landing page for non-authenticated users
  if (!user) {
    return <LandingPage />;
  }

  // Dashboard for authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user.firstName || user.email?.split('@')[0]}!
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Continue your learning journey
              </p>
            </div>
            <Link href="/profile">
              <Button variant="ghost" size="sm">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.firstName || 'User'}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {(user.firstName || user.email?.[0] || 'U').toUpperCase()}
                  </div>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <StatCard
            icon={<Target className="w-6 h-6" />}
            label="Tasks Solved"
            value={statistics?.solvedTasks ?? 0}
            color="blue"
            loading={statsLoading}
          />
          <StatCard
            icon={<FileText className="w-6 h-6" />}
            label="Sheets Completed"
            value={statistics?.solvedSheets ?? 0}
            color="green"
            loading={statsLoading}
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Success Rate"
            value={statistics?.successRate ? `${statistics.successRate.toFixed(1)}%` : '0%'}
            color="purple"
            loading={statsLoading}
          />
          <StatCard
            icon={<Award className="w-6 h-6" />}
            label="Avg Score"
            value={statistics?.averageScore ? statistics.averageScore.toFixed(1) : '0'}
            color="amber"
            loading={statsLoading}
          />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickActionCard
              title="Practice Tasks"
              description="Browse and practice individual tasks"
              icon={<BookOpen className="w-8 h-8" />}
              href="/tasks"
              color="blue"
            />
            <QuickActionCard
              title="Task Sheets"
              description="Work on organized task sheets"
              icon={<FileText className="w-8 h-8" />}
              href="/sheets"
              color="green"
            />
            <QuickActionCard
              title="View Statistics"
              description="Track your progress and performance"
              icon={<TrendingUp className="w-8 h-8" />}
              href="/statistics"
              color="purple"
            />
          </div>
        </motion.div>

        {/* Recent Activity Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Get Started
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Start Practicing Today
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Browse our extensive library of tasks and sheets to improve your skills.
                  Track your progress and achieve your learning goals.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/tasks">
                    <Button>
                      Browse Tasks
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/sheets">
                    <Button variant="secondary">
                      View Sheets
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

// Landing Page Component
function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Exam Practice Platform
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Master your exams with comprehensive practice tasks, organized sheets,
              and detailed progress tracking.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => router.push('/auth/signin')}>
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="secondary" onClick={() => router.push('/tasks')}>
                Browse Tasks
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            Everything You Need to Succeed
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<BookOpen className="w-8 h-8" />}
              title="Extensive Task Library"
              description="Access thousands of practice questions organized by topic, difficulty, and type."
              color="blue"
            />
            <FeatureCard
              icon={<FileText className="w-8 h-8" />}
              title="Organized Sheets"
              description="Practice with curated task sheets designed for comprehensive exam preparation."
              color="green"
            />
            <FeatureCard
              icon={<TrendingUp className="w-8 h-8" />}
              title="Track Progress"
              description="Monitor your performance with detailed statistics and progress analytics."
              color="purple"
            />
          </div>
        </motion.div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 sm:p-12 text-center"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of students who are improving their exam performance
            with our practice platform.
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => router.push('/auth/signin')}
          >
            Create Free Account
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  color,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: 'blue' | 'green' | 'purple' | 'amber';
  loading: boolean;
}) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      {loading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
      ) : (
        <>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        </>
      )}
    </div>
  );
}

// Quick Action Card Component
function QuickActionCard({
  title,
  description,
  icon,
  href,
  color,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: 'blue' | 'green' | 'purple';
}) {
  const colorClasses = {
    blue: 'hover:border-blue-300 dark:hover:border-blue-700 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20',
    green: 'hover:border-green-300 dark:hover:border-green-700 group-hover:bg-green-50 dark:group-hover:bg-green-900/20',
    purple: 'hover:border-purple-300 dark:hover:border-purple-700 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20',
  };

  const iconColorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    purple: 'text-purple-600 dark:text-purple-400',
  };

  return (
    <Link href={href}>
      <div className={`group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-200 ${colorClasses[color]} cursor-pointer`}>
        <div className={`mb-4 ${iconColorClasses[color]}`}>
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>
    </Link>
  );
}

// Feature Card Component
function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'blue' | 'green' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="text-center">
      <div className={`inline-flex p-4 rounded-2xl ${colorClasses[color]} mb-4`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}
