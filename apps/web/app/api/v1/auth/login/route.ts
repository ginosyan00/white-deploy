import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/services/auth.service";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const result = await authService.login(data);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ [AUTH] Login error:", error);
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

