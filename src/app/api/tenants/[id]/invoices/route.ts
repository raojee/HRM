import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";
import { Role } from "@prisma/client";

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
        { success: false, error: "Tenant ID is required", code: "MISSING_ID" },
        { status: 400 }
      );
    }

    // Tenant isolation guard
    if (auth.session.role !== Role.SUPER_ADMIN && auth.session.companyId !== id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Cannot view another organization's invoices", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const invoices = await prisma.invoice.findMany({
      where: { companyId: id },
      orderBy: { billingDate: "desc" },
    });

    const formatted = invoices.map((inv) => ({
      id: inv.id,
      subscriptionId: inv.subscriptionId,
      companyId: inv.companyId,
      invoiceNumber: inv.invoiceNumber,
      amount: Number(inv.amount),
      currency: inv.currency,
      status: inv.status,
      billingDate: inv.billingDate.toISOString().split("T")[0],
      paidAt: inv.paidAt ? inv.paidAt.toISOString() : null,
      pdfUrl: inv.pdfUrl,
      planName: inv.planName,
      seatsBilled: inv.seatsBilled,
      createdAt: inv.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error("GET /api/tenants/[id]/invoices error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve billing invoices", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

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
        { success: false, error: "Tenant ID is required", code: "MISSING_ID" },
        { status: 400 }
      );
    }

    if (auth.session.role !== Role.SUPER_ADMIN && auth.session.companyId !== id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount) || 799;
    const planName = body.planName || "Manual Billing Settlement";
    const seatsBilled = Number(body.seatsBilled) || 50;

    const now = new Date();
    const invoiceNum = `INV-${Date.now().toString().slice(-6)}-MAN`;

    const sub = await prisma.subscription.findUnique({
      where: { companyId: id },
    });

    const invoice = await prisma.invoice.create({
      data: {
        subscriptionId: sub?.id || null,
        companyId: id,
        invoiceNumber: invoiceNum,
        amount,
        currency: "USD",
        status: "PAID",
        billingDate: now,
        paidAt: now,
        planName,
        seatsBilled,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...invoice,
        amount: Number(invoice.amount),
        billingDate: invoice.billingDate.toISOString().split("T")[0],
      },
      message: "Billing statement recorded successfully",
    });
  } catch (error: any) {
    console.error("POST /api/tenants/[id]/invoices error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record invoice", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
