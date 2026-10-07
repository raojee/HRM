import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";
import { AttendanceStatus } from "@prisma/client";

const punchInSchema = z.object({
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
    const parsed = punchInSchema.safeParse(body);
    const note = parsed.success ? parsed.data.note : undefined;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const now = new Date();

    // Check if already punched in today
    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: auth.session.employeeId,
          date: today,
        },
      },
    });

    if (existing && existing.punchIn) {
      return NextResponse.json(
        {
          success: false,
          error: "You have already clocked in today at " + existing.punchIn.toLocaleTimeString(),
          code: "ALREADY_PUNCHED_IN",
        },
        { status: 400 }
      );
    }

    // Determine status (e.g. if after 9:30 AM mark as LATE)
    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);
    const status = isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

    const record = await prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId: auth.session.employeeId,
          date: today,
        },
      },
      update: {
        punchIn: now,
        punchInNote: note,
        status,
      },
      create: {
        employeeId: auth.session.employeeId,
        date: today,
        punchIn: now,
        punchInNote: note,
        status,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Clocked in successfully at ${now.toLocaleTimeString()}`,
      data: record,
    });
  } catch (error: any) {
    console.error("POST /api/attendance/punch-in error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to punch in", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
