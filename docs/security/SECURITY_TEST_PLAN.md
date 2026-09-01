# Enterprise HRMS Security Test Plan

## 1. Objectives
Validate that all access control policies, Data Scope boundaries, resource ownership rules, IDOR protections, and Self-Approval preventions are rigidly enforced by the Enterprise HRMS backend.

---

## 2. Test Execution Matrix

### Category A: Employee Data Scope & IDOR Isolation
| Test ID | Test Scenario | Actor Role | Target Resource | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- |
| `SEC-EMP-001` | View own employee profile | `EMPLOYEE` | Own Profile (`/employees/me` or `/employees/:own_id`) | HTTP 200 OK + Full own profile data |
| `SEC-EMP-002` | View another employee's profile via IDOR | `EMPLOYEE` | Employee B ID (`/employees/:other_id`) | HTTP 403 Forbidden |
| `SEC-EMP-003` | List all employees without directory permission | `EMPLOYEE` | `/employees` | HTTP 200 OK + Only basic public directory fields (no statutory/personal) |
| `SEC-EMP-004` | Attempt to view statutory/bank details | `EMPLOYEE` | Employee B (`/employees/:other_id`) | Statutory fields stripped or HTTP 403 |
| `SEC-EMP-005` | Manager view direct report profile | `MANAGER` | Direct Report A ID | HTTP 200 OK + Standard profile data |
| `SEC-EMP-006` | Manager view non-report profile | `MANAGER` | Unrelated Employee C ID | HTTP 403 Forbidden |

---

### Category B: Workflow & Self-Approval Prevention
| Test ID | Test Scenario | Actor Role | Target Action | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- |
| `SEC-WF-001` | Employee submit leave request | `EMPLOYEE` | `/leave/applications` (Self) | HTTP 201 Created |
| `SEC-WF-002` | **Self-Approve Leave Request** | `EMPLOYEE` | `/workflow/tasks/:id/approve` (Self Task) | **HTTP 403 Forbidden (`SELF_APPROVAL_NOT_ALLOWED`)** |
| `SEC-WF-003` | **Manager Self-Approve Manager Leave** | `MANAGER` | `/workflow/tasks/:id/approve` (Manager Task) | **HTTP 403 Forbidden (`SELF_APPROVAL_NOT_ALLOWED`)** |
| `SEC-WF-004` | Manager approve direct report request | `MANAGER` | `/workflow/tasks/:id/approve` (Report Task) | HTTP 200 OK + Task APPROVED |
| `SEC-WF-005` | Manager approve unrelated team request | `MANAGER` | `/workflow/tasks/:id/approve` (Unrelated Task) | HTTP 403 Forbidden |

---

### Category C: Payroll & Payslip Access
| Test ID | Test Scenario | Actor Role | Target Resource | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- |
| `SEC-PAY-001` | Access own payslips | `EMPLOYEE` | `/payroll/my-payslips` | HTTP 200 OK + Own payslips |
| `SEC-PAY-002` | Access another employee's payslip via IDOR | `EMPLOYEE` | `/payroll/payslips/:other_id` | HTTP 403 Forbidden |
| `SEC-PAY-003` | Access payroll runs | `EMPLOYEE` | `/payroll/runs` | HTTP 403 Forbidden |
| `SEC-PAY-004` | Access payroll runs | `PAYROLL_ADMIN` | `/payroll/runs` | HTTP 200 OK + Full payroll runs |

---

### Category D: Document Ownership Security
| Test ID | Test Scenario | Actor Role | Target Resource | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- |
| `SEC-DOC-001` | Download own personal document | `EMPLOYEE` | `/documents/:own_doc_id` | HTTP 200 OK + File binary |
| `SEC-DOC-002` | Download other employee document via IDOR | `EMPLOYEE` | `/documents/:other_doc_id` | HTTP 403 Forbidden |

---

### Category E: Privilege Escalation & Admin Actions
| Test ID | Test Scenario | Actor Role | Target Action | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- |
| `SEC-ADM-001` | Attempt role modification to SUPER_ADMIN | `EMPLOYEE` | `PATCH /users/:self_id/roles` | HTTP 403 Forbidden |
| `SEC-ADM-002` | Create new admin account | `EMPLOYEE` | `POST /users` | HTTP 403 Forbidden |
| `SEC-ADM-003` | Assign roles as SUPER_ADMIN | `SUPER_ADMIN` | `PATCH /users/:id/roles` | HTTP 200 OK + Role updated |

---

## 3. Automated Go Test Execution Command
```bash
cd backend && go test -v ./internal/authz/...
```
