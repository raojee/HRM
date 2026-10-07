# DigiSailHRM — Master Implementation Plan & Roadmap

## 🎯 Executive Overview
DigiSailHRM is an enterprise-grade, multi-tenant Human Resource Management system built with Next.js 16 (App Router), React 19, Tailwind CSS, Prisma 7, and Neon Serverless PostgreSQL. It features strict multi-tenant isolation, a 6-tier organizational role hierarchy, multi-stage approval state machines, and continuous Memory Agent quality audits.

---

## 🗺️ Master Phase-by-Phase Roadmap

| Phase | Title | Scope & Deliverables | Status |
| :---: | :--- | :--- | :---: |
| **Phase 1** | **Auth Core & RBAC Helper** | • Signed HS256 JWT sessions using `jose`<br>• Password hashing & dev verification (`bcryptjs`)<br>• Cookie transport (`digisail_session`) & `requireAuth` / `requireRole` guards | **COMPLETED** |
| **Phase 2** | **Approval Workflows Engine** | • 2-Stage Onboarding Approval State Machine<br>• Stage 1 (Dept Review) &rarr; Stage 2 (Branch HR Activation)<br>• Automated user account & annual leave provisioning upon activation<br>• `EmployeeApprovalLog` audit trail | **COMPLETED** |
| **Phase 3** | **Core API Route Handlers** | • `/api/auth/*` (login, logout, me, switch-role)<br>• `/api/employees` (filtered directory & candidate proposal)<br>• `/api/approvals/*` (onboarding & leave queues and action handlers)<br>• `/api/org/*` (branches, departments, teams)<br>• `/api/leaves/*` & `/api/attendance/*` (punch in/out, balances) | **COMPLETED** |
| **Phase 4** | **Dashboard Integration & Live Sync** | • Frontend dashboard (`page.tsx`) wired to live API endpoints<br>• Dynamic persona selector establishing real server sessions<br>• Real candidate submission & approval processing<br>• Live attendance punch with late/overtime tracking | **COMPLETED** |
| **Audit** | **Memory Agent & Quality Ledger** | • `.agents/rules/memory-agent.md` & `MEMORY_LEDGER.md`<br>• 4-Pillar Quality Standards enforcement<br>• 6 security vulnerabilities and edge-case bugs identified & resolved | **ACTIVE** |
| **Phase 5** | **Dedicated Authentication Suite (Login Page)** | • Sleek, modern standalone `/login` interface<br>• Enterprise credential form + One-Click Persona Quick-Access<br>• Route protection via `middleware.ts`<br>• Session refresh, logout flow, and redirect handling | **COMPLETED** |
| **Phase 6** | **Leave Management & Quota Workflows** | • Live visual quota cards (Annual, Sick, Casual leaves)<br>• Interactive leave request modal with business day calculation<br>• Reviewer Leave Approval Queue with balance deduction | **COMPLETED** |
| **Phase 7** | **Payroll Processing & Payslips** | • Monthly branch payroll batch calculations<br>• Deductions, allowances, and tax computation<br>• Downloadable/printable digital payslip receipts | **COMPLETED** |
| **Phase 8** | **Projects, Tasks & Timesheets** | • Project allocation, billable client tracking, task boards<br>• Weekly employee timesheet submissions & manager approvals | **COMPLETED** |
| **Phase 9** | **SaaS Multi-Tenancy & Tenant Billing** | • Subdomain tenant routing (`tenant.digisailhrm.com`)<br>• Subscription tier enforcement (Starter, Growth, Enterprise)<br>• Tenant usage limits & company administration | **COMPLETED** |
| **Phase 10** | **AI Workforce Insights & Analytics Engine** | • Departmental attrition risk predictive scores<br>• Automated performance review synthesis<br>• Executive headcount & compensation forecasting | **COMPLETED** |

---

## 🔐 Deep-Dive Plan: Phase 5 — Standalone Login Page (`/login`)

### 1. Objectives & User Experience
The goal is to deliver a dedicated, high-impact enterprise authentication screen that provides:
1. **Production Credential Login**: Secure email and password entry authenticating against Neon PostgreSQL with bcrypt comparison.
2. **One-Click Persona Switcher (Demo / Evaluator Mode)**: Instant login buttons for all 6 personas (*Platform Super Admin*, *Company HR*, *Branch HR*, *Dept Head*, *Team Lead*, *Regular Employee*) with pre-filled badges and role descriptions.
3. **Route Guards via Next.js `middleware.ts`**:
   - Unauthenticated users attempting to access `/`, `/approvals`, `/employees`, etc., are redirected to `/login`.
   - Logged-in users attempting to visit `/login` are automatically forwarded to `/`.
