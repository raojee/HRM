import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { getPayslipById } from "@/lib/services/payrollService";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Payslip ID is required", code: "MISSING_ID" },
        { status: 400 }
      );
    }

    const payslip = await getPayslipById(id, auth.session);

    return NextResponse.json({
      success: true,
      data: payslip,
    });
  } catch (error: any) {
    console.error("GET /api/payroll/payslips/[id] error:", error);
    const message = error.message || "Failed to retrieve payslip.";
    const status = message.includes("Unauthorized") ? 403 : message.includes("not found") ? 404 : 500;

    return NextResponse.json(
      {
        success: false,
        error: message,
        code: "PAYSLIP_DETAIL_ERROR",
      },
      { status }
    );
  }
}
