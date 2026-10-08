export type Role =
  | "SUPER_ADMIN"
  | "COMPANY_ADMIN"
  | "BRANCH_ADMIN"
  | "DEPARTMENT_ADMIN"
  | "TEAM_LEAD"
  | "EMPLOYEE";

export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN" | "REMOTE";

export type EmployeeStatus = "ACTIVE" | "PROBATION" | "ON_LEAVE" | "TERMINATED" | "RESIGNED";

export type OnboardingStatus =
  | "DRAFT"
  | "PENDING_DEPT_APPROVAL"
  | "DEPT_APPROVED"
  | "PENDING_BRANCH_APPROVAL"
  | "ACTIVE"
  | "REJECTED";

export type AttendanceStatus = "PRESENT" | "LATE" | "HALF_DAY" | "ABSENT" | "ON_LEAVE" | "HOLIDAY";

export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type TimesheetStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";

export interface ApprovalLog {
  id: string;
  stage: "DEPARTMENT_REVIEW" | "BRANCH_REVIEW";
  action: "APPROVE" | "REJECT";
  reviewerName: string;
  reviewerRole: string;
  comments?: string;
  date: string;
}

export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  branch: string;
  branchId?: string | null;
  department: string;
  departmentId?: string | null;
  team?: string;
  teamId?: string | null;
  designation: string;
  managerName?: string;
  createdByName?: string;
  hireDate: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  onboardingStatus: OnboardingStatus;
  baseSalary: number;
  currency: string;
  location?: string;
  approvalHistory?: ApprovalLog[];
}

export type SubscriptionTier = "STARTER" | "GROWTH" | "ENTERPRISE";

export type SubscriptionStatus = "ACTIVE" | "TRIAL" | "PAST_DUE" | "SUSPENDED" | "CANCELLED";

export interface CompanyRecord {
  id: string;
  name: string;
  legalName?: string;
  subdomain: string;
  plan: SubscriptionTier | "PROFESSIONAL";
  currency: string;
  timezone: string;
  adminName: string;
  adminEmail: string;
  branchCount: number;
  employeeCount: number;
  status: SubscriptionStatus;
  maxSeats?: number;
  maxBranches?: number;
  monthlyPrice?: number;
  seatUtilizationPct?: number;
  renewalDate?: string;
  createdAt: string;
}

export interface SubscriptionRecord {
  id: string;
  companyId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  maxSeats: number;
  maxBranches: number;
  monthlyPrice: number;
  billingCycle: "MONTHLY" | "ANNUAL";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string | null;
  features: string[];
}

export interface InvoiceRecord {
  id: string;
  subscriptionId?: string | null;
  companyId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: "PAID" | "PENDING" | "FAILED";
  billingDate: string;
  paidAt?: string | null;
  pdfUrl?: string | null;
  planName: string;
  seatsBilled: number;
  createdAt: string;
}

export interface TenantRecord {
  id: string;
  name: string;
  legalName?: string | null;
  subdomain: string;
  currency: string;
  timezone: string;
  website?: string | null;
  adminName: string;
  adminEmail: string;
  branchCount: number;
  employeeCount: number;
  status: SubscriptionStatus;
  plan: SubscriptionTier;
  monthlyPrice: number;
  maxSeats: number;
  maxBranches: number;
  seatUtilizationPct: number;
  renewalDate: string;
  createdAt: string;
}

export interface TenantSubscriptionDetails {
  subscription: SubscriptionRecord;
  quotas: {
    seatsUsed: number;
    maxSeats: number;
    seatsRemaining: number;
    seatUtilizationPct: number;
    branchesUsed: number;
    maxBranches: number;
    branchesRemaining: number;
  };
  features: string[];
  invoices: InvoiceRecord[];
}

export interface BranchRecord {
  id: string;
  companyId?: string;
  companyName?: string;
  name: string;
  code: string;
  city: string;
  country: string;
  adminName: string;
  departmentCount: number;
  employeeCount: number;
}

export interface DepartmentRecord {
  id: string;
  name: string;
  code: string;
  branchId: string;
  branchName: string;
  adminName: string;
  teamCount: number;
  employeeCount: number;
}

export interface TeamRecord {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  departmentName: string;
  leadName: string;
  memberCount: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  department: string;
  branch: string;
  date: string;
  punchIn?: string;
  punchOut?: string;
  workHours?: number;
  status: AttendanceStatus | string;
  ipAddress?: string;
}

export interface LeaveRequestRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  department: string;
  leaveType: string;
  leaveTypeCode: string;
  colorHex: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;
  approvedBy?: string;
}

export interface LeaveBalanceRecord {
  id: string;
  leaveType: string;
  leaveTypeId: string;
  colorHex: string;
  isPaid: boolean;
  allocatedDays: number;
  usedDays: number;
  pendingDays: number;
  availableDays: number;
}

export interface LeaveTypeRecord {
  id: string;
  name: string;
  code: string;
  defaultDays: number;
  isPaid: boolean;
  colorHex: string;
}

