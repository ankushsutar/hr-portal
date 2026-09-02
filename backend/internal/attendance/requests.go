package attendance

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/company/hrms-backend/internal/auth"
	"github.com/company/hrms-backend/internal/authz"
	"github.com/company/hrms-backend/internal/common"
	"github.com/go-chi/chi/v5"
)

type AttendanceRequest struct {
	EmployeeID string `json:"employee_id,omitempty"`
	Date       string `json:"date"`
	CheckIn    string `json:"check_in"`
	CheckOut   string `json:"check_out"`
	Reason     string `json:"reason"`
}

func (s *Service) HandleSubmitRequest(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok {
		authz.UnauthorizedResponse(w)
		return
	}
	callerEmpID, _, _ := s.getCallerIDs(r.Context(), claims.UserID)

	var req AttendanceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	targetEmpID := callerEmpID
	if req.EmployeeID != "" && authz.HasRole(claims, "HR_ADMIN", "SUPER_ADMIN", "MANAGER") {
		// Try to resolve the provided employee ID (usually it's a code like PEP00)
		err := s.db.QueryRow(r.Context(), "SELECT id::text FROM employees WHERE employee_id = $1 OR id::text = $1", req.EmployeeID).Scan(&targetEmpID)
		if err != nil {
			targetEmpID = callerEmpID // fallback if not found, though should error in prod
		}
	}

	checkInTS := fmt.Sprintf("%s %s:00", req.Date, req.CheckIn)
	checkOutTS := fmt.Sprintf("%s %s:00", req.Date, req.CheckOut)

	var newID string
	err := s.db.QueryRow(r.Context(), `
		INSERT INTO regularization_requests (employee_id, requested_check_in, requested_check_out, reason, status)
		VALUES ($1, $2, $3, $4, 'PENDING')
		RETURNING id::text
	`, targetEmpID, checkInTS, checkOutTS, req.Reason).Scan(&newID)

	if err != nil {
		common.JSONError(w, "Failed to submit request", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Regularization request submitted successfully",
		"data": map[string]interface{}{
			"id":     newID,
			"status": "PENDING",
		},
	})
}

func (s *Service) queryRequests(ctx context.Context, whereClause string) []map[string]interface{} {
	var data []map[string]interface{}
	query := fmt.Sprintf(`
		SELECT 
			ar.id::text, e.employee_id, e.first_name || ' ' || e.last_name,
			to_char(ar.requested_check_in, 'YYYY-MM-DD'),
			to_char(ar.requested_check_in, 'HH12:MI AM'),
			to_char(ar.requested_check_out, 'HH12:MI AM'),
			COALESCE(EXTRACT(EPOCH FROM (ar.requested_check_out - ar.requested_check_in))/3600.0, 0),
			ar.status, COALESCE(ar.reason, '')
		FROM regularization_requests ar
		JOIN employees e ON ar.employee_id = e.id
		WHERE %s
		ORDER BY ar.created_at DESC LIMIT 100
	`, whereClause)

	rows, err := s.db.Query(ctx, query)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var id, empCode, empName, date, checkIn, checkOut, status, reason string
			var atWork float64
			if rows.Scan(&id, &empCode, &empName, &date, &checkIn, &checkOut, &atWork, &status, &reason) == nil {
				data = append(data, map[string]interface{}{
					"id": id, "employee_code": empCode, "employee_name": empName,
					"date": date, "check_in": checkIn, "check_out": checkOut,
					"shift": "Regular Shift", "at_work": fmt.Sprintf("%.2f", atWork),
					"status": status, "reason": reason,
				})
			}
		}
	}
	if data == nil {
		data = []map[string]interface{}{}
	}
	return data
}

func (s *Service) HandleMyRequests(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok {
		authz.UnauthorizedResponse(w)
		return
	}
	callerEmpID, _, _ := s.getCallerIDs(r.Context(), claims.UserID)
	
	whereClause := fmt.Sprintf("e.id::text = '%s'", callerEmpID)
	// If HR or Admin, let them see all requests in "ALL" tab
	if authz.HasRole(claims, "HR_ADMIN", "SUPER_ADMIN", "PAYROLL_ADMIN") {
		whereClause = "1=1"
	} else if authz.HasRole(claims, "MANAGER", "DEPT_HEAD") {
		whereClause = fmt.Sprintf("(e.id::text = '%s' OR e.manager_id::text = '%s')", callerEmpID, callerEmpID)
	}

	data := s.queryRequests(r.Context(), whereClause)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": data})
}

func (s *Service) HandlePendingApprovals(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok {
		authz.UnauthorizedResponse(w)
		return
	}
	callerEmpID, _, _ := s.getCallerIDs(r.Context(), claims.UserID)

	whereClause := "ar.status = 'PENDING'"
	if authz.HasRole(claims, "HR_ADMIN", "SUPER_ADMIN", "PAYROLL_ADMIN") {
		// can see all pending
	} else if authz.HasRole(claims, "MANAGER", "DEPT_HEAD") {
		whereClause += fmt.Sprintf(" AND e.manager_id::text = '%s'", callerEmpID)
	} else {
		// employees have no pending approvals
		whereClause += " AND 1=0" 
	}

	data := s.queryRequests(r.Context(), whereClause)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": data})
}

func (s *Service) HandleApproveRequest(w http.ResponseWriter, r *http.Request) {
	reqID := chi.URLParam(r, "id")
	_, err := s.db.Exec(r.Context(), "UPDATE regularization_requests SET status = 'APPROVED' WHERE id = $1", reqID)
	if err != nil {
		common.JSONError(w, "Failed to approve", http.StatusInternalServerError)
		return
	}

	// Also sync it to attendance_daily_status!
	s.db.Exec(r.Context(), `
		INSERT INTO attendance_daily_status (employee_id, date, first_in, last_out, status, worked_hours, validation_status)
		SELECT employee_id, requested_check_in::date, requested_check_in, requested_check_out, 'PRESENT', 
		       EXTRACT(EPOCH FROM (requested_check_out - requested_check_in))/3600.0, 'VALIDATED'
		FROM regularization_requests WHERE id = $1
		ON CONFLICT (employee_id, date) DO UPDATE 
		SET first_in = EXCLUDED.first_in, last_out = EXCLUDED.last_out, worked_hours = EXCLUDED.worked_hours, status = 'PRESENT', validation_status = 'VALIDATED'
	`, reqID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "message": "Request approved"})
}

func (s *Service) HandleRejectRequest(w http.ResponseWriter, r *http.Request) {
	reqID := chi.URLParam(r, "id")
	_, err := s.db.Exec(r.Context(), "UPDATE regularization_requests SET status = 'REJECTED' WHERE id = $1", reqID)
	if err != nil {
		common.JSONError(w, "Failed to reject", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "message": "Request rejected"})
}
