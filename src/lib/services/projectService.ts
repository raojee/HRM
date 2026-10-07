import { prisma } from "@/lib/prisma";
import { AuthTokenPayload } from "@/lib/auth/jwt";
import { Role, ProjectStatus, TimesheetStatus } from "@prisma/client";

/**
 * Auto-provisions demo clients and projects if the company currently has none.
 */
export async function ensureDefaultProjects(companyId: string) {
  const existingCount = await prisma.project.count({
    where: { companyId },
  });

  if (existingCount > 0) return;

  // 1. Create default clients
  const clientApex = await prisma.client.create({
    data: {
      companyId,
      name: "Apex Financial Partners",
      email: "eng@apexfin.com",
      phone: "+1 (555) 300-1122",
      address: "100 Wall Street, New York, NY",
    },
  });

  const clientInternal = await prisma.client.create({
    data: {
      companyId,
      name: "DigiSail SaaS Core",
      email: "core@digisail.com",
      phone: "+1 (555) 300-4455",
      address: "75 Rockefeller Plaza, New York, NY",
    },
  });

  const clientHealth = await prisma.client.create({
    data: {
      companyId,
      name: "Starlight Health Systems",
      email: "it@starlighthealth.org",
      phone: "+1 (555) 420-7890",
      address: "500 Medical Center Way, Boston, MA",
    },
  });

  // 2. Find employees to assign as members
  const employees = await prisma.employee.findMany({
    where: { companyId, status: "ACTIVE" },
    take: 5,
  });

  // 3. Create default projects
  const proj1 = await prisma.project.create({
    data: {
      companyId,
      clientId: clientInternal.id,
      name: "DigiSail Cloud Platform v4",
      code: "DSP-CLOUD",
      description: "Distributed multi-tenant SaaS architecture, event streaming, and tenant-level isolation.",
      status: ProjectStatus.ACTIVE,
      budget: 250000,
      startDate: new Date("2026-01-15"),
      endDate: new Date("2026-12-15"),
    },
  });

  const proj2 = await prisma.project.create({
    data: {
      companyId,
      clientId: clientApex.id,
      name: "FinTech Enterprise Integration",
      code: "FIN-INT",
      description: "Secure Open Banking API connectivity, SOC-2 compliant transaction pipeline, and real-time ledger.",
      status: ProjectStatus.ACTIVE,
      budget: 180000,
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-11-30"),
    },
  });

  const proj3 = await prisma.project.create({
    data: {
      companyId,
      clientId: clientHealth.id,
      name: "HIPAA Clinical Portal & Telehealth",
      code: "HLTH-PORTAL",
      description: "Encrypted patient records portal, video consultation scheduling, and audit access logs.",
      status: ProjectStatus.PLANNING,
      budget: 120000,
      startDate: new Date("2026-06-01"),
      endDate: new Date("2027-02-28"),
    },
  });

  // 4. Assign project members
  for (const emp of employees) {
    await prisma.projectMember.create({
      data: {
        projectId: proj1.id,
        employeeId: emp.id,
        role: emp.designationId ? "Core Engineer" : "Member",
      },
    });

    if (emp.email.includes("alex") || emp.email.includes("sophia") || emp.email.includes("priya")) {
      await prisma.projectMember.create({
        data: {
          projectId: proj2.id,
          employeeId: emp.id,
          role: emp.email.includes("alex") ? "Technical Lead" : "Engineer",
        },
      });
    }
  }

  // 5. Seed initial timesheet entries
  if (employees.length > 0) {
    const alex = employees.find((e) => e.email.includes("alex")) || employees[0];
    const priya = employees.find((e) => e.email.includes("priya")) || employees[1] || employees[0];
    const sophia = employees.find((e) => e.email.includes("sophia")) || employees[0];

    await prisma.timesheet.createMany({
      data: [
        {
          employeeId: priya.id,
          projectId: proj1.id,
          date: new Date("2026-10-04"),
          hoursWorked: 8.0,
          taskDescription: "Engineered branch and department level tenancy isolation filters in Prisma data layer.",
          status: TimesheetStatus.APPROVED,
        },
        {
          employeeId: alex.id,
          projectId: proj1.id,
          date: new Date("2026-10-05"),
          hoursWorked: 7.5,
          taskDescription: "Architected multi-tenant JWT claims verification and Next.js middleware guards.",
          status: TimesheetStatus.APPROVED,
        },
        {
          employeeId: sophia.id,
          projectId: proj2.id,
          date: new Date("2026-10-06"),
          hoursWorked: 6.0,
          taskDescription: "Implemented ACH direct deposit batch settlement transaction engine and receipt hashing.",
          status: TimesheetStatus.SUBMITTED,
        },
        {
          employeeId: priya.id,
          projectId: proj2.id,
          date: new Date("2026-10-07"),
          hoursWorked: 8.0,
          taskDescription: "Developed interactive digital payslip verification receipt modal with printing support.",
          status: TimesheetStatus.SUBMITTED,
        },
      ],
    });
  }
}

