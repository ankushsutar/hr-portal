package payroll

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PayrollRun struct {
	ID                    string    `json:"id"`
	Month                 int       `json:"month"`
	Year                  int       `json:"year"`
	Status                string    `json:"status"` // DRAFT, PROCESSING, VALIDATED, APPROVED, LOCKED, PUBLISHED
	TotalEmployees        int       `json:"total_employees"`
	TotalGross            float64   `json:"total_gross"`
	TotalDeductions       float64   `json:"total_deductions"`
	TotalNetPay           float64   `json:"total_net_pay"`
	TotalLopDays          float64   `json:"total_lop_days"`
	TotalAdvancesDeducted float64   `json:"total_advances_deducted"`
	VariancePercentage    float64   `json:"variance_percentage"`
	ApprovedBy            *string   `json:"approved_by,omitempty"`
	ApprovedAt            *time.Time`json:"approved_at,omitempty"`
	LockedAt              *time.Time`json:"locked_at,omitempty"`
	CreatedAt             time.Time `json:"created_at"`
}

type PayrollAdvance struct {
	ID              string    `json:"id"`
	EmployeeID      string    `json:"employee_id"`
	EmployeeName    string    `json:"employee_name"`
	Amount          float64   `json:"amount"`
	Reason          string    `json:"reason"`
	DeductFromMonth int       `json:"deduct_from_month"`
	DeductFromYear  int       `json:"deduct_from_year"`
	Status          string    `json:"status"` // PENDING, APPROVED, REJECTED, DEDUCTED
	CreatedAt       time.Time `json:"created_at"`
}

type Payslip struct {
	ID              string  `json:"id"`
	EmployeeID      string  `json:"employee_id"`
	EmployeeName    string  `json:"employee_name"`
	Designation     string  `json:"designation"`
	Department      string  `json:"department"`
	Month           string  `json:"month"`
	Year            int     `json:"year"`
	BasicPay        float64 `json:"basic_pay"`
	HRA             float64 `json:"hra"`
	SpecialAllowance float64 `json:"special_allowance"`
	LopDeduction    float64 `json:"lop_deduction"`
	AdvanceDeduction float64 `json:"advance_deduction"`
	PF              float64 `json:"pf"`
	TDS             float64 `json:"tds"`
	PTax            float64 `json:"ptax"`
	TotalEarnings   float64 `json:"total_earnings"`
	TotalDeductions float64 `json:"total_deductions"`
	NetPay          float64 `json:"net_pay"`
	Status          string  `json:"status"`
}

type ProcessRequest struct {
	Month int `json:"month"`
	Year  int `json:"year"`
}

type TransitionRequest struct {
	Action string `json:"action"` // VALIDATE, APPROVE, LOCK, PUBLISH
}

type AdvanceRequest struct {
	EmployeeID      string  `json:"employee_id"`
	Amount          float64 `json:"amount"`
	Reason          string  `json:"reason"`
	DeductFromMonth int     `json:"deduct_from_month"`
	DeductFromYear  int     `json:"deduct_from_year"`
}

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) RegisterRoutes(r chi.Router) {
	r.Get("/runs", s.HandleGetRuns)
	r.Post("/runs/process", s.HandleProcessPayroll)
	r.Post("/runs/{id}/transition", s.HandleTransitionState)
	r.Get("/advances", s.HandleGetAdvances)
	r.Post("/advances", s.HandleCreateAdvance)
	r.Post("/advances/{id}/approve", s.HandleApproveAdvance)
	r.Get("/payslips", s.HandleGetPayslips)
	r.Get("/payslips/{id}", s.HandleGetPayslipDetails)
}

func (s *Service) HandleGetRuns(w http.ResponseWriter, r *http.Request) {
	now := time.Now()
	runs := []PayrollRun{
		{
			ID:                    "prun-082026",
			Month:                 8,
			Year:                  2026,
			Status:                "VALIDATED",
			TotalEmployees:        128,
			TotalGross:            4500000.00,
			TotalDeductions:       380000.00,
			TotalNetPay:           4120000.00,
			TotalLopDays:          12.5,
			TotalAdvancesDeducted: 45000.00,
			VariancePercentage:    2.4,
			CreatedAt:             now.Add(-48 * time.Hour),
		},
		{
			ID:                    "prun-072026",
			Month:                 7,
			Year:                  2026,
			Status:                "PUBLISHED",
			TotalEmployees:        125,
			TotalGross:            4400000.00,
			TotalDeductions:       370000.00,
			TotalNetPay:           4030000.00,
			TotalLopDays:          8.0,
			TotalAdvancesDeducted: 30000.00,
			VariancePercentage:    1.8,
			ApprovedBy:            stringPtr("EMP-001"),
			ApprovedAt:            timePtr(now.Add(-720 * time.Hour)),
			LockedAt:              timePtr(now.Add(-718 * time.Hour)),
			CreatedAt:             now.Add(-730 * time.Hour),
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    runs,
	})
}

