package payroll

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/company/hrms-backend/internal/audit"
	"github.com/company/hrms-backend/internal/auth"
	"github.com/company/hrms-backend/internal/authz"
	"github.com/company/hrms-backend/internal/common"
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
	db           *pgxpool.Pool
	auditService *audit.Service
}

func NewService(db *pgxpool.Pool, auditService *audit.Service) *Service {
	return &Service{db: db, auditService: auditService}
}

func (s *Service) RegisterRoutes(r chi.Router) {
	r.Get("/runs", s.HandleGetRuns)
	r.Post("/runs/process", s.HandleProcessPayroll)
	r.Post("/runs/{id}/transition", s.HandleTransitionState)
	r.Get("/runs/{id}/readiness", s.HandleGetRunReadiness)
	r.Get("/readiness", s.HandleGetReadiness)
	r.Get("/advances", s.HandleGetAdvances)
	r.Post("/advances", s.HandleCreateAdvance)
	r.Post("/advances/{id}/approve", s.HandleApproveAdvance)
	r.Get("/payslips", s.HandleGetPayslips)
	r.Get("/payslips/{id}", s.HandleGetPayslipDetails)

	// Sprint 7 Multi-Currency & Salary Component Matrix Engine
	s.RegisterMatrixRoutes(r)
}

type ReadinessResponse struct {
	Ready        bool                   `json:"ready"`
	Month        int                    `json:"month"`
	Year         int                    `json:"year"`
	Errors       []string               `json:"errors"`
	Warnings     []string               `json:"warnings"`
	Statistics   map[string]interface{} `json:"statistics"`
	ActionNeeded string                 `json:"action_needed,omitempty"`
}

func (s *Service) checkPayrollReadiness(ctx context.Context, month int, year int) ReadinessResponse {
	var resp ReadinessResponse
	resp.Month = month
	resp.Year = year
	resp.Errors = []string{}
	resp.Warnings = []string{}
	resp.Statistics = make(map[string]interface{})

	if s.db == nil {
		resp.Errors = append(resp.Errors, "database connection unavailable")
		return resp
	}

	// 1. Employees Check
	var activeEmpCount int
	_ = s.db.QueryRow(ctx, "SELECT COUNT(*) FROM employees WHERE status = 'ACTIVE' AND deleted_at IS NULL").Scan(&activeEmpCount)
	resp.Statistics["active_employees"] = activeEmpCount

	var configuredSalaryCount int
	_ = s.db.QueryRow(ctx, `
		SELECT COUNT(DISTINCT employee_id)
		FROM employee_salary_structures
		WHERE is_active = true
	`).Scan(&configuredSalaryCount)
	resp.Statistics["configured_salaries"] = configuredSalaryCount

	missingSalaries := activeEmpCount - configuredSalaryCount
	if missingSalaries > 0 {
		resp.Warnings = append(resp.Warnings, fmt.Sprintf("%d active employees do not have a configured salary structure (default base rate will apply)", missingSalaries))
	}

	// 2. Attendance Check
	var totalAttendance, validatedCount, pendingCount, rejectedCount int
	_ = s.db.QueryRow(ctx, `
		SELECT 
			COUNT(*),
			COUNT(*) FILTER (WHERE validation_status = 'VALIDATED'),
			COUNT(*) FILTER (WHERE validation_status IN ('TO_VALIDATE', 'OT_PENDING')),
			COUNT(*) FILTER (WHERE validation_status = 'REJECTED')
		FROM attendance_daily_status
		WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2
	`, month, year).Scan(&totalAttendance, &validatedCount, &pendingCount, &rejectedCount)

	resp.Statistics["total_attendance_records"] = totalAttendance
	resp.Statistics["validated_attendance"] = validatedCount
	resp.Statistics["pending_attendance"] = pendingCount
	resp.Statistics["rejected_attendance"] = rejectedCount

	if totalAttendance == 0 {
		resp.Warnings = append(resp.Warnings, fmt.Sprintf("No attendance records found for period %02d/%d", month, year))
	} else if pendingCount > 0 {
		resp.Errors = append(resp.Errors, fmt.Sprintf("PAYROLL_BLOCKED_UNVALIDATED_ATTENDANCE: %d attendance records are pending validation for period %02d/%d", pendingCount, month, year))
		resp.ActionNeeded = fmt.Sprintf("Validate remaining %d attendance records before proceeding with payroll execution", pendingCount)
	}

	// 3. Leave & LOP Check
	var approvedLeaveCount int
	_ = s.db.QueryRow(ctx, `
		SELECT COUNT(*)
		FROM leave_requests
		WHERE status = 'APPROVED'
		  AND EXTRACT(MONTH FROM start_date) = $1 AND EXTRACT(YEAR FROM start_date) = $2
	`, month, year).Scan(&approvedLeaveCount)
	resp.Statistics["approved_leaves"] = approvedLeaveCount

	// 4. Advances Check
	var activeAdvancesCount int
	var totalAdvanceAmount float64
	_ = s.db.QueryRow(ctx, `
		SELECT COUNT(*), COALESCE(SUM(amount), 0.0)
		FROM payroll_advances
		WHERE deduct_from_month = $1 AND deduct_from_year = $2 AND status IN ('PENDING', 'APPROVED')
	`, month, year).Scan(&activeAdvancesCount, &totalAdvanceAmount)

	resp.Statistics["active_advances_count"] = activeAdvancesCount
	resp.Statistics["total_advance_amount"] = totalAdvanceAmount

	resp.Ready = len(resp.Errors) == 0
	return resp
}

