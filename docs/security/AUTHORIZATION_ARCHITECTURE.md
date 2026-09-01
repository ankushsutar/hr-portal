# Enterprise HRMS Authorization Architecture

## 1. Overview & Core Philosophy

The Enterprise HRMS Authorization Architecture enforces strict, multi-layered security across every layer of the application. The system operates on the core principle:

> **NEVER TRUST THE CLIENT.**
> Authentication, Role assignment, Permission checks, Data Scope resolution, Resource Ownership validation, and Action Authorization MUST be authoritatively verified by the backend API and enforced in PostgreSQL queries.

---

## 2. The 6-Stage Authorization Pipeline

Every HTTP request to a protected API endpoint passes through a sequential 6-stage authorization pipeline:

```
+-----------------------------------------------------------------------+
| 1. Authentication                                                     |
|    Verify JWT signature, expiration, user activation & extract Claims |
+-----------------------------------------------------------------------+
                                   ↓
+-----------------------------------------------------------------------+
| 2. Role Check                                                         |
|    Verify user holds required system role (e.g. SUPER_ADMIN, HR_ADMIN) |
+-----------------------------------------------------------------------+
                                   ↓
+-----------------------------------------------------------------------+
| 3. Permission Check                                                   |
|    Verify user has granular capability (e.g. employee.view, leave.approve)|
+-----------------------------------------------------------------------+
                                   ↓
+-----------------------------------------------------------------------+
| 4. Data Scope Resolution                                              |
|    Resolve visibility boundary: SELF | DIRECT_REPORTS | DEPARTMENT | ORG |
+-----------------------------------------------------------------------+
                                   ↓
+-----------------------------------------------------------------------+
| 5. Resource Ownership & Approval Rule                                 |
|    Check IDOR & enforce self-approval prevention (requester != approver)  |
+-----------------------------------------------------------------------+
                                   ↓
+-----------------------------------------------------------------------+
| 6. Action Authorization & SQL Query Scope                             |
|    Inject WHERE filters into database query and mask sensitive fields    |
+-----------------------------------------------------------------------+
```

---

## 3. Data Scope Resolution Model

Data Scope defines the boundary of records a user is permitted to query:

| Scope | Description | Typical Role | SQL Scope Strategy |
| :--- | :--- | :--- | :--- |
| `SELF` | Access strictly limited to authenticated user's own records | `EMPLOYEE` | `WHERE e.user_id = $current_user_id` |
| `DIRECT_REPORTS` | Access restricted to direct team members | `MANAGER` | `WHERE e.manager_id = $current_employee_id` |
| `DEPARTMENT` | Access restricted to employees in same department | `DEPARTMENT_HR` | `WHERE e.department_id = $user_dept_id` |
| `ORGANIZATION` | Full organization-wide access | `HR_ADMIN`, `SUPER_ADMIN` | `WHERE e.organization_id = $user_org_id` |
| `SALARY_ACCESS` | Permission to view compensation & statutory data | `PAYROLL_ADMIN` | Unlocks statutory joins & salary fields |

---

## 4. Self-Approval Prevention Engine

To prevent fraud and conflict of interest, the platform strictly enforces that an employee can NEVER approve their own request under any circumstances:

```go
func CanApproveTask(requesterEmpID string, approverEmpID string) bool {
    if requesterEmpID == "" || approverEmpID == "" {
        return false
    }
    // Strict Self-Approval Guard
    if requesterEmpID == approverEmpID {
        return false
    }
    return true
}
```

### Standardized Error Contract
When a self-approval or unauthorized approval is attempted, the API immediately halts execution and returns HTTP `403 Forbidden`:

```json
{
  "success": false,
  "error": {
    "code": "SELF_APPROVAL_NOT_ALLOWED",
    "message": "You cannot approve your own request."
  }
}
```

---

## 5. Domain Resource Policies

Authorization logic is organized into explicit domain policies within `backend/internal/authz`:

- **`EmployeePolicy`**: `CanViewEmployeeList`, `CanViewEmployeeDetail`, `CanEditEmployee`, `CanViewStatutory`.
- **`WorkflowPolicy`**: `CanApproveTask`, `CanRejectTask`, `CanViewTask`.
- **`LeavePolicy`**: `CanViewLeave`, `CanApplyLeave`, `CanCancelLeave`.
- **`AttendancePolicy`**: `CanViewAttendance`, `CanRegularizeAttendance`.
- **`PayrollPolicy`**: `CanManagePayroll`, `CanViewPayslip`.
- **`DocumentPolicy`**: `CanViewDocument`, `CanDeleteDocument`.
- **`UserPolicy`**: `CanManageUsers`, `CanAssignRoles`.
- **`ReportPolicy`**: `CanExportReports`.

---

## 6. Sensitive Field Masking & DTO Stripping

Restricted fields are excluded at the API serialization layer unless the caller possesses explicit `SALARY_ACCESS` or `HR_ADMIN` permissions:

```go
// Mask PAN / Aadhaar / Bank details if caller lacks SALARY_ACCESS
if scope != authz.ScopeSalaryAccess && scope != authz.ScopeOrganization {
    detail.Statutory = nil // Strip entire statutory block
}
```

---

## 7. Frontend Integration & UX

While backend enforcement is authoritative, the frontend React application synchronizes with backend authorization:
1. **Global Interceptor**: Intercepts `403` HTTP responses and displays a standardized "Permission Denied" Toast notification.
2. **Route Guards**: Restricts navigation to unauthorized pages based on `AuthContext`.
3. **Action Guards**: Hides or disables action buttons (e.g. Approve/Reject, Edit, Export) when user lacks permissions or attempts self-approval.
