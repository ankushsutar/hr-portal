package authz

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/company/hrms-backend/internal/auth"
)

// DataScope defines permission boundary
type DataScope = auth.DataScope

const (
	ScopeSelf          = auth.ScopeSelf
	ScopeDirectReports = auth.ScopeDirectReports
	ScopeDepartment    = auth.ScopeDepartment
	ScopeOrganization  = auth.ScopeOrganization
	ScopeSalaryAccess  = auth.ScopeSalaryAccess
)

// ErrorResponse structure for 403 responses
type ErrorDetails struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type ErrorResponse struct {
	Success bool         `json:"success"`
	Error   ErrorDetails `json:"error"`
}

// ForbiddenResponse emits standard 403 JSON
func ForbiddenResponse(w http.ResponseWriter, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusForbidden)
	json.NewEncoder(w).Encode(ErrorResponse{
		Success: false,
		Error: ErrorDetails{
			Code:    code,
			Message: message,
		},
	})
}

// SelfApprovalError emits standardized self approval blocked response
func SelfApprovalError(w http.ResponseWriter) {
	ForbiddenResponse(w, "SELF_APPROVAL_NOT_ALLOWED", "You cannot approve your own request.")
}

// UnauthorizedResponse emits standard 401 JSON
func UnauthorizedResponse(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	json.NewEncoder(w).Encode(ErrorResponse{
		Success: false,
		Error: ErrorDetails{
			Code:    "UNAUTHORIZED",
			Message: "Authentication required.",
		},
	})
}

// ---------------------------------------------------------------------------
// Self-Approval Prevention Engine
// ---------------------------------------------------------------------------

// CanApproveTask returns false if requester is the approver or if parameters are invalid
func CanApproveTask(requesterEmpID, approverEmpID string) bool {
	if requesterEmpID == "" || approverEmpID == "" {
		return false
	}
	// Strict check: employee cannot approve their own request
	if strings.TrimSpace(requesterEmpID) == strings.TrimSpace(approverEmpID) {
		return false
	}
	return true
}

// ---------------------------------------------------------------------------
// Role & Permission Policies
// ---------------------------------------------------------------------------

func HasRole(claims *auth.Claims, roles ...string) bool {
	if claims == nil {
		return false
	}
	for _, userRole := range claims.Roles {
		if userRole == "SUPER_ADMIN" {
			return true
		}
		for _, req := range roles {
			if userRole == req {
				return true
			}
		}
	}
	return false
}

func CanManageUsers(claims *auth.Claims) bool {
	return HasRole(claims, "SUPER_ADMIN", "HR_ADMIN")
}

func CanManagePayroll(claims *auth.Claims) bool {
	return HasRole(claims, "SUPER_ADMIN", "PAYROLL_ADMIN")
}

func CanExportReports(claims *auth.Claims) bool {
	return HasRole(claims, "SUPER_ADMIN", "HR_ADMIN", "PAYROLL_ADMIN")
}

func CanViewStatutory(claims *auth.Claims, targetEmpID, currentEmpID string) bool {
	if claims == nil {
		return false
	}
	if HasRole(claims, "SUPER_ADMIN", "HR_ADMIN", "PAYROLL_ADMIN") {
		return true
	}
	// Employee can view their own statutory details
	if targetEmpID != "" && currentEmpID != "" && targetEmpID == currentEmpID {
		return true
	}
	return false
}

func CanViewDocument(claims *auth.Claims, docOwnerEmpID, currentEmpID string) bool {
	if claims == nil {
		return false
	}
	if HasRole(claims, "SUPER_ADMIN", "HR_ADMIN") {
		return true
	}
	if docOwnerEmpID != "" && currentEmpID != "" && docOwnerEmpID == currentEmpID {
		return true
	}
	return false
}

// ---------------------------------------------------------------------------
// Dynamic SQL Scope Query Builder
// ---------------------------------------------------------------------------

// BuildScopeWhereClause returns dynamic SQL condition for scoping employee queries
func BuildScopeWhereClause(claims *auth.Claims, currentEmpID, currentDeptID string, paramStartIdx int, tableAlias string) (string, []interface{}, int) {
	if claims == nil {
		return "1=0", nil, paramStartIdx
	}

	alias := ""
	if tableAlias != "" {
		alias = tableAlias + "."
	}

	// SUPER_ADMIN and HR_ADMIN have ORGANIZATION scope
	if HasRole(claims, "SUPER_ADMIN", "HR_ADMIN") {
		return "1=1", nil, paramStartIdx
	}

	scope := claims.Scope
	switch scope {
	case ScopeOrganization:
		return "1=1", nil, paramStartIdx

	case ScopeDepartment:
		if currentDeptID == "" {
			// Fallback to self if dept is empty
			condition := fmt.Sprintf("%sid::text = $%d OR %suser_id::text = $%d", alias, paramStartIdx, alias, paramStartIdx+1)
			return condition, []interface{}{currentEmpID, claims.UserID}, paramStartIdx + 2
		}
		condition := fmt.Sprintf("%sdepartment_id::text = $%d", alias, paramStartIdx)
		return condition, []interface{}{currentDeptID}, paramStartIdx + 1

	case ScopeDirectReports:
		if currentEmpID == "" {
			condition := fmt.Sprintf("%suser_id::text = $%d", alias, paramStartIdx)
			return condition, []interface{}{claims.UserID}, paramStartIdx + 1
		}
		condition := fmt.Sprintf("(%smanager_id::text = $%d OR %sid::text = $%d OR %suser_id::text = $%d)", alias, paramStartIdx, alias, paramStartIdx+1, alias, paramStartIdx+2)
		return condition, []interface{}{currentEmpID, currentEmpID, claims.UserID}, paramStartIdx + 3

	case ScopeSelf:
		fallthrough
	default:
		if currentEmpID != "" {
			condition := fmt.Sprintf("(%sid::text = $%d OR %suser_id::text = $%d)", alias, paramStartIdx, alias, paramStartIdx+1)
			return condition, []interface{}{currentEmpID, claims.UserID}, paramStartIdx + 2
		}
		condition := fmt.Sprintf("%suser_id::text = $%d", alias, paramStartIdx)
		return condition, []interface{}{claims.UserID}, paramStartIdx + 1
	}
}
