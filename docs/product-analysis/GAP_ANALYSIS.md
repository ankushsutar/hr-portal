# Gap Analysis — Current HRMS vs. Production Requirements

> Assessment of the current application against Phase 1 production requirements.
> Based on code audit of existing migrations, feature files, and backend modules.

---

## Summary Rating

| Domain | Current State | Required State | Gap Severity |
|---|---|---|---|
| Employee Master | ⚠️ Basic | Full profile | HIGH |
| User Management | ✅ Basic (built) | Mature + Data Scopes | MEDIUM |
| Lifecycle Engine | ⚠️ DB table only | Full event model + Timeline | HIGH |
| Onboarding | ⚠️ Skeleton | Template engine + Tasks + Docs | HIGH |
| Bulk Import | ⚠️ UI Wizard only | Full engine with backend | HIGH |
| Documents | ❌ Missing | Full document engine | HIGH |
| Probation | ❌ Missing | Dashboard + Workflow | HIGH |
| Confirmation | ❌ Missing | Workflow + Letter | HIGH |
| Exit Management | ❌ Missing | Full clearance workflow | HIGH |
| Attendance | ⚠️ Basic logs | Provider + Processing + OD/WFH/Comp-off | HIGH |
| ESSL Integration | ❌ Missing | Adapter pattern | HIGH |
| Leave | ⚠️ Basic | Configurable engine | HIGH |
| Payroll | ⚠️ Basic | Full pipeline + Controls | HIGH |
| Indian Statutory | ⚠️ Fields only | Calculation engine | HIGH |
| Approval Center | ⚠️ Basic inbox | Universal cross-module | MEDIUM |
| Notifications | ❌ Missing | In-app + Email | HIGH |
| Data Quality | ❌ Missing | Operational dashboard | MEDIUM |
| Reports | ⚠️ Basic | Configurable engine | MEDIUM |
| RBAC + Data Scopes | ⚠️ Roles only | Role + Permission + Scope | HIGH |

---

## Detailed Gap Analysis

### 1. Employee Master

**Current:** `employees` table has: id, employee_id, first_name, last_name, department_id, manager_id, status, joining_date.

**Missing fields:**
- Personal: middle_name, gender, date_of_birth, blood_group, nationality, marital_status
- Contact: personal_email, personal_phone, emergency_contact, address
- Professional: designation_id, grade_id, employment_type, work_location
- Work: shift_id, probation_end_date, confirmation_date, notice_period_days
- Bank: account_number, ifsc, bank_name (separate from statutory)
- Statutory: already in `employee_statutory_details` ✅

**Gap:** Missing 20+ fields from the employee profile. Frontend profile page is minimal.

**Action:** Add migration for profile extensions; update employee service; build rich profile UI.

---

### 2. User Management

**Current:** `users` table, roles, user_roles, basic CRUD API, UI built.

**Missing:**
- Data scopes (SELF, DIRECT_REPORTS, DEPARTMENT, ORGANIZATION, SALARY_ACCESS)
- User invitation flow (email invite with token)
- Password reset flow
- Session/token revocation
- Login history tracking
- User-to-employee linking verified bidirectionally

**Gap:** RBAC exists at role level only. Data-scope enforcement is completely absent from middleware.

**Action:** Add data scope model to DB; implement scope middleware in Go API; update frontend to respect scopes.

---

### 3. Lifecycle Engine

**Current:** `employee_lifecycle_events` table in migration 000008 with event_type, effective_date, reason, changed_by fields.

**Missing:**
- Frontend timeline UI
- Typed event constants (EmployeeCreated, OnboardingStarted, Joined, ProbationStarted, etc.)
- Lifecycle-driven automation (e.g. probation end → trigger confirmation workflow)
- Connection between lifecycle events and other modules

**Gap:** DB table exists but is disconnected; no automation, no UI.

**Action:** Build lifecycle event service; implement timeline component; wire lifecycle to probation/confirmation/exit workflows.

---

### 4. Onboarding Engine

**Current:** Templates, tasks, checklists, instances, employee tasks all have DB tables. Basic UI exists.

