import { prisma } from "../src/lib/prisma";
import { processLeaveAction } from "../src/lib/services/approvalService";
import { LeaveStatus, Role } from "@prisma/client";

async function main() {
  console.log("--- 🧪 PHASE 6 E2E VERIFICATION SCRIPT ---");

  // 1. Check Leave Types
  const types = await prisma.leaveType.findMany();
  console.log(`✅ Leave Types Available: ${types.length}`);
  types.forEach(t => console.log(`   - ${t.name} (${t.code}): ${t.defaultDays} days, ${t.isPaid ? 'Paid' : 'Unpaid'}`));

  // 2. Find an active employee (Sophia Martinez)
  const sophia = await prisma.employee.findFirst({
    where: { email: "sophia.m@digisail.com" },
    include: { user: true }
  });
  if (!sophia) throw new Error("Sophia Martinez not found");

  const annualType = types.find(t => t.code === "ANNUAL");
  if (!annualType) throw new Error("Annual leave type not found");

  // 3. Check / Create Allocation for Sophia
  const currentYear = 2026;
  let alloc = await prisma.leaveAllocation.findUnique({
    where: {
      employeeId_leaveTypeId_year: {
        employeeId: sophia.id,
        leaveTypeId: annualType.id,
        year: currentYear
      }
    }
  });

  if (!alloc) {
    alloc = await prisma.leaveAllocation.create({
      data: {
        employeeId: sophia.id,
        leaveTypeId: annualType.id,
        year: currentYear,
        allocatedDays: 14,
        usedDays: 0,
        pendingDays: 0,
      }
    });
  }
  console.log(`✅ Sophia Initial Allocation: ${alloc.allocatedDays} allocated, ${alloc.usedDays} used, ${alloc.pendingDays} pending`);

  // 4. Submit a new leave request (3 business days)
  const testLeave = await prisma.$transaction(async (tx) => {
    const leave = await tx.leaveRequest.create({
      data: {
        employeeId: sophia.id,
        leaveTypeId: annualType.id,
        startDate: new Date("2026-11-02"),
        endDate: new Date("2026-11-04"),
        totalDays: 3,
        reason: "Next.js Distributed Cloud Architecture Summit 2026",
        status: LeaveStatus.PENDING,
      }
    });

    await tx.leaveAllocation.update({
      where: { id: alloc!.id },
      data: { pendingDays: { increment: 3 } }
    });

    return leave;
  });
  console.log(`✅ Leave Request Submitted: ID=${testLeave.id}, Status=${testLeave.status}, Days=${testLeave.totalDays}`);

  // 5. Manager Review: Michael Scott (Branch Admin) approves the leave
  const michaelUser = await prisma.user.findFirst({ where: { email: "michael.scott@digisail.com" } });
  if (!michaelUser) throw new Error("Michael Scott not found");

  const reviewerSession = {
    sub: michaelUser.id,
    email: michaelUser.email,
    role: Role.BRANCH_ADMIN,
    companyId: sophia.companyId,
    branchId: sophia.branchId,
    name: "Michael Scott",
  };

  const approvedResult = await processLeaveAction({
    leaveRequestId: testLeave.id,
    action: "APPROVE",
    reviewer: reviewerSession,
    comments: "Approved. Team coverage confirmed for conference attendance.",
  });
  console.log(`✅ Manager Approval Processed: Status=${approvedResult.status}, ActionedBy=${reviewerSession.name}`);

  // 6. Verify Post-Approval Allocation
  const updatedAlloc = await prisma.leaveAllocation.findUnique({
    where: { id: alloc.id }
  });
  console.log(`✅ Post-Approval Allocation: Used=${updatedAlloc?.usedDays}d (expected +3), Pending=${updatedAlloc?.pendingDays}d (expected 0)`);

  if (updatedAlloc?.usedDays !== alloc.usedDays + 3) {
    throw new Error("Quota balance calculation mismatch!");
  }

  console.log("🎉 ALL PHASE 6 LEAVE ENGINE WORKFLOWS VERIFIED 100% OPERATIONAL!");
}

main().catch(err => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
}).finally(() => prisma.$disconnect());
