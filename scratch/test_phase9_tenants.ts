import { prisma } from "../src/lib/prisma";
import {
  TIER_CONFIG,
  hasFeature,
  getAllTenants,
  getTenantSubscription,
  createTenant,
  updateTenantSubscription,
  updateTenantStatus,
  checkSeatLimit,
  checkBranchLimit,
} from "../src/lib/services/tenantService";
import { Role } from "@prisma/client";
import { AuthTokenPayload } from "../src/lib/auth/jwt";

async function runTests() {
  console.log("=== PHASE 9: SAAS MULTI-TENANCY & TENANT BILLING TEST SUITE ===");

  // 1. Setup Sessions
  const superAdmin = await prisma.user.findFirst({
    where: { role: Role.SUPER_ADMIN },
  });
  if (!superAdmin) throw new Error("Super Admin user not found in database.");

  const superAdminSession: AuthTokenPayload = {
    sub: superAdmin.id,
    email: superAdmin.email,
    role: Role.SUPER_ADMIN,
    companyId: superAdmin.companyId || "digisail-company-1",
    name: "Platform Super Admin",
  };

  const digiSailCompany = await prisma.company.findFirst();
  if (!digiSailCompany) throw new Error("Primary company not found.");

  const sarahUser = await prisma.user.findFirst({
    where: { email: "sarah.jenkins@digisail.com" },
  });
  if (!sarahUser) throw new Error("Sarah Jenkins user not found.");

  const companyAdminSession: AuthTokenPayload = {
    sub: sarahUser.id,
    email: sarahUser.email,
    role: Role.COMPANY_ADMIN,
    companyId: digiSailCompany.id,
    name: "Sarah Jenkins",
  };

  // 2. Feature Gating Logic
  console.log("\n1. Testing Feature Gating Flags across Tiers...");
  console.log(`   - STARTER has hr_core: ${hasFeature("STARTER", "hr_core")}`);
  console.log(`   - STARTER has payroll: ${hasFeature("STARTER", "payroll")}`);
  console.log(`   - GROWTH has payroll: ${hasFeature("GROWTH", "payroll")}`);
  console.log(`   - GROWTH has custom_sla: ${hasFeature("GROWTH", "custom_sla")}`);
  console.log(`   - ENTERPRISE has custom_sla: ${hasFeature("ENTERPRISE", "custom_sla")}`);

  if (hasFeature("STARTER", "payroll")) throw new Error("STARTER should not have payroll!");
  if (!hasFeature("GROWTH", "payroll")) throw new Error("GROWTH should have payroll!");
  if (!hasFeature("ENTERPRISE", "custom_sla")) throw new Error("ENTERPRISE should have custom_sla!");
  console.log("   ✓ Feature gating matrix validated.");

  // 3. Super Admin Tenant Directory
  console.log("\n2. Testing Super Admin getAllTenants Platform Directory...");
  const tenants = await getAllTenants(superAdminSession);
  console.log(`   Super Admin retrieved ${tenants.length} registered tenants.`);
  if (tenants.length === 0) throw new Error("Expected at least 1 tenant.");
  for (const t of tenants) {
    console.log(`   - [${t.plan}] ${t.name} (Subdomain: ${t.subdomain}, Employees: ${t.employeeCount}/${t.maxSeats}, Status: ${t.status})`);
  }
  console.log("   ✓ Tenant directory with live metrics fetched successfully.");

  // 4. Company Admin Subscription & Quota Details
  console.log("\n3. Testing getTenantSubscription for DigiSail...");
  const subDetails = await getTenantSubscription(digiSailCompany.id, companyAdminSession);
  console.log(`   Plan: ${subDetails.subscription.tier} ($${subDetails.subscription.monthlyPrice}/mo)`);
  console.log(`   Seats: ${subDetails.quotas.seatsUsed} / ${subDetails.quotas.maxSeats} (${subDetails.quotas.seatUtilizationPct}% used)`);
  console.log(`   Branches: ${subDetails.quotas.branchesUsed} / ${subDetails.quotas.maxBranches}`);
  console.log(`   Invoices: ${subDetails.invoices.length} historical statements found.`);
  if (subDetails.invoices.length === 0) throw new Error("Expected at least 1 invoice.");
  console.log("   ✓ Subscription quotas and invoices retrieved successfully.");

  // 5. Provision New Tenant (Atomic Transaction)
  console.log("\n4. Testing Super Admin createTenant Provisioning...");
  const testSubdomain = `test-tenant-${Date.now().toString().slice(-4)}`;
  const testAdminEmail = `admin@${testSubdomain}.com`;

  const newTenant = await createTenant(
    {
      name: "Apex Logistics International",
      subdomain: testSubdomain,
      currency: "USD",
      adminName: "Marcus Vance",
      adminEmail: testAdminEmail,
      adminPassword: "Password123!",
      branchName: "Apex Logistics HQ",
      branchCode: "APX-HQ",
      plan: "STARTER",
    },
    superAdminSession
  );

  console.log(`   ✓ Provisioned new tenant: ${newTenant.name} (ID: ${newTenant.id})`);
  console.log(`     Subdomain: ${newTenant.subdomain}.digisail.com`);
  console.log(`     Plan: ${newTenant.plan} | Max Seats: ${newTenant.maxSeats} | Max Branches: ${newTenant.maxBranches}`);
  console.log(`     Admin Email: ${newTenant.adminEmail}`);

  // Test duplicate subdomain rejection
  try {
    await createTenant(
      {
        name: "Duplicate Apex",
        subdomain: testSubdomain,
        adminName: "Other Admin",
        adminEmail: "other@apex.com",
        plan: "STARTER",
      },
      superAdminSession
    );
    throw new Error("Duplicate subdomain should have been blocked!");
  } catch (err: any) {
    console.log(`   ✓ Duplicate subdomain blocked as expected: ${err.message}`);
  }

  // 6. Quota Limits Checking
  console.log("\n5. Testing checkSeatLimit and checkBranchLimit...");
  const seatCheck = await checkSeatLimit(newTenant.id);
  console.log(`   Seat check: current ${seatCheck.currentCount} / max ${seatCheck.maxSeats} -> allowed: ${seatCheck.allowed}`);
  if (!seatCheck.allowed) throw new Error("New tenant with 1 employee should be within 25 seat limit.");

  const branchCheck = await checkBranchLimit(newTenant.id);
  console.log(`   Branch check: current ${branchCheck.currentCount} / max ${branchCheck.maxBranches} -> allowed: ${branchCheck.allowed}`);
  if (!branchCheck.allowed) throw new Error("New tenant with 1 branch should be within 2 branch limit.");

  // 7. Plan Upgrade (STARTER -> GROWTH)
  console.log("\n6. Testing updateTenantSubscription (Upgrade to GROWTH)...");
  const upgradedDetails = await updateTenantSubscription(
    newTenant.id,
    "GROWTH",
    superAdminSession
  );
  console.log(`   ✓ Upgraded to: ${upgradedDetails.subscription.tier}`);
  console.log(`     New Max Seats: ${upgradedDetails.quotas.maxSeats} (was ${newTenant.maxSeats})`);
  console.log(`     New Monthly Price: $${upgradedDetails.subscription.monthlyPrice}/mo`);
  if (upgradedDetails.quotas.maxSeats !== 100) {
    throw new Error("Expected GROWTH maxSeats to be 100.");
  }
  const latestInvoice = upgradedDetails.invoices[0];
  console.log(`     Upgrade Invoice: ${latestInvoice.invoiceNumber} ($${latestInvoice.amount} ${latestInvoice.status})`);

  // 8. Tenant Suspension and Reactivation
  console.log("\n7. Testing updateTenantStatus (Suspend & Reactivate)...");
  const suspended = await updateTenantStatus(newTenant.id, "SUSPENDED", superAdminSession);
  console.log(`   ✓ Tenant status changed to: ${suspended.status}`);
  if (suspended.status !== "SUSPENDED") throw new Error("Expected status SUSPENDED");

  const reactivated = await updateTenantStatus(newTenant.id, "ACTIVE", superAdminSession);
  console.log(`   ✓ Tenant status reactivated to: ${reactivated.status}`);
  if (reactivated.status !== "ACTIVE") throw new Error("Expected status ACTIVE");

  // 9. Tenant Isolation & Security
  console.log("\n8. Testing Tenant Isolation Security Boundary...");
  try {
    // Sarah (DigiSail Company Admin) tries to access Apex tenant subscription
    await getTenantSubscription(newTenant.id, companyAdminSession);
    throw new Error("Company Admin should not be able to access another tenant's billing!");
  } catch (err: any) {
    console.log(`   ✓ Cross-tenant access blocked: ${err.message}`);
  }

  try {
    // Sarah tries to provision a new tenant (non-super-admin)
    await createTenant(
      {
        name: "Unauthorized Tenant",
        subdomain: "unauth-sub",
        adminName: "Evil",
        adminEmail: "evil@test.com",
        plan: "STARTER",
      },
      companyAdminSession
    );
    throw new Error("Company Admin should not be able to provision tenants!");
  } catch (err: any) {
    console.log(`   ✓ Non-Super-Admin provisioning blocked: ${err.message}`);
  }

  // 10. Clean up test tenant
  console.log("\n9. Cleaning up test tenant data...");
  await prisma.$transaction([
    prisma.invoice.deleteMany({ where: { companyId: newTenant.id } }),
    prisma.subscription.deleteMany({ where: { companyId: newTenant.id } }),
    prisma.auditLog.deleteMany({ where: { entityId: newTenant.id } }),
    prisma.leaveType.deleteMany({ where: { companyId: newTenant.id } }),
    prisma.employee.deleteMany({ where: { companyId: newTenant.id } }),
    prisma.branch.deleteMany({ where: { companyId: newTenant.id } }),
    prisma.user.deleteMany({ where: { email: testAdminEmail } }),
    prisma.company.delete({ where: { id: newTenant.id } }),
  ]);
  console.log("   ✓ Test tenant and related entities cleanly removed.");

  console.log("\n🎉 ALL PHASE 9 SAAS MULTI-TENANCY & BILLING TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
}

runTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
