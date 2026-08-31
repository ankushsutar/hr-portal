# Role Permission Matrix — HRMS Enterprise Platform

This matrix defines the derived capabilities for each of the 4 supported roles (`SUPER_ADMIN`, `HR_ADMIN`, `MANAGER`, `EMPLOYEE`) based on the codebase implementation and backend authorization middleware.

---

## 1. Permission Matrix Table

| Feature / Action | SUPER_ADMIN | HR_ADMIN | MANAGER | EMPLOYEE |
| :--- | :--- | :--- | :--- | :--- |
| **Dynamic Theme Engine** | Configure / Save | Configure / Save | Configure / Save | Configure / Save |
| **Dashboard & Analytics** | Full Org Metrics | Full Org Metrics | Team Metrics | Self Metrics |
| **Universal Inbox** | All Requests | All HR Requests | Direct Report Requests | Self Requests |
| **HR Task Center** | Full Task Management | Full Task Management | Assigned Tasks | None |
| **Employee Directory — View** | Full Directory | Full Directory | Team Directory | Directory / Self |
| **Employee Directory — Create/Edit** | Allowed | Allowed | Restricted | Forbidden |
| **Statutory & Bank Data** | Full View (Unmasked) | Full View (Unmasked) | Masked / Restricted | Self Only (Masked) |
| **Employee Documents** | All Documents | All Documents | Team Documents | Self Documents |
| **Leave Application** | Allowed | Allowed | Allowed | Allowed |
| **Leave Approval** | Approve Any | Approve Any | Approve Team | Forbidden |
| **Attendance Punch** | Allowed | Allowed | Allowed | Allowed |
| **Attendance Roster View** | Full Roster | Full Roster | Team Roster | Self Attendance |
| **Attendance Regularization Approval** | Approve Any | Approve Any | Approve Team | Forbidden |
| **Payroll & Salary Setup** | Full Access | Full Access | Forbidden | Forbidden |
| **Payslip Access** | All Payslips | All Payslips | Forbidden | Own Payslip Only |
| **Performance Review Cycle** | Full Access | Full Access | Evaluate Team | Self Appraisal |
| **Recruitment ATS** | Full Access | Full Access | View / Interview | Forbidden |
| **Employee Self-Service (Helpdesk)** | All Tickets | All Tickets | Team Tickets | Create / Own Tickets |
| **Organization Hierarchy** | Full Access | Full Access | View Only | View Only |
| **Data Quality & Audit Logs** | Full Access | Full Access | Forbidden | Forbidden |
| **Bulk Importer** | Allowed | Allowed | Forbidden | Forbidden |

---

## 2. Security Enforcement Protocols

1. **Vertical Privilege Escalation**:
   - `EMPLOYEE` $\rightarrow$ `MANAGER` $\rightarrow$ `HR_ADMIN` $\rightarrow$ `SUPER_ADMIN`.
   - Backend `auth.RequireRole` middleware rejects attempts by lower roles to access protected administrative endpoints (e.g. `/api/v1/payroll`, `/api/v1/organization`, `/api/v1/import`).

2. **Horizontal Privilege Escalation & Sensitive Data Isolation**:
   - `EMPLOYEE A` cannot access `EMPLOYEE B` statutory data (PAN, Aadhaar, Bank Details, Payslips).
   - Sensitive fields (`AadhaarNumber`, `BankAccountNumber`) are automatically masked for non-payroll scopes via `GetScopeForRoles`.
