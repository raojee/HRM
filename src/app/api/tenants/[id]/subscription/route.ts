import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { SubscriptionTier } from "@prisma/client";
import {
  getTenantSubscription,
  updateTenantSubscription,
} from "@/lib/services/tenantService";

const updateSubscriptionSchema = z.object({
  tier: z.enum(["STARTER", "GROWTH", "ENTERPRISE"]),
  customMaxSeats: z.number().int().positive().optional(),
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Tenant ID is required", code: "MISSING_ID" },
        { status: 400 }
      );
    }

    const subscriptionDetails = await getTenantSubscription(id, auth.session);

    return NextResponse.json({
      success: true,
      data: subscriptionDetails,
    });
  } catch (error: any) {
    console.error("GET /api/tenants/[id]/subscription error:", error);
    const message = error.message || "Failed to retrieve subscription details";
    const status = message.includes("Unauthorized") ? 403 : message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { success: false, error: message, code: status === 403 ? "FORBIDDEN" : "INTERNAL_ERROR" },
      { status }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Tenant ID is required", code: "MISSING_ID" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = updateSubscriptionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Invalid subscription upgrade data",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const updated = await updateTenantSubscription(
      id,
      parsed.data.tier as SubscriptionTier,
      auth.session,
      parsed.data.customMaxSeats
    );

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Successfully switched to ${parsed.data.tier} plan. Seat ceiling elevated immediately.`,
    });
  } catch (error: any) {
    console.error("POST /api/tenants/[id]/subscription error:", error);
    const message = error.message || "Failed to modify subscription";
    const status = message.includes("Unauthorized") ? 403 : 500;
    return NextResponse.json(
      { success: false, error: message, code: status === 403 ? "FORBIDDEN" : "INTERNAL_ERROR" },
      { status }
    );
  }
}
