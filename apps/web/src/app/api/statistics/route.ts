import { NextRequest } from 'next/server';
import { db, users, profiles, userSettings, userStatistics, eq } from '@expp/db';
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
        successRate: parseFloat(stats.successRate),
        averageScore: parseFloat(stats.averageScore),
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

    // user_statistics.user_id -> profiles.id -> users.id (FK chain).
    // Before inserting stats we must guarantee a profile row exists.
    // Run everything in a transaction so there are no partial states.
    const [newStats] = await db.transaction(async (tx) => {
      // 1. Verify the user actually exists in the users table.
      //    A stale JWT (e.g. after a DB reset) will have a userId that no
      //    longer exists, so bail out early instead of hitting the FK.
      const [dbUser] = await tx
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!dbUser) {
        // Return a sentinel so the caller can respond with 401.
        return [null] as const;
      }

      // 2. Ensure profile row exists (creates it when missing — e.g. OAuth
      //    users whose signIn callback failed, or pre-migration accounts).
      await tx.insert(profiles).values({
        id: userId,
        firstName: (dbUser.name ?? '').split(' ')[0] ?? '',
        lastName: (dbUser.name ?? '').split(' ').slice(1).join(' '),
        avatarUrl: dbUser.image ?? null,
        preferences: {},
        isAdmin: false,
      }).onConflictDoNothing();

      // 3. Ensure user_settings row exists.
      await tx.insert(userSettings).values({
        userId,
        theme: 'light',
        language: 'en',
        notificationsEnabled: true,
        preferences: {},
      }).onConflictDoNothing();

      // 4. Insert statistics (profile is guaranteed to exist now).
      return tx
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
        .onConflictDoNothing()
        .returning();
    });

    // Stale session — user no longer exists in the DB.
    if (newStats === null) {
      return Response.json(
        { success: false, error: 'Session is no longer valid, please sign in again' },
        { status: 401 }
      );
    }

    // If conflict occurred, re-query the existing record
    if (!newStats) {
      const [existingStats] = await db
        .select()
        .from(userStatistics)
        .where(eq(userStatistics.userId, userId))
        .limit(1);

      if (existingStats) {
        return buildSuccessResponse({
          userId: existingStats.userId,
          solvedTasks: existingStats.solvedTasks,
          totalTaskAttempts: existingStats.totalTaskAttempts,
          solvedSheets: existingStats.solvedSheets,
          totalSheetAttempts: existingStats.totalSheetAttempts,
          successRate: parseFloat(existingStats.successRate),
          averageScore: parseFloat(existingStats.averageScore),
          totalTimeSpent: existingStats.totalTimeSpent,
          tasksByDifficulty: existingStats.tasksByDifficulty as {
            easy: number;
            medium: number;
            hard: number;
          },
          tasksByTopic: existingStats.tasksByTopic as Record<string, { correct: number; total: number }>,
          tasksByType: existingStats.tasksByType as Record<string, { correct: number; total: number }>,
          recentActivity: existingStats.recentActivity,
          lastActivityAt: existingStats.lastActivityAt?.toISOString() ?? null,
          createdAt: existingStats.createdAt.toISOString(),
          updatedAt: existingStats.updatedAt.toISOString(),
        });
      }
    }

    return buildSuccessResponse({
      userId: newStats.userId,
      solvedTasks: newStats.solvedTasks,
      totalTaskAttempts: newStats.totalTaskAttempts,
      solvedSheets: newStats.solvedSheets,
      totalSheetAttempts: newStats.totalSheetAttempts,
      successRate: parseFloat(newStats.successRate),
      averageScore: parseFloat(newStats.averageScore),
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
    // Enhanced error handling with specific status codes
    console.error('[API /statistics] Error:', error);

    // Check for database connection errors
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      // Connection refused, timeout, or network errors
      if (
        errorMessage.includes('econnrefused') ||
        errorMessage.includes('enotfound') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('connect')
      ) {
        console.error('[API /statistics] Database connection failed');
        return Response.json(
          {
            success: false,
            error: 'Database temporarily unavailable',
            details: 'Please try again in a moment',
          },
          { status: 503 }
        );
      }

      // Missing table error (PostgreSQL error code 42P01)
      if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
        console.error('[API /statistics] Database schema not initialized - run migrations');
        return Response.json(
          {
            success: false,
            error: 'Database schema not initialized',
            details: 'Server configuration issue - please contact support',
          },
          { status: 503 }
        );
      }
    }

    // Default to handleApiError for other errors
    return handleApiError(error, 'Failed to fetch user statistics');
  }
}