func (s *Service) HandleGetReadiness(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok || !authz.CanManagePayroll(claims) {
		authz.ForbiddenResponse(w, "FORBIDDEN_ROLE", "Only Payroll Admins can check payroll readiness.")
		return
	}

	monthStr := r.URL.Query().Get("month")
	yearStr := r.URL.Query().Get("year")

	month := int(time.Now().Month())
	year := time.Now().Year()

	if monthStr != "" {
		fmt.Sscanf(monthStr, "%d", &month)
	}
	if yearStr != "" {
		fmt.Sscanf(yearStr, "%d", &year)
	}

	report := s.checkPayrollReadiness(r.Context(), month, year)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    report,
	})
}

func (s *Service) HandleGetRunReadiness(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok || !authz.CanManagePayroll(claims) {
		authz.ForbiddenResponse(w, "FORBIDDEN_ROLE", "Only Payroll Admins can check payroll readiness.")
		return
	}

	id := chi.URLParam(r, "id")
	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	var month, year int
	err := s.db.QueryRow(r.Context(), "SELECT month, year FROM payroll_runs WHERE id::text = $1", id).Scan(&month, &year)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "payroll run not found"})
		return
	}

	report := s.checkPayrollReadiness(r.Context(), month, year)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    report,
	})
}

