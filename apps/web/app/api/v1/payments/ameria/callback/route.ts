import { NextRequest, NextResponse } from "next/server";
import { ameriaPaymentService } from "@/lib/services/payments/ameria-payment.service";

/**
 * POST /api/v1/payments/ameria/callback
 * Handle callback from Ameria Bank (webhook or redirect)
 */
export async function POST(req: NextRequest) {
  try {
    console.log("📞 [AMERIA CALLBACK] Received callback");

    const body = await req.json();
    
    const result = await ameriaPaymentService.handleCallback(body);

    // Return success response
    return NextResponse.json({
      success: result.success,
      orderId: result.orderId,
      paymentId: result.paymentId,
      message: result.message,
    });
  } catch (error: any) {
    console.error("❌ [AMERIA CALLBACK] Error processing callback:", error);
    
    return NextResponse.json(
      {
        type: error.type || "https://api.shop.am/problems/internal-error",
        title: error.title || "Callback Processing Error",
        status: error.status || 500,
        detail: error.detail || error.message || "Failed to process callback",
      },
      { status: error.status || 500 }
    );
  }
}

/**
 * GET /api/v1/payments/ameria/callback
 * Handle redirect callback from Ameria Bank (user returns from payment page)
 * 
 * Callback URL format: {BackURL}?orderID={orderID}&paymentID={paymentID}&resposneCode={code}&currency={currency}&Opaque={opaque}
 * 
 * Note: Parameter name is 'resposneCode' (with typo) as per API documentation
 */
export async function GET(req: NextRequest) {
  try {
    console.log("📞 [AMERIA CALLBACK] Received redirect callback");

    const searchParams = req.nextUrl.searchParams;
    
    // Extract callback parameters according to specification
    // URL parameters: orderID, paymentID, resposneCode (typo!), currency, Opaque
    const orderID = searchParams.get('orderID'); // Bank's order ID (for reference only)
    const paymentID = searchParams.get('paymentID'); // Payment ID (required)
    const resposneCode = searchParams.get('resposneCode'); // Response code (note: typo in API!)
    const currency = searchParams.get('currency'); // Transaction currency
    const opaque = searchParams.get('Opaque'); // Your order ID (required for finding order)

    console.log("📞 [AMERIA CALLBACK] Callback parameters:", {
      orderID,
      paymentID,
      resposneCode,
      currency,
      opaque,
    });

    // Validate required parameters
    const validationErrors: string[] = [];
    
    if (!paymentID || paymentID.trim().length === 0) {
      validationErrors.push('paymentID is required');
    }
    
    if (!opaque || opaque.trim().length === 0) {
      validationErrors.push('Opaque (order ID) is required');
    }

    // Validate paymentID format (should be UUID-like)
    if (paymentID && !/^[0-9A-Fa-f-]{36}$/.test(paymentID)) {
      console.warn("⚠️ [AMERIA CALLBACK] PaymentID format may be invalid:", paymentID);
    }

    if (validationErrors.length > 0) {
      console.error("❌ [AMERIA CALLBACK] Validation errors:", validationErrors);
      return NextResponse.redirect(
        new URL(`/checkout?error=${encodeURIComponent(validationErrors.join(', '))}`, req.url)
      );
    }

    // Map callback parameters to service format
    // Note: We pass both formats for compatibility
    // Convert null to undefined for type compatibility
    const params = {
      PaymentID: paymentID || undefined,
      paymentID: paymentID || undefined,
      OrderID: orderID || undefined,
      orderID: orderID || undefined,
      Opaque: opaque || undefined,
      opaque: opaque || undefined,
      resposneCode: resposneCode || undefined, // Note: typo in API!
      RespCode: resposneCode || undefined, // Also map to RespCode for compatibility
      currency: currency || undefined,
    };

    // CRITICAL: Always verify payment status via GetPaymentDetails API
    // Never trust URL parameters alone - they can be manipulated
    const result = await ameriaPaymentService.handleCallback(params);

    // Redirect user to payment result page (simple true/false display)
    const redirectUrl = `/payment/result?success=${result.success ? 'true' : 'false'}`;

    return NextResponse.redirect(new URL(redirectUrl, req.url));
  } catch (error: any) {
    console.error("❌ [AMERIA CALLBACK] Error processing redirect:", error);
    
    // Redirect to payment result page with false (error = failure)
    const errorUrl = `/payment/result?success=false`;
    return NextResponse.redirect(new URL(errorUrl, req.url));
  }
}

