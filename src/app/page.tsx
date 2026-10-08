"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Clock,
  Calendar,
  Briefcase,
  DollarSign,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  Shield,
  GitBranch,
  Layers,
  UserCheck,
  TrendingUp,
  FileCheck,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Award,
  Check,
  Globe,
  ExternalLink,
  Laptop,
  LogOut,
  Receipt,
  Printer,
  Download,
  CreditCard,
  Wallet,
  Banknote,
  FileText,
  Zap,
  RefreshCw,
  ShieldCheck,
  Brain,
  Activity,
  Flame,
  Target,
  LineChart,
} from "lucide-react";
import {
  initialCompanies,
  initialEmployees,
  initialBranches,
  initialDepartmentsList,
  initialTeamsList,
  initialAttendances,
  initialLeaveRequests,
  initialProjects,
  initialTimesheets,
  initialPayroll,
} from "@/lib/mockData";
import {
  CompanyRecord,
  Employee,
  BranchRecord,
  DepartmentRecord,
  TeamRecord,
  Role,
  OnboardingStatus,
  ApprovalLog,
  LeaveRequestRecord,
  LeaveBalanceRecord,
  LeaveTypeRecord,
  PayslipDetailRecord,
  PayrollRunRecord,
  PayrollOverviewRecord,
  ProjectRecord,
  TimesheetRecord,
  SubscriptionTier,
  SubscriptionStatus,
  SubscriptionRecord,
  InvoiceRecord,
  TenantRecord,
  TenantSubscriptionDetails,
  AttritionRiskLevel,
  AttritionAssessmentRecord,
  DepartmentAttritionMetric,
  PerformanceReviewRecord,
  PerformanceRating,
  WorkforceForecastScenario,
  WorkforceForecastProjection,
  AIInsightsOverview,
} from "@/lib/types";

// User Personas for Multi-Role Switching
interface UserPersona {
  role: Role;
  name: string;
  email: string;
  title: string;
  avatar: string;
  branch?: string;
  department?: string;
  team?: string;
}

const personas: Record<Role, UserPersona> = {
  SUPER_ADMIN: {
    role: "SUPER_ADMIN",
    name: "Platform Owner",
    email: "superadmin@digisail.com",
    title: "Global SaaS Super Admin",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
  },
  COMPANY_ADMIN: {
    role: "COMPANY_ADMIN",
    name: "Sarah Jenkins",
    email: "sarah.jenkins@digisail.com",
    title: "Company HR Director",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    branch: "All Branches",
    department: "Executive",
  },
  BRANCH_ADMIN: {
    role: "BRANCH_ADMIN",
    name: "Michael Scott",
    email: "michael.scott@digisail.com",
    title: "Branch HR Manager (HQ-NYC)",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    branch: "New York Headquarters",
    department: "Branch HR",
  },
  DEPARTMENT_ADMIN: {
    role: "DEPARTMENT_ADMIN",
    name: "Alexander Chen",
    email: "alex.chen@digisail.com",
    title: "Head of Engineering",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    branch: "New York Headquarters",
    department: "Engineering",
  },
  TEAM_LEAD: {
    role: "TEAM_LEAD",
    name: "David Miller",
    email: "david.miller@digisail.com",
    title: "Cloud Systems Team Lead",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    branch: "New York Headquarters",
    department: "Engineering",
    team: "Core Platform & Cloud Team",
  },
  EMPLOYEE: {
    role: "EMPLOYEE",
    name: "Priya Patel",
    email: "priya.patel@digisail.com",
    title: "Senior Fullstack Engineer",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    branch: "New York Headquarters",
    department: "Engineering",
    team: "Core Platform & Cloud Team",
  },
};