func (s *Service) HandleProcessPayroll(w http.ResponseWriter, r *http.Request) {
	var req ProcessRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid payload", http.StatusBadRequest)
		return
	}

	newRun := PayrollRun{
		ID:                    "prun-new",
		Month:                 req.Month,
		Year:                  req.Year,
		Status:                "PROCESSING",
		TotalEmployees:        128,
		TotalGross:            4500000.00,
		TotalDeductions:       380000.00,
		TotalNetPay:           4120000.00,
		TotalLopDays:          12.5,
		TotalAdvancesDeducted: 45000.00,
		VariancePercentage:    2.4,
		CreatedAt:             time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Payroll processing calculated successfully.",
		"data":    newRun,
	})
}

func (s *Service) HandleTransitionState(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req TransitionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	nextStatus := "DRAFT"
	switch req.Action {
	case "VALIDATE":
		nextStatus = "VALIDATED"
	case "APPROVE":
		nextStatus = "APPROVED"
	case "LOCK":
		nextStatus = "LOCKED"
	case "PUBLISH":
		nextStatus = "PUBLISHED"
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Payroll status transitioned to " + nextStatus,
		"id":      id,
		"status":  nextStatus,
	})
}

func (s *Service) HandleGetAdvances(w http.ResponseWriter, r *http.Request) {
	advances := []PayrollAdvance{
		{
			ID:              "adv-101",
			EmployeeID:      "EMP-1024",
			EmployeeName:    "Alice Walker",
			Amount:          25000.00,
			Reason:          "Emergency Medical Expense",
			DeductFromMonth: 8,
			DeductFromYear:  2026,
			Status:          "APPROVED",
			CreatedAt:       time.Now().Add(-120 * time.Hour),
		},
		{
			ID:              "adv-102",
			EmployeeID:      "EMP-1088",
			EmployeeName:    "Bob Smith",
			Amount:          20000.00,
			Reason:          "Festival Relocation",
			DeductFromMonth: 8,
			DeductFromYear:  2026,
			Status:          "PENDING",
			CreatedAt:       time.Now().Add(-24 * time.Hour),
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    advances,
	})
}

func (s *Service) HandleCreateAdvance(w http.ResponseWriter, r *http.Request) {
	var req AdvanceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	newAdv := PayrollAdvance{
		ID:              "adv-" + time.Now().Format("05"),
		EmployeeID:      req.EmployeeID,
		EmployeeName:    "Employee " + req.EmployeeID,
		Amount:          req.Amount,
		Reason:          req.Reason,
		DeductFromMonth: req.DeductFromMonth,
		DeductFromYear:  req.DeductFromYear,
		Status:          "PENDING",
		CreatedAt:       time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Salary advance request created successfully.",
		"data":    newAdv,
	})
}

func (s *Service) HandleApproveAdvance(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Advance request " + id + " approved.",
	})
}

func (s *Service) HandleGetPayslips(w http.ResponseWriter, r *http.Request) {
	slips := []Payslip{
		{
			ID:              "ps-1",
			EmployeeID:      "EMP-1024",
			EmployeeName:    "Alice Walker",
			Designation:     "Senior Backend Engineer",
			Department:      "Engineering",
			Month:           "August",
			Year:            2026,
			BasicPay:        45000,
			HRA:             22500,
			SpecialAllowance: 12500,
			LopDeduction:    0,
			AdvanceDeduction: 5000,
			PF:              1800,
			TDS:             3200,
			PTax:            200,
			TotalEarnings:   80000,
			TotalDeductions: 10200,
			NetPay:          69800,
			Status:          "PUBLISHED",
		},
		{
			ID:              "ps-2",
			EmployeeID:      "EMP-1088",
			EmployeeName:    "Bob Smith",
			Designation:     "Product Designer",
			Department:      "Design",
			Month:           "August",
			Year:            2026,
			BasicPay:        40000,
			HRA:             20000,
			SpecialAllowance: 10000,
			LopDeduction:    2333.33,
			AdvanceDeduction: 0,
			PF:              1800,
			TDS:             2500,
			PTax:            200,
			TotalEarnings:   70000,
			TotalDeductions: 6833.33,
			NetPay:          63166.67,
			Status:          "VALIDATED",
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    slips,
	})
}

func (s *Service) HandleGetPayslipDetails(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	details := Payslip{
		ID:              id,
		EmployeeID:      "EMP-1024",
		EmployeeName:    "Alice Walker",
		Designation:     "Senior Backend Engineer",
		Department:      "Engineering",
		Month:           "August",
		Year:            2026,
		BasicPay:        45000,
		HRA:             22500,
		SpecialAllowance: 12500,
		LopDeduction:    0,
		AdvanceDeduction: 5000,
		PF:              1800,
		TDS:             3200,
		PTax:            200,
		TotalEarnings:   80000,
		TotalDeductions: 10200,
		NetPay:          69800,
		Status:          "PUBLISHED",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    details,
	})
}

func stringPtr(s string) *string {
	return &s
}

func timePtr(t time.Time) *time.Time {
	return &t
}
