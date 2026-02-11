import { NextRequest, NextResponse } from 'next/server';
import { db, taskSheets, eq, and } from '@expp/db';
import { getUserId } from '@/lib/auth-helpers';
import { buildSuccessResponse, handleApiError } from '@/lib/api-helpers';
import { copySheetSchema } from '@/lib/schemas/sheet-schemas';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/sheets/[id]/copy
 * Copy a sheet (create a duplicate with optional new title)
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const userId = await getUserId();
    const { id } = await context.params;
    const body = await request.json();

    // Validate input
    const data = copySheetSchema.parse(body);

    // Get the original sheet
    const [originalSheet] = await db
      .select()
      .from(taskSheets)
      .where(and(eq(taskSheets.id, id), eq(taskSheets.userId, userId)))
      .limit(1);

    if (!originalSheet) {
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

    // Create a copy
    const newTitle = data.title || `${originalSheet.title} (Copy)`;

    const [copiedSheet] = await db
      .insert(taskSheets)
      .values({
        userId,
        title: newTitle,
        description: originalSheet.description,
        tasks: originalSheet.tasks,
        tags: originalSheet.tags,
        isTemplate: false, // Copies are never templates by default
      })
      .returning();

    return buildSuccessResponse({ sheet: copiedSheet }, 201);
  } catch (error) {
    return handleApiError(error, 'copy sheet');
  }
}
