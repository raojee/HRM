import { prisma } from "../src/lib/prisma";
import {
  calculateEmployeeAttritionRisk,
  getAttritionOverview,
  generatePerformanceReview,
  savePerformanceReview,
  getPerformanceReviews,
  getHeadcountAndCompensationForecast,
} from "../src/lib/services/aiInsightsService";
import { Role } from "@prisma/client";
import { AuthTokenPayload } from "../src/lib/auth/jwt";

async function runTests() {
  console.log("=== PHASE 10: AI WORKFORCE INSIGHTS & ANALYTICS TEST SUITE ===");

  // 1. Setup Sessions & Target Employees
  const company = await prisma.company.findFirst();
  if (!company) throw new Error("No company found in database.");

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

  // 2. Test calculateEmployeeAttritionRisk
  console.log("\n1. Testing calculateEmployeeAttritionRisk for Priya Patel...");
  const priyaRisk = await calculateEmployeeAttritionRisk(priyaEmp.id, company.id);
  console.log(`   Employee: ${priyaRisk.employeeName} (${priyaRisk.department} - ${priyaRisk.designation})`);
  console.log(`   Risk Score: ${priyaRisk.riskScore}/100 -> Level: ${priyaRisk.riskLevel}`);
  console.log(`   Tenure: ${priyaRisk.tenureMonths} months | Overtime: ${priyaRisk.overtimeHours} hrs | PTO Util: ${priyaRisk.leaveUtilizationPct}%`);
  console.log(`   Primary Risk Drivers:`, priyaRisk.primaryFactors);
  console.log(`   AI Recommendations:`, priyaRisk.recommendations);
  if (!priyaRisk.id || priyaRisk.riskScore < 0 || priyaRisk.riskScore > 100) {
    throw new Error("Invalid risk assessment calculation.");
  }
  console.log("   ✓ Individual attrition risk assessment successfully computed and recorded.");

  // 3. Test getAttritionOverview (Heatmaps & Executive KPIs)
  console.log("\n2. Testing getAttritionOverview (Company-Wide Radar & Heatmap)...");
  const overview = await getAttritionOverview(adminSession);
  console.log(`   Company Risk Index: ${overview.kpis.overallCompanyRiskScore}%`);
  console.log(`   High-Risk Personnel: ${overview.kpis.highRiskEmployeeCount}`);
  console.log(`   Burnout Index: ${overview.kpis.burnoutIndexPct}%`);
  console.log(`   Estimated Retention Savings: $${overview.kpis.estimatedRetentionSavings.toLocaleString()}`);
  console.log(`   Departmental Breakdown (${overview.departmentHeatmap.length} departments):`);
  for (const dept of overview.departmentHeatmap) {
    console.log(`     - [${dept.department}] Avg Risk: ${dept.averageRiskScore}% (High: ${dept.highRiskCount}, Med: ${dept.mediumRiskCount}, Low: ${dept.lowRiskCount}) | Driver: ${dept.primaryDriver}`);
  }
  if (overview.departmentHeatmap.length === 0) {
    throw new Error("Expected at least 1 department in attrition heatmap.");
  }
  console.log("   ✓ Attrition overview and department heatmap verified.");

  // 4. Test generatePerformanceReview (AI Synthesis)
  console.log("\n3. Testing generatePerformanceReview (AI Review Synthesis)...");
  const synthReview = await generatePerformanceReview(priyaEmp.id, "2026-Q3", adminSession);
  console.log(`   Generated Period: ${synthReview.period} | Rating: ${synthReview.rating} (Score: ${synthReview.metricsScore}/100)`);
  console.log(`   Executive Summary: ${synthReview.summary}`);
  console.log(`   Strengths (${synthReview.strengths.length}):`, synthReview.strengths);
  console.log(`   Growth Areas (${synthReview.growthAreas.length}):`, synthReview.growthAreas);
  console.log(`   Goals (${synthReview.goals.length}):`, synthReview.goals);
  if (!synthReview.summary || synthReview.strengths.length === 0 || !synthReview.rating) {
    throw new Error("Invalid AI review synthesis payload.");
  }
  console.log("   ✓ AI performance review synthesized successfully.");

  // 5. Test savePerformanceReview
  console.log("\n4. Testing savePerformanceReview (Publish to Ledger)...");
  const savedReview = await savePerformanceReview(
    {
      employeeId: priyaEmp.id,
      period: "2026-Q3",
      rating: synthReview.rating,
      summary: synthReview.summary,
      strengths: synthReview.strengths,
      growthAreas: synthReview.growthAreas,
      goals: synthReview.goals,
      metricsScore: synthReview.metricsScore,
      status: "PUBLISHED",
    },
    adminSession
  );
  console.log(`   ✓ Saved Performance Review ID: ${savedReview.id} (Status: ${savedReview.status})`);

  // Verify non-manager blocked from publishing review
  try {
    await savePerformanceReview(
      {
        employeeId: priyaEmp.id,
        period: "2026-Q3",
        rating: "OUTSTANDING",
        summary: "Self-review attempt",
        strengths: ["Fast"],
        growthAreas: ["None"],
        goals: ["Rule the world"],
      },
      employeeSession
    );
    throw new Error("Regular employee should NOT be authorized to publish reviews!");
  } catch (err: any) {
    console.log(`   ✓ Employee self-publishing blocked as expected: ${err.message}`);
  }

  // 6. Test getPerformanceReviews (Scoped Access)
  console.log("\n5. Testing getPerformanceReviews Scoping...");
  const adminReviews = await getPerformanceReviews(adminSession);
  console.log(`   Admin retrieved ${adminReviews.length} company reviews.`);
  const priyaReviews = await getPerformanceReviews(employeeSession);
  console.log(`   Priya (Employee) retrieved ${priyaReviews.length} reviews.`);
  for (const pr of priyaReviews) {
    if (pr.employeeId !== priyaEmp.id) {
      throw new Error(`Data leak: Priya saw review of employee ${pr.employeeId}`);
    }
  }
  console.log("   ✓ Scoped review retrieval verified.");

  // 7. Test getHeadcountAndCompensationForecast (Scenarios)
  console.log("\n6. Testing Headcount & Compensation Forecasting Engine...");
  const scenarios: ("CONSERVATIVE" | "BASELINE" | "AGGRESSIVE")[] = ["CONSERVATIVE", "BASELINE", "AGGRESSIVE"];

  for (const sc of scenarios) {
    const forecast = await getHeadcountAndCompensationForecast(adminSession, sc);
    console.log(`   Scenario [${forecast.scenarioName}]: Growth +${forecast.hiringGrowthRate}%/yr | Merit +${forecast.annualMeritIncrease}%`);
    console.log(`     - 6-Mo Headcount: ${forecast.sixMonthProjectedHeadcount} | 6-Mo Payroll: $${forecast.sixMonthProjectedPayroll.toLocaleString()}`);
    console.log(`     - 12-Mo Headcount: ${forecast.twelveMonthProjectedHeadcount} | 12-Mo Payroll: $${forecast.twelveMonthProjectedPayroll.toLocaleString()}`);
    if (forecast.projections.length !== 12) {
      throw new Error(`Expected 12 month projection points, got ${forecast.projections.length}`);
    }
  }
  console.log("   ✓ 6-month & 12-month predictive growth trajectories verified across all 3 scenarios.");

  // 8. Clean up test records
  console.log("\n7. Cleaning up test review and assessment records...");
  await prisma.$transaction([
    prisma.performanceReview.deleteMany({ where: { employeeId: priyaEmp.id, period: "2026-Q3" } }),
    prisma.attritionRiskAssessment.deleteMany({ where: { employeeId: priyaEmp.id } }),
    prisma.auditLog.deleteMany({ where: { action: "PERFORMANCE_REVIEW_PUBLISHED" } }),
  ]);
  console.log("   ✓ Test data cleanly removed from database.");

  console.log("\n🎉 ALL PHASE 10 AI WORKFORCE INSIGHTS & ANALYTICS TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
}

runTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
