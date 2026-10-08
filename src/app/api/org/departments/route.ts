import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { Role } from "@prisma/client";

const createDepartmentSchema = z.object({
  name: z.string().min(1, "Department name is required"),
  code: z.string().min(1, "Department code is required"),
  branchId: z.string().min(1, "Branch is required"),
  description: z.string().optional(),
  deptAdminEmail: z.string().email().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const targetCompId = (auth.session.role === Role.SUPER_ADMIN && searchParams.get("companyId"))
      ? searchParams.get("companyId")!
      : auth.session.companyId;

    const where: any = { companyId: targetCompId };
    if (branchId) where.branchId = branchId;

    const departments = await prisma.department.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        deptAdmin: {
          select: {
            id: true,
            email: true,
            employee: { select: { firstName: true, lastName: true } },
          },
        },
        _count: {
          select: { teams: true, employees: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: departments });
  } catch (error: any) {
    console.error("GET /api/org/departments error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch departments", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    // Branch Admin or Company Admin can create departments
    const roleCheck = requireRole(auth.session, [Role.COMPANY_ADMIN, Role.BRANCH_ADMIN]);
    if (!roleCheck.authorized) return roleCheck.errorResponse;

    const body = await req.json();
    const parsed = createDepartmentSchema.safeParse(body);

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

    const { name, code, branchId, description, deptAdminEmail } = parsed.data;

    // Verify branch belongs to current tenant
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, companyId: auth.session.companyId },
    });

    if (!branch) {
      return NextResponse.json(
        {
          success: false,
          error: "Branch not found or does not belong to your organization",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    let deptAdminId: string | null = null;
    if (deptAdminEmail) {
      const adminUser = await prisma.user.findFirst({
        where: { email: deptAdminEmail, companyId: auth.session.companyId },
      });
      if (adminUser) deptAdminId = adminUser.id;
    }

    const department = await prisma.department.create({
      data: {
        companyId: auth.session.companyId,
        branchId,
        name,
        code,
        description: description || null,
        deptAdminId,
      },
    });

    return NextResponse.json({ success: true, data: department }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/org/departments error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create department", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
