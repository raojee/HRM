import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { Role } from "@prisma/client";
import { executeBatchPayroll } from "@/lib/services/payrollService";

const runPayrollSchema = z.object({
  month: z.number().int().min(1, "Month must be between 1 and 12").max(12, "Month must be between 1 and 12"),
  year: z.number().int().min(2020, "Year must be 2020 or later").max(2100, "Year is invalid"),
  branchId: z.string().optional().nullable(),
  autoMarkPaid: z.boolean().optional().default(true),
  payDate: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    // RBAC: Only Super Admin, Company Admin, or Branch Admin
    const roleCheck = requireRole(auth.session, [
      Role.SUPER_ADMIN,
      Role.COMPANY_ADMIN,
      Role.BRANCH_ADMIN,
    ]);
    if (!roleCheck.authorized) return roleCheck.errorResponse!;

    // Safely parse JSON body
    const body = await req.json().catch(() => ({}));
    const parseResult = runPayrollSchema.safeParse(body);

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

    const { month, year, branchId, autoMarkPaid, payDate } = parseResult.data;

    const result = await executeBatchPayroll({
      month,
      year,
      branchId,
      autoMarkPaid,
      payDate: payDate || undefined,
      session: auth.session,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Successfully processed payroll batch for ${month}/${year}.`,
        data: result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/payroll/run error:", error);
    const message = error.message || "Failed to process payroll batch.";
    const status = message.includes("already been finalized") ? 409 : 400;

    return NextResponse.json(
      {
        success: false,
        error: message,
        code: status === 409 ? "PAYROLL_ALREADY_EXISTS" : "PAYROLL_PROCESSING_ERROR",
      },
      { status }
    );
  }
}
