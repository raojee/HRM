import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";

const createClientSchema = z.object({
  name: z.string().min(2, "Client name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const clients = await prisma.client.findMany({
      where: { companyId: auth.session.companyId },
      include: {
        _count: { select: { projects: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: clients,
    });
  } catch (error: any) {
    console.error("GET /api/clients error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch clients.", code: "CLIENTS_FETCH_ERROR" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json().catch(() => ({}));
    const parseResult = createClientSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { name, email, phone, address } = parseResult.data;

    const client = await prisma.client.create({
      data: {
        companyId: auth.session.companyId,
        name,
        email: email || undefined,
        phone,
        address,
      },
    });

    return NextResponse.json(
      { success: true, message: "Client created successfully", data: client },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/clients error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create client." },
      { status: 500 }
    );
  }
}
