import { auth } from "@/lib/auth";
import { db, users, profiles, userSettings, userStatistics, eq } from "@expp/db";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

/**
 * Get the current session (server-side)
 */
export async function getSession() {
  return await auth();
}

/**
 * Get the current user from session (server-side)
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

/**
 * Require authentication - redirect to sign in if not authenticated
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  return session;
}

/**
 * Get user ID for API routes - throws error (not redirect) if not authenticated
 */
export async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("User is not authenticated");
  }
  return session.user.id;
}

/**
 * Register a new user with email and password
 */
export async function registerUser(data: {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
}) {
  // Check if user already exists
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash password outside the transaction (CPU-bound, no DB rollback needed)
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Wrap all inserts in a transaction so a partial failure leaves no orphaned rows
  return await db.transaction(async (tx) => {
    const [newUser] = await tx
      .insert(users)
      .values({
        email: data.email,
        password: hashedPassword,
        name: `${data.firstName} ${data.lastName || ""}`.trim(),
        emailVerified: null,
        image: null,
      })
      .returning();

    await tx.insert(profiles).values({
      id: newUser.id,
      firstName: data.firstName,
      lastName: data.lastName || "",
      avatarUrl: null,
      preferences: {},
      isAdmin: false,
    });

    await tx.insert(userSettings).values({
      userId: newUser.id,
      theme: "light",
      language: "en",
      notificationsEnabled: true,
      preferences: {},
    });

    await tx.insert(userStatistics).values({
      userId: newUser.id,
      solvedTasks: 0,
      totalTaskAttempts: 0,
      solvedSheets: 0,
      totalSheetAttempts: 0,
      successRate: "0",
      averageScore: "0",
      totalTimeSpent: 0,
      tasksByDifficulty: { easy: 0, medium: 0, hard: 0 },
      tasksByTopic: {},
      tasksByType: {},
      recentActivity: 0,
      lastActivityAt: new Date(),
    });

    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    };
  });
}

/**
 * Change user password
 */
export async function changePassword(data: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}) {
  // Get user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, data.userId))
    .limit(1);

  if (!user || !user.password) {
    throw new Error("User not found or password not set");
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(data.currentPassword, user.password);

  if (!isValidPassword) {
    throw new Error("Current password is incorrect");
  }

  // Validate new password
  if (data.newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters long");
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(data.newPassword, 10);

  // Update password
  await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, data.userId));

  return { success: true };
}

/**
 * Get user profile data
 */
export async function getUserProfile(userId: string) {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  return profile;
}

/**
 * Verify user owns a resource
 */
export async function verifyOwnership(userId: string, resourceUserId: string) {
  if (userId !== resourceUserId) {
    throw new Error("Unauthorized: You do not own this resource");
  }
}
