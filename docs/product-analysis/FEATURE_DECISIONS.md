# Feature Decisions Register

> Every feature discussed during Sprint 0 discovery receives an explicit decision here.
> This register is the authoritative source for what we build and why.

---

## Decision Legend

| Decision | Meaning |
|---|---|
| **BUILD** | Implement in the assigned phase |
| **BUILD LATER** | Confirmed needed, but deferred |
| **CONFIGURE** | Exists; needs to become configuration-driven |
| **INTEGRATE** | External system required |
| **RESEARCH** | Needs investigation before deciding |
| **REJECT** | Not relevant — explicitly declined |

---

## P0 — Phase 1 (September 2026)

### FD-001 — Employee Master (Upgrade)
- **Source:** Existing system + Horilla benchmark
- **Business problem:** Current employee record is too sparse for production HR operations
- **Our requirement:** Rich profile with personal, professional, bank, statutory, emergency contact, work info, and document sections
- **Priority:** P0
- **Decision:** BUILD
- **Phase:** Phase 1
- **Dependencies:** Department, Designation, Organization

### FD-002 — Employee Lifecycle Event Model
- **Source:** Gap analysis — missing from existing system
- **Business problem:** No traceable history of employee status changes (probation, confirmation, transfer, exit)
- **Our requirement:** Typed lifecycle events stored in an append-only table; drives timeline view
- **Priority:** P0
- **Decision:** BUILD
- **Phase:** Phase 1
- **Dependencies:** Employee Master

### FD-003 — Employee Lifecycle Timeline UI
- **Source:** Gap analysis — differentiation opportunity
- **Business problem:** HR cannot see at a glance what happened to an employee across their tenure
- **Our requirement:** Chronological timeline tab on employee profile showing all events with date, actor, reason
- **Priority:** P0
- **Decision:** BUILD
- **Phase:** Phase 1
- **Dependencies:** FD-002

### FD-004 — User Management (Upgrade)
- **Source:** Existing partial implementation
- **Business problem:** Cannot manage system users independently of employees
- **Our requirement:** Full user CRUD, invite, activate, suspend, role assignment, employee linking
- **Priority:** P0
- **Decision:** BUILD
- **Phase:** Phase 1
- **Dependencies:** RBAC

### FD-005 — RBAC (Role + Permission + Data Scope)
- **Source:** Gap analysis — existing system has roles but no data scopes
- **Business problem:** A manager can see all employees, not just their direct reports
- **Our requirement:** Three-layer authorization: Role + Permission + Data Scope (SELF, DIRECT_REPORTS, DEPARTMENT, ORGANIZATION, SALARY_ACCESS)
- **Priority:** P0
- **Decision:** BUILD
- **Phase:** Phase 1
- **Dependencies:** None

### FD-006 — Onboarding Templates (Mature)
- **Source:** Existing partial implementation (Sprint 0 work)
- **Business problem:** New employee onboarding is ad-hoc and inconsistent
- **Our requirement:** HR-configurable templates with tasks, document checklists, owner roles, due days
- **Priority:** P0
- **Decision:** BUILD (mature existing skeleton)
- **Phase:** Phase 1
- **Dependencies:** FD-001

### FD-007 — Onboarding Task Engine
- **Source:** Gap analysis
- **Business problem:** Tasks are defined but not tracked per employee instance
- **Our requirement:** Per-employee onboarding instance with task tracking, completion, comments, overdue detection
- **Priority:** P0
- **Decision:** BUILD
- **Phase:** Phase 1
- **Dependencies:** FD-006

### FD-008 — Bulk Import Engine
- **Source:** Existing partial implementation (BulkImportWizard skeleton)
- **Business problem:** Importing 50+ employees one-by-one is operationally infeasible
- **Our requirement:** Full import center: template download, CSV/Excel upload, column mapping, validation, duplicate detection, partial import, import history, error report, retry
- **Priority:** P0
- **Decision:** BUILD (complete existing skeleton)
- **Phase:** Phase 1
- **Dependencies:** FD-001

