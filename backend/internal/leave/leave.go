package leave

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type LeaveType struct {
	ID               string  `json:"id"`
	Name             string  `json:"name"`
	Code             string  `json:"code"`
	AccrualFrequency string  `json:"accrual_frequency"`
	AccrualDays      float64 `json:"accrual_days"`
	MaxCarryForward  float64 `json:"max_carry_forward"`
	SandwichRule     bool    `json:"sandwich_rule"`
	AllowHalfDay     bool    `json:"allow_half_day"`
	Encashable       bool    `json:"encashable"`
}

type LeaveBalance struct {
	ID           string `json:"id"`
	LeaveTypeID  string `json:"leave_type_id"`
	LeaveType    string `json:"leave_type"`
	Code         string `json:"code"`
	TotalAccrued int    `json:"total_accrued"`
	TotalUsed    int    `json:"total_used"`
	Balance      int    `json:"balance"`
	Year         int    `json:"year"`
}

type LeaveApplication struct {
	ID        string `json:"id"`
	LeaveType string `json:"leave_type"`
	Code      string `json:"code"`
	StartDate string `json:"start_date"`
	EndDate   string `json:"end_date"`
	TotalDays int    `json:"total_days"`
	Status    string `json:"status"`
	Reason    string `json:"reason"`
	AppliedOn string `json:"applied_on"`
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
		{
			ID: "lt-pl", Name: "Privilege Leave (PL)", Code: "PL",
			AccrualFrequency: "MONTHLY", AccrualDays: 1.5, MaxCarryForward: 30,
			SandwichRule: false, AllowHalfDay: true, Encashable: true,
		},
		{
			ID: "lt-cl", Name: "Casual Leave (CL)", Code: "CL",
			AccrualFrequency: "ANNUAL", AccrualDays: 12, MaxCarryForward: 0,
			SandwichRule: false, AllowHalfDay: true, Encashable: false,
		},
		{
			ID: "lt-sl", Name: "Sick Leave (SL)", Code: "SL",
			AccrualFrequency: "ANNUAL", AccrualDays: 10, MaxCarryForward: 0,
			SandwichRule: true, AllowHalfDay: true, Encashable: false,
		},
		{
			ID: "lt-lwp", Name: "Leave Without Pay (LWP)", Code: "LWP",
			AccrualFrequency: "N/A", AccrualDays: 0, MaxCarryForward: 0,
			SandwichRule: false, AllowHalfDay: true, Encashable: false,
		},
		{
			ID: "lt-ml", Name: "Maternity / Paternity Leave", Code: "ML",
			AccrualFrequency: "EVENT", AccrualDays: 180, MaxCarryForward: 0,
			SandwichRule: false, AllowHalfDay: false, Encashable: false,
		},
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
			ID:           "lb-pl",
			LeaveTypeID:  "lt-pl",
			LeaveType:    "Privilege Leave (PL)",
			Code:         "PL",
			TotalAccrued: 18,
			TotalUsed:    4,
			Balance:      14,
			Year:         2026,
		},
		{
			ID:           "lb-cl",
			LeaveTypeID:  "lt-cl",
			LeaveType:    "Casual Leave (CL)",
			Code:         "CL",
			TotalAccrued: 12,
			TotalUsed:    3,
			Balance:      9,
			Year:         2026,
		},
		{
			ID:           "lb-sl",
			LeaveTypeID:  "lt-sl",
			LeaveType:    "Sick Leave (SL)",
			Code:         "SL",
			TotalAccrued: 10,
			TotalUsed:    2,
			Balance:      8,
			Year:         2026,
		},
		{
			ID:           "lb-lwp",
			LeaveTypeID:  "lt-lwp",
			LeaveType:    "Leave Without Pay (LWP)",
			Code:         "LWP",
			TotalAccrued: 0,
			TotalUsed:    0,
			Balance:      0,
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
			ID:        "la-1",
			LeaveType: "Privilege Leave (PL)",
			Code:      "PL",
			StartDate: "2026-08-10",
			EndDate:   "2026-08-14",
			TotalDays: 5,
			Status:    "APPROVED",
			Reason:    "Family Vacation",
			AppliedOn: "2026-08-01",
		},
		{
			ID:        "la-2",
			LeaveType: "Casual Leave (CL)",
			Code:      "CL",
			StartDate: "2026-08-25",
			EndDate:   "2026-08-25",
			TotalDays: 1,
			Status:    "APPROVED",
			Reason:    "Personal Work",
			AppliedOn: "2026-08-20",
		},
		{
			ID:        "la-3",
			LeaveType: "Sick Leave (SL)",
			Code:      "SL",
			StartDate: "2026-08-28",
			EndDate:   "2026-08-29",
			TotalDays: 2,
			Status:    "PENDING",
			Reason:    "Viral Fever & Recovery",
			AppliedOn: "2026-08-28",
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
		http.Error(w, "invalid request payload", http.StatusBadRequest)
		return
	}

	app.ID = "la-" + time.Now().Format("20060102150405")
	app.Status = "PENDING"
	app.AppliedOn = time.Now().Format("2006-01-02")

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Leave application submitted successfully for manager approval.",
		"data":    app,
	})
}
