# 🚢 DigiSailHRM — Modern Enterprise Workforce & HR Intelligence Platform

An enterprise-grade, multi-tenant Human Resource Management & Workforce Intelligence platform built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS**, **Prisma 7**, and **Neon Serverless PostgreSQL**.

---

## ✨ Features & Architecture (Phases 1 – 10)

1. **🔐 Authentication & RBAC Core**:
   - Secure signed HS256 JWT sessions (`jose`) with HTTP-Only cookie transport (`digisail_session`).
   - Bcrypt password hashing and 6-tier hierarchical role-based access control:
     - `SUPER_ADMIN` (Platform SaaS Owner)
     - `COMPANY_ADMIN` (Company HR Director)
     - `BRANCH_ADMIN` (Branch HR Manager)
     - `DEPARTMENT_ADMIN` (Department Head)
     - `TEAM_LEAD` (Engineering / Operations Lead)
     - `EMPLOYEE` (Standard Staff Member)
   - Edge-compatible route guard via `middleware.ts`.
   - Dedicated glassmorphic login interface (`/login`) with 1-click persona quick access for demo evaluations.

2. **🔄 2-Stage Onboarding Approval State Machine**:
   - Stage 1: Department Review (`PENDING_DEPT_APPROVAL`).
   - Stage 2: Branch HR Verification & Activation (`PENDING_BRANCH_APPROVAL` &rarr; `ACTIVE`).
   - Atomic user provisioning, annual leave quota allocation, and immutable audit logs (`EmployeeApprovalLog`).

3. **🏢 Multi-Tenant Org Hierarchy**:
   - Companies &rarr; Branches &rarr; Departments &rarr; Teams &rarr; Employees.
   - Strict tenant boundary isolation enforced on all database queries via `companyId`.

4. **🌴 Leave Management & Quota Workflows**:
   - Real-time leave quotas (Annual, Sick, Casual PTO balances).
   - Multi-tier leave application and approval workflow with atomic quota balance deduction.

5. **⏱️ Attendance Tracking & Punch Clock**:
   - Real-time punch in / punch out with automatic late arrival detection (>9:30 AM).
   - Support for overnight shifts across midnight boundaries and overtime calculations.

6. **💰 Payroll Processing & Payslip Receipts**:
   - Automated monthly salary batch calculation engine: base salary, allowances (housing, transport, medical), statutory deductions (401k, health), and progressive income tax.
   - Atomic batch execution via `prisma.$transaction`.
   - Downloadable and printable official digital payslip receipt modals.

7. **📊 Projects, Tasks & Timesheet Billing**:
   - Corporate client accounts, project portfolios, and milestone tracking.
   - Employee billable timesheet logging and 1-click manager approval queues.

8. **🏢 SaaS Multi-Tenancy & Tenant Billing**:
   - 3-tier subscription catalog: **Starter** ($299/mo), **Growth** ($799/mo), and **Enterprise** ($1,999/mo).
   - Dynamic license seat gating (`checkSeatLimit`) and branch quota ceilings (`checkBranchLimit`).
   - Super Admin SaaS Tenant Management Center with live MRR metrics and seat utilization bars.
   - Company Admin Billing Portal with plan upgrade modals and printable tax invoice statements.

9. **🧠 AI Workforce Insights & Analytics Engine**:
   - **Attrition Risk Predictive Radar**: Multi-factor quantitative scoring (0–100) assessing overtime burnout, leave deprivation (<15% PTO), compensation disparity, and career tenure plateaus.
   - **AI Performance Review Synthesizer**: Automated appraisal generation analyzing billable timesheet hours and attendance punctuality into ratings, strengths, growth areas, and strategic goals.
   - **Headcount & Budget Forecaster**: 6-month and 12-month predictive modeling across Conservative (+5%), Baseline (+12%), and Aggressive (+28%) hiring scenarios with benefits and payroll tax loads.
   - Interactive modals for AI Retention Intervention Strategies and Printable Official Performance Appraisal Documents.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router & Server Actions)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Lucide React Icons](https://lucide.dev/)
- **ORM**: [Prisma 7.10](https://www.prisma.io/)
- **Database**: [Neon Serverless PostgreSQL](https://neon.tech/)
- **Authentication**: Edge JWT with `jose` & `bcryptjs`
- **Validation**: [Zod](https://zod.dev/)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- A Neon Serverless PostgreSQL database (or compatible PostgreSQL instance)

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/raojee/HRM.git
cd HRM

# Install dependencies
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your connection details:

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://neondb_owner:your_password@ep-your-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://neondb_owner:your_password@ep-your-direct.us-east-1.aws.neon.tech/neondb?sslmode=require"
NEON_BRANCH=production
JWT_SECRET="your_secure_256_bit_jwt_secret"
```

### 3. Database Setup

```bash
# Push schema to Neon PostgreSQL
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🏛️ Quality Standards & Auditing

DigiSailHRM follows the **4-Pillar Quality Standards**:
1. **Security & Multi-Tenant Isolation**: Mandatory `companyId` filtering on all operations; strict RBAC guards.
2. **Robustness & Edge-Case Resilience**: Defensive input parsing, boundary validation, and unclosed shift resilience.
3. **Data Integrity & Atomic Transactions**: Critical multi-step workflows enclosed in `prisma.$transaction`.
4. **Strict Type Safety**: End-to-end TypeScript compilation with `tsc --noEmit` and zero unchecked leaks.

Audit records and implementation history are tracked in [MEMORY_LEDGER.md](MEMORY_LEDGER.md) and [PLAN.md](PLAN.md).

---

## 📄 License

Proprietary enterprise software developed for DigiSailHRM. All rights reserved.
