# HRMS RBAC, Authorization & Data-Scope Security Audit Report

## Executive Summary
This security audit provides a comprehensive evaluation of authorization, role-based access control (RBAC), data scoping, and privilege management across the Enterprise HRMS platform.

Prior to remediation, the backend relied exclusively on an authentication middleware (`RequireAuth`) without enforcing endpoint-level or resource-level authorization checks. This led to critical vulnerabilities, including Insecure Direct Object References (IDOR), sensitive data leaks (salary, bank details, Aadhaar/PAN), self-approval in workflow tasks, and unauthorized administrative actions.

---

## Audit Vulnerability Catalog

### VULN-001: Missing Data Scope Enforcements on Employee Listing
* **Severity**: CRITICAL
* **Affected Role**: `EMPLOYEE`, `MANAGER`, `HR_MANAGER`
* **Affected Module**: `employee` (`GET /api/v1/employees`)
* **Attack Scenario**: An employee logs into the portal and sends a request to `/api/v1/employees`. The server responds with all employees across the organization, exposing full employment details.
* **Current Behavior**: `HandleListEmployees` executes `SELECT * FROM employees` without checking user scope.
* **Expected Behavior**: Users with `SELF` scope receive only their own record or an error. Users with `DIRECT_REPORTS` receive only their direct reports. `DEPARTMENT` scope is restricted to department members.
* **Root Cause**: Handlers lacked data scope resolution and SQL query filtering.
* **Fix**: Integrate `authz.ScopeResolver` to inject dynamic `WHERE` clauses based on user scope and identity.
* **Test Required**: Query `/api/v1/employees` as an `EMPLOYEE` role and verify only self or allowed public directory fields are accessible.

---

### VULN-002: Insecure Direct Object Reference (IDOR) on Employee Profile & Sensitive Field Exposure
* **Severity**: CRITICAL
* **Affected Role**: `EMPLOYEE`
* **Affected Module**: `employee` (`GET /api/v1/employees/:id`)
* **Attack Scenario**: Employee A changes the UUID parameter in `/api/v1/employees/{Employee_B_UUID}` and views Employee B's personal contact details, DOB, marital status, emergency contact info, and statutory details.
* **Current Behavior**: `HandleGetEmployee` fetches employee details by ID without ownership or scope verification.
* **Expected Behavior**: Non-HR/Payroll users attempting to view another employee's profile receive `403 Forbidden` or a strictly sanitized view. Personal and statutory data must be stripped.
* **Root Cause**: `EmployeePolicy.CanViewEmployeeDetail` check was missing.
* **Fix**: Apply `EmployeePolicy.CanViewEmployee` and `EmployeePolicy.CanViewStatutory` checks before querying database.
* **Test Required**: Request `/api/v1/employees/{other_id}` as `EMPLOYEE` and verify `403 Forbidden`.

---

### VULN-003: Self-Approval of Workflow Tasks (Leave, Attendance, Advances, Exits)
* **Severity**: CRITICAL
* **Affected Role**: `EMPLOYEE`, `MANAGER`, `HR_ADMIN`
* **Affected Module**: `workflow` (`POST /api/v1/workflow/tasks/:id/approve`)
* **Attack Scenario**: A manager or employee submits a leave or advance request and then calls `POST /api/v1/workflow/tasks/{task_id}/approve` using their own JWT to self-approve their request.
* **Current Behavior**: `HandleApproveTask` updates request status to `APPROVED` without verifying whether `requester_id == approver_id`.
* **Expected Behavior**: Backend rejects self-approval with HTTP 403 and error code `SELF_APPROVAL_NOT_ALLOWED`.
* **Root Cause**: Lack of workflow task ownership and approver verification.
* **Fix**: Enforce `requester != approver` check in `workflow.go` and `authz.CanApproveTask`.
* **Test Required**: Submit a leave request as a manager, attempt to approve it using the same manager session, verify `403 Forbidden`.

---

