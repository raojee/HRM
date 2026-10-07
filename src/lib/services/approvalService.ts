import { prisma } from "@/lib/prisma";
import { AuthTokenPayload } from "@/lib/auth/jwt";
import {
  Role,
  OnboardingStatus,
  ApprovalStage,
  ApprovalAction,
  LeaveStatus,
} from "@prisma/client";

export interface ProcessOnboardingParams {
  employeeId: string;
  action: ApprovalAction;
  reviewer: AuthTokenPayload;
  comments?: string;
}

export interface ProcessLeaveParams {
  leaveRequestId: string;
  action: "APPROVE" | "REJECT";
  reviewer: AuthTokenPayload;
  comments?: string;
}

/**
 * Retrieves the pending onboarding approvals visible to the current reviewer based on their tier/scope.
 */
export async function getPendingOnboardingApprovals(session: AuthTokenPayload) {
  const whereClause: any = {
    companyId: session.companyId,
  };

  if (session.role === Role.DEPARTMENT_ADMIN) {
    whereClause.departmentId = session.departmentId;
    whereClause.onboardingStatus = OnboardingStatus.PENDING_DEPT_APPROVAL;
  } else if (session.role === Role.BRANCH_ADMIN) {
    whereClause.branchId = session.branchId;
    whereClause.onboardingStatus = {
      in: [
        OnboardingStatus.PENDING_BRANCH_APPROVAL,
        OnboardingStatus.DEPT_APPROVED,
      ],
    };
  } else if (session.role === Role.TEAM_LEAD) {
    // Team lead sees candidates they drafted or within their team
    whereClause.createdById = session.sub;
  } else if (session.role === Role.COMPANY_ADMIN || session.role === Role.SUPER_ADMIN) {
    // Executive view: sees all non-active, non-rejected candidates
    whereClause.onboardingStatus = {
      in: [
        OnboardingStatus.PENDING_DEPT_APPROVAL,
        OnboardingStatus.DEPT_APPROVED,
        OnboardingStatus.PENDING_BRANCH_APPROVAL,
      ],
    };
  } else {
    return [];
  }

  return prisma.employee.findMany({
    where: whereClause,
    include: {
      branch: { select: { id: true, name: true, code: true } },
      department: { select: { id: true, name: true, code: true } },
      team: { select: { id: true, name: true } },
      designation: { select: { id: true, title: true } },
      createdBy: { select: { id: true, email: true } },
      approvalLogs: {
        include: {
          reviewer: {
            select: {
              id: true,
              email: true,
              role: true,
              employee: { select: { firstName: true, lastName: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Executes a 2-stage onboarding approval action with permission checks, state progression,
 * user provisioning, and audit log generation.
 */
export async function processOnboardingAction({
  employeeId,
  action,
  reviewer,
  comments,
}: ProcessOnboardingParams) {
  const employee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      companyId: reviewer.companyId,
    },
    include: {
      branch: true,
      department: true,
    },
  });

  if (!employee) {
    throw new Error("Employee candidate not found or does not belong to this organization.");
  }

  const isSuperOrCompanyAdmin =
    reviewer.role === Role.SUPER_ADMIN || reviewer.role === Role.COMPANY_ADMIN;

  // ==========================================
  // STAGE 1: DEPARTMENT REVIEW
  // ==========================================
  if (employee.onboardingStatus === OnboardingStatus.PENDING_DEPT_APPROVAL) {
    const isDeptAdminForCandidate =
      reviewer.role === Role.DEPARTMENT_ADMIN &&
      reviewer.departmentId === employee.departmentId;

    if (!isDeptAdminForCandidate && !isSuperOrCompanyAdmin) {
      throw new Error("Forbidden: Only the assigned Department Admin can conduct Stage 1 review.");
    }

    if (action === ApprovalAction.APPROVE) {
      const updated = await prisma.$transaction(async (tx) => {
        const emp = await tx.employee.update({
          where: { id: employee.id },
          data: {
            onboardingStatus: OnboardingStatus.PENDING_BRANCH_APPROVAL,
          },
        });

        await tx.employeeApprovalLog.create({
          data: {
            employeeId: employee.id,
            stage: ApprovalStage.DEPARTMENT_REVIEW,
            action: ApprovalAction.APPROVE,
            reviewerId: reviewer.sub,
            comments: comments || "Approved by Department Head.",
          },
        });

        return emp;
      });

      return {
        success: true,
        status: OnboardingStatus.PENDING_BRANCH_APPROVAL,
        stage: "DEPARTMENT_REVIEW",
        action: "APPROVE",
        employee: updated,
      };
    }

    if (action === ApprovalAction.REJECT) {
      const updated = await prisma.$transaction(async (tx) => {
        const emp = await tx.employee.update({
          where: { id: employee.id },
          data: {
            onboardingStatus: OnboardingStatus.REJECTED,
          },
        });

        await tx.employeeApprovalLog.create({
          data: {
            employeeId: employee.id,
            stage: ApprovalStage.DEPARTMENT_REVIEW,
            action: ApprovalAction.REJECT,
            reviewerId: reviewer.sub,
            comments: comments || "Rejected at Department stage.",
          },
        });

        return emp;
      });

      return {
        success: true,
        status: OnboardingStatus.REJECTED,
        stage: "DEPARTMENT_REVIEW",
        action: "REJECT",
        employee: updated,
      };
    }
  }

  // ==========================================
  // STAGE 2: BRANCH HR FINAL REVIEW & ACTIVATION
  // ==========================================
  if (
    employee.onboardingStatus === OnboardingStatus.PENDING_BRANCH_APPROVAL ||
    employee.onboardingStatus === OnboardingStatus.DEPT_APPROVED
  ) {
    const isBranchAdminForCandidate =
      reviewer.role === Role.BRANCH_ADMIN &&
      reviewer.branchId === employee.branchId;

    if (!isBranchAdminForCandidate && !isSuperOrCompanyAdmin) {
      throw new Error("Forbidden: Only the assigned Branch HR Admin can conduct final Stage 2 review.");
    }

    if (action === ApprovalAction.APPROVE) {
      const updated = await prisma.$transaction(async (tx) => {
        // 1. Activate Employee Record
        const emp = await tx.employee.update({
          where: { id: employee.id },
          data: {
            onboardingStatus: OnboardingStatus.ACTIVE,
            status: "ACTIVE",
          },
        });

        // 2. Provision User Account if not already existing
        let existingUser = await tx.user.findUnique({
          where: { email: employee.email },
        });

        if (!existingUser) {
          existingUser = await tx.user.create({
            data: {
              email: employee.email,
              passwordHash: "demo_hash_welcome_2026", // Default temporary credential
              role: Role.EMPLOYEE,
              companyId: employee.companyId,
            },
          });
        }

        if (emp.userId !== existingUser.id) {
          await tx.employee.update({
            where: { id: emp.id },
            data: { userId: existingUser.id },
          });
        }

        // 3. Create Default Annual and Sick Leave Allocations for current year
        const currentYear = new Date().getFullYear();
        const leaveTypes = await tx.leaveType.findMany({
          where: { companyId: employee.companyId },
        });

        for (const lt of leaveTypes) {
          await tx.leaveAllocation.upsert({
            where: {
              employeeId_leaveTypeId_year: {
                employeeId: emp.id,
                leaveTypeId: lt.id,
                year: currentYear,
              },
            },
            update: {},
            create: {
              employeeId: emp.id,
              leaveTypeId: lt.id,
              year: currentYear,
              allocatedDays: lt.defaultDays,
            },
          });
        }

        // 4. Log Branch Review Approval
        await tx.employeeApprovalLog.create({
          data: {
            employeeId: employee.id,
            stage: ApprovalStage.BRANCH_REVIEW,
            action: ApprovalAction.APPROVE,
            reviewerId: reviewer.sub,
            comments: comments || "Approved by Branch HR. User provisioned.",
          },
        });

        return emp;
      });

      return {
        success: true,
        status: OnboardingStatus.ACTIVE,
        stage: "BRANCH_REVIEW",
        action: "APPROVE",
        employee: updated,
      };
    }

    if (action === ApprovalAction.REJECT) {
      const updated = await prisma.$transaction(async (tx) => {
        const emp = await tx.employee.update({
          where: { id: employee.id },
          data: {
            onboardingStatus: OnboardingStatus.REJECTED,
          },
        });

        await tx.employeeApprovalLog.create({
          data: {
            employeeId: employee.id,
            stage: ApprovalStage.BRANCH_REVIEW,
            action: ApprovalAction.REJECT,
            reviewerId: reviewer.sub,
            comments: comments || "Rejected at Branch review stage.",
          },
        });

        return emp;
      });

      return {
        success: true,
        status: OnboardingStatus.REJECTED,
        stage: "BRANCH_REVIEW",
        action: "REJECT",
        employee: updated,
      };
    }
  }

  throw new Error(
    `Invalid state transition. Candidate is currently in status: ${employee.onboardingStatus}`
  );
}

/**
 * Handles Leave Request Approval / Rejection with balance calculations.
 */
export async function processLeaveAction({
  leaveRequestId,
  action,
  reviewer,
  comments,
}: ProcessLeaveParams) {
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveRequestId },
    include: {
      employee: true,
    },
  });

  if (!leave) {
    throw new Error("Leave request not found");
  }

  if (leave.employee.companyId !== reviewer.companyId) {
    throw new Error("Forbidden: Tenant mismatch.");
  }

  const currentYear = new Date(leave.startDate).getFullYear();

  return prisma.$transaction(async (tx) => {
    const newStatus = action === "APPROVE" ? LeaveStatus.APPROVED : LeaveStatus.REJECTED;

    const updatedLeave = await tx.leaveRequest.update({
      where: { id: leaveRequestId },
      data: {
        status: newStatus,
        approvedById: reviewer.sub,
        approvalComment: comments || `Actioned by ${reviewer.name || reviewer.role}`,
        actionedAt: new Date(),
      },
    });

    // Update Leave Allocation tracking
    const allocation = await tx.leaveAllocation.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: leave.employeeId,
          leaveTypeId: leave.leaveTypeId,
          year: currentYear,
        },
      },
    });

    if (allocation) {
      const days = Number(leave.totalDays);
      if (action === "APPROVE") {
        await tx.leaveAllocation.update({
          where: { id: allocation.id },
          data: {
            usedDays: { increment: days },
            pendingDays: { decrement: Math.min(allocation.pendingDays, days) },
          },
        });
      } else {
        await tx.leaveAllocation.update({
          where: { id: allocation.id },
          data: {
            pendingDays: { decrement: Math.min(allocation.pendingDays, days) },
          },
        });
      }
    }

    return updatedLeave;
  });
}
