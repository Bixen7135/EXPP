import { NextRequest } from 'next/server';
import { db, userStatistics, eq } from '@expp/db';
import { getUserId } from '@/lib/auth-helpers';
import { buildSuccessResponse, handleApiError } from '@/lib/api-helpers';

/**
 * GET /api/statistics
 * Get current user's statistics
 * Auto-creates default statistics if they don't exist
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();

    // Fetch user statistics
    const [stats] = await db
      .select()
      .from(userStatistics)
      .where(eq(userStatistics.userId, userId))
      .limit(1);

    if (stats) {
      // Return existing statistics
      return buildSuccessResponse({
        userId: stats.userId,
        solvedTasks: stats.solvedTasks,
        totalTaskAttempts: stats.totalTaskAttempts,
        solvedSheets: stats.solvedSheets,
        totalSheetAttempts: stats.totalSheetAttempts,
        successRate: stats.successRate,
        averageScore: stats.averageScore,
        totalTimeSpent: stats.totalTimeSpent,
        tasksByDifficulty: stats.tasksByDifficulty as {
          easy: number;
          medium: number;
          hard: number;
        },
        tasksByTopic: stats.tasksByTopic as Record<string, { correct: number; total: number }>,
        tasksByType: stats.tasksByType as Record<string, { correct: number; total: number }>,
        recentActivity: stats.recentActivity,
        lastActivityAt: stats.lastActivityAt?.toISOString() ?? null,
        createdAt: stats.createdAt.toISOString(),
        updatedAt: stats.updatedAt.toISOString(),
      });
    }

    // Auto-initialize statistics if they don't exist
    const [newStats] = await db
      .insert(userStatistics)
      .values({
        userId,
        solvedTasks: 0,
        totalTaskAttempts: 0,
        solvedSheets: 0,
        totalSheetAttempts: 0,
        successRate: '0',
        averageScore: '0',
        totalTimeSpent: 0,
        tasksByDifficulty: { easy: 0, medium: 0, hard: 0 },
        tasksByTopic: {},
        tasksByType: {},
        recentActivity: 0,
        lastActivityAt: null,
      })
      .returning();

    return buildSuccessResponse({
      userId: newStats.userId,
      solvedTasks: newStats.solvedTasks,
      totalTaskAttempts: newStats.totalTaskAttempts,
      solvedSheets: newStats.solvedSheets,
      totalSheetAttempts: newStats.totalSheetAttempts,
      successRate: newStats.successRate,
      averageScore: newStats.averageScore,
      totalTimeSpent: newStats.totalTimeSpent,
      tasksByDifficulty: newStats.tasksByDifficulty as {
        easy: number;
        medium: number;
        hard: number;
      },
      tasksByTopic: newStats.tasksByTopic as Record<string, { correct: number; total: number }>,
      tasksByType: newStats.tasksByType as Record<string, { correct: number; total: number }>,
      recentActivity: newStats.recentActivity,
      lastActivityAt: newStats.lastActivityAt?.toISOString() ?? null,
      createdAt: newStats.createdAt.toISOString(),
      updatedAt: newStats.updatedAt.toISOString(),
    }, 201);
  } catch (error) {
    return handleApiError(error, 'Failed to fetch user statistics');
  }
}
