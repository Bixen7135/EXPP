import { NextRequest, NextResponse } from 'next/server';
import { db, taskSheets, sharedSheets, profiles, eq, and } from '@expp/db';
import { getUserId } from '@/lib/auth-helpers';
import { buildSuccessResponse, handleApiError } from '@/lib/api-helpers';
import { shareSheetSchema } from '@/lib/schemas/sheet-schemas';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/sheets/[id]/share
 * Share a sheet with another user
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
    const { recipientId } = shareSheetSchema.parse(body);

    // Cannot share with yourself
    if (recipientId === userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Cannot share with yourself',
          },
        },
        { status: 400 }
      );
    }

    // Check if sheet exists and user owns it
    const [sheet] = await db
      .select({ id: taskSheets.id })
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

    // Check if recipient exists
    const [recipient] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.id, recipientId))
      .limit(1);

    if (!recipient) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Recipient user not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if already shared
    const [existingShare] = await db
      .select({ id: sharedSheets.id })
      .from(sharedSheets)
      .where(
        and(
          eq(sharedSheets.sheetId, id),
          eq(sharedSheets.ownerId, userId),
          eq(sharedSheets.recipientId, recipientId)
        )
      )
      .limit(1);

    if (existingShare) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'Sheet already shared with this user',
          },
        },
        { status: 409 }
      );
    }

    // Create shared sheet entry
    const [sharedSheet] = await db
      .insert(sharedSheets)
      .values({
        sheetId: id,
        ownerId: userId,
        recipientId,
      })
      .returning();

    return buildSuccessResponse(
      {
        sharedSheet,
        message: 'Sheet shared successfully',
      },
      201
    );
  } catch (error) {
    return handleApiError(error, 'share sheet');
  }
}
