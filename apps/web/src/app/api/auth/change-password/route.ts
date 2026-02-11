import { NextRequest, NextResponse } from "next/server";
import { changePassword, getUserId } from "@/lib/auth-helpers";
import { z } from "zod";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    // Require authentication
    const userId = await getUserId();

    const body = await req.json();
    const data = changePasswordSchema.parse(body);

    await changePassword({
      userId,
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to change password" },
      { status: 500 }
    );
  }
}
