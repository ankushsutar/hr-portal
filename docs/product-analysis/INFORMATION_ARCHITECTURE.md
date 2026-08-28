# Information Architecture

> Final navigation structure for our HRMS.
> Designed around Employee Lifecycle as the organizing principle, not isolated modules.
> Derived from gap analysis, benchmark research, and Phase 1–3 roadmap.

---

## Navigation Philosophy

The navigation is organized from the **employee's perspective inward**:

1. **My Workspace** — Employee self-service (every user)
2. **People** — HR manages employee lifecycle end-to-end
3. **Attendance** — Daily attendance operations
4. **Leave** — Leave management
5. **Payroll** — Payroll and compensation
6. **Performance** — Performance management (Phase 2)
7. **Skills** — Workforce capability (Phase 2)
8. **Recruitment** — Hiring pipeline (Phase 3)
9. **Reports** — Cross-module reporting
10. **Administration** — System configuration and user management

---

## Full Navigation Structure

```
Dashboard
  ↳ KPI cards (headcount, new joiners, pending approvals, attendance today)
  ↳ Operational alerts (probation due, document pending, payroll pending)
  ↳ Quick actions
  ↳ HR Task Center widget

──────────────────────────────────────────

My Workspace                            [ALL USERS]
  ├── My Profile
  ├── My Attendance
  │     ├── Daily status
  │     ├── WFH Request
  │     └── OD Request
  ├── My Leave
  │     ├── Apply Leave
  │     ├── Leave Balance
  │     └── Leave History
  ├── My Requests
  │     └── Attendance Regularization
  ├── My Payslips
  ├── My Performance                    [Phase 2]
  └── My Documents

──────────────────────────────────────────

People                                  [HR_ADMIN, HR_MANAGER]
  ├── Employees
  │     ├── All Employees (list + filters + bulk ops)
  │     ├── Add Employee
  │     ├── Bulk Import
  │     └── Data Quality
  ├── Onboarding
  │     ├── Templates
  │     ├── Active Onboardings
  │     └── Document Verification
  ├── Probation
  │     ├── Probation Dashboard (30/15/7 day buckets)
  │     └── Pending Reviews
  ├── Confirmation
  │     └── Pending Confirmations
  ├── Transfer                          [Phase 3]
  ├── Promotion                         [Phase 3]
  └── Exit
        ├── Resignations
        ├── Clearance
        └── Exit Interview

──────────────────────────────────────────

Attendance                              [HR_ADMIN, MANAGER]
  ├── Daily Attendance
  ├── Regularization
  │     ├── Pending
  │     └── History
  ├── OD (Outdoor Duty)
  ├── WFH
  ├── Comp-off
  ├── Shifts
  │     ├── Shift Master
  │     └── Employee Shift Assignment
  ├── Holidays
  └── Settings
        ├── Providers (Manual, CSV, ESSL)
        └── Processing Rules

──────────────────────────────────────────

Leave                                   [HR_ADMIN, MANAGER]
  ├── Leave Requests
  │     ├── Pending Approval
  │     └── All Requests
  ├── Leave Balances
  │     └── Balance Summary (by employee)
  ├── Leave Calendar
  └── Leave Policies
        ├── Leave Types
        └── Policy Configuration

──────────────────────────────────────────

Payroll                                 [PAYROLL_ADMIN, HR_ADMIN]
  ├── Payroll Runs
  │     ├── Run Payroll
  │     ├── Payroll Preview
  │     └── History
  ├── Salary
  │     ├── Components
  │     ├── Structures
  │     └── Employee Assignments
  ├── Advances
  ├── Arrears
  ├── Tax                               [Phase 2]
  │     ├── TDS Configuration
  │     ├── New Tax Regime
  │     └── Employee Declarations
  └── Payslips
        ├── Published Payslips
        └── Bulk Download

──────────────────────────────────────────

Performance                             [Phase 2]
  ├── Cycles
  ├── Goals
  ├── Reviews
  └── PIP

──────────────────────────────────────────

Skills                                  [Phase 2]
  ├── Skills Master
  ├── Employee Skills
  ├── Skill Matrix
  └── Skill Gaps

──────────────────────────────────────────

Recruitment                             [Phase 3]
  ├── Requisitions
  ├── Job Openings
  ├── Candidates
  ├── Interviews
  └── Offers

──────────────────────────────────────────

Reports
  ├── Employee
  │     ├── Headcount
  │     ├── New Joiners
  │     └── Exits & Attrition
  ├── Attendance
  │     ├── Daily Report
  │     ├── Monthly Report
  │     └── Late/Absent Report
  ├── Leave
  │     ├── Balance Report
  │     └── LOP Report
  ├── Payroll
  │     ├── Payroll Register
  │     ├── Earnings Report
  │     └── Deduction Report
  └── Custom Reports                    [Phase 2]

──────────────────────────────────────────

Administration                          [SUPER_ADMIN, HR_ADMIN]
  ├── Users
  │     ├── All Users
  │     ├── Invite User
  │     └── Roles & Permissions
  ├── Organization
  │     ├── Departments
  │     ├── Designations
  │     ├── Locations
  │     └── Grades
  ├── Workflow
  │     ├── Approval Workflows
  │     └── Notification Rules
  ├── Documents
  │     └── Document Types
  ├── Imports
  │     └── Import History
  ├── Audit
  │     └── Audit Log
  └── Configuration
        ├── System Settings
        └── Feature Flags            [Phase 2]
```

