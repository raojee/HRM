import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { processLeaveAction } from "@/lib/services/approvalService";
import { Role } from "@prisma/client";

const leaveActionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  comments: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    // Reviewers: Department Admin, Branch Admin, Company Admin, Super Admin
    const roleCheck = requireRole(auth.session, [
      Role.DEPARTMENT_ADMIN,
      Role.BRANCH_ADMIN,
      Role.COMPANY_ADMIN,
      Role.SUPER_ADMIN,
    ]);
    if (!roleCheck.authorized) return roleCheck.errorResponse;

    const { id: leaveRequestId } = await params;
    const body = await req.json();
    const parsed = leaveActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Invalid leave action",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const updated = await processLeaveAction({
      leaveRequestId,
      action: parsed.data.action,
      reviewer: auth.session,
      comments: parsed.data.comments,
    });

    return NextResponse.json({
      success: true,
      message: `Leave request ${parsed.data.action.toLowerCase()}d successfully.`,
      data: updated,
    });
  } catch (error: any) {
    console.error("POST /api/approvals/leaves/[id]/action error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process leave approval",
        code: "WORKFLOW_ERROR",
      },
      { status: 400 }
    );
  }
}
