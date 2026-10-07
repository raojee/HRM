import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { LeaveStatus, Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const roleCheck = requireRole(auth.session, [
      Role.TEAM_LEAD,
      Role.DEPARTMENT_ADMIN,
      Role.BRANCH_ADMIN,
      Role.COMPANY_ADMIN,
      Role.SUPER_ADMIN,
    ]);
    if (!roleCheck.authorized) return roleCheck.errorResponse;

    const where: any = {
      status: LeaveStatus.PENDING,
      employee: { companyId: auth.session.companyId },
    };

    if (auth.session.role === Role.TEAM_LEAD) {
      const ledTeam = await prisma.team.findFirst({
        where: { teamLeadId: auth.session.sub },
      });
      if (ledTeam) {
        where.employee = { ...where.employee, teamId: ledTeam.id };
      }
    } else if (auth.session.role === Role.DEPARTMENT_ADMIN && auth.session.departmentId) {
      where.employee = { ...where.employee, departmentId: auth.session.departmentId };
    } else if (auth.session.role === Role.BRANCH_ADMIN && auth.session.branchId) {
      where.employee = { ...where.employee, branchId: auth.session.branchId };
    }

    const pendingLeaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        leaveType: true,
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            branch: { select: { name: true } },
            department: { select: { name: true } },
            team: { select: { name: true } },
            designation: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: pendingLeaves,
      meta: {
        total: pendingLeaves.length,
        reviewerRole: auth.session.role,
      },
    });
  } catch (error: any) {
    console.error("GET /api/approvals/leaves error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch pending leave approvals", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
