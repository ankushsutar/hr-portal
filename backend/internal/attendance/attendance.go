package attendance

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AttendanceLog struct {
	ID           string `json:"id"`
	Date         string `json:"date"`
	CheckInTime  string `json:"check_in_time"`
	CheckOutTime string `json:"check_out_time"`
	Status       string `json:"status"`
	ShiftName    string `json:"shift_name"`
}

type RegularizeRequest struct {
	LogID       string `json:"log_id"`
	CheckIn     string `json:"requested_check_in"`
	CheckOut    string `json:"requested_check_out"`
	Reason      string `json:"reason"`
}

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) RegisterRoutes(r chi.Router) {
	r.Get("/logs", s.HandleGetLogs)
	r.Post("/check-in", s.HandleCheckIn)
	r.Post("/check-out", s.HandleCheckOut)
	r.Post("/regularize", s.HandleRegularize)
	
	// Sprint 8
	r.Post("/punch", s.HandlePunch)
	r.Get("/daily", s.HandleDailyStatus)

	// Sprint 9
	r.Post("/requests", s.HandleSubmitRequest)
	r.Get("/requests/me", s.HandleMyRequests)
	r.Get("/requests/pending", s.HandlePendingApprovals)
	r.Post("/requests/{id}/approve", s.HandleApproveRequest)
	r.Post("/requests/{id}/reject", s.HandleRejectRequest)
}

func (s *Service) HandleGetLogs(w http.ResponseWriter, r *http.Request) {
	logs := []AttendanceLog{
		{
			ID:           "al-1",
			Date:         "2026-08-25",
			CheckInTime:  "09:05 AM",
			CheckOutTime: "06:10 PM",
			Status:       "PRESENT",
			ShiftName:    "General Shift",
		},
		{
			ID:           "al-2",
			Date:         "2026-08-26",
			CheckInTime:  "09:30 AM",
			CheckOutTime: "06:00 PM",
			Status:       "LATE",
			ShiftName:    "General Shift",
		},
		{
			ID:           "al-3",
			Date:         "2026-08-27",
			CheckInTime:  "09:00 AM",
			CheckOutTime: "--:-- --",
			Status:       "PRESENT",
			ShiftName:    "General Shift",
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    logs,
	})
}

func (s *Service) HandleCheckIn(w http.ResponseWriter, r *http.Request) {
	// Stub for checking in
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true, 
		"message": "Checked in successfully.",
		"time": "09:00 AM",
	})
}

func (s *Service) HandleCheckOut(w http.ResponseWriter, r *http.Request) {
	// Stub for checking out
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true, 
		"message": "Checked out successfully.",
		"time": "06:00 PM",
	})
}

func (s *Service) HandleRegularize(w http.ResponseWriter, r *http.Request) {
	var req RegularizeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	
	// Stub for submitting a regularization request and triggering workflow
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true, 
		"message": "Regularization request submitted and workflow triggered.",
	})
}

// --- SPRINT 8 ---

type PunchRequest struct {
	EmployeeID string `json:"employee_id"`
	Provider   string `json:"provider"`
	PunchType  string `json:"punch_type"` // IN, OUT
}

func (s *Service) HandlePunch(w http.ResponseWriter, r *http.Request) {
	var req PunchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	// --- DEMO BYPASS ---
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Punch recorded successfully",
		"data": map[string]interface{}{
			"employee_id": req.EmployeeID,
			"punch_type":  req.PunchType,
			"processed":   true,
		},
		"demo": true,
	})
	// --- END DEMO BYPASS ---
}

func (s *Service) HandleDailyStatus(w http.ResponseWriter, r *http.Request) {
	// --- DEMO BYPASS ---
	date := r.URL.Query().Get("date")
	if date == "" {
		date = "2026-08-28"
	}

	data := []map[string]interface{}{
		{
			"id": "ds-1", "employee_id": "EMP-001", "employee_name": "Alice Walker", 
			"department": "Engineering", "date": date, "first_in": "09:05 AM", 
			"last_out": "06:10 PM", "status": "PRESENT", "late_by_minutes": 5,
		},
		{
			"id": "ds-2", "employee_id": "EMP-002", "employee_name": "Bob Smith", 
			"department": "Design", "date": date, "first_in": "09:30 AM", 
			"last_out": "--:--", "status": "LATE", "late_by_minutes": 30,
		},
		{
			"id": "ds-3", "employee_id": "EMP-003", "employee_name": "Charlie Day", 
			"department": "Marketing", "date": date, "first_in": "--:--", 
			"last_out": "--:--", "status": "ABSENT", "late_by_minutes": 0,
		},
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    data,
		"demo":    true,
	})
	// --- END DEMO BYPASS ---
}

