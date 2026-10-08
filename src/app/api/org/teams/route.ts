import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { Role } from "@prisma/client";

const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  code: z.string().min(1, "Team code is required"),
  departmentId: z.string().min(1, "Department is required"),
  description: z.string().optional(),
  leadName: z.string().optional(),
  teamLeadEmail: z.string().email().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");
    const targetCompId = (auth.session.role === Role.SUPER_ADMIN && searchParams.get("companyId"))
      ? searchParams.get("companyId")!
      : auth.session.companyId;

    const where: any = {};
    if (departmentId) {
      where.departmentId = departmentId;
    } else {
      where.department = { companyId: targetCompId };
    }

    const teams = await prisma.team.findMany({
      where,
      include: {
        department: { select: { id: true, name: true, code: true } },
        teamLead: {
          select: {
            id: true,
            email: true,
            employee: { select: { firstName: true, lastName: true } },
          },
        },
        _count: { select: { employees: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: teams });
  } catch (error: any) {
    console.error("GET /api/org/teams error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch teams", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const roleCheck = requireRole(auth.session, [
      Role.COMPANY_ADMIN,
      Role.BRANCH_ADMIN,
      Role.DEPARTMENT_ADMIN,
    ]);
    if (!roleCheck.authorized) return roleCheck.errorResponse;

    const body = await req.json();
    const parsed = createTeamSchema.safeParse(body);

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

    const { name, code, departmentId, description, leadName, teamLeadEmail } = parsed.data;

    // Verify department belongs to current tenant (or any tenant if SUPER_ADMIN)
    const deptWhere: any = { id: departmentId };
    if (auth.session.role !== Role.SUPER_ADMIN) {
      deptWhere.companyId = auth.session.companyId;
    }
    const department = await prisma.department.findFirst({
      where: deptWhere,
    });

    if (!department) {
      return NextResponse.json(
        {
          success: false,
          error: "Department not found or does not belong to your organization",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    let teamLeadId: string | null = null;
    if (teamLeadEmail) {
      const leadUser = await prisma.user.findFirst({
        where: { email: teamLeadEmail, companyId: department.companyId },
      });
      if (leadUser) teamLeadId = leadUser.id;
    }

    const team = await prisma.team.create({
      data: {
        departmentId,
        name,
        code,
        description: description || null,
        leadName: leadName || null,
        teamLeadId,
      },
    });

    return NextResponse.json({ success: true, data: team }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/org/teams error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create team", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
