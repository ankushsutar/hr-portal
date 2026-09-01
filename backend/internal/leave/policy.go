package leave

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/company/hrms-backend/internal/audit"
	"github.com/company/hrms-backend/internal/auth"
	"github.com/company/hrms-backend/internal/authz"
	"github.com/go-chi/chi/v5"
)

type LeavePolicyItem struct {
	ID                  string  `json:"id"`
	LeaveTypeID         string  `json:"leave_type_id"`
	LeaveTypeName       string  `json:"leave_type_name,omitempty"`
	LeaveTypeCode       string  `json:"leave_type_code,omitempty"`
	PolicyName          string  `json:"policy_name"`
	AccrualFrequency    string  `json:"accrual_frequency"` // MONTHLY, QUARTERLY, ANNUAL
	AccrualRate         float64 `json:"accrual_rate"`
	MaxCarryForwardDays int     `json:"max_carry_forward_days"`
	SandwichRuleEnabled bool    `json:"sandwich_rule_enabled"`
	IsEncashable        bool    `json:"is_encashable"`
}

type AccrualLogItem struct {
	ID            string  `json:"id"`
	EmployeeID    string  `json:"employee_id"`
	EmployeeCode  string  `json:"employee_code"`
	EmployeeName  string  `json:"employee_name"`
	LeaveTypeName string  `json:"leave_type_name"`
	AccrualDate   string  `json:"accrual_date"`
	DaysAdded     float64 `json:"days_added"`
	Reason        string  `json:"reason"`
}

// EvaluateSandwichRule calculates leave duration considering Sandwich Rule policies
func EvaluateSandwichRule(startDate, endDate time.Time, isSandwichEnabled bool) float64 {
	if endDate.Before(startDate) {
		return 0
	}

	days := 0.0
	curr := startDate

	for !curr.After(endDate) {
		isWeekend := curr.Weekday() == time.Saturday || curr.Weekday() == time.Sunday
		if !isWeekend {
			days += 1.0
		} else if isSandwichEnabled {
			// If sandwich rule is active, weekends falling within or adjacent to leave are counted
			days += 1.0
		}
		curr = curr.AddDate(0, 0, 1)
	}

	return days
}

// Register Policy Routes
func (s *Service) RegisterPolicyRoutes(r chi.Router) {
	r.Get("/policies", s.HandleGetPolicies)
	r.Post("/policies", s.HandleUpsertPolicy)
	r.Post("/accrue-batch", s.HandleProcessBatchAccruals)
	r.Get("/accrual-logs", s.HandleGetAccrualLogs)
}

func (s *Service) HandleGetPolicies(w http.ResponseWriter, r *http.Request) {
	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	query := `
		SELECT lp.id::text, lp.leave_type_id::text, lt.name as leave_type_name, lt.code as leave_type_code,
		       lp.policy_name, lp.accrual_frequency, lp.accrual_rate, lp.max_carry_forward_days,
		       lp.sandwich_rule_enabled, lp.is_encashable
		FROM leave_policies lp
		JOIN leave_types lt ON lp.leave_type_id = lt.id
		ORDER BY lt.name ASC
	`

	rows, err := s.db.Query(r.Context(), query)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	var items []LeavePolicyItem
	for rows.Next() {
		var item LeavePolicyItem
		if err := rows.Scan(
			&item.ID, &item.LeaveTypeID, &item.LeaveTypeName, &item.LeaveTypeCode,
			&item.PolicyName, &item.AccrualFrequency, &item.AccrualRate, &item.MaxCarryForwardDays,
			&item.SandwichRuleEnabled, &item.IsEncashable,
		); err == nil {
			items = append(items, item)
		}
	}
	if items == nil {
		items = []LeavePolicyItem{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": items})
}

func (s *Service) HandleUpsertPolicy(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok || !authz.HasRole(claims, "SUPER_ADMIN", "HR_ADMIN") {
		authz.ForbiddenResponse(w, "FORBIDDEN_ROLE", "Only HR and Super Admins can update leave policies.")
		return
	}

	var req LeavePolicyItem
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.LeaveTypeID == "" {
		http.Error(w, "invalid policy payload", http.StatusBadRequest)
		return
	}

	if req.PolicyName == "" {
		req.PolicyName = "Standard Policy"
	}
	if req.AccrualFrequency == "" {
		req.AccrualFrequency = "MONTHLY"
	}

	if s.db != nil {
		query := `
			INSERT INTO leave_policies (
				leave_type_id, policy_name, accrual_frequency, accrual_rate,
				max_carry_forward_days, sandwich_rule_enabled, is_encashable, updated_at
			) VALUES (
				$1::uuid, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP
			) ON CONFLICT (leave_type_id) DO UPDATE SET
				policy_name = EXCLUDED.policy_name,
				accrual_frequency = EXCLUDED.accrual_frequency,
				accrual_rate = EXCLUDED.accrual_rate,
				max_carry_forward_days = EXCLUDED.max_carry_forward_days,
				sandwich_rule_enabled = EXCLUDED.sandwich_rule_enabled,
				is_encashable = EXCLUDED.is_encashable,
				updated_at = CURRENT_TIMESTAMP
			RETURNING id::text
		`

		var id string
		err := s.db.QueryRow(r.Context(), query,
			req.LeaveTypeID, req.PolicyName, req.AccrualFrequency, req.AccrualRate,
			req.MaxCarryForwardDays, req.SandwichRuleEnabled, req.IsEncashable,
		).Scan(&id)

		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "failed to save policy: " + err.Error()})
			return
		}
		req.ID = id

		if s.auditService != nil {
			_ = s.auditService.LogAction(r.Context(), audit.LogEntry{
				UserID:     claims.UserID,
				Action:     "LEAVE_POLICY_UPDATE",
				Module:     "LEAVE",
				EntityName: "leave_policies",
				EntityID:   id,
				AfterState: map[string]interface{}{
					"policy_name":      req.PolicyName,
					"accrual_frequency": req.AccrualFrequency,
					"accrual_rate":      req.AccrualRate,
					"sandwich_rule":     req.SandwichRuleEnabled,
				},
			})
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Leave policy configured successfully.",
		"data":    req,
	})
}

