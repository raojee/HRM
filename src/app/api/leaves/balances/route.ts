import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const targetEmployeeId = searchParams.get("employeeId") || auth.session.employeeId;

    if (!targetEmployeeId) {
      return NextResponse.json({ success: true, data: [] });
    }

    const currentYear = new Date().getFullYear();

    let allocations = await prisma.leaveAllocation.findMany({
      where: {
        employeeId: targetEmployeeId,
        year: currentYear,
      },
      include: {
        leaveType: {
          select: { id: true, name: true, colorHex: true, isPaid: true },
        },
      },
    });

    // Auto-initialize standard allocations if not yet assigned for current year
    if (allocations.length === 0) {
      const emp = await prisma.employee.findUnique({
        where: { id: targetEmployeeId },
        select: { companyId: true },
      });

      if (emp) {
        const types = await prisma.leaveType.findMany({
          where: { companyId: emp.companyId },
        });

        if (types.length > 0) {
          await Promise.all(
            types.map((t) =>
              prisma.leaveAllocation.upsert({
                where: {
                  employeeId_leaveTypeId_year: {
                    employeeId: targetEmployeeId,
                    leaveTypeId: t.id,
                    year: currentYear,
                  },
                },
                update: {},
                create: {
                  employeeId: targetEmployeeId,
                  leaveTypeId: t.id,
                  year: currentYear,
                  allocatedDays: t.defaultDays,
                  usedDays: 0,
                  pendingDays: 0,
                },
              })
            )
          );

          allocations = await prisma.leaveAllocation.findMany({
            where: {
              employeeId: targetEmployeeId,
              year: currentYear,
            },
            include: {
              leaveType: {
                select: { id: true, name: true, colorHex: true, isPaid: true },
              },
            },
          });
        }
      }
    }

    const formatted = allocations.map((alloc) => ({
      id: alloc.id,
      leaveType: alloc.leaveType.name,
      leaveTypeId: alloc.leaveTypeId,
      colorHex: alloc.leaveType.colorHex,
      isPaid: alloc.leaveType.isPaid,
      allocatedDays: alloc.allocatedDays,
      usedDays: alloc.usedDays,
      pendingDays: alloc.pendingDays,
      availableDays: alloc.allocatedDays - alloc.usedDays - alloc.pendingDays,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error("GET /api/leaves/balances error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch leave balances", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
