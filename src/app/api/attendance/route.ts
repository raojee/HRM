import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const branchId = searchParams.get("branchId");
    const departmentId = searchParams.get("departmentId");

    const targetCompanyId = (auth.session.role === Role.SUPER_ADMIN && searchParams.get("companyId"))
      ? searchParams.get("companyId")!
      : auth.session.companyId;

    const where: any = {};

    // Standard employee only sees their personal punches
    if (auth.session.role === Role.EMPLOYEE) {
      if (!auth.session.employeeId) {
        return NextResponse.json({ success: true, data: [] });
      }
      where.employeeId = auth.session.employeeId;
    } else {
      // Admins and leads view tenant-wide logs
      where.employee = {
        companyId: targetCompanyId,
      };
      if (branchId) where.employee.branchId = branchId;
      if (departmentId) where.employee.departmentId = departmentId;
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            avatarUrl: true,
            branch: { select: { id: true, name: true, code: true } },
            department: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: { date: "desc" },
      take: limit,
    });

    return NextResponse.json({ success: true, data: attendances });
  } catch (error: any) {
    console.error("GET /api/attendance error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch attendance history", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
