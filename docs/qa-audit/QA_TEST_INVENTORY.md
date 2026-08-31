# QA Test Inventory — HRMS Enterprise Platform

This inventory reflects the actual code structure, API endpoints, backend services, frontend features, and database models discovered during the initial code audit.

---

## 1. Project Architecture Summary

### Backend
- **Framework / Language**: Go 1.22+, Chi Router (`github.com/go-chi/chi/v5`)
- **Database**: PostgreSQL (`github.com/jackc/pgx/v5/pgxpool`)
- **Authentication**: JWT HS256 (`github.com/golang-jwt/jwt/v5`)
- **Main Entry Point**: `backend/cmd/api/main.go`
- **Internal Modules**:
  - `auth`: JWT generation, validation, role verification (`SUPER_ADMIN`, `HR_ADMIN`, `MANAGER`, `EMPLOYEE`), scope management (`ScopeOrganization`, `ScopeDepartment`, `ScopeDirectReports`, `ScopeSelf`, `ScopeSalaryAccess`).
  - `employee`: Directory, profile details (overview, personal, statutory, work info), create employee, update employee, CSV export.
  - `attendance`: Daily check-in/out, attendance roster, regularization requests.
  - `leave`: Leave engine, 4-category normalization (`PL`, `CL`, `SL`, `LWP`), leave application, manager approvals.
  - `payroll`: Salary structure setup, LOP payroll calculator, payslip generation, statutory reporting (PF, ESI, TDS).
  - `performance`: Performance review cycles, KPI goal setting, self & manager evaluations.
  - `recruitment`: Job requisitions, ATS Kanban candidate pipeline, interview feedback.
  - `onboarding`: Employee onboarding checklists & task assignment.
  - `lifecycle`: Employee status changes, promotions, transfers, offboarding clearances.
  - `organization`: Department, designation, and location hierarchy.
  - `importer`: Bulk CSV upload engine with pre-validation and row error reports.
  - `reports`: System analytics & custom exports.
  - `workflow`: Universal Inbox & notification alerts.
  - `document`: Employee document upload, storage, and preview.
  - `user`: User account management and role assignments.

### Frontend
- **Framework / Stack**: React 19, TypeScript, Vite, TanStack Router, TanStack Query, Zustand, Radix UI.
- **Styling**: Tailwind CSS with dynamic `:root` CSS custom properties (`--bg-page`, `--bg-card`, `--color-primary`).
- **Feature Modules (`frontend/src/features/`)**:
  - `admin`: User administration & role permissions.
  - `attendance`: My Attendance & Admin Roster.
  - `auth`: Login, logout, password reset forms.
  - `dashboard`: Analytics cards, chart visualizations, quick actions.
  - `employees`: Employee Directory & Obsidian Profile Console (Overview, Personal, Work Info, Statutory, Documents, Timeline, Offboarding).
  - `import`: Bulk operations & CSV importer.
  - `leave`: Leave Dashboard, balance cards, leave application modal.
  - `lifecycle`: Transfer, promotion, and offboarding workflows.
  - `organization`: Department & designation setup.
  - `payroll`: Salary structure, LOP calculator, payslips.
  - `performance`: Appraisal cycles, goals, evaluation forms.
  - `recruitment`: Requisitions, ATS Kanban board, interview feedback.
  - `reports`: Data quality scanner & report exporter.
  - `workflow`: Universal Inbox & Task Center.

---

## 2. Discovered API Endpoint Inventory

| Endpoint | Method | Required Roles | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/auth/login` | `POST` | Public | Authenticate user & issue JWT |
| `/api/v1/auth/logout` | `POST` | Authenticated | Revoke session |
| `/api/v1/auth/me` | `GET` | Authenticated | Fetch current user claims & scope |
| `/api/v1/auth/forgot-password` | `POST` | Public | Generate reset token |
| `/api/v1/auth/reset-password` | `POST` | Public | Reset password with token |
| `/api/v1/employees` | `GET` | Authenticated | List employees with search/filters |
| `/api/v1/employees` | `POST` | `HR_ADMIN`, `SUPER_ADMIN` | Create new employee profile |
| `/api/v1/employees/{id}` | `GET` | Authenticated | Get full employee profile (Statutory restricted) |
| `/api/v1/employees/{id}` | `PATCH` | `HR_ADMIN`, `SUPER_ADMIN` | Update employee record |
| `/api/v1/employees/export` | `GET` | `HR_ADMIN`, `SUPER_ADMIN` | Export employee directory to CSV |
| `/api/v1/leave/balances` | `GET` | Authenticated | Fetch leave balances (PL, CL, SL, LWP) |
| `/api/v1/leave/applications` | `POST` | Authenticated | Submit leave application |
| `/api/v1/leave/applications/{id}/approve` | `PATCH` | `MANAGER`, `HR_ADMIN`, `SUPER_ADMIN` | Approve leave application |
| `/api/v1/leave/applications/{id}/reject` | `PATCH` | `MANAGER`, `HR_ADMIN`, `SUPER_ADMIN` | Reject leave application |
| `/api/v1/attendance/check-in` | `POST` | Authenticated | Clock in timestamp |
| `/api/v1/attendance/check-out` | `POST` | Authenticated | Clock out timestamp |
| `/api/v1/attendance/roster` | `GET` | `HR_ADMIN`, `SUPER_ADMIN` | View daily attendance roster |
| `/api/v1/payroll/structures` | `GET`/`POST` | `HR_ADMIN`, `SUPER_ADMIN` | Salary structure management |
| `/api/v1/payroll/payslips/{id}` | `GET` | Authenticated | Fetch employee payslip (Owner / Admin) |
| `/api/v1/organization/departments` | `GET`/`POST` | `HR_ADMIN`, `SUPER_ADMIN` | Department management |
| `/api/v1/import/upload` | `POST` | `HR_ADMIN`, `SUPER_ADMIN` | Bulk CSV import engine |

---

## 3. Discovered Data Models & Sensitive Fields

### Sensitive Statutory Data (`EmployeeStatutory`)
- `PANNumber`: Tax identifier.
- `AadhaarNumber`: Masked string (`****1234`).
- `UANNumber`: Universal Account Number for Provident Fund.
- `PFNumber`: Provident Fund ID.
- `ESICNumber`: ESI Corporation ID.
- `BankAccountNumber`: Masked string (`****5678`).
- `IFSCCode`: Bank branch code.

### Security Access Control
- `SUPER_ADMIN`: Full organization access.
- `HR_ADMIN`: Full organization access & HR functions.
- `MANAGER`: Direct reports & department scope.
- `EMPLOYEE`: Strict self-service boundary (`ScopeSelf`).