func (s *Service) HandleGetRuns(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok || !authz.CanManagePayroll(claims) {
		authz.ForbiddenResponse(w, "FORBIDDEN_ROLE", "Only Payroll Admins can access payroll runs.")
		return
	}

	pg := common.ParsePaginationParams(r)
	w.Header().Set("Content-Type", "application/json")
	if s.db == nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	var total int
	_ = s.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM payroll_runs").Scan(&total)

	rows, err := s.db.Query(r.Context(), `
		SELECT pr.id::text, pr.month, pr.year, pr.status,
		       COALESCE(NULLIF(pr.total_employees, 0), ps.emp_count, 0) as total_employees,
		       COALESCE(NULLIF(pr.total_gross, 0), ps.gross, 0.0) as total_gross,
		       COALESCE(NULLIF(pr.total_deductions, 0), ps.deductions, 0.0) as total_deductions,
		       COALESCE(NULLIF(pr.total_net_pay, 0), ps.net_pay, 0.0) as total_net_pay,
		       COALESCE(pr.total_lop_days, 0.0),
		       COALESCE(pr.total_advances_deducted, 0.0), COALESCE(pr.variance_percentage, 0.0), pr.created_at
		FROM payroll_runs pr
		LEFT JOIN (
		    SELECT payroll_run_id, COUNT(*) as emp_count,
		           COALESCE(SUM(total_earnings), 0.0) as gross,
		           COALESCE(SUM(total_deductions), 0.0) as deductions,
		           COALESCE(SUM(net_pay), 0.0) as net_pay
		    FROM payslips GROUP BY payroll_run_id
		) ps ON pr.id = ps.payroll_run_id
		ORDER BY pr.year DESC, pr.month DESC
		LIMIT $1 OFFSET $2
	`, pg.Limit, pg.Offset)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success":    true,
			"data":       []PayrollRun{},
			"total":      0,
			"pagination": common.BuildPaginationMeta(0, pg.Page, pg.Limit),
		})
		return
	}
	defer rows.Close()

	var runs []PayrollRun
	for rows.Next() {
		var pr PayrollRun
		if err := rows.Scan(
			&pr.ID, &pr.Month, &pr.Year, &pr.Status, &pr.TotalEmployees,
			&pr.TotalGross, &pr.TotalDeductions, &pr.TotalNetPay, &pr.TotalLopDays,
			&pr.TotalAdvancesDeducted, &pr.VariancePercentage, &pr.CreatedAt,
		); err == nil {
			runs = append(runs, pr)
		}
	}
	if runs == nil {
		runs = []PayrollRun{}
	}

	meta := common.BuildPaginationMeta(total, pg.Page, pg.Limit)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    true,
		"data":       runs,
		"total":      total,
		"pagination": meta,
	})
}

