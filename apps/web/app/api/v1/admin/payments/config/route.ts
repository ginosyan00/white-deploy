import { NextRequest, NextResponse } from "next/server";
import { authenticateToken } from "@/lib/middleware/auth";
import { paymentConfigService } from "@/lib/services/payments/payment-config.service";

/**
 * GET /api/v1/admin/payments/config
 * Get payment configuration
 */
export async function GET(req: NextRequest) {
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

    const config = await paymentConfigService.getConfig();

    return NextResponse.json({ config });
  } catch (error: any) {
    console.error("❌ [ADMIN PAYMENTS] Error getting config:", error);
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

/**
 * POST /api/v1/admin/payments/config
 * Save payment configuration
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

    const data = await req.json();

    // Validate configuration
    const validation = paymentConfigService.validateConfig(data);
    if (!validation.valid) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: validation.errors.join(", "),
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const config = await paymentConfigService.saveConfig(data);

    return NextResponse.json({ config }, { status: 200 });
  } catch (error: any) {
    console.error("❌ [ADMIN PAYMENTS] Error saving config:", error);
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