**Missing:**
- Backend APIs for template CRUD
- Backend APIs for task management
- Onboarding instance creation on employee creation
- Task completion tracking
- Document upload linked to checklist
- Progress tracking dashboard
- Bulk onboarding trigger

**Gap:** DB schema is good; backend and frontend are skeletal.

**Action:** Complete onboarding service, REST APIs, and rich frontend for template management and progress tracking.

---

### 5. Bulk Import Engine

**Current:** `import_batches` table exists. `BulkImportWizard.tsx` UI wizard skeleton exists.

**Missing:**
- Backend import service
- File parsing (CSV/Excel)
- Column mapping persistence
- Row-level validation
- Duplicate detection logic
- Background job processing
- Import history API
- Error report download
- Template download endpoint
- Retry failed rows

**Gap:** Frontend wizard is UI-only; no backend processing exists at all.

**Action:** Build Go import service with file parsing, validation pipeline, background worker, and import history.

---

### 6. Documents

**Current:** `employee_documents` table linked to onboarding instances.

**Missing:**
- Standalone document management (documents outside onboarding)
- Document type configuration
- Document verification workflow
- Document expiry tracking
- Access control on sensitive documents (e.g. salary documents)
- Document request workflow
- File storage abstraction (local/S3)

**Gap:** Documents are onboarding-scoped only; not a standalone engine.

**Action:** Build a document service that's reusable across onboarding, lifecycle, and payroll.

---

### 7. Attendance

**Current:** `attendance_logs`, `shifts`, `holidays`, `regularization_requests` tables. Basic attendance UI.

**Missing:**
- Raw biometric log table (separate from processed logs)
- AttendanceProvider interface
- ESSL adapter
- Attendance processing pipeline
- OD request/approval
- WFH request/approval
- Comp-off earn/approve/use
- LOP calculation
- Late/early tracking
- Reprocessing capability

**Gap:** Basic log table exists; entire processing pipeline and Indian-specific types are missing.

**Action:** Major attendance engine upgrade; introduce raw log → process pipeline; build OD/WFH/Comp-off as first-class entities.

---

### 8. Leave

**Current:** `leave_types`, `leave_requests`, `leave_allocations`, `leave_balances` tables.

**Missing:**
- Configurable accrual rules
- Carry-forward configuration
- Sandwich rule enforcement
- Half-day leave
- LOP calculation
- Leave impact on payroll integration
- Leave calendar view
- Maternity/Paternity leave as distinct types

**Gap:** Table structure exists but leave engine is not configurable; accrual/carry-forward not implemented.

**Action:** Build configurable leave policy engine; implement accrual jobs; connect LOP to payroll.

---

### 9. Payroll

**Current:** `salary_components`, `salary_structures`, `employee_salaries`, `payroll_runs`, `payslips` tables. Basic payroll UI.

**Missing:**
- LOP deduction integration
- Advance deduction
- Arrears
- Payroll lock/finalization
- Payroll variance analysis
- Payroll approval workflow
- Payslip PDF generation
- PF/ESIC calculation (fields exist, calculation missing)
- TDS basic calculation

**Gap:** Data model is reasonable; calculation engine and controls are missing.

**Action:** Build payroll calculation service; implement LOP + advance integration; add controls (lock, validate, approve, publish).

---

### 10. Authorization / Data Scopes

**Current:** JWT carries roles array. Go middleware checks role only.

**Missing:**
- Permission registry
- Data scope model
- Scope enforcement middleware
- Per-API permission annotation
- Scope-based query filtering in repositories

**Gap:** The entire data scope layer is absent. A manager can currently query all employees.

**Action:** Design and implement the scope system as a platform service before other features are built (Sprint 1).

---

### 11. Notification Center

**Current:** None.

**Missing:** Everything — in-app notifications, email service, notification types, notification preferences.

**Action:** Build notification service as background infrastructure; start with critical notifications (leave approval, payroll published, probation due).

---

### 12. Reports

**Current:** Basic charts in dashboard using Recharts. No filterable report engine.

**Missing:**
- Report definitions
- Dynamic filters
- Data aggregation layer
- Saved report configurations
- Export (CSV/Excel)
- Standard report templates

**Action:** Build report service with pluggable report definitions; standard templates for headcount, attendance, leave, payroll.