func (s *Service) HandleProcessPayroll(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok || !authz.CanManagePayroll(claims) {
		authz.ForbiddenResponse(w, "FORBIDDEN_ROLE", "Only Payroll Admins can process payroll runs.")
		return
	}

	var req ProcessRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Month < 1 || req.Month > 12 || req.Year < 2000 {
		http.Error(w, "invalid payload", http.StatusBadRequest)
		return
	}

	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	// Check readiness first
	readiness := s.checkPayrollReadiness(r.Context(), req.Month, req.Year)
	if !readiness.Ready {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success":   false,
			"error":     readiness.Errors[0],
			"readiness": readiness,
		})
		return
	}

	// Fetch or create payroll run
	var orgID string
	_ = s.db.QueryRow(r.Context(), "SELECT id FROM organizations LIMIT 1").Scan(&orgID)

	var runID string
	var currentStatus string
	err := s.db.QueryRow(r.Context(), `
		SELECT id::text, status FROM payroll_runs WHERE month = $1 AND year = $2
	`, req.Month, req.Year).Scan(&runID, &currentStatus)

	if err == nil {
		if currentStatus == "LOCKED" || currentStatus == "PUBLISHED" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "payroll run for period is LOCKED or PUBLISHED and cannot be re-processed"})
			return
		}
	} else {
		err = s.db.QueryRow(r.Context(), `
			INSERT INTO payroll_runs (organization_id, month, year, status, processed_by, processed_at)
			VALUES ($1::uuid, $2, $3, 'PROCESSING', $4::uuid, NOW())
			RETURNING id::text
		`, orgID, req.Month, req.Year, claims.UserID).Scan(&runID)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "failed to initialize payroll run: " + err.Error()})
			return
		}
	}

	// Process employees and generate payslips
	rows, err := s.db.Query(r.Context(), `
		SELECT e.id::text, e.employee_id, e.first_name || ' ' || e.last_name as full_name,
		       COALESCE(ess.base_salary, 60000.0) as base_salary,
		       COALESCE(ess.currency_code, 'INR') as currency_code
		FROM employees e
		LEFT JOIN employee_salary_structures ess ON e.id = ess.employee_id AND ess.is_active = true
		WHERE e.status = 'ACTIVE' AND e.deleted_at IS NULL
	`)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "failed to query employees: " + err.Error()})
		return
	}
	defer rows.Close()

	type empProc struct {
		ID           string
		EmpCode      string
		FullName     string
		BaseSalary   float64
		CurrencyCode string
	}
	var empList []empProc
	for rows.Next() {
		var ep empProc
		if err := rows.Scan(&ep.ID, &ep.EmpCode, &ep.FullName, &ep.BaseSalary, &ep.CurrencyCode); err == nil {
			empList = append(empList, ep)
		}
	}
	rows.Close()

	var grandGross, grandDeductions, grandNet, grandLopDays, grandAdvances float64

	for _, ep := range empList {
		// Calculate base dynamic salary breakdown
		breakdown := CalculateSalaryBreakdown(ep.BaseSalary, ep.CurrencyCode, "₹")

		// Query LOP days for this employee in period (e.g. status ABSENT or LOP)
		var lopDays float64
		_ = s.db.QueryRow(r.Context(), `
			SELECT COUNT(*)
			FROM attendance_daily_status
			WHERE employee_id = $1::uuid
			  AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3
			  AND status IN ('ABSENT', 'LOP')
		`, ep.ID, req.Month, req.Year).Scan(&lopDays)

		// LOP deduction calculation: (Gross / 30) * LopDays
		lopDeduction := (breakdown.GrossEarnings / 30.0) * lopDays

		// Query pending/approved advances for this employee in period
		var advanceDeduction float64
		var advanceID string
		_ = s.db.QueryRow(r.Context(), `
			SELECT id::text, amount
			FROM payroll_advances
			WHERE employee_id = $1::uuid
			  AND deduct_from_month = $2 AND deduct_from_year = $3
			  AND status IN ('PENDING', 'APPROVED')
			LIMIT 1
		`, ep.ID, req.Month, req.Year).Scan(&advanceID, &advanceDeduction)

		if advanceID != "" {
			_, _ = s.db.Exec(r.Context(), "UPDATE payroll_advances SET status = 'DEDUCTED', updated_at = NOW() WHERE id::text = $1", advanceID)
		}

		basicPay := breakdown.Earnings[0].Amount
		hra := breakdown.Earnings[1].Amount
		gross := breakdown.GrossEarnings
		totalDed := breakdown.TotalDeductions + lopDeduction + advanceDeduction
		netPay := gross - totalDed
		if netPay < 0 {
			netPay = 0
		}

		// Insert or update payslip
		_, err = s.db.Exec(r.Context(), `
			INSERT INTO payslips (
				payroll_run_id, employee_id, basic_pay, hra, total_earnings,
				total_deductions, net_pay, status, updated_at
			) VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, 'GENERATED', NOW())
			ON CONFLICT (payroll_run_id, employee_id) DO UPDATE SET
				basic_pay = EXCLUDED.basic_pay,
				hra = EXCLUDED.hra,
				total_earnings = EXCLUDED.total_earnings,
				total_deductions = EXCLUDED.total_deductions,
				net_pay = EXCLUDED.net_pay,
				status = 'GENERATED',
				updated_at = NOW()
		`, runID, ep.ID, basicPay, hra, gross, totalDed, netPay)

		grandGross += gross
		grandDeductions += totalDed
		grandNet += netPay
		grandLopDays += lopDays
		grandAdvances += advanceDeduction
	}

	// Update payroll_runs totals & status
	_, err = s.db.Exec(r.Context(), `
		UPDATE payroll_runs SET
			status = 'VALIDATED',
			total_employees = $1,
			total_gross = $2,
			total_deductions = $3,
			total_net_pay = $4,
			total_lop_days = $5,
			total_advances_deducted = $6,
			processed_at = NOW(),
			processed_by = $7::uuid
		WHERE id::text = $8
	`, len(empList), grandGross, grandDeductions, grandNet, grandLopDays, grandAdvances, claims.UserID, runID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("Payroll processed successfully for period %02d/%d across %d employees.", req.Month, req.Year, len(empList)),
		"data": map[string]interface{}{
			"payroll_run_id":          runID,
			"month":                   req.Month,
			"year":                    req.Year,
			"status":                  "VALIDATED",
			"total_employees":         len(empList),
			"total_gross":             grandGross,
			"total_deductions":        grandDeductions,
			"total_net_pay":           grandNet,
			"total_lop_days":          grandLopDays,
			"total_advances_deducted": grandAdvances,
		},
		"readiness": readiness,
	})
}

