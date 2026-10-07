import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { getTimesheets, submitTimesheet } from "@/lib/services/projectService";
import { TimesheetStatus } from "@prisma/client";

const submitTimesheetSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  date: z.string().min(1, "Date is required"),
  hoursWorked: z.number().positive("Hours must be positive").max(24, "Cannot exceed 24 hours"),
  taskDescription: z.string().min(3, "Task description must be at least 3 characters"),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") || undefined;
    const status = searchParams.get("status") as TimesheetStatus | undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const timesheets = await getTimesheets(auth.session, {
      projectId,
      status,
      startDate,
      endDate,
    });

    return NextResponse.json({
      success: true,
      data: timesheets,
    });
  } catch (error: any) {
    console.error("GET /api/timesheets error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to retrieve timesheets.",
        code: "TIMESHEETS_FETCH_ERROR",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json().catch(() => ({}));
    const parseResult = submitTimesheetSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parseResult.error.format(),
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const timesheet = await submitTimesheet(parseResult.data, auth.session);

    return NextResponse.json(
      {
        success: true,
        message: "Timesheet logged and submitted for manager approval.",
        data: timesheet,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/timesheets error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to submit timesheet.",
        code: "TIMESHEET_SUBMIT_ERROR",
      },
      { status: 400 }
    );
  }
}
