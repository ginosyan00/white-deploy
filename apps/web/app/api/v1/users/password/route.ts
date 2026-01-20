import { NextRequest, NextResponse } from "next/server";
import { authenticateToken } from "@/lib/middleware/auth";
import { usersService } from "@/lib/services/users.service";

export async function PUT(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/unauthorized",
          title: "Unauthorized",
          status: 401,
          detail: "Authentication token required",
          instance: req.url,
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    // Support both 'oldPassword' and 'currentPassword' field names
    const oldPassword = body.oldPassword || body.currentPassword;
    const { newPassword } = body;

    // Validate required fields
    if (!oldPassword || typeof oldPassword !== 'string' || oldPassword.trim() === '') {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Current password (oldPassword or currentPassword) is required",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim() === '') {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "New password is required",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    // Validate password length
    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "New password must be at least 6 characters long",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    const result = await usersService.changePassword(user.id, oldPassword.trim(), newPassword.trim());
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ [USERS] Password change error:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      type: error?.type,
      title: error?.title,
      status: error?.status,
      detail: error?.detail,
      fullError: error,
    });
    return NextResponse.json(
      {
        type: error.type || "https://api.shop.am/problems/internal-error",
        title: error.title || "Internal Server Error",
        status: error.status || 500,
        detail: error.detail || error.message || "An error occurred",
        instance: req.url,
      },
      { status: error.status || 500 }
    );
  }
}