func (s *Service) HandleTransitionState(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	claims, ok := auth.GetClaims(r)
	if !ok || !authz.CanManagePayroll(claims) {
		authz.ForbiddenResponse(w, "FORBIDDEN_ROLE", "Only Payroll Admins can transition payroll run state.")
		return
	}

	var req TransitionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	var currentStatus string
	err := s.db.QueryRow(r.Context(), "SELECT status FROM payroll_runs WHERE id::text = $1", id).Scan(&currentStatus)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "payroll run not found"})
		return
	}

	if currentStatus == "LOCKED" && req.Action != "PUBLISH" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "payroll run is LOCKED and can only be PUBLISHED"})
		return
	}
	if currentStatus == "PUBLISHED" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "payroll run is PUBLISHED and state cannot be mutated"})
		return
	}

	nextStatus := currentStatus
	switch req.Action {
	case "VALIDATE":
		nextStatus = "VALIDATED"
		_, _ = s.db.Exec(r.Context(), "UPDATE payroll_runs SET status = 'VALIDATED' WHERE id::text = $1", id)
	case "APPROVE":
		nextStatus = "APPROVED"
		_, _ = s.db.Exec(r.Context(), "UPDATE payroll_runs SET status = 'APPROVED', approved_by = $1::uuid, approved_at = NOW() WHERE id::text = $2", claims.UserID, id)
	case "LOCK":
		nextStatus = "LOCKED"
		_, _ = s.db.Exec(r.Context(), "UPDATE payroll_runs SET status = 'LOCKED', locked_at = NOW() WHERE id::text = $1", id)
	case "PUBLISH":
		nextStatus = "PUBLISHED"
		_, _ = s.db.Exec(r.Context(), "UPDATE payroll_runs SET status = 'PUBLISHED' WHERE id::text = $1", id)
		_, _ = s.db.Exec(r.Context(), "UPDATE payslips SET status = 'PUBLISHED' WHERE payroll_run_id::text = $1", id)
	default:
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "invalid transition action: " + req.Action})
		return
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
	pg := common.ParsePaginationParams(r)
	w.Header().Set("Content-Type", "application/json")
	if s.db == nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	var total int
	_ = s.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM payroll_advances").Scan(&total)

	rows, err := s.db.Query(r.Context(), `
		SELECT pa.id::text, e.employee_id, e.first_name || ' ' || e.last_name,
		       pa.amount, COALESCE(pa.reason, ''), pa.deduct_from_month, pa.deduct_from_year,
		       COALESCE(pa.status, 'PENDING'), pa.created_at
		FROM payroll_advances pa
		JOIN employees e ON pa.employee_id = e.id
		ORDER BY pa.created_at DESC
		LIMIT $1 OFFSET $2
	`, pg.Limit, pg.Offset)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success":    true,
			"data":       []PayrollAdvance{},
			"total":      0,
			"pagination": common.BuildPaginationMeta(0, pg.Page, pg.Limit),
		})
		return
	}
	defer rows.Close()

	var advances []PayrollAdvance
	for rows.Next() {
		var pa PayrollAdvance
		if err := rows.Scan(
			&pa.ID, &pa.EmployeeID, &pa.EmployeeName, &pa.Amount, &pa.Reason,
			&pa.DeductFromMonth, &pa.DeductFromYear, &pa.Status, &pa.CreatedAt,
		); err == nil {
			advances = append(advances, pa)
		}
	}
	if advances == nil {
		advances = []PayrollAdvance{}
	}

	meta := common.BuildPaginationMeta(total, pg.Page, pg.Limit)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    true,
		"data":       advances,
		"total":      total,
		"pagination": meta,
	})
}

