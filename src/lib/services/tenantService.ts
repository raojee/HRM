import { prisma } from "@/lib/prisma";
import { AuthTokenPayload } from "@/lib/auth/jwt";
import { hashPassword } from "@/lib/auth/password";
import { Role, SubscriptionTier, SubscriptionStatus } from "@prisma/client";
import {
  TenantRecord,
  SubscriptionRecord,
  InvoiceRecord,
  TenantSubscriptionDetails,
} from "@/lib/types";
import { ensureDefaultProjects } from "./projectService";

export interface TierPlanConfig {
  tier: SubscriptionTier;
  name: string;
  price: number;
  maxSeats: number;
  maxBranches: number;
  features: string[];
  description: string;
}

export const TIER_CONFIG: Record<SubscriptionTier, TierPlanConfig> = {
  STARTER: {
    tier: "STARTER",
    name: "Starter",
    price: 299,
    maxSeats: 25,
    maxBranches: 2,
    features: ["hr_core", "attendance", "leaves"],
    description: "Up to 25 employees, 2 branches, standard HR & attendance.",
  },
  GROWTH: {
    tier: "GROWTH",
    name: "Growth",
    price: 799,
    maxSeats: 100,
    maxBranches: 10,
    features: ["hr_core", "attendance", "leaves", "payroll", "projects", "timesheets"],
    description: "Up to 100 employees, 10 branches, full payroll engine & projects/timesheets.",
  },
  ENTERPRISE: {
    tier: "ENTERPRISE",
    name: "Enterprise",
    price: 1999,
    maxSeats: 9999,
    maxBranches: 999,
    features: [
      "hr_core",
      "attendance",
      "leaves",
      "payroll",
      "projects",
      "timesheets",
      "multi_tier_approvals",
      "audit_logs",
      "custom_sla",
      "dedicated_support",
    ],
    description: "Unlimited employees & branches, multi-tier approvals, dedicated audit logs & custom SLA.",
  },
};

/**
 * Returns whether a given subscription tier includes a specific feature flag.
 */
export function hasFeature(tier: SubscriptionTier, feature: string): boolean {
  const config = TIER_CONFIG[tier];
  if (!config) return false;
  return config.features.includes(feature);
}

/**
 * Ensures that a company has a valid Subscription record and initial invoices.
 */
export async function ensureTenantSubscription(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { subscription: true },
  });

  if (!company) {
    throw new Error(`Company ${companyId} not found`);
  }

  // Update subdomain if null
  if (!company.subdomain) {
    const defaultSub = company.name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16) || "tenant";
    await prisma.company.update({
      where: { id: companyId },
      data: { subdomain: defaultSub },
    });
  }

  if (company.subscription) {
    return company.subscription;
  }

  // Create default subscription
  const isDigiSail = companyId === "digisail-company-1";
  const defaultTier: SubscriptionTier = isDigiSail ? "ENTERPRISE" : "GROWTH";
  const config = TIER_CONFIG[defaultTier];

  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const sub = await prisma.subscription.create({
    data: {
      companyId,
      tier: defaultTier,
      status: "ACTIVE",
      maxSeats: config.maxSeats,
      maxBranches: config.maxBranches,
      monthlyPrice: config.price,
      billingCycle: "MONTHLY",
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
      cancelAtPeriodEnd: false,
    },
  });

  // Create initial seed invoices if none exist
  const existingInvoicesCount = await prisma.invoice.count({ where: { companyId } });
  if (existingInvoicesCount === 0) {
    const prevMonth = new Date(now);
    prevMonth.setMonth(prevMonth.getMonth() - 1);

    await prisma.invoice.createMany({
      data: [
        {
          subscriptionId: sub.id,
          companyId,
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}-01`,
          amount: config.price,
          currency: company.currency || "USD",
          status: "PAID",
          billingDate: prevMonth,
          paidAt: prevMonth,
          planName: `${config.name} Plan (Monthly)`,
          seatsBilled: config.maxSeats === 9999 ? 70 : config.maxSeats,
        },
        {
          subscriptionId: sub.id,
          companyId,
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}-02`,
          amount: config.price,
          currency: company.currency || "USD",
          status: "PAID",
          billingDate: now,
          paidAt: now,
          planName: `${config.name} Plan (Monthly Renewal)`,
          seatsBilled: config.maxSeats === 9999 ? 70 : config.maxSeats,
        },
      ],
    });
  }

  return sub;
}

