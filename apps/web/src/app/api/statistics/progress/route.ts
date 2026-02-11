import { NextRequest } from 'next/server';
import { db, userProgress, eq, gte, and } from '@expp/db';
import { getUserId } from '@/lib/auth-helpers';
import { buildSuccessResponse, handleApiError } from '@/lib/api-helpers';
import { progressQuerySchema } from '@/lib/schemas/statistics-schemas';

/**
 * GET /api/statistics/progress
 * Get user progress data for a date range
 * Query params: days (default: 30)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();

    // Parse and validate query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const { days } = progressQuerySchema.parse(searchParams);

    // Calculate start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateString = startDate.toISOString().split('T')[0]; // YYYY-MM-DD

    // Fetch progress data for the date range
    const progressData = await db
      .select({
        date: userProgress.date,
        tasksCompleted: userProgress.tasksCompleted,
        sheetsCompleted: userProgress.sheetsCompleted,
        timeSpent: userProgress.timeSpent,
        accuracy: userProgress.accuracy,
      })
      .from(userProgress)
      .where(and(
        eq(userProgress.userId, userId),
        gte(userProgress.date, startDateString)
      ))
      .orderBy(userProgress.date);

    // Format response
    const formattedData = progressData.map((item: typeof progressData[number]) => ({
      date: item.date,
      tasksCompleted: item.tasksCompleted,
      sheetsCompleted: item.sheetsCompleted,
      timeSpent: item.timeSpent,
      accuracy: item.accuracy,
    }));

    return buildSuccessResponse(formattedData);
  } catch (error) {
    return handleApiError(error, 'Failed to fetch progress data');
  }
}
