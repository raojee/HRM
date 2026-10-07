import { prisma } from "@/lib/prisma";
import { AuthTokenPayload } from "@/lib/auth/jwt";
import { Role, PayrollStatus } from "@prisma/client";

export interface SalaryBreakdown {
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  utilityAllowance: number;
  totalAllowances: number;
  grossSalary: number;
  providentFund: number;
  healthInsurance: number;
  totalDeductions: number;
  tax: number;
  netSalary: number;
}

/**
 * Computes standard compensation line items from base salary.
 * Handles both annual (> $20k) and monthly (<= $20k) inputs.
 */
export function calculateEmployeeSalary(rawBaseSalary: number | null | undefined): SalaryBreakdown {
  const salary = rawBaseSalary && rawBaseSalary > 0 ? Number(rawBaseSalary) : 60000;
  
  // Standardize to monthly base salary
  const monthlyBase = salary > 20000 
    ? Math.round((salary / 12) * 100) / 100
    : Math.round(salary * 100) / 100;

  // Standard Allowance Model
  const housingAllowance = Math.round((monthlyBase * 0.10) * 100) / 100; // 10%
  const transportAllowance = Math.round((monthlyBase * 0.05) * 100) / 100; // 5%
  const utilityAllowance = 250.00; // Flat utility & medical subsidy
  const totalAllowances = Math.round((housingAllowance + transportAllowance + utilityAllowance) * 100) / 100;

  const grossSalary = Math.round((monthlyBase + totalAllowances) * 100) / 100;

  // Standard Statutory & Benefit Deductions
  const providentFund = Math.round((monthlyBase * 0.05) * 100) / 100; // 5% 401(k) / Retirement
  const healthInsurance = 150.00; // Flat group health plan
  const totalDeductions = Math.round((providentFund + healthInsurance) * 100) / 100;

  // Statutory Tax Withholding (12% flat for base <= 8k, 15% for base > 8k)
  const taxRate = monthlyBase > 8000 ? 0.15 : 0.12;
  const tax = Math.round((grossSalary * taxRate) * 100) / 100;

  // Net Take-Home Pay
  const netSalary = Math.round((grossSalary - totalDeductions - tax) * 100) / 100;

  return {
    basicSalary: monthlyBase,
    housingAllowance,
    transportAllowance,
    utilityAllowance,
    totalAllowances,
    grossSalary,
    providentFund,
    healthInsurance,
    totalDeductions,
    tax,
    netSalary,
  };
}

export interface ProcessPayrollParams {
  month: number;
  year: number;
  branchId?: string | null;
  payDate?: string | Date;
  autoMarkPaid?: boolean;
  session: AuthTokenPayload;
}

/**
 * Executes an atomic batch payroll run for the specified month and year.
 * Generates individual employee payslips and aggregates totals.
 */
