import { NextRequest } from 'next/server';
import { db, taskSubmissions, userStatistics, userProgress, eq, sql } from '@expp/db';
import { getUserId } from '@/lib/auth-helpers';
import { buildSuccessResponse, handleApiError } from '@/lib/api-helpers';
import { taskSubmissionSchema } from '@/lib/schemas/submission-schemas';

/**
 * POST /api/submissions/task
 * Submit a task answer and update user statistics
 * Uses transaction to ensure data consistency
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();

    // Validate input
    const validated = taskSubmissionSchema.parse(body);

    // Use transaction for multi-step database writes
    const result = await db.transaction(async (tx) => {
      // 1. Create task submission record
      const [submission] = await tx
        .insert(taskSubmissions)
        .values({
          userId,
          taskId: validated.taskId ?? null,
          sheetId: validated.sheetId ?? null,
          isCorrect: validated.isCorrect,
          score: validated.score.toString(),
          timeSpent: validated.timeSpent,
          userAnswer: validated.userAnswer ?? null,
          userSolution: validated.userSolution ?? null,
          difficulty: validated.difficulty ?? null,
          topic: validated.topic ?? null,
          questionType: validated.questionType ?? null,
        })
        .returning();

      // 2. Update user statistics
      // First, fetch current statistics (or create if doesn't exist)
      const [currentStats] = await tx
        .select()
        .from(userStatistics)
        .where(eq(userStatistics.userId, userId))
        .limit(1);

      if (!currentStats) {
        // Initialize statistics if they don't exist
        await tx.insert(userStatistics).values({
          userId,
          solvedTasks: validated.isCorrect ? 1 : 0,
          totalTaskAttempts: 1,
          solvedSheets: 0,
          totalSheetAttempts: 0,
          successRate: validated.isCorrect ? '100' : '0',
          averageScore: validated.score.toString(),
          totalTimeSpent: validated.timeSpent,
          tasksByDifficulty: {
            easy: validated.difficulty === 'easy' ? 1 : 0,
            medium: validated.difficulty === 'medium' ? 1 : 0,
            hard: validated.difficulty === 'hard' ? 1 : 0,
          },
          tasksByTopic: validated.topic
            ? { [validated.topic]: { correct: validated.isCorrect ? 1 : 0, total: 1 } }
            : {},
          tasksByType: validated.questionType
            ? { [validated.questionType]: { correct: validated.isCorrect ? 1 : 0, total: 1 } }
            : {},
          recentActivity: 1,
          lastActivityAt: new Date(),
        });
      } else {
        // Update existing statistics
        const newTotalAttempts = currentStats.totalTaskAttempts + 1;
        const newSolvedTasks = currentStats.solvedTasks + (validated.isCorrect ? 1 : 0);
        const newTotalTimeSpent = currentStats.totalTimeSpent + validated.timeSpent;

        // Calculate new success rate
        const newSuccessRate = ((newSolvedTasks / newTotalAttempts) * 100).toFixed(2);

        // Calculate new average score
        const currentTotalScore = parseFloat(currentStats.averageScore) * currentStats.totalTaskAttempts;
        const newAverageScore = ((currentTotalScore + validated.score) / newTotalAttempts).toFixed(2);

        // Update tasksByDifficulty
        const tasksByDifficulty = currentStats.tasksByDifficulty as { easy: number; medium: number; hard: number };
        if (validated.difficulty) {
          tasksByDifficulty[validated.difficulty] = (tasksByDifficulty[validated.difficulty] || 0) + 1;
        }

        // Update tasksByTopic
        const tasksByTopic = currentStats.tasksByTopic as Record<string, { correct: number; total: number }>;
        if (validated.topic) {
          if (!tasksByTopic[validated.topic]) {
            tasksByTopic[validated.topic] = { correct: 0, total: 0 };
          }
          tasksByTopic[validated.topic].total += 1;
          if (validated.isCorrect) {
            tasksByTopic[validated.topic].correct += 1;
          }
        }

        // Update tasksByType
        const tasksByType = currentStats.tasksByType as Record<string, { correct: number; total: number }>;
        if (validated.questionType) {
          if (!tasksByType[validated.questionType]) {
            tasksByType[validated.questionType] = { correct: 0, total: 0 };
          }
          tasksByType[validated.questionType].total += 1;
          if (validated.isCorrect) {
            tasksByType[validated.questionType].correct += 1;
          }
        }

        // Perform update
        await tx
          .update(userStatistics)
          .set({
            solvedTasks: newSolvedTasks,
            totalTaskAttempts: newTotalAttempts,
            successRate: newSuccessRate,
            averageScore: newAverageScore,
            totalTimeSpent: newTotalTimeSpent,
            tasksByDifficulty,
            tasksByTopic,
            tasksByType,
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
          tasksCompleted: validated.isCorrect ? 1 : 0,
          sheetsCompleted: 0,
          timeSpent: validated.timeSpent,
          accuracy: validated.isCorrect ? '100.00' : '0.00',
        });
      } else {
        // Update today's progress
        const newTasksCompleted = todayProgress.tasksCompleted + (validated.isCorrect ? 1 : 0);
        const newTimeSpent = todayProgress.timeSpent + validated.timeSpent;

        // Calculate new accuracy (based on correct tasks / total attempts today)
        // We'll increment attempts count and correct count
        const currentCorrectTasks = Math.round(
          (parseFloat(todayProgress.accuracy) / 100) * todayProgress.tasksCompleted
        );
        const newTotalAttempts = todayProgress.tasksCompleted + 1;
        const newCorrectTasks = currentCorrectTasks + (validated.isCorrect ? 1 : 0);
        const newAccuracy = ((newCorrectTasks / newTotalAttempts) * 100).toFixed(2);

        await tx
          .update(userProgress)
          .set({
            tasksCompleted: todayProgress.tasksCompleted + 1,
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
        taskId: result.taskId,
        sheetId: result.sheetId,
        isCorrect: result.isCorrect,
        score: result.score,
        timeSpent: result.timeSpent,
        submittedAt: result.submittedAt.toISOString(),
      },
      201
    );
  } catch (error) {
    return handleApiError(error, 'Failed to submit task');
  }
}
