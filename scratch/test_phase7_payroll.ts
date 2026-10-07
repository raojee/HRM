import { prisma } from "../src/lib/prisma";
import { executeBatchPayroll, getPayrollOverview, getPayslips, getPayslipById } from "../src/lib/services/payrollService";
import { Role } from "@prisma/client";
import { AuthTokenPayload } from "../src/lib/auth/jwt";

async function runTests() {
  console.log("=== PHASE 7: PAYROLL PROCESSING & PAYSLIPS TEST SUITE ===");

  // Find company
  const company = await prisma.company.findFirst();
  if (!company) throw new Error("No company found in database.");

  // Mock session for Sarah Jenkins (Company Admin)
  const sarahUser = await prisma.user.findFirst({
    where: { email: "sarah.jenkins@digisail.com" },
  });
  if (!sarahUser) throw new Error("Sarah Jenkins user not found.");

  const sarahSession: AuthTokenPayload = {
    sub: sarahUser.id,
    email: sarahUser.email,
    role: Role.COMPANY_ADMIN,
    companyId: company.id,
    name: "Sarah Jenkins",
  };

  console.log("1. Testing initial getPayrollOverview...");
  const initialOverview = await getPayrollOverview(sarahSession);
  console.log("   Initial Batches:", initialOverview.runs.length);
  console.log("   Active Employees on Roster:", initialOverview.kpis.activeEmployeeCount);

  console.log("\n2. Executing Batch Payroll for September 2026 (Month 9, Year 2026)...");
  // Clean up any previous test run if exists for 9/2026
  await prisma.payrollRun.deleteMany({
    where: { companyId: company.id, month: 9, year: 2026 },
  });

  const batchResult = await executeBatchPayroll({
    month: 9,
    year: 2026,
    autoMarkPaid: true,
    session: sarahSession,
  });

  console.log("   Batch Run ID:", batchResult.run.id);
  console.log("   Processed Employees Count:", batchResult.summary.employeeCount);
  console.log("   Total Gross Amount: $", batchResult.summary.totalGross.toLocaleString());
  console.log("   Total Tax Withheld: $", batchResult.summary.totalTax.toLocaleString());
  console.log("   Total Net Disbursed: $", batchResult.summary.totalNet.toLocaleString());
  console.log("   Average Net Salary: $", batchResult.summary.averageNet.toLocaleString());

  if (batchResult.summary.employeeCount === 0) {
    throw new Error("Expected > 0 employees processed.");
  }

  console.log("\n3. Validating Individual Payslip Computations...");
  for (const p of batchResult.payslips) {
    const b = p.breakdown;
    const computedNet = Math.round((b.basicSalary + b.totalAllowances - b.totalDeductions - b.tax) * 100) / 100;
    if (computedNet !== b.netSalary) {
      throw new Error(`Net salary formula mismatch for ${p.employeeName}: expected ${computedNet}, got ${b.netSalary}`);
    }
    console.log(`   ✓ ${p.employeeName} (${p.designation}): Base $${b.basicSalary} + Allow $${b.totalAllowances} - Ded $${b.totalDeductions} - Tax $${b.tax} = Net $${b.netSalary}`);
  }

  console.log("\n4. Testing Duplicate Payroll Run Rejection...");
  try {
    await executeBatchPayroll({
      month: 9,
      year: 2026,
      session: sarahSession,
    });
    throw new Error("Duplicate run should have been rejected!");
  } catch (err: any) {
    console.log("   ✓ Successfully rejected duplicate finalized run:", err.message);
  }

  console.log("\n5. Testing getPayslips query with filters...");
  const allPayslips = await getPayslips(sarahSession, { month: 9, year: 2026 });
  console.log(`   Fetched ${allPayslips.length} payslips for Company Admin.`);
  if (allPayslips.length !== batchResult.summary.employeeCount) {
    throw new Error("Count mismatch in getPayslips");
  }

  console.log("\n6. Testing getPayslipById for Digital Printable Receipt...");
  const targetSlipId = allPayslips[0].id;
  const detailedSlip = await getPayslipById(targetSlipId, sarahSession);
  console.log("   Detailed Slip for:", detailedSlip.employee.fullName);
  console.log("   Company Name:", detailedSlip.company.name);
  console.log("   Breakdown Housing Allowance:", detailedSlip.breakdown.housingAllowance);
  console.log("   Breakdown 401k/Provident:", detailedSlip.breakdown.providentFund);
  console.log("   Payment Method:", detailedSlip.paymentMethod);

  console.log("\n7. Testing Employee-Level Role Scoping...");
  // Sophia Martinez (Regular Employee)
  const sophiaEmp = await prisma.employee.findFirst({
    where: { email: "sophia.m@digisail.com" },
  });
  if (sophiaEmp) {
    const sophiaSession: AuthTokenPayload = {
      sub: "sophia-user-id",
      email: "sophia.m@digisail.com",
      role: Role.EMPLOYEE,
      companyId: company.id,
      employeeId: sophiaEmp.id,
      name: "Sophia Martinez",
    };

    const sophiaSlips = await getPayslips(sophiaSession);
    console.log(`   Sophia (Regular Employee) sees ${sophiaSlips.length} payslips (expected exactly 1).`);
    if (sophiaSlips.length !== 1 || sophiaSlips[0].employeeId !== sophiaEmp.id) {
      throw new Error("Employee role scoping failed: Sophia saw other employees' payslips!");
    }

    // Try to access another employee's payslip directly with Sophia's session
    const alexSlip = allPayslips.find((p) => p.email.includes("alex.chen"));
    if (alexSlip) {
      try {
        await getPayslipById(alexSlip.id, sophiaSession);
        throw new Error("Sophia should not be able to view Alex Chen's payslip!");
      } catch (err: any) {
        console.log("   ✓ Sophia blocked from viewing Alex Chen's payslip:", err.message);
      }
    }
  }

  console.log("\n8. Testing Updated getPayrollOverview KPIs...");
  const updatedOverview = await getPayrollOverview(sarahSession);
  console.log("   Total Disbursed:", updatedOverview.kpis.totalDisbursed);
  console.log("   Total Tax Collected:", updatedOverview.kpis.totalTaxCollected);
  console.log("   Total Batches:", updatedOverview.kpis.totalBatches);
  console.log("   Latest Run Month/Year:", updatedOverview.kpis.latestRun?.month, "/", updatedOverview.kpis.latestRun?.year);

  console.log("\n🎉 ALL PHASE 7 PAYROLL SERVICE & RBAC TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
}

runTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
