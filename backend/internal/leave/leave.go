package leave

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type LeaveType struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type LeaveBalance struct {
	ID           string `json:"id"`
	LeaveTypeID  string `json:"leave_type_id"`
	LeaveType    string `json:"leave_type"`
	TotalAccrued int    `json:"total_accrued"`
	TotalUsed    int    `json:"total_used"`
	Balance      int    `json:"balance"`
	Year         int    `json:"year"`
}

type LeaveApplication struct {
	ID         string `json:"id"`
	LeaveType  string `json:"leave_type"`
	StartDate  string `json:"start_date"`
	EndDate    string `json:"end_date"`
	TotalDays  int    `json:"total_days"`
	Status     string `json:"status"`
	Reason     string `json:"reason"`
	AppliedOn  string `json:"applied_on"`
}

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) RegisterRoutes(r chi.Router) {
	r.Get("/types", s.HandleGetTypes)
	r.Get("/balances", s.HandleGetBalances)
	r.Get("/applications", s.HandleGetApplications)
	r.Post("/applications", s.HandleCreateApplication)
}

func (s *Service) HandleGetTypes(w http.ResponseWriter, r *http.Request) {
	types := []LeaveType{
		{ID: "lt-1", Name: "Annual Leave"},
		{ID: "lt-2", Name: "Sick Leave"},
		{ID: "lt-3", Name: "Casual Leave"},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    types,
	})
}

func (s *Service) HandleGetBalances(w http.ResponseWriter, r *http.Request) {
	balances := []LeaveBalance{
		{
			ID:           "lb-1",
			LeaveTypeID:  "lt-1",
			LeaveType:    "Annual Leave",
			TotalAccrued: 20,
			TotalUsed:    5,
			Balance:      15,
			Year:         2026,
		},
		{
			ID:           "lb-2",
			LeaveTypeID:  "lt-2",
			LeaveType:    "Sick Leave",
			TotalAccrued: 10,
			TotalUsed:    2,
			Balance:      8,
			Year:         2026,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    balances,
	})
}

func (s *Service) HandleGetApplications(w http.ResponseWriter, r *http.Request) {
	applications := []LeaveApplication{
		{
			ID:         "la-1",
			LeaveType:  "Annual Leave",
			StartDate:  "2026-12-20",
			EndDate:    "2026-12-31",
			TotalDays:  8,
			Status:     "APPROVED",
			Reason:     "Winter Holidays",
			AppliedOn:  "2026-08-01",
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    applications,
	})
}

func (s *Service) HandleCreateApplication(w http.ResponseWriter, r *http.Request) {
	var app LeaveApplication
	if err := json.NewDecoder(r.Body).Decode(&app); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	
	// Stub for creating and triggering workflow
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true, 
		"message": "Leave application submitted and workflow triggered.",
	})
}
