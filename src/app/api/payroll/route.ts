import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { getPayrollOverview } from "@/lib/services/payrollService";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const overview = await getPayrollOverview(auth.session);

    return NextResponse.json({
      success: true,
      data: overview,
    });
  } catch (error: any) {
    console.error("GET /api/payroll error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to retrieve payroll overview.",
        code: "PAYROLL_OVERVIEW_ERROR",
      },
      { status: 500 }
    );
  }
}