---

## Role-to-Navigation Mapping

| Navigation Area | SUPER_ADMIN | HR_ADMIN | HR_MANAGER | MANAGER | EMPLOYEE | PAYROLL_ADMIN |
|---|---|---|---|---|---|---|
| Dashboard | Full | Full | Team | Team | Self | Payroll KPIs |
| My Workspace | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| People | ✅ | ✅ | View only | Direct reports | ❌ | ❌ |
| Attendance | ✅ | ✅ | ✅ | Direct reports | ❌ | ❌ |
| Leave | ✅ | ✅ | ✅ | Direct reports | ❌ | ❌ |
| Payroll | ✅ | View | ❌ | ❌ | ❌ | ✅ |
| Performance | ✅ | ✅ | ✅ | Team | Self | ❌ |
| Skills | ✅ | ✅ | View | View | Self | ❌ |
| Recruitment | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Reports | ✅ | ✅ | Team | Team | ❌ | Payroll |
| Administration | ✅ | Partial | ❌ | ❌ | ❌ | ❌ |

---

## Page Templates

### List Page
```
[Page Title]          [Primary Action Button]
[Filter Bar] [Search] [Bulk Actions Dropdown]
[Table: sortable columns, inline status badges, row actions]
[Pagination]
```

### Detail Page
```
[Back] [Employee Name] [Status Badge]    [Action Buttons]
[Summary Card: photo, key info]
[Tabs: Overview | Work Info | Documents | Timeline | Attendance | Leave | Payroll | Performance]
[Tab Content]
```

### Workflow Page
```
[Request Title] [Status Badge]
[Timeline: steps with status]
[Request Details Card]
[Approvers Card]
[Comments Thread]
[Action Buttons: Approve | Reject | Send Back | Delegate]
[Audit Trail]
```

### Dashboard
```
[KPI Cards Row]
[Operational Alerts]
[Task Center Widget]
[Charts Row]
[Recent Activity]
```

---

## URL Structure

```
/dashboard
/my/*
  /my/profile
  /my/attendance
  /my/leave
  /my/payslips
  /my/documents

/people/*
  /people/employees
  /people/employees/:id
  /people/onboarding
  /people/probation
  /people/confirmation
  /people/exit

/attendance/*
  /attendance
  /attendance/regularization
  /attendance/od
  /attendance/wfh
  /attendance/comp-off
  /attendance/shifts
  /attendance/holidays

/leave/*
  /leave/requests
  /leave/balances
  /leave/calendar
  /leave/policies

/payroll/*
  /payroll/runs
  /payroll/salary
  /payroll/advances
  /payroll/arrears
  /payroll/payslips

/reports/*

/administration/*
  /administration/users
  /administration/organization
  /administration/workflow
  /administration/documents
  /administration/imports
  /administration/audit
  /administration/configuration
```