### VULN-004: Unauthorized Access to Organization Payroll Runs & Payslips
* **Severity**: CRITICAL
* **Affected Role**: `EMPLOYEE`, `MANAGER`
* **Affected Module**: `payroll` (`GET /api/v1/payroll/runs`, `GET /api/v1/payroll/payslips/:id`)
* **Attack Scenario**: An employee accesses `/api/v1/payroll/runs` or `/api/v1/payroll/payslips` and retrieves salary structures, compensation history, and payslips for all organization employees.
* **Current Behavior**: Routes under `/api/v1/payroll` do not enforce `PAYROLL_ADMIN` role or resource ownership.
* **Expected Behavior**: Employees can access only their own payslips (`GET /api/v1/payroll/my-payslips`). All administrative payroll endpoints require `PAYROLL_ADMIN` or `SUPER_ADMIN`.
* **Root Cause**: Missing role-based and ownership guards on payroll endpoints.
* **Fix**: Apply `PayrollPolicy` and enforce `claims.UserID == payslip.UserID` for non-payroll roles.
* **Test Required**: Attempt `GET /api/v1/payroll/runs` as `EMPLOYEE` role and verify `403 Forbidden`.

---

### VULN-005: IDOR & Unauthorized Document Downloads
* **Severity**: HIGH
* **Affected Role**: `EMPLOYEE`
* **Affected Module**: `document` (`GET /api/v1/documents/:id`)
* **Attack Scenario**: An employee guesses or iterates document IDs (`/api/v1/documents/{id}`) to download confidential contracts, offer letters, or tax documents of other employees.
* **Current Behavior**: Handlers fetch and serve documents without validating owner UUID against authenticated identity.
* **Expected Behavior**: System checks if requester is document owner, manager, or HR Admin before returning file content.
* **Root Cause**: Missing resource ownership check in `document.go`.
* **Fix**: Apply `DocumentPolicy.CanViewDocument`.
* **Test Required**: Attempt fetching document owned by another user and verify `403 Forbidden`.

---

### VULN-006: Unrestricted Privilege & User Management
* **Severity**: HIGH
* **Affected Role**: `EMPLOYEE`, `MANAGER`
* **Affected Module**: `user` (`POST /api/v1/users`, `PATCH /api/v1/users/:id/roles`)
* **Attack Scenario**: An employee submits a PATCH request to `/api/v1/users/{self_id}/roles` with `{"roles":["SUPER_ADMIN"]}` to escalate privileges.
* **Current Behavior**: User management endpoints lack `SUPER_ADMIN` / `HR_ADMIN` role guards.
* **Expected Behavior**: Only `SUPER_ADMIN` can assign roles or deactivate users.
* **Root Cause**: Missing `RequireRole("SUPER_ADMIN")` guard.
* **Fix**: Apply explicit role check `RequireRole("SUPER_ADMIN", "HR_ADMIN")` on user service routes.
* **Test Required**: Send PATCH to `/api/v1/users/:id/roles` as `EMPLOYEE` and verify `403 Forbidden`.

---

### VULN-007: Unscoped CSV & Report Data Exports
* **Severity**: HIGH
* **Affected Role**: `EMPLOYEE`
* **Affected Module**: `reports` (`GET /api/v1/reports/export`, `GET /api/v1/employees/export`)
* **Attack Scenario**: An employee downloads the full CSV export of the employee directory or attendance reports containing personal information for all company personnel.
* **Current Behavior**: Report generation executes global `SELECT` queries without applying user scope filters.
* **Expected Behavior**: Reports are filtered by the requester's data scope (`SELF`, `DIRECT_REPORTS`, `DEPARTMENT`, `ORGANIZATION`).
* **Root Cause**: Export handlers ignored user data scope context.
* **Fix**: Pass `authz.DataScope` into report query builders.
* **Test Required**: Export employee CSV as `EMPLOYEE` role and verify output contains only self.

---

## Remediation Status Summary
| Vulnerability ID | Vulnerability Description | Severity | Status |
| :--- | :--- | :---: | :---: |
| VULN-001 | Missing Data Scope Enforcements on Employee Listing | CRITICAL | Pending Remediation |
| VULN-002 | IDOR on Employee Profile & Sensitive Field Leak | CRITICAL | Pending Remediation |
| VULN-003 | Self-Approval of Workflow Tasks | CRITICAL | Pending Remediation |
| VULN-004 | Unauthorized Access to Payroll & Payslips | CRITICAL | Pending Remediation |
| VULN-005 | IDOR & Unauthorized Document Access | HIGH | Pending Remediation |
| VULN-006 | Unrestricted Privilege & User Management | HIGH | Pending Remediation |
| VULN-007 | Unscoped CSV & Report Exports | HIGH | Pending Remediation |
