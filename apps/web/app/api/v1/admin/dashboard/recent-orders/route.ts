import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";

/**
 * GET /api/v1/admin/dashboard/recent-orders
 * Get recent orders for admin dashboard
 */
export async function GET(req: NextRequest) {
  try {
    console.log("📋 [RECENT-ORDERS] Request received");
    const user = await authenticateToken(req);
    
    if (!user || !requireAdmin(user)) {
      console.log("❌ [RECENT-ORDERS] Unauthorized or not admin");
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

    // Get limit from query params
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "5", 10);

    console.log(`✅ [RECENT-ORDERS] User authenticated: ${user.id}, limit: ${limit}`);
    const result = await adminService.getRecentOrders(limit);
    console.log("✅ [RECENT-ORDERS] Recent orders retrieved successfully");
    
    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error("❌ [RECENT-ORDERS] Error:", error);
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


