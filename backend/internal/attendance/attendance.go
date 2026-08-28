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
