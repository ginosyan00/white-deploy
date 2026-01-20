import { NextRequest, NextResponse } from "next/server";
import { authenticateToken } from "@/lib/middleware/auth";
import { ordersService } from "@/lib/services/orders.service";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    const data = await req.json();
    const result = await ordersService.checkout(data, user?.id);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("❌ [ORDERS] Checkout error:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      type: error?.type,
      title: error?.title,
      status: error?.status,
      detail: error?.detail,
      code: error?.code,
      meta: error?.meta,
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

