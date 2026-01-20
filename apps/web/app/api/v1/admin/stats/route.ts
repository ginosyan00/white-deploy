import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";

/**
 * Force dynamic rendering for this route
 * Prevents Next.js from statically generating this route
 */
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/stats
 * Get admin statistics (users count, etc.)
 */
export async function GET(req: NextRequest) {
  try {
    console.log("📊 [ADMIN STATS] Request received:", { url: req.url });
    const user = await authenticateToken(req);
    
    if (!user || !requireAdmin(user)) {
      console.log("❌ [ADMIN STATS] Unauthorized or not admin");
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/forbidden",
          title: "Forbidden",
          status: 403,
          detail: "Admin access required",
          instance: req.url,
        },
        { status: 403 }
      );
    }

    console.log(`✅ [ADMIN STATS] User authenticated: ${user.id}`);
    const result = await adminService.getStats();
    console.log("✅ [ADMIN STATS] Stats data retrieved successfully");
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ [ADMIN STATS] Error:", {
      message: error.message,
      stack: error.stack,
      type: error.type,
      status: error.status,
      detail: error.detail,
      url: req.url,
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