export default function DigiSailHRMDashboard() {
  // Current Active Persona / Role
  const [currentRole, setCurrentRole] = useState<Role>("SUPER_ADMIN");
  const [sessionUserRole, setSessionUserRole] = useState<Role>("SUPER_ADMIN");
  const [authenticatedUser, setAuthenticatedUser] = useState<{
    id: string;
    email: string;
    name: string;
    role: Role;
    company?: {
      id: string;
      name: string;
      legalName?: string;
      subdomain?: string;
      currency?: string;
      timezone?: string;
      subscription?: {
        tier: string;
        status: string;
        maxSeats?: number;
        maxBranches?: number;
      };
    };
    employee?: {
      id?: string;
      employeeNumber?: string;
      firstName?: string;
      lastName?: string;
      avatarUrl?: string | null;
      branchId?: string;
      departmentId?: string;
      teamId?: string;
      status?: string;
      onboardingStatus?: string;
      designation?: { title?: string };
      branch?: { id?: string; name?: string; code?: string };
      department?: { id?: string; name?: string; code?: string };
    };
    administeredBranches?: any[];
    administeredDepartments?: any[];
    ledTeams?: any[];
  } | null>(null);

  // If Super Admin deliberately switches perspective in demo mode, show that demo persona.
  // Otherwise, if an authenticated session user exists, show the user's REAL account profile!
  const isDemoRoleSwitched = sessionUserRole === "SUPER_ADMIN" && currentRole !== "SUPER_ADMIN";
  const currentUser: UserPersona = (authenticatedUser && !isDemoRoleSwitched)
    ? {
        role: currentRole,
        name: authenticatedUser.name || (authenticatedUser.email ? authenticatedUser.email.split("@")[0] : "Administrator"),
        email: authenticatedUser.email,
        title: authenticatedUser.employee?.designation?.title || (
          authenticatedUser.role === "COMPANY_ADMIN" ? "Company HR Director" :
          authenticatedUser.role === "SUPER_ADMIN" ? "Global SaaS Super Admin" :
          authenticatedUser.role === "BRANCH_ADMIN" ? "Branch HR Manager" :
          authenticatedUser.role === "DEPARTMENT_ADMIN" ? "Department Head" :
          authenticatedUser.role === "TEAM_LEAD" ? "Team Lead" : "Staff Member"
        ),
        avatar: authenticatedUser.employee?.avatarUrl ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(authenticatedUser.name || authenticatedUser.email)}&background=6366f1&color=fff&bold=true`,
        branch: authenticatedUser.employee?.branch?.name || (
          authenticatedUser.role === "COMPANY_ADMIN" || authenticatedUser.role === "SUPER_ADMIN"
            ? "All Branches"
            : "Main Branch"
        ),
        department: authenticatedUser.employee?.department?.name || (
          authenticatedUser.role === "COMPANY_ADMIN" ? "Executive" : "Operations"
        ),
        team: authenticatedUser.employee?.department?.name,
      }
    : personas[currentRole];
  const canSwitchRole = sessionUserRole === "SUPER_ADMIN";

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    | "companies"
    | "dashboard"
    | "approvals"
    | "hierarchy"
    | "employees"
    | "attendance"
    | "leaves"
    | "projects"
    | "payroll"
    | "billing"
    | "ai-insights"
  >("dashboard");

  // State Management: Companies (SaaS Multi-Tenancy)
  const [companies, setCompanies] = useState<CompanyRecord[]>(initialCompanies);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("digisail-company-1");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const activeCompany = companies.find((c) => c.id === selectedCompanyId) || companies[0];

  // Phase 9: SaaS Multi-Tenancy & Tenant Billing State
  const [subscriptionDetails, setSubscriptionDetails] = useState<TenantSubscriptionDetails | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [targetUpgradeTier, setTargetUpgradeTier] = useState<SubscriptionTier>("GROWTH");
  const [selectedInvoiceForReceipt, setSelectedInvoiceForReceipt] = useState<InvoiceRecord | null>(null);
  const [isUpgradingPlan, setIsUpgradingPlan] = useState(false);
  const [tenantSearchQuery, setTenantSearchQuery] = useState("");
  const [tenantTierFilter, setTenantTierFilter] = useState<"ALL" | SubscriptionTier>("ALL");
  const [managingTenantId, setManagingTenantId] = useState<string | null>(null);

  // Phase 10: AI Workforce Insights & Analytics State
  const [aiOverview, setAiOverview] = useState<AIInsightsOverview | null>(null);
  const [aiSubTab, setAiSubTab] = useState<"attrition" | "reviews" | "forecast">("attrition");
  const [selectedForecastScenario, setSelectedForecastScenario] = useState<"CONSERVATIVE" | "BASELINE" | "AGGRESSIVE">("BASELINE");
  const [selectedReviewEmployeeId, setSelectedReviewEmployeeId] = useState<string>("");
  const [selectedReviewPeriod, setSelectedReviewPeriod] = useState<string>("2026-Q3");
  const [isSynthesizingReview, setIsSynthesizingReview] = useState(false);
  const [isPublishingReview, setIsPublishingReview] = useState(false);
  const [currentSynthesizedReview, setCurrentSynthesizedReview] = useState<PerformanceReviewRecord | null>(null);
  const [selectedRetentionCandidate, setSelectedRetentionCandidate] = useState<AttritionAssessmentRecord | null>(null);
  const [showRetentionStrategyModal, setShowRetentionStrategyModal] = useState(false);
  const [selectedReviewForPrint, setSelectedReviewForPrint] = useState<PerformanceReviewRecord | null>(null);
  const [showPrintReviewModal, setShowPrintReviewModal] = useState(false);
  const [performanceReviewsList, setPerformanceReviewsList] = useState<PerformanceReviewRecord[]>([]);

  // State Management: Branches, Depts, Teams, Employees
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [branches, setBranches] = useState<BranchRecord[]>(initialBranches);
  const [departments, setDepartments] = useState<DepartmentRecord[]>(initialDepartmentsList);
  const [teams, setTeams] = useState<TeamRecord[]>(initialTeamsList);
  const [attendances, setAttendances] = useState(initialAttendances);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestRecord[]>(initialLeaveRequests);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalanceRecord[]>([
    {
      id: "bal-1",
      leaveType: "Annual Vacation",
      leaveTypeId: "lt-annual",
      colorHex: "#3b82f6",
      isPaid: true,
      allocatedDays: 14,
      usedDays: 2,
      pendingDays: 1,
      availableDays: 11,
    },
    {
      id: "bal-2",
      leaveType: "Medical / Sick Leave",
      leaveTypeId: "lt-sick",
      colorHex: "#ef4444",
      isPaid: true,
      allocatedDays: 10,
      usedDays: 1,
      pendingDays: 0,
      availableDays: 9,
    },
    {
      id: "bal-3",
      leaveType: "Casual / Personal Leave",
      leaveTypeId: "lt-casual",
      colorHex: "#f59e0b",
      isPaid: true,
      allocatedDays: 7,
      usedDays: 0,
      pendingDays: 0,
      availableDays: 7,
    },
    {
      id: "bal-4",
      leaveType: "Parental / Family Care",
      leaveTypeId: "lt-parental",
      colorHex: "#ec4899",
      isPaid: true,
      allocatedDays: 30,
      usedDays: 0,
      pendingDays: 0,
      availableDays: 30,
    },
  ]);
  const [availableLeaveTypes, setAvailableLeaveTypes] = useState<LeaveTypeRecord[]>([
    { id: "5c82b6f9-07fd-4c7c-8cfc-61a5d60f6f3c", name: "Annual Vacation", code: "ANNUAL", defaultDays: 14, isPaid: true, colorHex: "#3b82f6" },
    { id: "f3b963b0-0105-46c1-a51e-31bc31b734f8", name: "Medical / Sick Leave", code: "SICK", defaultDays: 10, isPaid: true, colorHex: "#ef4444" },
    { id: "lt-casual", name: "Casual / Personal Leave", code: "CASUAL", defaultDays: 7, isPaid: true, colorHex: "#f59e0b" },
    { id: "lt-parental", name: "Parental / Family Care", code: "PARENTAL", defaultDays: 30, isPaid: true, colorHex: "#ec4899" },
  ]);
  const [showApplyLeaveModal, setShowApplyLeaveModal] = useState(false);
  const [newLeaveForm, setNewLeaveForm] = useState({
    leaveTypeId: "",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [leaveStatusFilter, setLeaveStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [leaveSearchQuery, setLeaveSearchQuery] = useState("");
  const [approvalSubTab, setApprovalSubTab] = useState<"ONBOARDING" | "LEAVES">("ONBOARDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");

  // State Management: Payroll (Phase 7)
  const [payrollOverview, setPayrollOverview] = useState<PayrollOverviewRecord>({
    kpis: {
      totalDisbursed: 52103.34,
      totalTaxCollected: 9180.00,
      totalBatches: 1,
      activeEmployeeCount: 6,
      latestRun: {
        id: "run-sep-2026",
        month: 9,
        year: 2026,
        totalAmount: 52103.34,
        status: "PAID",
        payDate: "2026-09-30",
        employeeCount: 6,
        taxTotal: 9180,
        createdAt: "2026-09-30T10:00:00Z",
      },
    },
    runs: [
      {
        id: "run-sep-2026",
        month: 9,
        year: 2026,
        totalAmount: 52103.34,
        status: "PAID",
        payDate: "2026-09-30",
        employeeCount: 6,
        taxTotal: 9180,
        createdAt: "2026-09-30T10:00:00Z",
      },
    ],
  });
  const [payslips, setPayslips] = useState<PayslipDetailRecord[]>([]);
  const [payrollSubTab, setPayrollSubTab] = useState<"payslips" | "batches">("payslips");
  const [payrollMonthFilter, setPayrollMonthFilter] = useState<number | "ALL">(9);
  const [payrollYearFilter, setPayrollYearFilter] = useState<number>(2026);
  const [payrollSearchQuery, setPayrollSearchQuery] = useState("");
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipDetailRecord | null>(null);
  const [showProcessPayrollModal, setShowProcessPayrollModal] = useState(false);
  const [isProcessingPayroll, setIsProcessingPayroll] = useState(false);
  const [processPayrollForm, setProcessPayrollForm] = useState({
    month: 10,
    year: 2026,
    branchId: "ALL",
    autoMarkPaid: true,
  });

  // State Management: Projects & Timesheets (Phase 8)
  const [projectsList, setProjectsList] = useState<ProjectRecord[]>(initialProjects);
  const [timesheetsList, setTimesheetsList] = useState<TimesheetRecord[]>(initialTimesheets);
  const [projectSubTab, setProjectSubTab] = useState<"projects" | "timesheets">("projects");
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>("ALL");
  const [timesheetStatusFilter, setTimesheetStatusFilter] = useState<string>("ALL");
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showLogTimesheetModal, setShowLogTimesheetModal] = useState(false);
  const [isSubmittingTimesheet, setIsSubmittingTimesheet] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({
    name: "",
    code: "",
    clientName: "DigiSail SaaS Core",
    budget: 150000,
    description: "",
    startDate: "2026-10-01",
    endDate: "2027-04-30",
  });
  const [newTimesheetForm, setNewTimesheetForm] = useState({
    projectId: "",
    date: new Date().toISOString().split("T")[0],
    hoursWorked: 8.0,
    taskDescription: "",
  });

  // Time & Punch In/Out State
  const [isPunchedIn, setIsPunchedIn] = useState(true);
  const [punchTime, setPunchTime] = useState("08:45 AM");
  const [currentTime, setCurrentTime] = useState("");

  // Modals
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [showProposeCandidateModal, setShowProposeCandidateModal] = useState(false);
  const [showCreateBranchModal, setShowCreateBranchModal] = useState(false);
  const [showCreateDeptModal, setShowCreateDeptModal] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [approvalModalCandidate, setApprovalModalCandidate] = useState<Employee | null>(null);
  const [approvalModalAction, setApprovalModalAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [approvalComments, setApprovalComments] = useState("");

  // Form State: Create Company (SaaS Super Admin)
  const [newCompany, setNewCompany] = useState({
    name: "",
    legalName: "",
    subdomain: "",
    plan: "GROWTH" as SubscriptionTier,
    currency: "USD",
    timezone: "America/New_York",
    adminName: "",
    adminEmail: "",
    adminPassword: "password123",
    branchName: "",
    branchCode: "",
  });

  // Form State: Propose Candidate
  const [newCandidate, setNewCandidate] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    branch: "New York Headquarters",
    department: "Engineering",
    team: "Core Platform & Cloud Team",
    designation: "Software Engineer",
    baseSalary: 95000,
  });

  // Form State: Create Branch
  const [newBranch, setNewBranch] = useState({
    companyId: "digisail-company-1",
    name: "",
    code: "",
    city: "",
    country: "United States",
    adminName: "",
  });

  // Form State: Create Dept
  const [newDept, setNewDept] = useState({
    name: "",
    code: "",
    branchName: "New York Headquarters",
    adminName: "",
  });

  // Form State: Create Team
  const [newTeam, setNewTeam] = useState({
    name: "",
    code: "",
    departmentName: "Engineering",
    leadName: "",
  });

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync Live Data from Backend API
  const fetchLiveData = async (overrideCompanyId?: string) => {
    try {
      let effectiveRole: Role | null = sessionUserRole;
      let targetCompanyId = overrideCompanyId || selectedCompanyId;

      // 0. Fetch authenticated session user to enforce role restrictions
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meJson = await meRes.json();
        if (meJson.success && meJson.data?.user) {
          const user = meJson.data.user;
          setAuthenticatedUser(user);
          const userRole = user.role as Role;
          effectiveRole = userRole;
          setSessionUserRole(userRole);

          if (userRole !== "SUPER_ADMIN") {
            setCurrentRole(userRole);
            setActiveTab("dashboard");
            if (user.company) {
              targetCompanyId = user.company.id;
              setSelectedCompanyId(user.company.id);
              const userCompRecord: CompanyRecord = {
                id: user.company.id,
                name: user.company.name,
                legalName: user.company.legalName || user.company.name,
                subdomain: user.company.subdomain || "tenant",
                plan: (user.company.subscription?.tier || "GROWTH") as SubscriptionTier,
                currency: user.company.currency || "USD",
                timezone: user.company.timezone || "America/New_York",
                status: (user.company.subscription?.status || "ACTIVE") as any,
                adminName: user.name,
                adminEmail: user.email,
                branchCount: 1,
                employeeCount: 1,
                monthlyPrice: user.company.subscription?.tier === "ENTERPRISE" ? 1999 : 799,
                createdAt: new Date().toISOString(),
              };
              setCompanies([userCompRecord]);
            }
          } else {
            setActiveTab((prev) => (prev === "dashboard" ? "companies" : prev));
          }
        }
      }

      const isIsolatedTenant = effectiveRole !== "SUPER_ADMIN" || targetCompanyId !== "digisail-company-1";
      const companyQueryParam = effectiveRole === "SUPER_ADMIN" && targetCompanyId ? `?companyId=${targetCompanyId}` : "";

      // 1. Fetch live employees
      const empRes = await fetch(`/api/employees${companyQueryParam}`);
      if (empRes.ok) {
        const empJson = await empRes.json();
        if (empJson.success && Array.isArray(empJson.data)) {
          const liveMapped: Employee[] = empJson.data.map((item: any) => ({
            id: item.id,
            employeeNumber: item.employeeNumber,
            firstName: item.firstName,
            lastName: item.lastName,
            email: item.email,
            phone: item.phone || "+1 (555) 000-0000",
            avatarUrl: item.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.firstName + " " + item.lastName)}&background=6366f1&color=fff&bold=true`,
            branch: item.branch?.name || "Main Branch",
            department: item.department?.name || "Operations",
            team: item.team?.name || "Core Platform & Cloud Team",
            designation: item.designation?.title || "Staff Member",
            createdByName: item.createdBy?.email ? `User (${item.createdBy.email})` : "HR System",
            hireDate: item.hireDate ? new Date(item.hireDate).toISOString().split("T")[0] : "2026-01-01",
            employmentType: item.employmentType || "FULL_TIME",
            status: item.status || "ACTIVE",
            onboardingStatus: item.onboardingStatus || "ACTIVE",
            baseSalary: item.baseSalary ? Number(item.baseSalary) : 85000,
            currency: item.currency || "USD",
            location: item.branch?.name || "Main Branch",
            approvalHistory: [],
          }));

          if (isIsolatedTenant) {
            setEmployees(liveMapped);
          } else if (liveMapped.length > 0) {
            // Merge for DigiSail demo
            setEmployees((prev) => {
              const existingIds = new Set(liveMapped.map((e) => e.id));
              const retained = prev.filter((e) => !existingIds.has(e.id));
              return [...liveMapped, ...retained];
            });
          }
        }
      }

      // 2. Fetch live branches
      const branchRes = await fetch(`/api/org/branches${companyQueryParam}`);
      if (branchRes.ok) {
        const branchJson = await branchRes.json();
        if (branchJson.success && Array.isArray(branchJson.data)) {
          const liveBranches: BranchRecord[] = branchJson.data.map((b: any) => ({
            id: b.id,
            companyId: b.companyId,
            companyName: b.company?.name || (effectiveRole !== "SUPER_ADMIN" ? authenticatedUser?.company?.name : "Company Branch") || "Company Branch",
            name: b.name,
            code: b.code,
            city: b.city || "Headquarters",
            country: b.country || "",
            adminName: b.branchAdmin?.employee ? `${b.branchAdmin.employee.firstName} ${b.branchAdmin.employee.lastName}` : (b.branchAdmin?.email || "Branch Admin"),
            departmentCount: b._count?.departments || 0,
            employeeCount: b._count?.employees || 0,
          }));

          if (isIsolatedTenant) {
            setBranches(liveBranches);
          } else if (liveBranches.length > 0) {
            setBranches((prev) => {
              const ids = new Set(liveBranches.map((b) => b.id));
              return [...liveBranches, ...prev.filter((b) => !ids.has(b.id))];
            });
          }
        }
      }

      // 2b. Fetch live departments
      const deptRes = await fetch(`/api/org/departments${companyQueryParam}`);
      if (deptRes.ok) {
        const deptJson = await deptRes.json();
        if (deptJson.success && Array.isArray(deptJson.data)) {
          const liveDepts: DepartmentRecord[] = deptJson.data.map((d: any) => ({
            id: d.id,
            branchId: d.branchId,
            branchName: d.branch?.name || "Main Branch",
            name: d.name,
            code: d.code,
            adminName: d.deptAdmin?.employee ? `${d.deptAdmin.employee.firstName} ${d.deptAdmin.employee.lastName}` : (d.deptAdmin?.email || "Dept Admin"),
            teamCount: d._count?.teams || 0,
            employeeCount: d._count?.employees || 0,
          }));
          if (isIsolatedTenant) {
            setDepartments(liveDepts);
          } else if (liveDepts.length > 0) {
            setDepartments(liveDepts);
          }
        }
      }

      // 2c. Fetch live teams
      const teamRes = await fetch(`/api/org/teams${companyQueryParam}`);
      if (teamRes.ok) {
        const teamJson = await teamRes.json();
        if (teamJson.success && Array.isArray(teamJson.data)) {
          const liveTeams: TeamRecord[] = teamJson.data.map((t: any) => ({
            id: t.id,
            departmentId: t.departmentId,
            departmentName: t.department?.name || "Department",
            name: t.name,
            code: t.code,
            leadName: t.teamLead?.employee ? `${t.teamLead.employee.firstName} ${t.teamLead.employee.lastName}` : (t.teamLead?.email || "Team Lead"),
            employeeCount: t._count?.employees || 0,
          }));
          if (isIsolatedTenant) {
            setTeams(liveTeams);
          } else if (liveTeams.length > 0) {
            setTeams(liveTeams);
          }
        }
      }

      // 3. Fetch live leave requests
      const leaveRes = await fetch(`/api/leaves${companyQueryParam}`);
      if (leaveRes.ok) {
        const leaveJson = await leaveRes.json();
        if (leaveJson.success && Array.isArray(leaveJson.data)) {
          const liveLeaves: LeaveRequestRecord[] = leaveJson.data.map((l: any) => ({
            id: l.id,
            employeeId: l.employeeId,
            employeeName: l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : "Team Member",
            employeeAvatar: l.employee?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(l.employee?.firstName || "Staff")}&background=6366f1&color=fff`,
            department: l.employee?.department?.name || "Operations",
            leaveType: l.leaveType?.name || "Annual Vacation",
            leaveTypeCode: l.leaveType?.code || "ANNUAL",
            colorHex: l.leaveType?.colorHex || "#3b82f6",
            startDate: new Date(l.startDate).toISOString().split("T")[0],
            endDate: new Date(l.endDate).toISOString().split("T")[0],
            totalDays: Number(l.totalDays),
            reason: l.reason,
            status: l.status,
            appliedAt: new Date(l.createdAt).toISOString().split("T")[0],
            approvedBy: l.approvedBy?.employee ? `${l.approvedBy.employee.firstName} ${l.approvedBy.employee.lastName}` : l.approvedBy?.email,
          }));

          if (isIsolatedTenant) {
            setLeaveRequests(liveLeaves);
          } else {
            setLeaveRequests((prev) => {
              const liveIds = new Set(liveLeaves.map((x) => x.id));
              return [...liveLeaves, ...prev.filter((x) => !liveIds.has(x.id))];
            });
          }
        }
      }

      // 4. Fetch live leave quotas & balances
      const balRes = await fetch("/api/leaves/balances");
      if (balRes.ok) {
        const balJson = await balRes.json();
        if (balJson.success && Array.isArray(balJson.data) && balJson.data.length > 0) {
          setLeaveBalances(balJson.data);
        }
      }

      // 5. Fetch available leave types
      const typesRes = await fetch("/api/leaves/types");
      if (typesRes.ok) {
        const typesJson = await typesRes.json();
        if (typesJson.success && Array.isArray(typesJson.data) && typesJson.data.length > 0) {
          setAvailableLeaveTypes(typesJson.data);
        }
      }

      // 6. Fetch live payroll overview & batches (Phase 7)
      const payrollRes = await fetch("/api/payroll");
      if (payrollRes.ok) {
        const payrollJson = await payrollRes.json();
        if (payrollJson.success && payrollJson.data) {
          setPayrollOverview(payrollJson.data);
        } else if (isIsolatedTenant) {
          setPayrollOverview({
            kpis: {
              totalDisbursed: 0,
              totalTaxCollected: 0,
              totalBatches: 0,
              activeEmployeeCount: 1,
              latestRun: null,
            },
            runs: [],
          });
        }
      } else if (isIsolatedTenant) {
        setPayrollOverview({
          kpis: {
            totalDisbursed: 0,
            totalTaxCollected: 0,
            totalBatches: 0,
            activeEmployeeCount: 1,
            latestRun: null,
          },
          runs: [],
        });
      }

      // 7. Fetch live employee payslips (Phase 7)
      const slipsRes = await fetch("/api/payroll/payslips");
      if (slipsRes.ok) {
        const slipsJson = await slipsRes.json();
        if (slipsJson.success && Array.isArray(slipsJson.data)) {
          setPayslips(slipsJson.data);
        }
      }

      // 8. Fetch live projects (Phase 8)
      const projRes = await fetch("/api/projects");
      if (projRes.ok) {
        const projJson = await projRes.json();
        if (projJson.success && Array.isArray(projJson.data)) {
          if (isIsolatedTenant) {
            setProjectsList(projJson.data);
          } else if (projJson.data.length > 0) {
            setProjectsList(projJson.data);
          }
        }
      }

      // 9. Fetch live timesheets (Phase 8)
      const tsRes = await fetch("/api/timesheets");
      if (tsRes.ok) {
        const tsJson = await tsRes.json();
        if (tsJson.success && Array.isArray(tsJson.data)) {
          if (isIsolatedTenant) {
            setTimesheetsList(tsJson.data);
          } else if (tsJson.data.length > 0) {
            setTimesheetsList(tsJson.data);
          }
        }
      }

      // 10. Fetch live tenants for Super Admin (Phase 9)
      if (effectiveRole === "SUPER_ADMIN") {
        const tenantsRes = await fetch("/api/tenants");
        if (tenantsRes.ok) {
          const tenantsJson = await tenantsRes.json();
          if (tenantsJson.success && Array.isArray(tenantsJson.data) && tenantsJson.data.length > 0) {
            setCompanies(tenantsJson.data);
          }
        }
      }

      // 11. Fetch live subscription & quotas for active tenant (Phase 9)
      const subRes = await fetch(`/api/tenants/${targetCompanyId}/subscription`);
      if (subRes.ok) {
        const subJson = await subRes.json();
        if (subJson.success && subJson.data) {
          setSubscriptionDetails(subJson.data);
        }
      }

      // 12. Fetch live AI workforce insights (Phase 10)
      const aiRes = await fetch("/api/ai/attrition");
      if (aiRes.ok) {
        const aiJson = await aiRes.json();
        if (aiJson.success && aiJson.data) {
          setAiOverview(aiJson.data);
        }
      }

      // 13. Fetch live performance reviews (Phase 10)
      const reviewsRes = await fetch("/api/ai/reviews");
      if (reviewsRes.ok) {
        const reviewsJson = await reviewsRes.json();
        if (reviewsJson.success && Array.isArray(reviewsJson.data)) {
          setPerformanceReviewsList(reviewsJson.data);
        }
      }
    } catch (err) {
      console.warn("Could not sync live API data (using local state):", err);
    }
  };

  useEffect(() => {
    fetchLiveData();
  }, []);

  // Fetch subscription details whenever selectedCompanyId changes
  useEffect(() => {
    const fetchCompanySubscription = async () => {
      try {
        const res = await fetch(`/api/tenants/${selectedCompanyId}/subscription`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setSubscriptionDetails(json.data);
          }
        }
      } catch (err) {
        console.warn("Could not fetch tenant subscription:", err);
      }
    };
    fetchCompanySubscription();
  }, [selectedCompanyId]);

  // Enforce Role-to-Tab access & RBAC security bounds
  useEffect(() => {
    const roleAllowedTabs: Record<Role, string[]> = {
      SUPER_ADMIN: [
        "companies",
        "dashboard",
        "approvals",
        "hierarchy",
        "employees",
        "attendance",
        "leaves",
        "projects",
        "payroll",
        "billing",
        "ai-insights",
      ],
      COMPANY_ADMIN: [
        "dashboard",
        "approvals",
        "hierarchy",
        "employees",
        "attendance",
        "leaves",
        "projects",
        "payroll",
        "billing",
        "ai-insights",
      ],
      BRANCH_ADMIN: [
        "dashboard",
        "approvals",
        "hierarchy",
        "employees",
        "attendance",
        "leaves",
        "projects",
        "payroll",
        "ai-insights",
      ],
      DEPARTMENT_ADMIN: [
        "dashboard",
        "approvals",
        "hierarchy",
        "employees",
        "attendance",
        "leaves",
        "projects",
        "payroll",
        "ai-insights",
      ],
      TEAM_LEAD: [
        "dashboard",
        "approvals",
        "employees",
        "attendance",
        "leaves",
        "projects",
        "payroll",
      ],
      EMPLOYEE: [
        "dashboard",
        "employees",
        "attendance",
        "leaves",
        "projects",
        "payroll",
      ],
    };

    const allowed = roleAllowedTabs[currentRole] || ["dashboard"];
    if (!allowed.includes(activeTab)) {
      setActiveTab("dashboard");
    }
  }, [currentRole, activeTab]);

  // Filter pending approvals
  const pendingDeptCandidates = employees.filter(
    (e) => e.onboardingStatus === "PENDING_DEPT_APPROVAL"
  );
  const pendingBranchCandidates = employees.filter(
    (e) => e.onboardingStatus === "PENDING_BRANCH_APPROVAL"
  );
  const totalPendingApprovals = pendingDeptCandidates.length + pendingBranchCandidates.length;

  // Real Persona / Role Switcher connected to /api/auth/switch-role (Super Admin Only)
  const handleSwitchRole = async (targetRole: Role) => {
    if (!canSwitchRole) {
      showToast("Access Denied: Only Platform Super Admin can switch perspectives.");
      return;
    }

    setCurrentRole(targetRole);
    if (targetRole === "SUPER_ADMIN") {
      setActiveTab("companies");
    } else if (activeTab === "companies") {
      setActiveTab("dashboard");
    }

    try {
      const res = await fetch("/api/auth/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: targetRole,
          email: personas[targetRole].email,
        }),
      });

      if (res.ok) {
        showToast(`⚡ Live session authenticated as ${personas[targetRole].name} (${personas[targetRole].title})`);
        fetchLiveData();
      } else {
        showToast(`Switched perspective to ${personas[targetRole].name}`);
      }
    } catch (e) {
      showToast(`Switched perspective to ${personas[targetRole].name}`);
    }
  };

  // Sign Out Handler
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {}
    window.location.href = "/login";
  };

  // Toggle Punch connected to /api/attendance
  const handleTogglePunch = async () => {
    const nowTime = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    if (isPunchedIn) {
      setIsPunchedIn(false);
      try {
        await fetch("/api/attendance/punch-out", { method: "POST" });
      } catch (err) {}
      showToast(`Clocked out at ${nowTime}. Record updated in database.`);
    } else {
      setIsPunchedIn(true);
      setPunchTime(nowTime);
      try {
        await fetch("/api/attendance/punch-in", { method: "POST" });
      } catch (err) {}
      showToast(`Clocked in at ${nowTime}. Record saved in database.`);
    }
  };

  // Handler: Create Company (Super Admin Platform Onboarding via live API)
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.name || !newCompany.subdomain || !newCompany.adminEmail) {
      showToast("Please enter all required company details.");
      return;
    }

    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCompany.name,
          legalName: newCompany.legalName || newCompany.name,
          subdomain: newCompany.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, ""),
          plan: newCompany.plan,
          currency: newCompany.currency,
          timezone: newCompany.timezone,
          adminName: newCompany.adminName || "Tenant Admin",
          adminEmail: newCompany.adminEmail,
          adminPassword: newCompany.adminPassword || "password123",
          branchName: newCompany.branchName || `${newCompany.name} Headquarters`,
          branchCode: newCompany.branchCode || `HQ-${newCompany.subdomain.toUpperCase().slice(0, 4)}`,
        }),
      });

      const resJson = await res.json();
      if (resJson.success && resJson.data) {
        setCompanies([resJson.data, ...companies]);
        setSelectedCompanyId(resJson.data.id);
        setShowCreateCompanyModal(false);
        setNewCompany({
          name: "",
          legalName: "",
          subdomain: "",
          plan: "GROWTH",
          currency: "USD",
          timezone: "America/New_York",
          adminName: "",
          adminEmail: "",
          adminPassword: "password123",
          branchName: "",
          branchCode: "",
        });
        showToast(`🎉 SaaS Company "${resJson.data.name}" provisioned in Neon DB! Credentials ready.`);
      } else {
        showToast(resJson.error || "Failed to onboard company.");
      }
    } catch (err: any) {
      showToast("Error connecting to tenant service: " + err.message);
    }
  };

  // Handler: Upgrade or Downgrade Subscription Plan
  const handleUpgradePlan = async (tier: SubscriptionTier) => {
    setIsUpgradingPlan(true);
    const targetCompanyId = managingTenantId || selectedCompanyId;
    try {
      const res = await fetch(`/api/tenants/${targetCompanyId}/subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setSubscriptionDetails(json.data);
        // Refresh companies list if Super Admin
        const tenantsRes = await fetch("/api/tenants");
        if (tenantsRes.ok) {
          const tenantsJson = await tenantsRes.json();
          if (tenantsJson.success && Array.isArray(tenantsJson.data)) {
            setCompanies(tenantsJson.data);
          }
        }
        setShowUpgradeModal(false);
        setManagingTenantId(null);
        showToast(`🎉 Subscription elevated to ${tier} plan! Seat ceiling and feature gates updated immediately.`);
      } else {
        showToast(json.error || "Failed to update subscription plan.");
      }
    } catch (err: any) {
      showToast("Error updating subscription: " + err.message);
    } finally {
      setIsUpgradingPlan(false);
    }
  };

  // Handler: Suspend or Reactivate Tenant
  const handleToggleTenantStatus = async (companyId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await fetch(`/api/tenants/${companyId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setCompanies((prev) =>
          prev.map((c) => (c.id === companyId ? { ...c, status: nextStatus as any } : c))
        );
        showToast(`Tenant status updated to ${nextStatus}.`);
      } else {
        showToast(json.error || "Failed to change tenant status.");
      }
    } catch (err: any) {
      showToast("Error updating status: " + err.message);
    }
  };

  // Phase 10 Handler: Synthesize AI Performance Review
  const handleSynthesizeReview = async () => {
    if (!selectedReviewEmployeeId) {
      showToast("Please select an employee to synthesize a performance review.");
      return;
    }
    setIsSynthesizingReview(true);
    try {
      const res = await fetch("/api/ai/reviews/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedReviewEmployeeId,
          period: selectedReviewPeriod,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setCurrentSynthesizedReview(json.data);
        showToast(`✨ AI Performance Review synthesized for ${json.data.employeeName}!`);
      } else {
        showToast(json.error || "Failed to synthesize review.");
      }
    } catch (err: any) {
      showToast("Error generating review: " + err.message);
    } finally {
      setIsSynthesizingReview(false);
    }
  };

  // Phase 10 Handler: Publish Performance Review
  const handlePublishReview = async () => {
    if (!currentSynthesizedReview) return;
    setIsPublishingReview(true);
    try {
      const res = await fetch("/api/ai/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: currentSynthesizedReview.employeeId,
          period: currentSynthesizedReview.period,
          rating: currentSynthesizedReview.rating,
          summary: currentSynthesizedReview.summary,
          strengths: currentSynthesizedReview.strengths,
          growthAreas: currentSynthesizedReview.growthAreas,
          goals: currentSynthesizedReview.goals,
          metricsScore: currentSynthesizedReview.metricsScore,
          status: "PUBLISHED",
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setPerformanceReviewsList([json.data, ...performanceReviewsList]);
        setCurrentSynthesizedReview(null);
        showToast("🎉 Performance Review published and recorded to official HR ledger!");
      } else {
        showToast(json.error || "Failed to publish review.");
      }
    } catch (err: any) {
      showToast("Error publishing review: " + err.message);
    } finally {
      setIsPublishingReview(false);
    }
  };

  // Phase 10 Handler: Change Forecast Scenario
  const handleChangeForecastScenario = async (scenario: "CONSERVATIVE" | "BASELINE" | "AGGRESSIVE") => {
    setSelectedForecastScenario(scenario);
    try {
      const res = await fetch(`/api/ai/forecast?scenario=${scenario}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setAiOverview((prev) => (prev ? { ...prev, forecast: json.data } : prev));
        }
      }
    } catch (err) {
      console.warn("Could not reload forecast scenario:", err);
    }
  };

  // Handler: Propose New Candidate (Initiated by Team Lead or Dept Admin, calls live API)
  const handleProposeCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidate.firstName || !newCandidate.lastName || !newCandidate.email) {
      showToast("Please enter all required candidate details.");
      return;
    }

    const branchObj = branches.find((b) => b.name === newCandidate.branch) || branches[0];
    const deptObj = departments.find((d) => d.name === newCandidate.department) || departments[0];

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: newCandidate.firstName,
          lastName: newCandidate.lastName,
          email: newCandidate.email,
          phone: newCandidate.phone || undefined,
          branchId: branchObj?.id || "branch-1",
          departmentId: deptObj?.id || "dept-1",
          designationTitle: newCandidate.designation,
          employmentType: "FULL_TIME",
          baseSalary: Number(newCandidate.baseSalary),
          currency: "USD",
        }),
      });

      const resJson = await res.json();
      if (resJson.success && resJson.data) {
        const item = resJson.data;
        const createdLive: Employee = {
          id: item.id,
          employeeNumber: item.employeeNumber,
          firstName: item.firstName,
          lastName: item.lastName,
          email: item.email,
          phone: item.phone || "+1 (555) 000-0000",
          avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
          branch: newCandidate.branch,
          department: newCandidate.department,
          team: newCandidate.team,
          designation: newCandidate.designation,
          createdByName: `${currentUser.name} (${currentUser.title})`,
          hireDate: new Date().toISOString().split("T")[0],
          employmentType: "FULL_TIME",
          status: "PROBATION",
          onboardingStatus: "PENDING_DEPT_APPROVAL",
          baseSalary: Number(newCandidate.baseSalary),
          currency: "USD",
          location: newCandidate.branch,
          approvalHistory: [],
        };
        setEmployees([createdLive, ...employees]);
        showToast(`🚀 Candidate ${createdLive.firstName} ${createdLive.lastName} saved to database & entered into Stage 1 review!`);
      } else {
        showToast(`❌ Proposal rejected: ${resJson.error || "Server validation error"}`);
        return;
      }
    } catch (err) {
      console.warn("API candidate proposal error, using local state:", err);
    }

    setShowProposeCandidateModal(false);
    setNewCandidate({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      branch: "New York Headquarters",
      department: "Engineering",
      team: "Core Platform & Cloud Team",
      designation: "Software Engineer",
      baseSalary: 95000,
    });
  };

  // Open Approval Confirmation Modal
  const openApprovalModal = (candidate: Employee, action: "APPROVE" | "REJECT") => {
    setApprovalModalCandidate(candidate);
    setApprovalModalAction(action);
    setApprovalComments("");
  };

  // Execute Approval or Rejection (calls live approval action API)
  const handleExecuteApproval = async () => {
    if (!approvalModalCandidate) return;

    const candidate = approvalModalCandidate;
    const isDeptStage = candidate.onboardingStatus === "PENDING_DEPT_APPROVAL";

    // Call live API
    try {
      await fetch(`/api/approvals/onboarding/${candidate.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: approvalModalAction,
          comments: approvalComments || (approvalModalAction === "APPROVE" ? "Approved and verified." : "Rejected during review."),
        }),
      });
    } catch (err) {
      console.warn("API approval execution error:", err);
    }

    const newLog: ApprovalLog = {
      id: `app-${Date.now()}`,
      stage: isDeptStage ? "DEPARTMENT_REVIEW" : "BRANCH_REVIEW",
      action: approvalModalAction,
      reviewerName: currentUser.name,
      reviewerRole: currentUser.title,
      comments: approvalComments || (approvalModalAction === "APPROVE" ? "Approved and verified." : "Rejected during review."),
      date: new Date().toLocaleString(),
    };

    let nextStatus: OnboardingStatus;
    if (approvalModalAction === "REJECT") {
      nextStatus = "REJECTED";
    } else {
      nextStatus = isDeptStage ? "PENDING_BRANCH_APPROVAL" : "ACTIVE";
    }

    setEmployees((prev) =>
      prev.map((e) =>
        e.id === candidate.id
          ? {
              ...e,
              onboardingStatus: nextStatus,
              status: nextStatus === "ACTIVE" ? "ACTIVE" : e.status,
              approvalHistory: [...(e.approvalHistory || []), newLog],
            }
          : e
      )
    );

    setApprovalModalCandidate(null);

    if (nextStatus === "PENDING_BRANCH_APPROVAL") {
      showToast(`Stage 1 Approved by ${currentUser.name}! Advanced to Branch HR Admin for final sign-off.`);
    } else if (nextStatus === "ACTIVE") {
      showToast(`🎉 Final Approval granted by ${currentUser.name}! Employee ${candidate.firstName} is now ACTIVE with login access.`);
    } else {
      showToast(`Candidate ${candidate.firstName} has been REJECTED.`);
    }
  };

  // Helper: calculate working days (excludes Saturdays & Sundays)
  const calculateWorkingDays = (startStr: string, endStr: string): number => {
    if (!startStr || !endStr) return 0;
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (end < start) return 0;

    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) {
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  };

  // Submit Leave Request (Calls live POST /api/leaves)
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeaveForm.leaveTypeId || !newLeaveForm.startDate || !newLeaveForm.endDate || !newLeaveForm.reason) {
      showToast("Please fill in all required leave details.");
      return;
    }

    const workingDays = calculateWorkingDays(newLeaveForm.startDate, newLeaveForm.endDate);
    if (workingDays <= 0) {
      showToast("End date must be on or after start date and include business days.");
      return;
    }

    // Check available balance
    const matchingBal = leaveBalances.find((b) => b.leaveTypeId === newLeaveForm.leaveTypeId);
    if (matchingBal && matchingBal.availableDays < workingDays) {
      showToast(`⚠️ Insufficient quota: only ${matchingBal.availableDays} days available, requested ${workingDays} days.`);
      return;
    }

    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveTypeId: newLeaveForm.leaveTypeId,
          startDate: newLeaveForm.startDate,
          endDate: newLeaveForm.endDate,
          totalDays: workingDays,
          reason: newLeaveForm.reason,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast(`🎉 Leave request for ${workingDays} business days submitted successfully!`);
        setShowApplyLeaveModal(false);
        setNewLeaveForm({ leaveTypeId: "", startDate: "", endDate: "", reason: "" });
        fetchLiveData();
      } else {
        showToast(json.error || "Failed to submit leave request.");
      }
    } catch (err) {
      // Local fallback
      const matchingType = availableLeaveTypes.find((t) => t.id === newLeaveForm.leaveTypeId);
      const localReq: LeaveRequestRecord = {
        id: `leave-${Date.now()}`,
        employeeId: "emp-self",
        employeeName: currentUser.name,
        employeeAvatar: currentUser.avatar,
        department: currentUser.department || "Operations",
        leaveType: matchingType?.name || "Annual Vacation",
        leaveTypeCode: matchingType?.code || "ANNUAL",
        colorHex: matchingType?.colorHex || "#3b82f6",
        startDate: newLeaveForm.startDate,
        endDate: newLeaveForm.endDate,
        totalDays: workingDays,
        reason: newLeaveForm.reason,
        status: "PENDING",
        appliedAt: new Date().toISOString().split("T")[0],
      };
      setLeaveRequests([localReq, ...leaveRequests]);
      setShowApplyLeaveModal(false);
      setNewLeaveForm({ leaveTypeId: "", startDate: "", endDate: "", reason: "" });
      showToast(`Leave request submitted (${workingDays} days). Pending manager review.`);
    }
  };

  // Action Leave Request (Approve / Reject)
  const handleActionLeaveRequest = async (leaveId: string, action: "APPROVE" | "REJECT") => {
    try {
      const res = await fetch(`/api/approvals/leaves/${leaveId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          comments: `${action === "APPROVE" ? "Approved" : "Rejected"} by ${currentUser.name} (${currentUser.title})`,
        }),
      });

      if (res.ok) {
        showToast(`Leave request ${action.toLowerCase()}d successfully.`);
        fetchLiveData();
      } else {
        const json = await res.json().catch(() => ({}));
        showToast(json.error || `Could not ${action.toLowerCase()} leave request.`);
      }
    } catch (err) {
      setLeaveRequests((prev) =>
        prev.map((l) => (l.id === leaveId ? { ...l, status: action === "APPROVE" ? "APPROVED" : "REJECTED" } : l))
      );
      showToast(`Leave request ${action.toLowerCase()}d.`);
    }
  };

  // Cancel Leave Request (Calls live DELETE /api/leaves/[id])
  const handleCancelLeaveRequest = async (leaveId: string) => {
    try {
      const res = await fetch(`/api/leaves/${leaveId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast("Leave request cancelled. Quota balance refunded.");
        fetchLiveData();
      } else {
        const json = await res.json().catch(() => ({}));
        showToast(json.error || "Could not cancel leave request.");
      }
    } catch (err) {
      setLeaveRequests((prev) =>
        prev.map((l) => (l.id === leaveId ? { ...l, status: "CANCELLED" } : l))
      );
      showToast("Leave request cancelled.");
    }
  };

  // Handler: Execute Batch Payroll (Super Admin, Company Admin, Branch HR)
  const handleProcessPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingPayroll(true);
    try {
      const payload: any = {
        month: Number(processPayrollForm.month),
        year: Number(processPayrollForm.year),
        autoMarkPaid: processPayrollForm.autoMarkPaid,
      };
      if (processPayrollForm.branchId && processPayrollForm.branchId !== "ALL") {
        payload.branchId = processPayrollForm.branchId;
      }

      const res = await fetch("/api/payroll/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to process payroll batch.");
      }

      showToast(`Batch settlement completed for ${processPayrollForm.month}/${processPayrollForm.year}! Disbursed $${json.data.summary.totalNet.toLocaleString()}`);
      setShowProcessPayrollModal(false);
      // Refresh live payroll data
      fetchLiveData();
    } catch (err: any) {
      showToast(err.message || "Failed to process payroll.");
    } finally {
      setIsProcessingPayroll(false);
    }
  };

  // Handler: Create Project (Phase 8)
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingProject(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProjectForm),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create project.");
      }

      showToast(`Project "${newProjectForm.name}" created successfully!`);
      setShowCreateProjectModal(false);
      setNewProjectForm({
        name: "",
        code: "",
        clientName: "DigiSail SaaS Core",
        budget: 150000,
        description: "",
        startDate: "2026-10-01",
        endDate: "2027-04-30",
      });
      fetchLiveData();
    } catch (err: any) {
      showToast(err.message || "Failed to create project.");
    } finally {
      setIsCreatingProject(false);
    }
  };

  // Handler: Submit Timesheet (Phase 8)
  const handleLogTimesheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTimesheet(true);
    try {
      const selectedProj = newTimesheetForm.projectId || projectsList[0]?.id;
      if (!selectedProj) throw new Error("Please select an active project.");

      const res = await fetch("/api/timesheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTimesheetForm,
          projectId: selectedProj,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to log timesheet.");
      }

      showToast(`Logged ${newTimesheetForm.hoursWorked} hours! Submitted for manager approval.`);
      setShowLogTimesheetModal(false);
      setNewTimesheetForm({
        projectId: projectsList[0]?.id || "",
        date: new Date().toISOString().split("T")[0],
        hoursWorked: 8.0,
        taskDescription: "",
      });
      fetchLiveData();
    } catch (err: any) {
      showToast(err.message || "Failed to log timesheet.");
    } finally {
      setIsSubmittingTimesheet(false);
    }
  };

  // Handler: Action Timesheet (Phase 8 Approve / Reject)
  const handleActionTimesheet = async (timesheetId: string, action: "APPROVE" | "REJECT") => {
    try {
      const res = await fetch(`/api/timesheets/${timesheetId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Failed to ${action.toLowerCase()} timesheet.`);
      }

      showToast(`Timesheet entry ${action.toLowerCase()}d successfully.`);
      fetchLiveData();
    } catch (err: any) {
      showToast(err.message || `Failed to ${action.toLowerCase()} timesheet.`);
    }
  };

  // Handler: Create Branch (Company Admin)
  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.name || !newBranch.code) return;

    const targetCompanyId = newBranch.companyId || selectedCompanyId;
    const targetComp = companies.find((c) => c.id === targetCompanyId) || companies[0];

    const branch: BranchRecord = {
      id: `branch-${Date.now()}`,
      companyId: targetCompanyId,
      companyName: targetComp?.name || "DigiSail Global Inc.",
      name: newBranch.name,
      code: newBranch.code.toUpperCase(),
      city: newBranch.city,
      country: newBranch.country,
      adminName: newBranch.adminName || "Assigned Branch HR",
      departmentCount: 0,
      employeeCount: 0,
    };

    setBranches([...branches, branch]);
    setCompanies(
      companies.map((c) =>
        c.id === targetCompanyId ? { ...c, branchCount: c.branchCount + 1 } : c
      )
    );
    setShowCreateBranchModal(false);
    setNewBranch({
      companyId: selectedCompanyId,
      name: "",
      code: "",
      city: "",
      country: "United States",
      adminName: "",
    });
    showToast(`Branch ${branch.name} established under "${targetComp?.name}"!`);
  };

  // Handler: Create Department (Branch HR)
  const handleCreateDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDept.name || !newDept.code) return;

    const dept: DepartmentRecord = {
      id: `dept-${Date.now()}`,
      name: newDept.name,
      code: newDept.code.toUpperCase(),
      branchId: "branch-1",
      branchName: newDept.branchName,
      adminName: newDept.adminName || "Assigned Dept Admin",
      teamCount: 0,
      employeeCount: 0,
    };

    setDepartments([...departments, dept]);
    setShowCreateDeptModal(false);
    setNewDept({ name: "", code: "", branchName: "New York Headquarters", adminName: "" });
    showToast(`Department ${dept.name} established in ${dept.branchName}!`);
  };

  // Handler: Create Team (Dept Admin)
  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeam.name || !newTeam.code) return;

    const team: TeamRecord = {
      id: `team-${Date.now()}`,
      name: newTeam.name,
      code: newTeam.code.toUpperCase(),
      departmentId: "dept-1",
      departmentName: newTeam.departmentName,
      leadName: newTeam.leadName || "Assigned Team Lead",
      memberCount: 0,
    };

    setTeams([...teams, team]);
    setShowCreateTeamModal(false);
    setNewTeam({ name: "", code: "", departmentName: "Engineering", leadName: "" });
    showToast(`Team ${team.name} created!`);
  };

  // Filtered active employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = departmentFilter === "All" || emp.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-indigo-600 text-white px-5 py-3 rounded-xl shadow-2xl border border-indigo-400/30 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col justify-between p-4 backdrop-blur-md">
        <div>
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3 px-3 py-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-white">DigiSail</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  HRM
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Multi-Tenant SaaS Platform</p>
            </div>
          </div>

          {/* Current Active Persona Scope Badge */}
          <div className="mb-4 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {currentRole.replace("_", " ")}
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                Live
              </span>
            </div>
            <p className="text-xs font-bold text-white mt-1 truncate">{currentUser.name}</p>
            <p className="text-[11px] text-slate-400 truncate">{currentUser.title}</p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {/* Super Admin Dedicated SaaS Tenants Menu */}
            {currentRole === "SUPER_ADMIN" && (
              <button
                onClick={() => setActiveTab("companies")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "companies"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-semibold"
                    : "text-purple-300 hover:text-white hover:bg-purple-950/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-purple-400" />
                  <span>SaaS Tenants</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {companies.length}
                </span>
              </button>
            )}

            {[
              {
                id: "dashboard",
                label: "Dashboard",
                icon: TrendingUp,
                roles: ["SUPER_ADMIN", "COMPANY_ADMIN", "BRANCH_ADMIN", "DEPARTMENT_ADMIN", "TEAM_LEAD", "EMPLOYEE"],
              },
              {
                id: "approvals",
                label: "Approval Center",
                icon: FileCheck,
                badge: totalPendingApprovals > 0 ? totalPendingApprovals : undefined,
                badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
                roles: ["SUPER_ADMIN", "COMPANY_ADMIN", "BRANCH_ADMIN", "DEPARTMENT_ADMIN", "TEAM_LEAD"],
              },
              {
                id: "hierarchy",
                label: "Org Hierarchy",
                icon: GitBranch,
                roles: ["SUPER_ADMIN", "COMPANY_ADMIN", "BRANCH_ADMIN", "DEPARTMENT_ADMIN"],
              },
              {
                id: "employees",
                label: "Employees",
                icon: Users,
                badge: employees.length,
                roles: ["SUPER_ADMIN", "COMPANY_ADMIN", "BRANCH_ADMIN", "DEPARTMENT_ADMIN", "TEAM_LEAD", "EMPLOYEE"],
              },
              {
                id: "attendance",
                label: "Attendance",
                icon: Clock,
                roles: ["SUPER_ADMIN", "COMPANY_ADMIN", "BRANCH_ADMIN", "DEPARTMENT_ADMIN", "TEAM_LEAD", "EMPLOYEE"],
              },
              {
                id: "leaves",
                label: "Leave Requests",
                icon: Calendar,
                roles: ["SUPER_ADMIN", "COMPANY_ADMIN", "BRANCH_ADMIN", "DEPARTMENT_ADMIN", "TEAM_LEAD", "EMPLOYEE"],
              },
              {
                id: "projects",
                label: "Projects & Tasks",
                icon: Briefcase,
                roles: ["SUPER_ADMIN", "COMPANY_ADMIN", "BRANCH_ADMIN", "DEPARTMENT_ADMIN", "TEAM_LEAD", "EMPLOYEE"],
              },
              {
                id: "payroll",
                label: currentRole === "EMPLOYEE" ? "My Payslips" : "Payroll",
                icon: currentRole === "EMPLOYEE" ? Receipt : DollarSign,
                roles: ["SUPER_ADMIN", "COMPANY_ADMIN", "BRANCH_ADMIN", "DEPARTMENT_ADMIN", "TEAM_LEAD", "EMPLOYEE"],
              },
              {
                id: "billing",
                label: "Billing & Plans",
                icon: CreditCard,
                badge: subscriptionDetails?.subscription?.tier || (activeCompany.plan as string) || "GROWTH",
                badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                roles: ["SUPER_ADMIN", "COMPANY_ADMIN"],
              },
              {
                id: "ai-insights",
                label: "AI Workforce Intelligence",
                icon: Brain,
                badge: "AI 2.4",
                badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
                roles: ["SUPER_ADMIN", "COMPANY_ADMIN", "BRANCH_ADMIN", "DEPARTMENT_ADMIN"],
              },
            ]
              .filter((item) => item.roles.includes(currentRole))
              .map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as typeof activeTab)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                        item.badgeColor || "bg-indigo-950 text-indigo-400 border-indigo-800/50"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card */}
        <div className="pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/50 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out to Login Page"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0 ml-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        {/* Top Header Bar with Multi-Role Switcher & Tenant Switcher */}
        <header className="relative z-40 h-16 border-b border-slate-800/80 bg-slate-900/60 px-6 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-3">
            {/* Active Company Selector (Crucial for SaaS Multi-Tenancy) */}
            <div className="relative">
              {currentRole === "SUPER_ADMIN" ? (
                <button
                  onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 transition-all text-xs cursor-pointer shadow-sm"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                    {activeCompany?.name.charAt(0) || "D"}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white max-w-[130px] lg:max-w-[170px] truncate">
                        {activeCompany?.name || "DigiSail Global"}
                      </span>
                      <span className="text-[9px] text-purple-300 font-mono bg-purple-500/20 px-1 py-0.2 rounded border border-purple-500/30">
                        {activeCompany?.plan}
                      </span>
                    </div>
                    <p className="text-[9px] text-purple-400 font-medium">
                      👑 Switch SaaS Client
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ) : (
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                    {activeCompany?.name.charAt(0) || "D"}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white max-w-[130px] lg:max-w-[170px] truncate">
                        {activeCompany?.name || "DigiSail Global"}
                      </span>
                      <span className="text-[9px] text-indigo-300 font-mono bg-indigo-500/20 px-1 py-0.2 rounded border border-indigo-500/30">
                        {activeCompany?.plan}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400">Active Tenant</p>
                  </div>
                </div>
              )}

              {/* Company Switcher Dropdown (Super Admin Only with dismiss backdrop) */}
              {showCompanyDropdown && currentRole === "SUPER_ADMIN" && (
                <>
                  {/* Invisible click-outside backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowCompanyDropdown(false)}
                  />
                  <div className="absolute left-0 mt-2 w-72 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1 flex items-center justify-between">
                      <span>SaaS Client Companies</span>
                      <span className="text-purple-400 font-bold">{companies.length} active</span>
                    </div>
                    <div className="space-y-1 max-h-56 overflow-y-auto">
                      {companies.map((comp) => (
                        <button
                          key={comp.id}
                          onClick={() => {
                            setSelectedCompanyId(comp.id);
                            setShowCompanyDropdown(false);
                            showToast(`Switched company view to "${comp.name}"`);
                            fetchLiveData(comp.id);
                          }}
                          className={`w-full text-left p-2 rounded-xl transition-all flex items-center justify-between text-xs cursor-pointer ${
                            selectedCompanyId === comp.id
                              ? "bg-purple-600/20 border border-purple-500/40 text-purple-200"
                              : "hover:bg-slate-800 text-slate-300"
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-bold text-white truncate">{comp.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">
                              {comp.subdomain}.digisailhrm.com
                            </p>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-purple-300 font-semibold shrink-0">
                            {comp.branchCount} br
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="pt-2 mt-2 border-t border-slate-800">
                      <button
                        onClick={() => {
                          setShowCompanyDropdown(false);
                          setShowCreateCompanyModal(true);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Onboard New Company</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Quick Role Switcher (ONLY VISIBLE FOR SUPER ADMIN) */}
            {canSwitchRole ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium hidden xl:inline">Role View:</span>
                <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
                  {(
                    [
                      { role: "SUPER_ADMIN", label: "Super Admin", icon: "👑" },
                      { role: "COMPANY_ADMIN", label: "Company HR", icon: "🏢" },
                      { role: "BRANCH_ADMIN", label: "Branch HR", icon: "📍" },
                      { role: "DEPARTMENT_ADMIN", label: "Dept Head", icon: "📁" },
                      { role: "TEAM_LEAD", label: "Team Lead", icon: "👤" },
                      { role: "EMPLOYEE", label: "Employee", icon: "👥" },
                    ] as const
                  ).map((p) => (
                    <button
                      key={p.role}
                      onClick={() => handleSwitchRole(p.role)}
                      className={`px-2 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1 ${
                        currentRole === p.role
                          ? "bg-indigo-600 text-white shadow-md font-semibold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <span>{p.icon}</span>
                      <span className="hidden lg:inline">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Non-Super Admin: clean static role badge instead of switcher */
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-bold text-white">{currentUser.name}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300 font-medium">{currentUser.title}</span>
              </div>
            )}
          </div>

          {/* Action Area */}
          <div className="flex items-center gap-3">
            {/* Super Admin Dedicated Action: + Onboard New Company */}
            {currentRole === "SUPER_ADMIN" ? (
              <button
                onClick={() => setShowCreateCompanyModal(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Onboard New Company</span>
              </button>
            ) : (
              (currentRole === "TEAM_LEAD" ||
                currentRole === "DEPARTMENT_ADMIN" ||
                currentRole === "BRANCH_ADMIN" ||
                currentRole === "COMPANY_ADMIN") && (
                <button
                  onClick={() => setShowProposeCandidateModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Propose Candidate</span>
                </button>
              )
            )}

            {/* Quick Clock Button */}
            <button
              onClick={handleTogglePunch}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 ${
                isPunchedIn
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500 hover:text-white"
                  : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500 hover:text-white"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isPunchedIn ? "Punch Out" : "Punch In"}</span>
            </button>

            {/* Sign Out Button */}
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-800/80 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-700/80 hover:border-rose-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Tab Body */}
        <main className="relative z-10 flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 0: SAAS TENANTS & COMPANIES (SUPER ADMIN VIEW) */}
          {activeTab === "companies" && currentRole === "SUPER_ADMIN" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Super Admin SaaS Banner */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-slate-900 p-6 border border-purple-500/30 shadow-2xl">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      👑 PLATFORM SUPER ADMIN
                    </span>
                    <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
                      SaaS Multi-Tenant Management Center
                    </h1>
                    <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                      As Super Admin, you provision client companies, manage subscription plans, and assign primary Company HR Administrators who then manage branches and staff.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateCompanyModal(true)}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/40 flex items-center gap-2 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Onboard New Company
                  </button>
                </div>
              </div>

              {/* SaaS Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-medium">Active Tenants</p>
                    <p className="text-2xl font-bold text-white mt-1">{companies.length}</p>
                    <p className="text-[11px] text-emerald-400 mt-1">100% active SaaS clients</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-purple-400" />
                  </div>
                </div>

                <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-medium">Global Branches</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {companies.reduce((acc, c) => acc + c.branchCount, 0)}
                    </p>
                    <p className="text-[11px] text-indigo-400 mt-1">Across 3 continents</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <GitBranch className="w-6 h-6 text-blue-400" />
                  </div>
                </div>

                <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-medium">Monitored Workforce</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {companies.reduce((acc, c) => acc + c.employeeCount, 0)}
                    </p>
                    <p className="text-[11px] text-cyan-400 mt-1">Active employee seats</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-cyan-400" />
                  </div>
                </div>

                <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-medium">Platform MRR</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">
                      ${companies
                        .reduce(
                          (acc, c) =>
                            acc +
                            (c.monthlyPrice ||
                              (c.plan === "ENTERPRISE" ? 1999 : c.plan === "GROWTH" || c.plan === "PROFESSIONAL" ? 799 : 299)),
                          0
                        )
                        .toLocaleString()} / mo
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">Recurring SaaS revenue</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>
              </div>

              {/* Registered Companies Grid with Search & Tier Filters */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-purple-400" />
                      Registered Tenant Organizations ({companies.length})
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Isolated database multi-tenancy & quota governance</p>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search tenants or subdomain..."
                        value={tenantSearchQuery}
                        onChange={(e) => setTenantSearchQuery(e.target.value)}
                        className="bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/80 text-xs">
                      {(["ALL", "STARTER", "GROWTH", "ENTERPRISE"] as const).map((tier) => (
                        <button
                          key={tier}
                          onClick={() => setTenantTierFilter(tier)}
                          className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer text-[11px] ${
                            tenantTierFilter === tier
                              ? "bg-purple-600 text-white font-semibold shadow"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {tier}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Filtered Companies */}
                {(() => {
                  const filteredTenants = companies.filter((comp) => {
                    const matchesSearch =
                      comp.name.toLowerCase().includes(tenantSearchQuery.toLowerCase()) ||
                      comp.subdomain.toLowerCase().includes(tenantSearchQuery.toLowerCase()) ||
                      (comp.legalName && comp.legalName.toLowerCase().includes(tenantSearchQuery.toLowerCase()));
                    const compPlan = comp.plan === "PROFESSIONAL" ? "GROWTH" : comp.plan;
                    const matchesTier = tenantTierFilter === "ALL" || compPlan === tenantTierFilter;
                    return matchesSearch && matchesTier;
                  });

                  if (filteredTenants.length === 0) {
                    return (
                      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-12 text-center text-slate-400">
                        <Building2 className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                        <p className="text-sm font-medium text-slate-300">No matching tenants found</p>
                        <p className="text-xs mt-1">Try adjusting your search criteria or tier filter.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredTenants.map((comp) => {
                        const compPlan = comp.plan === "PROFESSIONAL" ? "GROWTH" : comp.plan;
                        const maxSeats = comp.maxSeats || (compPlan === "ENTERPRISE" ? 9999 : compPlan === "GROWTH" ? 100 : 25);
                        const seatUtil = maxSeats > 0 ? Math.min(100, Math.round((comp.employeeCount / maxSeats) * 100)) : 0;
                        const monthlyPrice = comp.monthlyPrice || (compPlan === "ENTERPRISE" ? 1999 : compPlan === "GROWTH" ? 799 : 299);

                        return (
                          <div
                            key={comp.id}
                            className={`bg-slate-900/80 rounded-2xl border p-5 shadow-sm transition flex flex-col justify-between ${
                              comp.status === "SUSPENDED"
                                ? "border-rose-900/40 bg-slate-900/40 opacity-75"
                                : "border-slate-800 hover:border-purple-500/40"
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between">
                                <div>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                      compPlan === "ENTERPRISE"
                                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                                        : compPlan === "GROWTH"
                                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                    }`}
                                  >
                                    {compPlan} PLAN • ${monthlyPrice}/mo
                                  </span>
                                  <h4 className="text-base font-bold text-white mt-1.5">{comp.name}</h4>
                                  <p className="text-[11px] text-slate-400 truncate">{comp.legalName}</p>
                                </div>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    comp.status === "ACTIVE"
                                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                      : comp.status === "TRIAL"
                                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                      : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                  }`}
                                >
                                  {comp.status}
                                </span>
                              </div>

                              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                                <p className="flex items-center gap-1.5">
                                  <Laptop className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="font-mono text-purple-400">
                                    {comp.subdomain}.digisailhrm.com
                                  </span>
                                </p>
                                <p>
                                  👤 Primary HR Admin:{" "}
                                  <span className="text-white font-medium">{comp.adminName}</span>
                                </p>
                                <p className="text-slate-400 truncate">✉️ {comp.adminEmail}</p>
                              </div>

                              {/* License Quota Utilization Progress Bar */}
                              <div className="mt-3.5 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                <div className="flex items-center justify-between text-[11px] mb-1">
                                  <span className="text-slate-400">Seat Utilization</span>
                                  <span className="text-slate-200 font-mono font-medium">
                                    {comp.employeeCount} / {maxSeats === 9999 ? "∞" : maxSeats} ({seatUtil}%)
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      seatUtil > 90
                                        ? "bg-rose-500"
                                        : seatUtil > 70
                                        ? "bg-amber-500"
                                        : "bg-purple-500"
                                    }`}
                                    style={{ width: `${Math.min(100, Math.max(5, seatUtil))}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col gap-2">
                              <div className="flex items-center justify-between text-xs text-slate-400">
                                <span>📍 {comp.branchCount} Branches</span>
                                <span className="font-mono text-slate-300">Renew: {comp.renewalDate || "Monthly"}</span>
                              </div>

                              <div className="flex items-center justify-between gap-2 pt-1">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setManagingTenantId(comp.id);
                                      setTargetUpgradeTier(compPlan as SubscriptionTier);
                                      setShowUpgradeModal(true);
                                    }}
                                    className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                                  >
                                    Modify Plan
                                  </button>
                                  <button
                                    onClick={() => handleToggleTenantStatus(comp.id, comp.status)}
                                    className={`px-2 py-1 text-[11px] rounded-lg transition cursor-pointer ${
                                      comp.status === "ACTIVE"
                                        ? "text-rose-400 hover:bg-rose-500/10"
                                        : "text-emerald-400 hover:bg-emerald-500/10"
                                    }`}
                                    title={comp.status === "ACTIVE" ? "Suspend Tenant" : "Reactivate Tenant"}
                                  >
                                    {comp.status === "ACTIVE" ? "Suspend" : "Activate"}
                                  </button>
                                </div>

                                <button
                                  onClick={() => {
                                    setSelectedCompanyId(comp.id);
                                    setCurrentRole("COMPANY_ADMIN");
                                    setActiveTab("dashboard");
                                    showToast(`Now managing ${comp.name} as Company HR Admin.`);
                                    fetchLiveData(comp.id);
                                  }}
                                  className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                  Manage Tenant &rarr;
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Persona Context Banner */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 p-6 border border-indigo-500/20 shadow-xl">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        {currentUser.title}
                      </span>
                      {currentUser.branch && (
                        <span className="text-xs text-slate-400">📍 {currentUser.branch}</span>
                      )}
                      {currentUser.department && (
                        <span className="text-xs text-slate-400">• 📁 {currentUser.department}</span>
                      )}
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                      Welcome, {currentUser.name}
                    </h1>
                    <p className="text-xs text-slate-300 mt-1">
                      {currentRole === "SUPER_ADMIN" &&
                        "Global multi-tenant oversight. Monitoring all client companies, subscription licenses, and system health."}
                      {currentRole === "COMPANY_ADMIN" &&
                        "Company-level executive control. Overseeing branches, branch HR administrators, and overall company headcount."}
                      {currentRole === "BRANCH_ADMIN" &&
                        "Branch HR authority. Managing departments, department heads, and granting final approval to candidate onboarding."}
                      {currentRole === "DEPARTMENT_ADMIN" &&
                        "Department Head. Managing project teams, team leads, and reviewing initial employee candidates."}
                      {currentRole === "TEAM_LEAD" &&
                        "Team Lead view. Tracking project deliverables, team check-ins, and proposing new team candidates."}
                      {currentRole === "EMPLOYEE" &&
                        "Self-service portal. Logging daily punches, viewing salary payslips, and submitting leave requests."}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentRole === "EMPLOYEE" ? (
                      <>
                        <button
                          onClick={() => setShowApplyLeaveModal(true)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          Request Time Off
                        </button>
                        <button
                          onClick={() => setActiveTab("payroll")}
                          className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Receipt className="w-4 h-4 text-emerald-400" />
                          My Payslips
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setActiveTab("approvals")}
                          className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold rounded-xl border border-amber-500/30 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileCheck className="w-4 h-4" />
                          Approval Queue ({totalPendingApprovals})
                        </button>
                        {["SUPER_ADMIN", "COMPANY_ADMIN", "BRANCH_ADMIN", "DEPARTMENT_ADMIN"].includes(currentRole) && (
                          <button
                            onClick={() => setActiveTab("hierarchy")}
                            className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
                          >
                            View Org Structure
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* KPI Cards */}
              {currentRole === "EMPLOYEE" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Today's Shift & Attendance */}
                  <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        My Attendance
                      </p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {attendances.find((a) => a.employeeName.toLowerCase().includes("priya"))?.workHours || 7.5} hrs
                      </p>
                      <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                        ● Shift active & recorded
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-emerald-400" />
                    </div>
                  </div>

                  {/* Card 2: Annual Leave Balance */}
                  <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Available Leave
                      </p>
                      <p className="text-2xl font-bold text-amber-400 mt-1">
                        {leaveBalances.reduce((acc, b) => acc + b.availableDays, 0)} Days
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Paid annual & casual entitlement
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-amber-400" />
                    </div>
                  </div>

                  {/* Card 3: Active Assigned Projects */}
                  <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Assigned Projects
                      </p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {projectsList.filter((p) => p.status === "ACTIVE").length} Active
                      </p>
                      <p className="text-[11px] text-indigo-400 mt-1">
                        Core engineering sprint
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-indigo-400" />
                    </div>
                  </div>

                  {/* Card 4: Estimated Net Monthly Compensation */}
                  <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        My Net Take-Home
                      </p>
                      <p className="text-2xl font-bold text-emerald-400 mt-1">
                        $5,608.00
                      </p>
                      <p className="text-[11px] text-emerald-300 mt-1">
                        Direct deposit settled
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-emerald-400" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Active Workforce
                      </p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {employees.filter((e) => e.onboardingStatus === "ACTIVE").length}
                      </p>
                      <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                        +100% verified staff
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>

                  <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Approval Pipeline
                      </p>
                      <p className="text-2xl font-bold text-amber-400 mt-1">{totalPendingApprovals}</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {pendingDeptCandidates.length} Dept • {pendingBranchCandidates.length} Branch
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <FileCheck className="w-6 h-6 text-amber-400" />
                    </div>
                  </div>

                  <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Branches & Offices
                      </p>
                      <p className="text-2xl font-bold text-white mt-1">{branches.length}</p>
                      <p className="text-[11px] text-indigo-400 mt-1">
                        {departments.length} Active Departments
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                      <GitBranch className="w-6 h-6 text-indigo-400" />
                    </div>
                  </div>

                  <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Current Payroll
                      </p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {payrollOverview?.kpis?.totalDisbursed && payrollOverview.kpis.totalDisbursed > 0
                          ? `$${payrollOverview.kpis.totalDisbursed.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                          : "$0"}
                      </p>
                      <p className="text-[11px] text-emerald-400 mt-1">
                        {payrollOverview?.kpis?.totalDisbursed && payrollOverview.kpis.totalDisbursed > 0
                          ? "Settled on Neon Cloud"
                          : "No payroll runs yet"}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-emerald-400" />
                    </div>
                  </div>
                </div>
              )}

              {/* If Employee: Self-Service Quick Hub. If Manager/Admin: 2-Stage Approval Pipeline Summary */}
              {currentRole === "EMPLOYEE" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Panel 1: Time Off Balances & Request */}
                  <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-400" />
                        <h2 className="text-base font-semibold text-white">
                          My Leave Entitlements
                        </h2>
                      </div>
                      <button
                        onClick={() => setShowApplyLeaveModal(true)}
                        className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                      >
                        + Request Leave
                      </button>
                    </div>
                    <div className="space-y-2.5">
                      {leaveBalances.map((bal) => (
                        <div
                          key={bal.id}
                          className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <span className="font-semibold text-white">{bal.leaveType}</span>
                          <span className="text-slate-400">
                            <span className="font-bold text-amber-300 font-mono">{bal.availableDays}</span> of {bal.allocatedDays} days left
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Panel 2: Projects & Quick Timesheet Logging */}
                  <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-indigo-400" />
                        <h2 className="text-base font-semibold text-white">
                          Active Projects & Timesheets
                        </h2>
                      </div>
                      <button
                        onClick={() => setShowLogTimesheetModal(true)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                      >
                        + Log Timesheet
                      </button>
                    </div>
                    <div className="space-y-2.5">
                      {projectsList.slice(0, 3).map((proj) => (
                        <div
                          key={proj.id}
                          className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-semibold text-white">{proj.name}</p>
                            <p className="text-[10px] text-slate-400">{proj.clientName}</p>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {proj.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* 2-Stage Approval Pipeline Summary for Managers & Admins */
                <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-amber-400" />
                      <h2 className="text-base font-semibold text-white">
                        Live Employee Onboarding & Approval Queue
                      </h2>
                    </div>
                    <button
                      onClick={() => setActiveTab("approvals")}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                    >
                      Manage All in Approval Center →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Stage 1: Department Review */}
                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                          Stage 1: Dept Head Review ({pendingDeptCandidates.length})
                        </span>
                        <span className="text-[10px] text-slate-400">Reviewer: Alex Chen</span>
                      </div>

                      {pendingDeptCandidates.map((c) => (
                        <div
                          key={c.id}
                          className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-3 mt-2"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={c.avatarUrl}
                              alt={c.firstName}
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700"
                            />
                            <div>
                              <p className="text-xs font-bold text-white">
                                {c.firstName} {c.lastName}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Proposed by: <span className="text-slate-300">{c.createdByName}</span>
                              </p>
                            </div>
                          </div>

                          {(currentRole === "DEPARTMENT_ADMIN" ||
                            currentRole === "BRANCH_ADMIN" ||
                            currentRole === "COMPANY_ADMIN" ||
                            currentRole === "SUPER_ADMIN") && (
                            <button
                              onClick={() => openApprovalModal(c, "APPROVE")}
                              className="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer"
                            >
                              Review →
                            </button>
                          )}
                        </div>
                      ))}

                      {pendingDeptCandidates.length === 0 && (
                        <p className="text-xs text-slate-500 py-3 text-center">
                          No candidates awaiting department review.
                        </p>
                      )}
                    </div>

                    {/* Stage 2: Branch HR Sign-Off */}
                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                          Stage 2: Branch HR Final Sign-Off ({pendingBranchCandidates.length})
                        </span>
                        <span className="text-[10px] text-slate-400">Reviewer: Michael Scott</span>
                      </div>

                      {pendingBranchCandidates.map((c) => (
                        <div
                          key={c.id}
                          className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-3 mt-2"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={c.avatarUrl}
                              alt={c.firstName}
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700"
                            />
                            <div>
                              <p className="text-xs font-bold text-white">
                                {c.firstName} {c.lastName}
                              </p>
                              <p className="text-[10px] text-emerald-400">
                                ✓ Dept Approved • Awaiting Activation
                              </p>
                            </div>
                          </div>

                          {(currentRole === "BRANCH_ADMIN" ||
                            currentRole === "COMPANY_ADMIN" ||
                            currentRole === "SUPER_ADMIN") && (
                            <button
                              onClick={() => openApprovalModal(c, "APPROVE")}
                              className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer"
                            >
                              Final Sign-Off →
                            </button>
                          )}
                        </div>
                      ))}

                      {pendingBranchCandidates.length === 0 && (
                        <p className="text-xs text-slate-500 py-3 text-center">
                          No candidates awaiting branch HR sign-off.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: APPROVAL CENTER (THE 2-STAGE APPROVAL WORKFLOW) */}
          {activeTab === "approvals" && currentRole !== "EMPLOYEE" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-white">
                    Two-Stage Employee Approval Center
                  </h1>
                  <p className="text-xs text-slate-400">
                    Team Lead proposes candidate ➔ Department Admin approves ➔ Branch HR Admin grants final activation.
                  </p>
                </div>
                {(currentRole === "TEAM_LEAD" ||
                  currentRole === "DEPARTMENT_ADMIN" ||
                  currentRole === "BRANCH_ADMIN" ||
                  currentRole === "COMPANY_ADMIN" ||
                  currentRole === "SUPER_ADMIN") && (
                  <button
                    onClick={() => setShowProposeCandidateModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Propose Candidate
                  </button>
                )}
              </div>

              {/* Approval Center Sub-Tab Switcher */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <button
                  onClick={() => setApprovalSubTab("ONBOARDING")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    approvalSubTab === "ONBOARDING"
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Candidate Onboarding ({totalPendingApprovals})</span>
                </button>
                <button
                  onClick={() => setApprovalSubTab("LEAVES")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    approvalSubTab === "LEAVES"
                      ? "bg-amber-600 text-white shadow-lg shadow-amber-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Leave Requests (
                    {leaveRequests.filter((l) => l.status === "PENDING").length}
                    )
                  </span>
                </button>
              </div>

              {approvalSubTab === "ONBOARDING" && (
                <>
                  {/* Progress Flow Visualization */}
                  <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                      Approval Lifecycle Stages
                    </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                    <span className="font-bold text-slate-400">1. Onboarding Initiated</span>
                    <p className="text-slate-300 mt-1">Candidate proposed by Team Lead</p>
                  </div>
                  <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/50">
                    <span className="font-bold text-indigo-400">2. Department Review</span>
                    <p className="text-slate-300 mt-1">Technical & team fit sign-off</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/50">
                    <span className="font-bold text-amber-400">3. Branch HR Review</span>
                    <p className="text-slate-300 mt-1">Compensation & contract verification</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50">
                    <span className="font-bold text-emerald-400">4. Employee Activated</span>
                    <p className="text-slate-300 mt-1">Credentials issued & login enabled</p>
                  </div>
                </div>
              </div>

              {/* Active Candidates List */}
              <div className="space-y-4">
                {employees
                  .filter((e) => e.onboardingStatus !== "ACTIVE")
                  .map((candidate) => {
                    const isDeptStage = candidate.onboardingStatus === "PENDING_DEPT_APPROVAL";
                    const isBranchStage = candidate.onboardingStatus === "PENDING_BRANCH_APPROVAL";
                    const isRejected = candidate.onboardingStatus === "REJECTED";

                    return (
                      <div
                        key={candidate.id}
                        className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-sm space-y-4"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <img
                              src={candidate.avatarUrl}
                              alt={candidate.firstName}
                              className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/40"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-white">
                                  {candidate.firstName} {candidate.lastName}
                                </h3>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                    isDeptStage
                                      ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                                      : isBranchStage
                                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                      : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                                  }`}
                                >
                                  {candidate.onboardingStatus.replace(/_/g, " ")}
                                </span>
                              </div>
                              <p className="text-xs text-indigo-400 font-medium">
                                {candidate.designation} • {candidate.department} ({candidate.branch})
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                Proposed by:{" "}
                                <span className="text-slate-300 font-medium">
                                  {candidate.createdByName || "Team Lead"}
                                </span>{" "}
                                • Proposed Salary:{" "}
                                <span className="text-white font-mono font-semibold">
                                  ${candidate.baseSalary.toLocaleString()} / yr
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          {!isRejected && (
                            <div className="flex items-center gap-2 self-end lg:self-center">
                              {isDeptStage && (
                                <>
                                  {["DEPARTMENT_ADMIN", "COMPANY_ADMIN", "SUPER_ADMIN"].includes(currentRole) ? (
                                    <>
                                      <button
                                        onClick={() => openApprovalModal(candidate, "REJECT")}
                                        className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/30 transition flex items-center gap-1.5 cursor-pointer"
                                      >
                                        <XCircle className="w-4 h-4" />
                                        Reject
                                      </button>
                                      <button
                                        onClick={() => openApprovalModal(candidate, "APPROVE")}
                                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5 cursor-pointer"
                                      >
                                        <Check className="w-4 h-4" />
                                        Approve to Branch HR
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-800/80 text-slate-400 border border-slate-700/60 font-medium italic flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                      Awaiting Dept Admin Review
                                    </span>
                                  )}
                                </>
                              )}

                              {isBranchStage && (
                                <>
                                  {["BRANCH_ADMIN", "COMPANY_ADMIN", "SUPER_ADMIN"].includes(currentRole) ? (
                                    <>
                                      <button
                                        onClick={() => openApprovalModal(candidate, "REJECT")}
                                        className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/30 transition flex items-center gap-1.5 cursor-pointer"
                                      >
                                        <XCircle className="w-4 h-4" />
                                        Reject
                                      </button>
                                      <button
                                        onClick={() => openApprovalModal(candidate, "APPROVE")}
                                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer"
                                      >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Final Approve & Activate
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-800/80 text-slate-400 border border-slate-700/60 font-medium italic flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                                      Awaiting Branch HR Review
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Audit Trail / Approval History */}
                        {candidate.approvalHistory && candidate.approvalHistory.length > 0 && (
                          <div className="pt-3 border-t border-slate-800/80">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                              Audit Trail & Review History:
                            </span>
                            <div className="space-y-2">
                              {candidate.approvalHistory.map((log) => (
                                <div
                                  key={log.id}
                                  className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-800 text-xs text-slate-300"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-emerald-400 flex items-center gap-1">
                                      ✓ {log.stage === "DEPARTMENT_REVIEW" ? "Dept Review Passed" : "Branch Review Passed"}
                                    </span>
                                    <span className="text-[10px] text-slate-400">{log.date}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-0.5">
                                    Reviewer: <span className="text-white">{log.reviewerName}</span> ({log.reviewerRole})
                                  </p>
                                  {log.comments && (
                                    <p className="italic text-slate-300 text-[11px] mt-1">
                                      "{log.comments}"
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                {employees.filter((e) => e.onboardingStatus !== "ACTIVE").length === 0 && (
                  <div className="py-12 bg-slate-900/60 rounded-2xl border border-slate-800 text-center text-slate-400 text-sm">
                    🎉 All candidate onboarding reviews are complete! No pending approvals.
                  </div>
                )}
              </div>
            </>
          )}

          {/* SUB-TAB: LEAVE REQUESTS APPROVAL QUEUE */}
          {approvalSubTab === "LEAVES" && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Pending Team Leave Applications Awaiting Sign-Off</span>
                </h3>
                <p className="text-xs text-slate-400">
                  As manager or HR administrator, review employee absence requests, inspect business days and reasons, and approve to deduct balances.
                </p>
              </div>

              <div className="space-y-3">
                {leaveRequests
                  .filter((l) => l.status === "PENDING")
                  .map((l) => (
                    <div
                      key={l.id}
                      className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="flex items-start gap-4 min-w-0">
                        <img
                          src={l.employeeAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                          alt={l.employeeName}
                          className="w-11 h-11 rounded-xl object-cover ring-2 ring-amber-500/40 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-white">{l.employeeName}</h4>
                            <span className="text-xs text-slate-400">• {l.department}</span>
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-bold border"
                              style={{
                                backgroundColor: `${l.colorHex || "#3b82f6"}15`,
                                borderColor: `${l.colorHex || "#3b82f6"}40`,
                                color: l.colorHex || "#3b82f6",
                              }}
                            >
                              {l.leaveType}
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white">
                              {l.startDate} ➔ {l.endDate}
                            </span>
                            <span className="text-amber-300 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-xs font-bold">
                              {l.totalDays} Business {l.totalDays === 1 ? "Day" : "Days"}
                            </span>
                            <span className="text-slate-500 text-xs">
                              Requested on {l.appliedAt}
                            </span>
                          </p>

                          <p className="text-xs text-slate-400 italic mt-1.5 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                            "{l.reason}"
                          </p>
                        </div>
                      </div>

                      {["TEAM_LEAD", "DEPARTMENT_ADMIN", "BRANCH_ADMIN", "COMPANY_ADMIN", "SUPER_ADMIN"].includes(currentRole) ? (
                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                          <button
                            onClick={() => handleActionLeaveRequest(l.id, "REJECT")}
                            className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/30 transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                          <button
                            onClick={() => handleActionLeaveRequest(l.id, "APPROVE")}
                            className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            Approve Leave
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Reviewer authorization required</span>
                      )}
                    </div>
                  ))}

                {leaveRequests.filter((l) => l.status === "PENDING").length === 0 && (
                  <div className="py-12 bg-slate-900/60 rounded-2xl border border-slate-800 text-center text-slate-400 text-sm">
                    🎉 All leave applications have been reviewed! No pending leave sign-offs.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

          {/* TAB 3: MULTI-TIER ORG HIERARCHY STUDIO */}
          {activeTab === "hierarchy" &&
            ["SUPER_ADMIN", "COMPANY_ADMIN", "BRANCH_ADMIN", "DEPARTMENT_ADMIN"].includes(currentRole) && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-indigo-400" />
                    Multi-Tier Org Hierarchy Studio
                  </h1>
                  <p className="text-xs text-slate-400">
                    SaaS Tenants (Super Admin) ➔ Branches (Company HR) ➔ Departments (Branch HR) ➔ Teams (Dept Head) ➔ Employees.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {currentRole === "SUPER_ADMIN" && (
                    <button
                      onClick={() => setShowCreateCompanyModal(true)}
                      className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-purple-600/30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Onboard Company
                    </button>
                  )}
                  {(currentRole === "COMPANY_ADMIN" || currentRole === "SUPER_ADMIN") && (
                    <button
                      onClick={() => setShowCreateBranchModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Branch
                    </button>
                  )}
                  {(currentRole === "BRANCH_ADMIN" ||
                    currentRole === "COMPANY_ADMIN" ||
                    currentRole === "SUPER_ADMIN") && (
                    <button
                      onClick={() => setShowCreateDeptModal(true)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 transition flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Department
                    </button>
                  )}
                  {(currentRole === "DEPARTMENT_ADMIN" ||
                    currentRole === "BRANCH_ADMIN" ||
                    currentRole === "COMPANY_ADMIN" ||
                    currentRole === "SUPER_ADMIN") && (
                    <button
                      onClick={() => setShowCreateTeamModal(true)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 transition flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Team
                    </button>
                  )}
                </div>
              </div>

              {/* Hierarchy Architecture Flow Breadcrumb */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs border border-purple-500/30">1</span>
                  <div>
                    <span className="font-bold text-purple-300">👑 Super Admin</span>
                    <p className="text-[10px] text-slate-400">Onboards SaaS Companies</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 hidden md:block" />
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">2</span>
                  <div>
                    <span className="font-bold text-indigo-300">🏢 Company HR</span>
                    <p className="text-[10px] text-slate-400">Creates Company Branches</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 hidden md:block" />
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs border border-cyan-500/30">3</span>
                  <div>
                    <span className="font-bold text-cyan-300">📍 Branch HR</span>
                    <p className="text-[10px] text-slate-400">Establishes Departments</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 hidden md:block" />
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">4</span>
                  <div>
                    <span className="font-bold text-emerald-300">📁 Dept Head</span>
                    <p className="text-[10px] text-slate-400">Creates Teams & 1st Signoff</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 hidden md:block" />
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/30">5</span>
                  <div>
                    <span className="font-bold text-amber-300">👤 Team Lead</span>
                    <p className="text-[10px] text-slate-400">Proposes Candidate Hires</p>
                  </div>
                </div>
              </div>

              {/* TIER 1: SAAS CLIENT COMPANIES (ROOT OF HIERARCHY) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      Tier 1: SaaS Client Companies ({companies.length})
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Super Admin provisions companies. Select a company to inspect or manage its child branches and departments.
                    </p>
                  </div>
                  {currentRole === "SUPER_ADMIN" && (
                    <button
                      onClick={() => setShowCreateCompanyModal(true)}
                      className="bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white px-3 py-1.5 rounded-xl border border-purple-500/30 transition flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      + Add Company
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {companies.map((c) => {
                    const isSelected = selectedCompanyId === c.id;
                    const cBranches = branches.filter(
                      (b) => b.companyId === c.id || (!b.companyId && c.id === "digisail-company-1")
                    );
                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelectedCompanyId(c.id);
                          showToast(`Focused on company: ${c.name}`);
                          fetchLiveData(c.id);
                        }}
                        className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                          isSelected
                            ? "bg-purple-950/30 border-purple-500 ring-2 ring-purple-500/40 shadow-xl"
                            : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {c.plan} PLAN
                            </span>
                            <h4 className="text-sm font-bold text-white mt-1.5">{c.name}</h4>
                            <p className="text-[11px] text-purple-400 font-mono">
                              {c.subdomain}.digisailhrm.com
                            </p>
                          </div>
                          {isSelected ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-600 text-white shadow-sm">
                              Active Focus
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 hover:text-slate-300">
                              Click to inspect
                            </span>
                          )}
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                          <span>
                            HR: <strong className="text-slate-200">{c.adminName}</strong>
                          </span>
                          <span>🏢 {cBranches.length} Branches</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TIER 2: REGISTERED BRANCHES */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5" />
                      Tier 2: Branches of "{activeCompany?.name || "Selected Company"}" (
                      {
                        branches.filter(
                          (b) =>
                            b.companyId === selectedCompanyId ||
                            (!b.companyId && selectedCompanyId === "digisail-company-1")
                        ).length
                      }
                      )
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Company HR Admin establishes physical branch offices and assigns Branch HR managers.
                    </p>
                  </div>
                  {(currentRole === "COMPANY_ADMIN" || currentRole === "SUPER_ADMIN") && (
                    <button
                      onClick={() => {
                        setNewBranch({
                          ...newBranch,
                          companyId: selectedCompanyId,
                        });
                        setShowCreateBranchModal(true);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      + Add Branch
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {branches
                    .filter(
                      (b) =>
                        b.companyId === selectedCompanyId ||
                        (!b.companyId && selectedCompanyId === "digisail-company-1")
                    )
                    .map((b) => (
                      <div
                        key={b.id}
                        className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">
                                {b.code}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                • {b.companyName || activeCompany?.name}
                              </span>
                            </div>
                            <h4 className="text-base font-bold text-white mt-0.5">{b.name}</h4>
                            <p className="text-xs text-slate-400">
                              {b.city}, {b.country}
                            </p>
                          </div>
                          <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 font-medium">
                            Branch HR: {b.adminName}
                          </span>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
                          <span>Departments: {b.departmentCount}</span>
                          <span>Assigned Staff: {b.employeeCount}</span>
                        </div>
                      </div>
                    ))}

                  {branches.filter(
                    (b) =>
                      b.companyId === selectedCompanyId ||
                      (!b.companyId && selectedCompanyId === "digisail-company-1")
                  ).length === 0 && (
                    <div className="col-span-2 p-8 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 text-xs text-slate-400">
                      No branches established yet for "{activeCompany?.name}". Click "+ Add Branch" above to create this company's first branch.
                    </div>
                  )}
                </div>
              </div>

              {/* Departments & Teams Breakdown */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Departments & Assigned Teams
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {departments.map((d) => (
                    <div
                      key={d.id}
                      className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-mono text-cyan-400 uppercase">
                            {d.code}
                          </span>
                          <h4 className="text-sm font-bold text-white mt-0.5">{d.name}</h4>
                          <p className="text-[11px] text-slate-400">{d.branchName}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                          Head: {d.adminName}
                        </span>
                      </div>

                      {/* Teams inside department */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          Teams under {d.name}:
                        </span>
                        {teams
                          .filter((t) => t.departmentName === d.name)
                          .map((t) => (
                            <div
                              key={t.id}
                              className="p-2 rounded-lg bg-slate-800/40 border border-slate-800 text-xs flex items-center justify-between"
                            >
                              <span className="text-white font-medium">{t.name}</span>
                              <span className="text-[10px] text-indigo-400">Lead: {t.leadName}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EMPLOYEES DIRECTORY */}
          {activeTab === "employees" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-white">Workforce Directory</h1>
                  <p className="text-xs text-slate-400">
                    Active employees across all registered company branches.
                  </p>
                </div>
              </div>

              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by employee name, role, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="bg-slate-800/60 border border-slate-700/60 text-xs text-slate-200 rounded-xl px-3 py-2"
                >
                  <option value="All">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Product Design">Product Design</option>
                  <option value="People & Culture">People & Culture</option>
                </select>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={emp.avatarUrl}
                            alt={emp.firstName}
                            className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/30"
                          />
                          <div>
                            <h3 className="text-sm font-bold text-white">
                              {emp.firstName} {emp.lastName}
                            </h3>
                            <p className="text-xs text-indigo-400 font-medium">{emp.designation}</p>
                            <span className="text-[10px] text-slate-400">{emp.employeeNumber}</span>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            emp.onboardingStatus === "ACTIVE"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {emp.onboardingStatus}
                        </span>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                        <p>📍 Branch: {emp.branch}</p>
                        <p>📁 Department: {emp.department}</p>
                        {emp.team && <p>👥 Team: {emp.team}</p>}
                        <p>✉️ Email: {emp.email}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      {["SUPER_ADMIN", "COMPANY_ADMIN", "BRANCH_ADMIN", "DEPARTMENT_ADMIN"].includes(currentRole) ? (
                        <span className="font-bold text-slate-200 font-mono">
                          ${emp.baseSalary.toLocaleString()} / yr
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-medium">
                          {emp.email.toLowerCase() === currentUser.email.toLowerCase() ||
                          `${emp.firstName} ${emp.lastName}`.toLowerCase() === currentUser.name.toLowerCase()
                            ? `$${emp.baseSalary.toLocaleString()} / yr`
                            : "Compensation Confidential"}
                        </span>
                      )}
                      <span className="text-indigo-400 text-[11px] font-semibold">Active Staff</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: ATTENDANCE */}
          {activeTab === "attendance" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <h1 className="text-xl font-bold text-white">Attendance Logs</h1>
              <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/50 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">Employee</th>
                      <th className="py-3.5 px-4">Branch</th>
                      <th className="py-3.5 px-4">Department</th>
                      <th className="py-3.5 px-4">Punch In</th>
                      <th className="py-3.5 px-4">Work Hours</th>
                      <th className="py-3.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {attendances.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 font-semibold text-white">{a.employeeName}</td>
                        <td className="py-3 px-4">{a.branch}</td>
                        <td className="py-3 px-4">{a.department}</td>
                        <td className="py-3 px-4 font-mono">{a.punchIn}</td>
                        <td className="py-3 px-4 font-semibold">{a.workHours} hrs</td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400">
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: LEAVE MANAGEMENT & TIME OFF QUOTAS */}
          {activeTab === "leaves" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Hero Banner */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 p-6 border border-blue-500/20 shadow-xl">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5 w-fit">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>TIME OFF & QUOTA ENGINE</span>
                    </span>
                    <h1 className="text-2xl font-bold text-white tracking-tight mt-1.5">
                      Leave Management & Entitlements
                    </h1>
                    <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                      Monitor annual quota balances, apply for paid or medical time off with automated business day calculation, and review team approval queues.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowApplyLeaveModal(true)}
                    className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Request Time Off</span>
                  </button>
                </div>
              </div>

              {/* Visual Quota Entitlement Cards (Grid of 4) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {leaveBalances.map((bal) => {
                  const percentUsed =
                    bal.allocatedDays > 0
                      ? Math.round((bal.usedDays / bal.allocatedDays) * 100)
                      : 0;

                  return (
                    <div
                      key={bal.id}
                      className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full border"
                            style={{
                              backgroundColor: `${bal.colorHex}15`,
                              borderColor: `${bal.colorHex}40`,
                              color: bal.colorHex,
                            }}
                          >
                            {bal.leaveType}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {bal.isPaid ? "Paid" : "Unpaid"}
                          </span>
                        </div>
                        <div className="mt-2">
                          <span className="text-3xl font-extrabold text-white">
                            {bal.availableDays}
                          </span>
                          <span className="text-xs text-slate-400 ml-1.5 font-medium">
                            days left
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="mt-3 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.max(5, percentUsed))}%`,
                              backgroundColor: bal.colorHex,
                            }}
                          />
                        </div>
                      </div>

                      {/* Sub-breakdown metrics */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Total: <strong className="text-slate-200">{bal.allocatedDays}d</strong></span>
                        <span>Used: <strong className="text-slate-200">{bal.usedDays}d</strong></span>
                        {bal.pendingDays > 0 && (
                          <span className="text-amber-400 font-semibold">
                            Pending: {bal.pendingDays}d
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Leave Requests Directory & Review Pipeline */}
              <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span>Leave Applications & History</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Review employee time off requests, audit approval decisions, or manage pending leaves.
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
                    {(
                      [
                        { id: "ALL", label: "All" },
                        {
                          id: "PENDING",
                          label: "Pending",
                          count: leaveRequests.filter((l) => l.status === "PENDING").length,
                        },
                        { id: "APPROVED", label: "Approved" },
                        { id: "REJECTED", label: "Rejected" },
                      ] as { id: "ALL" | "PENDING" | "APPROVED" | "REJECTED"; label: string; count?: number }[]
                    ).map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setLeaveStatusFilter(f.id)}
                        className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                          leaveStatusFilter === f.id
                            ? "bg-blue-600 text-white font-semibold shadow-md"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <span>{f.label}</span>
                        {f.count !== undefined && f.count > 0 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-300 font-bold">
                            {f.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={leaveSearchQuery}
                    onChange={(e) => setLeaveSearchQuery(e.target.value)}
                    placeholder="Search by requester name, leave category, or reason..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Filtered Leave Request Cards List */}
                <div className="space-y-3 pt-2">
                  {leaveRequests
                    .filter((l) => {
                      if (leaveStatusFilter !== "ALL" && l.status !== leaveStatusFilter) {
                        return false;
                      }
                      if (leaveSearchQuery.trim()) {
                        const q = leaveSearchQuery.toLowerCase();
                        return (
                          l.employeeName.toLowerCase().includes(q) ||
                          l.leaveType.toLowerCase().includes(q) ||
                          l.reason.toLowerCase().includes(q)
                        );
                      }
                      return true;
                    })
                    .map((l) => (
                      <div
                        key={l.id}
                        className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          <img
                            src={l.employeeAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                            alt={l.employeeName}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-white truncate">
                                {l.employeeName}
                              </h4>
                              <span className="text-[10px] text-slate-400 font-medium">
                                • {l.department}
                              </span>
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full font-bold border"
                                style={{
                                  backgroundColor: `${l.colorHex || "#3b82f6"}15`,
                                  borderColor: `${l.colorHex || "#3b82f6"}40`,
                                  color: l.colorHex || "#3b82f6",
                                }}
                              >
                                {l.leaveType}
                              </span>
                            </div>

                            <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-white">
                                {l.startDate} ➔ {l.endDate}
                              </span>
                              <span className="text-blue-300 font-mono bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20 text-[10px]">
                                {l.totalDays} business {l.totalDays === 1 ? "day" : "days"}
                              </span>
                              <span className="text-slate-500 text-[11px]">
                                (Applied on {l.appliedAt})
                              </span>
                            </p>

                            <p className="text-xs italic text-slate-400 mt-1.5">
                              "{l.reason}"
                            </p>

                            {l.approvedBy && (
                              <p className="text-[10px] text-slate-500 mt-1">
                                Verified by: <span className="text-slate-300">{l.approvedBy}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status Badge & Reviewer Controls */}
                        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                          {l.status === "PENDING" && (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                              Pending Review
                            </span>
                          )}
                          {l.status === "APPROVED" && (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Approved
                            </span>
                          )}
                          {l.status === "REJECTED" && (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                              Rejected
                            </span>
                          )}
                          {l.status === "CANCELLED" && (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-medium">
                              Cancelled
                            </span>
                          )}

                          {/* Reviewer Action Buttons */}
                          {l.status === "PENDING" &&
                            (currentRole === "TEAM_LEAD" ||
                              currentRole === "DEPARTMENT_ADMIN" ||
                              currentRole === "BRANCH_ADMIN" ||
                              currentRole === "COMPANY_ADMIN" ||
                              currentRole === "SUPER_ADMIN") && (
                              <div className="flex items-center gap-1.5 ml-1">
                                <button
                                  onClick={() => handleActionLeaveRequest(l.id, "APPROVE")}
                                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition cursor-pointer"
                                  title="Approve Leave Application"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleActionLeaveRequest(l.id, "REJECT")}
                                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/40 transition cursor-pointer"
                                  title="Reject Leave Application"
                                >
                                  Reject
                                </button>
                              </div>
                            )}

                          {/* Employee Cancel Own Request Button */}
                          {l.status === "PENDING" && currentRole === "EMPLOYEE" && (
                            <button
                              onClick={() => handleCancelLeaveRequest(l.id)}
                              className="px-2.5 py-1 text-xs text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                              title="Cancel leave request and refund days"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                  {leaveRequests.filter((l) => {
                    if (leaveStatusFilter !== "ALL" && l.status !== leaveStatusFilter) return false;
                    if (leaveSearchQuery.trim()) {
                      const q = leaveSearchQuery.toLowerCase();
                      return (
                        l.employeeName.toLowerCase().includes(q) ||
                        l.leaveType.toLowerCase().includes(q) ||
                        l.reason.toLowerCase().includes(q)
                      );
                    }
                    return true;
                  }).length === 0 && (
                    <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl">
                      <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs font-medium text-slate-400">
                        No leave applications found matching your filter criteria.
                      </p>
                      <button
                        onClick={() => {
                          setLeaveStatusFilter("ALL");
                          setLeaveSearchQuery("");
                        }}
                        className="mt-2 text-xs text-blue-400 hover:underline cursor-pointer"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: PROJECTS & TIMESHEETS (PHASE 8) */}
          {activeTab === "projects" && (
            <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
              {/* Executive & Operational Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-600/20">
                      <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        Projects & Timesheets Intelligence
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          Phase 8 Live
                        </span>
                      </h1>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Client engagements, resource allocations, task velocity, and weekly timesheet approvals.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Header Action Controls */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search projects or logs..."
                      value={projectSearchQuery}
                      onChange={(e) => setProjectSearchQuery(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48"
                    />
                  </div>

                  {/* Log Timesheet Button (Accessible to all employees) */}
                  <button
                    onClick={() => {
                      setNewTimesheetForm({
                        projectId: projectsList[0]?.id || "",
                        date: new Date().toISOString().split("T")[0],
                        hoursWorked: 8.0,
                        taskDescription: "",
                      });
                      setShowLogTimesheetModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700/80 transition cursor-pointer shadow-sm"
                  >
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    Log Timesheet
                  </button>

                  {/* Create Project Button (Admins & Leads) */}
                  {(currentRole === "SUPER_ADMIN" ||
                    currentRole === "COMPANY_ADMIN" ||
                    currentRole === "BRANCH_ADMIN" ||
                    currentRole === "DEPARTMENT_ADMIN" ||
                    currentRole === "TEAM_LEAD") && (
                    <button
                      onClick={() => setShowCreateProjectModal(true)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/25 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-white" />
                      New Project
                    </button>
                  )}
                </div>
              </div>

              {/* 4 Dynamic KPI Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI 1: Active Engagements */}
                <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 relative overflow-hidden backdrop-blur-sm">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Active Engagements</span>
                    <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      <Briefcase className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <div className="text-xl font-bold font-mono text-white">
                      {projectsList.filter((p) => p.status === "ACTIVE").length} Projects
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-blue-400">
                      <span>{projectsList.length} total managed initiatives</span>
                    </div>
                  </div>
                </div>

                {/* KPI 2: Total Hours Logged */}
                <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 relative overflow-hidden backdrop-blur-sm">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Billable Hours Logged</span>
                    <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <div className="text-xl font-bold font-mono text-white">
                      {timesheetsList.reduce((acc, t) => acc + t.hoursWorked, 0).toFixed(1)} hrs
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-purple-300">
                      <span>Across {timesheetsList.length} verified timesheet entries</span>
                    </div>
                  </div>
                </div>

                {/* KPI 3: Pending Approvals */}
                <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 relative overflow-hidden backdrop-blur-sm">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Pending Review Queue</span>
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <FileCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <div className="text-xl font-bold font-mono text-white">
                      {timesheetsList.filter((t) => t.status === "SUBMITTED").length} Timesheets
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-400">
                      <span>Awaiting manager sign-off</span>
                    </div>
                  </div>
                </div>

                {/* KPI 4: Active Project Capital */}
                <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 relative overflow-hidden backdrop-blur-sm">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Total Program Capital</span>
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <div className="text-xl font-bold font-mono text-white">
                      ${projectsList.reduce((acc, p) => acc + (p.budget || 0), 0).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400">
                      <span>Allocated capital commitments</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-Navigation Switcher */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setProjectSubTab("projects")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      projectSubTab === "projects"
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                        : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Projects Portfolio</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/20 text-white">
                      {projectsList.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setProjectSubTab("timesheets")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      projectSubTab === "timesheets"
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                        : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Timesheet Logs & Approvals</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/20 text-white">
                      {timesheetsList.length}
                    </span>
                  </button>
                </div>

                <div className="text-xs text-slate-400 hidden sm:block">
                  Active workspace: <span className="text-blue-400 font-semibold">{activeCompany.name}</span>
                </div>
              </div>

              {/* VIEW 1: PROJECTS PORTFOLIO GRID */}
              {projectSubTab === "projects" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {projectsList
                    .filter((p) => {
                      if (projectSearchQuery.trim()) {
                        const q = projectSearchQuery.toLowerCase();
                        return (
                          p.name.toLowerCase().includes(q) ||
                          p.code.toLowerCase().includes(q) ||
                          (p.client && p.client.toLowerCase().includes(q)) ||
                          (p.clientName && p.clientName.toLowerCase().includes(q))
                        );
                      }
                      return true;
                    })
                    .map((p) => {
                      const loggedHours = p.totalHoursLogged ?? p.hoursSpent ?? 0;
                      const capHours = p.totalHours ?? 1500;
                      const progressPct = Math.min(100, Math.round((loggedHours / capHours) * 100));

                      return (
                        <div
                          key={p.id}
                          className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition shadow-lg relative group overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition pointer-events-none" />

                          <div>
                            {/* Card Top: Code, Status & Client */}
                            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/25">
                                {p.code}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  p.status === "ACTIVE"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : p.status === "PLANNING"
                                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                    : "bg-slate-700 text-slate-300"
                                }`}
                              >
                                {p.status}
                              </span>
                            </div>

                            {/* Project Name & Client */}
                            <div className="mt-3">
                              <h3 className="text-sm font-bold text-white tracking-tight group-hover:text-blue-300 transition">
                                {p.name}
                              </h3>
                              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                                <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                                {p.clientName || p.client || "Internal SaaS Core"}
                              </p>
                              {p.description && (
                                <p className="text-[11px] text-slate-400/90 mt-2 line-clamp-2 leading-relaxed">
                                  {p.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Metrics & Progress Bar */}
                          <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">Capital Budget:</span>
                              <span className="font-mono font-bold text-white">
                                ${p.budget.toLocaleString()}
                              </span>
                            </div>

                            {/* Hours Progress Bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[11px] text-slate-400">
                                <span>Logged Effort</span>
                                <span className="font-mono text-slate-300">
                                  {loggedHours} / {capHours} hrs
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </div>

                            {/* Timeline & Team Member Avatars */}
                            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                <span>{p.deadline || p.endDate || "Ongoing"}</span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                                  {p.members ? `${p.members.length} Assigned` : `${p.teamCount || 4} Staff`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* VIEW 2: TIMESHEET LOGS & APPROVALS TABLE */}
              {projectSubTab === "timesheets" && (
                <div className="space-y-4">
                  {/* Status Filter Bar */}
                  <div className="flex items-center gap-2">
                    {["ALL", "SUBMITTED", "APPROVED", "REJECTED"].map((st) => (
                      <button
                        key={st}
                        onClick={() => setTimesheetStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          timesheetStatusFilter === st
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                        }`}
                      >
                        {st === "SUBMITTED" ? "Pending Review" : st}
                      </button>
                    ))}
                  </div>

                  <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                          <tr>
                            <th className="py-3.5 px-4 font-semibold">Employee</th>
                            <th className="py-3.5 px-3 font-semibold">Project</th>
                            <th className="py-3.5 px-3 font-semibold">Date</th>
                            <th className="py-3.5 px-3 font-semibold text-right">Hours</th>
                            <th className="py-3.5 px-4 font-semibold">Task Description</th>
                            <th className="py-3.5 px-3 font-semibold text-center">Status</th>
                            <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                          {(() => {
                            const filtered = timesheetsList.filter((t) => {
                              if (timesheetStatusFilter !== "ALL" && t.status !== timesheetStatusFilter) {
                                return false;
                              }
                              if (projectSearchQuery.trim()) {
                                const q = projectSearchQuery.toLowerCase();
                                return (
                                  t.employeeName.toLowerCase().includes(q) ||
                                  t.projectName.toLowerCase().includes(q) ||
                                  t.taskDescription.toLowerCase().includes(q)
                                );
                              }
                              return true;
                            });

                            if (filtered.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={7} className="py-12 text-center text-slate-500">
                                    <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                                    <p className="font-medium text-slate-400">
                                      No timesheet records found for this view.
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-1">
                                      Click &quot;Log Timesheet&quot; above to submit hours worked.
                                    </p>
                                  </td>
                                </tr>
                              );
                            }

                            return filtered.map((ts) => (
                              <tr key={ts.id} className="hover:bg-slate-800/40 transition">
                                {/* Employee */}
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-[11px] shrink-0">
                                      {ts.employeeName.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="font-semibold text-white">{ts.employeeName}</div>
                                      <div className="text-[10px] text-slate-400 font-mono">
                                        {ts.department || "Engineering"}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Project */}
                                <td className="py-3.5 px-3">
                                  <div className="font-semibold text-white text-xs">{ts.projectName}</div>
                                  {ts.projectCode && (
                                    <span className="text-[10px] font-mono text-blue-400">
                                      {ts.projectCode}
                                    </span>
                                  )}
                                </td>

                                {/* Date */}
                                <td className="py-3.5 px-3 font-mono text-xs text-slate-300">
                                  {ts.date}
                                </td>

                                {/* Hours */}
                                <td className="py-3.5 px-3 font-mono text-right font-bold text-white text-xs">
                                  {ts.hoursWorked.toFixed(1)} hrs
                                </td>

                                {/* Task Description */}
                                <td className="py-3.5 px-4 text-slate-300 max-w-md">
                                  <p className="text-xs line-clamp-2 leading-relaxed">
                                    {ts.taskDescription}
                                  </p>
                                </td>

                                {/* Status */}
                                <td className="py-3.5 px-3 text-center">
                                  <span
                                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                                      ts.status === "APPROVED"
                                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                        : ts.status === "SUBMITTED"
                                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                        : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                    }`}
                                  >
                                    {ts.status === "APPROVED" && <Check className="w-2.5 h-2.5" />}
                                    {ts.status}
                                  </span>
                                </td>

                                {/* Review Action Buttons (for Reviewers) */}
                                <td className="py-3.5 px-4 text-right">
                                  {ts.status === "SUBMITTED" && currentRole !== "EMPLOYEE" ? (
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        onClick={() => handleActionTimesheet(ts.id, "APPROVE")}
                                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition cursor-pointer"
                                        title="Approve timesheet hours"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => handleActionTimesheet(ts.id, "REJECT")}
                                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/40 transition cursor-pointer"
                                        title="Reject timesheet"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[11px] text-slate-500">
                                      {ts.status === "APPROVED" ? "Verified" : ts.status === "SUBMITTED" ? "Pending" : "Finalized"}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: PAYROLL (PHASE 7) */}
          {activeTab === "payroll" && (
            <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
              {/* Executive Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-600/20">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        {currentRole === "EMPLOYEE" ? "My Personal Payslips & Earnings" : "Payroll & Compensation Ledger"}
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {currentRole === "EMPLOYEE" ? "Self-Service" : "Phase 7 Live"}
                        </span>
                      </h1>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {currentRole === "EMPLOYEE"
                          ? "Review and download your official digital payslips, monthly tax withholdings, and take-home earnings."
                          : "Automated batch calculations, statutory tax compliance, and verifiable digital employee payslips."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Header Action Controls */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search employee or code..."
                      value={payrollSearchQuery}
                      onChange={(e) => setPayrollSearchQuery(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-48"
                    />
                  </div>

                  {/* Month Filter */}
                  <select
                    value={payrollMonthFilter}
                    onChange={(e) => setPayrollMonthFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="ALL">All Months</option>
                    {[
                      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
                    ].map((m, idx) => (
                      <option key={m} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>

                  {/* Year Filter */}
                  <select
                    value={payrollYearFilter}
                    onChange={(e) => setPayrollYearFilter(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                  </select>

                  {/* Run Payroll CTA (Admin Only) */}
                  {(currentRole === "SUPER_ADMIN" ||
                    currentRole === "COMPANY_ADMIN" ||
                    currentRole === "BRANCH_ADMIN") && (
                    <button
                      onClick={() => setShowProcessPayrollModal(true)}
                      className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/25 transition cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                      Run Monthly Payroll
                    </button>
                  )}
                </div>
              </div>

              {/* 4 Dynamic KPI Metric Cards */}
              {currentRole === "EMPLOYEE" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* KPI 1: Monthly Base */}
                  <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 relative overflow-hidden backdrop-blur-sm">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">Monthly Gross Base</span>
                      <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        <DollarSign className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2.5">
                      <div className="text-xl font-bold font-mono text-white">
                        $7,083.33
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-indigo-300">
                        <span>$85,000 / yr contracted base</span>
                      </div>
                    </div>
                  </div>

                  {/* KPI 2: Net Payout */}
                  <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 relative overflow-hidden backdrop-blur-sm">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">Estimated Net Payout</span>
                      <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <Wallet className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2.5">
                      <div className="text-xl font-bold font-mono text-white">
                        $5,608.00
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400">
                        <TrendingUp className="w-3 h-3" />
                        <span>Direct Deposit to Checking</span>
                      </div>
                    </div>
                  </div>

                  {/* KPI 3: Tax Withheld */}
                  <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 relative overflow-hidden backdrop-blur-sm">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">Tax & FICA Withheld</span>
                      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Shield className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2.5">
                      <div className="text-xl font-bold font-mono text-white">
                        $1,125.00
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                        <span>Statutory deductions applied</span>
                      </div>
                    </div>
                  </div>

                  {/* KPI 4: Archived Slips */}
                  <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 relative overflow-hidden backdrop-blur-sm">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">Archived Statements</span>
                      <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        <FileCheck className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2.5">
                      <div className="text-xl font-bold font-mono text-white">
                        Available Online
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-purple-300">
                        <span>Verified digital signatures</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* KPI 1: Net Disbursed */}
                  <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 relative overflow-hidden backdrop-blur-sm">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">Total Net Disbursed</span>
                      <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <Wallet className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2.5">
                      <div className="text-xl font-bold font-mono text-white">
                        ${payrollOverview.kpis.totalDisbursed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400">
                        <TrendingUp className="w-3 h-3" />
                        <span>Verified ACH direct deposit settlements</span>
                      </div>
                    </div>
                  </div>

                  {/* KPI 2: Tax Withheld */}
                  <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 relative overflow-hidden backdrop-blur-sm">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">Tax & Compliance Remitted</span>
                      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Shield className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2.5">
                      <div className="text-xl font-bold font-mono text-white">
                        ${payrollOverview.kpis.totalTaxCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                        <span>Federal & State statutory withholding</span>
                      </div>
                    </div>
                  </div>

                  {/* KPI 3: Active Staff Coverage */}
                  <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 relative overflow-hidden backdrop-blur-sm">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">Active Staff On Payroll</span>
                      <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2.5">
                      <div className="text-xl font-bold font-mono text-white">
                        {payrollOverview.kpis.activeEmployeeCount} Employees
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-indigo-300">
                        <span>100% active roster coverage</span>
                      </div>
                    </div>
                  </div>

                  {/* KPI 4: Batch Runs */}
                  <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 relative overflow-hidden backdrop-blur-sm">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">Batch Settlements</span>
                      <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        <FileCheck className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2.5">
                      <div className="text-xl font-bold font-mono text-white">
                        {payrollOverview.runs.length} Batches
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-purple-300">
                        <span>Latest: Month {payrollOverview.kpis.latestRun ? `${payrollOverview.kpis.latestRun.month}/${payrollOverview.kpis.latestRun.year}` : "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Navigation Switcher */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPayrollSubTab("payslips")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      payrollSubTab === "payslips"
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                        : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>{currentRole === "EMPLOYEE" ? "My Personal Payslips" : "Employee Payslips Directory"}</span>
                  </button>
                  {currentRole !== "EMPLOYEE" && (
                    <button
                      onClick={() => setPayrollSubTab("batches")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        payrollSubTab === "batches"
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                          : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Payroll Batch History</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/20 text-white">
                        {payrollOverview.runs.length}
                      </span>
                    </button>
                  )}
                </div>

                <div className="text-xs text-slate-400 hidden sm:block">
                  Showing compensation records for <span className="text-emerald-400 font-semibold">{activeCompany.name}</span>
                </div>
              </div>

              {/* VIEW 1: PAYSLIPS DIRECTORY TABLE */}
              {payrollSubTab === "payslips" && (
                <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="py-3.5 px-4 font-semibold">Employee</th>
                          <th className="py-3.5 px-3 font-semibold">Location</th>
                          <th className="py-3.5 px-3 font-semibold">Period</th>
                          <th className="py-3.5 px-3 font-semibold text-right">Basic Salary</th>
                          <th className="py-3.5 px-3 font-semibold text-right">Allowances</th>
                          <th className="py-3.5 px-3 font-semibold text-right">Deductions</th>
                          <th className="py-3.5 px-3 font-semibold text-right">Tax</th>
                          <th className="py-3.5 px-3 font-semibold text-right">Net Payout</th>
                          <th className="py-3.5 px-3 font-semibold text-center">Status</th>
                          <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {(() => {
                          // Display live payslips if available, or fallback to mock for DigiSail demo
                          const isDigiSailDemo = sessionUserRole === "SUPER_ADMIN" && selectedCompanyId === "digisail-company-1";
                          const activeSlips: PayslipDetailRecord[] =
                            payslips.length > 0
                              ? payslips
                              : isDigiSailDemo
                              ? initialPayroll.map((p) => ({
                                  id: p.id,
                                  payrollRunId: "run-mock",
                                  month: 9,
                                  year: 2026,
                                  payDate: "2026-09-30",
                                  employeeId: `emp-${p.employeeNumber}`,
                                  employeeNumber: p.employeeNumber,
                                  employeeName: p.employeeName,
                                  email: `${p.employeeName.toLowerCase().replace(" ", ".")}@digisail.com`,
                                  avatarUrl: null,
                                  currency: "USD",
                                  department: p.department,
                                  designation: p.designation,
                                  branch: "New York Headquarters",
                                  basicSalary: p.basicSalary,
                                  allowances: p.allowances,
                                  deductions: p.deductions,
                                  tax: p.tax,
                                  netSalary: p.netSalary,
                                  paymentStatus: p.status,
                                  paymentMethod: "Direct Deposit (ACH)",
                                  breakdown: {
                                    basicSalary: p.basicSalary,
                                    housingAllowance: Math.round(p.basicSalary * 0.1),
                                    transportAllowance: Math.round(p.basicSalary * 0.05),
                                    utilityAllowance: 250,
                                    totalAllowances: p.allowances,
                                    grossSalary: p.basicSalary + p.allowances,
                                    providentFund: Math.round(p.basicSalary * 0.05),
                                    healthInsurance: 150,
                                    totalDeductions: p.deductions,
                                    tax: p.tax,
                                    netSalary: p.netSalary,
                                  },
                                  createdAt: "2026-09-30T10:00:00Z",
                                }))
                              : [];

                          const filtered = activeSlips.filter((p) => {
                            if (currentRole === "EMPLOYEE") {
                              const isMySlip =
                                p.employeeName.toLowerCase().includes("priya") ||
                                p.employeeName.toLowerCase() === currentUser.name.toLowerCase() ||
                                p.email.toLowerCase() === currentUser.email.toLowerCase();
                              if (!isMySlip) return false;
                            }
                            if (payrollMonthFilter !== "ALL" && p.month !== payrollMonthFilter) return false;
                            if (p.year !== payrollYearFilter) return false;
                            if (payrollSearchQuery.trim()) {
                              const q = payrollSearchQuery.toLowerCase();
                              return (
                                p.employeeName.toLowerCase().includes(q) ||
                                p.employeeNumber.toLowerCase().includes(q) ||
                                p.department.toLowerCase().includes(q) ||
                                p.designation.toLowerCase().includes(q)
                              );
                            }
                            return true;
                          });

                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan={10} className="py-12 text-center text-slate-500">
                                  <Receipt className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                                  <p className="font-medium text-slate-400">
                                    No payslips found matching the selected filters.
                                  </p>
                                  <p className="text-[11px] text-slate-500 mt-1">
                                    Try selecting a different month or clearing your search query.
                                  </p>
                                </td>
                              </tr>
                            );
                          }

                          return filtered.map((pay) => (
                            <tr key={pay.id} className="hover:bg-slate-800/40 transition">
                              {/* Employee Details */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-md">
                                    {pay.employeeName.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-white flex items-center gap-1.5">
                                      {pay.employeeName}
                                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                        {pay.employeeNumber}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                      {pay.department} • {pay.designation}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* Branch */}
                              <td className="py-3 px-3 text-slate-400 text-xs">
                                {pay.branch || "Global HQ"}
                              </td>

                              {/* Period */}
                              <td className="py-3 px-3">
                                <span className="font-mono text-xs text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                                  {pay.month}/{pay.year}
                                </span>
                              </td>

                              {/* Basic Salary */}
                              <td className="py-3 px-3 font-mono text-right text-slate-300">
                                ${pay.basicSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>

                              {/* Allowances */}
                              <td className="py-3 px-3 font-mono text-right text-emerald-400">
                                +${pay.allowances.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>

                              {/* Deductions */}
                              <td className="py-3 px-3 font-mono text-right text-rose-400">
                                -${pay.deductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>

                              {/* Tax */}
                              <td className="py-3 px-3 font-mono text-right text-amber-400/90">
                                -${pay.tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>

                              {/* Net Payout */}
                              <td className="py-3 px-3 font-mono text-right font-bold text-white text-sm">
                                ${pay.netSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>

                              {/* Status Badge */}
                              <td className="py-3 px-3 text-center">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                                  pay.paymentStatus === "PAID"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                }`}>
                                  {pay.paymentStatus === "PAID" && <Check className="w-2.5 h-2.5" />}
                                  {pay.paymentStatus}
                                </span>
                              </td>

                              {/* Action: View Printable Payslip */}
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => setSelectedPayslip(pay)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700/80 transition cursor-pointer shadow-sm"
                                  title="View Printable Digital Payslip"
                                >
                                  <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>View Payslip</span>
                                </button>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW 2: BATCH HISTORY TABLE */}
              {payrollSubTab === "batches" && (
                <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="py-3.5 px-4 font-semibold">Batch Period</th>
                          <th className="py-3.5 px-4 font-semibold">Total Disbursed</th>
                          <th className="py-3.5 px-4 font-semibold">Staff Enrolled</th>
                          <th className="py-3.5 px-4 font-semibold">Tax Withheld Total</th>
                          <th className="py-3.5 px-4 font-semibold">Settlement Date</th>
                          <th className="py-3.5 px-4 font-semibold text-center">Batch Status</th>
                          <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {payrollOverview.runs.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-500">
                              <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                              <p className="font-medium text-slate-400">No payroll batch records found.</p>
                              <p className="text-[11px] text-slate-500 mt-1">
                                Click &quot;Run Monthly Payroll&quot; above to execute your first batch settlement.
                              </p>
                            </td>
                          </tr>
                        ) : (
                          payrollOverview.runs.map((run) => (
                            <tr key={run.id} className="hover:bg-slate-800/40 transition">
                              <td className="py-3.5 px-4 font-semibold text-white">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                  <span className="font-mono text-xs">
                                    Month {run.month} / {run.year}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-white text-sm">
                                ${run.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-3.5 px-4 text-slate-300">
                                {run.employeeCount} active staff
                              </td>
                              <td className="py-3.5 px-4 font-mono text-amber-400/90">
                                ${run.taxTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                                {run.payDate ? new Date(run.payDate).toLocaleDateString() : "Immediate (ACH)"}
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  {run.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  onClick={() => {
                                    setPayrollMonthFilter(run.month);
                                    setPayrollYearFilter(run.year);
                                    setPayrollSubTab("payslips");
                                  }}
                                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium hover:underline cursor-pointer"
                                >
                                  Inspect Payslips &rarr;
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: SAAS BILLING, SUBSCRIPTIONS & LICENSE QUOTAS (PHASE 9) */}
          {activeTab === "billing" &&
            ["SUPER_ADMIN", "COMPANY_ADMIN"].includes(currentRole) && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Billing Hero Banner */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 p-6 border border-emerald-500/30 shadow-2xl">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        {subscriptionDetails?.subscription?.tier || activeCompany.plan} TIER SUBSCRIPTION
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {subscriptionDetails?.subscription?.status || "ACTIVE"}
                      </span>
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                      SaaS License & Resource Governance
                    </h1>
                    <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                      Organization: <span className="font-semibold text-white">{activeCompany.name}</span> ({activeCompany.subdomain}.digisailhrm.com) • Current plan entitles your organization to dedicated multi-tenant isolation, real-time quota gates, and automated invoice tracking.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setTargetUpgradeTier(
                          (subscriptionDetails?.subscription?.tier === "ENTERPRISE"
                            ? "GROWTH"
                            : "ENTERPRISE") as SubscriptionTier
                        );
                        setShowUpgradeModal(true);
                      }}
                      className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-200" />
                      Elevate Plan / Modify Seats
                    </button>
                  </div>
                </div>
              </div>

              {/* Resource Quota KPIs Grid */}
              {(() => {
                const sub = subscriptionDetails?.subscription;
                const quotas = subscriptionDetails?.quotas;
                const tier = sub?.tier || (activeCompany.plan === "PROFESSIONAL" ? "GROWTH" : activeCompany.plan) || "GROWTH";
                const maxSeats = quotas?.maxSeats ?? (tier === "ENTERPRISE" ? 9999 : tier === "GROWTH" ? 100 : 25);
                const seatsUsed = quotas?.seatsUsed ?? employees.length;
                const seatUtilPct = quotas?.seatUtilizationPct ?? (maxSeats > 0 ? Math.min(100, Math.round((seatsUsed / maxSeats) * 100)) : 0);
                const seatsRemaining = quotas?.seatsRemaining ?? Math.max(0, maxSeats - seatsUsed);

                const maxBranches = quotas?.maxBranches ?? (tier === "ENTERPRISE" ? 999 : tier === "GROWTH" ? 10 : 2);
                const branchesUsed = quotas?.branchesUsed ?? branches.length;
                const branchesRemaining = quotas?.branchesRemaining ?? Math.max(0, maxBranches - branchesUsed);
                const branchUtilPct = maxBranches > 0 ? Math.min(100, Math.round((branchesUsed / maxBranches) * 100)) : 0;

                const monthlyPrice = sub?.monthlyPrice ?? (tier === "ENTERPRISE" ? 1999 : tier === "GROWTH" ? 799 : 299);
                const renewalDateStr = sub?.currentPeriodEnd
                  ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "Nov 1, 2026";

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* KPI 1: Employee Seats */}
                    <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-400 uppercase font-medium">Employee Seats</p>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              seatUtilPct > 90
                                ? "bg-rose-500/20 text-rose-300"
                                : seatUtilPct > 70
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-emerald-500/20 text-emerald-300"
                            }`}
                          >
                            {seatUtilPct}% Used
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2 mt-2">
                          <p className="text-2xl font-bold text-white font-mono">{seatsUsed}</p>
                          <span className="text-xs text-slate-400">/ {maxSeats === 9999 ? "∞ Unlimited" : maxSeats} seats</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-slate-800 rounded-full mt-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              seatUtilPct > 90 ? "bg-rose-500" : seatUtilPct > 70 ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(100, Math.max(5, seatUtilPct))}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800/60">
                        {seatsRemaining > 0
                          ? `✓ ${seatsRemaining} seat slots available before cap`
                          : "⚠️ License ceiling reached; upgrade to onboard more"}
                      </p>
                    </div>

                    {/* KPI 2: Branch Quota */}
                    <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-400 uppercase font-medium">Branch Locations</p>
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-indigo-500/20 text-indigo-300">
                            {branchUtilPct}% Used
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2 mt-2">
                          <p className="text-2xl font-bold text-white font-mono">{branchesUsed}</p>
                          <span className="text-xs text-slate-400">/ {maxBranches === 999 ? "∞ Unlimited" : maxBranches} branches</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full mt-3 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(10, branchUtilPct))}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-indigo-400 mt-3 pt-2 border-t border-slate-800/60">
                        📍 {branchesRemaining > 0 ? `${branchesRemaining} branch slots remaining` : "All branch quotas allocated"}
                      </p>
                    </div>

                    {/* KPI 3: Monthly Billing Rate */}
                    <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-400 uppercase font-medium">Monthly Rate</p>
                          <CreditCard className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="flex items-baseline gap-1 mt-2">
                          <p className="text-2xl font-bold text-emerald-400 font-mono">${monthlyPrice.toLocaleString()}</p>
                          <span className="text-xs text-slate-400">/ month</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-2">
                          Auto-renews on <span className="font-semibold text-white">{renewalDateStr}</span>
                        </p>
                      </div>
                      <p className="text-[11px] text-emerald-400/90 mt-3 pt-2 border-t border-slate-800/60 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Card •••• 4242 active on file
                      </p>
                    </div>

                    {/* KPI 4: SLA & Security */}
                    <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-400 uppercase font-medium">Service Level SLA</p>
                          <ShieldCheck className="w-4 h-4 text-cyan-400" />
                        </div>
                        <p className="text-2xl font-bold text-cyan-400 mt-2">
                          {tier === "ENTERPRISE" ? "99.99%" : tier === "GROWTH" ? "99.9%" : "Standard"}
                        </p>
                        <p className="text-xs text-slate-300 mt-1">Guaranteed Serverless Uptime</p>
                      </div>
                      <p className="text-[11px] text-cyan-400/90 mt-3 pt-2 border-t border-slate-800/60">
                        🛡️ ISO-Ready Audit Trails & Neon Isolation
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Plan Comparison & Elevation Matrix */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Subscription Tier Plans & Feature Entitlements
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Switch plans instantly with zero downtime. Quotas update immediately upon plan modification.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-400">30-Day Money Back Guarantee</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* TIER 1: STARTER */}
                  {(() => {
                    const currentPlanTier = subscriptionDetails?.subscription?.tier || (activeCompany.plan === "PROFESSIONAL" ? "GROWTH" : activeCompany.plan) || "GROWTH";
                    const isCurrent = currentPlanTier === "STARTER";
                    return (
                      <div
                        className={`rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                          isCurrent
                            ? "bg-slate-900 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/40"
                            : "bg-slate-900/70 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              STARTER
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                                Current Plan
                              </span>
                            )}
                          </div>
                          <div className="mt-4 flex items-baseline gap-1">
                            <span className="text-3xl font-extrabold text-white font-mono">$299</span>
                            <span className="text-xs text-slate-400 font-medium">/ month</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-2">
                            Essential HR operations and attendance logging for growing startups.
                          </p>

                          <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2.5 text-xs">
                            <div className="flex items-center gap-2 text-slate-200">
                              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span><strong>Up to 25</strong> Employee Seats</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-200">
                              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span><strong>Up to 2</strong> Branch Locations</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-200">
                              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>Core HR Directory & Org Hierarchy</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-200">
                              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>Attendance Punch & Late Tracking</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-200">
                              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>Leave Allocations & Requests</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 line-through">
                              <span className="w-4 h-4 shrink-0 flex items-center justify-center font-bold">✕</span>
                              <span>Multi-Tier Payroll & Payslips Engine</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 line-through">
                              <span className="w-4 h-4 shrink-0 flex items-center justify-center font-bold">✕</span>
                              <span>Billable Projects & Timesheets</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 line-through">
                              <span className="w-4 h-4 shrink-0 flex items-center justify-center font-bold">✕</span>
                              <span>Custom SLA & Dedicated Support</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-8 pt-4 border-t border-slate-800/80">
                          <button
                            disabled={isCurrent || isUpgradingPlan}
                            onClick={() => {
                              setTargetUpgradeTier("STARTER");
                              setShowUpgradeModal(true);
                            }}
                            className={`w-full py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                              isCurrent
                                ? "bg-slate-800/60 text-slate-400 cursor-default"
                                : "bg-slate-800 hover:bg-slate-700 text-white"
                            }`}
                          >
                            {isCurrent ? "✓ Active Plan" : "Switch to Starter ($299/mo)"}
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* TIER 2: GROWTH (POPULAR) */}
                  {(() => {
                    const currentPlanTier = subscriptionDetails?.subscription?.tier || (activeCompany.plan === "PROFESSIONAL" ? "GROWTH" : activeCompany.plan) || "GROWTH";
                    const isCurrent = currentPlanTier === "GROWTH";
                    return (
                      <div
                        className={`rounded-2xl border p-6 flex flex-col justify-between transition-all relative ${
                          isCurrent
                            ? "bg-slate-900 border-indigo-500 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/40"
                            : "bg-slate-900/70 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="absolute -top-3 right-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full shadow">
                          MOST POPULAR
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              GROWTH
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500 text-white">
                                Current Plan
                              </span>
                            )}
                          </div>
                          <div className="mt-4 flex items-baseline gap-1">
                            <span className="text-3xl font-extrabold text-white font-mono">$799</span>
                            <span className="text-xs text-slate-400 font-medium">/ month</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-2">
                            Comprehensive workforce operations with full payroll engine and billable project timesheets.
                          </p>

                          <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2.5 text-xs">
                            <div className="flex items-center gap-2 text-slate-200">
                              <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                              <span><strong>Up to 100</strong> Employee Seats</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-200">
                              <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                              <span><strong>Up to 10</strong> Global Branches</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-200">
                              <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                              <span>Core HR, Attendance & Leaves</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-200">
                              <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                              <span><strong>Full Multi-Tier Payroll Engine</strong> & Payslips</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-200">
                              <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                              <span><strong>Billable Projects, Tasks & Timesheets</strong></span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-200">
                              <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                              <span>Role-Scoped Manager Approval Queues</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-200">
                              <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                              <span>Statutory Tax & 401(k) Auto-Deductions</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 line-through">
                              <span className="w-4 h-4 shrink-0 flex items-center justify-center font-bold">✕</span>
                              <span>Dedicated Custom SLA & Executive Audits</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-8 pt-4 border-t border-slate-800/80">
                          <button
                            disabled={isCurrent || isUpgradingPlan}
                            onClick={() => {
                              setTargetUpgradeTier("GROWTH");
                              setShowUpgradeModal(true);
                            }}
                            className={`w-full py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                              isCurrent
                                ? "bg-slate-800/60 text-slate-400 cursor-default"
                                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                            }`}
                          >
                            {isCurrent ? "✓ Active Plan" : "Upgrade to Growth ($799/mo)"}
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* TIER 3: ENTERPRISE */}
                  {(() => {
                    const currentPlanTier = subscriptionDetails?.subscription?.tier || (activeCompany.plan === "PROFESSIONAL" ? "GROWTH" : activeCompany.plan) || "GROWTH";
                    const isCurrent = currentPlanTier === "ENTERPRISE";
                    return (
                      <div
                        className={`rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                          isCurrent
                            ? "bg-slate-900 border-purple-500 shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/40"
                            : "bg-slate-900/70 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              ENTERPRISE
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500 text-white">
                                Current Plan
                              </span>
                            )}
                          </div>
                          <div className="mt-4 flex items-baseline gap-1">
                            <span className="text-3xl font-extrabold text-white font-mono">$1,999</span>
                            <span className="text-xs text-slate-400 font-medium">/ month</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-2">
                            Maximum scale for multinational enterprises requiring unlimited seats, branches, and custom SLAs.
                          </p>

                          <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2.5 text-xs">
                            <div className="flex items-center gap-2 text-slate-200">
                              <Check className="w-4 h-4 text-purple-400 shrink-0" />
                              <span><strong>Unlimited Employee Seats</strong> (9,999+ seats)</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-200">
                              <Check className="w-4 h-4 text-purple-400 shrink-0" />
                              <span><strong>Unlimited Global Branches</strong> & Regional Hubs</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-200">
                              <Check className="w-4 h-4 text-purple-400 shrink-0" />
                              <span><strong>2-Stage State Machine</strong> Onboarding Approval</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-200">
                              <Check className="w-4 h-4 text-purple-400 shrink-0" />
                              <span>Complete Payroll, Payslips & Tax Engine</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-200">
                              <Check className="w-4 h-4 text-purple-400 shrink-0" />
                              <span>Client Engagements & Timesheet Verification</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-200">
                              <Check className="w-4 h-4 text-purple-400 shrink-0" />
                              <span><strong>Immutable Audit Trail</strong> & Quality Ledger</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-200">
                              <Check className="w-4 h-4 text-purple-400 shrink-0" />
                              <span><strong>99.99% Uptime SLA</strong> & Priority 24/7 Support</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-200">
                              <Check className="w-4 h-4 text-purple-400 shrink-0" />
                              <span>Dedicated Account Architect & Custom Integrations</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-8 pt-4 border-t border-slate-800/80">
                          <button
                            disabled={isCurrent || isUpgradingPlan}
                            onClick={() => {
                              setTargetUpgradeTier("ENTERPRISE");
                              setShowUpgradeModal(true);
                            }}
                            className={`w-full py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                              isCurrent
                                ? "bg-slate-800/60 text-slate-400 cursor-default"
                                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30"
                            }`}
                          >
                            {isCurrent ? "✓ Active Plan" : "Upgrade to Enterprise ($1,999/mo)"}
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Invoices & Billing History Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-emerald-400" />
                      Invoice Statements & Payment History
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Download tax receipts and audit records for monthly subscription debits.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="py-3.5 px-4 font-semibold">Invoice Number</th>
                          <th className="py-3.5 px-4 font-semibold">Billing Date</th>
                          <th className="py-3.5 px-4 font-semibold">Plan Description</th>
                          <th className="py-3.5 px-4 font-semibold">Seats Billed</th>
                          <th className="py-3.5 px-4 font-semibold">Amount</th>
                          <th className="py-3.5 px-4 font-semibold text-center">Payment Status</th>
                          <th className="py-3.5 px-4 font-semibold text-right">Receipt Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {(!subscriptionDetails?.invoices || subscriptionDetails.invoices.length === 0) ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                              No billing statements recorded yet for this organization.
                            </td>
                          </tr>
                        ) : (
                          subscriptionDetails.invoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                              <td className="py-3.5 px-4 font-mono font-semibold text-white">
                                <div className="flex items-center gap-2">
                                  <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>{inv.invoiceNumber}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-slate-300">
                                {inv.billingDate}
                              </td>
                              <td className="py-3.5 px-4 font-medium text-slate-200">
                                {inv.planName}
                              </td>
                              <td className="py-3.5 px-4 text-slate-400">
                                {inv.seatsBilled} seats licensed
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-white text-sm">
                                ${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {inv.currency}
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                                  <Check className="w-2.5 h-2.5" />
                                  {inv.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  onClick={() => setSelectedInvoiceForReceipt(inv)}
                                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition cursor-pointer flex items-center gap-1.5 ml-auto"
                                >
                                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                                  View Statement
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Billing Contact & Payment Method Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    Payment Method On File
                  </h4>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
                    <div className="w-10 h-7 rounded bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-xs text-white">
                      VISA
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Visa ending in •••• 4242</p>
                      <p className="text-[11px] text-slate-400">Expires 12/2028 • Default Payment Method</p>
                    </div>
                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                      Verified
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-400" />
                    Primary Billing Contact
                  </h4>
                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-1 text-xs">
                    <p className="text-white font-medium">{activeCompany.adminName} (Company HR Director)</p>
                    <p className="text-slate-400">{activeCompany.adminEmail}</p>
                    <p className="text-[11px] text-slate-500 pt-1">
                      Billing receipts are automatically dispatched upon monthly settlement.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: AI WORKFORCE INTELLIGENCE & ANALYTICS (PHASE 10) */}
          {activeTab === "ai-insights" &&
            ["SUPER_ADMIN", "COMPANY_ADMIN", "BRANCH_ADMIN", "DEPARTMENT_ADMIN"].includes(currentRole) && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Hero Banner */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-slate-900 border border-purple-500/30 p-6 shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5 shadow-sm">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        Neural Predictive Model v2.4 (Active)
                      </span>
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        Live Workforce Telemetry
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                      <span>AI Workforce Insights & Predictive Analytics</span>
                      <Brain className="w-7 h-7 text-purple-400" />
                    </h2>
                    <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                      Deep learning attrition radar, automated performance review synthesis, and forward-looking headcount & payroll budget forecasting.
                    </p>
                  </div>

                  {/* Sub-Tab Navigation Pills */}
                  <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 self-start lg:self-center shadow-inner">
                    <button
                      onClick={() => setAiSubTab("attrition")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                        aiSubTab === "attrition"
                          ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5 text-rose-400" />
                      <span>Attrition Radar</span>
                    </button>
                    <button
                      onClick={() => setAiSubTab("reviews")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                        aiSubTab === "reviews"
                          ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Review Synthesizer</span>
                    </button>
                    <button
                      onClick={() => setAiSubTab("forecast")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                        aiSubTab === "forecast"
                          ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      <LineChart className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Budget Forecaster</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ============================================================== */}
              {/* SUB-TAB 1: ATTRITION & WORKFORCE HEALTH RADAR */}
              {/* ============================================================== */}
              {aiSubTab === "attrition" && (
                <div className="space-y-6">
                  {/* 4 Hero KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md">
                      <div className="flex items-center justify-between text-slate-400 text-xs mb-2 font-medium">
                        <span>Company Attrition Risk</span>
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                          <Activity className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold font-mono text-white">
                          {aiOverview?.kpis.overallCompanyRiskScore ?? 16}%
                        </span>
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          Stable Band
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${aiOverview?.kpis.overallCompanyRiskScore ?? 16}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2">
                        Trailing 90-day predictive flight probability
                      </p>
                    </div>

                    <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md">
                      <div className="flex items-center justify-between text-slate-400 text-xs mb-2 font-medium">
                        <span>High-Risk Flight Targets</span>
                        <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                          <Flame className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold font-mono text-white">
                          {aiOverview?.kpis.highRiskEmployeeCount ?? 0}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">
                          / {employees.length} personnel
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.round(((aiOverview?.kpis.highRiskEmployeeCount ?? 0) / Math.max(1, employees.length)) * 100)}%`,
                          }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2">
                        Urgent retention check-in candidates
                      </p>
                    </div>

                    <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md">
                      <div className="flex items-center justify-between text-slate-400 text-xs mb-2 font-medium">
                        <span>Workload Burnout Index</span>
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                          <Clock className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold font-mono text-white">
                          {aiOverview?.kpis.burnoutIndexPct ?? 14}%
                        </span>
                        <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          Moderate Load
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${aiOverview?.kpis.burnoutIndexPct ?? 14}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2">
                        Sustained overtime & unclosed shifts
                      </p>
                    </div>

                    <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md">
                      <div className="flex items-center justify-between text-slate-400 text-xs mb-2 font-medium">
                        <span>Retention Value At Risk</span>
                        <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                          <DollarSign className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold font-mono text-white">
                          ${(aiOverview?.kpis.estimatedRetentionSavings ?? 45000).toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className="bg-purple-500 h-full rounded-full" style={{ width: "35%" }} />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2">
                        Replacement & recruitment cost savings
                      </p>
                    </div>
                  </div>

                  {/* Departmental Attrition Heatmap */}
                  <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-md space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <Activity className="w-4 h-4 text-purple-400" />
                          Departmental Risk Distribution & Drivers
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Cross-functional burnout index, compensation competitiveness, and career mobility metrics.
                        </p>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {aiOverview?.departmentHeatmap.length ?? 0} Active Departments
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                      {(aiOverview?.departmentHeatmap && aiOverview.departmentHeatmap.length > 0
                        ? aiOverview.departmentHeatmap
                        : [
                            {
                              department: "Engineering",
                              employeeCount: 4,
                              averageRiskScore: 28,
                              highRiskCount: 1,
                              mediumRiskCount: 1,
                              lowRiskCount: 2,
                              primaryDriver: "Overtime Sprint Load & Market Salary Gap",
                            },
                            {
                              department: "Human Resources",
                              employeeCount: 2,
                              averageRiskScore: 14,
                              highRiskCount: 0,
                              mediumRiskCount: 0,
                              lowRiskCount: 2,
                              primaryDriver: "Balanced Utilization & High Retention",
                            },
                          ]
                      ).map((dept) => {
                        const isHigh = dept.averageRiskScore >= 50;
                        const isMed = dept.averageRiskScore >= 25;
                        const badgeColor = isHigh
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                          : isMed
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";

                        const barColor = isHigh ? "bg-rose-500" : isMed ? "bg-amber-500" : "bg-emerald-500";

                        return (
                          <div
                            key={dept.department}
                            className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3 hover:border-purple-500/40 transition"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-white">{dept.department}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${badgeColor}`}>
                                {dept.averageRiskScore}% Risk
                              </span>
                            </div>

                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className={`${barColor} h-full rounded-full transition-all duration-500`}
                                style={{ width: `${dept.averageRiskScore}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                              <span>Staff Enrolled:</span>
                              <span className="text-white font-medium">{dept.employeeCount} employees</span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                              <span className="text-rose-400 font-bold">{dept.highRiskCount} High</span>
                              <span>•</span>
                              <span className="text-amber-400 font-bold">{dept.mediumRiskCount} Med</span>
                              <span>•</span>
                              <span className="text-emerald-400 font-bold">{dept.lowRiskCount} Low</span>
                            </div>

                            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 truncate">
                              <strong>Primary Driver:</strong> {dept.primaryDriver}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Flight Risk Radar Personnel Table */}
                  <div className="bg-slate-900/80 rounded-2xl border border-slate-800 shadow-md overflow-hidden">
                    <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <Target className="w-4 h-4 text-purple-400" />
                          Workforce Flight Risk Radar & Proactive Interventions
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Personnel ranked by quantitative retention risk score with individualized action plans.
                        </p>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold self-start sm:self-auto">
                        Neural Scan Active
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-800/60 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
                          <tr>
                            <th className="py-3.5 px-4">Employee</th>
                            <th className="py-3.5 px-4">Department & Role</th>
                            <th className="py-3.5 px-4 text-center">Risk Score</th>
                            <th className="py-3.5 px-4">Overtime / PTO</th>
                            <th className="py-3.5 px-4">Primary Risk Drivers</th>
                            <th className="py-3.5 px-4 text-right">Intervention</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {(aiOverview?.highRiskEmployees && aiOverview.highRiskEmployees.length > 0
                            ? aiOverview.highRiskEmployees
                            : employees.slice(0, 5).map((e, idx) => ({
                                id: `attr-${e.id}`,
                                employeeId: e.id,
                                employeeNumber: e.employeeNumber,
                                employeeName: `${e.firstName} ${e.lastName}`,
                                avatarUrl: e.avatarUrl,
                                department: e.department,
                                designation: e.designation,
                                branch: e.branch,
                                riskScore: idx === 0 ? 68 : idx === 1 ? 48 : 22,
                                riskLevel: (idx === 0 ? "HIGH" : idx === 1 ? "MEDIUM" : "LOW") as AttritionRiskLevel,
                                overtimeHours: idx === 0 ? 18.5 : 4.0,
                                leaveUtilizationPct: idx === 0 ? 8 : 45,
                                salaryPercentile: idx === 0 ? 25 : 60,
                                tenureMonths: 22,
                                primaryFactors:
                                  idx === 0
                                    ? [
                                        "Sustained Overtime (18.5 hrs logged)",
                                        "Compensation in bottom 25th percentile",
                                        "22-Month Career Plateau Window",
                                      ]
                                    : ["Stable workload, balanced PTO utilization"],
                                recommendations: [
                                  "Schedule 1-on-1 retention dialogue",
                                  "Review market rate compensation parity",
                                ],
                                calculatedAt: new Date().toISOString(),
                              }))
                          ).map((item) => {
                            const isHigh = item.riskLevel === "HIGH";
                            const isMed = item.riskLevel === "MEDIUM";
                            const badgeClass = isHigh
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                              : isMed
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";

                            return (
                              <tr key={item.id} className="hover:bg-slate-800/40 transition">
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={item.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                                      alt={item.employeeName}
                                      className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700 shrink-0"
                                    />
                                    <div>
                                      <span className="font-bold text-white block">{item.employeeName}</span>
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        {item.employeeNumber}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="font-medium text-slate-200 block">{item.designation}</span>
                                  <span className="text-[11px] text-slate-400">{item.department}</span>
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-xs border ${badgeClass}`}>
                                    {isHigh && <Flame className="w-3 h-3 text-rose-400" />}
                                    {item.riskScore}% {item.riskLevel}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                                  <div>+{item.overtimeHours}h OT</div>
                                  <div className="text-slate-500">{item.leaveUtilizationPct}% PTO taken</div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="flex flex-wrap gap-1 max-w-xs">
                                    {item.primaryFactors.slice(0, 2).map((factor, i) => (
                                      <span
                                        key={i}
                                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60"
                                      >
                                        {factor}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <button
                                    onClick={() => {
                                      setSelectedRetentionCandidate(item);
                                      setShowRetentionStrategyModal(true);
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ml-auto"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                                    Retention Plan
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* SUB-TAB 2: AI PERFORMANCE REVIEW SYNTHESIZER */}
              {/* ============================================================== */}
              {aiSubTab === "reviews" && (
                <div className="space-y-6">
                  {/* Synthesis Action Console */}
                  <div className="bg-slate-900/90 p-6 rounded-2xl border border-indigo-500/40 shadow-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-400" />
                          Automated Performance Review & Appraisal Generator
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Synthesize deep objective performance evaluations based on verified billable hours, project milestones, and attendance compliance.
                        </p>
                      </div>
                      <span className="text-xs text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/30 font-bold self-start sm:self-auto">
                        Generative AI Engine
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="block text-slate-400 text-xs mb-1 font-medium">Select Employee *</label>
                        <select
                          value={selectedReviewEmployeeId}
                          onChange={(e) => setSelectedReviewEmployeeId(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                        >
                          <option value="">-- Choose Employee --</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.firstName} {emp.lastName} ({emp.designation})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 text-xs mb-1 font-medium">Evaluation Cycle *</label>
                        <select
                          value={selectedReviewPeriod}
                          onChange={(e) => setSelectedReviewPeriod(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                        >
                          <option value="2026-Q3">2026 Q3 Evaluation</option>
                          <option value="2026-Q4">2026 Q4 Evaluation</option>
                          <option value="2026-Annual">2026 Annual Performance Review</option>
                          <option value="2026-MidYear">2026 Mid-Year Milestone</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          disabled={isSynthesizingReview || !selectedReviewEmployeeId}
                          onClick={handleSynthesizeReview}
                          className="w-full flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 cursor-pointer transition disabled:opacity-50"
                        >
                          {isSynthesizingReview ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Analyzing Metrics & Synthesizing...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              <span>Synthesize Review with AI</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Generated Review Display Card */}
                  {currentSynthesizedReview && (
                    <div className="bg-slate-900 border border-purple-500/50 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300 space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={currentSynthesizedReview.avatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"}
                            alt={currentSynthesizedReview.employeeName}
                            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-purple-500/50"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold text-white">
                                {currentSynthesizedReview.employeeName}
                              </h3>
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                {currentSynthesizedReview.period}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {currentSynthesizedReview.designation} • {currentSynthesizedReview.department}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-start sm:self-auto">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                              Performance Rating
                            </span>
                            <span className="text-sm font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 inline-block mt-0.5">
                              ★ {currentSynthesizedReview.rating.replace("_", " ")}
                            </span>
                          </div>
                          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex flex-col items-center justify-center font-bold text-purple-300">
                            <span className="text-sm leading-none font-mono">{currentSynthesizedReview.metricsScore}</span>
                            <span className="text-[9px] text-slate-400">/ 100</span>
                          </div>
                        </div>
                      </div>

                      {/* Executive Summary */}
                      <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2">
                        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          Executive Performance Synthesis
                        </h4>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          {currentSynthesizedReview.summary}
                        </p>
                      </div>

                      {/* Strengths & Growth Areas Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-800 space-y-3">
                          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Core Strengths & Competencies
                          </h4>
                          <ul className="space-y-2 text-xs text-slate-300">
                            {currentSynthesizedReview.strengths.map((str, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                                <span>{str}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-800 space-y-3">
                          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5 text-amber-400" />
                            Developmental Growth Areas
                          </h4>
                          <ul className="space-y-2 text-xs text-slate-300">
                            {currentSynthesizedReview.growthAreas.map((ga, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-amber-400 font-bold shrink-0">→</span>
                                <span>{ga}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Strategic Goals */}
                      <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-800 space-y-3">
                        <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-cyan-400" />
                          Key Performance Objectives for Next Cycle
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {currentSynthesizedReview.goals.map((g, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 flex items-start gap-2">
                              <span className="font-mono text-cyan-400 font-bold">0{idx + 1}.</span>
                              <span>{g}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-800">
                        <button
                          onClick={() => {
                            setSelectedReviewForPrint(currentSynthesizedReview);
                            setShowPrintReviewModal(true);
                          }}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-indigo-400" />
                          Preview & Print Appraisal
                        </button>

                        <button
                          disabled={isPublishingReview}
                          onClick={handlePublishReview}
                          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 cursor-pointer transition disabled:opacity-50"
                        >
                          {isPublishingReview ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Publishing to HR Ledger...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Publish Review to Official Ledger</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Published Performance Reviews Archive Table */}
                  <div className="bg-slate-900/80 rounded-2xl border border-slate-800 shadow-md overflow-hidden">
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <Award className="w-4 h-4 text-purple-400" />
                          Published Performance Appraisals & Evaluations
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Archived performance review statements with formal reviewer sign-offs.
                        </p>
                      </div>
                      <span className="text-xs font-mono text-slate-400">
                        {performanceReviewsList.length} Evaluations Recorded
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-800/60 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
                          <tr>
                            <th className="py-3.5 px-4">Employee</th>
                            <th className="py-3.5 px-4">Cycle Period</th>
                            <th className="py-3.5 px-4 text-center">Score</th>
                            <th className="py-3.5 px-4">Evaluation Rating</th>
                            <th className="py-3.5 px-4">Reviewer</th>
                            <th className="py-3.5 px-4 text-right">Appraisal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {performanceReviewsList.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-500">
                                No formal performance appraisals recorded yet. Use the synthesizer above to generate the first review.
                              </td>
                            </tr>
                          ) : (
                            performanceReviewsList.map((rev) => (
                              <tr key={rev.id} className="hover:bg-slate-800/40 transition">
                                <td className="py-3.5 px-4 font-bold text-white">
                                  {rev.employeeName}
                                  <span className="block text-[10px] text-slate-400 font-normal">
                                    {rev.designation} • {rev.department}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 font-medium text-slate-300">
                                  {rev.period}
                                </td>
                                <td className="py-3.5 px-4 text-center font-mono font-bold text-purple-400">
                                  {rev.metricsScore}/100
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    {rev.rating.replace("_", " ")}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                                  {rev.reviewerName || "Manager"}
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <button
                                    onClick={() => {
                                      setSelectedReviewForPrint(rev);
                                      setShowPrintReviewModal(true);
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer flex items-center gap-1.5 ml-auto"
                                  >
                                    <Printer className="w-3.5 h-3.5 text-emerald-400" />
                                    View Appraisal
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* SUB-TAB 3: HEADCOUNT & BUDGET FORECASTER */}
              {/* ============================================================== */}
              {aiSubTab === "forecast" && (
                <div className="space-y-6">
                  {/* Scenario Configuration Controls */}
                  <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <LineChart className="w-4 h-4 text-emerald-400" />
                        Executive Headcount & Payroll Expenditure Model
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Forward 12-month projections factoring in planned hiring velocities, merit adjustments, and benefits burden.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-800/80 border border-slate-700">
                      {[
                        { id: "CONSERVATIVE", label: "Conservative (+5%)", merit: "3.0% Merit" },
                        { id: "BASELINE", label: "Baseline (+14%)", merit: "5.0% Merit" },
                        { id: "AGGRESSIVE", label: "Aggressive (+28%)", merit: "7.5% Merit" },
                      ].map((sc) => (
                        <button
                          key={sc.id}
                          onClick={() => handleChangeForecastScenario(sc.id as any)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            selectedForecastScenario === sc.id
                              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {sc.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4 Forward Projection Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md">
                      <span className="text-slate-400 text-xs font-medium block mb-1">
                        6-Month Projected Headcount
                      </span>
                      <div className="text-3xl font-extrabold font-mono text-white">
                        {aiOverview?.forecast?.sixMonthProjectedHeadcount ?? 9}
                      </div>
                      <span className="text-[11px] font-bold text-emerald-400 mt-2 block">
                        +{((aiOverview?.forecast?.sixMonthProjectedHeadcount ?? 9) - Math.max(employees.length, 7))} net headcount expansion
                      </span>
                    </div>

                    <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md">
                      <span className="text-slate-400 text-xs font-medium block mb-1">
                        12-Month Projected Headcount
                      </span>
                      <div className="text-3xl font-extrabold font-mono text-white">
                        {aiOverview?.forecast?.twelveMonthProjectedHeadcount ?? 11}
                      </div>
                      <span className="text-[11px] font-bold text-emerald-400 mt-2 block">
                        +{aiOverview?.forecast?.hiringGrowthRate ?? 14}% annual expansion rate
                      </span>
                    </div>

                    <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md">
                      <span className="text-slate-400 text-xs font-medium block mb-1">
                        6-Month Total Payroll Budget
                      </span>
                      <div className="text-2xl font-extrabold font-mono text-white">
                        ${(aiOverview?.forecast?.sixMonthProjectedPayroll ?? 532260).toLocaleString()}
                      </div>
                      <span className="text-[11px] text-slate-400 mt-2 block">
                        Includes base + benefits + statutory tax
                      </span>
                    </div>

                    <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md">
                      <span className="text-slate-400 text-xs font-medium block mb-1">
                        12-Month Total Payroll Budget
                      </span>
                      <div className="text-2xl font-extrabold font-mono text-white">
                        ${(aiOverview?.forecast?.twelveMonthProjectedPayroll ?? 1193007).toLocaleString()}
                      </div>
                      <span className="text-[11px] text-purple-400 font-bold mt-2 block">
                        +{aiOverview?.forecast?.annualMeritIncrease ?? 5.0}% merit adjustment factor
                      </span>
                    </div>
                  </div>

                  {/* 12-Month Trajectory Table */}
                  <div className="bg-slate-900/80 rounded-2xl border border-slate-800 shadow-md overflow-hidden">
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                          12-Month Predictive Monthly Trajectory & Cash Outflow
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Calculated line-item distribution of employer financial liabilities.
                        </p>
                      </div>
                      <span className="text-xs font-mono text-emerald-400 font-bold">
                        Scenario: {selectedForecastScenario}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-800/60 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
                          <tr>
                            <th className="py-3.5 px-4">Period</th>
                            <th className="py-3.5 px-4 text-center">Headcount</th>
                            <th className="py-3.5 px-4 text-center">Additions / Departures</th>
                            <th className="py-3.5 px-4 font-mono">Base Salaries</th>
                            <th className="py-3.5 px-4 font-mono">Benefits (15%)</th>
                            <th className="py-3.5 px-4 font-mono">Payroll Tax (13.5%)</th>
                            <th className="py-3.5 px-4 text-right font-mono">Total Expenditure</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {(aiOverview?.forecast?.projections && aiOverview.forecast.projections.length > 0
                            ? aiOverview.forecast.projections
                            : [
                                {
                                  month: "Nov 2026",
                                  headcount: 8,
                                  hiringAdditions: 1,
                                  projectedDepartures: 0,
                                  basePayroll: 63333,
                                  benefitsCost: 9500,
                                  taxesCost: 8550,
                                  totalExpenditure: 81383,
                                },
                                {
                                  month: "Dec 2026",
                                  headcount: 8,
                                  hiringAdditions: 0,
                                  projectedDepartures: 0,
                                  basePayroll: 63600,
                                  benefitsCost: 9540,
                                  taxesCost: 8586,
                                  totalExpenditure: 81726,
                                },
                              ]
                          ).map((p, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/40 transition">
                              <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                {p.month}
                              </td>
                              <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-200">
                                {p.headcount}
                              </td>
                              <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                                <span className="text-emerald-400">+{p.hiringAdditions}</span>
                                {p.projectedDepartures > 0 && (
                                  <span className="text-rose-400 ml-1">-{p.projectedDepartures}</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-slate-300">
                                ${p.basePayroll.toLocaleString()}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-slate-400">
                                ${p.benefitsCost.toLocaleString()}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-slate-400">
                                ${p.taxesCost.toLocaleString()}
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono font-bold text-white text-sm">
                                ${p.totalExpenditure.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Expenditure Breakdown Composition Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase">Direct Base Compensation</span>
                        <span className="text-xs font-bold text-emerald-400">71.5%</span>
                      </div>
                      <div className="text-xl font-bold font-mono text-white">Direct Wages</div>
                      <p className="text-[11px] text-slate-400">
                        Monthly base salary disbursements across all departmental cost centers.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase">Healthcare & 401(k) Burden</span>
                        <span className="text-xs font-bold text-cyan-400">15.0%</span>
                      </div>
                      <div className="text-xl font-bold font-mono text-white">Employee Benefits</div>
                      <p className="text-[11px] text-slate-400">
                        Comprehensive health plan subsidies, employer matching 401(k), and life insurance.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase">Statutory Payroll Taxes</span>
                        <span className="text-xs font-bold text-purple-400">13.5%</span>
                      </div>
                      <div className="text-xl font-bold font-mono text-white">Tax Liabilities</div>
                      <p className="text-[11px] text-slate-400">
                        FICA, Medicare, state unemployment, and regional payroll tax compliance withholdings.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* MODAL: ONBOARD NEW COMPANY (SUPER ADMIN ONLY) */}
      {showCreateCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-purple-400" />
                  Onboard New SaaS Tenant Company
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Provisions an isolated tenant space and assigns the primary Company HR Admin.
                </p>
              </div>
              <button
                onClick={() => setShowCreateCompanyModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-3 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    placeholder="e.g. Acme Corporation"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Legal Name</label>
                  <input
                    type="text"
                    value={newCompany.legalName}
                    onChange={(e) => setNewCompany({ ...newCompany, legalName: e.target.value })}
                    placeholder="e.g. Acme Worldwide Ltd."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Tenant Subdomain *</label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      required
                      value={newCompany.subdomain}
                      onChange={(e) => setNewCompany({ ...newCompany, subdomain: e.target.value })}
                      placeholder="acme"
                      className="w-full bg-slate-800 border border-slate-700 rounded-l-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                    <span className="bg-slate-800/80 border border-l-0 border-slate-700 text-slate-400 px-2 py-2 text-[10px] rounded-r-xl">
                      .digisailhrm.com
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Subscription Plan</label>
                  <select
                    value={newCompany.plan}
                    onChange={(e) =>
                      setNewCompany({
                        ...newCompany,
                        plan: e.target.value as SubscriptionTier,
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="STARTER">Starter ($299/mo - Up to 25 seats, 2 branches)</option>
                    <option value="GROWTH">Growth ($799/mo - Up to 100 seats, full payroll & projects)</option>
                    <option value="ENTERPRISE">Enterprise ($1,999/mo - Unlimited seats, audit logs, SLA)</option>
                  </select>
                </div>
              </div>

              {/* Initial Branch Settings */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Headquarters Branch Name</label>
                  <input
                    type="text"
                    value={newCompany.branchName}
                    onChange={(e) => setNewCompany({ ...newCompany, branchName: e.target.value })}
                    placeholder="e.g. Headquarters"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Branch Code</label>
                  <input
                    type="text"
                    value={newCompany.branchCode}
                    onChange={(e) => setNewCompany({ ...newCompany, branchCode: e.target.value })}
                    placeholder="e.g. HQ-01"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/40 text-[11px] text-purple-200">
                <span className="font-bold block text-white mb-1">Company HR Admin Credentials:</span>
                This user will receive Company Admin rights in Neon PostgreSQL to establish branches and manage organization quotas.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Company Admin Name *</label>
                  <input
                    type="text"
                    required
                    value={newCompany.adminName}
                    onChange={(e) => setNewCompany({ ...newCompany, adminName: e.target.value })}
                    placeholder="e.g. Johnathan Vance"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Admin Work Email *</label>
                  <input
                    type="email"
                    required
                    value={newCompany.adminEmail}
                    onChange={(e) => setNewCompany({ ...newCompany, adminEmail: e.target.value })}
                    placeholder="johnathan@acme.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Admin Initial Password</label>
                <input
                  type="password"
                  value={newCompany.adminPassword}
                  onChange={(e) => setNewCompany({ ...newCompany, adminPassword: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateCompanyModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-600/30 cursor-pointer"
                >
                  Onboard Tenant Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PROPOSE CANDIDATE (Initiated by Team Lead / Dept Head) */}
      {showProposeCandidateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-400" />
                  Propose New Candidate for Onboarding
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Proposed by: {currentUser.name} ({currentUser.title})
                </p>
              </div>
              <button
                onClick={() => setShowProposeCandidateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProposeCandidate} className="space-y-3 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newCandidate.firstName}
                    onChange={(e) =>
                      setNewCandidate({ ...newCandidate, firstName: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Liam"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newCandidate.lastName}
                    onChange={(e) =>
                      setNewCandidate({ ...newCandidate, lastName: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Miller"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Candidate Email *</label>
                  <input
                    type="email"
                    required
                    value={newCandidate.email}
                    onChange={(e) =>
                      setNewCandidate({ ...newCandidate, email: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="liam.m@digisail.com"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Phone</label>
                  <input
                    type="text"
                    value={newCandidate.phone}
                    onChange={(e) =>
                      setNewCandidate({ ...newCandidate, phone: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Branch</label>
                  <select
                    value={newCandidate.branch}
                    onChange={(e) =>
                      setNewCandidate({ ...newCandidate, branch: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Department</label>
                  <select
                    value={newCandidate.department}
                    onChange={(e) =>
                      setNewCandidate({ ...newCandidate, department: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Team</label>
                  <select
                    value={newCandidate.team}
                    onChange={(e) =>
                      setNewCandidate({ ...newCandidate, team: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Designation</label>
                  <input
                    type="text"
                    value={newCandidate.designation}
                    onChange={(e) =>
                      setNewCandidate({ ...newCandidate, designation: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Base Salary (USD/yr)</label>
                  <input
                    type="number"
                    value={newCandidate.baseSalary}
                    onChange={(e) =>
                      setNewCandidate({ ...newCandidate, baseSalary: Number(e.target.value) })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 text-[11px] text-slate-300">
                ℹ️ When submitted, this candidate will enter state{" "}
                <span className="text-indigo-400 font-bold">PENDING_DEPT_APPROVAL</span> for review by the Department Admin.
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProposeCandidateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30"
                >
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: APPROVAL DECISION MODAL */}
      {approvalModalCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {approvalModalAction === "APPROVE" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400" />
                )}
                {approvalModalAction === "APPROVE"
                  ? approvalModalCandidate.onboardingStatus === "PENDING_DEPT_APPROVAL"
                    ? "Stage 1: Department Approval"
                    : "Stage 2: Final Branch HR Approval & Activation"
                  : "Reject Candidate"}
              </h2>
              <button
                onClick={() => setApprovalModalCandidate(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-800">
                <p className="text-sm font-bold text-white">
                  {approvalModalCandidate.firstName} {approvalModalCandidate.lastName}
                </p>
                <p className="text-xs text-indigo-400">{approvalModalCandidate.designation}</p>
                <p className="text-slate-400 mt-1">
                  Salary:{" "}
                  <span className="text-white font-mono">
                    ${approvalModalCandidate.baseSalary.toLocaleString()}
                  </span>{" "}
                  • Branch: {approvalModalCandidate.branch}
                </p>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Reviewer Comments / Audit Note:
                </label>
                <textarea
                  rows={3}
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  placeholder={
                    approvalModalAction === "APPROVE"
                      ? "e.g. Technical evaluation completed. Compensation verified within approved band."
                      : "e.g. Reason for rejection..."
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-[11px] text-indigo-300">
                Signing as: <span className="font-bold text-white">{currentUser.name}</span> ({currentUser.title})
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setApprovalModalCandidate(null)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteApproval}
                  className={`px-4 py-2 rounded-xl text-white font-semibold shadow-lg ${
                    approvalModalAction === "APPROVE"
                      ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30"
                      : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30"
                  }`}
                >
                  {approvalModalAction === "APPROVE"
                    ? approvalModalCandidate.onboardingStatus === "PENDING_DEPT_APPROVAL"
                      ? "Confirm Dept Approval"
                      : "Activate Employee"
                    : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE BRANCH (Company Admin) */}
      {showCreateBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-indigo-400" />
                Establish New Company Branch
              </h2>
              <button
                onClick={() => setShowCreateBranchModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Tenant Company *</label>
                <select
                  value={newBranch.companyId || selectedCompanyId}
                  onChange={(e) =>
                    setNewBranch({ ...newBranch, companyId: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.subdomain}.digisailhrm.com)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Branch Name *</label>
                <input
                  type="text"
                  required
                  value={newBranch.name}
                  onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  placeholder="e.g. Singapore Innovation Hub"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Branch Code *</label>
                  <input
                    type="text"
                    required
                    value={newBranch.code}
                    onChange={(e) => setNewBranch({ ...newBranch, code: e.target.value })}
                    placeholder="HUB-SGP"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">City</label>
                  <input
                    type="text"
                    value={newBranch.city}
                    onChange={(e) => setNewBranch({ ...newBranch, city: e.target.value })}
                    placeholder="Singapore"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Branch HR Admin Name</label>
                <input
                  type="text"
                  value={newBranch.adminName}
                  onChange={(e) => setNewBranch({ ...newBranch, adminName: e.target.value })}
                  placeholder="e.g. Jessica Tan"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateBranchModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30"
                >
                  Create Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE DEPARTMENT (Branch HR) */}
      {showCreateDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                Create Branch Department
              </h2>
              <button
                onClick={() => setShowCreateDeptModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDept} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Department Name *</label>
                <input
                  type="text"
                  required
                  value={newDept.name}
                  onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                  placeholder="e.g. Quality Assurance & Testing"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Department Code *</label>
                  <input
                    type="text"
                    required
                    value={newDept.code}
                    onChange={(e) => setNewDept({ ...newDept, code: e.target.value })}
                    placeholder="QA"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Branch</label>
                  <select
                    value={newDept.branchName}
                    onChange={(e) => setNewDept({ ...newDept, branchName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Department Admin (Head) Name
                </label>
                <input
                  type="text"
                  value={newDept.adminName}
                  onChange={(e) => setNewDept({ ...newDept, adminName: e.target.value })}
                  placeholder="e.g. Marcus Vance"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateDeptModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-lg shadow-cyan-600/30"
                >
                  Establish Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE TEAM (Dept Admin) */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                Create Department Team
              </h2>
              <button
                onClick={() => setShowCreateTeamModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Team Name *</label>
                <input
                  type="text"
                  required
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  placeholder="e.g. Security & Compliance Squad"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Team Code *</label>
                  <input
                    type="text"
                    required
                    value={newTeam.code}
                    onChange={(e) => setNewTeam({ ...newTeam, code: e.target.value })}
                    placeholder="SEC-TEAM"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Department</label>
                  <select
                    value={newTeam.departmentName}
                    onChange={(e) => setNewTeam({ ...newTeam, departmentName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Assigned Team Lead</label>
                <input
                  type="text"
                  value={newTeam.leadName}
                  onChange={(e) => setNewTeam({ ...newTeam, leadName: e.target.value })}
                  placeholder="e.g. Jordan Bell"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTeamModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30"
                >
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: APPLY FOR TIME OFF (Interactive Quota & Business Day Calculation) */}
      {showApplyLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Apply for Time Off</h2>
                  <p className="text-[10px] text-slate-400">
                    Request planned leave with automated working day verification
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowApplyLeaveModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-4 mt-4 text-xs">
              {/* Category Selector with Quota Badges */}
              <div>
                <label className="block text-slate-400 mb-1.5 font-medium">Leave Category *</label>
                <select
                  required
                  value={newLeaveForm.leaveTypeId}
                  onChange={(e) => setNewLeaveForm({ ...newLeaveForm, leaveTypeId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="">Select a leave category...</option>
                  {availableLeaveTypes.map((lt) => {
                    const bal = leaveBalances.find((b) => b.leaveTypeId === lt.id);
                    const avail = bal ? bal.availableDays : lt.defaultDays;
                    return (
                      <option key={lt.id} value={lt.id}>
                        {lt.name} — ({avail} days remaining)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={newLeaveForm.startDate}
                    onChange={(e) => setNewLeaveForm({ ...newLeaveForm, startDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">End Date *</label>
                  <input
                    type="date"
                    required
                    value={newLeaveForm.endDate}
                    onChange={(e) => setNewLeaveForm({ ...newLeaveForm, endDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Live Working Day Preview */}
              {newLeaveForm.startDate && newLeaveForm.endDate && (
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                  <span className="text-slate-400">Duration (Excluding Weekends):</span>
                  <span className="font-bold text-white text-xs bg-blue-500/20 px-2.5 py-1 rounded-lg border border-blue-500/30 text-blue-300">
                    {calculateWorkingDays(newLeaveForm.startDate, newLeaveForm.endDate)} Business Days
                  </span>
                </div>
              )}

              {/* Over-Quota Warning Alert */}
              {(() => {
                const requested = calculateWorkingDays(newLeaveForm.startDate, newLeaveForm.endDate);
                const matchingBal = leaveBalances.find((b) => b.leaveTypeId === newLeaveForm.leaveTypeId);
                if (matchingBal && requested > matchingBal.availableDays) {
                  return (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>
                        Insufficient Balance: You only have {matchingBal.availableDays} days left for this category, but requested {requested} days.
                      </span>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Reason */}
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Reason for Time Off *</label>
                <textarea
                  required
                  rows={3}
                  value={newLeaveForm.reason}
                  onChange={(e) => setNewLeaveForm({ ...newLeaveForm, reason: e.target.value })}
                  placeholder="Provide context for manager review and workload handoff..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowApplyLeaveModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-blue-600/30 cursor-pointer transition-all"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RUN MONTHLY PAYROLL (ADMIN ONLY) */}
      {showProcessPayrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl w-full max-w-xl p-6 shadow-2xl shadow-emerald-500/10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    Execute Monthly Payroll Batch
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Batch calculations for all active personnel under {activeCompany.name}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowProcessPayrollModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProcessPayroll} className="space-y-4 mt-5 text-xs">
              {/* Month and Year Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1.5 font-medium">Payroll Month *</label>
                  <select
                    value={processPayrollForm.month}
                    onChange={(e) =>
                      setProcessPayrollForm({
                        ...processPayrollForm,
                        month: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {[
                      "1 — January", "2 — February", "3 — March", "4 — April",
                      "5 — May", "6 — June", "7 — July", "8 — August",
                      "9 — September", "10 — October", "11 — November", "12 — December"
                    ].map((m, idx) => (
                      <option key={m} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1.5 font-medium">Payroll Year *</label>
                  <select
                    value={processPayrollForm.year}
                    onChange={(e) =>
                      setProcessPayrollForm({
                        ...processPayrollForm,
                        year: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                  </select>
                </div>
              </div>

              {/* Branch Scope */}
              <div>
                <label className="block text-slate-400 mb-1.5 font-medium">Organizational Scope *</label>
                <select
                  disabled={currentRole === "BRANCH_ADMIN"}
                  value={processPayrollForm.branchId}
                  onChange={(e) =>
                    setProcessPayrollForm({
                      ...processPayrollForm,
                      branchId: e.target.value,
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-60"
                >
                  <option value="ALL">All Branches (Global Company Roster)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city})
                    </option>
                  ))}
                </select>
                {currentRole === "BRANCH_ADMIN" && (
                  <p className="text-[10px] text-amber-400 mt-1">
                    Locked to your assigned branch jurisdiction as Branch HR Manager.
                  </p>
                )}
              </div>

              {/* Immediate ACH Settlement Toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white text-xs">Direct Deposit (ACH) Settlement</div>
                  <div className="text-[11px] text-slate-400">
                    Immediately flag all generated payslips as PAID and generate verifiable receipt numbers.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={processPayrollForm.autoMarkPaid}
                  onChange={(e) =>
                    setProcessPayrollForm({
                      ...processPayrollForm,
                      autoMarkPaid: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded text-emerald-600 bg-slate-700 border-slate-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* Estimation & Statutory Rule Preview */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Automated Compensation Formula
                  </span>
                  <span>{payrollOverview.kpis.activeEmployeeCount} Active Staff</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1 border-t border-emerald-500/20">
                  <div>
                    <span className="text-slate-400">Allowances:</span> 10% Housing + 5% Transport + $250 Med
                  </div>
                  <div>
                    <span className="text-slate-400">Deductions:</span> 5% 401(k) + $150 Group Health
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">Statutory Tax:</span> 12% - 15% Progressive Withholding
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowProcessPayrollModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayroll}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-600/30 cursor-pointer transition-all disabled:opacity-60"
                >
                  {isProcessingPayroll ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Computing Batch...</span>
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4" />
                      <span>Execute Batch Settlement</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ENTERPRISE DIGITAL PAYSLIP RECEIPT (PRINTABLE) */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            {/* Modal Controls Bar */}
            <div className="bg-slate-850 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold text-slate-300">
                  Verifiable Enterprise Payslip Receipt
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  REC-{selectedPayslip.year}-{String(selectedPayslip.month).padStart(2, "0")}-{selectedPayslip.employeeNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700 transition cursor-pointer"
                  title="Print or Save as PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Payslip Body */}
            <div className="p-8 text-slate-200 space-y-6 bg-gradient-to-b from-slate-900 to-slate-950">
              {/* Header: Company & Official Title */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-white shadow-lg">
                      DS
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white tracking-tight">DigiSail Global Inc.</h2>
                      <p className="text-[11px] text-slate-400">DigiSail Technologies, Inc. • Enterprise HRM</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    75 Rockefeller Plaza, New York, NY 10019 • support@digisail.com
                  </p>
                </div>

                <div className="sm:text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Official Salary Disbursement
                  </span>
                  <div className="mt-2 text-xs">
                    <span className="text-slate-400">Pay Period: </span>
                    <span className="font-semibold text-white">Month {selectedPayslip.month}/{selectedPayslip.year}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-400">Disbursement Date: </span>
                    <span className="font-mono text-slate-300">
                      {selectedPayslip.payDate ? new Date(selectedPayslip.payDate).toLocaleDateString() : "2026-09-30"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Employee & Job Profile Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-850/80 border border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-medium">Employee Name</span>
                  <div className="font-semibold text-white mt-0.5">{selectedPayslip.employeeName}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-medium">Staff ID</span>
                  <div className="font-mono font-semibold text-emerald-400 mt-0.5">{selectedPayslip.employeeNumber}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-medium">Department</span>
                  <div className="text-white mt-0.5">{selectedPayslip.department}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-medium">Position</span>
                  <div className="text-white mt-0.5">{selectedPayslip.designation}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-medium">Assigned Branch</span>
                  <div className="text-white mt-0.5">{selectedPayslip.branch}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-medium">Currency</span>
                  <div className="text-white mt-0.5">{selectedPayslip.currency} ($)</div>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 uppercase font-medium">Disbursement Method</span>
                  <div className="text-white mt-0.5 font-mono">{selectedPayslip.paymentMethod}</div>
                </div>
              </div>

              {/* Dual-Column Compensation Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                {/* Column 1: Earnings */}
                <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
                  <div className="font-bold text-emerald-400 text-xs uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center justify-between">
                    <span>Gross Earnings</span>
                    <span>Amount</span>
                  </div>
                  <div className="space-y-2 text-slate-300">
                    <div className="flex justify-between">
                      <span>Basic Monthly Salary</span>
                      <span className="font-mono">${selectedPayslip.basicSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Housing Allowance (10%)</span>
                      <span className="font-mono text-emerald-400">+${(selectedPayslip.breakdown?.housingAllowance ?? (selectedPayslip.basicSalary * 0.1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Transport Allowance (5%)</span>
                      <span className="font-mono text-emerald-400">+${(selectedPayslip.breakdown?.transportAllowance ?? (selectedPayslip.basicSalary * 0.05)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Medical & Utility Subsidy</span>
                      <span className="font-mono text-emerald-400">+${(selectedPayslip.breakdown?.utilityAllowance ?? 250).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  <div className="pt-2.5 border-t border-slate-800 flex justify-between font-bold text-white text-xs">
                    <span>Total Gross Compensation</span>
                    <span className="font-mono text-emerald-300">${(selectedPayslip.basicSalary + selectedPayslip.allowances).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Column 2: Deductions & Taxes */}
                <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
                  <div className="font-bold text-rose-400 text-xs uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center justify-between">
                    <span>Deductions & Withholding</span>
                    <span>Amount</span>
                  </div>
                  <div className="space-y-2 text-slate-300">
                    <div className="flex justify-between text-slate-400">
                      <span>Retirement Fund / 401(k) (5%)</span>
                      <span className="font-mono text-rose-400">-${(selectedPayslip.breakdown?.providentFund ?? (selectedPayslip.basicSalary * 0.05)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Group Health Insurance</span>
                      <span className="font-mono text-rose-400">-${(selectedPayslip.breakdown?.healthInsurance ?? 150).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Statutory Income Tax Withholding</span>
                      <span className="font-mono text-amber-400">-${selectedPayslip.tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  <div className="pt-2.5 border-t border-slate-800 flex justify-between font-bold text-white text-xs">
                    <span>Total Deductions & Tax</span>
                    <span className="font-mono text-rose-300">-${(selectedPayslip.deductions + selectedPayslip.tax).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Net Payout Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-cyan-600/20 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold">
                    Net Take-Home Salary
                  </span>
                  <div className="text-2xl font-bold font-mono text-white mt-0.5">
                    ${selectedPayslip.netSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedPayslip.currency}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold text-xs flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Direct Deposit Cleared</span>
                  </div>
                </div>
              </div>

              {/* Tamper-Evident Footer */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-500/80" />
                  <span>Audit Signature: DS-VERIFY-{selectedPayslip.id.slice(0, 8).toUpperCase()}-ACH</span>
                </div>
                <div>
                  Generated under ISO-27001 & SOC-2 Enterprise Compliance Standards.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE PROJECT (PHASE 8) */}
      {showCreateProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-blue-500/40 rounded-3xl w-full max-w-lg p-6 shadow-2xl shadow-blue-500/10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-md">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    Create New Project Engagement
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Allocate program budget, billable client, and delivery milestones.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateProjectModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 mt-5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-400 mb-1 font-medium">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={newProjectForm.name}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, name: e.target.value })}
                    placeholder="e.g. NextGen Microservices Refactor"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Project Code *</label>
                  <input
                    type="text"
                    required
                    value={newProjectForm.code}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. NGM-CORE"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Client Account *</label>
                  <input
                    type="text"
                    required
                    value={newProjectForm.clientName}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, clientName: e.target.value })}
                    placeholder="e.g. Apex Financial Partners"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Allocated Budget ($) *</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    value={newProjectForm.budget}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, budget: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Target Delivery Date</label>
                  <input
                    type="date"
                    value={newProjectForm.endDate}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, endDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-400 mb-1 font-medium">Project Description & Scope</label>
                  <textarea
                    rows={3}
                    value={newProjectForm.description}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, description: e.target.value })}
                    placeholder="Key deliverables, compliance requirements, architecture..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateProjectModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingProject}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold shadow-lg shadow-blue-600/30 cursor-pointer transition-all disabled:opacity-60"
                >
                  {isCreatingProject ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Project</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LOG TIMESHEET (PHASE 8) */}
      {showLogTimesheetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl w-full max-w-lg p-6 shadow-2xl shadow-cyan-500/10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-md">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    Log Billable Timesheet
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Submit verified hours against assigned project milestones.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLogTimesheetModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogTimesheet} className="space-y-4 mt-5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1.5 font-medium">Assigned Project *</label>
                <select
                  required
                  value={newTimesheetForm.projectId}
                  onChange={(e) => setNewTimesheetForm({ ...newTimesheetForm, projectId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="">Select project engagement...</option>
                  {projectsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.name} ({p.clientName || p.client || "Core"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Work Date *</label>
                  <input
                    type="date"
                    required
                    value={newTimesheetForm.date}
                    onChange={(e) => setNewTimesheetForm({ ...newTimesheetForm, date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Logged Hours *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    required
                    value={newTimesheetForm.hoursWorked}
                    onChange={(e) => setNewTimesheetForm({ ...newTimesheetForm, hoursWorked: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Task Description & Deliverables *</label>
                <textarea
                  required
                  rows={3}
                  value={newTimesheetForm.taskDescription}
                  onChange={(e) => setNewTimesheetForm({ ...newTimesheetForm, taskDescription: e.target.value })}
                  placeholder="Detail feature implementation, ticket IDs, bug resolution, or architecture work..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowLogTimesheetModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTimesheet}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-600/30 cursor-pointer transition-all disabled:opacity-60"
                >
                  {isSubmittingTimesheet ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Logging...</span>
                    </>
                  ) : (
                    <span>Submit Timesheet</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: UPGRADE / MODIFY SUBSCRIPTION PLAN */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  Elevate Subscription & Seat Ceiling
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Select your target organization tier to modify seat limits and feature gates.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  setManagingTenantId(null);
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1.5 font-medium">Select Plan Tier *</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(["STARTER", "GROWTH", "ENTERPRISE"] as const).map((t) => {
                    const price = t === "ENTERPRISE" ? 1999 : t === "GROWTH" ? 799 : 299;
                    const seats = t === "ENTERPRISE" ? "Unlimited" : t === "GROWTH" ? "100 seats" : "25 seats";
                    const isSelected = targetUpgradeTier === t;

                    return (
                      <div
                        key={t}
                        onClick={() => setTargetUpgradeTier(t)}
                        className={`p-3 rounded-xl border cursor-pointer transition text-center ${
                          isSelected
                            ? "bg-emerald-500/10 border-emerald-500 shadow-md ring-1 ring-emerald-500/30"
                            : "bg-slate-800/60 border-slate-700 hover:border-slate-600"
                        }`}
                      >
                        <p className={`font-bold ${isSelected ? "text-emerald-400" : "text-white"}`}>{t}</p>
                        <p className="text-base font-extrabold text-white font-mono mt-1">${price}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{seats}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tier Details Summary */}
              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Selected Tier:</span>
                  <span className="font-bold text-white font-mono">{targetUpgradeTier}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Seat Ceiling:</span>
                  <span className="font-bold text-emerald-400">
                    {targetUpgradeTier === "ENTERPRISE" ? "Unlimited (9,999+ seats)" : targetUpgradeTier === "GROWTH" ? "100 Seats" : "25 Seats"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Branch Capacity:</span>
                  <span className="font-bold text-indigo-400">
                    {targetUpgradeTier === "ENTERPRISE" ? "Unlimited (999 branches)" : targetUpgradeTier === "GROWTH" ? "10 Branches" : "2 Branches"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Monthly Rate:</span>
                  <span className="font-bold text-white font-mono">
                    ${targetUpgradeTier === "ENTERPRISE" ? "1,999" : targetUpgradeTier === "GROWTH" ? "799" : "299"} / mo
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-700/60">
                  <span>Feature Access:</span>
                  <span className="text-slate-300 font-medium">
                    {targetUpgradeTier === "STARTER"
                      ? "Core HR & Attendance"
                      : targetUpgradeTier === "GROWTH"
                      ? "Full Payroll, Projects & Timesheets"
                      : "Multi-Tier Approvals, Audit Logs & 99.99% SLA"}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/30 text-[11px] text-emerald-300">
                ⚡ <strong>Instant Activation:</strong> Changes take effect immediately. The new seat ceiling is elevated without server downtime, and an invoice statement is generated in your billing ledger.
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isUpgradingPlan}
                  onClick={() => {
                    setShowUpgradeModal(false);
                    setManagingTenantId(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isUpgradingPlan}
                  onClick={() => handleUpgradePlan(targetUpgradeTier)}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-600/30 cursor-pointer transition disabled:opacity-60"
                >
                  {isUpgradingPlan ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Elevating Ceilings...</span>
                    </>
                  ) : (
                    <span>Confirm & Elevate Plan</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PRINTABLE TAX INVOICE STATEMENT */}
      {selectedInvoiceForReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Official Tax Invoice Statement</h3>
                  <p className="text-[11px] text-slate-400">DigiSailHRM Multi-Tenant Platform Billing</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  Print / PDF
                </button>
                <button
                  onClick={() => setSelectedInvoiceForReceipt(null)}
                  className="text-slate-400 hover:text-white cursor-pointer px-2 py-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Receipt Content */}
            <div className="space-y-5 mt-5 text-xs">
              {/* Organization & Invoice Metadata */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-semibold">Billed To Organization</p>
                  <p className="text-sm font-bold text-white mt-0.5">{activeCompany.name}</p>
                  <p className="text-slate-300">{activeCompany.legalName || activeCompany.name}</p>
                  <p className="text-slate-400 text-[11px] mt-1 font-mono">{activeCompany.subdomain}.digisailhrm.com</p>
                  <p className="text-slate-400 text-[11px]">Contact: {activeCompany.adminEmail}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-[10px] uppercase font-semibold">Invoice Information</p>
                  <p className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
                    {selectedInvoiceForReceipt.invoiceNumber}
                  </p>
                  <p className="text-slate-300">Date: {selectedInvoiceForReceipt.billingDate}</p>
                  <p className="text-slate-400 text-[11px]">Payment: Visa ending in •••• 4242</p>
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    PAID & SETTLED
                  </span>
                </div>
              </div>

              {/* Itemized Line Items */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-800/60 text-slate-400 text-[10px] uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Licensed Capacity</th>
                      <th className="py-2.5 px-3 text-right">Rate</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr>
                      <td className="py-3 px-3 font-medium text-white">
                        {selectedInvoiceForReceipt.planName}
                      </td>
                      <td className="py-3 px-3">
                        {selectedInvoiceForReceipt.seatsBilled} Active Staff Seats
                      </td>
                      <td className="py-3 px-3 font-mono text-right">
                        ${selectedInvoiceForReceipt.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-mono text-right font-bold text-white">
                        ${selectedInvoiceForReceipt.amount.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals Breakdown */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-mono text-slate-200">${selectedInvoiceForReceipt.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Sales Tax (0.0%):</span>
                    <span className="font-mono text-slate-200">$0.00</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                    <span>Total Paid:</span>
                    <span className="font-mono text-emerald-400">${selectedInvoiceForReceipt.amount.toFixed(2)} USD</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800 text-[11px] text-slate-400 text-center">
                DigiSail Technologies, Inc. • 75 Rockefeller Plaza, New York, NY 10019 • Tax ID: US-94-2849102
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AI RETENTION INTERVENTION STRATEGY (PHASE 10) */}
      {selectedRetentionCandidate && showRetentionStrategyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-purple-500/50 rounded-3xl w-full max-w-xl p-6 shadow-2xl shadow-purple-500/10 animate-in zoom-in-95 duration-200 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-rose-600 flex items-center justify-center shadow-lg">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Retention Intervention Strategy
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Targeted mitigation roadmap generated by neural workforce retention engine.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowRetentionStrategyModal(false);
                  setSelectedRetentionCandidate(null);
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Target Profile Card */}
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={selectedRetentionCandidate.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                  alt={selectedRetentionCandidate.employeeName}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/40"
                />
                <div>
                  <h4 className="text-sm font-bold text-white">{selectedRetentionCandidate.employeeName}</h4>
                  <p className="text-xs text-slate-400">
                    {selectedRetentionCandidate.designation} • {selectedRetentionCandidate.department}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Risk Severity</span>
                <span className="text-sm font-black text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/30 inline-block mt-0.5">
                  {selectedRetentionCandidate.riskScore}% {selectedRetentionCandidate.riskLevel}
                </span>
              </div>
            </div>

            {/* Diagnosed Risk Factors */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" />
                Primary Turnover Drivers
              </h5>
              <div className="space-y-1.5">
                {selectedRetentionCandidate.primaryFactors.map((factor, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-900/40 text-xs text-rose-200 flex items-start gap-2">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{factor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended 3-Step Action Plan */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                Recommended Retention Action Plan
              </h5>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">1</span>
                    Workload & Sprint Rebalancing
                  </div>
                  <p className="text-slate-400 text-[11px] pl-5.5">
                    Temporarily redistribute technical sprint deliverables to eliminate sustained overtime. Enforce rest intervals before next release.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px]">2</span>
                    Proactive Compensation Parity Adjustment
                  </div>
                  <p className="text-slate-400 text-[11px] pl-5.5">
                    Current salary is in the lower tier of their cohort. Initiate a 5-8% off-cycle market parity merit review in the upcoming payroll cycle.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px]">3</span>
                    Executive Mentorship & Growth Pathway
                  </div>
                  <p className="text-slate-400 text-[11px] pl-5.5">
                    Schedule a 1-on-1 strategic dialogue with department leadership to outline senior promotion criteria and high-visibility client engagements.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowRetentionStrategyModal(false);
                  setSelectedRetentionCandidate(null);
                }}
                className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 text-xs cursor-pointer font-medium"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  setShowRetentionStrategyModal(false);
                  setSelectedRetentionCandidate(null);
                  showToast(`🛡️ Retention strategy acknowledged for ${selectedRetentionCandidate.employeeName}. Added to HR action items.`);
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 cursor-pointer"
              >
                Acknowledge Retention Roadmap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PRINTABLE OFFICIAL PERFORMANCE APPRAISAL DOCUMENT (PHASE 10) */}
      {selectedReviewForPrint && showPrintReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Document Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Official Performance Appraisal Statement</h3>
                  <p className="text-[11px] text-slate-400">DigiSailHRM Human Capital Intelligence & Governance</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-400" />
                  Print Document
                </button>
                <button
                  onClick={() => {
                    setShowPrintReviewModal(false);
                    setSelectedReviewForPrint(null);
                  }}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Appraisal Document Body */}
            <div className="space-y-5 text-xs">
              {/* Employee & Cycle Details */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Employee Name</span>
                  <span className="text-sm font-bold text-white">{selectedReviewForPrint.employeeName}</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {selectedReviewForPrint.designation} • {selectedReviewForPrint.department}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase block">Evaluation Cycle</span>
                  <span className="text-sm font-bold text-purple-400">{selectedReviewForPrint.period}</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Status: {selectedReviewForPrint.status}
                  </span>
                </div>
              </div>

              {/* Rating Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900 border border-indigo-500/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Formal Appraisal Rating</span>
                  <div className="text-lg font-black text-emerald-400 mt-0.5">
                    ★ {selectedReviewForPrint.rating.replace("_", " ")}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase block">Performance Index</span>
                  <div className="text-2xl font-extrabold font-mono text-white">
                    {selectedReviewForPrint.metricsScore} <span className="text-xs text-slate-400">/ 100</span>
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="space-y-1.5">
                <h5 className="font-bold text-white text-xs uppercase tracking-wider text-slate-300">
                  Executive Performance Evaluation
                </h5>
                <p className="p-3.5 rounded-xl bg-slate-800/30 border border-slate-800 text-slate-300 leading-relaxed text-[11px]">
                  {selectedReviewForPrint.summary}
                </p>
              </div>

              {/* Strengths Table */}
              <div className="space-y-1.5">
                <h5 className="font-bold text-emerald-400 text-xs uppercase tracking-wider">
                  Demonstrated Competencies & Key Strengths
                </h5>
                <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800 space-y-1.5">
                  {selectedReviewForPrint.strengths.map((str, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{str}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Growth Areas Table */}
              <div className="space-y-1.5">
                <h5 className="font-bold text-amber-400 text-xs uppercase tracking-wider">
                  Developmental Objectives & Growth Horizons
                </h5>
                <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800 space-y-1.5">
                  {selectedReviewForPrint.growthAreas.map((ga, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
                      <span className="text-amber-400 font-bold">→</span>
                      <span>{ga}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strategic Goals */}
              <div className="space-y-1.5">
                <h5 className="font-bold text-cyan-400 text-xs uppercase tracking-wider">
                  Target Deliverables for Upcoming Review Cycle
                </h5>
                <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800 space-y-1.5">
                  {selectedReviewForPrint.goals.map((g, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
                      <span className="text-cyan-400 font-mono font-bold">{idx + 1}.</span>
                      <span>{g}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formal Signatures Section */}
              <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-8 text-[11px]">
                <div>
                  <div className="h-10 border-b border-slate-700 flex items-end pb-1 text-slate-400 italic">
                    {selectedReviewForPrint.reviewerName || "Sarah Jenkins"} (Authorized HR Director)
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase block mt-1">Reviewer Sign-Off</span>
                </div>
                <div>
                  <div className="h-10 border-b border-slate-700 flex items-end pb-1 text-slate-400 italic">
                    {selectedReviewForPrint.employeeName}
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase block mt-1">Employee Acknowledgment</span>
                </div>
              </div>

              {/* Document Compliance Footer */}
              <div className="pt-2 text-center text-[10px] text-slate-500">
                Official DigiSail HRM Workforce Intelligence Report • Tamper-evident cryptographic ID: {selectedReviewForPrint.id}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

