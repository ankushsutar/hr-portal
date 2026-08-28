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
	// --- DEMO BYPASS ---
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "id": "exit-1", "demo": true})
	// --- END DEMO BYPASS ---
}

func (s *Service) HandleListExits(w http.ResponseWriter, r *http.Request) {
	// --- DEMO BYPASS ---
	exits := []ExitRequest{
		{ID: "exit-1", EmployeeID: "emp-1", EmployeeName: "John Doe", Department: "Engineering", ResignationDate: "2026-08-15", LastWorkingDate: "2026-09-15", Reason: "Better Opportunity", Status: "APPROVED"},
		{ID: "exit-2", EmployeeID: "emp-2", EmployeeName: "Sarah Smith", Department: "Marketing", ResignationDate: "2026-08-25", LastWorkingDate: "2026-09-25", Reason: "Personal Reasons", Status: "PENDING"},
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": exits, "demo": true})
	// --- END DEMO BYPASS ---
}

func (s *Service) HandleApproveExit(w http.ResponseWriter, r *http.Request) {
	_ = chi.URLParam(r, "id")
	// --- DEMO BYPASS ---
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "demo": true})
	// --- END DEMO BYPASS ---
}

func (s *Service) HandleGetClearance(w http.ResponseWriter, r *http.Request) {
	_ = chi.URLParam(r, "id")
	// --- DEMO BYPASS ---
	tasks := []ClearanceTask{
		{ID: "task-1", Department: "IT", TaskDescription: "Collect Laptop & Access Card", Status: "PENDING"},
		{ID: "task-2", Department: "FINANCE", TaskDescription: "Settle outstanding advances", Status: "COMPLETED"},
		{ID: "task-3", Department: "HR", TaskDescription: "Exit Interview & PF Transfer", Status: "PENDING"},
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": tasks, "demo": true})
	// --- END DEMO BYPASS ---
}