func (s *Service) HandleProcessBatchAccruals(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok || !authz.HasRole(claims, "SUPER_ADMIN", "HR_ADMIN") {
		authz.ForbiddenResponse(w, "FORBIDDEN_ROLE", "Only HR and Super Admins can execute batch leave accruals.")
		return
	}

	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	// 1. Query active policies
	policiesQuery := `
		SELECT leave_type_id::text, accrual_rate
		FROM leave_policies
		WHERE accrual_rate > 0
	`
	rows, err := s.db.Query(r.Context(), policiesQuery)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": err.Error()})
		return
	}

	type pol struct {
		leaveTypeID string
		rate        float64
	}
	var pols []pol
	for rows.Next() {
		var p pol
		if err := rows.Scan(&p.leaveTypeID, &p.rate); err == nil {
			pols = append(pols, p)
		}
	}
	rows.Close()

	// 2. Query active employees
	empRows, err := s.db.Query(r.Context(), `SELECT id::text FROM employees WHERE status = 'ACTIVE'`)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": err.Error()})
		return
	}

	var empIDs []string
	for empRows.Next() {
		var id string
		if err := empRows.Scan(&id); err == nil {
			empIDs = append(empIDs, id)
		}
	}
	empRows.Close()

	accruedCount := 0
	todayStr := time.Now().Format("2006-01-02")

	for _, empID := range empIDs {
		for _, p := range pols {
			// Update or insert leave balance
			_, _ = s.db.Exec(r.Context(), `
				INSERT INTO leave_balances (employee_id, leave_type_id, total_allocated, used, pending)
				VALUES ($1::uuid, $2::uuid, $3, 0, 0)
				ON CONFLICT (employee_id, leave_type_id) DO UPDATE SET
					total_allocated = leave_balances.total_allocated + EXCLUDED.total_allocated,
					updated_at = CURRENT_TIMESTAMP
			`, empID, p.leaveTypeID, p.rate)

			// Log accrual
			_, _ = s.db.Exec(r.Context(), `
				INSERT INTO leave_accrual_logs (employee_id, leave_type_id, accrual_date, days_added, reason)
				VALUES ($1::uuid, $2::uuid, $3::date, $4, 'Monthly Automated Accrual Run')
			`, empID, p.leaveTypeID, todayStr, p.rate)

			accruedCount++
		}
	}

	if s.auditService != nil {
		_ = s.auditService.LogAction(r.Context(), audit.LogEntry{
			UserID: claims.UserID,
			Action: "LEAVE_BATCH_ACCRUAL",
			Module: "LEAVE",
			Reason: fmt.Sprintf("Executed batch leave accruals for %d employee-leave records.", accruedCount),
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("Batch leave accrual complete. Updated %d leave balances.", accruedCount),
		"count":   accruedCount,
	})
}

func (s *Service) HandleGetAccrualLogs(w http.ResponseWriter, r *http.Request) {
	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	query := `
		SELECT lal.id::text, lal.employee_id::text, e.employee_id as employee_code,
		       e.first_name || ' ' || e.last_name as employee_name,
		       lt.name as leave_type_name,
		       to_char(lal.accrual_date, 'YYYY-MM-DD') as accrual_date,
		       lal.days_added, COALESCE(lal.reason, '') as reason
		FROM leave_accrual_logs lal
		JOIN employees e ON lal.employee_id = e.id
		JOIN leave_types lt ON lal.leave_type_id = lt.id
		ORDER BY lal.created_at DESC
		LIMIT 100
	`

	rows, err := s.db.Query(r.Context(), query)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	var logs []AccrualLogItem
	for rows.Next() {
		var log AccrualLogItem
		if err := rows.Scan(&log.ID, &log.EmployeeID, &log.EmployeeCode, &log.EmployeeName, &log.LeaveTypeName, &log.AccrualDate, &log.DaysAdded, &log.Reason); err == nil {
			logs = append(logs, log)
		}
	}
	if logs == nil {
		logs = []AccrualLogItem{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": logs})
}
