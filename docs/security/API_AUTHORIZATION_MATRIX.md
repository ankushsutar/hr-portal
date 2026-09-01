# API Authorization Matrix

This document defines the authorization requirements, required roles, data scopes, resource ownership rules, and field masking policies for every endpoint in the Enterprise HRMS API.

---

## 1. Authentication & System User APIs (`/api/v1/auth`, `/api/v1/users`)

| Endpoint | Method | Required Role | Data Scope | Ownership / Rule | Sensitive Fields |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `/api/v1/auth/login` | POST | Public | N/A | Public | Password |
| `/api/v1/auth/me` | GET | Authenticated | `SELF` | Self | Password hash |
| `/api/v1/users` | GET | `SUPER_ADMIN`, `HR_ADMIN` | `ORGANIZATION` | N/A | Password hash |
| `/api/v1/users` | POST | `SUPER_ADMIN` | `ORGANIZATION` | Admin only | Password hash |
| `/api/v1/users/:id/roles` | PATCH | `SUPER_ADMIN` | `ORGANIZATION` | Admin only | Roles |
| `/api/v1/users/:id/status` | PATCH | `SUPER_ADMIN`, `HR_ADMIN` | `ORGANIZATION` | Self modification prohibited | Account status |

---

## 2. Employee Directory & Profile APIs (`/api/v1/employees`)

| Endpoint | Method | Required Role | Data Scope | Ownership / Rule | Sensitive Fields |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `/api/v1/employees` | GET | Authenticated | `SELF` / `DIRECT_REPORTS` / `ORGANIZATION` | Filtered by scope | Personal/statutory stripped unless `HR_ADMIN` |
| `/api/v1/employees/:id` | GET | Authenticated | `SELF` / `DIRECT_REPORTS` / `ORGANIZATION` | Ownership check | PAN, Aadhaar, Bank details stripped unless `SALARY_ACCESS` |
| `/api/v1/employees` | POST | `HR_ADMIN`, `SUPER_ADMIN` | `ORGANIZATION` | HR only | Salary, statutory details |
| `/api/v1/employees/:id` | PATCH | `HR_ADMIN`, `SUPER_ADMIN`, `SELF` (limited) | `ORGANIZATION` / `SELF` | Self can only edit personal phone/address | Status, Designation, Manager, Salary |
| `/api/v1/employees/export` | GET | `HR_ADMIN`, `SUPER_ADMIN` | `ORGANIZATION` | HR export permission required | All personal & statutory details |

---

## 3. Workflow & Approvals APIs (`/api/v1/workflow`, `/api/v1/workflows`)

| Endpoint | Method | Required Role | Data Scope | Ownership / Rule | Sensitive Fields |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `/api/v1/workflow/tasks` | GET | Authenticated | `DIRECT_REPORTS` / `ORGANIZATION` | Assigned tasks / Team tasks | N/A |
| `/api/v1/workflow/tasks/:id/approve` | POST | Manager, HR, Admin | `DIRECT_REPORTS` / `ORGANIZATION` | **`requester != approver` (Strict)** | Approval notes |
| `/api/v1/workflow/tasks/:id/reject` | POST | Manager, HR, Admin | `DIRECT_REPORTS` / `ORGANIZATION` | **`requester != approver` (Strict)** | Rejection reason |
| `/api/v1/workflow/bulk-action` | POST | Manager, HR, Admin | `DIRECT_REPORTS` / `ORGANIZATION` | **`requester != approver` for every task** | Bulk approval IDs |

---

## 4. Leave Management APIs (`/api/v1/leave`)

| Endpoint | Method | Required Role | Data Scope | Ownership / Rule | Sensitive Fields |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `/api/v1/leave/applications` | GET | Authenticated | `SELF` / `DIRECT_REPORTS` / `ORGANIZATION` | Own or Team applications | Medical certificate |
| `/api/v1/leave/applications` | POST | Authenticated | `SELF` | Must be for self employee record | N/A |
| `/api/v1/leave/balances` | GET | Authenticated | `SELF` / `DIRECT_REPORTS` / `ORGANIZATION` | Own or Team balances | N/A |
| `/api/v1/leave/types` | GET | Authenticated | `ORGANIZATION` | All active leave types | N/A |

---

## 5. Attendance APIs (`/api/v1/attendance`)

| Endpoint | Method | Required Role | Data Scope | Ownership / Rule | Sensitive Fields |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `/api/v1/attendance/logs` | GET | Authenticated | `SELF` / `DIRECT_REPORTS` / `ORGANIZATION` | Own or Team logs | Biometric ID |
| `/api/v1/attendance/requests` | GET | Authenticated | `SELF` / `DIRECT_REPORTS` / `ORGANIZATION` | Own or Team requests | N/A |
| `/api/v1/attendance/regularization` | POST | Authenticated | `SELF` | Must belong to logged-in employee | Reason |
| `/api/v1/attendance/wfh` | POST | Authenticated | `SELF` | Must belong to logged-in employee | Reason |

---

## 6. Payroll APIs (`/api/v1/payroll`)

| Endpoint | Method | Required Role | Data Scope | Ownership / Rule | Sensitive Fields |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `/api/v1/payroll/runs` | GET / POST | `PAYROLL_ADMIN`, `SUPER_ADMIN` | `SALARY_ACCESS` | Payroll Admin only | Gross, Net Pay, Deductions |
| `/api/v1/payroll/my-payslips` | GET | Authenticated | `SELF` | Strictly authenticated user | Full Payslip Data |
| `/api/v1/payroll/payslips/:id` | GET | `PAYROLL_ADMIN` / Owner | `SALARY_ACCESS` / `SELF` | Owner or Payroll Admin | Full Payslip Data |

---

## 7. Document Management APIs (`/api/v1/documents`)

| Endpoint | Method | Required Role | Data Scope | Ownership / Rule | Sensitive Fields |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `/api/v1/documents` | GET | Authenticated | `SELF` / `ORGANIZATION` | Own documents or HR Admin | File paths |
| `/api/v1/documents/:id` | GET | Authenticated | `SELF` / `ORGANIZATION` | Document owner or HR Admin | Confidential attachments |
| `/api/v1/documents/:id` | DELETE | `HR_ADMIN`, `SUPER_ADMIN` | `ORGANIZATION` | Admin or document owner | File path |

---

## 8. Reports & Analytics APIs (`/api/v1/reports`)

| Endpoint | Method | Required Role | Data Scope | Ownership / Rule | Sensitive Fields |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `/api/v1/reports` | GET | `HR_ADMIN`, `SUPER_ADMIN`, `MANAGER` | `DIRECT_REPORTS` / `ORGANIZATION` | Scope filtered | Aggregate metrics |
| `/api/v1/reports/export` | GET | `HR_ADMIN`, `SUPER_ADMIN` | `ORGANIZATION` | HR Admin export permission | All report data |
