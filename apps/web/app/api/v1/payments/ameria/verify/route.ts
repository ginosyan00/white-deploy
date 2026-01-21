import { NextRequest, NextResponse } from "next/server";
import { authenticateToken } from "@/lib/middleware/auth";
import { ameriaPaymentService } from "@/lib/services/payments/ameria-payment.service";

/**
 * POST /api/v1/payments/ameria/verify
 * Verify payment status by PaymentID
 */
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    
    // Allow both authenticated users and server-to-server calls
    // For server calls, check if it's coming from our own system
    
    const body = await req.json();
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "PaymentID is required",
        },
        { status: 400 }
      );
    }

    const result = await ameriaPaymentService.verifyPayment(paymentId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ [AMERIA VERIFY] Error verifying payment:", error);
    
    return NextResponse.json(
      {
        type: error.type || "https://api.shop.am/problems/internal-error",
        title: error.title || "Verification Error",
        status: error.status || 500,
        detail: error.detail || error.message || "Failed to verify payment",
      },
      { status: error.status || 500 }
    );
  }
}





