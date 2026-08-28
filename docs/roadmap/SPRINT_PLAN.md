# HRMS Sprint Plan

> **Rule:** Every sprint delivers a vertical slice — UI + API + DB + Permissions + Tests.
> No sprint is complete if only the UI or only the backend is implemented.

---

## Sprint 0 — Product Audit & Architecture ✅ COMPLETE

**Delivered:**
- Existing system audit
- Horilla benchmark (HORILLA_INSIGHTS.md)
- HRMS benchmark matrix (HRMS_BENCHMARK.md)
- Feature decisions register (FEATURE_DECISIONS.md)
- Gap analysis (GAP_ANALYSIS.md)
- Information architecture (INFORMATION_ARCHITECTURE.md)
- DESIGN.md (visual source of truth)
- HRMS Roadmap + Sprint Plan

---

## Sprint 1 — Identity, Authorization & Data Scopes
**Duration:** 2 weeks | **Goal:** Rock-solid security foundation

### Business Outcome
Every API request is authorized at role + permission + data-scope level. HR cannot accidentally see another department's payroll. Managers see only their team.

### Features
- Role + Permission registry
- Data Scope model: SELF, DIRECT_REPORTS, DEPARTMENT, ORGANIZATION, SALARY_ACCESS
- Scope enforcement middleware (Go)
- Scope-aware repository query helpers
- Password reset flow (email token)
- Session revocation (JWT denylist in Redis/DB)
- User invitation with email token

### Frontend
- Users management page (enhance existing)
- Roles & Permissions configuration page
- Password reset flow pages
- User invitation flow

### Backend
- `internal/auth`: Add scope middleware, permission checker
- `internal/user`: Add invitation, password reset, session management

### Database
```sql
ALTER TABLE users ADD COLUMN invited_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN invitation_token VARCHAR(255);
ALTER TABLE users ADD COLUMN invitation_expires_at TIMESTAMPTZ;

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL, -- READ, WRITE, APPROVE, EXPORT
  scope VARCHAR(50) NOT NULL,   -- SELF, DIRECT_REPORTS, DEPARTMENT, ORGANIZATION
  UNIQUE(module, action, scope)
);

CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL
);
```

### Acceptance Criteria
- [ ] A manager cannot query employees outside their team
- [ ] Payroll API returns 403 for non-payroll roles
- [ ] Invited user receives email with login link
- [ ] Token expires after 48h
- [ ] Session can be revoked from admin UI

---

## Sprint 2 — Employee Master (Rich Profile)
**Duration:** 2 weeks | **Goal:** Production-grade employee record

### Business Outcome
HR can create, view, and update a complete employee profile including personal, professional, bank, and statutory information.

### Features
- Rich employee profile form (all fields)
- Employee profile view (tabbed)
- Employee list with search, filters, bulk actions
- Employee export (CSV)
- Designation management

### Frontend
- `features/employees/EmployeeList.tsx` — TanStack Table, filters, bulk select
- `features/employees/EmployeeProfile.tsx` — tabbed layout
- `features/employees/EmployeeForm.tsx` — create/edit form
- `features/organization/Designations.tsx`

### Backend
- Extend employee service with all profile fields
- Add designation CRUD
- Add employee list filtering (department, status, joining date range)
- Add employee export endpoint

### Database
```sql
ALTER TABLE employees ADD COLUMN middle_name VARCHAR(100);
ALTER TABLE employees ADD COLUMN gender VARCHAR(20);
ALTER TABLE employees ADD COLUMN date_of_birth DATE;
ALTER TABLE employees ADD COLUMN blood_group VARCHAR(10);
ALTER TABLE employees ADD COLUMN nationality VARCHAR(100);
ALTER TABLE employees ADD COLUMN marital_status VARCHAR(50);
ALTER TABLE employees ADD COLUMN personal_email VARCHAR(255);
ALTER TABLE employees ADD COLUMN personal_phone VARCHAR(20);
ALTER TABLE employees ADD COLUMN work_phone VARCHAR(20);
ALTER TABLE employees ADD COLUMN employment_type VARCHAR(50) DEFAULT 'PERMANENT';
ALTER TABLE employees ADD COLUMN work_location VARCHAR(255);
ALTER TABLE employees ADD COLUMN probation_end_date DATE;
ALTER TABLE employees ADD COLUMN confirmation_date DATE;
ALTER TABLE employees ADD COLUMN notice_period_days INT DEFAULT 30;

CREATE TABLE designations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  grade VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE employees ADD COLUMN designation_id UUID REFERENCES designations(id);
```