4. **Interactive Security Features**:
   - Password reveal/hide eye icon.
   - Live loading states & animated spinners.
   - Graceful error banners for invalid credentials or inactive accounts.
   - "Remember Me" preference storage.

---

### 2. UI / Visual Layout Architecture

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│   ┌───────────────────────────────────┐    ┌───────────────────────────────────────┐   │
│   │   Left Hero / Value Proposition   │    │          Right Login Card             │   │
│   │                                   │    │                                       │   │
│   │   • DigiSail HRM Gradient Logo    │    │   [ Email Address ]                   │   │
│   │   • "Next-Generation Multi-Tenant │    │   [ Password (••••••••) 👁️ ]          │   │
│   │     Workforce Intelligence"       │    │                                       │   │
│   │   • Feature Highlights:           │    │   [  Sign In to Workspace  ]          │   │
│   │     - 2-Stage Onboarding Approval │    │                                       │   │
│   │     - Multi-Tier Scope Control    │    │   ─────── Quick Demo Personas ─────── │   │
│   │     - Serverless Neon Database    │    │                                       │   │
│   │   • Security Badges:              │    │   [👑 Super Admin]  [🏢 Company HR]   │   │
│   │     - 256-Bit Encrypted Sessions  │    │   [📍 Branch HR]   [📁 Dept Head]     │   │
│   │     - ISO-Ready Audit Logs        │    │   [👤 Team Lead]   [👥 Employee]      │   │
│   └───────────────────────────────────┘    └───────────────────────────────────────┘   │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 3. File Implementation Breakdown

1. **`src/app/login/page.tsx`**:
   - Client Component with dark mode glassmorphism (Slate-950/Slate-900 palette).
   - Form state management: `email`, `password`, `rememberMe`, `isLoading`, `errorMessage`.
   - Handlers for credential submit & fast demo login.
2. **`src/middleware.ts`**:
   - Next.js edge-compatible middleware verifying `digisail_session` cookie via `jose`.
   - Protects application routes (`/`, `/api/employees`, `/api/approvals`, etc.).
   - Allows public access to `/login`, `/api/auth/login`, `/api/auth/switch-role`, `/favicon.ico`, and `/_next/*`.
3. **Session Header / Logout Sync**:
   - Ensure the dashboard header and user profile card have a clear "Sign Out" button calling `POST /api/auth/logout` and redirecting to `/login`.

---

### 4. Technical Constraints & Validation
- **Cookie Security**: `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age=7 days`.
- **Zod Validation**: Valid email format, non-empty password.
- **Neon Database Query**: `prisma.user.findUnique({ where: { email } })` with linked employee details and administered scopes.
- **Memory Agent Protocol**: Register all new functions in `MEMORY_LEDGER.md` with 4-pillar review.

---

## 🏢 Deep-Dive Plan: Phase 9 — SaaS Multi-Tenancy & Tenant Billing

### 1. Objectives & Business Logic
1. **Tiered Subscription Plans**:
   - `STARTER` ($299/mo): Up to 25 employees, 2 branches, standard HR & attendance.
   - `GROWTH` ($799/mo): Up to 100 employees, 10 branches, full payroll engine & projects/timesheets.
   - `ENTERPRISE` ($1,999/mo): Unlimited employees & branches, multi-tier approvals, dedicated audit logs & custom SLA.
2. **Quota & License Gate Enforcements**:
   - Enforce seat limit check on onboarding candidate proposals (`POST /api/employees`). If `activeEmployeesCount >= maxSeats`, block creation with `LICENSE_LIMIT_EXCEEDED`.
   - Feature flags by tier: Disable Payroll or Timesheets if company is on an unsupported plan.
3. **Super Admin SaaS Tenant Management Center**:
   - Multi-tenant directory listing all companies, subscription tiers, renewal dates, MRR, and seat utilization percentages.
   - Provision new tenant company with initial branch, admin user credentials, and selected plan.
   - Change tenant plan (upgrade/downgrade), modify seat quotas, or suspend delinquent tenants.
4. **Company Admin Billing & Subscription Portal**:
   - Company HR/Admins can view their active plan, seats used vs allocated with visual progress bars, billing contact, invoice history, and next renewal date.
   - Upgrade plan modal with instant seat ceiling elevation.
