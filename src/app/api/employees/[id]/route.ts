import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { EmploymentType, OnboardingStatus, EmployeeStatus, Role } from "@prisma/client";

const updateEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional().nullable(),
  branchId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  teamId: z.string().optional().nullable(),
  designationTitle: z.string().optional().nullable(),
  employmentType: z.nativeEnum(EmploymentType).optional(),
  status: z.nativeEnum(EmployeeStatus).optional(),
  onboardingStatus: z.nativeEnum(OnboardingStatus).optional(),
  baseSalary: z.number().positive().optional().nullable(),
  currency: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true, code: true } },
        team: { select: { id: true, name: true, code: true } },
        designation: { select: { id: true, title: true, code: true } },
        company: { select: { id: true, name: true } },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (auth.session.role !== Role.SUPER_ADMIN && employee.companyId !== auth.session.companyId) {
      return NextResponse.json(
        { success: false, error: "Access denied to employee record", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: employee });
  } catch (error: any) {
    console.error("GET /api/employees/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch employee", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const roleCheck = requireRole(auth.session, [
      Role.SUPER_ADMIN,
      Role.COMPANY_ADMIN,
      Role.BRANCH_ADMIN,
      Role.DEPARTMENT_ADMIN,
    ]);
    if (!roleCheck.authorized) return roleCheck.errorResponse;

    const { id } = await params;

    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
      include: { designation: true },
    });

    if (!existingEmployee) {
      return NextResponse.json(
        { success: false, error: "Employee record not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (auth.session.role !== Role.SUPER_ADMIN && existingEmployee.companyId !== auth.session.companyId) {
      return NextResponse.json(
        { success: false, error: "Access denied to update this employee", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = updateEmployeeSchema.safeParse(body);

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

    const data = parsed.data;
    const updateData: any = {};

    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.employmentType !== undefined) updateData.employmentType = data.employmentType;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.onboardingStatus !== undefined) updateData.onboardingStatus = data.onboardingStatus;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.baseSalary !== undefined) {
      updateData.baseSalary = data.baseSalary !== null ? Number(data.baseSalary) : null;
    }

    // Email update check
    if (data.email !== undefined && data.email !== existingEmployee.email) {
      const emailInUse = await prisma.employee.findFirst({
        where: { email: data.email, NOT: { id } },
      });
      if (emailInUse) {
        return NextResponse.json(
          { success: false, error: "Email address is already in use by another employee", code: "DUPLICATE_EMAIL" },
          { status: 409 }
        );
      }
      updateData.email = data.email;
    }

    // Branch update check
    if (data.branchId !== undefined) {
      if (data.branchId && data.branchId !== "ALL") {
        const branch = await prisma.branch.findFirst({
          where: { id: data.branchId, companyId: existingEmployee.companyId },
        });
        if (!branch) {
          return NextResponse.json(
            { success: false, error: "Specified branch not found in this organization", code: "NOT_FOUND" },
            { status: 404 }
          );
        }
        updateData.branchId = branch.id;
      } else {
        updateData.branchId = null;
      }
    }

    // Department update check
    if (data.departmentId !== undefined) {
      if (data.departmentId) {
        const department = await prisma.department.findFirst({
          where: { id: data.departmentId, companyId: existingEmployee.companyId },
        });
        if (!department) {
          return NextResponse.json(
            { success: false, error: "Specified department not found in this organization", code: "NOT_FOUND" },
            { status: 404 }
          );
        }
        updateData.departmentId = department.id;
      } else {
        updateData.departmentId = null;
      }
    }

    // Team update check
    if (data.teamId !== undefined) {
      if (data.teamId) {
        const team = await prisma.team.findFirst({
          where: { id: data.teamId },
        });
        if (!team) {
          return NextResponse.json(
            { success: false, error: "Specified team not found", code: "NOT_FOUND" },
            { status: 404 }
          );
        }
        updateData.teamId = team.id;
      } else {
        updateData.teamId = null;
      }
    }

    // Designation title update
    if (data.designationTitle !== undefined) {
      if (data.designationTitle && data.designationTitle.trim()) {
        let designation = await prisma.designation.findFirst({
          where: {
            companyId: existingEmployee.companyId,
            title: { equals: data.designationTitle.trim(), mode: "insensitive" },
          },
        });

        if (!designation) {
          const code = data.designationTitle.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
          designation = await prisma.designation.create({
            data: {
              title: data.designationTitle.trim(),
              code: `${code}-${Date.now().toString().slice(-4)}`,
              companyId: existingEmployee.companyId,
            },
          });
        }
        updateData.designationId = designation.id;
      } else {
        updateData.designationId = null;
      }
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: updateData,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true, code: true } },
        team: { select: { id: true, name: true, code: true } },
        designation: { select: { id: true, title: true, code: true } },
      },
    });

    return NextResponse.json({ success: true, data: updatedEmployee });
  } catch (error: any) {
    console.error("PATCH /api/employees/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update employee", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const roleCheck = requireRole(auth.session, [Role.SUPER_ADMIN, Role.COMPANY_ADMIN]);
    if (!roleCheck.authorized) return roleCheck.errorResponse;

    const { id } = await params;

    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (auth.session.role !== Role.SUPER_ADMIN && employee.companyId !== auth.session.companyId) {
      return NextResponse.json(
        { success: false, error: "Access denied to delete employee", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // Delete or mark terminated
    await prisma.employee.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Employee profile ${employee.employeeNumber} deleted successfully.`,
    });
  } catch (error: any) {
    console.error("DELETE /api/employees/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete employee", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
