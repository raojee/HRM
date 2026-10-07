import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { Role, SubscriptionStatus } from "@prisma/client";
import { updateTenantStatus } from "@/lib/services/tenantService";

const statusSchema = z.object({
  status: z.enum(["ACTIVE", "TRIAL", "PAST_DUE", "SUSPENDED", "CANCELLED"]),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const roleCheck = requireRole(auth.session, [Role.SUPER_ADMIN]);
    if (!roleCheck.authorized) return roleCheck.errorResponse;

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Tenant ID is required", code: "MISSING_ID" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = statusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Invalid status",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const updated = await updateTenantStatus(
      id,
      parsed.data.status as SubscriptionStatus,
      auth.session
    );

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Tenant status changed to ${parsed.data.status}.`,
    });
  } catch (error: any) {
    console.error("POST /api/tenants/[id]/status error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update tenant status", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
