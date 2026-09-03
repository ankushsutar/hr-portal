# Payroll Test Matrix

This matrix documents the test groups, test cases, inputs, expected outcomes, and security rules verified across the HRMS Payroll Engine.

---

## Functional & System Test Cases

| ID | Test Group | Test Case Description | Test Input / Precondition | Expected Result | Automated Test? |
|----|------------|-----------------------|---------------------------|-----------------|-----------------|
| `TC-PAY-01` | Readiness Guard | Process payroll with unvalidated attendance | 1 attendance record marked `TO_VALIDATE` | Readiness returns `ready: false`. Processing blocked with HTTP 400. | Yes (`payroll-e2e.sh`) |
| `TC-PAY-02` | Readiness Guard | Readiness check with 100% validated attendance | All attendance records `VALIDATED` | Readiness returns `ready: true`, zero blocking errors. | Yes (`payroll-e2e.sh`) |
| `TC-PAY-03` | Calculation Engine | Batch process payroll | 50 active test employees | 50 `payslips` rows inserted into DB. `payroll_runs` totals updated. | Yes (`payroll-e2e.sh`) |
| `TC-PAY-04` | LOP Deduction | Calculate Loss-of-Pay for unapproved absence | 2 days `ABSENT` on TEST_EMP_036 | LOP deduction = `(Gross / 30) * 2`. Reflected on payslip. | Yes (`payroll-e2e.sh`) |
| `TC-PAY-05` | Advance Recovery | Deduct active salary advance | ₹15,000 advance on TEST_EMP_043 | Advance deducted on payslip; advance status updated to `DEDUCTED`. | Yes (`payroll-e2e.sh`) |
| `TC-PAY-06` | Reconciliation | Aggregate mathematical reconciliation | 50 generated payslips | `SUM(payslips.net_pay) == payroll_runs.total_net_pay`. | Yes (`payroll-e2e.sh`) |
| `TC-PAY-07` | State Machine | Valid lifecycle state transition | Action: `APPROVE` on `VALIDATED` run | Status transitions to `APPROVED`. `approved_by` set. | Yes (`payroll-e2e.sh`) |
| `TC-PAY-08` | State Machine | Valid lifecycle lock transition | Action: `LOCK` on `APPROVED` run | Status transitions to `LOCKED`. `locked_at` set. | Yes (`payroll-e2e.sh`) |
| `TC-PAY-09` | State Machine | Immutability protection on locked run | Action: `VALIDATE` on `LOCKED` run | Rejected with HTTP 400. Locked state preserved. | Yes (`payroll-e2e.sh`) |
| `TC-PAY-10` | State Machine | Publish payroll & payslips | Action: `PUBLISH` on `LOCKED` run | Status transitions to `PUBLISHED`. All payslips marked `PUBLISHED`. | Yes (`payroll-e2e.sh`) |
| `TC-PAY-11` | Security & RBAC | Process payroll as standard employee | JWT claims `role = EMPLOYEE` | Rejected with HTTP 403 Forbidden. | Yes (`payroll-e2e.sh`) |
| `TC-PAY-12` | Security & RBAC | Readiness check as standard employee | JWT claims `role = EMPLOYEE` | Rejected with HTTP 403 Forbidden. | Yes (`payroll-e2e.sh`) |
