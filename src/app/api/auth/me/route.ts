import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const user = await prisma.user.findUnique({
      where: { id: auth.session.sub },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            legalName: true,
            subdomain: true,
            currency: true,
            timezone: true,
            subscription: {
              select: {
                tier: true,
                status: true,
                maxSeats: true,
                maxBranches: true,
              },
            },
          },
        },
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            branchId: true,
            departmentId: true,
            teamId: true,
            status: true,
            onboardingStatus: true,
            designation: { select: { title: true } },
            branch: { select: { id: true, name: true, code: true } },
            department: { select: { id: true, name: true, code: true } },
          },
        },
        administeredBranches: { select: { id: true, name: true, code: true } },
        administeredDepartments: { select: { id: true, name: true, code: true } },
        ledTeams: { select: { id: true, name: true, code: true } },
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: "User account not found or suspended", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const fullName = user.employee
      ? `${user.employee.firstName} ${user.employee.lastName}`
      : user.email.split("@")[0];

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: fullName,
          company: user.company,
          employee: user.employee,
          administeredBranches: user.administeredBranches,
          administeredDepartments: user.administeredDepartments,
          ledTeams: user.ledTeams,
        },
      },
    });
  } catch (error: any) {
    console.error("Auth me API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch session user", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