/**
 * Retrieves projects with aggregated logged hours, member counts, and client details.
 */
export async function getProjects(session: AuthTokenPayload) {
  await ensureDefaultProjects(session.companyId);

  const projects = await prisma.project.findMany({
    where: { companyId: session.companyId },
    include: {
      client: {
        select: { id: true, name: true, email: true },
      },
      members: {
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
              department: { select: { name: true } },
              designation: { select: { title: true } },
            },
          },
        },
      },
      timesheets: {
        select: { hoursWorked: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return projects.map((p) => {
    const totalHours = p.timesheets.reduce((acc, t) => acc + Number(t.hoursWorked), 0);
    const approvedHours = p.timesheets
      .filter((t) => t.status === TimesheetStatus.APPROVED)
      .reduce((acc, t) => acc + Number(t.hoursWorked), 0);

    return {
      id: p.id,
      name: p.name,
      code: p.code,
      description: p.description,
      clientName: p.client?.name || "Internal",
      clientId: p.clientId,
      status: p.status,
      budget: p.budget ? Number(p.budget) : 0,
      startDate: p.startDate ? p.startDate.toISOString().split("T")[0] : null,
      endDate: p.endDate ? p.endDate.toISOString().split("T")[0] : null,
      totalHoursLogged: Math.round(totalHours * 10) / 10,
      approvedHours: Math.round(approvedHours * 10) / 10,
      memberCount: p.members.length,
      members: p.members.map((m) => ({
        id: m.id,
        employeeId: m.employeeId,
        employeeName: `${m.employee.firstName} ${m.employee.lastName}`,
        email: m.employee.email,
        avatarUrl: m.employee.avatarUrl,
        department: m.employee.department?.name,
        designation: m.employee.designation?.title,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      createdAt: p.createdAt,
    };
  });
}

export interface CreateProjectInput {
  name: string;
  code: string;
  description?: string;
  clientId?: string;
  clientName?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  memberEmployeeIds?: string[];
}

/**
 * Creates a new project under the caller's tenant with client verification.
 */
export async function createProject(input: CreateProjectInput, session: AuthTokenPayload) {
  // RBAC: Admins & Team Leads can create projects
  if (
    session.role !== Role.SUPER_ADMIN &&
    session.role !== Role.COMPANY_ADMIN &&
    session.role !== Role.BRANCH_ADMIN &&
    session.role !== Role.DEPARTMENT_ADMIN &&
    session.role !== Role.TEAM_LEAD
  ) {
    throw new Error("Unauthorized: Insufficient privileges to create new project.");
  }

  // Pre-check code uniqueness in company
  const existing = await prisma.project.findUnique({
    where: {
      companyId_code: {
        companyId: session.companyId,
        code: input.code.toUpperCase(),
      },
    },
  });

  if (existing) {
    throw new Error(`Project code "${input.code}" already exists in your company.`);
  }

  let finalClientId = input.clientId;

  // If a client name was given but no clientId, resolve or create client
  if (!finalClientId && input.clientName) {
    let client = await prisma.client.findFirst({
      where: { companyId: session.companyId, name: input.clientName },
    });
    if (!client) {
      client = await prisma.client.create({
        data: {
          companyId: session.companyId,
          name: input.clientName,
        },
      });
    }
    finalClientId = client.id;
  }

  return await prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        companyId: session.companyId,
        clientId: finalClientId,
        name: input.name,
        code: input.code.toUpperCase(),
        description: input.description,
        budget: input.budget ? Number(input.budget) : 0,
        status: ProjectStatus.ACTIVE,
        startDate: input.startDate ? new Date(input.startDate) : new Date(),
        endDate: input.endDate ? new Date(input.endDate) : null,
      },
    });

    if (input.memberEmployeeIds && input.memberEmployeeIds.length > 0) {
      for (const empId of input.memberEmployeeIds) {
        await tx.projectMember.create({
          data: {
            projectId: project.id,
            employeeId: empId,
            role: "Member",
          },
        });
      }
    }

    return project;
  });
}

export interface GetTimesheetsFilter {
  projectId?: string;
  status?: TimesheetStatus;
  startDate?: string;
  endDate?: string;
}

/**
 * Retrieves timesheet entries scoped to role and filters.
 */