### Acceptance Criteria
- [ ] All profile fields save and load correctly
- [ ] Employee list supports filter by department, status, joining month
- [ ] Bulk export generates valid CSV
- [ ] Non-HR roles cannot edit employee records

---

## Sprint 3 — Employee Lifecycle Engine
**Duration:** 2 weeks | **Goal:** Traceable lifecycle from join to exit

### Business Outcome
Every employee status change is recorded. HR has a timeline view of each employee's journey.

### Features
- Lifecycle event model with typed events
- Employee timeline UI on profile
- Probation dashboard (30/15/7 day buckets)
- Probation review initiation

### Frontend
- Timeline tab on employee profile
- `features/lifecycle/ProbationDashboard.tsx`

### Backend
- `internal/lifecycle`: typed event service
- Probation query service (upcoming reviews)
- Lifecycle event API

### Database
```sql
-- Ensure lifecycle events table is typed
ALTER TABLE employee_lifecycle_events ADD COLUMN IF NOT EXISTS
  event_type VARCHAR(100) NOT NULL DEFAULT 'JOINED';
-- event_type values: JOINED, PROBATION_STARTED, PROBATION_EXTENDED,
--   CONFIRMED, TRANSFERRED, PROMOTED, RESIGNED, LAST_WORKING_DAY, EXITED, TERMINATED

ALTER TABLE employee_lifecycle_events ADD COLUMN IF NOT EXISTS
  previous_value JSONB;
ALTER TABLE employee_lifecycle_events ADD COLUMN IF NOT EXISTS
  new_value JSONB;
```

### Acceptance Criteria
- [ ] Lifecycle events are recorded on employee creation
- [ ] Timeline tab shows all events chronologically
- [ ] Probation dashboard shows correct bucket counts
- [ ] Clicking a probation review initiates the confirmation workflow

---

## Sprint 4 — Onboarding Engine (Complete)
**Duration:** 2 weeks | **Goal:** Configuration-driven onboarding

### Business Outcome
HR creates a template once. Every new hire gets an onboarding instance with tasks and a document checklist automatically.

### Features
- Onboarding template CRUD (complete API + UI)
- Task management per template (owner role, due days)
- Document checklist per template
- Onboarding instance creation on employee join
- Task completion tracking
- Onboarding progress dashboard

### Frontend
- `features/admin/OnboardingTemplates.tsx` (mature existing skeleton)
- `features/employees/onboarding/OnboardingDashboard.tsx`
- `features/employees/onboarding/OnboardingInstance.tsx`

### Backend
- Complete `internal/onboarding` service (template CRUD, task CRUD, instance management)
- Auto-create onboarding instance when employee is created
- Task completion API
- Progress calculation

### Acceptance Criteria
- [ ] HR can create/edit/delete onboarding templates
- [ ] Tasks have owner role, due days, mandatory flag
- [ ] Creating an employee auto-creates an onboarding instance
- [ ] Task owners can mark tasks complete
- [ ] Progress % shown on dashboard

---

## Sprint 5 — Bulk Import Engine (Complete)
**Duration:** 2 weeks | **Goal:** Import 500 employees in one operation

### Business Outcome
HR can upload an Excel/CSV file and import employees in bulk with validation, duplicate detection, and error reporting.

