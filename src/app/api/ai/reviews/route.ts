import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import {
  getPerformanceReviews,
  savePerformanceReview,
} from "@/lib/services/aiInsightsService";
import { PerformanceRating } from "@/lib/types";

const saveReviewSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  period: z.string().min(2, "Review period is required"),
  rating: z.enum([
    "OUTSTANDING",
    "EXCEEDS_EXPECTATIONS",
    "MEETS_EXPECTATIONS",
    "NEEDS_IMPROVEMENT",
  ]),
  summary: z.string().min(10, "Summary must be at least 10 characters"),
  strengths: z.array(z.string()).min(1, "At least one strength is required"),
  growthAreas: z.array(z.string()).min(1, "At least one growth area is required"),
  goals: z.array(z.string()).min(1, "At least one goal is required"),
  metricsScore: z.number().int().min(0).max(100).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ACKNOWLEDGED"]).default("PUBLISHED"),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId") || undefined;

    const reviews = await getPerformanceReviews(auth.session, employeeId);

    return NextResponse.json({
      success: true,
      data: reviews,
    });
  } catch (error: any) {
    console.error("GET /api/ai/reviews error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to retrieve performance reviews",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json().catch(() => ({}));
    const parsed = saveReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Invalid review data",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const saved = await savePerformanceReview(
      {
        ...parsed.data,
        rating: parsed.data.rating as PerformanceRating,
      },
      auth.session
    );

    return NextResponse.json(
      {
        success: true,
        data: saved,
        message: "Performance review saved and published successfully.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/ai/reviews error:", error);
    const status = error.message?.includes("Unauthorized") ? 403 : 500;
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to save performance review",
        code: status === 403 ? "FORBIDDEN" : "INTERNAL_ERROR",
      },
      { status }
    );
  }
}
