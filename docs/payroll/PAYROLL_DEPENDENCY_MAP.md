# Payroll Dependency Map

This document defines the strict relational dependency graph and status rules required before payroll can be processed in the HRMS application.

---

## Relational Dependency Graph

```text
Organization & Department
           ↓
        Employee
           ↓
  Salary Structure (employee_salary_structures)
           ↓
Attendance Records (attendance_daily_status)
           ↓
Attendance Validation Guard (100% VALIDATED required)
           ↓
Approved Leave / LOP Calculation
           ↓
Salary Advances (payroll_advances)
           ↓
  Payroll Run (payroll_runs)
           ↓
Individual Payslips (payslips)
```

---

## Detailed Prerequisite Rules & Table Status Matrix

| Table Name | Prerequisite Entity | Status / Condition Required | Hard Blocking? | Default Behavior if Missing |
|------------|---------------------|-----------------------------|----------------|-----------------------------|
| `organizations` | None | Must exist | Yes | System initialization fails |
| `employees` | Organization, Department | `status = 'ACTIVE'` | Yes | Non-active employees skipped |
| `employee_salary_structures` | Employee | `is_active = true` | Warning | Falls back to default base rate (₹60,000) |
| `attendance_daily_status` | Employee | **100% records `validation_status = 'VALIDATED'`** | **YES** | **PAYROLL BLOCKED** (`HTTP 400`) |
| `leave_requests` | Employee | `status = 'APPROVED'` | No | Unapproved leave ignored |
| `payroll_advances` | Employee | `status IN ('PENDING', 'APPROVED')` | No | Automatically deducted & marked `DEDUCTED` |
| `payroll_runs` | Organization | `status NOT IN ('LOCKED', 'PUBLISHED')` | Yes | Reprocessing blocked for locked periods |
| `payslips` | Payroll Run, Employee | Generated during `process` | No | Overwritten on re-processing |

---

## Attendance Dependency Guard Detail

The backend strictly enforces the attendance validation constraint via SQL:

```sql
SELECT COUNT(*) 
FROM attendance_daily_status 
WHERE EXTRACT(MONTH FROM date) = $1 
  AND EXTRACT(YEAR FROM date) = $2 
  AND validation_status IN ('TO_VALIDATE', 'OT_PENDING')
```

If the count of unvalidated records is `> 0`, the readiness API returns `ready: false` and the processing endpoint aborts execution with an actionable error payload.