### Features
- Excel/CSV parsing
- Configurable column mapping
- Row-level validation
- Duplicate employee ID / email detection
- Background job processing
- Import history
- Error report download
- Template download endpoint
- Partial import (skip errors and continue)

### Frontend
- `features/import/BulkImportWizard.tsx` (complete existing skeleton)
- `features/import/ImportHistory.tsx`

### Backend
- `internal/import`: file parsing service
- Background worker for large imports
- Import batch status API
- Error report generation

### Database
```sql
-- Extend existing import_batches table
ALTER TABLE import_batches ADD COLUMN IF NOT EXISTS total_rows INT DEFAULT 0;
ALTER TABLE import_batches ADD COLUMN IF NOT EXISTS processed_rows INT DEFAULT 0;
ALTER TABLE import_batches ADD COLUMN IF NOT EXISTS failed_rows INT DEFAULT 0;
ALTER TABLE import_batches ADD COLUMN IF NOT EXISTS column_mapping JSONB;
ALTER TABLE import_batches ADD COLUMN IF NOT EXISTS error_report_url VARCHAR(500);

CREATE TABLE import_rows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
  row_number INT NOT NULL,
  raw_data JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  error_message TEXT,
  created_employee_id UUID REFERENCES employees(id)
);
```

### Acceptance Criteria
- [ ] Template CSV downloads with correct headers
- [ ] 500-row file processes without timeout (background job)
- [ ] Duplicate emails are detected and reported per row
- [ ] Error report is downloadable as CSV
- [ ] Partial import: valid rows imported, invalid rows skipped

---

## Sprint 6 — Document Engine
**Duration:** 1 week | **Goal:** Structured document management

### Business Outcome
HR can define document types, request documents from employees, and verify them. Documents are linked to employee profiles, not just onboarding.

### Features
- Document type master
- Employee document upload
- Document verification workflow
- Document status tracking (Submitted, Approved, Rejected)
- Sensitive document access control

### Backend + DB
```sql
CREATE TABLE document_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  is_mandatory BOOLEAN DEFAULT TRUE,
  has_expiry BOOLEAN DEFAULT FALSE,
  requires_verification BOOLEAN DEFAULT TRUE,
  access_scope VARCHAR(50) DEFAULT 'HR' -- HR, PAYROLL, ALL
);

CREATE TABLE employee_document_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  document_type_id UUID NOT NULL REFERENCES document_types(id),
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'SUBMITTED',
  expiry_date DATE,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Acceptance Criteria
- [ ] HR can define document types with mandatory/optional flags
- [ ] Employees can upload documents from My Workspace
- [ ] HR can approve or reject with a reason
- [ ] Salary-sensitive docs hidden from non-payroll roles

---

## Sprint 7 — Confirmation & Exit Workflows
**Duration:** 2 weeks | **Goal:** Close the probation-to-exit loop

### Business Outcome
Probation reviews trigger structured confirmation workflows. Exits follow a clearance checklist.

### Features
- Confirmation workflow (Manager Review → HR Review → Approve/Extend/Terminate)
- Resignation submission
- Notice period tracking
- Clearance workflow (IT, Finance, HR, Admin)
- Exit interview record
- User account deactivation on exit
- Lifecycle event recording for all stages

### Acceptance Criteria
- [ ] Confirmation workflow routes through manager then HR
- [ ] Extend probation records new end date
- [ ] Resignation creates clearance tasks for each department
- [ ] User account deactivated on last working day

---

## Sprint 8 — Attendance Foundation
**Duration:** 2 weeks | **Goal:** Provider-abstracted attendance pipeline

### Business Outcome
Attendance is processed through a clean pipeline. Raw logs are preserved. ESSL data can be ingested.

### Features
- AttendanceProvider interface
- Manual punch (HR enters attendance)
- CSV import provider
- ESSL adapter (foundation — schema + sync mechanism)
- Raw log table (separate from processed)
- Processing pipeline: raw → normalize → daily status
- Late/Early detection

### Database
```sql
CREATE TABLE attendance_raw_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  provider VARCHAR(50) NOT NULL, -- MANUAL, CSV, ESSL, API
  punch_time TIMESTAMPTZ NOT NULL,
  punch_type VARCHAR(20), -- IN, OUT
  device_id VARCHAR(100),
  raw_payload JSONB,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Acceptance Criteria
