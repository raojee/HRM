import { prisma } from "../src/lib/prisma";

async function runHttpTests() {
  console.log("=== TESTING PHASE 9 REST API ENDPOINTS VIA HTTP (localhost:3000) ===");

  const BASE_URL = "http://localhost:3000";

  // 1. Authenticate as Company HR (Sarah Jenkins)
  console.log("\n1. Logging in as Company HR Admin (sarah.jenkins@digisail.com)...");
  const sarahLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "sarah.jenkins@digisail.com", password: "password123" }),
  });
  console.log(`   Status: ${sarahLoginRes.status}`);
  if (!sarahLoginRes.ok) throw new Error("Sarah login failed");
  const sarahCookies = sarahLoginRes.headers.get("set-cookie") || "";

  // 2. Query Tenant Subscription Details as Company HR
  console.log("\n2. Testing GET /api/tenants/digisail-company-1/subscription...");
  const subRes = await fetch(`${BASE_URL}/api/tenants/digisail-company-1/subscription`, {
    headers: { Cookie: sarahCookies },
  });
  console.log(`   Status: ${subRes.status}`);
  const subJson = await subRes.json();
  const subData = subJson.data;
  console.log(`   Tenant Tier: ${subData.subscription.tier}`);
  console.log(`   Seats: ${subData.quotas.seatsUsed} / ${subData.quotas.maxSeats}`);
  console.log(`   Branches: ${subData.quotas.branchesUsed} / ${subData.quotas.maxBranches}`);
  console.log(`   Invoices count: ${subData.invoices.length}`);
  if (subRes.status !== 200 || !subData.subscription) {
    throw new Error("Failed to fetch tenant subscription");
  }

  // 3. Query Invoices as Company HR
  console.log("\n3. Testing GET /api/tenants/digisail-company-1/invoices...");
  const invRes = await fetch(`${BASE_URL}/api/tenants/digisail-company-1/invoices`, {
    headers: { Cookie: sarahCookies },
  });
  console.log(`   Status: ${invRes.status}`);
  const invJson = await invRes.json();
  const invoices = invJson.data;
  console.log(`   Returned ${invoices.length} invoices. First invoice: ${invoices[0]?.invoiceNumber}`);
  if (invRes.status !== 200 || !Array.isArray(invoices)) {
    throw new Error("Failed to fetch tenant invoices");
  }

  // 4. Authenticate as Super Admin
  console.log("\n4. Logging in as Super Admin (superadmin@digisail.com)...");
  const superLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "superadmin@digisail.com", password: "password123" }),
  });
  console.log(`   Status: ${superLoginRes.status}`);
  if (!superLoginRes.ok) throw new Error("Super Admin login failed");
  const superCookies = superLoginRes.headers.get("set-cookie") || "";

  // 5. Query All Tenants Directory as Super Admin
  console.log("\n5. Testing GET /api/tenants (Super Admin Platform Directory)...");
  const tenantsRes = await fetch(`${BASE_URL}/api/tenants`, {
    headers: { Cookie: superCookies },
  });
  console.log(`   Status: ${tenantsRes.status}`);
  const tenantsJson = await tenantsRes.json();
  const tenantsList = tenantsJson.data;
  console.log(`   Retrieved ${tenantsList.length} tenants across platform.`);
  for (const t of tenantsList) {
    console.log(`   - [${t.plan}] ${t.name} (Subdomain: ${t.subdomain}, Utilization: ${t.seatUtilizationPct}%)`);
  }
  if (tenantsRes.status !== 200 || !Array.isArray(tenantsList)) {
    throw new Error("Failed to fetch tenants directory");
  }

  // 6. Test Forbidden Boundary: Company HR cannot GET /api/tenants
  console.log("\n6. Verifying Forbidden Barrier: Sarah cannot call GET /api/tenants (all tenants)...");
  const forbiddenRes = await fetch(`${BASE_URL}/api/tenants`, {
    headers: { Cookie: sarahCookies },
  });
  console.log(`   Status: ${forbiddenRes.status} (Expected: 403)`);
  if (forbiddenRes.status !== 403) throw new Error("Expected 403 Forbidden for non-super-admin");

  // 7. Provision New Tenant via HTTP POST /api/tenants
  console.log("\n7. Testing POST /api/tenants (Super Admin Provisioning)...");
  const testSubdomain = `http-test-${Date.now().toString().slice(-4)}`;
  const testAdminEmail = `admin@${testSubdomain}.com`;
  const provisionRes = await fetch(`${BASE_URL}/api/tenants`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: superCookies },
    body: JSON.stringify({
      name: "Quantum Dynamics Labs",
      subdomain: testSubdomain,
      currency: "USD",
      adminName: "Elena Rostova",
      adminEmail: testAdminEmail,
      adminPassword: "Password123!",
      branchName: "Quantum HQ",
      branchCode: "QDL-HQ",
      plan: "STARTER",
    }),
  });
  console.log(`   Status: ${provisionRes.status}`);
  const provisionJson = await provisionRes.json();
  const newTenant = provisionJson.data;
  console.log(`   Provisioned Tenant ID: ${newTenant?.id}`);
  console.log(`   Subdomain: ${newTenant?.subdomain}`);
  console.log(`   Plan: ${newTenant?.plan} | Seats: ${newTenant?.maxSeats}`);
  if (provisionRes.status !== 201 || !newTenant?.id) {
    throw new Error("Failed to provision new tenant via HTTP API");
  }
  const newTenantId = newTenant.id;

  // 8. Upgrade Plan via POST /api/tenants/:id/subscription
  console.log(`\n8. Testing POST /api/tenants/${newTenantId}/subscription (Plan Upgrade)...`);
  const upgradeRes = await fetch(`${BASE_URL}/api/tenants/${newTenantId}/subscription`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: superCookies },
    body: JSON.stringify({ tier: "GROWTH" }),
  });
  console.log(`   Status: ${upgradeRes.status}`);
  const upgradeJson = await upgradeRes.json();
  const upgradeData = upgradeJson.data;
  console.log(`   Upgraded Tier: ${upgradeData?.subscription?.tier}`);
  console.log(`   New Max Seats: ${upgradeData?.quotas?.maxSeats}`);
  console.log(`   New Monthly Rate: $${upgradeData?.subscription?.monthlyPrice}`);
  if (upgradeRes.status !== 200 || upgradeData?.subscription?.tier !== "GROWTH") {
    throw new Error("Failed to upgrade subscription via HTTP API");
  }

  // 9. Suspend and Reactivate via POST /api/tenants/:id/status
  console.log(`\n9. Testing POST /api/tenants/${newTenantId}/status (Status Toggles)...`);
  const suspendRes = await fetch(`${BASE_URL}/api/tenants/${newTenantId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: superCookies },
    body: JSON.stringify({ status: "SUSPENDED" }),
  });
  console.log(`   Suspend Status: ${suspendRes.status}`);
  const suspendJson = await suspendRes.json();
  const suspendData = suspendJson.data;
  console.log(`   Updated status: ${suspendData?.status}`);
  if (suspendRes.status !== 200 || suspendData?.status !== "SUSPENDED") {
    throw new Error("Failed to suspend tenant");
  }

  const reactivateRes = await fetch(`${BASE_URL}/api/tenants/${newTenantId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: superCookies },
    body: JSON.stringify({ status: "ACTIVE" }),
  });
  console.log(`   Reactivate Status: ${reactivateRes.status}`);
  const reactivateJson = await reactivateRes.json();
  const reactivateData = reactivateJson.data;
  console.log(`   Updated status: ${reactivateData?.status}`);
  if (reactivateRes.status !== 200 || reactivateData?.status !== "ACTIVE") {
    throw new Error("Failed to reactivate tenant");
  }

  // 10. Clean up HTTP test tenant
  console.log("\n10. Cleaning up HTTP test tenant...");
  await prisma.$transaction([
    prisma.invoice.deleteMany({ where: { companyId: newTenantId } }),
    prisma.subscription.deleteMany({ where: { companyId: newTenantId } }),
    prisma.auditLog.deleteMany({ where: { entityId: newTenantId } }),
    prisma.leaveType.deleteMany({ where: { companyId: newTenantId } }),
    prisma.employee.deleteMany({ where: { companyId: newTenantId } }),
    prisma.branch.deleteMany({ where: { companyId: newTenantId } }),
    prisma.user.deleteMany({ where: { email: testAdminEmail } }),
    prisma.company.delete({ where: { id: newTenantId } }),
  ]);
  console.log("   ✓ Cleaned up test tenant successfully.");

  console.log("\n🎉 ALL PHASE 9 HTTP REST ENDPOINTS VALIDATED SUCCESSFULLY ON LOCALHOST:3000!");
  process.exit(0);
}

runHttpTests().catch((e) => {
  console.error("HTTP test execution failed:", e);
  process.exit(1);
});
