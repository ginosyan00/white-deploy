import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";

/**
 * PATCH /api/v1/admin/products/[id]/price
 * Update product variant price(s)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
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

    const { id } = await params;
    const body = await req.json();
    const { price, updateAll, variantId } = body;

    console.log("💰 [ADMIN PRODUCTS] PATCH price request:", { 
      id, 
      price,
      updateAll,
      variantId,
      type: typeof price 
    });

    if (typeof price !== "number" || price < 0) {
      console.error("❌ [ADMIN PRODUCTS] Invalid price:", price);
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "price must be a positive number",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    console.log("💰 [ADMIN PRODUCTS] Calling updateProductPrice:", { id, price, updateAll, variantId });

    const result = await adminService.updateProductPrice(id, price, {
      updateAll: updateAll === true,
      variantId: variantId || undefined,
    });
    
    console.log("✅ [ADMIN PRODUCTS] Product price updated:", { id, result });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ [ADMIN PRODUCTS] PATCH price Error:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
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