export async function executeBatchPayroll(params: ProcessPayrollParams) {
  const { month, year, session, autoMarkPaid = true } = params;

  // 1. RBAC Check: Only Super Admin, Company Admin, or Branch Admin can process payroll
  if (
    session.role !== Role.SUPER_ADMIN &&
    session.role !== Role.COMPANY_ADMIN &&
    session.role !== Role.BRANCH_ADMIN
  ) {
    throw new Error("Unauthorized: Insufficient privileges to execute payroll batch.");
  }

  // 2. Multi-tenant Scope: enforce branch restriction if caller is Branch Admin
  let targetBranchId: string | undefined = undefined;
  if (session.role === Role.BRANCH_ADMIN) {
    if (!session.branchId) {
      throw new Error("Branch Admin is not assigned to a valid branch.");
    }
    targetBranchId = session.branchId;
  } else if (params.branchId) {
    targetBranchId = params.branchId;
  }

  // 3. Find all active employees within tenant & branch scope
  const employeeWhere: any = {
    companyId: session.companyId,
    status: "ACTIVE",
    onboardingStatus: "ACTIVE",
  };

  if (targetBranchId) {
    employeeWhere.branchId = targetBranchId;
  }

  const eligibleEmployees = await prisma.employee.findMany({
    where: employeeWhere,
    include: {
      department: true,
      designation: true,
      branch: true,
    },
  });

  if (eligibleEmployees.length === 0) {
    throw new Error("No active employees found matching the specified payroll scope.");
  }

  const payDate = params.payDate ? new Date(params.payDate) : new Date();

  // 4. Atomic Execution inside Prisma Transaction
  return await prisma.$transaction(async (tx) => {
    // Check if payroll run already exists for this tenant, month, year
    const existingRun = await tx.payrollRun.findUnique({
      where: {
        companyId_month_year: {
          companyId: session.companyId,
          month,
          year,
        },
      },
      include: {
        payslips: true,
      },
    });

    let payrollRunId: string;

    if (existingRun) {
      if (existingRun.status === PayrollStatus.PAID) {
        throw new Error(
          `Payroll batch for ${month}/${year} has already been finalized and PAID. Re-processing is locked.`
        );
      }
      
      // If DRAFT or PROCESSING, remove old generated payslips to prevent duplicates
      await tx.payslip.deleteMany({
        where: { payrollRunId: existingRun.id },
      });

      payrollRunId = existingRun.id;
    } else {
      const newRun = await tx.payrollRun.create({
        data: {
          companyId: session.companyId,
          month,
          year,
          totalAmount: 0,
          status: PayrollStatus.PROCESSING,
          payDate,
        },
      });
      payrollRunId = newRun.id;
    }

    let batchTotalNet = 0;
    let batchTotalGross = 0;
    let batchTotalTax = 0;
    const generatedPayslips = [];

    // Calculate and create payslip for each eligible employee
    for (const emp of eligibleEmployees) {
      const breakdown = calculateEmployeeSalary(emp.baseSalary ? Number(emp.baseSalary) : null);
      
      const payslip = await tx.payslip.create({
        data: {
          payrollRunId,
          employeeId: emp.id,
          basicSalary: breakdown.basicSalary,
          allowances: breakdown.totalAllowances,
          deductions: breakdown.totalDeductions,
          tax: breakdown.tax,
          netSalary: breakdown.netSalary,
          paymentStatus: autoMarkPaid ? "PAID" : "PENDING",
          paymentMethod: "Direct Deposit / Automated Clearing House (ACH)",
        },
      });

      batchTotalNet += breakdown.netSalary;
      batchTotalGross += breakdown.grossSalary;
      batchTotalTax += breakdown.tax;

      generatedPayslips.push({
        ...payslip,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        employeeNumber: emp.employeeNumber,
        department: emp.department?.name ?? "General",
        designation: emp.designation?.title ?? "Staff",
        breakdown,
      });
    }

    // Finalize Payroll Run status & total amount
    const finalizedRun = await tx.payrollRun.update({
      where: { id: payrollRunId },
      data: {
        totalAmount: Math.round(batchTotalNet * 100) / 100,
        status: autoMarkPaid ? PayrollStatus.PAID : PayrollStatus.PROCESSING,
        payDate,
      },
    });

    // Create Audit Log entry
    await tx.auditLog.create({
      data: {
        userId: session.sub,
        action: "EXECUTE_PAYROLL_BATCH",
        module: "PAYROLL",
        entityId: payrollRunId,
        details: {
          month,
          year,
          employeeCount: eligibleEmployees.length,
          totalNet: batchTotalNet,
          totalGross: batchTotalGross,
          totalTax: batchTotalTax,
          branchId: targetBranchId ?? "ALL_BRANCHES",
        },
      },
    });

    return {
      run: finalizedRun,
      summary: {
        month,
        year,
        employeeCount: eligibleEmployees.length,
        totalNet: Math.round(batchTotalNet * 100) / 100,
        totalGross: Math.round(batchTotalGross * 100) / 100,
        totalTax: Math.round(batchTotalTax * 100) / 100,
        averageNet: Math.round((batchTotalNet / eligibleEmployees.length) * 100) / 100,
      },
      payslips: generatedPayslips,
    };
  });
}

/**
 * Retrieves summary metrics and list of historical payroll runs.
 */
