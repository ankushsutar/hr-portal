package payroll

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/company/hrms-backend/internal/audit"
	"github.com/company/hrms-backend/internal/auth"
	"github.com/company/hrms-backend/internal/authz"
	"github.com/go-chi/chi/v5"
)

type CurrencyItem struct {
	Code               string  `json:"code"`
	Name               string  `json:"name"`
	Symbol             string  `json:"symbol"`
	ExchangeRateToBase float64 `json:"exchange_rate_to_base"`
	IsBase             bool    `json:"is_base"`
}

type SalaryComponentItem struct {
	ID              string  `json:"id"`
	Code            string  `json:"code"`
	Name            string  `json:"name"`
	ComponentType   string  `json:"component_type"` // EARNING, DEDUCTION
	CalculationType string  `json:"calculation_type"` // FLAT, PERCENTAGE_OF_BASIC, PERCENTAGE_OF_GROSS
	DefaultValue    float64 `json:"default_value"`
	IsTaxable       bool    `json:"is_taxable"`
	IsStatutory     bool    `json:"is_statutory"`
}

type ComponentAmount struct {
	Code   string  `json:"code"`
	Name   string  `json:"name"`
	Amount float64 `json:"amount"`
}

type SalaryBreakdown struct {
	BaseSalary      float64           `json:"base_salary"`
	CurrencyCode    string            `json:"currency_code"`
	CurrencySymbol  string            `json:"currency_symbol"`
	GrossEarnings   float64           `json:"gross_earnings"`
	TotalDeductions float64           `json:"total_deductions"`
	NetPay          float64           `json:"net_pay"`
	Earnings        []ComponentAmount `json:"earnings"`
	Deductions      []ComponentAmount `json:"deductions"`
}

// ConvertCurrency converts an amount from a source currency rate to a target currency rate
func ConvertCurrency(amount float64, fromRate float64, toRate float64) float64 {
	if fromRate <= 0 || toRate <= 0 {
		return amount
	}
	// Convert from source to base, then base to target
	baseAmount := amount / fromRate
	return baseAmount * toRate
}

// CalculateSalaryBreakdown generates dynamic earnings and deductions matrix based on base gross salary
func CalculateSalaryBreakdown(baseSalary float64, currencyCode string, currencySymbol string) SalaryBreakdown {
	if baseSalary <= 0 {
		return SalaryBreakdown{CurrencyCode: currencyCode, CurrencySymbol: currencySymbol}
	}

	basic := baseSalary * 0.50
	hra := basic * 0.40
	specialAllowance := baseSalary - (basic + hra)
	if specialAllowance < 0 {
		specialAllowance = 0
	}

	gross := basic + hra + specialAllowance

	pf := basic * 0.12
	tds := gross * 0.10
	profTax := 200.0
	if gross < 15000 {
		profTax = 0.0
	}

	totalDeductions := pf + tds + profTax
	netPay := gross - totalDeductions

	return SalaryBreakdown{
		BaseSalary:      baseSalary,
		CurrencyCode:    currencyCode,
		CurrencySymbol:  currencySymbol,
		GrossEarnings:   gross,
		TotalDeductions: totalDeductions,
		NetPay:          netPay,
		Earnings: []ComponentAmount{
			{Code: "BASIC", Name: "Basic Salary (50%)", Amount: basic},
			{Code: "HRA", Name: "House Rent Allowance (40% Basic)", Amount: hra},
			{Code: "SPECIAL_ALLOWANCE", Name: "Special Allowance", Amount: specialAllowance},
		},
		Deductions: []ComponentAmount{
			{Code: "PF_EMP", Name: "Provident Fund Employee (12% Basic)", Amount: pf},
			{Code: "INCOME_TAX", Name: "TDS / Income Tax (10% Gross)", Amount: tds},
			{Code: "PROF_TAX", Name: "Professional Tax", Amount: profTax},
		},
	}
}

// Register Matrix & Multi-Currency Routes
func (s *Service) RegisterMatrixRoutes(r chi.Router) {
	r.Get("/currencies", s.HandleGetCurrencies)
	r.Post("/currencies", s.HandleUpdateCurrency)
	r.Get("/components", s.HandleGetComponents)
	r.Post("/calculate-preview", s.HandleCalculatePreview)
	r.Post("/structures", s.HandleSaveStructure)
	r.Get("/structures/{employee_id}", s.HandleGetStructure)
}

