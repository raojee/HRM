import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";
import { EmploymentType, OnboardingStatus, EmployeeStatus, Role } from "@prisma/client";
import { checkSeatLimit } from "@/lib/services/tenantService";

const createEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  branchId: z.string().min(1, "Branch is required"),
  departmentId: z.string().optional(),
  teamId: z.string().optional(),
  designationTitle: z.string().min(1, "Designation title is required"),
  employmentType: z.nativeEnum(EmploymentType).default(EmploymentType.FULL_TIME),
  baseSalary: z.number().positive().optional(),
  currency: z.string().default("USD"),
  hireDate: z.string().optional(),
  draftOnly: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const branchId = searchParams.get("branchId");
    const departmentId = searchParams.get("departmentId");
    const onboardingStatus = searchParams.get("onboardingStatus");
    const status = searchParams.get("status");

    const targetCompanyId = (auth.session.role === Role.SUPER_ADMIN && searchParams.get("companyId"))
      ? searchParams.get("companyId")!
      : auth.session.companyId;

    const where: any = {
      companyId: targetCompanyId,
    };

    if (branchId) where.branchId = branchId;
    if (departmentId) where.departmentId = departmentId;
    if (onboardingStatus) where.onboardingStatus = onboardingStatus as OnboardingStatus;
    if (status) where.status = status as EmployeeStatus;

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { employeeNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true, code: true } },
        team: { select: { id: true, name: true } },
        designation: { select: { id: true, title: true } },
        createdBy: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: employees,
    });
  } catch (error: any) {
    console.error("GET /api/employees error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch employees", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();
    const parsed = createEmployeeSchema.safeParse(body);

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

    // Enforce SaaS Subscription seat quota
    const seatCheck = await checkSeatLimit(auth.session.companyId);
    if (!seatCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Subscription seat quota exceeded: Your organization has used all ${seatCheck.currentCount} of ${seatCheck.maxSeats} allocated seats on the ${seatCheck.tier} plan. Please upgrade your plan in Billing & Subscriptions to onboard more personnel.`,
          code: "LICENSE_LIMIT_EXCEEDED",
        },
        { status: 403 }
      );
    }

    // Check duplicate email globally (Employee email is unique in database)
    const existing = await prisma.employee.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "An employee profile with this email address already exists", code: "DUPLICATE_EMAIL" },
        { status: 409 }
      );
    }

    // Verify branch belongs to current tenant
    const branch = await prisma.branch.findFirst({
      where: { id: data.branchId, companyId: auth.session.companyId },
    });
    if (!branch) {
      return NextResponse.json(
        { success: false, error: "Selected branch does not belong to your organization", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Verify department belongs to current tenant (if specified)
    let department = null;
    if (data.departmentId) {
      department = await prisma.department.findFirst({
        where: { id: data.departmentId, companyId: auth.session.companyId },
      });
      if (!department) {
        return NextResponse.json(
          { success: false, error: "Selected department does not belong to your organization", code: "NOT_FOUND" },
          { status: 404 }
        );
      }
    }

    // Auto-create or find Designation
    let designation = await prisma.designation.findFirst({
      where: {
        companyId: auth.session.companyId,
        title: { equals: data.designationTitle, mode: "insensitive" },
      },
    });

    if (!designation) {
      const code = data.designationTitle.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
      designation = await prisma.designation.create({
        data: {
          title: data.designationTitle,
          code: `${code}-${Date.now().toString().slice(-4)}`,
          companyId: auth.session.companyId,
        },
      });
    }

    // Generate provisional employee number
    const count = await prisma.employee.count({
      where: { companyId: auth.session.companyId },
    });
    const provisionalNumber = `EMP-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const initialStatus = data.draftOnly
      ? OnboardingStatus.DRAFT
      : OnboardingStatus.PENDING_DEPT_APPROVAL;

    const employee = await prisma.employee.create({
      data: {
        companyId: auth.session.companyId,
        employeeNumber: provisionalNumber,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || null,
        branchId: data.branchId,
        departmentId: department?.id || null,
        teamId: data.teamId || null,
        designationId: designation.id,
        employmentType: data.employmentType,
        baseSalary: data.baseSalary ? Number(data.baseSalary) : null,
        currency: data.currency,
        hireDate: data.hireDate ? new Date(data.hireDate) : new Date(),
        onboardingStatus: initialStatus,
        status: EmployeeStatus.PROBATION,
        createdById: auth.session.sub,
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true, code: true } },
        team: { select: { id: true, name: true } },
        designation: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: data.draftOnly
          ? "Employee candidate saved as draft."
          : "Candidate submitted into Department Review pipeline.",
        data: employee,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/employees error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create employee candidate", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