func (s *Service) HandleCreateAdvance(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok {
		authz.UnauthorizedResponse(w)
		return
	}

	var req AdvanceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Amount <= 0 || req.DeductFromMonth < 1 || req.DeductFromMonth > 12 {
		http.Error(w, "invalid request payload", http.StatusBadRequest)
		return
	}

	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	var empID string
	if req.EmployeeID != "" {
		_ = s.db.QueryRow(r.Context(), "SELECT id::text FROM employees WHERE (id::text = $1 OR employee_id = $1) LIMIT 1", req.EmployeeID).Scan(&empID)
	}
	if empID == "" {
		_ = s.db.QueryRow(r.Context(), "SELECT id::text FROM employees WHERE (user_id::text = $1 OR id::text = $1) LIMIT 1", claims.UserID).Scan(&empID)
	}

	if empID == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "employee record not found"})
		return
	}

	var advanceID string
	err := s.db.QueryRow(r.Context(), `
		INSERT INTO payroll_advances (employee_id, amount, recovery_months, reason, deduct_from_month, deduct_from_year, status)
		VALUES ($1::uuid, $2, 1, $3, $4, $5, 'APPROVED')
		RETURNING id::text
	`, empID, req.Amount, req.Reason, req.DeductFromMonth, req.DeductFromYear).Scan(&advanceID)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "failed to create advance: " + err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Salary advance request created successfully.",
		"id":      advanceID,
	})
}

func (s *Service) HandleApproveAdvance(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	claims, ok := auth.GetClaims(r)
	if !ok || !authz.CanManagePayroll(claims) {
		authz.ForbiddenResponse(w, "FORBIDDEN_ROLE", "Only Payroll Admins can approve salary advances.")
		return
	}

	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	_, err := s.db.Exec(r.Context(), `
		UPDATE payroll_advances SET status = 'APPROVED', approved_by = $1::uuid, updated_at = NOW()
		WHERE id::text = $2
	`, claims.UserID, id)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Advance request " + id + " approved.",
	})
}

func (s *Service) HandleGetPayslips(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok {
		authz.UnauthorizedResponse(w)
		return
	}

	pg := common.ParsePaginationParams(r)
	w.Header().Set("Content-Type", "application/json")
	if s.db == nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	var callerEmpID string
	s.db.QueryRow(r.Context(), "SELECT id::text FROM employees WHERE user_id::text = $1 OR id::text = $1 LIMIT 1", claims.UserID).Scan(&callerEmpID)

	var conditions []string
	var args []interface{}
	i := 1

	// Scoping logic: if non-payroll admin, restrict to self payslips
	if !authz.CanManagePayroll(claims) {
		conditions = append(conditions, fmt.Sprintf("(e.user_id::text = $%d OR e.id::text = $%d)", i, i+1))
		args = append(args, claims.UserID, callerEmpID)
		i += 2
	}

	if pg.Search != "" {
		conditions = append(conditions, fmt.Sprintf("(e.first_name ILIKE $%d OR e.last_name ILIKE $%d OR e.employee_id ILIKE $%d)", i, i, i))
		args = append(args, "%"+pg.Search+"%")
		i++
	}

	where := ""
	if len(conditions) > 0 {
		where = "WHERE " + strings.Join(conditions, " AND ")
	}

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM payslips ps JOIN employees e ON ps.employee_id = e.id %s", where)
	_ = s.db.QueryRow(r.Context(), countQuery, args...).Scan(&total)

	dataArgs := append(args, pg.Limit, pg.Offset)
	query := fmt.Sprintf(`
		SELECT ps.id::text, e.employee_id, e.first_name || ' ' || e.last_name as employee_name,
		       COALESCE(des.name, 'Engineer') as designation,
		       COALESCE(d.name, 'Engineering') as department,
		       COALESCE(to_char(to_date(lpad(pr.month::text, 2, '0'), 'MM'), 'FMMonth'), 'September') as month,
		       COALESCE(pr.year, 2026) as year,
		       COALESCE(ps.basic_pay, 0.0), COALESCE(ps.hra, 0.0),
		       COALESCE(ps.total_earnings - ps.basic_pay - ps.hra, 0.0) as special_allowance,
		       0.0 as lop_deduction, 0.0 as advance_deduction,
		       COALESCE(ps.basic_pay * 0.12, 0.0) as pf,
		       COALESCE(ps.total_earnings * 0.10, 0.0) as tds, 200.0 as ptax,
		       COALESCE(ps.total_earnings, 0.0), COALESCE(ps.total_deductions, 0.0),
		       COALESCE(ps.net_pay, 0.0), COALESCE(ps.status, 'PUBLISHED')
		FROM payslips ps
		JOIN employees e ON ps.employee_id = e.id
		LEFT JOIN payroll_runs pr ON ps.payroll_run_id = pr.id
		LEFT JOIN departments d ON e.department_id = d.id
		LEFT JOIN designations des ON e.designation_id = des.id
		%s
		ORDER BY e.employee_id ASC
		LIMIT $%d OFFSET $%d
	`, where, i, i+1)

	rows, err := s.db.Query(r.Context(), query, dataArgs...)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success":    true,
			"data":       []Payslip{},
			"total":      0,
			"pagination": common.BuildPaginationMeta(0, pg.Page, pg.Limit),
		})
		return
	}
	defer rows.Close()

	var slips []Payslip
	for rows.Next() {
		var p Payslip
		if err := rows.Scan(
			&p.ID, &p.EmployeeID, &p.EmployeeName, &p.Designation, &p.Department,
			&p.Month, &p.Year, &p.BasicPay, &p.HRA, &p.SpecialAllowance,
			&p.LopDeduction, &p.AdvanceDeduction, &p.PF, &p.TDS, &p.PTax,
			&p.TotalEarnings, &p.TotalDeductions, &p.NetPay, &p.Status,
		); err == nil {
			slips = append(slips, p)
		}
	}
	if slips == nil {
		slips = []Payslip{}
	}

	meta := common.BuildPaginationMeta(total, pg.Page, pg.Limit)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    true,
		"data":       slips,
		"total":      total,
		"pagination": meta,
	})
}

