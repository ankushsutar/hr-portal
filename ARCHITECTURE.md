# Enterprise HRMS — System Architecture & Technical Blueprint

This document details the architectural design, folder structure, database patterns, authentication mechanisms, and API specifications for the **Enterprise HRMS Platform**.

---

## 1. High-Level Technology Stack

```
+-------------------------------------------------------------------+
|                        FRONTEND CLIENT                            |
|  Vite + React 19 + TypeScript + Tailwind CSS v4 + Radix UI       |
|  TanStack Router + TanStack Query + TanStack Table + Recharts     |
+-------------------------------------------------------------------+
                                  |
                           HTTP / REST API (JWT)
                                  v
+-------------------------------------------------------------------+
|                        BACKEND API SERVER                         |
|  Go 1.23 + Chi v5 Router + pgx/v5 PostgreSQL Connection Pool      |
+-------------------------------------------------------------------+
                                  |
                            SQL Queries / Transactions
                                  v
+-------------------------------------------------------------------+
|                       POSTGRESQL DATABASE                         |
|  22 Applied Schema Migrations (v1 to v22 - Sprint 1 to Sprint 13) |
+-------------------------------------------------------------------+
```

---

## 2. Directory Structure

### Backend (`/backend`)
```
backend/
├── cmd/api/main.go            # Entry point, HTTP router assembly, CORS & auth middleware
├── internal/
│   ├── attendance/            # Punch logs, regularization, shift roster, WFH/OD requests
│   ├── audit/                 # System audit logging & history tracking
│   ├── auth/                  # JWT generation, password hashing (bcrypt), login handler
│   ├── configuration/         # System settings, shift policies, leave rules
│   ├── document/              # Document management & compliance upload handlers
│   ├── employee/              # Employee master directory, profile, document upload
│   ├── importer/              # Bulk CSV import engine & background importer workers
│   ├── leave/                 # Leave applications, balance calculation, approvals
│   ├── lifecycle/             # Probation reviews, confirmation, exit clearances, assets
│   ├── onboarding/            # Onboarding templates, task instances, progress tracking
│   ├── organization/          # Company hierarchy, departments, designations, locations
│   ├── payroll/               # Payroll run engine, state machine, LOP & advance deductions
│   ├── recruitment/           # Jobs, candidate funnel, interview pipeline, offer letters
│   ├── reports/               # Data Quality Analyzer, standard HR reports & CSV exporter
│   ├── user/                  # User accounts, role assignment (SUPER_ADMIN, HR_ADMIN, EMPLOYEE)
│   └── workflow/              # Universal Approval Aggregator, HR Task Center, Notifications
├── migrations/                # 22 Versioned SQL migration files (.up.sql)
└── go.mod                     # Go dependencies
```

### Frontend (`/frontend`)
```
frontend/
├── src/
│   ├── components/ui/         # Core design system components (Card, Layout, Inputs, Badges)
│   ├── contexts/              # AuthContext (JWT state, role validation, login/logout)
│   ├── features/
│   │   ├── admin/             # Users administration & document types management
│   │   ├── attendance/        # Attendance console & My Attendance punch interface
│   │   ├── auth/              # Dark developer console Login & Password Reset
│   │   ├── dashboard/         # Main executive dashboard with headcount & attrition charts
│   │   ├── employees/         # Employee directory, profile view & onboarding wizard
│   │   ├── import/            # Bulk import wizard & batch history inspector
│   │   ├── leave/             # Leave application, leave balance & holiday calendar
│   │   ├── lifecycle/         # Probation reviews, employee self-services & exit clearances
│   │   ├── organization/      # Company structure & designation management
│   │   ├── payroll/           # Payroll run state machine console & printable payslip viewer
│   │   ├── recruitment/       # Job openings & candidate evaluation pipeline
│   │   ├── reports/           # Data Quality & Health Center & standard reports CSV exporter
│   │   └── workflow/          # Universal Approval Center & HR Operations Task Center
│   ├── main.tsx               # TanStack Router tree configuration & API fetch interceptor
│   └── index.css              # Global styles & Tailwind v4 theme tokens
```

---

## 3. Key Subsystem Architectures

### A. Authentication & Security Layer
- **JWT Authentication**: Issued on successful authentication (`POST /api/v1/auth/login`).
- **Fetch Interceptor (`main.tsx`)**: Intercepts all outgoing client API requests and automatically attaches the bearer token from `localStorage` (`hrms_token` or `token`). Handles 401 unauthenticated errors by redirecting to `/login`.
- **Role-Based Access Control (RBAC)**: Supported roles: `SUPER_ADMIN`, `HR_ADMIN`, `EMPLOYEE`. Protected routes and navigation items use `hasRole()` checks in `Layout.tsx` and `ProtectedRoute` guards in `main.tsx`.

### B. Universal Workflow & Approval Engine
- Centralized task aggregator aggregates pending items from:
  1. `LEAVE`: Casual & Earned Leave Applications
  2. `ATTENDANCE`: Attendance Regularization & WFH/OD Requests
  3. `ADVANCE`: Salary Advance Disbursement Sign-offs
  4. `OFFBOARDING`: Exit Clearance Sign-offs
- Provides individual and multi-select bulk approval/rejection endpoints (`POST /api/v1/workflow/tasks/bulk-action`).

### C. Payroll Run State Machine Engine
- Lifecycle states: `DRAFT` → `PROCESSING` → `VALIDATED` → `APPROVED` → `LOCKED` → `PUBLISHED`.
- Automatically calculates LOP deductions based on unapproved attendance anomalies and processes scheduled salary advance repayments.

### D. Data Quality & HR Reports Engine
- Proactively scans employee data for missing managers, missing bank/PAN numbers, default shift fallbacks, corporate email collisions, and unverified compliance documents.
- Provides standard report exports in both JSON format and direct CSV file downloads (`Content-Type: text/csv`).
