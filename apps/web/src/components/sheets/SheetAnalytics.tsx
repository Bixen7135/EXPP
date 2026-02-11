'use client';

import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { calculateSheetAnalytics, type SheetAnalyticsData } from '@/lib/analytics';
import type { SheetWithTasks } from '@/types';

export interface SheetAnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
  sheet: SheetWithTasks;
}

export function SheetAnalytics({ isOpen, onClose, sheet }: SheetAnalyticsProps) {
  const analytics = calculateSheetAnalytics(sheet.tasks);

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500 dark:bg-green-600';
      case 'medium':
        return 'bg-yellow-500 dark:bg-yellow-600';
      case 'hard':
        return 'bg-red-500 dark:bg-red-600';
      default:
        return 'bg-gray-500 dark:bg-gray-600';
    }
  };

  const getDifficultyTextColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-700 dark:text-green-400';
      case 'medium':
        return 'text-yellow-700 dark:text-yellow-400';
      case 'hard':
        return 'text-red-700 dark:text-red-400';
      default:
        return 'text-gray-700 dark:text-gray-400';
    }
  };

  const getTopicColor = (index: number) => {
    const colors = [
      'bg-blue-500 dark:bg-blue-600',
      'bg-purple-500 dark:bg-purple-600',
      'bg-pink-500 dark:bg-pink-600',
      'bg-indigo-500 dark:bg-indigo-600',
      'bg-orange-500 dark:bg-orange-600',
      'bg-teal-500 dark:bg-teal-600',
      'bg-cyan-500 dark:bg-cyan-600',
    ];
    return colors[index % colors.length];
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sheet Analytics" size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {sheet.title}
          </h3>
          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <span>{analytics.totalTasks} tasks</span>
            <span>•</span>
            <span>Est. time: {analytics.estimatedTimeFormatted}</span>
          </div>
        </div>

        {/* Difficulty Distribution */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Difficulty Distribution
          </h4>
          <div className="space-y-2">
            {['easy', 'medium', 'hard'].map((difficulty) => (
              <div key={difficulty} className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
                    {difficulty}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {analytics.difficultyDistribution[`${difficulty}Count` as keyof typeof analytics.difficultyDistribution]} tasks ({analytics.difficultyDistribution[`${difficulty}Percent` as keyof typeof analytics.difficultyDistribution]}%)
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="flex-1 h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${getDifficultyColor(difficulty)}`}
                    style={{ width: `${analytics.difficultyDistribution[`${difficulty}Percent` as keyof typeof analytics.difficultyDistribution]}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Topic Distribution */}
        {analytics.topicDistribution.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Topic Distribution
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {analytics.topicDistribution.map((topic, index) => (
                <div key={topic.topic} className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getTopicColor(index)}`}></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {topic.topic}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {topic.count} tasks ({topic.percent}%)
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${getTopicColor(index)}`}
                      style={{ width: `${topic.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Type Distribution */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Question Type Distribution
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {analytics.typeDistribution.map((type) => (
              <div key={type.type} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
                    {type.type}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {type.count} tasks ({type.percent}%)
                  </span>
                </div>
                {/* Visual bar representation */}
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                  {Array.from({ length: Math.ceil(type.percent / 10) }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 w-full ${i === 0 ? 'rounded-l' : i === Math.ceil(type.percent / 10) - 1 ? 'rounded-r' : 'rounded-r'}`}
                      style={{
                        marginLeft: i === 0 ? '0' : '-2px',
                        width: `${100 / Math.ceil(type.percent / 10)}%`
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
