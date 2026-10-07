import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { getHeadcountAndCompensationForecast } from "@/lib/services/aiInsightsService";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const scenarioParam = (searchParams.get("scenario") || "BASELINE").toUpperCase();

    const validScenarios = ["CONSERVATIVE", "BASELINE", "AGGRESSIVE"] as const;
    const scenario = validScenarios.includes(scenarioParam as any)
      ? (scenarioParam as "CONSERVATIVE" | "BASELINE" | "AGGRESSIVE")
      : "BASELINE";

    const forecast = await getHeadcountAndCompensationForecast(auth.session, scenario);

    return NextResponse.json({
      success: true,
      data: forecast,
    });
  } catch (error: any) {
    console.error("GET /api/ai/forecast error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate workforce forecast",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