func (s *Service) HandleGetPayslipDetails(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	claims, ok := auth.GetClaims(r)
	if !ok {
		authz.UnauthorizedResponse(w)
		return
	}

	scopeCond := "1=1"
	if !authz.HasRole(claims, "SUPER_ADMIN", "HR_ADMIN", "PAYROLL_ADMIN") {
		scopeCond = fmt.Sprintf("(e.user_id::text = '%s' OR e.id::text = '%s')", claims.UserID, claims.UserID)
	}

	var p Payslip
	err := s.db.QueryRow(r.Context(), fmt.Sprintf(`
		SELECT ps.id::text, e.employee_id, e.first_name || ' ' || e.last_name as employee_name,
		       COALESCE(des.name, 'Engineer') as designation,
		       COALESCE(d.name, 'Engineering') as department,
		       COALESCE(to_char(to_date(lpad(pr.month::text, 2, '0'), 'MM'), 'FMMonth'), 'September') as month,
		       COALESCE(pr.year, 2026) as year, COALESCE(ps.basic_pay, 0.0), COALESCE(ps.hra, 0.0), 0.0 as special_allowance,
		       0.0 as lop_deduction, 0.0 as advance_deduction, 0.0 as pf, 0.0 as tds, 200.0 as ptax,
		       COALESCE(ps.total_earnings, 0.0), COALESCE(ps.total_deductions, 0.0), COALESCE(ps.net_pay, 0.0), COALESCE(ps.status, 'PUBLISHED')
		FROM payslips ps
		JOIN employees e ON ps.employee_id = e.id
		LEFT JOIN payroll_runs pr ON ps.payroll_run_id = pr.id
		LEFT JOIN departments d ON e.department_id = d.id
		LEFT JOIN designations des ON e.designation_id = des.id
		WHERE (ps.id::text = $1 OR e.employee_id = $1) AND %s
	`, scopeCond), id).Scan(
		&p.ID, &p.EmployeeID, &p.EmployeeName, &p.Designation, &p.Department,
		&p.Month, &p.Year, &p.BasicPay, &p.HRA, &p.SpecialAllowance,
		&p.LopDeduction, &p.AdvanceDeduction, &p.PF, &p.TDS, &p.PTax,
		&p.TotalEarnings, &p.TotalDeductions, &p.NetPay, &p.Status,
	)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "payslip not found: " + err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    p,
	})
}

func stringPtr(s string) *string {
	return &s
}

func timePtr(t time.Time) *time.Time {
	return &t
}
