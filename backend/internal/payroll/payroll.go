package payroll

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Payslip struct {
	ID              string  `json:"id"`
	Month           string  `json:"month"`
	Year            int     `json:"year"`
	BasicPay        float64 `json:"basic_pay"`
	HRA             float64 `json:"hra"`
	TotalEarnings   float64 `json:"total_earnings"`
	TotalDeductions float64 `json:"total_deductions"`
	NetPay          float64 `json:"net_pay"`
	Status          string  `json:"status"`
}

type ProcessRequest struct {
	Month int `json:"month"`
	Year  int `json:"year"`
}

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) RegisterRoutes(r chi.Router) {
	r.Get("/payslips", s.HandleGetPayslips)
	r.Get("/payslips/{id}", s.HandleGetPayslipDetails)
	r.Post("/process", s.HandleProcessPayroll)
}

func (s *Service) HandleGetPayslips(w http.ResponseWriter, r *http.Request) {
	slips := []Payslip{
		{
			ID:              "ps-1",
			Month:           "July",
			Year:            2026,
			BasicPay:        40000,
			HRA:             20000,
			TotalEarnings:   80000,
			TotalDeductions: 5000,
			NetPay:          75000,
			Status:          "PUBLISHED",
		},
		{
			ID:              "ps-2",
			Month:           "August",
			Year:            2026,
			BasicPay:        40000,
			HRA:             20000,
			TotalEarnings:   80000,
			TotalDeductions: 5000,
			NetPay:          75000,
			Status:          "GENERATED",
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    slips,
	})
}

func (s *Service) HandleGetPayslipDetails(w http.ResponseWriter, r *http.Request) {
	// Stub for detailed payslip data including components like PF, TDS, etc.
	details := map[string]interface{}{
		"id": chi.URLParam(r, "id"),
		"employee_name": "Jane Smith",
		"designation": "Software Engineer",
		"month": "August",
		"year": 2026,
		"earnings": []map[string]interface{}{
			{"name": "Basic Pay", "amount": 40000},
			{"name": "HRA", "amount": 20000},
			{"name": "Special Allowance", "amount": 20000},
		},
		"deductions": []map[string]interface{}{
			{"name": "PF", "amount": 1800},
			{"name": "Professional Tax", "amount": 200},
			{"name": "TDS", "amount": 3000},
		},
		"total_earnings": 80000,
		"total_deductions": 5000,
		"net_pay": 75000,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    details,
	})
}

func (s *Service) HandleProcessPayroll(w http.ResponseWriter, r *http.Request) {
	var req ProcessRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true, 
		"message": "Payroll processing initiated successfully.",
	})
}
