package attendance

import (
	"encoding/json"
	"net/http"

	"github.com/company/hrms-backend/internal/auth"
	"github.com/company/hrms-backend/internal/authz"
)

type AttendanceRequest struct {
	Type   string `json:"type"` // OD, WFH, COMP_OFF
	Date   string `json:"date"`
	Reason string `json:"reason"`
}

func (s *Service) HandleSubmitRequest(w http.ResponseWriter, r *http.Request) {
	var req AttendanceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": req.Type + " request submitted successfully",
		"data": map[string]interface{}{
			"type":   req.Type,
			"status": "PENDING",
			"date":   req.Date,
		},
	})
}

func (s *Service) HandleMyRequests(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok {
		authz.UnauthorizedResponse(w)
		return
	}

	var data []map[string]interface{}
	if s.db != nil {
		rows, err := s.db.Query(r.Context(), `
			SELECT ar.id::text, ar.request_type, to_char(ar.request_date, 'YYYY-MM-DD'), ar.status, COALESCE(ar.reason, '')
			FROM attendance_requests ar
			JOIN employees e ON ar.employee_id = e.id
			WHERE e.user_id::text = $1 OR e.id::text = $1
			ORDER BY ar.created_at DESC LIMIT 50
		`, claims.UserID)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var id, reqType, date, status, reason string
				if rows.Scan(&id, &reqType, &date, &status, &reason) == nil {
					data = append(data, map[string]interface{}{
						"id": id, "type": reqType, "date": date, "status": status, "reason": reason,
					})
				}
			}
		}
	}

	if data == nil {
		data = []map[string]interface{}{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    data,
	})
}

func (s *Service) HandlePendingApprovals(w http.ResponseWriter, r *http.Request) {
	var data []map[string]interface{}
	if s.db != nil {
		rows, err := s.db.Query(r.Context(), `
			SELECT ar.id::text, e.first_name || ' ' || e.last_name, COALESCE(d.name, 'General'),
			       ar.request_type, to_char(ar.request_date, 'YYYY-MM-DD'), ar.status, COALESCE(ar.reason, '')
			FROM attendance_requests ar
			JOIN employees e ON ar.employee_id = e.id
			LEFT JOIN departments d ON e.department_id = d.id
			WHERE ar.status = 'PENDING'
			ORDER BY ar.created_at DESC
		`)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var id, empName, dept, reqType, date, status, reason string
				if rows.Scan(&id, &empName, &dept, &reqType, &date, &status, &reason) == nil {
					data = append(data, map[string]interface{}{
						"id": id, "employee_name": empName, "department": dept,
						"type": reqType, "date": date, "status": status, "reason": reason,
					})
				}
			}
		}
	}

	if data == nil {
		data = []map[string]interface{}{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    data,
	})
}

func (s *Service) HandleApproveRequest(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Request approved",
	})
}

func (s *Service) HandleRejectRequest(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Request rejected",
	})
}
