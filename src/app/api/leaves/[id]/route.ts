import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";
import { LeaveStatus, Role } from "@prisma/client";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;

    const leave = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!leave) {
      return NextResponse.json(
        { success: false, error: "Leave request not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Must belong to employee or company admin / super admin
    const isOwner = auth.session.employeeId === leave.employeeId;
    const isSuperAdmin = auth.session.role === Role.SUPER_ADMIN;
    const isCompanyAdmin =
      auth.session.role === Role.COMPANY_ADMIN &&
      auth.session.companyId === leave.employee.companyId;

    if (!isOwner && !isSuperAdmin && !isCompanyAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized to cancel this leave request", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    if (leave.status !== LeaveStatus.PENDING) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot cancel leave request that is already ${leave.status.toLowerCase()}.`,
          code: "INVALID_STATE",
        },
        { status: 400 }
      );
    }

    // Revert pending days and set status to CANCELLED
    const currentYear = new Date(leave.startDate).getFullYear();
    const updated = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.leaveRequest.update({
        where: { id },
        data: {
          status: LeaveStatus.CANCELLED,
          actionedAt: new Date(),
          approvalComment: "Cancelled by employee.",
        },
      });

      const alloc = await tx.leaveAllocation.findUnique({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: leave.employeeId,
            leaveTypeId: leave.leaveTypeId,
            year: currentYear,
          },
        },
      });

      if (alloc) {
        await tx.leaveAllocation.update({
          where: { id: alloc.id },
          data: {
            pendingDays: {
              decrement: Number(leave.totalDays),
            },
          },
        });
      }

      return cancelled;
    });

    return NextResponse.json({
      success: true,
      message: "Leave request cancelled. Pending days refunded.",
      data: updated,
    });
  } catch (error: any) {
    console.error("DELETE /api/leaves/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel leave request", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
