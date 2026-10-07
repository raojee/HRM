import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { Role, SubscriptionTier } from "@prisma/client";
import { getAllTenants, createTenant } from "@/lib/services/tenantService";

const createTenantSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  legalName: z.string().optional(),
  subdomain: z.string().min(2, "Subdomain must be at least 2 characters"),
  currency: z.string().default("USD"),
  timezone: z.string().default("America/New_York"),
  adminName: z.string().min(2, "Primary Administrator name is required"),
  adminEmail: z.string().email("Valid admin email address is required"),
  adminPassword: z.string().min(6, "Password must be at least 6 characters").optional(),
  branchName: z.string().optional(),
  branchCode: z.string().optional(),
  plan: z.enum(["STARTER", "GROWTH", "ENTERPRISE"]).default("GROWTH"),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    // Platform SaaS tenant directory is strictly for Super Admins
    const roleCheck = requireRole(auth.session, [Role.SUPER_ADMIN]);
    if (!roleCheck.authorized) return roleCheck.errorResponse;

    const tenants = await getAllTenants(auth.session);

    return NextResponse.json({
      success: true,
      data: tenants,
    });
  } catch (error: any) {
    console.error("GET /api/tenants error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve tenants list", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    // Only Super Admin can provision new SaaS tenant organizations
    const roleCheck = requireRole(auth.session, [Role.SUPER_ADMIN]);
    if (!roleCheck.authorized) return roleCheck.errorResponse;

    const body = await req.json().catch(() => ({}));
    const parsed = createTenantSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Invalid tenant input parameters",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const tenant = await createTenant(
      {
        ...parsed.data,
        plan: parsed.data.plan as SubscriptionTier,
      },
      auth.session
    );

    return NextResponse.json(
      {
        success: true,
        data: tenant,
        message: `Successfully provisioned ${tenant.name} (${tenant.subdomain}.digisailhrm.com) on the ${tenant.plan} plan.`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/tenants error:", error);
    const isConflict = error.message?.includes("already registered") || error.message?.includes("already exists");
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to provision tenant",
        code: isConflict ? "CONFLICT" : "INTERNAL_ERROR",
      },
      { status: isConflict ? 409 : 500 }
    );
  }
}