- [ ] Raw logs are never modified after creation
- [ ] Processing creates/updates `attendance_logs` from raw logs
- [ ] Late detection compares against shift start time + grace period
- [ ] Manual punch creates a raw log entry

---

## Sprint 9 — OD, WFH, Comp-off & Regularization
**Duration:** 2 weeks | **Goal:** Indian attendance types as first-class entities

### Business Outcome
OD, WFH, and Comp-off are fully operational with request → approval → attendance update flows.

### Features
- OD request/approval → attendance marked as OD
- WFH request/approval with daily limit → attendance marked as WFH (present)
- Comp-off earn (work on holiday) → manager approval → credit to balance
- Comp-off use (apply leave) → use balance → expiry
- Attendance regularization (enhance existing)
- Reprocessing trigger (admin can reprocess a date range)

### Database
```sql
CREATE TABLE od_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  date DATE NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  workflow_instance_id UUID REFERENCES workflow_instances(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wfh_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(50) DEFAULT 'PENDING',
  workflow_instance_id UUID REFERENCES workflow_instances(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE comp_off_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  earned_date DATE NOT NULL,
  reason TEXT,
  credits NUMERIC(4,2) DEFAULT 1.0,
  used NUMERIC(4,2) DEFAULT 0,
  expires_at DATE,
  status VARCHAR(50) DEFAULT 'ACTIVE'
);
```

### Acceptance Criteria
- [ ] OD approved → attendance_logs updated to OD status
- [ ] WFH has daily limit per month (configurable)
- [ ] Comp-off credits appear in leave balance
- [ ] Comp-off expires after configured days
- [ ] Reprocessing re-runs pipeline without touching raw logs

---

## Sprint 10 — Leave Engine
**Duration:** 2 weeks | **Goal:** Fully configurable leave management

### Business Outcome
HR configures leave policies once. Leave accrues automatically. LOP feeds into payroll.

### Features
- Configurable leave types (accrual, carry-forward, sandwich, half-day, encashment flag)
- Leave balance calculation
- Leave request with approval
- Leave calendar view
- LOP calculation
- Leave impact on attendance status

### Database
```sql
ALTER TABLE leave_types ADD COLUMN accrual_frequency VARCHAR(50); -- MONTHLY, QUARTERLY, ANNUAL
ALTER TABLE leave_types ADD COLUMN accrual_days NUMERIC(4,2);
ALTER TABLE leave_types ADD COLUMN max_carry_forward NUMERIC(4,2) DEFAULT 0;
ALTER TABLE leave_types ADD COLUMN sandwich_rule BOOLEAN DEFAULT FALSE;
ALTER TABLE leave_types ADD COLUMN allow_half_day BOOLEAN DEFAULT FALSE;
ALTER TABLE leave_types ADD COLUMN encashable BOOLEAN DEFAULT FALSE;
ALTER TABLE leave_types ADD COLUMN max_continuous_days INT;
ALTER TABLE leave_types ADD COLUMN applicable_after_days INT DEFAULT 0;
```

### Acceptance Criteria
- [ ] Monthly accrual job runs at month end
- [ ] Carry-forward caps applied at year end
- [ ] Sandwich rule auto-counts intervening holidays as leave
- [ ] LOP days calculated and available for payroll
- [ ] Calendar shows team leave by month

---

## Sprint 11 — Payroll Part 1
**Duration:** 2 weeks | **Goal:** Production-grade payroll run

### Business Outcome
HR can run monthly payroll, integrate LOP and advances, generate payslips, and lock the run.