func (s *Service) HandleGetCurrencies(w http.ResponseWriter, r *http.Request) {
	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	rows, err := s.db.Query(r.Context(), `SELECT code, name, symbol, exchange_rate_to_base, is_base FROM currencies ORDER BY is_base DESC, code ASC`)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	var items []CurrencyItem
	for rows.Next() {
		var item CurrencyItem
		if err := rows.Scan(&item.Code, &item.Name, &item.Symbol, &item.ExchangeRateToBase, &item.IsBase); err == nil {
			items = append(items, item)
		}
	}
	if items == nil {
		items = []CurrencyItem{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": items})
}

func (s *Service) HandleUpdateCurrency(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok || !authz.HasRole(claims, "SUPER_ADMIN", "HR_ADMIN") {
		authz.ForbiddenResponse(w, "FORBIDDEN_ROLE", "Only HR and Super Admins can update currency exchange rates.")
		return
	}

	var req CurrencyItem
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Code == "" || req.ExchangeRateToBase <= 0 {
		http.Error(w, "invalid currency payload", http.StatusBadRequest)
		return
	}

	if s.db != nil {
		_, err := s.db.Exec(r.Context(), `
			INSERT INTO currencies (code, name, symbol, exchange_rate_to_base, is_base, updated_at)
			VALUES ($1, $2, $3, $4, $5, NOW())
			ON CONFLICT (code) DO UPDATE SET
				name = EXCLUDED.name,
				symbol = EXCLUDED.symbol,
				exchange_rate_to_base = EXCLUDED.exchange_rate_to_base,
				is_base = EXCLUDED.is_base,
				updated_at = NOW()
		`, req.Code, req.Name, req.Symbol, req.ExchangeRateToBase, req.IsBase)

		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": err.Error()})
			return
		}

		if s.auditService != nil {
			_ = s.auditService.LogAction(r.Context(), audit.LogEntry{
				UserID:     claims.UserID,
				Action:     "CURRENCY_RATE_UPDATE",
				Module:     "PAYROLL",
				EntityName: "currencies",
				EntityID:   req.Code,
				Reason:     fmt.Sprintf("Exchange rate updated for %s to %.6f", req.Code, req.ExchangeRateToBase),
			})
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Currency exchange rate updated successfully.",
		"data":    req,
	})
}

func (s *Service) HandleGetComponents(w http.ResponseWriter, r *http.Request) {
	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	query := `
		SELECT id::text, COALESCE(code, ''), name, COALESCE(type, 'EARNING') as component_type,
		       COALESCE(calculation_type, 'FLAT') as calculation_type,
		       COALESCE(default_value, 0) as default_value,
		       COALESCE(is_taxable, true) as is_taxable,
		       COALESCE(is_statutory, false) as is_statutory
		FROM salary_components
		ORDER BY type ASC, name ASC
	`

	rows, err := s.db.Query(r.Context(), query)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	var items []SalaryComponentItem
	for rows.Next() {
		var item SalaryComponentItem
		if err := rows.Scan(&item.ID, &item.Code, &item.Name, &item.ComponentType, &item.CalculationType, &item.DefaultValue, &item.IsTaxable, &item.IsStatutory); err == nil {
			items = append(items, item)
		}
	}
	if items == nil {
		items = []SalaryComponentItem{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": items})
}

func (s *Service) HandleCalculatePreview(w http.ResponseWriter, r *http.Request) {
	var req struct {
		BaseSalary   float64 `json:"base_salary"`
		CurrencyCode string  `json:"currency_code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.BaseSalary <= 0 {
		http.Error(w, "invalid salary preview payload", http.StatusBadRequest)
		return
	}

	symbol := "₹"
	if req.CurrencyCode == "USD" {
		symbol = "$"
	} else if req.CurrencyCode == "EUR" {
		symbol = "€"
	} else if req.CurrencyCode == "GBP" {
		symbol = "£"
	} else if req.CurrencyCode == "AED" {
		symbol = "AED "
	}

	breakdown := CalculateSalaryBreakdown(req.BaseSalary, req.CurrencyCode, symbol)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": breakdown})
}

func (s *Service) HandleSaveStructure(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok || !authz.HasRole(claims, "SUPER_ADMIN", "HR_ADMIN") {
		authz.ForbiddenResponse(w, "FORBIDDEN_ROLE", "Only HR and Super Admins can configure employee salary structures.")
		return
	}

	var req struct {
		EmployeeID   string  `json:"employee_id"`
		CurrencyCode string  `json:"currency_code"`
		BaseSalary   float64 `json:"base_salary"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.EmployeeID == "" || req.BaseSalary <= 0 {
		http.Error(w, "invalid structure payload", http.StatusBadRequest)
		return
	}

	if req.CurrencyCode == "" {
		req.CurrencyCode = "INR"
	}

	if s.db != nil {
		// Deactivate current active structure for employee
		_, _ = s.db.Exec(r.Context(), `UPDATE employee_salary_structures SET is_active = false WHERE employee_id = $1::uuid`, req.EmployeeID)

		var structID string
		err := s.db.QueryRow(r.Context(), `
			INSERT INTO employee_salary_structures (employee_id, currency_code, base_salary, is_active, updated_at)
			VALUES ($1::uuid, $2, $3, true, NOW())
			RETURNING id::text
		`, req.EmployeeID, req.CurrencyCode, req.BaseSalary).Scan(&structID)

		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": err.Error()})
			return
		}

		if s.auditService != nil {
			_ = s.auditService.LogAction(r.Context(), audit.LogEntry{
				UserID:     claims.UserID,
				Action:     "SALARY_STRUCTURE_ASSIGNMENT",
				Module:     "PAYROLL",
				EntityName: "employee_salary_structures",
				EntityID:   structID,
				Reason:     fmt.Sprintf("Assigned base salary %.2f %s to employee %s", req.BaseSalary, req.CurrencyCode, req.EmployeeID),
			})
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Employee salary structure saved successfully.",
	})
}

func (s *Service) HandleGetStructure(w http.ResponseWriter, r *http.Request) {
	empID := chi.URLParam(r, "employee_id")
	if empID == "" {
		http.Error(w, "missing employee_id", http.StatusBadRequest)
		return
	}

	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	var currencyCode string
	var baseSalary float64

	err := s.db.QueryRow(r.Context(), `
		SELECT currency_code, base_salary
		FROM employee_salary_structures
		WHERE employee_id = $1::uuid AND is_active = true
		ORDER BY created_at DESC LIMIT 1
	`, empID).Scan(&currencyCode, &baseSalary)

	if err != nil {
		// Return default estimate
		currencyCode = "INR"
		baseSalary = 60000.0
	}

	symbol := "₹"
	if currencyCode == "USD" {
		symbol = "$"
	}

	breakdown := CalculateSalaryBreakdown(baseSalary, currencyCode, symbol)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": breakdown})
}
