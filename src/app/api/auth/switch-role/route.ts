import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { signToken } from "@/lib/auth/jwt";
import { getSession, setAuthCookie } from "@/lib/auth/session";

const switchRoleSchema = z.object({
  role: z.nativeEnum(Role),
  email: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Security check: Only Super Admin can switch roles if already authenticated
    const currentSession = await getSession(req);
    if (currentSession && currentSession.role !== Role.SUPER_ADMIN) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Only Platform Super Admin is authorized to switch perspectives.",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = switchRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid role specified", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { role, email } = parsed.data;

    // Find target user by email or by first user matching the role
    let user = null;
    if (email) {
      user = await prisma.user.findUnique({
        where: { email },
        include: {
          company: true,
          employee: true,
          administeredBranches: true,
          administeredDepartments: true,
          ledTeams: true,
        },
      });
    }

    if (!user) {
      user = await prisma.user.findFirst({
        where: { role, isActive: true },
        include: {
          company: true,
          employee: true,
          administeredBranches: true,
          administeredDepartments: true,
          ledTeams: true,
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: `No active user found with role ${role}`, code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const branchId = user.administeredBranches[0]?.id || user.employee?.branchId || null;
    const departmentId = user.administeredDepartments[0]?.id || user.employee?.departmentId || null;
    const fullName = user.employee
      ? `${user.employee.firstName} ${user.employee.lastName}`
      : user.email.split("@")[0];

    const token = await signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      branchId,
      departmentId,
      employeeId: user.employee?.id || null,
      name: fullName,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: fullName,
          company: { id: user.company.id, name: user.company.name },
          employee: user.employee,
          administeredBranches: user.administeredBranches,
          administeredDepartments: user.administeredDepartments,
        },
      },
    });

    setAuthCookie(response, token);
    return response;
  } catch (error: any) {
    console.error("Switch role API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to switch role", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
