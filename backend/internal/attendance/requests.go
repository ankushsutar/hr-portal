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

	// --- DEMO BYPASS ---
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
		"demo": true,
	})
	// --- END DEMO BYPASS ---
}

func (s *Service) HandleMyRequests(w http.ResponseWriter, r *http.Request) {
	// --- DEMO BYPASS ---
	data := []map[string]interface{}{
		{"id": "req-1", "type": "WFH", "date": "2026-08-30", "status": "PENDING", "reason": "Home network maintenance"},
		{"id": "req-2", "type": "OD", "date": "2026-08-15", "status": "APPROVED", "reason": "Client Visit (Pune)"},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    data,
		"demo":    true,
	})
	// --- END DEMO BYPASS ---
}

func (s *Service) HandlePendingApprovals(w http.ResponseWriter, r *http.Request) {
	// --- DEMO BYPASS ---
	data := []map[string]interface{}{
		{"id": "req-1", "employee_name": "Alice Walker", "department": "Engineering", "type": "WFH", "date": "2026-08-30", "status": "PENDING", "reason": "Home network maintenance"},
		{"id": "req-3", "employee_name": "Bob Smith", "department": "Design", "type": "OD", "date": "2026-09-02", "status": "PENDING", "reason": "Design Conference"},
		{"id": "req-4", "employee_name": "Charlie Day", "department": "Marketing", "type": "COMP_OFF", "date": "2026-08-22", "status": "PENDING", "reason": "Worked on Saturday Event"},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    data,
		"demo":    true,
	})
	// --- END DEMO BYPASS ---
}

func (s *Service) HandleApproveRequest(w http.ResponseWriter, r *http.Request) {
	// --- DEMO BYPASS ---
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Request approved",
		"demo":    true,
	})
	// --- END DEMO BYPASS ---
}

func (s *Service) HandleRejectRequest(w http.ResponseWriter, r *http.Request) {
	// --- DEMO BYPASS ---
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Request rejected",
		"demo":    true,
	})
	// --- END DEMO BYPASS ---
}
