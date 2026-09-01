package authz_test

import (
	"strings"
	"testing"

	"github.com/company/hrms-backend/internal/auth"
	"github.com/company/hrms-backend/internal/authz"
)

func TestCanApproveTask(t *testing.T) {
	// Test 1: Self approval MUST return false
	if authz.CanApproveTask("emp-100", "emp-100") {
		t.Errorf("Expected CanApproveTask to return false for self-approval, got true")
	}

	// Test 2: Approval by a different user MUST return true
	if !authz.CanApproveTask("emp-100", "emp-200") {
		t.Errorf("Expected CanApproveTask to return true for different approver, got false")
	}

	// Test 3: Empty IDs MUST return false
	if authz.CanApproveTask("", "emp-200") || authz.CanApproveTask("emp-100", "") {
		t.Errorf("Expected CanApproveTask to return false for empty IDs")
	}
}

func TestHasRole(t *testing.T) {
	adminClaims := &auth.Claims{Roles: []string{"SUPER_ADMIN"}}
	hrClaims := &auth.Claims{Roles: []string{"HR_ADMIN"}}
	empClaims := &auth.Claims{Roles: []string{"EMPLOYEE"}}

	if !authz.HasRole(adminClaims, "HR_ADMIN") {
		t.Errorf("SUPER_ADMIN should satisfy any role requirement")
	}

	if !authz.HasRole(hrClaims, "HR_ADMIN") {
		t.Errorf("HR_ADMIN should satisfy HR_ADMIN requirement")
	}

	if authz.HasRole(empClaims, "HR_ADMIN", "SUPER_ADMIN") {
		t.Errorf("EMPLOYEE should not satisfy HR_ADMIN or SUPER_ADMIN")
	}
}

func TestCanManagePayroll(t *testing.T) {
	payrollClaims := &auth.Claims{Roles: []string{"PAYROLL_ADMIN"}}
	adminClaims := &auth.Claims{Roles: []string{"SUPER_ADMIN"}}
	empClaims := &auth.Claims{Roles: []string{"EMPLOYEE"}}

	if !authz.CanManagePayroll(payrollClaims) {
		t.Errorf("PAYROLL_ADMIN should be allowed to manage payroll")
	}
	if !authz.CanManagePayroll(adminClaims) {
		t.Errorf("SUPER_ADMIN should be allowed to manage payroll")
	}
	if authz.CanManagePayroll(empClaims) {
		t.Errorf("EMPLOYEE should not be allowed to manage payroll")
	}
}

func TestCanViewStatutory(t *testing.T) {
	adminClaims := &auth.Claims{Roles: []string{"SUPER_ADMIN"}}
	payrollClaims := &auth.Claims{Roles: []string{"PAYROLL_ADMIN"}}
	empClaims := &auth.Claims{Roles: []string{"EMPLOYEE"}}

	// Test 1: Super admin can view any statutory record
	if !authz.CanViewStatutory(adminClaims, "emp-200", "emp-100") {
		t.Errorf("SUPER_ADMIN should be able to view statutory details")
	}

	// Test 2: Payroll admin can view any statutory record
	if !authz.CanViewStatutory(payrollClaims, "emp-200", "emp-100") {
		t.Errorf("PAYROLL_ADMIN should be able to view statutory details")
	}

	// Test 3: Employee can view own statutory record
	if !authz.CanViewStatutory(empClaims, "emp-100", "emp-100") {
		t.Errorf("EMPLOYEE should be able to view own statutory details")
	}

	// Test 4: Employee CANNOT view another employee's statutory record
	if authz.CanViewStatutory(empClaims, "emp-200", "emp-100") {
		t.Errorf("EMPLOYEE should NOT be able to view another employee's statutory details")
	}
}

func TestCanViewDocument(t *testing.T) {
	adminClaims := &auth.Claims{Roles: []string{"SUPER_ADMIN"}}
	hrClaims := &auth.Claims{Roles: []string{"HR_ADMIN"}}
	empClaims := &auth.Claims{Roles: []string{"EMPLOYEE"}}

	// Test 1: Admin can view any document
	if !authz.CanViewDocument(adminClaims, "emp-200", "emp-100") {
		t.Errorf("SUPER_ADMIN should be able to view any document")
	}

	// Test 2: HR Admin can view any document
	if !authz.CanViewDocument(hrClaims, "emp-200", "emp-100") {
		t.Errorf("HR_ADMIN should be able to view any document")
	}

	// Test 3: Employee can view own document
	if !authz.CanViewDocument(empClaims, "emp-100", "emp-100") {
		t.Errorf("EMPLOYEE should be able to view own document")
	}

	// Test 4: Employee CANNOT view another employee's document
	if authz.CanViewDocument(empClaims, "emp-200", "emp-100") {
		t.Errorf("EMPLOYEE should NOT be able to view another employee's document")
	}
}

