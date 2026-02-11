import { NextRequest } from 'next/server';
import { getUserId, verifyOwnership } from '@/lib/auth-helpers';
import { db, tasks, eq, and, isNull } from '@expp/db';
import { updateTaskSchema } from '@/lib/schemas/task-schemas';
import {
  buildSuccessResponse,
  buildErrorResponse,
  handleApiError,
} from '@/lib/api-helpers';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/tasks/[id]
 * Get a single task by ID
 */
export async function GET(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const userId = await getUserId();
    const { id } = await context.params;

    // Fetch task
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), isNull(tasks.deletedAt)))
      .limit(1);

    if (!task) {
      return buildErrorResponse('Task not found', 404);
    }

    // Verify ownership
    if (task.userId !== userId) {
      return buildErrorResponse('Unauthorized to access this task', 403);
    }

    return buildSuccessResponse({ task });
  } catch (error) {
    return handleApiError(error, 'fetch task');
  }
}

/**
 * PATCH /api/tasks/[id]
 * Update a task
 */
export async function PATCH(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const userId = await getUserId();
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const updates = updateTaskSchema.parse(body);

    // Check if task exists and user owns it
    const [existingTask] = await db
      .select({ userId: tasks.userId })
      .from(tasks)
      .where(and(eq(tasks.id, id), isNull(tasks.deletedAt)))
      .limit(1);

    if (!existingTask) {
      return buildErrorResponse('Task not found', 404);
    }

    if (existingTask.userId !== userId) {
      return buildErrorResponse('Unauthorized to update this task', 403);
    }

    // Update task
    const [updatedTask] = await db
      .update(tasks)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning();

    return buildSuccessResponse({ task: updatedTask });
  } catch (error) {
    return handleApiError(error, 'update task');
  }
}
