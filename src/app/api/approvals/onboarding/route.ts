import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { getPendingOnboardingApprovals } from "@/lib/services/approvalService";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const pendingCandidates = await getPendingOnboardingApprovals(auth.session);

    return NextResponse.json({
      success: true,
      data: pendingCandidates,
      meta: {
        total: pendingCandidates.length,
        reviewerRole: auth.session.role,
      },
    });
  } catch (error: any) {
    console.error("GET /api/approvals/onboarding error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch pending approvals", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
