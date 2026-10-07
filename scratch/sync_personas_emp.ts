import { prisma } from "../src/lib/prisma";
import { Role, EmploymentType, EmployeeStatus, OnboardingStatus } from "@prisma/client";

async function main() {
  const company = await prisma.company.findFirst();
  if (!company) return;
  const branch = await prisma.branch.findFirst();
  const department = await prisma.department.findFirst();
  const designation = await prisma.designation.findFirst();

  // 1. Link Alex Chen
  const alexUser = await prisma.user.findUnique({ where: { email: "alex.chen@digisail.com" } });
  if (alexUser) {
    await prisma.employee.updateMany({
      where: { email: "alex.chen@digisail.com" },
      data: { userId: alexUser.id }
    });
  }

  // 2. Ensure Michael Scott (Branch HR) has employee record
  const michaelUser = await prisma.user.findUnique({ where: { email: "michael.scott@digisail.com" } });
  if (michaelUser) {
    await prisma.employee.upsert({
      where: { email: "michael.scott@digisail.com" },
      update: { userId: michaelUser.id },
      create: {
        employeeNumber: "DS-003",
        firstName: "Michael",
        lastName: "Scott",
        email: "michael.scott@digisail.com",
        phone: "+1 (555) 234-5678",
        avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
        companyId: company.id,
        branchId: branch?.id,
        departmentId: department?.id,
        designationId: designation?.id,
        userId: michaelUser.id,
        employmentType: EmploymentType.FULL_TIME,
        status: EmployeeStatus.ACTIVE,
        onboardingStatus: OnboardingStatus.ACTIVE,
        baseSalary: 95000,
        currency: "USD",
      }
    });
  }

  // 3. Ensure David Miller (Team Lead) has employee record
  const davidUser = await prisma.user.findUnique({ where: { email: "david.miller@digisail.com" } });
  if (davidUser) {
    await prisma.employee.upsert({
      where: { email: "david.miller@digisail.com" },
      update: { userId: davidUser.id },
      create: {
        employeeNumber: "DS-004",
        firstName: "David",
        lastName: "Miller",
        email: "david.miller@digisail.com",
        phone: "+1 (555) 456-7890",
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
        companyId: company.id,
        branchId: branch?.id,
        departmentId: department?.id,
        designationId: designation?.id,
        userId: davidUser.id,
        employmentType: EmploymentType.FULL_TIME,
        status: EmployeeStatus.ACTIVE,
        onboardingStatus: OnboardingStatus.ACTIVE,
        baseSalary: 110000,
        currency: "USD",
      }
    });
  }

  // 4. Ensure Priya Patel (Employee demo persona) exists with user & employee
  let priyaUser = await prisma.user.findUnique({ where: { email: "priya.patel@digisail.com" } });
  if (!priyaUser) {
    priyaUser = await prisma.user.create({
      data: {
        email: "priya.patel@digisail.com",
        passwordHash: "demo_hash_priya_2026",
        role: Role.EMPLOYEE,
        companyId: company.id,
      }
    });
  }

  await prisma.employee.upsert({
    where: { email: "priya.patel@digisail.com" },
    update: { userId: priyaUser.id },
    create: {
      employeeNumber: "DS-005",
      firstName: "Priya",
      lastName: "Patel",
      email: "priya.patel@digisail.com",
      phone: "+1 (555) 567-8901",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
      companyId: company.id,
      branchId: branch?.id,
      departmentId: department?.id,
      designationId: designation?.id,
      userId: priyaUser.id,
      employmentType: EmploymentType.FULL_TIME,
      status: EmployeeStatus.ACTIVE,
      onboardingStatus: OnboardingStatus.ACTIVE,
      baseSalary: 105000,
      currency: "USD",
    }
  });

  console.log("All personas successfully synchronized with Neon Employee records!");
}

main().finally(() => prisma.$disconnect());
