import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";

const DEFAULT_LEAVE_TYPES = [
  { name: "Annual Vacation", code: "ANNUAL", defaultDays: 14, isPaid: true, colorHex: "#3b82f6" },
  { name: "Medical / Sick Leave", code: "SICK", defaultDays: 10, isPaid: true, colorHex: "#ef4444" },
  { name: "Casual / Personal Leave", code: "CASUAL", defaultDays: 7, isPaid: true, colorHex: "#f59e0b" },
  { name: "Parental / Family Care", code: "PARENTAL", defaultDays: 30, isPaid: true, colorHex: "#ec4899" },
  { name: "Unpaid / Sabbatical", code: "UNPAID", defaultDays: 15, isPaid: false, colorHex: "#64748b" },
];

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    let types = await prisma.leaveType.findMany({
      where: { companyId: auth.session.companyId },
      orderBy: { name: "asc" },
    });

    // Auto-provision standard types if none exist
    if (types.length === 0) {
      await Promise.all(
        DEFAULT_LEAVE_TYPES.map((t) =>
          prisma.leaveType.create({
            data: {
              companyId: auth.session.companyId,
              name: t.name,
              code: t.code,
              defaultDays: t.defaultDays,
              isPaid: t.isPaid,
              colorHex: t.colorHex,
              requiresApproval: true,
            },
          })
        )
      );

      types = await prisma.leaveType.findMany({
        where: { companyId: auth.session.companyId },
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json({ success: true, data: types });
  } catch (error: any) {
    console.error("GET /api/leaves/types error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch leave types", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
