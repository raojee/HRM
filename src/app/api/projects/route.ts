import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { getProjects, createProject } from "@/lib/services/projectService";

const createProjectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters"),
  code: z.string().min(2, "Project code must be at least 2 characters"),
  description: z.string().optional(),
  clientId: z.string().optional(),
  clientName: z.string().optional(),
  budget: z.number().nonnegative().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  memberEmployeeIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const projects = await getProjects(auth.session);

    return NextResponse.json({
      success: true,
      data: projects,
    });
  } catch (error: any) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to retrieve projects.",
        code: "PROJECTS_FETCH_ERROR",
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
    const parseResult = createProjectSchema.safeParse(body);

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

    const project = await createProject(parseResult.data, auth.session);

    return NextResponse.json(
      {
        success: true,
        message: `Project ${project.name} created successfully.`,
        data: project,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/projects error:", error);
    const message = error.message || "Failed to create project.";
    const status = message.includes("Unauthorized") ? 403 : message.includes("already exists") ? 409 : 400;

    return NextResponse.json(
      {
        success: false,
        error: message,
        code: status === 409 ? "PROJECT_CODE_EXISTS" : "PROJECT_CREATION_ERROR",
      },
      { status }
    );
  }
}
