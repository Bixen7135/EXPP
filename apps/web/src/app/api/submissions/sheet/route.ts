import { NextRequest } from 'next/server';
import { db, sheetSubmissions, userStatistics, userProgress, eq, sql } from '@expp/db';
import { getUserId } from '@/lib/auth-helpers';
import { buildSuccessResponse, handleApiError } from '@/lib/api-helpers';
import { sheetSubmissionSchema } from '@/lib/schemas/submission-schemas';

/**
 * POST /api/submissions/sheet
 * Submit a completed sheet and update user statistics
 * Uses transaction to ensure data consistency
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();

    // Validate input
    const validated = sheetSubmissionSchema.parse(body);

    // Calculate accuracy
    const accuracy = ((validated.correctTasks / validated.totalTasks) * 100).toFixed(2);

    // Calculate average time per task if not provided
    const averageTimePerTask = validated.averageTimePerTask
      ? validated.averageTimePerTask.toString()
      : (validated.totalTimeSpent / validated.totalTasks).toFixed(2);

    // Use transaction for multi-step database writes
    const result = await db.transaction(async (tx) => {
      // 1. Create sheet submission record
      const [submission] = await tx
        .insert(sheetSubmissions)
        .values({
          userId,
          sheetId: validated.sheetId,
          totalTasks: validated.totalTasks,
          correctTasks: validated.correctTasks,
          accuracy,
          totalTimeSpent: validated.totalTimeSpent,
          averageTimePerTask,
        })
        .returning();

      // 2. Update user statistics
      // First, fetch current statistics (or create if doesn't exist)
      const [currentStats] = await tx
        .select()
        .from(userStatistics)
        .where(eq(userStatistics.userId, userId))
        .limit(1);

      // Consider a sheet "solved" if accuracy >= 70%
      const sheetSolved = parseFloat(accuracy) >= 70;

      if (!currentStats) {
        // Initialize statistics if they don't exist
        await tx.insert(userStatistics).values({
          userId,
          solvedTasks: 0,
          totalTaskAttempts: 0,
          solvedSheets: sheetSolved ? 1 : 0,
          totalSheetAttempts: 1,
          successRate: sheetSolved ? '100' : '0',
          averageScore: accuracy,
          totalTimeSpent: validated.totalTimeSpent,
          tasksByDifficulty: { easy: 0, medium: 0, hard: 0 },
          tasksByTopic: {},
          tasksByType: {},
          recentActivity: 1,
          lastActivityAt: new Date(),
        });
      } else {
        // Update existing statistics
        const newTotalSheetAttempts = currentStats.totalSheetAttempts + 1;
        const newSolvedSheets = currentStats.solvedSheets + (sheetSolved ? 1 : 0);
        const newTotalTimeSpent = currentStats.totalTimeSpent + validated.totalTimeSpent;

        // Calculate new success rate (based on both tasks and sheets)
        const totalAttempts = currentStats.totalTaskAttempts + currentStats.totalSheetAttempts + 1;
        const totalSolved = currentStats.solvedTasks + newSolvedSheets;
        const newSuccessRate = totalAttempts > 0
          ? ((totalSolved / totalAttempts) * 100).toFixed(2)
          : '0';

        // Calculate new average score (weighted by attempts)
        const currentTotalAttempts = currentStats.totalTaskAttempts + currentStats.totalSheetAttempts;
        const currentTotalScore = parseFloat(currentStats.averageScore) * currentTotalAttempts;
        const newAverageScore = currentTotalAttempts > 0
          ? ((currentTotalScore + parseFloat(accuracy)) / (currentTotalAttempts + 1)).toFixed(2)
          : accuracy;

        // Perform update
        await tx
          .update(userStatistics)
          .set({
            solvedSheets: newSolvedSheets,
            totalSheetAttempts: newTotalSheetAttempts,
            successRate: newSuccessRate,
            averageScore: newAverageScore,
            totalTimeSpent: newTotalTimeSpent,
            recentActivity: sql`${userStatistics.recentActivity} + 1`,
            lastActivityAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(userStatistics.userId, userId));
      }

      // 3. Update user_progress for today
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      // Try to fetch today's progress
      const [todayProgress] = await tx
        .select()
        .from(userProgress)
        .where(
          sql`${userProgress.userId} = ${userId} AND ${userProgress.date} = ${today}`
        )
        .limit(1);

      if (!todayProgress) {
        // Create today's progress entry
        await tx.insert(userProgress).values({
          userId,
          date: today,
          tasksCompleted: 0,
          sheetsCompleted: 1,
          timeSpent: validated.totalTimeSpent,
          accuracy,
        });
      } else {
        // Update today's progress
        const newSheetsCompleted = todayProgress.sheetsCompleted + 1;
        const newTimeSpent = todayProgress.timeSpent + validated.totalTimeSpent;

        // Calculate new weighted accuracy (combining previous accuracy with new sheet accuracy)
        const previousTotalAttempts = todayProgress.tasksCompleted + todayProgress.sheetsCompleted;
        const previousTotalAccuracy = parseFloat(todayProgress.accuracy) * previousTotalAttempts;
        const newTotalAttempts = previousTotalAttempts + 1;
        const newAccuracy = ((previousTotalAccuracy + parseFloat(accuracy)) / newTotalAttempts).toFixed(2);

        await tx
          .update(userProgress)
          .set({
            sheetsCompleted: newSheetsCompleted,
            timeSpent: newTimeSpent,
            accuracy: newAccuracy,
          })
          .where(
            sql`${userProgress.userId} = ${userId} AND ${userProgress.date} = ${today}`
          );
      }

      return submission;
    });

    return buildSuccessResponse(
      {
        id: result.id,
        sheetId: result.sheetId,
        totalTasks: result.totalTasks,
        correctTasks: result.correctTasks,
        accuracy: result.accuracy,
        totalTimeSpent: result.totalTimeSpent,
        averageTimePerTask: result.averageTimePerTask,
        submittedAt: result.submittedAt.toISOString(),
      },
      201
    );
  } catch (error) {
    return handleApiError(error, 'Failed to submit sheet');
  }
}
