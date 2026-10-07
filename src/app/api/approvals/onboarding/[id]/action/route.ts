import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { processOnboardingAction } from "@/lib/services/approvalService";
import { ApprovalAction } from "@prisma/client";

const actionSchema = z.object({
  action: z.nativeEnum(ApprovalAction),
  comments: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const { id: employeeId } = await params;
    const body = await req.json();
    const parsed = actionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Invalid approval action",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const result = await processOnboardingAction({
      employeeId,
      action: parsed.data.action,
      reviewer: auth.session,
      comments: parsed.data.comments,
    });

    return NextResponse.json({
      success: true,
      message: `Candidate ${parsed.data.action.toLowerCase()}d successfully. Current stage: ${result.stage}`,
      data: result,
    });
  } catch (error: any) {
    console.error("POST /api/approvals/onboarding/[id]/action error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process onboarding approval action",
        code: "WORKFLOW_ERROR",
      },
      { status: 400 }
    );
  }
}