5. **REST API Endpoints**:
   - `GET /api/tenants`: Super Admin list of all tenants with live employee counts & billing status.
   - `POST /api/tenants`: Super Admin tenant onboarding route.
   - `GET /api/tenants/[id]/subscription`: Scoped subscription details & seat quota metrics.
   - `POST /api/tenants/[id]/subscription`: Upgrade/downgrade plan and modify seat quota.
   - `GET /api/tenants/[id]/invoices`: Mock billing invoice statements and downloadable receipts.
6. **Frontend Integration**:
   - Interactive "Billing & Subscriptions" management tab in `src/app/page.tsx` for Company Admins and Super Admins.
   - Quota usage progress ring/bar, tier comparison cards, plan switch confirmation dialog, and invoice table.
7. **Memory Agent & Quality Standards**:
   - Strict tenant isolation, preventing cross-tenant license modifications.
   - Register all new service functions and route handlers in `MEMORY_LEDGER.md`.

---

## 🧠 Deep-Dive Plan: Phase 10 — AI Workforce Insights & Analytics Engine

### 1. Objectives & Business Logic
1. **Departmental Attrition Risk Predictive Scores & Flight Radar**:
   - Multi-factor quantitative attrition formula computing a 0–100 risk score based on:
     - **Overtime Burden**: Weekly overtime hours logged via attendance punches.
     - **Leave Deprivation**: Annual leave utilization percentage (<15% utilization signifies burnout risk).
     - **Compensation Parity**: Relative salary percentile within department peers (<30th percentile elevates flight risk).
     - **Tenure Plateau**: Plateau window (18–36 months with single designation).
   - Dynamic classification: `LOW` (0–39), `MEDIUM` (40–69), and `HIGH` (70–100).
   - Automated primary risk drivers and tailored intervention recommendations.
   - Persistent evaluation records in `AttritionRiskAssessment` table in Neon PostgreSQL.
2. **Automated AI Performance Review Synthesis & Appraisal Generator**:
   - Multi-metric holistic evaluation engine assessing:
     - Billable timesheet hours and approved project contribution logs.
     - Punch attendance punctuality and on-time compliance rates.
     - Quantified 0–100 performance score mapped to `EXCEEDS_EXPECTATIONS`, `MEETS_EXPECTATIONS`, `NEEDS_IMPROVEMENT`, or `UNSATISFACTORY`.
   - Comprehensive synthesis generating:
     - Executive performance narrative summary.
     - Top identified professional strengths (array).
     - Growth & development opportunities (array).
     - Strategic goals for next appraisal cycle (array).
   - Role-guarded draft creation, publication, and official printable document modal.
   - Stored in `PerformanceReview` table with reviewer audit linkage.
3. **Executive Headcount & Payroll Budget Forecasting Engine**:
   - 6-month and 12-month forward predictive trajectory calculations.
   - 3 dynamic scenario models:
     - `CONSERVATIVE`: +5% hiring rate, +2% annual merit increment.
     - `BASELINE`: +12% hiring rate, +4% annual merit increment.
     - `AGGRESSIVE`: +28% hiring rate, +7% annual merit increment.
   - Comprehensive cost model incorporating base salaries, mandatory benefits load (15%), and statutory payroll taxes (13.5%).
4. **Interactive Dashboard Suite & Modals (`activeTab === "ai-insights"`)**:
   - 3 sub-tabs: **Attrition Radar & Burnout Matrix**, **AI Review Synthesizer & Appraisals**, and **Headcount & Budget Forecaster**.
   - **AI Retention Intervention Strategy Modal**: Displays candidate flight risk profile, key drivers, and actionable retention roadmap.
   - **Printable Official Performance Appraisal Document Modal**: Formal corporate appraisal sheet with employee details, metrics, strengths, growth areas, goals, and official signature blocks.
5. **REST API Endpoints**:
   - `GET /api/ai/attrition`: Company risk score, burnout index, department heatmaps, and high-risk candidate rankings.
   - `GET /api/ai/reviews`: Role-scoped directory of published performance reviews.
   - `POST /api/ai/reviews/generate`: Dynamic AI review synthesis for selected employee and evaluation period.
   - `POST /api/ai/reviews`: Review publication endpoint saving appraisal to Neon PostgreSQL.
   - `GET /api/ai/forecast`: Headcount and compensation budget projections by scenario (`CONSERVATIVE`, `BASELINE`, `AGGRESSIVE`).