export async function getTimesheets(session: AuthTokenPayload, filters?: GetTimesheetsFilter) {
  await ensureDefaultProjects(session.companyId);

  const whereClause: any = {
    project: {
      companyId: session.companyId,
    },
  };

  // Role Scoping:
  if (session.role === Role.EMPLOYEE) {
    // Regular employee only views their own timesheet submissions
    if (!session.employeeId) {
      const emp = await prisma.employee.findUnique({
        where: { email: session.email },
        select: { id: true },
      });
      if (!emp) return [];
      whereClause.employeeId = emp.id;
    } else {
      whereClause.employeeId = session.employeeId;
    }
  } else if (session.role === Role.TEAM_LEAD && session.departmentId) {
    // Team lead sees departmental/team timesheets
    whereClause.employee = {
      companyId: session.companyId,
      departmentId: session.departmentId,
    };
  } else if (session.role === Role.DEPARTMENT_ADMIN && session.departmentId) {
    whereClause.employee = {
      companyId: session.companyId,
      departmentId: session.departmentId,
    };
  } else if (session.role === Role.BRANCH_ADMIN && session.branchId) {
    whereClause.employee = {
      companyId: session.companyId,
      branchId: session.branchId,
    };
  }

  if (filters?.projectId) {
    whereClause.projectId = filters.projectId;
  }
  if (filters?.status) {
    whereClause.status = filters.status;
  }
  if (filters?.startDate && filters?.endDate) {
    whereClause.date = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate),
    };
  }

  const timesheets = await prisma.timesheet.findMany({
    where: whereClause,
    include: {
      project: {
        select: { id: true, name: true, code: true },
      },
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
          employeeNumber: true,
          department: { select: { name: true } },
          designation: { select: { title: true } },
        },
      },
    },
    orderBy: { date: "desc" },
  });

  return timesheets.map((t) => ({
    id: t.id,
    projectId: t.projectId,
    projectName: t.project.name,
    projectCode: t.project.code,
    employeeId: t.employeeId,
    employeeName: `${t.employee.firstName} ${t.employee.lastName}`,
    employeeNumber: t.employee.employeeNumber,
    employeeAvatar: t.employee.avatarUrl,
    department: t.employee.department?.name || "General",
    designation: t.employee.designation?.title || "Staff",
    date: t.date.toISOString().split("T")[0],
    hoursWorked: Number(t.hoursWorked),
    taskDescription: t.taskDescription,
    status: t.status,
    createdAt: t.createdAt,
  }));
}

export interface SubmitTimesheetInput {
  projectId: string;
  date: string;
  hoursWorked: number;
  taskDescription: string;
}

/**
 * Submits a daily or task timesheet entry for the logged-in employee.
 */
export async function submitTimesheet(input: SubmitTimesheetInput, session: AuthTokenPayload) {
  // Resolve employee ID
  let employeeId = session.employeeId;
  if (!employeeId) {
    const emp = await prisma.employee.findUnique({
      where: { email: session.email },
      select: { id: true },
    });
    if (!emp) throw new Error("Could not find active employee record for current user session.");
    employeeId = emp.id;
  }

  // Validate project belongs to user's company
  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
    select: { companyId: true, name: true },
  });

  if (!project || project.companyId !== session.companyId) {
    throw new Error("Invalid project: Project does not belong to your organization.");
  }

  if (input.hoursWorked <= 0 || input.hoursWorked > 24) {
    throw new Error("Logged hours must be between 0.5 and 24 hours.");
  }

  return await prisma.timesheet.create({
    data: {
      employeeId,
      projectId: input.projectId,
      date: new Date(input.date),
      hoursWorked: input.hoursWorked,
      taskDescription: input.taskDescription.trim(),
      status: TimesheetStatus.SUBMITTED,
    },
    include: {
      project: { select: { name: true, code: true } },
    },
  });
}

/**
 * Reviews and signs off on an employee's timesheet entry (APPROVE or REJECT).
 */
export async function actionTimesheet(
  timesheetId: string,
  action: "APPROVE" | "REJECT",
  session: AuthTokenPayload
) {
  // RBAC: Lead, Dept Admin, Branch HR, Company Admin, Super Admin
  if (session.role === Role.EMPLOYEE) {
    throw new Error("Unauthorized: Regular employees cannot approve or reject timesheets.");
  }

  const timesheet = await prisma.timesheet.findUnique({
    where: { id: timesheetId },
    include: {
      project: { select: { companyId: true } },
    },
  });

  if (!timesheet) {
    throw new Error("Timesheet entry not found.");
  }

  if (timesheet.project.companyId !== session.companyId) {
    throw new Error("Unauthorized: Timesheet belongs to a different company.");
  }

  const newStatus = action === "APPROVE" ? TimesheetStatus.APPROVED : TimesheetStatus.REJECTED;

  return await prisma.timesheet.update({
    where: { id: timesheetId },
    data: {
      status: newStatus,
    },
  });
}