### FD-009 — Bulk User Provisioning
- **Source:** Gap analysis
- **Business problem:** After bulk import of employees, user accounts must be created for each
- **Our requirement:** Select employees → create user accounts → send email invitations in bulk
- **Priority:** P0
- **Decision:** BUILD
- **Phase:** Phase 1
- **Dependencies:** FD-004, FD-008

### FD-010 — Document Types & Checklist Engine
- **Source:** Gap analysis + Horilla pattern
- **Business problem:** Documents are tracked informally; no structured verification
- **Our requirement:** Configurable document types (PAN, Aadhaar, Bank, Education, etc.), per-employee document instances, upload, verification workflow, mandatory/optional flags
- **Priority:** P0
- **Decision:** BUILD
- **Phase:** Phase 1
- **Dependencies:** FD-001

### FD-011 — Probation Dashboard & Automation
- **Source:** Gap analysis
- **Business problem:** HR misses probation review dates leading to auto-confirmations or disputes
- **Our requirement:** Dashboard showing upcoming/overdue probation reviews (30/15/7 day buckets), automated reminders, confirmation workflow trigger
- **Priority:** P0
- **Decision:** BUILD
- **Phase:** Phase 1
- **Dependencies:** FD-002

### FD-012 — Confirmation Workflow
- **Source:** Gap analysis
- **Business problem:** No structured confirmation/extension/termination workflow post-probation
- **Our requirement:** Manager reviews → HR reviews → Approve/Extend/Terminate; configurable letter generation
- **Priority:** P0
- **Decision:** BUILD
- **Phase:** Phase 1
- **Dependencies:** FD-011

### FD-013 — Exit Management
- **Source:** Gap analysis
- **Business problem:** Employee exit involves multiple departments; no structured clearance process
- **Our requirement:** Resignation → Notice Period → Clearance (IT, Finance, HR, Admin) → Assets → Exit Interview → User Deactivation
- **Priority:** P0
- **Decision:** BUILD
- **Phase:** Phase 1
- **Dependencies:** FD-002, FD-004

### FD-014 — Attendance Provider Abstraction
- **Source:** Architecture requirement
- **Business problem:** Attendance data comes from ESSL biometrics, CSV, and manual entry — no unified model
- **Our requirement:** AttendanceProvider interface with implementations: Manual, CSV, ESSL, API
- **Priority:** P0
- **Decision:** BUILD
- **Phase:** Phase 1
- **Dependencies:** None

### FD-015 — ESSL Biometric Integration
- **Source:** Company requirement
- **Business problem:** Raw biometric data from ESSL devices must feed into the attendance system
- **Our requirement:** ESSL adapter implementing AttendanceProvider; sync raw logs; never overwrite; process into attendance transactions
- **Priority:** P0
- **Decision:** INTEGRATE
- **Phase:** Phase 1
- **Dependencies:** FD-014

### FD-016 — Attendance Processing Pipeline
- **Source:** Gap analysis
- **Business problem:** Raw clock events need to be normalized into daily attendance status
- **Our requirement:** RAW LOGS → NORMALIZE → TRANSACTION → DAILY STATUS → LOP feed → PAYROLL feed
- **Priority:** P0
- **Decision:** BUILD
- **Phase:** Phase 1
- **Dependencies:** FD-014

### FD-017 — Attendance Regularization
- **Source:** Existing basic table + gap analysis
- **Business problem:** Employees need to correct missed punches or wrong status
- **Our requirement:** Employee requests correction → Manager approves → Attendance updated
- **Priority:** P0
- **Decision:** BUILD
- **Phase:** Phase 1
- **Dependencies:** FD-016

### FD-018 — Attendance Reprocessing
- **Source:** Differentiation opportunity
- **Business problem:** When shift or policy changes, historical attendance needs reprocessing
- **Our requirement:** Admin can trigger reprocessing for employee/date/range; safe to run multiple times
- **Priority:** P0
- **Decision:** BUILD
- **Phase:** Phase 1
- **Dependencies:** FD-016

