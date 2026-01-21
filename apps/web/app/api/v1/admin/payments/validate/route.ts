import { NextRequest, NextResponse } from "next/server";
import { authenticateToken } from "@/lib/middleware/auth";
import { paymentConfigService } from "@/lib/services/payments/payment-config.service";
import { AmeriaClient } from "@/lib/services/payments/ameria-client";

/**
 * POST /api/v1/admin/payments/validate
 * Validate payment configuration and activate if successful
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

    const config = await paymentConfigService.getConfig();

    if (!config) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Configuration Missing",
          status: 400,
          detail: "Payment configuration not found. Please save configuration first.",
        },
        { status: 400 }
      );
    }

    // Create client and test connection
    const client = new AmeriaClient({
      clientId: config.clientId,
      username: config.username,
      password: config.password,
      testMode: config.testMode,
      returnUrl: config.returnUrl,
      callbackUrl: config.callbackUrl,
    });

    const testResult = await client.testConnection();

    if (testResult.success) {
      // Activate payment system
      const activatedConfig = await paymentConfigService.saveConfig({
        ...config,
        isActive: true,
        lastValidatedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: testResult.message,
        config: activatedConfig,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: testResult.message,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("❌ [ADMIN PAYMENTS] Error validating:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.detail || error.message || "Validation failed",
      },
      { status: error.status || 500 }
    );
  }
}





