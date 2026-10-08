import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";
import { LeaveStatus, Role } from "@prisma/client";

const createLeaveSchema = z.object({
  leaveTypeId: z.string().min(1, "Leave type is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  totalDays: z.number().positive("Total days must be positive"),
  reason: z.string().min(3, "Reason is required (at least 3 characters)"),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const targetCompId = (auth.session.role === Role.SUPER_ADMIN && searchParams.get("companyId"))
      ? searchParams.get("companyId")!
      : auth.session.companyId;

    const where: any = {
      employee: { companyId: targetCompId },
    };

    if (status) where.status = status as LeaveStatus;

    // Regular employee only sees their own leaves
    if (auth.session.role === Role.EMPLOYEE) {
      if (!auth.session.employeeId) {
        return NextResponse.json({ success: true, data: [] });
      }
      where.employeeId = auth.session.employeeId;
    } else if (auth.session.role === Role.DEPARTMENT_ADMIN && auth.session.departmentId) {
      where.employee = {
        companyId: auth.session.companyId,
        departmentId: auth.session.departmentId,
      };
    } else if (auth.session.role === Role.BRANCH_ADMIN && auth.session.branchId) {
      where.employee = {
        companyId: auth.session.companyId,
        branchId: auth.session.branchId,
      };
    }

    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        leaveType: { select: { id: true, name: true, colorHex: true } },
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            branch: { select: { name: true } },
            department: { select: { name: true } },
          },
        },
        approvedBy: {
          select: {
            id: true,
            email: true,
            employee: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: leaves });
  } catch (error: any) {
    console.error("GET /api/leaves error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch leaves", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    let employeeId = auth.session.employeeId;
    if (!employeeId) {
      const linked = await prisma.employee.findFirst({
        where: {
          OR: [
            { userId: auth.session.sub },
            { email: auth.session.email },
          ],
        },
      });
      if (linked) {
        employeeId = linked.id;
      }
    }

    if (!employeeId) {
      return NextResponse.json(
        {
          success: false,
          error: "Current user account does not have an active employee profile attached.",
          code: "NO_EMPLOYEE_PROFILE",
        },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createLeaveSchema.safeParse(body);

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

    const { leaveTypeId, startDate, endDate, totalDays, reason } = parsed.data;

    // Check or provision leave balance
    const currentYear = new Date(startDate).getFullYear();
    let allocation = await prisma.leaveAllocation.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId,
          leaveTypeId,
          year: currentYear,
        },
      },
    });

    if (!allocation) {
      const lType = await prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
      if (lType) {
        allocation = await prisma.leaveAllocation.create({
          data: {
            employeeId,
            leaveTypeId,
            year: currentYear,
            allocatedDays: lType.defaultDays,
            usedDays: 0,
            pendingDays: 0,
          },
        });
      }
    }

    if (allocation) {
      const remainingDays = allocation.allocatedDays - allocation.usedDays - allocation.pendingDays;
      if (remainingDays < totalDays) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient leave balance. Remaining: ${remainingDays} days, Requested: ${totalDays} days.`,
            code: "INSUFFICIENT_BALANCE",
          },
          { status: 400 }
        );
      }
    }

    // Create leave request and increment pendingDays
    const result = await prisma.$transaction(async (tx) => {
      const leave = await tx.leaveRequest.create({
        data: {
          employeeId: employeeId!,
          leaveTypeId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          totalDays,
          reason,
          status: LeaveStatus.PENDING,
        },
        include: {
          leaveType: true,
        },
      });

      if (allocation) {
        await tx.leaveAllocation.update({
          where: { id: allocation.id },
          data: { pendingDays: { increment: totalDays } },
        });
      }

      return leave;
    });

    return NextResponse.json(
      { success: true, message: "Leave request submitted for manager approval", data: result },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/leaves error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit leave request", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