export interface ProjectMemberRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  email?: string;
  avatarUrl?: string | null;
  department?: string;
  designation?: string;
  role: string;
  joinedAt?: string | Date;
}

export interface ProjectRecord {
  id: string;
  name: string;
  code: string;
  client?: string;
  clientName?: string;
  clientId?: string | null;
  description?: string | null;
  status: "ACTIVE" | "COMPLETED" | "ON_HOLD" | "PLANNING" | "CANCELLED";
  budget: number;
  hoursSpent?: number;
  totalHours?: number;
  totalHoursLogged?: number;
  approvedHours?: number;
  teamCount?: number;
  memberCount?: number;
  deadline?: string;
  startDate?: string | null;
  endDate?: string | null;
  members?: ProjectMemberRecord[];
}

export interface TimesheetRecord {
  id: string;
  projectId?: string;
  projectName: string;
  projectCode?: string;
  employeeId?: string;
  employeeName: string;
  employeeNumber?: string;
  employeeAvatar?: string | null;
  department?: string;
  designation?: string;
  date: string;
  hoursWorked: number;
  taskDescription: string;
  status: TimesheetStatus;
  createdAt?: string | Date;
}

export interface SalaryBreakdownRecord {
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

export interface PayslipDetailRecord {
  id: string;
  payrollRunId: string;
  month: number;
  year: number;
  payDate?: string | null;
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  email: string;
  avatarUrl?: string | null;
  currency: string;
  department: string;
  designation: string;
  branch: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  tax: number;
  netSalary: number;
  paymentStatus: string;
  paymentMethod: string;
  breakdown: SalaryBreakdownRecord;
  createdAt: string;
}

export interface PayrollRunRecord {
  id: string;
  month: number;
  year: number;
  totalAmount: number;
  status: string;
  payDate?: string | null;
  employeeCount: number;
  taxTotal: number;
  createdAt: string;
}

export interface PayrollOverviewRecord {
  kpis: {
    totalDisbursed: number;
    totalTaxCollected: number;
    totalBatches: number;
    activeEmployeeCount: number;
    latestRun: PayrollRunRecord | null;
  };
  runs: PayrollRunRecord[];
}

export interface PayrollRecord {
  id: string;
  employeeName: string;
  employeeNumber: string;
  department: string;
  designation: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  tax: number;
  netSalary: number;
  status: "PAID" | "PENDING" | "PROCESSING";
  paymentDate?: string;
}

// ---------------------------------------------------------
// PHASE 10: AI WORKFORCE INSIGHTS & ANALYTICS TYPES
// ---------------------------------------------------------

export type AttritionRiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type PerformanceRating =
  | "OUTSTANDING"
  | "EXCEEDS_EXPECTATIONS"
  | "MEETS_EXPECTATIONS"
  | "NEEDS_IMPROVEMENT";

export interface AttritionAssessmentRecord {
  id: string;
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  avatarUrl?: string | null;
  department: string;
  designation: string;
  branch: string;
  riskScore: number; // 0 - 100
  riskLevel: AttritionRiskLevel;
  overtimeHours: number;
  leaveUtilizationPct: number;
  salaryPercentile: number;
  tenureMonths: number;
  primaryFactors: string[];
  recommendations: string[];
  calculatedAt: string;
}

export interface DepartmentAttritionMetric {
  department: string;
  employeeCount: number;
  averageRiskScore: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  primaryDriver: string;
}

export interface PerformanceReviewRecord {
  id: string;
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  avatarUrl?: string | null;
  department: string;
  designation: string;
  reviewerId?: string | null;
  reviewerName?: string | null;
  period: string;
  rating: PerformanceRating;
  summary: string;
  strengths: string[];
  growthAreas: string[];
  goals: string[];
  metricsScore: number;
  aiGenerated: boolean;
  status: "DRAFT" | "PUBLISHED" | "ACKNOWLEDGED";
  createdAt: string;
  updatedAt: string;
}

export interface WorkforceForecastProjection {
  month: string;
  headcount: number;
  basePayroll: number;
  benefitsCost: number;
  taxesCost: number;
  totalExpenditure: number;
  hiringAdditions: number;
  projectedDepartures: number;
}

export interface WorkforceForecastScenario {
  scenarioName: "CONSERVATIVE" | "BASELINE" | "AGGRESSIVE";
  hiringGrowthRate: number; // percentage e.g. 5, 12, 25
  annualMeritIncrease: number; // e.g. 3, 5, 8
  sixMonthProjectedHeadcount: number;
  twelveMonthProjectedHeadcount: number;
  sixMonthProjectedPayroll: number;
  twelveMonthProjectedPayroll: number;
  projections: WorkforceForecastProjection[];
}

export interface AIInsightsOverview {
  kpis: {
    overallCompanyRiskScore: number;
    highRiskEmployeeCount: number;
    burnoutIndexPct: number;
    estimatedRetentionSavings: number;
    completedReviewsCount: number;
  };
  departmentHeatmap: DepartmentAttritionMetric[];
  highRiskEmployees: AttritionAssessmentRecord[];
  recentReviews: PerformanceReviewRecord[];
  forecast: WorkforceForecastScenario;
}

