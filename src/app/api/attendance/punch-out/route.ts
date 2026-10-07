import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";

const punchOutSchema = z.object({
  note: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    if (!auth.session.employeeId) {
      return NextResponse.json(
        { success: false, error: "No employee profile found for user", code: "NO_EMPLOYEE" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = punchOutSchema.safeParse(body);
    const note = parsed.success ? parsed.data.note : undefined;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const now = new Date();

    let existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: auth.session.employeeId,
          date: today,
        },
      },
    });

    // If no clock-in today, check for an unclosed shift within the last 24 hours (overnight shifts)
    if (!existing || !existing.punchIn) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const openShift = await prisma.attendance.findFirst({
        where: {
          employeeId: auth.session.employeeId,
          date: { gte: yesterday },
          punchIn: { not: null },
          punchOut: null,
        },
        orderBy: { punchIn: "desc" },
      });

      if (openShift) {
        existing = openShift;
      }
    }

    if (!existing || !existing.punchIn) {
      return NextResponse.json(
        {
          success: false,
          error: "No active clock-in found. Please punch in first.",
          code: "NOT_PUNCHED_IN",
        },
        { status: 400 }
      );
    }

    if (existing.punchOut) {
      return NextResponse.json(
        {
          success: false,
          error: "You have already clocked out today at " + existing.punchOut.toLocaleTimeString(),
          code: "ALREADY_PUNCHED_OUT",
        },
        { status: 400 }
      );
    }

    // Calculate duration in hours
    const diffMs = now.getTime() - existing.punchIn.getTime();
    const workHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
    const standardHours = 8.0;
    const overtimeHours = workHours > standardHours ? Math.round((workHours - standardHours) * 100) / 100 : 0;

    const record = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        punchOut: now,
        punchOutNote: note,
        workHours,
        overtimeHours,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Clocked out successfully. Total hours: ${workHours} hrs`,
      data: record,
    });
  } catch (error: any) {
    console.error("POST /api/attendance/punch-out error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to punch out", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
