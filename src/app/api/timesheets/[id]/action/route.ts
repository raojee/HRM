import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { actionTimesheet } from "@/lib/services/projectService";

const actionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Timesheet ID is required", code: "MISSING_ID" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = actionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Action must be APPROVE or REJECT", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const updated = await actionTimesheet(id, parseResult.data.action, auth.session);

    return NextResponse.json({
      success: true,
      message: `Timesheet entry ${parseResult.data.action.toLowerCase()}d successfully.`,
      data: updated,
    });
  } catch (error: any) {
    console.error("POST /api/timesheets/[id]/action error:", error);
    const message = error.message || "Failed to process timesheet action.";
    const status = message.includes("Unauthorized") ? 403 : message.includes("not found") ? 404 : 400;

    return NextResponse.json(
      { success: false, error: message, code: "TIMESHEET_ACTION_ERROR" },
      { status }
    );
  }
}
