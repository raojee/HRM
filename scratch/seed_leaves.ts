import { prisma } from "../src/lib/prisma";
import { LeaveStatus } from "@prisma/client";

async function main() {
  const company = await prisma.company.findFirst();
  if (!company) return;

  const annualType = await prisma.leaveType.findFirst({
    where: { companyId: company.id, code: "ANNUAL" }
  });
  const sickType = await prisma.leaveType.findFirst({
    where: { companyId: company.id, code: "SICK" }
  });
  const casualType = await prisma.leaveType.findFirst({
    where: { companyId: company.id, code: "CASUAL" }
  });

  const alexEmp = await prisma.employee.findFirst({ where: { email: "alex.chen@digisail.com" } });
  const sophiaEmp = await prisma.employee.findFirst({ where: { email: "sophia.m@digisail.com" } });
  const liamEmp = await prisma.employee.findFirst({ where: { email: "liam.oc@digisail.com" } });
  const priyaEmp = await prisma.employee.findFirst({ where: { email: "priya.patel@digisail.com" } });

  const currentYear = 2026;

  // Ensure allocations for Priya Patel
  if (priyaEmp && annualType && sickType && casualType) {
    await prisma.leaveAllocation.upsert({
      where: { employeeId_leaveTypeId_year: { employeeId: priyaEmp.id, leaveTypeId: annualType.id, year: currentYear } },
      update: {},
      create: { employeeId: priyaEmp.id, leaveTypeId: annualType.id, year: currentYear, allocatedDays: 14, usedDays: 2, pendingDays: 3 }
    });
    await prisma.leaveAllocation.upsert({
      where: { employeeId_leaveTypeId_year: { employeeId: priyaEmp.id, leaveTypeId: sickType.id, year: currentYear } },
      update: {},
      create: { employeeId: priyaEmp.id, leaveTypeId: sickType.id, year: currentYear, allocatedDays: 10, usedDays: 1, pendingDays: 0 }
    });
    await prisma.leaveAllocation.upsert({
      where: { employeeId_leaveTypeId_year: { employeeId: priyaEmp.id, leaveTypeId: casualType.id, year: currentYear } },
      update: {},
      create: { employeeId: priyaEmp.id, leaveTypeId: casualType.id, year: currentYear, allocatedDays: 7, usedDays: 0, pendingDays: 0 }
    });

    // Sample pending request for Priya
    const existingPriyaLeave = await prisma.leaveRequest.findFirst({ where: { employeeId: priyaEmp.id } });
    if (!existingPriyaLeave) {
      await prisma.leaveRequest.create({
        data: {
          employeeId: priyaEmp.id,
          leaveTypeId: annualType.id,
          startDate: new Date("2026-10-14"),
          endDate: new Date("2026-10-16"),
          totalDays: 3,
          reason: "Family travel and attendance at Tech Leaders Conference.",
          status: LeaveStatus.PENDING,
        }
      });
    }
  }

  // Ensure allocations for Sophia Martinez
  if (sophiaEmp && sickType) {
    const existingSophiaLeave = await prisma.leaveRequest.findFirst({ where: { employeeId: sophiaEmp.id } });
    if (!existingSophiaLeave) {
      await prisma.leaveRequest.create({
        data: {
          employeeId: sophiaEmp.id,
          leaveTypeId: sickType.id,
          startDate: new Date("2026-10-19"),
          endDate: new Date("2026-10-20"),
          totalDays: 2,
          reason: "Doctor consultation and medical recovery.",
          status: LeaveStatus.PENDING,
        }
      });
    }
  }

  console.log("Sample leave allocations and requests seeded successfully!");
}

main().finally(() => prisma.$disconnect());