export async function getPayrollOverview(session: AuthTokenPayload) {
  // 1. Fetch runs for caller's tenant
  const runs = await prisma.payrollRun.findMany({
    where: { companyId: session.companyId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: {
      payslips: {
        select: {
          id: true,
          netSalary: true,
          tax: true,
          allowances: true,
          basicSalary: true,
          deductions: true,
          employeeId: true,
        },
      },
    },
  });

  // Calculate aggregated platform figures
  let totalDisbursed = 0;
  let totalTaxCollected = 0;
  let totalPayslipCount = 0;

  const formattedRuns = runs.map((r) => {
    const netSum = r.payslips.reduce((acc, p) => acc + Number(p.netSalary), 0);
    const taxSum = r.payslips.reduce((acc, p) => acc + Number(p.tax), 0);
    const count = r.payslips.length;

    totalDisbursed += netSum;
    totalTaxCollected += taxSum;
    totalPayslipCount += count;

    return {
      id: r.id,
      month: r.month,
      year: r.year,
      totalAmount: Number(r.totalAmount),
      status: r.status,
      payDate: r.payDate,
      employeeCount: count,
      taxTotal: taxSum,
      createdAt: r.createdAt,
    };
  });

  // Count active employees currently on roster
  const activeEmployeeCount = await prisma.employee.count({
    where: {
      companyId: session.companyId,
      status: "ACTIVE",
      onboardingStatus: "ACTIVE",
    },
  });

  return {
    kpis: {
      totalDisbursed: Math.round(totalDisbursed * 100) / 100,
      totalTaxCollected: Math.round(totalTaxCollected * 100) / 100,
      totalBatches: runs.length,
      activeEmployeeCount,
      latestRun: formattedRuns[0] || null,
    },
    runs: formattedRuns,
  };
}

export interface GetPayslipsFilter {
  payrollRunId?: string;
  month?: number;
  year?: number;
  search?: string;
  paymentStatus?: string;
}

/**
 * Retrieves payslips with multi-tenant and role-based visibility.
 */
export async function getPayslips(session: AuthTokenPayload, filters?: GetPayslipsFilter) {
  const whereClause: any = {
    payrollRun: {
      companyId: session.companyId,
    },
  };

  // Role Scoping:
  if (
    session.role === Role.EMPLOYEE ||
    session.role === Role.TEAM_LEAD ||
    session.role === Role.DEPARTMENT_ADMIN
  ) {
    // Non-HR users can strictly only view their own payslips
    if (!session.employeeId) {
      // Find employee record by email
      const emp = await prisma.employee.findUnique({
        where: { email: session.email },
        select: { id: true },
      });
      if (!emp) return [];
      whereClause.employeeId = emp.id;
    } else {
      whereClause.employeeId = session.employeeId;
    }
  } else if (session.role === Role.BRANCH_ADMIN) {
    // Branch Admin can only view payslips of employees in their assigned branch
    if (session.branchId) {
      whereClause.employee = {
        branchId: session.branchId,
      };
    }
  }

  // Filter overrides
  if (filters?.payrollRunId) {
    whereClause.payrollRunId = filters.payrollRunId;
  }
  if (filters?.month) {
    whereClause.payrollRun = {
      ...whereClause.payrollRun,
      month: filters.month,
    };
  }
  if (filters?.year) {
    whereClause.payrollRun = {
      ...whereClause.payrollRun,
      year: filters.year,
    };
  }
  if (filters?.paymentStatus) {
    whereClause.paymentStatus = filters.paymentStatus;
  }
  if (filters?.search) {
    const term = filters.search.trim();
    whereClause.employee = {
      ...whereClause.employee,
      OR: [
        { firstName: { contains: term, mode: "insensitive" } },
        { lastName: { contains: term, mode: "insensitive" } },
        { employeeNumber: { contains: term, mode: "insensitive" } },
      ],
    };
  }

  const payslips = await prisma.payslip.findMany({
    where: whereClause,
    include: {
      payrollRun: {
        select: {
          month: true,
          year: true,
          payDate: true,
          status: true,
        },
      },
      employee: {
        select: {
          id: true,
          employeeNumber: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
          currency: true,
          department: { select: { name: true, code: true } },
          designation: { select: { title: true, code: true } },
          branch: { select: { name: true, city: true } },
        },
      },
    },
    orderBy: [
      { payrollRun: { year: "desc" } },
      { payrollRun: { month: "desc" } },
      { createdAt: "desc" },
    ],
  });

  return payslips.map((p) => {
    const rawBasic = Number(p.basicSalary);
    const breakdown = calculateEmployeeSalary(rawBasic);

    return {
      id: p.id,
      payrollRunId: p.payrollRunId,
      month: p.payrollRun.month,
      year: p.payrollRun.year,
      payDate: p.payrollRun.payDate,
      employeeId: p.employeeId,
      employeeNumber: p.employee.employeeNumber,
      employeeName: `${p.employee.firstName} ${p.employee.lastName}`,
      email: p.employee.email,
      avatarUrl: p.employee.avatarUrl,
      currency: p.employee.currency || "USD",
      department: p.employee.department?.name || "General",
      designation: p.employee.designation?.title || "Staff",
      branch: p.employee.branch?.name || "Global HQ",
      basicSalary: Number(p.basicSalary),
      allowances: Number(p.allowances),
      deductions: Number(p.deductions),
      tax: Number(p.tax),
      netSalary: Number(p.netSalary),
      paymentStatus: p.paymentStatus,
      paymentMethod: p.paymentMethod || "Direct Deposit (ACH)",
      breakdown,
      createdAt: p.createdAt,
    };
  });
}

/**
 * Retrieves a single payslip by ID with full audit & line-item metadata for printable receipt generation.
 */
export async function getPayslipById(payslipId: string, session: AuthTokenPayload) {
  const payslip = await prisma.payslip.findUnique({
    where: { id: payslipId },
    include: {
      payrollRun: {
        include: {
          company: true,
        },
      },
      employee: {
        include: {
          department: true,
          designation: true,
          branch: true,
          company: true,
        },
      },
    },
  });

  if (!payslip) {
    throw new Error("Payslip not found.");
  }

  // Multi-tenant check
  if (payslip.payrollRun.companyId !== session.companyId) {
    throw new Error("Unauthorized: Payslip belongs to a different company.");
  }

  // Role permissions check
  if (
    session.role === Role.EMPLOYEE ||
    session.role === Role.TEAM_LEAD ||
    session.role === Role.DEPARTMENT_ADMIN
  ) {
    // Non-HR can only inspect their own
    const userEmpId = session.employeeId;
    if (userEmpId && payslip.employeeId !== userEmpId) {
      throw new Error("Unauthorized: You can only view your own payslip.");
    }
  } else if (session.role === Role.BRANCH_ADMIN) {
    if (session.branchId && payslip.employee.branchId !== session.branchId) {
      throw new Error("Unauthorized: You cannot access payslips outside your branch.");
    }
  }

  const breakdown = calculateEmployeeSalary(Number(payslip.basicSalary));

  return {
    id: payslip.id,
    payrollRunId: payslip.payrollRunId,
    month: payslip.payrollRun.month,
    year: payslip.payrollRun.year,
    payDate: payslip.payrollRun.payDate,
    paymentStatus: payslip.paymentStatus,
    paymentMethod: payslip.paymentMethod || "Direct Deposit (ACH)",
    basicSalary: Number(payslip.basicSalary),
    allowances: Number(payslip.allowances),
    deductions: Number(payslip.deductions),
    tax: Number(payslip.tax),
    netSalary: Number(payslip.netSalary),
    breakdown,
    company: {
      id: payslip.payrollRun.company.id,
      name: payslip.payrollRun.company.name,
      legalName: payslip.payrollRun.company.legalName || payslip.payrollRun.company.name,
      currency: payslip.payrollRun.company.currency || "USD",
      website: payslip.payrollRun.company.website,
    },
    employee: {
      id: payslip.employee.id,
      employeeNumber: payslip.employee.employeeNumber,
      firstName: payslip.employee.firstName,
      lastName: payslip.employee.lastName,
      fullName: `${payslip.employee.firstName} ${payslip.employee.lastName}`,
      email: payslip.employee.email,
      phone: payslip.employee.phone,
      hireDate: payslip.employee.hireDate,
      department: payslip.employee.department?.name || "General",
      designation: payslip.employee.designation?.title || "Staff",
      branch: payslip.employee.branch?.name || "Global HQ",
      branchCity: payslip.employee.branch?.city || "New York",
      currency: payslip.employee.currency || "USD",
    },
    createdAt: payslip.createdAt,
  };
}
