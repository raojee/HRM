import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    if (!auth.session.employeeId) {
      return NextResponse.json({ success: true, data: [] });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "30", 10);

    const attendances = await prisma.attendance.findMany({
      where: {
        employeeId: auth.session.employeeId,
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
