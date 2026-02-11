import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth-helpers';
import { db, tasks, eq, and, sql, isNull, desc, count, inArray } from '@expp/db';
import {
  bulkTasksSchema,
  deleteTasksSchema,
  listTasksQuerySchema,
} from '@/lib/schemas/task-schemas';
import {
  buildSuccessResponse,
  handleApiError,
  validatePagination,
  buildPaginationMeta,
} from '@/lib/api-helpers';

/**
 * GET /api/tasks
 * List all tasks for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(req.url);

    // Parse and validate query parameters
    const query = listTasksQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      type: searchParams.get('type'),
      topic: searchParams.get('topic'),
      difficulty: searchParams.get('difficulty'),
      includeDeleted: searchParams.get('includeDeleted'),
    });

    const { page, limit, offset } = validatePagination(searchParams, query.limit);

    // Build where conditions
    const conditions = [eq(tasks.userId, userId)];

    if (!query.includeDeleted) {
      conditions.push(isNull(tasks.deletedAt));
    }

    if (query.type) {
      conditions.push(eq(tasks.type, query.type));
    }

    if (query.topic) {
      conditions.push(eq(tasks.topic, query.topic));
    }

    if (query.difficulty) {
      conditions.push(eq(tasks.difficulty, query.difficulty));
    }

    // Fetch tasks with pagination
    const [taskList, totalCountResult] = await Promise.all([
      db
        .select()
        .from(tasks)
        .where(and(...conditions))
        .orderBy(desc(tasks.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(tasks)
        .where(and(...conditions)),
    ]);

    const totalCount = totalCountResult[0]?.count || 0;
    const pagination = buildPaginationMeta(page, limit, Number(totalCount));

    return buildSuccessResponse({ tasks: taskList, pagination });
  } catch (error) {
    return handleApiError(error, 'fetch tasks');
  }
}

/**
 * POST /api/tasks
 * Create or bulk upsert tasks
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await req.json();
    const { tasks: taskInputs } = bulkTasksSchema.parse(body);

    // Prepare task data with user ID
    const taskData = taskInputs.map((task) => ({
      id: task.id,
      userId,
      text: task.text,
      type: task.type,
      topic: task.topic,
      difficulty: task.difficulty,
      answer: task.answer || null,
      solution: task.solution || null,
      explanation: task.explanation || null,
      context: task.context || null,
      instructions: task.instructions || null,
      learningOutcome: task.learningOutcome || null,
      tags: task.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Upsert tasks (insert or update on conflict)
    const insertedTasks = await db
      .insert(tasks)
      .values(taskData)
      .onConflictDoUpdate({
        target: tasks.id,
        set: {
          text: sql`EXCLUDED.text`,
          type: sql`EXCLUDED.type`,
          topic: sql`EXCLUDED.topic`,
          difficulty: sql`EXCLUDED.difficulty`,
          answer: sql`EXCLUDED.answer`,
          solution: sql`EXCLUDED.solution`,
          explanation: sql`EXCLUDED.explanation`,
          context: sql`EXCLUDED.context`,
          instructions: sql`EXCLUDED.instructions`,
          learningOutcome: sql`EXCLUDED.learning_outcome`,
          tags: sql`EXCLUDED.tags`,
          updatedAt: new Date(),
        },
      })
      .returning({ id: tasks.id });

    const taskIds = insertedTasks.map((task) => task.id);

    return buildSuccessResponse({ taskIds, count: taskIds.length }, 201);
  } catch (error) {
    return handleApiError(error, 'save tasks');
  }
}

/**
 * DELETE /api/tasks
 * Soft delete tasks (set deletedAt timestamp)
 */
export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await req.json();
    const { taskIds } = deleteTasksSchema.parse(body);

    // Verify ownership before deleting
    const ownedTasks = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(
        and(
          inArray(tasks.id, taskIds),
          eq(tasks.userId, userId),
          isNull(tasks.deletedAt)
        )
      );

    if (ownedTasks.length === 0) {
      return buildSuccessResponse({ deletedCount: 0, message: 'No tasks found to delete' });
    }

    if (ownedTasks.length !== taskIds.length) {
      const ownedIds = ownedTasks.map((t) => t.id);
      const unauthorizedIds = taskIds.filter((id) => !ownedIds.includes(id));
      return NextResponse.json(
        {
          success: false,
          error: 'Some tasks not found or already deleted',
          details: { unauthorizedIds },
        },
        { status: 403 }
      );
    }

    // Soft delete: Set deletedAt timestamp
    await db
      .update(tasks)
      .set({ deletedAt: new Date() })
      .where(
        and(
          inArray(tasks.id, taskIds),
          eq(tasks.userId, userId),
          isNull(tasks.deletedAt)
        )
      );

    return buildSuccessResponse({ deletedCount: ownedTasks.length });
  } catch (error) {
    return handleApiError(error, 'delete tasks');
  }
}
