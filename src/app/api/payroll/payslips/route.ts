import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { getPayslips } from "@/lib/services/payrollService";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!, 10) : undefined;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!, 10) : undefined;
    const payrollRunId = searchParams.get("payrollRunId") || undefined;
    const search = searchParams.get("search") || undefined;
    const paymentStatus = searchParams.get("paymentStatus") || undefined;

    const payslips = await getPayslips(auth.session, {
      month,
      year,
      payrollRunId,
      search,
      paymentStatus,
    });

    return NextResponse.json({
      success: true,
      data: payslips,
    });
  } catch (error: any) {
    console.error("GET /api/payroll/payslips error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to retrieve payslips.",
        code: "PAYSLIPS_FETCH_ERROR",
      },
      { status: 500 }
    );
  }
}
