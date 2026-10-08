import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { Role } from "@prisma/client";

const updateBranchSchema = z.object({
  name: z.string().min(1, "Branch name is required").optional(),
  code: z.string().min(1, "Branch code is required").optional(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  timezone: z.string().optional(),
  adminName: z.string().optional().nullable(),
  branchAdminEmail: z.string().email().optional().nullable(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;

    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true } },
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
    });

    if (!branch) {
      return NextResponse.json(
        { success: false, error: "Branch not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (auth.session.role !== Role.SUPER_ADMIN && branch.companyId !== auth.session.companyId) {
      return NextResponse.json(
        { success: false, error: "Access denied to branch", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: branch });
  } catch (error: any) {
    console.error("GET /api/org/branches/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch branch", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    // Only Company Admin or Super Admin can edit branches
    const roleCheck = requireRole(auth.session, [Role.COMPANY_ADMIN]);
    if (!roleCheck.authorized) return roleCheck.errorResponse;

    const { id } = await params;

    const existingBranch = await prisma.branch.findUnique({
      where: { id },
    });

    if (!existingBranch) {
      return NextResponse.json(
        { success: false, error: "Branch not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (auth.session.role !== Role.SUPER_ADMIN && existingBranch.companyId !== auth.session.companyId) {
      return NextResponse.json(
        { success: false, error: "Access denied: branch belongs to another organization", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = updateBranchSchema.safeParse(body);

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

    const { name, code, city, country, timezone, adminName, branchAdminEmail } = parsed.data;

    // Check code collision if code changed
    if (code && code.toUpperCase() !== existingBranch.code) {
      const codeTaken = await prisma.branch.findFirst({
        where: {
          companyId: existingBranch.companyId,
          code: code.toUpperCase(),
          NOT: { id: existingBranch.id },
        },
      });
      if (codeTaken) {
        return NextResponse.json(
          {
            success: false,
            error: `Branch code "${code.toUpperCase()}" is already in use by another branch in this company.`,
            code: "DUPLICATE_CODE",
          },
          { status: 409 }
        );
      }
    }

    let branchAdminId = existingBranch.branchAdminId;
    if (branchAdminEmail !== undefined) {
      if (branchAdminEmail) {
        const adminUser = await prisma.user.findFirst({
          where: { email: branchAdminEmail, companyId: existingBranch.companyId },
        });
        branchAdminId = adminUser ? adminUser.id : null;
      } else {
        branchAdminId = null;
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code.toUpperCase();
    if (city !== undefined) updateData.city = city;
    if (country !== undefined) updateData.country = country;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (adminName !== undefined) updateData.adminName = adminName;
    if (branchAdminEmail !== undefined) updateData.branchAdminId = branchAdminId;

    const updated = await prisma.branch.update({
      where: { id },
      data: updateData,
      include: {
        company: { select: { id: true, name: true } },
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
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PATCH /api/org/branches/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update branch", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const roleCheck = requireRole(auth.session, [Role.COMPANY_ADMIN]);
    if (!roleCheck.authorized) return roleCheck.errorResponse;

    const { id } = await params;

    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        _count: { select: { employees: true, departments: true } },
      },
    });

    if (!branch) {
      return NextResponse.json(
        { success: false, error: "Branch not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (auth.session.role !== Role.SUPER_ADMIN && branch.companyId !== auth.session.companyId) {
      return NextResponse.json(
        { success: false, error: "Access denied", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    if (branch._count.employees > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete branch with ${branch._count.employees} active assigned employee(s). Please reassign personnel first.`,
          code: "BRANCH_NOT_EMPTY",
        },
        { status: 400 }
      );
    }

    await prisma.branch.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Branch deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/org/branches/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete branch", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
