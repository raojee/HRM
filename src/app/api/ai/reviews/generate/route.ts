import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { generatePerformanceReview } from "@/lib/services/aiInsightsService";

const generateSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  period: z.string().default("2026-Q3"),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json().catch(() => ({}));
    const parsed = generateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Invalid input parameters",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const review = await generatePerformanceReview(
      parsed.data.employeeId,
      parsed.data.period,
      auth.session
    );

    return NextResponse.json({
      success: true,
      data: review,
      message: `Successfully synthesized AI performance review for ${review.employeeName}.`,
    });
  } catch (error: any) {
    console.error("POST /api/ai/reviews/generate error:", error);
    const status = error.message?.includes("unauthorized") ? 403 : 500;
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate AI performance review",
        code: status === 403 ? "FORBIDDEN" : "INTERNAL_ERROR",
      },
      { status }
    );
  }
}
