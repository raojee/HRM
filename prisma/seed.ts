import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import {
  Role,
  EmploymentType,
  EmployeeStatus,
  OnboardingStatus,
  ApprovalStage,
  ApprovalAction,
} from "@prisma/client";

async function main() {
  console.log("Seeding DigiSailHRM Phase 1 Multi-Tier SaaS Hierarchy...");

  // 1. Company (Tenant)
  const company = await prisma.company.upsert({
    where: { id: "digisail-company-1" },
    update: {},
    create: {
      id: "digisail-company-1",
      name: "DigiSail Global Inc.",
      legalName: "DigiSail Technologies, Inc.",
      currency: "USD",
      timezone: "America/New_York",
      website: "https://digisail.com",
    },
  });

  // 2. Super Admin (Platform Owner)
  await prisma.user.upsert({
    where: { email: "superadmin@digisail.com" },
    update: {},
    create: {
      email: "superadmin@digisail.com",
      passwordHash: "demo_hash_superadmin_2026",
      role: Role.SUPER_ADMIN,
      companyId: company.id,
    },
  });

  // 3. Company HR Admin (Tenant Executive)
  const companyAdminUser = await prisma.user.upsert({
    where: { email: "sarah.jenkins@digisail.com" },
    update: { role: Role.COMPANY_ADMIN },
    create: {
      email: "sarah.jenkins@digisail.com",
      passwordHash: "demo_hash_company_admin_2026",
      role: Role.COMPANY_ADMIN,
      companyId: company.id,
    },
  });

  // 4. Branch HR Admin User
  const branchAdminUser = await prisma.user.upsert({
    where: { email: "michael.scott@digisail.com" },
    update: { role: Role.BRANCH_ADMIN },
    create: {
      email: "michael.scott@digisail.com",
      passwordHash: "demo_hash_branch_admin_2026",
      role: Role.BRANCH_ADMIN,
      companyId: company.id,
    },
  });

  // 5. Branch (Created by Company HR)
  const nyBranch = await prisma.branch.upsert({
    where: { companyId_code: { companyId: company.id, code: "HQ-NYC" } },
    update: { branchAdminId: branchAdminUser.id },
    create: {
      name: "New York Headquarters",
      code: "HQ-NYC",
      city: "New York",
      country: "United States",
      timezone: "America/New_York",
      companyId: company.id,
      branchAdminId: branchAdminUser.id,
    },
  });

  // 6. Department Admin User (Engineering Head)
  const deptAdminUser = await prisma.user.upsert({
    where: { email: "alex.chen@digisail.com" },
    update: { role: Role.DEPARTMENT_ADMIN },
    create: {
      email: "alex.chen@digisail.com",
      passwordHash: "demo_hash_dept_admin_2026",
      role: Role.DEPARTMENT_ADMIN,
      companyId: company.id,
    },
  });

  // 7. Department (Created by Branch HR inside NY Branch)
  let engDept = await prisma.department.findFirst({
    where: { code: "ENG", companyId: company.id },
  });

  if (engDept) {
    engDept = await prisma.department.update({
      where: { id: engDept.id },
      data: { branchId: nyBranch.id, deptAdminId: deptAdminUser.id },
    });
  } else {
    engDept = await prisma.department.create({
      data: {
        name: "Engineering",
        code: "ENG",
        description: "Core Software Architecture & Infrastructure",
        companyId: company.id,
        branchId: nyBranch.id,
        deptAdminId: deptAdminUser.id,
      },
    });
  }

  // 8. Team Lead User
  const teamLeadUser = await prisma.user.upsert({
    where: { email: "david.miller@digisail.com" },
    update: { role: Role.TEAM_LEAD },
    create: {
      email: "david.miller@digisail.com",
      passwordHash: "demo_hash_team_lead_2026",
      role: Role.TEAM_LEAD,
      companyId: company.id,
    },
  });

  // 9. Team (Created by Department Admin inside Engineering)
  const coreTeam = await prisma.team.upsert({
    where: { departmentId_code: { departmentId: engDept.id, code: "ENG-CORE" } },
    update: { teamLeadId: teamLeadUser.id },
    create: {
      name: "Core Platform & Cloud Team",
      code: "ENG-CORE",
      description: "Distributed Systems & Cloud Backend",
      departmentId: engDept.id,
      teamLeadId: teamLeadUser.id,
    },
  });

  // 10. Designations
  const archDesig = await prisma.designation.upsert({
    where: { companyId_code: { companyId: company.id, code: "ENG-ARCH" } },
    update: {},
    create: {
      title: "Principal Architect",
      code: "ENG-ARCH",
      companyId: company.id,
    },
  });

  const devDesig = await prisma.designation.upsert({
    where: { companyId_code: { companyId: company.id, code: "ENG-DEV" } },
    update: {},
    create: {
      title: "Senior Fullstack Engineer",
      code: "ENG-DEV",
      companyId: company.id,
    },
  });

  // 11. Active Employee (Alex Chen)
  await prisma.employee.upsert({
    where: { email: "alex.chen@digisail.com" },
    update: {
      branchId: nyBranch.id,
      departmentId: engDept.id,
      onboardingStatus: OnboardingStatus.ACTIVE,
    },
    create: {
      employeeNumber: "DS-002",
      firstName: "Alexander",
      lastName: "Chen",
      email: "alex.chen@digisail.com",
      phone: "+1 (555) 345-6789",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      companyId: company.id,
      branchId: nyBranch.id,
      departmentId: engDept.id,
      designationId: archDesig.id,
      userId: deptAdminUser.id,
      employmentType: EmploymentType.FULL_TIME,
      status: EmployeeStatus.ACTIVE,
      onboardingStatus: OnboardingStatus.ACTIVE,
      baseSalary: 145000,
      currency: "USD",
    },
  });

  // 12. Candidate A: Proposed by Team Lead (David Miller) -> PENDING_DEPT_APPROVAL
  const candidateA = await prisma.employee.upsert({
    where: { email: "liam.oc@digisail.com" },
    update: {
      branchId: nyBranch.id,
      departmentId: engDept.id,
      teamId: coreTeam.id,
      onboardingStatus: OnboardingStatus.PENDING_DEPT_APPROVAL,
    },
    create: {
      employeeNumber: "DS-006",
      firstName: "Liam",
      lastName: "O'Connor",
      email: "liam.oc@digisail.com",
      phone: "+1 (555) 789-0123",
      avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
      companyId: company.id,
      branchId: nyBranch.id,
      departmentId: engDept.id,
      teamId: coreTeam.id,
      designationId: devDesig.id,
      createdById: teamLeadUser.id,
      employmentType: EmploymentType.FULL_TIME,
      status: EmployeeStatus.PROBATION,
      onboardingStatus: OnboardingStatus.PENDING_DEPT_APPROVAL,
      baseSalary: 105000,
      currency: "USD",
    },
  });

  // 13. Candidate B: Approved by Dept Admin -> PENDING_BRANCH_APPROVAL
  const candidateB = await prisma.employee.upsert({
    where: { email: "sophia.m@digisail.com" },
    update: {
      branchId: nyBranch.id,
      departmentId: engDept.id,
      teamId: coreTeam.id,
      onboardingStatus: OnboardingStatus.PENDING_BRANCH_APPROVAL,
    },
    create: {
      employeeNumber: "DS-007",
      firstName: "Sophia",
      lastName: "Martinez",
      email: "sophia.m@digisail.com",
      phone: "+1 (555) 998-1122",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
      companyId: company.id,
      branchId: nyBranch.id,
      departmentId: engDept.id,
      teamId: coreTeam.id,
      designationId: devDesig.id,
      createdById: teamLeadUser.id,
      employmentType: EmploymentType.FULL_TIME,
      status: EmployeeStatus.PROBATION,
      onboardingStatus: OnboardingStatus.PENDING_BRANCH_APPROVAL,
      baseSalary: 112000,
      currency: "USD",
    },
  });

  // Record Stage 1 Approval Log for Candidate B
  await prisma.employeeApprovalLog.create({
    data: {
      employeeId: candidateB.id,
      stage: ApprovalStage.DEPARTMENT_REVIEW,
      action: ApprovalAction.APPROVE,
      reviewerId: deptAdminUser.id,
      comments: "Technical interview passed with top score. Engineering Dept recommends immediate onboarding.",
    },
  });

  console.log("Multi-Tier Hierarchy seeded successfully on Neon!");
  console.log("👑 Platform Super Admin: superadmin@digisail.com");
  console.log("🏢 Company HR Admin:     sarah.jenkins@digisail.com");
  console.log("📍 Branch HR Admin:      michael.scott@digisail.com (Branch: HQ-NYC)");
  console.log("📁 Department Admin:     alex.chen@digisail.com (Dept: Engineering)");
  console.log("👤 Team Lead:            david.miller@digisail.com (Team: Core Platform)");
  console.log("⏳ Candidate Liam:       PENDING_DEPT_APPROVAL (Awaiting Alex Chen)");
  console.log("⏳ Candidate Sophia:     PENDING_BRANCH_APPROVAL (Awaiting Michael Scott)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
