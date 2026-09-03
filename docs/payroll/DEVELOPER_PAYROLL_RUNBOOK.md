# Developer Payroll Runbook

This operational runbook explains how to run, test, and verify the HRMS Payroll module from a clean environment.

---

## 1. Prerequisites & Environment Setup

Before executing payroll, ensure PostgreSQL and Go are available:
- **PostgreSQL Database**: Default local port `5433` (or standard `5432`). Database user `hrms_user`, database `hrms_db`.
- **Backend API**: Runs on `http://localhost:8080/api/v1`.

### Start Environment & Reset Database
To start from a clean state and apply all migrations:
```bash
./scripts/reset-db.sh
./scripts/start-fresh.sh
```

---

## 2. Seed Master Data & Test Employees

Seed 50 test employees (`TEST_EMP_001` through `TEST_EMP_050`), organization structure, departments, designations, locations, and demo credentials (`hr@company.com` / `hr123`):

```bash
./scripts/seed-50-employees.sh --reset
```

---

## 3. Seed Payroll Test Data

Seed salary structures, attendance records, approved leave, LOP days, and salary advances for the target period (e.g. `09/2026`):

```bash
./scripts/seed-payroll-test-data.sh --reset --month 9 --year 2026
```

---

## 4. Run Payroll Readiness Check

Query the Payroll Readiness API to verify if the period is ready for processing:

```bash
curl -s -X GET "http://localhost:8080/api/v1/payroll/readiness?month=9&year=2026" \
  -H "Authorization: Bearer <HR_ADMIN_JWT_TOKEN>"
```

**Expected Readiness Response**:
```json
{
  "success": true,
  "data": {
    "ready": true,
    "month": 9,
    "year": 2026,
    "errors": [],
    "warnings": [],
    "statistics": {
      "active_employees": 50,
      "configured_salaries": 50,
      "total_attendance_records": 1500,
      "validated_attendance": 1500,
      "pending_attendance": 0,
      "approved_leaves": 10,
      "active_advances_count": 5
    }
  }
}
```

---

## 5. Execute Payroll Calculation

Process payroll for the target period. This generates individual employee payslips and aggregates totals:

```bash
curl -s -X POST "http://localhost:8080/api/v1/payroll/runs/process" \
  -H "Authorization: Bearer <HR_ADMIN_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"month": 9, "year": 2026}'
```

---

## 6. Lifecycle State Machine Transitions

Transition the payroll batch through its lifecycle states:

```bash
# 1. Validate
curl -X POST "http://localhost:8080/api/v1/payroll/runs/<RUN_ID>/transition" \
  -H "Authorization: Bearer <HR_ADMIN_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"action":"VALIDATE"}'

# 2. Approve
curl -X POST "http://localhost:8080/api/v1/payroll/runs/<RUN_ID>/transition" \
  -H "Authorization: Bearer <HR_ADMIN_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"action":"APPROVE"}'

# 3. Lock
curl -X POST "http://localhost:8080/api/v1/payroll/runs/<RUN_ID>/transition" \
  -H "Authorization: Bearer <HR_ADMIN_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"action":"LOCK"}'

# 4. Publish
curl -X POST "http://localhost:8080/api/v1/payroll/runs/<RUN_ID>/transition" \
  -H "Authorization: Bearer <HR_ADMIN_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"action":"PUBLISH"}'
```

---

## 7. Single-Command End-to-End Test Execution

To execute the entire end-to-end setup, readiness check, batch processing, reconciliation, and security suite in a single command:

```bash
./scripts/payroll-e2e.sh --reset
```

View the generated reports at:
- `tmp/payroll-test-report.json`
- `tmp/payroll-test-report.md`
