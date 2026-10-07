import { prisma } from "../src/lib/prisma";

async function runHttpTests() {
  console.log("=== TESTING PHASE 10 AI REST API ENDPOINTS VIA HTTP (localhost:3000) ===");
  const BASE_URL = "http://localhost:3000";

  // 1. Authenticate as Sarah Jenkins
  console.log("\n1. Logging in as Company HR Admin (sarah.jenkins@digisail.com)...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "sarah.jenkins@digisail.com", password: "password123" }),
  });
  console.log(`   Status: ${loginRes.status}`);
  if (!loginRes.ok) throw new Error("Login failed");
  const cookies = loginRes.headers.get("set-cookie") || "";

  // 2. Test GET /api/ai/attrition
  console.log("\n2. Testing GET /api/ai/attrition...");
  const attrRes = await fetch(`${BASE_URL}/api/ai/attrition`, {
    headers: { Cookie: cookies },
  });
  console.log(`   Status: ${attrRes.status}`);
  const attrJson = await attrRes.json();
  const attrData = attrJson.data;
  console.log(`   Company Risk Score: ${attrData.kpis.overallCompanyRiskScore}%`);
  console.log(`   Burnout Index: ${attrData.kpis.burnoutIndexPct}%`);
  console.log(`   Department Heatmaps count: ${attrData.departmentHeatmap.length}`);
  if (attrRes.status !== 200 || !attrData.kpis) {
    throw new Error("Failed to fetch attrition insights");
  }

  // Find Priya Patel for review tests
  const priya = await prisma.employee.findFirst({
    where: { email: "priya.patel@digisail.com" },
  });
  if (!priya) throw new Error("Priya Patel not found");

  // 3. Test POST /api/ai/reviews/generate
  console.log("\n3. Testing POST /api/ai/reviews/generate...");
  const genRes = await fetch(`${BASE_URL}/api/ai/reviews/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookies },
    body: JSON.stringify({ employeeId: priya.id, period: "2026-Q3" }),
  });
  console.log(`   Status: ${genRes.status}`);
  const genJson = await genRes.json();
  const synthReview = genJson.data;
  console.log(`   Synthesized Rating: ${synthReview?.rating} (Metrics: ${synthReview?.metricsScore}/100)`);
  console.log(`   Summary excerpt: ${synthReview?.summary?.slice(0, 100)}...`);
  if (genRes.status !== 200 || !synthReview?.rating) {
    throw new Error("Failed to synthesize AI review");
  }

  // 4. Test POST /api/ai/reviews (Publish)
  console.log("\n4. Testing POST /api/ai/reviews (Publish Review)...");
  const saveRes = await fetch(`${BASE_URL}/api/ai/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookies },
    body: JSON.stringify({
      employeeId: priya.id,
      period: "2026-Q3",
      rating: synthReview.rating,
      summary: synthReview.summary,
      strengths: synthReview.strengths,
      growthAreas: synthReview.growthAreas,
      goals: synthReview.goals,
      metricsScore: synthReview.metricsScore,
      status: "PUBLISHED",
    }),
  });
  console.log(`   Status: ${saveRes.status}`);
  const saveJson = await saveRes.json();
  const savedReview = saveJson.data;
  console.log(`   Published Review ID: ${savedReview?.id} (Status: ${savedReview?.status})`);
  if (saveRes.status !== 201 || !savedReview?.id) {
    throw new Error("Failed to save performance review");
  }

  // 5. Test GET /api/ai/reviews
  console.log("\n5. Testing GET /api/ai/reviews...");
  const listRes = await fetch(`${BASE_URL}/api/ai/reviews`, {
    headers: { Cookie: cookies },
  });
  console.log(`   Status: ${listRes.status}`);
  const listJson = await listRes.json();
  const reviewsList = listJson.data;
  console.log(`   Retrieved ${reviewsList.length} performance reviews.`);
  if (listRes.status !== 200 || !Array.isArray(reviewsList) || reviewsList.length === 0) {
    throw new Error("Failed to list performance reviews");
  }

  // 6. Test GET /api/ai/forecast?scenario=AGGRESSIVE
  console.log("\n6. Testing GET /api/ai/forecast?scenario=AGGRESSIVE...");
  const forecastRes = await fetch(`${BASE_URL}/api/ai/forecast?scenario=AGGRESSIVE`, {
    headers: { Cookie: cookies },
  });
  console.log(`   Status: ${forecastRes.status}`);
  const forecastJson = await forecastRes.json();
  const forecastData = forecastJson.data;
  console.log(`   Scenario: ${forecastData.scenarioName} (Hiring: +${forecastData.hiringGrowthRate}%)`);
  console.log(`   6-Mo Headcount: ${forecastData.sixMonthProjectedHeadcount} | 12-Mo: ${forecastData.twelveMonthProjectedHeadcount}`);
  console.log(`   12-Mo Projected Budget: $${forecastData.twelveMonthProjectedPayroll.toLocaleString()}`);
  if (forecastRes.status !== 200 || !forecastData.projections) {
    throw new Error("Failed to retrieve forecast data");
  }

  // 7. Cleanup test review
  console.log("\n7. Cleaning up test review...");
  await prisma.performanceReview.deleteMany({
    where: { employeeId: priya.id, period: "2026-Q3" },
  });
  console.log("   ✓ Cleaned up test review.");

  console.log("\n🎉 ALL PHASE 10 HTTP REST ENDPOINTS VALIDATED SUCCESSFULLY ON LOCALHOST:3000!");
  process.exit(0);
}

runHttpTests().catch((e) => {
  console.error("HTTP test failed:", e);
  process.exit(1);
});
