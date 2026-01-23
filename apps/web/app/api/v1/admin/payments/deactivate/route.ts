import { NextRequest, NextResponse } from "next/server";
import { authenticateToken } from "@/lib/middleware/auth";
import { paymentConfigService } from "@/lib/services/payments/payment-config.service";

/**
 * POST /api/v1/admin/payments/deactivate
 * Deactivate payment system
 */
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    
    if (!user || !user.roles?.includes("admin")) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/unauthorized",
          title: "Unauthorized",
          status: 401,
          detail: "Admin access required",
        },
        { status: 401 }
      );
    }

    await paymentConfigService.deactivate();

    return NextResponse.json({
      success: true,
      message: "Payment system deactivated successfully",
    });
  } catch (error: any) {
    console.error("❌ [ADMIN PAYMENTS] Error deactivating:", error);
    return NextResponse.json(
      {
        type: error.type || "https://api.shop.am/problems/internal-error",
        title: error.title || "Internal Server Error",
        status: error.status || 500,
        detail: error.detail || error.message || "An error occurred",
      },
      { status: error.status || 500 }
    );
  }
}