/**
 * Retrieves all tenants for the SaaS Super Admin platform directory.
 */
export async function getAllTenants(session: AuthTokenPayload): Promise<TenantRecord[]> {
  const isSuperAdmin = session.role === Role.SUPER_ADMIN;
  const where = isSuperAdmin ? {} : { id: session.companyId };

  const companies = await prisma.company.findMany({
    where,
    include: {
      subscription: true,
      branches: { select: { id: true } },
      employees: {
        where: { status: { not: "TERMINATED" } },
        select: { id: true },
      },
      users: {
        where: { role: Role.COMPANY_ADMIN },
        select: { id: true, email: true, employee: { select: { firstName: true, lastName: true } } },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const tenantRecords: TenantRecord[] = [];

  for (const comp of companies) {
    let sub = comp.subscription;
    if (!sub) {
      sub = await ensureTenantSubscription(comp.id);
    }

    const tier = sub.tier as SubscriptionTier;
    const config = TIER_CONFIG[tier] || TIER_CONFIG.GROWTH;
    const employeeCount = comp.employees.length;
    const branchCount = comp.branches.length;
    const maxSeats = sub.maxSeats || config.maxSeats;
    const seatUtil = maxSeats > 0 ? Math.min(100, Math.round((employeeCount / maxSeats) * 100)) : 0;

    const primaryAdmin = comp.users[0];
    const adminName = primaryAdmin?.employee
      ? `${primaryAdmin.employee.firstName} ${primaryAdmin.employee.lastName}`
      : primaryAdmin?.email?.split("@")[0] || "Administrator";
    const adminEmail = primaryAdmin?.email || "admin@" + (comp.subdomain || "company") + ".com";

    tenantRecords.push({
      id: comp.id,
      name: comp.name,
      legalName: comp.legalName,
      subdomain: comp.subdomain || comp.name.toLowerCase().replace(/[^a-z0-9]/g, ""),
      currency: comp.currency,
      timezone: comp.timezone,
      website: comp.website,
      adminName,
      adminEmail,
      branchCount,
      employeeCount,
      status: sub.status as SubscriptionStatus,
      plan: tier,
      monthlyPrice: Number(sub.monthlyPrice),
      maxSeats,
      maxBranches: sub.maxBranches || config.maxBranches,
      seatUtilizationPct: seatUtil,
      renewalDate: sub.currentPeriodEnd.toISOString().split("T")[0],
      createdAt: comp.createdAt.toISOString().split("T")[0],
    });
  }

  return tenantRecords;
}

export interface CreateTenantInput {
  name: string;
  legalName?: string;
  subdomain: string;
  currency?: string;
  timezone?: string;
  adminName: string;
  adminEmail: string;
  adminPassword?: string;
  branchName?: string;
  branchCode?: string;
  plan: SubscriptionTier;
}

/**
 * Super Admin provisions a new tenant company, initial branch, admin user, and subscription.
 */
export async function createTenant(data: CreateTenantInput, session: AuthTokenPayload): Promise<TenantRecord> {
  if (session.role !== Role.SUPER_ADMIN) {
    throw new Error("Unauthorized: Only Platform Super Admin can provision new SaaS tenants.");
  }

  const cleanSubdomain = data.subdomain.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");
  if (!cleanSubdomain) {
    throw new Error("Invalid subdomain: must contain only alphanumeric characters and hyphens.");
  }

  // Pre-check subdomain uniqueness
  const existingSub = await prisma.company.findFirst({
    where: { subdomain: cleanSubdomain },
  });
  if (existingSub) {
    throw new Error(`Subdomain "${cleanSubdomain}" is already registered by another organization.`);
  }

  // Pre-check admin email uniqueness
  const existingUser = await prisma.user.findUnique({
    where: { email: data.adminEmail.toLowerCase().trim() },
  });
  if (existingUser) {
    throw new Error(`User with email "${data.adminEmail}" already exists in the system.`);
  }

  const tier = data.plan in TIER_CONFIG ? data.plan : "GROWTH";
  const planConfig = TIER_CONFIG[tier];
  const currency = data.currency || "USD";
  const timezone = data.timezone || "America/New_York";
  const passwordToHash = data.adminPassword || "demo123";
  const passwordHash = await hashPassword(passwordToHash);

  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  // Split name for employee profile
  const nameParts = data.adminName.trim().split(" ");
  const firstName = nameParts[0] || "Admin";
  const lastName = nameParts.slice(1).join(" ") || "User";

  // Atomic transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Company
    const company = await tx.company.create({
      data: {
        name: data.name,
        legalName: data.legalName || data.name,
        subdomain: cleanSubdomain,
        currency,
        timezone,
      },
    });

    // 2. Create Primary Admin User
    const adminUser = await tx.user.create({
      data: {
        email: data.adminEmail.toLowerCase().trim(),
        passwordHash,
        role: Role.COMPANY_ADMIN,
        companyId: company.id,
      },
    });

    // 3. Create Initial Branch
    const branchCode = data.branchCode || `HQ-${cleanSubdomain.toUpperCase().slice(0, 4)}`;
    const branch = await tx.branch.create({
      data: {
        companyId: company.id,
        name: data.branchName || `${data.name} Headquarters`,
        code: branchCode,
        branchAdminId: adminUser.id,
        timezone,
      },
    });

    // 4. Create Initial Department
    const deptCode = `GEN-${cleanSubdomain.toUpperCase().slice(0, 3)}`;
    const department = await tx.department.create({
      data: {
        companyId: company.id,
        branchId: branch.id,
        name: "General Operations",
        code: deptCode,
        deptAdminId: adminUser.id,
        description: "Primary operations and management department",
      },
    });

    // 5. Create Employee Record for Admin
    const empNumber = `EMP-${cleanSubdomain.toUpperCase().slice(0, 3)}-001`;
    await tx.employee.create({
      data: {
        companyId: company.id,
        branchId: branch.id,
        departmentId: department.id,
        userId: adminUser.id,
        employeeNumber: empNumber,
        firstName,
        lastName,
        email: data.adminEmail.toLowerCase().trim(),
        employmentType: "FULL_TIME",
        status: "ACTIVE",
        onboardingStatus: "ACTIVE",
        baseSalary: 125000,
        currency,
      },
    });

    // 5. Create Subscription
    const subscription = await tx.subscription.create({
      data: {
        companyId: company.id,
        tier,
        status: "ACTIVE",
        maxSeats: planConfig.maxSeats,
        maxBranches: planConfig.maxBranches,
        monthlyPrice: planConfig.price,
        billingCycle: "MONTHLY",
        currentPeriodStart: now,
        currentPeriodEnd: nextMonth,
      },
    });

    // 6. Create Initial Invoice
    const invoiceNum = `INV-${Date.now().toString().slice(-6)}-INIT`;
    await tx.invoice.create({
      data: {
        subscriptionId: subscription.id,
        companyId: company.id,
        invoiceNumber: invoiceNum,
        amount: planConfig.price,
        currency,
        status: "PAID",
        billingDate: now,
        paidAt: now,
        planName: `${planConfig.name} Plan Activation`,
        seatsBilled: planConfig.maxSeats === 9999 ? 50 : planConfig.maxSeats,
      },
    });

    // 7. Seed Default Leave Types
    await tx.leaveType.createMany({
      data: [
        { companyId: company.id, name: "Annual Vacation", code: "ANNUAL", defaultDays: 14, isPaid: true, colorHex: "#3b82f6" },
        { companyId: company.id, name: "Medical / Sick Leave", code: "SICK", defaultDays: 10, isPaid: true, colorHex: "#ef4444" },
        { companyId: company.id, name: "Casual / Personal Leave", code: "CASUAL", defaultDays: 7, isPaid: true, colorHex: "#f59e0b" },
        { companyId: company.id, name: "Parental / Family Care", code: "PARENTAL", defaultDays: 30, isPaid: true, colorHex: "#ec4899" },
      ],
    });

    // 8. Audit Log
    await tx.auditLog.create({
      data: {
        userId: session.sub,
        action: "TENANT_PROVISIONED",
        module: "MULTI_TENANCY",
        entityId: company.id,
        details: {
          companyName: company.name,
          subdomain: cleanSubdomain,
          tier,
          adminEmail: data.adminEmail,
        },
      },
    });

    return { company, branch, adminUser, subscription };
  });

  // 9. Auto-provision projects for Growth & Enterprise outside transaction
  if (tier === "GROWTH" || tier === "ENTERPRISE") {
    await ensureDefaultProjects(result.company.id).catch((err) => {
      console.warn("Could not auto-provision projects for new tenant:", err);
    });
  }

  return {
    id: result.company.id,
    name: result.company.name,
    legalName: result.company.legalName,
    subdomain: result.company.subdomain!,
    currency: result.company.currency,
    timezone: result.company.timezone,
    website: result.company.website,
    adminName: `${firstName} ${lastName}`,
    adminEmail: data.adminEmail,
    branchCount: 1,
    employeeCount: 1,
    status: "ACTIVE",
    plan: tier,
    monthlyPrice: planConfig.price,
    maxSeats: planConfig.maxSeats,
    maxBranches: planConfig.maxBranches,
    seatUtilizationPct: Math.round((1 / planConfig.maxSeats) * 100),
    renewalDate: nextMonth.toISOString().split("T")[0],
    createdAt: now.toISOString().split("T")[0],
  };
}

/**
 * Retrieves full subscription details, quotas, features, and billing history for a company.
 */
export async function getTenantSubscription(
  companyId: string,
  session: AuthTokenPayload
): Promise<TenantSubscriptionDetails> {
  // Authorization guard
  if (session.role !== Role.SUPER_ADMIN && session.companyId !== companyId) {
    throw new Error("Unauthorized: Cannot view another tenant's subscription details.");
  }

  const sub = await ensureTenantSubscription(companyId);

  const [activeEmployeesCount, activeBranchesCount, rawInvoices] = await Promise.all([
    prisma.employee.count({
      where: { companyId, status: { not: "TERMINATED" } },
    }),
    prisma.branch.count({
      where: { companyId },
    }),
    prisma.invoice.findMany({
      where: { companyId },
      orderBy: { billingDate: "desc" },
      take: 20,
    }),
  ]);

  const tier = sub.tier as SubscriptionTier;
  const config = TIER_CONFIG[tier] || TIER_CONFIG.GROWTH;
  const maxSeats = sub.maxSeats || config.maxSeats;
  const maxBranches = sub.maxBranches || config.maxBranches;
  const seatsRemaining = Math.max(0, maxSeats - activeEmployeesCount);
  const seatUtil = maxSeats > 0 ? Math.min(100, Math.round((activeEmployeesCount / maxSeats) * 100)) : 0;
  const branchesRemaining = Math.max(0, maxBranches - activeBranchesCount);

  const subscriptionRecord: SubscriptionRecord = {
    id: sub.id,
    companyId: sub.companyId,
    tier,
    status: sub.status as SubscriptionStatus,
    maxSeats,
    maxBranches,
    monthlyPrice: Number(sub.monthlyPrice),
    billingCycle: (sub.billingCycle as "MONTHLY" | "ANNUAL") || "MONTHLY",
    currentPeriodStart: sub.currentPeriodStart.toISOString(),
    currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    stripeCustomerId: sub.stripeCustomerId,
    features: config.features,
  };

  const invoiceRecords: InvoiceRecord[] = rawInvoices.map((inv) => ({
    id: inv.id,
    subscriptionId: inv.subscriptionId,
    companyId: inv.companyId,
    invoiceNumber: inv.invoiceNumber,
    amount: Number(inv.amount),
    currency: inv.currency,
    status: inv.status as "PAID" | "PENDING" | "FAILED",
    billingDate: inv.billingDate.toISOString().split("T")[0],
    paidAt: inv.paidAt ? inv.paidAt.toISOString() : null,
    pdfUrl: inv.pdfUrl,
    planName: inv.planName,
    seatsBilled: inv.seatsBilled,
    createdAt: inv.createdAt.toISOString(),
  }));

  return {
    subscription: subscriptionRecord,
    quotas: {
      seatsUsed: activeEmployeesCount,
      maxSeats,
      seatsRemaining,
      seatUtilizationPct: seatUtil,
      branchesUsed: activeBranchesCount,
      maxBranches,
      branchesRemaining,
    },
    features: config.features,
    invoices: invoiceRecords,
  };
}

/**
 * Upgrades or downgrades a tenant's subscription plan, updating quotas and issuing an invoice.
 */
export async function updateTenantSubscription(
  companyId: string,
  newTier: SubscriptionTier,
  session: AuthTokenPayload,
  customMaxSeats?: number
): Promise<TenantSubscriptionDetails> {
  // Authorization guard
  if (session.role !== Role.SUPER_ADMIN && session.companyId !== companyId) {
    throw new Error("Unauthorized: Cannot modify another organization's subscription.");
  }

  if (!(newTier in TIER_CONFIG)) {
    throw new Error(`Invalid subscription tier: "${newTier}".`);
  }

  const currentSub = await ensureTenantSubscription(companyId);
  const newConfig = TIER_CONFIG[newTier];
  const maxSeats = customMaxSeats && customMaxSeats > 0 ? customMaxSeats : newConfig.maxSeats;
  const maxBranches = newConfig.maxBranches;
  const monthlyPrice = newConfig.price;

  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  await prisma.$transaction(async (tx) => {
    // 1. Update Subscription
    await tx.subscription.update({
      where: { companyId },
      data: {
        tier: newTier,
        maxSeats,
        maxBranches,
        monthlyPrice,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: nextMonth,
      },
    });

    // 2. Generate Upgrade/Plan Change Invoice
    const invoiceNum = `INV-${Date.now().toString().slice(-6)}-CHG`;
    await tx.invoice.create({
      data: {
        subscriptionId: currentSub.id,
        companyId,
        invoiceNumber: invoiceNum,
        amount: monthlyPrice,
        currency: "USD",
        status: "PAID",
        billingDate: now,
        paidAt: now,
        planName: `${newConfig.name} Plan Modification`,
        seatsBilled: maxSeats === 9999 ? 50 : maxSeats,
      },
    });

    // 3. Log Audit
    await tx.auditLog.create({
      data: {
        userId: session.sub,
        action: "SUBSCRIPTION_UPDATED",
        module: "BILLING",
        entityId: currentSub.id,
        details: {
          companyId,
          previousTier: currentSub.tier,
          newTier,
          newPrice: monthlyPrice,
          newMaxSeats: maxSeats,
        },
      },
    });
  });

  // If upgraded to Growth or Enterprise, ensure projects exist
  if (newTier === "GROWTH" || newTier === "ENTERPRISE") {
    await ensureDefaultProjects(companyId).catch(() => {});
  }

  return getTenantSubscription(companyId, session);
}

/**
 * Super Admin changes a tenant's subscription status (e.g. SUSPENDED, ACTIVE).
 */
export async function updateTenantStatus(
  companyId: string,
  newStatus: SubscriptionStatus,
  session: AuthTokenPayload
) {
  if (session.role !== Role.SUPER_ADMIN) {
    throw new Error("Unauthorized: Only Platform Super Admin can suspend or reactivate tenants.");
  }

  await ensureTenantSubscription(companyId);

  const updated = await prisma.subscription.update({
    where: { companyId },
    data: { status: newStatus },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.sub,
      action: `TENANT_STATUS_${newStatus}`,
      module: "MULTI_TENANCY",
      entityId: companyId,
      details: { newStatus },
    },
  });

  return updated;
}

/**
 * Checks whether adding a new employee would exceed the company's subscription seat limit.
 */
export async function checkSeatLimit(companyId: string): Promise<{
  allowed: boolean;
  currentCount: number;
  maxSeats: number;
  tier: SubscriptionTier;
}> {
  const sub = await ensureTenantSubscription(companyId);
  const tier = sub.tier as SubscriptionTier;
  const config = TIER_CONFIG[tier] || TIER_CONFIG.GROWTH;
  const maxSeats = sub.maxSeats || config.maxSeats;

  const currentCount = await prisma.employee.count({
    where: {
      companyId,
      status: { not: "TERMINATED" },
    },
  });

  return {
    allowed: currentCount < maxSeats,
    currentCount,
    maxSeats,
    tier,
  };
}

/**
 * Checks whether adding a new branch would exceed the company's subscription branch limit.
 */
export async function checkBranchLimit(companyId: string): Promise<{
  allowed: boolean;
  currentCount: number;
  maxBranches: number;
  tier: SubscriptionTier;
}> {
  const sub = await ensureTenantSubscription(companyId);
  const tier = sub.tier as SubscriptionTier;
  const config = TIER_CONFIG[tier] || TIER_CONFIG.GROWTH;
  const maxBranches = sub.maxBranches || config.maxBranches;

  const currentCount = await prisma.branch.count({
    where: { companyId },
  });

  return {
    allowed: currentCount < maxBranches,
    currentCount,
    maxBranches,
    tier,
  };
}