func TestCanExportReports(t *testing.T) {
	adminClaims := &auth.Claims{Roles: []string{"SUPER_ADMIN"}}
	hrClaims := &auth.Claims{Roles: []string{"HR_ADMIN"}}
	empClaims := &auth.Claims{Roles: []string{"EMPLOYEE"}}

	if !authz.CanExportReports(adminClaims) || !authz.CanExportReports(hrClaims) {
		t.Errorf("Administrators should be able to export reports")
	}

	if authz.CanExportReports(empClaims) {
		t.Errorf("EMPLOYEE should NOT be able to export reports")
	}
}

func TestCanManageUsers(t *testing.T) {
	adminClaims := &auth.Claims{Roles: []string{"SUPER_ADMIN"}}
	hrClaims := &auth.Claims{Roles: []string{"HR_ADMIN"}}
	empClaims := &auth.Claims{Roles: []string{"EMPLOYEE"}}

	if !authz.CanManageUsers(adminClaims) || !authz.CanManageUsers(hrClaims) {
		t.Errorf("Administrators should be able to manage users")
	}

	if authz.CanManageUsers(empClaims) {
		t.Errorf("EMPLOYEE should NOT be able to manage users")
	}
}

func TestBuildScopeWhereClause(t *testing.T) {
	// Test 1: ScopeSelf
	empClaims := &auth.Claims{Roles: []string{"EMPLOYEE"}, Scope: authz.ScopeSelf, UserID: "usr-123"}
	condSelf, argsSelf, _ := authz.BuildScopeWhereClause(empClaims, "emp-123", "", 1, "e")

	if !strings.Contains(condSelf, "e.id::text = $1") && !strings.Contains(condSelf, "e.user_id::text") {
		t.Errorf("ScopeSelf clause missing employee/user match logic: %s", condSelf)
	}
	if len(argsSelf) == 0 {
		t.Errorf("ScopeSelf expected arguments, got 0")
	}

	// Test 2: ScopeDirectReports
	mgrClaims := &auth.Claims{Roles: []string{"MANAGER"}, Scope: authz.ScopeDirectReports, UserID: "usr-456"}
	condMgr, argsMgr, _ := authz.BuildScopeWhereClause(mgrClaims, "emp-456", "", 1, "e")

	if !strings.Contains(condMgr, "e.manager_id::text = $1") {
		t.Errorf("ScopeDirectReports clause missing manager_id match: %s", condMgr)
	}
	if len(argsMgr) == 0 {
		t.Errorf("ScopeDirectReports expected arguments, got 0")
	}

	// Test 3: ScopeDepartment
	deptClaims := &auth.Claims{Roles: []string{"DEPT_HEAD"}, Scope: authz.ScopeDepartment, UserID: "usr-789"}
	condDept, argsDept, _ := authz.BuildScopeWhereClause(deptClaims, "emp-789", "dept-eng", 1, "e")

	if !strings.Contains(condDept, "e.department_id::text = $1") {
		t.Errorf("ScopeDepartment clause missing department_id match: %s", condDept)
	}
	if len(argsDept) == 0 {
		t.Errorf("ScopeDepartment expected arguments, got 0")
	}

	// Test 4: ScopeOrganization
	orgClaims := &auth.Claims{Roles: []string{"SUPER_ADMIN"}, Scope: authz.ScopeOrganization, UserID: "usr-admin"}
	condOrg, argsOrg, _ := authz.BuildScopeWhereClause(orgClaims, "emp-admin", "", 1, "e")

	if condOrg != "1=1" {
		t.Errorf("ScopeOrganization should be 1=1, got: %s", condOrg)
	}
	if len(argsOrg) != 0 {
		t.Errorf("ScopeOrganization expected 0 args, got %d", len(argsOrg))
	}
}

func TestWorkflowSelfApprovalAndRoleValidation(t *testing.T) {
	// Test 1: Employee trying to approve own request must be rejected by CanApproveTask
	requesterID := "emp-101"
	approverID := "emp-101"
	if authz.CanApproveTask(requesterID, approverID) {
		t.Errorf("CanApproveTask MUST return false when requester matches approver")
	}

	// Test 2: Standard employee role cannot approve workflow tasks
	empClaims := &auth.Claims{Roles: []string{"EMPLOYEE"}}
	if authz.HasRole(empClaims, "SUPER_ADMIN", "HR_ADMIN", "HR_MANAGER", "MANAGER", "DEPT_HEAD", "PAYROLL_ADMIN") {
		t.Errorf("Standard EMPLOYEE role MUST NOT have managerial approval rights")
	}

	// Test 3: HR Manager or Department Head CAN approve tasks for others
	hrClaims := &auth.Claims{Roles: []string{"HR_MANAGER"}}
	if !authz.HasRole(hrClaims, "SUPER_ADMIN", "HR_ADMIN", "HR_MANAGER", "MANAGER", "DEPT_HEAD", "PAYROLL_ADMIN") {
		t.Errorf("HR_MANAGER MUST have managerial approval rights")
	}

	if !authz.CanApproveTask("emp-101", "emp-202") {
		t.Errorf("CanApproveTask MUST return true when requester does not match approver")
	}
}