### Features
- Payroll run: DRAFT → PROCESSING → VALIDATED → APPROVED → LOCKED
- LOP deduction from attendance
- Advance deduction
- Salary component calculation
- Payroll validation report
- Variance analysis (vs last month)
- Payroll approval workflow
- Payslip generation (HTML → PDF)
- Payslip publish to employee
- Payroll lock (no edits after lock)

### Database
```sql
ALTER TABLE payroll_runs ADD COLUMN status VARCHAR(50) DEFAULT 'DRAFT';
-- DRAFT, PROCESSING, VALIDATED, APPROVED, LOCKED, PUBLISHED

ALTER TABLE payroll_runs ADD COLUMN approved_by UUID REFERENCES users(id);
ALTER TABLE payroll_runs ADD COLUMN approved_at TIMESTAMPTZ;
ALTER TABLE payroll_runs ADD COLUMN locked_at TIMESTAMPTZ;

CREATE TABLE payroll_advances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  amount NUMERIC(12,2) NOT NULL,
  reason TEXT,
  deduct_from_month INT,
  deduct_from_year INT,
  status VARCHAR(50) DEFAULT 'PENDING',
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Acceptance Criteria
- [ ] LOP days reduce net pay proportionally
- [ ] Advance deducted in specified month
- [ ] Variance report flags >10% change in any component
- [ ] Payslip published as PDF to employee's My Payslips
- [ ] Locked payroll cannot be edited

---

## Sprint 12 — Approval Center & HR Operations
**Duration:** 1 week | **Goal:** Unified operational center

### Features
- Universal Approval Center (all pending requests in one view)
- Filters: module, request type, employee, date, priority
- Bulk approve/reject with comment
- HR Task Center (actionable items dashboard)
- Notification Center (in-app notifications)
- Basic email notifications (leave approved, probation due, payroll published)

### Acceptance Criteria
- [ ] All pending approvals visible in one screen
- [ ] HR Task Center shows probation due, docs pending, payroll pending counts
- [ ] In-app notifications appear for key events
- [ ] Email sent on leave approval and payslip publish

---

## Sprint 13 — Data Quality Center & Reports
**Duration:** 1 week | **Goal:** Proactive HR data health

### Features
- Data Quality Center: detect missing manager, dept, shift, docs, bank details, PAN, duplicate emails
- Click-through to fix each issue
- Reports: Headcount, New Joiners, Exits, Attendance Monthly, Leave Balance, Payroll Register
- Export all reports to CSV

### Acceptance Criteria
- [ ] Data Quality Center shows correct counts for each issue type
- [ ] All standard reports load within 3 seconds for 1000 employees
- [ ] CSV export is valid and importable

---

## Sprint 14 — UAT & Bug Fixes
**Duration:** 2 weeks

### Business Scenarios to Test
- New employee creation → onboarding → probation → confirmation
- Bulk import 100 employees → provision users → send invitations
- Full attendance month: punch in/out, OD, WFH, regularization, LOP calculation
- Leave application → manager approval → balance update
- Payroll run: configure, process, validate, approve, lock, publish payslips
- Resignation → clearance → user deactivation → exit

---

## Sprint 15 — Performance & Phase 2 Prep (December 2026)

Topics: Performance cycles, Goals, KPIs, Self review, Manager review, PIP, Indian Statutory Payroll

*(Detailed sprint plan created at start of Phase 2)*

---

## Sprint 16+ — Phase 3 (January 2027)

Topics: Recruitment, Transfer, Promotion, Asset Management

*(Detailed sprint plan created at start of Phase 3)*

---

## Acceptance Criteria Template (All Sprints)

Every sprint must end with:
- [ ] Feature implemented end-to-end
- [ ] REST API implemented with validation
- [ ] Database migration applied and reviewed
- [ ] Permission model enforced at API layer
- [ ] Audit events recorded for all mutations
- [ ] Error states handled (400, 403, 404, 500)
- [ ] Empty/loading states in UI
- [ ] Responsive on mobile (My Workspace screens)
- [ ] Demo scenario documented and executable
