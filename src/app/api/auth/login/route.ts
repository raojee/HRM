import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";
import { setAuthCookie } from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Validation error",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: {
          select: { id: true, name: true, currency: true },
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
            designation: { select: { title: true } },
          },
        },
        administeredBranches: { select: { id: true, name: true } },
        administeredDepartments: { select: { id: true, name: true } },
        ledTeams: { select: { id: true, name: true } },
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials or inactive account", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials or inactive account", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    // Determine primary branch and department scopes based on role and assignments
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

    // Update last login timestamp asynchronously
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const response = NextResponse.json({
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

    setAuthCookie(response, token);
    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred during login", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