### FD-019 — OD Management
- **Source:** Indian HR requirement — missing from benchmark products
- **Business problem:** Employees on outdoor duty should not be marked absent
- **Our requirement:** OD request → Approval → Attendance marked as OD (not absent, not leave)
- **Priority:** P0
- **Decision:** BUILD
- **Phase:** Phase 1
- **Dependencies:** FD-016

### FD-020 — WFH Management
- **Source:** Indian HR requirement
- **Business problem:** WFH employees have different attendance handling
- **Our requirement:** WFH request → Approval → Daily limit enforcement → Attendance treated as present
- **Priority:** P0
- **Decision:** BUILD
- **Phase:** Phase 1
- **Dependencies:** FD-016

### FD-021 — Comp-off Management
- **Source:** Indian HR requirement
- **Business problem:** Employees who work on holidays/weekends earn compensatory off
- **Our requirement:** Work on holiday → Comp-off earned → Manager approves comp-off earn → Credit to balance → Employee uses comp-off → Expires after policy period
- **Priority:** P0
- **Decision:** BUILD
- **Phase:** Phase 1
- **Dependencies:** FD-016

### FD-022 — Leave Engine
- **Source:** Gap analysis
- **Business problem:** Leave is currently hardcoded; policy cannot change without developer intervention
- **Our requirement:** Configurable leave types, accrual rules, carry-forward, sandwich rule, half-day, LOP, approval workflow, calendar
- **Priority:** P0
- **Decision:** BUILD (full configuration-driven engine)
- **Phase:** Phase 1
- **Dependencies:** FD-014

### FD-023 — Payroll Part 1
- **Source:** Existing basic skeleton + upgrade requirement
- **Business problem:** Current payroll is too simple for production; no LOP integration, no statutory basics
- **Our requirement:** Salary structure → Earnings → LOP deduction → Advance deduction → Basic PF/ESIC → Payslip → Validation → Approval → Finalization
- **Priority:** P0
- **Decision:** BUILD (upgrade existing)
- **Phase:** Phase 1
- **Dependencies:** FD-022, FD-016

### FD-024 — Payroll Controls
- **Source:** Gap analysis
- **Business problem:** Payroll can be changed silently; no lock/audit
- **Our requirement:** Preview → Validation → Approval → Lock → Payslip publish; variance analysis; reversal workflow
- **Priority:** P0
- **Decision:** BUILD
- **Phase:** Phase 1
- **Dependencies:** FD-023

### FD-025 — Universal Approval Center
- **Source:** Gap analysis
- **Business problem:** Approvals are scattered per module; managers have no unified view
- **Our requirement:** Single approval inbox showing all pending requests (leave, attendance, regularization, exit, etc.) with Approve/Reject/Comment/Delegate
- **Priority:** P0
- **Decision:** BUILD (upgrade existing workflow inbox)
- **Phase:** Phase 1
- **Dependencies:** Workflow engine

### FD-026 — HR Task Center
- **Source:** Gap analysis — differentiation
- **Business problem:** HR has no single view of all their pending operational tasks
- **Our requirement:** Dashboard showing: probation reviews due, onboarding tasks overdue, documents pending, payroll validations, leave approvals
- **Priority:** P0
- **Decision:** BUILD
- **Phase:** Phase 1
- **Dependencies:** Multiple modules

### FD-027 — Notification Center
- **Source:** Gap analysis
- **Business problem:** No in-app notifications; users don't know when something requires their action
- **Our requirement:** In-app notification center with categories (Leave, Attendance, Payroll, Onboarding, etc.); email architecture (send but not receive)
- **Priority:** P0
- **Decision:** BUILD
- **Phase:** Phase 1
- **Dependencies:** Background job infrastructure

### FD-028 — Data Quality Center
- **Source:** Differentiation — no HRMS in benchmark has this
- **Business problem:** HR data degrades silently; missing managers, expired documents, missing PAN, duplicate emails
- **Our requirement:** Operational dashboard detecting data quality issues; click-through to fix
- **Priority:** P0
- **Decision:** BUILD
- **Phase:** Phase 1
- **Dependencies:** Employee, Documents, Payroll modules

