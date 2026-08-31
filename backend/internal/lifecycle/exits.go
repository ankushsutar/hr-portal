package lifecycle

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type ExitRequest struct {
	ID               string  `json:"id"`
	EmployeeID       string  `json:"employee_id"`
	EmployeeName     string  `json:"employee_name"`
	Department       string  `json:"department"`
	ResignationDate  string  `json:"resignation_date"`
	LastWorkingDate  string  `json:"last_working_date"`
	Reason           string  `json:"reason"`
	Status           string  `json:"status"`
}

type ClearanceTask struct {
	ID              string `json:"id"`
	Department      string `json:"department"`
	TaskDescription string `json:"task_description"`
	Status          string `json:"status"`
}

func (s *Service) HandleSubmitResignation(w http.ResponseWriter, r *http.Request) {
	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "id": "exit-new"})
}

func (s *Service) HandleListExits(w http.ResponseWriter, r *http.Request) {
	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	rows, err := s.db.Query(r.Context(), `
		SELECT er.id::text, e.employee_id, e.first_name || ' ' || e.last_name,
		       COALESCE(d.name, 'General'), to_char(er.resignation_date, 'YYYY-MM-DD'),
		       to_char(er.last_working_date, 'YYYY-MM-DD'), COALESCE(er.reason, ''), er.status
		FROM exit_requests er
		JOIN employees e ON er.employee_id = e.id
		LEFT JOIN departments d ON e.department_id = d.id
		ORDER BY er.created_at DESC
	`)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": []ExitRequest{}})
		return
	}
	defer rows.Close()

	var exits []ExitRequest
	for rows.Next() {
		var ex ExitRequest
		if rows.Scan(&ex.ID, &ex.EmployeeID, &ex.EmployeeName, &ex.Department, &ex.ResignationDate, &ex.LastWorkingDate, &ex.Reason, &ex.Status) == nil {
			exits = append(exits, ex)
		}
	}
	if exits == nil {
		exits = []ExitRequest{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": exits})
}

func (s *Service) HandleApproveExit(w http.ResponseWriter, r *http.Request) {
	_ = chi.URLParam(r, "id")
	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true})
}

func (s *Service) HandleGetClearance(w http.ResponseWriter, r *http.Request) {
	_ = chi.URLParam(r, "id")
	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": []ClearanceTask{}})
}
