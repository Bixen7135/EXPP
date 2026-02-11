import { NextRequest, NextResponse } from 'next/server';
import { db, taskSheets, eq, and } from '@expp/db';
import { getUserId } from '@/lib/auth-helpers';
import { buildSuccessResponse, handleApiError } from '@/lib/api-helpers';
import { updateSheetSchema } from '@/lib/schemas/sheet-schemas';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/sheets/[id]
 * Get a single task sheet by ID
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const userId = await getUserId();
    const { id } = await context.params;

    // Get sheet
    const [sheet] = await db
      .select()
      .from(taskSheets)
      .where(and(eq(taskSheets.id, id), eq(taskSheets.userId, userId)))
      .limit(1);

    if (!sheet) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Sheet not found',
          },
        },
        { status: 404 }
      );
    }

    return buildSuccessResponse({ sheet });
  } catch (error) {
    return handleApiError(error, 'fetch sheet');
  }
}

/**
 * PUT /api/sheets/[id]
 * Update a task sheet
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const userId = await getUserId();
    const { id } = await context.params;
    const body = await request.json();

    // Validate input
    const data = updateSheetSchema.parse(body);

    // Check ownership
    const [existingSheet] = await db
      .select({ id: taskSheets.id })
      .from(taskSheets)
      .where(and(eq(taskSheets.id, id), eq(taskSheets.userId, userId)))
      .limit(1);

    if (!existingSheet) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Sheet not found',
          },
        },
        { status: 404 }
      );
    }

    // Build update object (only include provided fields)
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.tasks !== undefined) updateData.tasks = data.tasks;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.isTemplate !== undefined) updateData.isTemplate = data.isTemplate;

    // Update sheet
    const [updatedSheet] = await db
      .update(taskSheets)
      .set(updateData)
      .where(eq(taskSheets.id, id))
      .returning();

    return buildSuccessResponse({ sheet: updatedSheet });
  } catch (error) {
    return handleApiError(error, 'update sheet');
  }
}

/**
 * DELETE /api/sheets/[id]
 * Delete a single sheet
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const userId = await getUserId();
    const { id } = await context.params;

    // Check ownership
    const [existingSheet] = await db
      .select({ id: taskSheets.id })
      .from(taskSheets)
      .where(and(eq(taskSheets.id, id), eq(taskSheets.userId, userId)))
      .limit(1);

    if (!existingSheet) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Sheet not found',
          },
        },
        { status: 404 }
      );
    }

    // Delete sheet
    await db.delete(taskSheets).where(eq(taskSheets.id, id));

    return buildSuccessResponse({ message: 'Sheet deleted successfully' });
  } catch (error) {
    return handleApiError(error, 'delete sheet');
  }
}
