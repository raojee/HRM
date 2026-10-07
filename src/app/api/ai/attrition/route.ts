import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { getAttritionOverview } from "@/lib/services/aiInsightsService";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const overview = await getAttritionOverview(auth.session);

    return NextResponse.json({
      success: true,
      data: overview,
    });
  } catch (error: any) {
    console.error("GET /api/ai/attrition error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to retrieve attrition insights",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
