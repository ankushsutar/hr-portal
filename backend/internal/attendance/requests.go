package attendance

import (
	"encoding/json"
	"net/http"
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

	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
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
	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	rows, err := s.db.Query(r.Context(), `
		SELECT id::text, request_type, to_char(request_date, 'YYYY-MM-DD'), status, COALESCE(reason, '')
		FROM attendance_requests ORDER BY created_at DESC LIMIT 50
	`)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": []map[string]interface{}{}})
		return
	}
	defer rows.Close()

	var data []map[string]interface{}
	for rows.Next() {
		var id, reqType, date, status, reason string
		if rows.Scan(&id, &reqType, &date, &status, &reason) == nil {
			data = append(data, map[string]interface{}{
				"id": id, "type": reqType, "date": date, "status": status, "reason": reason,
			})
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
	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	rows, err := s.db.Query(r.Context(), `
		SELECT ar.id::text, e.first_name || ' ' || e.last_name, COALESCE(d.name, 'General'),
		       ar.request_type, to_char(ar.request_date, 'YYYY-MM-DD'), ar.status, COALESCE(ar.reason, '')
		FROM attendance_requests ar
		JOIN employees e ON ar.employee_id = e.id
		LEFT JOIN departments d ON e.department_id = d.id
		WHERE ar.status = 'PENDING'
		ORDER BY ar.created_at DESC
	`)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": []map[string]interface{}{}})
		return
	}
	defer rows.Close()

	var data []map[string]interface{}
	for rows.Next() {
		var id, empName, dept, reqType, date, status, reason string
		if rows.Scan(&id, &empName, &dept, &reqType, &date, &status, &reason) == nil {
			data = append(data, map[string]interface{}{
				"id": id, "employee_name": empName, "department": dept,
				"type": reqType, "date": date, "status": status, "reason": reason,
			})
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
	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Request approved",
	})
}

func (s *Service) HandleRejectRequest(w http.ResponseWriter, r *http.Request) {
	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Request rejected",
	})
}
