import { NextRequest } from 'next/server';
import { db, userSettings, eq } from '@expp/db';
import { getUserId } from '@/lib/auth-helpers';
import { buildSuccessResponse, handleApiError } from '@/lib/api-helpers';
import { updateSettingsSchema } from '@/lib/schemas/settings-schemas';

/**
 * GET /api/settings
 * Get current user's settings, create default settings if they don't exist
 */
export async function GET() {
  try {
    const userId = await getUserId();

    // Try to fetch existing settings
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    // If settings don't exist, create default settings
    if (!settings) {
      const [newSettings] = await db
        .insert(userSettings)
        .values({
          userId,
          theme: 'light',
          language: 'en',
          notificationsEnabled: true,
          preferences: {},
        })
        .returning();

      return buildSuccessResponse(newSettings);
    }

    return buildSuccessResponse(settings);
  } catch (error) {
    return handleApiError(error, 'settings:get');
  }
}

/**
 * PUT /api/settings
 * Update current user's settings
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();

    // Validate request body
    const updates = updateSettingsSchema.parse(body);

    // Update settings
    const [updatedSettings] = await db
      .update(userSettings)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, userId))
      .returning();

    if (!updatedSettings) {
      return buildSuccessResponse(
        { error: 'Settings not found. Please fetch settings first to initialize.' },
        404
      );
    }

    return buildSuccessResponse(updatedSettings);
  } catch (error) {
    return handleApiError(error, 'settings:update');
  }
}
