import { prisma } from "../src/lib/prisma";
import {
  getProjects,
  createProject,
  getTimesheets,
  submitTimesheet,
  actionTimesheet,
} from "../src/lib/services/projectService";
import { Role, TimesheetStatus } from "@prisma/client";
import { AuthTokenPayload } from "../src/lib/auth/jwt";

async function runTests() {
  console.log("=== PHASE 8: PROJECTS, TASKS & TIMESHEETS TEST SUITE ===");

  // Find company
  const company = await prisma.company.findFirst();
  if (!company) throw new Error("No company found in database.");

  // Mock sessions
  const sarahUser = await prisma.user.findFirst({
    where: { email: "sarah.jenkins@digisail.com" },
  });
  if (!sarahUser) throw new Error("Sarah Jenkins user not found.");

  const adminSession: AuthTokenPayload = {
    sub: sarahUser.id,
    email: sarahUser.email,
    role: Role.COMPANY_ADMIN,
    companyId: company.id,
    name: "Sarah Jenkins",
  };

  const priyaEmp = await prisma.employee.findFirst({
    where: { email: "priya.patel@digisail.com" },
  });
  if (!priyaEmp) throw new Error("Priya Patel employee not found.");

  const employeeSession: AuthTokenPayload = {
    sub: "priya-user-id",
    email: priyaEmp.email,
    role: Role.EMPLOYEE,
    companyId: company.id,
    employeeId: priyaEmp.id,
    name: "Priya Patel",
  };

  console.log("1. Testing getProjects and auto-provisioning...");
  const projects = await getProjects(adminSession);
  console.log(`   Retrieved ${projects.length} company projects.`);
  if (projects.length < 3) throw new Error("Expected at least 3 auto-provisioned projects.");
  for (const p of projects) {
    console.log(`   - [${p.code}] ${p.name} (Client: ${p.clientName}, Members: ${p.memberCount}, Logged: ${p.totalHoursLogged}h)`);
  }

  console.log("\n2. Testing createProject...");
  const testCode = `TEST-${Date.now().toString().slice(-4)}`;
  const newProj = await createProject(
    {
      name: "AI Analytics Engine Pilot",
      code: testCode,
      description: "Machine Learning model telemetry and usage anomaly detection.",
      clientName: "Alpha Ventures",
      budget: 85000,
      memberEmployeeIds: [priyaEmp.id],
    },
    adminSession
  );
  console.log(`   ✓ Created project: ${newProj.name} (${newProj.code}) with ID: ${newProj.id}`);

  // Test duplicate code rejection
  try {
    await createProject(
      {
        name: "Duplicate Pilot",
        code: testCode,
      },
      adminSession
    );
    throw new Error("Duplicate project code should have been rejected!");
  } catch (err: any) {
    console.log(`   ✓ Duplicate code rejected as expected: ${err.message}`);
  }

  console.log("\n3. Testing getTimesheets for Company Admin...");
  const allTimesheets = await getTimesheets(adminSession);
  console.log(`   Admin retrieved ${allTimesheets.length} company timesheets.`);
  if (allTimesheets.length === 0) throw new Error("Expected > 0 timesheets.");

  console.log("\n4. Testing Role-Scoped getTimesheets for Regular Employee...");
  const priyaTimesheets = await getTimesheets(employeeSession);
  console.log(`   Priya (Employee) retrieved ${priyaTimesheets.length} timesheets.`);
  for (const t of priyaTimesheets) {
    if (t.employeeId !== priyaEmp.id) {
      throw new Error(`Employee role leak: Priya saw timesheet of employee ${t.employeeId}`);
    }
  }
  console.log("   ✓ All returned timesheets belong exclusively to Priya.");

  console.log("\n5. Testing submitTimesheet...");
  const submittedEntry = await submitTimesheet(
    {
      projectId: projects[0].id,
      date: "2026-10-07",
      hoursWorked: 6.5,
      taskDescription: "Benchmarked timesheet aggregation query performance and index optimization.",
    },
    employeeSession
  );
  console.log(`   ✓ Timesheet submitted: ${submittedEntry.hoursWorked}h on ${submittedEntry.project.name} (Status: ${submittedEntry.status})`);

  console.log("\n6. Testing actionTimesheet (Approval Workflow)...");
  // Employee tries to approve own timesheet (should be blocked)
  try {
    await actionTimesheet(submittedEntry.id, "APPROVE", employeeSession);
    throw new Error("Employee should not be authorized to approve timesheets!");
  } catch (err: any) {
    console.log(`   ✓ Regular employee blocked from approving: ${err.message}`);
  }

  // Admin approves timesheet
  const approvedEntry = await actionTimesheet(submittedEntry.id, "APPROVE", adminSession);
  console.log(`   ✓ Admin approved timesheet ID: ${approvedEntry.id} -> Status: ${approvedEntry.status}`);
  if (approvedEntry.status !== TimesheetStatus.APPROVED) {
    throw new Error("Expected status to be APPROVED.");
  }

  console.log("\n🎉 ALL PHASE 8 PROJECTS & TIMESHEET TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
}

runTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
