import { NextRequest, NextResponse } from "next/server";
import { authenticateToken } from "@/lib/middleware/auth";
import { usersService } from "@/lib/services/users.service";

/**
 * GET /api/v1/users/dashboard
 * Get user dashboard statistics and recent orders
 */
export async function GET(req: NextRequest) {
  try {
    console.log("📊 [DASHBOARD] Request received");
    const user = await authenticateToken(req);
    
    if (!user) {
      console.log("❌ [DASHBOARD] Unauthorized");
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

    console.log(`✅ [DASHBOARD] User authenticated: ${user.id}`);
    const result = await usersService.getDashboard(user.id);
    console.log("✅ [DASHBOARD] Dashboard data retrieved successfully");
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ [DASHBOARD] Error:", error);
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


