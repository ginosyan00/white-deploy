import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";

/**
 * PATCH /api/v1/admin/products/[id]/discount
 * Update product discount percentage
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
    const discountPercent = body.discountPercent;

    console.log("💰 [ADMIN PRODUCTS] PATCH discount request:", { 
      id, 
      body, 
      discountPercent, 
      type: typeof discountPercent 
    });

    if (typeof discountPercent !== "number" || discountPercent < 0 || discountPercent > 100) {
      console.error("❌ [ADMIN PRODUCTS] Invalid discountPercent:", discountPercent);
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "discountPercent must be a number between 0 and 100",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    console.log("💰 [ADMIN PRODUCTS] Calling updateProductDiscount:", { id, discountPercent });

    const result = await adminService.updateProductDiscount(id, discountPercent);
    console.log("✅ [ADMIN PRODUCTS] Product discount updated:", { id, result });

    return NextResponse.json({ success: true, discountPercent: result.discountPercent });
  } catch (error: any) {
    console.error("❌ [ADMIN PRODUCTS] PATCH discount Error:", error);
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

