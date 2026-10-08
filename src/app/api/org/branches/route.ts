import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { Role } from "@prisma/client";
import { checkBranchLimit } from "@/lib/services/tenantService";

const createBranchSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
  code: z.string().min(1, "Branch code is required"),
  city: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().default("UTC"),
  branchAdminEmail: z.string().email().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const targetCompId = (auth.session.role === Role.SUPER_ADMIN && searchParams.get("companyId"))
      ? searchParams.get("companyId")!
      : auth.session.companyId;

    const branches = await prisma.branch.findMany({
      where: { companyId: targetCompId },
      include: {
        company: {
          select: { id: true, name: true },
        },
        branchAdmin: {
          select: {
            id: true,
            email: true,
            employee: { select: { firstName: true, lastName: true } },
          },
        },
        _count: {
          select: { departments: true, employees: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: branches,
    });
  } catch (error: any) {
    console.error("GET /api/org/branches error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch branches", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    // Only Company Admin or Super Admin can create new branches
    const roleCheck = requireRole(auth.session, [Role.COMPANY_ADMIN]);
    if (!roleCheck.authorized) return roleCheck.errorResponse;

    const body = await req.json();
    const parsed = createBranchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Validation failed",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const { name, code, city, country, timezone, branchAdminEmail } = parsed.data;

    // Enforce branch quota by tier
    const branchCheck = await checkBranchLimit(auth.session.companyId);
    if (!branchCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Subscription branch limit reached: Your organization has used all ${branchCheck.currentCount} of ${branchCheck.maxBranches} allowed branches on the ${branchCheck.tier} plan. Please upgrade your plan in Billing & Subscriptions to establish new branch locations.`,
          code: "BRANCH_LIMIT_EXCEEDED",
        },
        { status: 403 }
      );
    }

    let branchAdminId: string | null = null;
    if (branchAdminEmail) {
      const adminUser = await prisma.user.findUnique({
        where: { email: branchAdminEmail },
      });
      if (adminUser) branchAdminId = adminUser.id;
    }

    const branch = await prisma.branch.create({
      data: {
        companyId: auth.session.companyId,
        name,
        code,
        city: city || null,
        country: country || null,
        timezone,
        branchAdminId,
      },
    });

    return NextResponse.json({ success: true, data: branch }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/org/branches error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create branch", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
