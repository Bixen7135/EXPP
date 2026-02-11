/**
 * Analytics utility functions for calculating sheet statistics
 */

export interface Task {
  id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  type: string;
}

export interface SheetAnalyticsData {
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
    easyPercent: number;
    mediumPercent: number;
    hardPercent: number;
  };
  topicDistribution: Array<{
    topic: string;
    count: number;
    percent: number;
  }>;
  typeDistribution: Array<{
    type: string;
    count: number;
    percent: number;
  }>;
  totalTasks: number;
  estimatedTimeMinutes: number;
  estimatedTimeFormatted: string;
}

/**
 * Calculate analytics data from a sheet with tasks
 */
export function calculateSheetAnalytics(tasks: Task[]): SheetAnalyticsData {
  const totalTasks = tasks.length;

  // Difficulty distribution
  const difficultyCounts = {
    easy: tasks.filter((t) => t.difficulty === 'easy').length,
    medium: tasks.filter((t) => t.difficulty === 'medium').length,
    hard: tasks.filter((t) => t.difficulty === 'hard').length,
  };

  const difficultyDistribution = {
    ...difficultyCounts,
    easyPercent: totalTasks > 0 ? Math.round((difficultyCounts.easy / totalTasks) * 100) : 0,
    mediumPercent: totalTasks > 0 ? Math.round((difficultyCounts.medium / totalTasks) * 100) : 0,
    hardPercent: totalTasks > 0 ? Math.round((difficultyCounts.hard / totalTasks) * 100) : 0,
  };

  // Topic distribution
  const topicCounts: Record<string, number> = {};
  tasks.forEach((task) => {
    topicCounts[task.topic] = (topicCounts[task.topic] || 0) + 1;
  });

  const topicDistribution = Object.entries(topicCounts)
    .map(([topic, count]) => ({
      topic,
      count,
      percent: totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count) // Sort by count descending
    .slice(0, 10); // Top 10 topics

  // Type distribution
  const typeCounts: Record<string, number> = {};
  tasks.forEach((task) => {
    typeCounts[task.type] = (typeCounts[task.type] || 0) + 1;
  });

  const typeDistribution = Object.entries(typeCounts)
    .map(([type, count]) => ({
      type,
      count,
      percent: totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Estimated completion time (easy: 2min, medium: 5min, hard: 10min)
  const estimatedTimeMinutes = tasks.reduce((acc, task) => {
    const times = { easy: 2, medium: 5, hard: 10 };
    return acc + (times[task.difficulty] || 5);
  }, 0);

  return {
    difficultyDistribution,
    topicDistribution,
    typeDistribution,
    totalTasks,
    estimatedTimeMinutes,
    estimatedTimeFormatted: formatEstimatedTime(estimatedTimeMinutes),
  };
}

/**
 * Format estimated time as human-readable string
 */
export function formatEstimatedTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