### FD-029 — Reports Foundation
- **Source:** Existing basic reports + upgrade requirement
- **Business problem:** Reports are static; HR needs dynamic, filterable reports
- **Our requirement:** Report engine with filters, saved queries, export (CSV/Excel), standard templates for headcount, attendance, leave, payroll
- **Priority:** P0
- **Decision:** BUILD
- **Phase:** Phase 1
- **Dependencies:** All modules

---

## P1 — Phase 2 (December 2026)

### FD-030 — Performance Management
- **Decision:** BUILD LATER — Phase 2
- **Reason:** Core HR lifecycle (onboarding → attendance → payroll) must be stable first

### FD-031 — PIP (Performance Improvement Plan)
- **Decision:** BUILD LATER — Phase 2
- **Reason:** Depends on performance cycle infrastructure

### FD-032 — Skills Matrix
- **Decision:** BUILD LATER — Phase 2
- **Reason:** Useful for workforce planning; not critical for Phase 1 operations

### FD-033 — Indian Tax / New Regime
- **Decision:** BUILD LATER — Phase 2
- **Reason:** Payroll Part 1 (basic structure) first; Indian statutory in Phase 2

### FD-034 — Payroll Statutory (PF, ESIC, PT)
- **Decision:** BUILD LATER — Phase 2
- **Reason:** Phase 1 payroll includes basic PF/ESIC fields; full statutory calculation in Phase 2

### FD-035 — Leave Encashment
- **Decision:** BUILD LATER — Phase 2
- **Reason:** Requires mature leave engine; Phase 2 after leave is stable

### FD-036 — HR Calendar
- **Decision:** BUILD LATER — Phase 2
- **Reason:** Useful but not operationally critical for Phase 1

### FD-037 — Global Search
- **Decision:** BUILD LATER — Phase 2
- **Reason:** Phase 1 table filters are sufficient; full-text search is a Phase 2 UX enhancement

### FD-038 — Org Chart
- **Decision:** BUILD LATER — Phase 2
- **Reason:** Visually useful but not operationally critical

### FD-039 — Feature Flags
- **Decision:** BUILD LATER — Phase 2
- **Reason:** Needed for controlled rollout of Phase 2+ features

---

## P2 — Phase 3 (January 2027)

### FD-040 — Recruitment Engine
- **Decision:** BUILD LATER — Phase 3
- **Reason:** Employee lifecycle management must be mature before managing candidate pipeline

### FD-041 — Transfer & Promotion
- **Decision:** BUILD LATER — Phase 3
- **Reason:** Effective-dating architecture needed; builds on stable employee lifecycle

### FD-042 — Asset Management (Basic)
- **Decision:** BUILD LATER — Phase 3 (integrate with onboarding/exit only initially)
- **Reason:** Asset tracking is useful but not blocking core HR operations

### FD-043 — Scheduled Reports
- **Decision:** BUILD LATER — Phase 3
- **Reason:** Manual export sufficient for Phase 1

---

## REJECT

### FD-050 — Help Desk
- **Decision:** REJECT
- **Reason:** Not relevant to core HR operations; employees can contact HR through existing channels

### FD-051 — Multi-Currency Payroll
- **Decision:** REJECT
- **Reason:** India-only operations; single currency

### FD-052 — SSO / OAuth
- **Decision:** REJECT (short-term)
- **Reason:** Email+password auth sufficient for now; re-evaluate at scale

### FD-053 — 360-Degree Feedback (full)
- **Decision:** RESEARCH
- **Reason:** Manager feedback in performance review is sufficient; 360 adds complexity without clear ROI for Phase 2

### FD-054 — CRM Integration
- **Decision:** REJECT
- **Reason:** Out of scope for HRMS

### FD-055 — Mobile App (native)
- **Decision:** REJECT
- **Reason:** Mobile-responsive web is sufficient; native app is a future phase

### FD-056 — Payroll Reversal
- **Decision:** BUILD LATER — Phase 2
- **Reason:** Finalization + lock in Phase 1; reversal workflow in Phase 2 after payroll is stable

### FD-057 — Document Versioning
- **Decision:** BUILD LATER — Phase 3
- **Reason:** Document upload and verification sufficient for Phase 1; versioning is a nice-to-have
