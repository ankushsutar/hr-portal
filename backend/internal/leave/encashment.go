package leave

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/company/hrms-backend/internal/audit"
	"github.com/company/hrms-backend/internal/auth"
	"github.com/company/hrms-backend/internal/authz"
	"github.com/go-chi/chi/v5"
)

type LeaveEncashmentItem struct {
	ID            string  `json:"id"`
	EmployeeID    string  `json:"employee_id"`
	EmployeeCode  string  `json:"employee_code,omitempty"`
	EmployeeName  string  `json:"employee_name,omitempty"`
	LeaveTypeID   string  `json:"leave_type_id"`
	LeaveTypeName string  `json:"leave_type_name,omitempty"`
	DaysToEncash  float64 `json:"days_to_encash"`
	PerDayRate    float64 `json:"per_day_rate"`
	TotalAmount   float64 `json:"total_amount"`
	Status        string  `json:"status"` // PENDING, APPROVED, REJECTED, PAID
	Reason        string  `json:"reason"`
	ApprovedBy    string  `json:"approved_by,omitempty"`
	ApprovedAt    string  `json:"approved_at,omitempty"`
	CreatedAt     string  `json:"created_at,omitempty"`
}

type LeaveApprovalLevelItem struct {
	ID                 string `json:"id"`
	LeaveApplicationID string `json:"leave_application_id"`
	Level              int    `json:"level"`
	ApproverID         string `json:"approver_id"`
	ApproverName       string `json:"approver_name,omitempty"`
	Status             string `json:"status"` // PENDING, APPROVED, REJECTED
	Comments           string `json:"comments"`
	ActionAt           string `json:"action_at,omitempty"`
}

// CalculateEncashmentAmount calculates daily rate and total monetary payout
func CalculateEncashmentAmount(days float64, monthlyGross float64) (float64, float64) {
	if days <= 0 || monthlyGross <= 0 {
		return 0.0, 0.0
	}
	perDayRate := monthlyGross / 30.0
	totalAmount := days * perDayRate
	return perDayRate, totalAmount
}

// ProcessMultiLevelApproval evaluates approval state transitions for multi-step approval workflows
func ProcessMultiLevelApproval(currentLevel int, maxLevels int, action string) (nextLevel int, finalStatus string) {
	if action == "REJECT" {
		return currentLevel, "REJECTED"
	}
	if action == "APPROVE" {
		if currentLevel < maxLevels {
			return currentLevel + 1, "PENDING"
		}
		return currentLevel, "APPROVED"
	}
	return currentLevel, "PENDING"
}

// Register Encashment Routes
func (s *Service) RegisterEncashmentRoutes(r chi.Router) {
	r.Get("/encashment", s.HandleGetEncashments)
	r.Post("/encashment", s.HandleSubmitEncashment)
	r.Post("/encashment/review", s.HandleReviewEncashment)
}

func (s *Service) HandleGetEncashments(w http.ResponseWriter, r *http.Request) {
	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	query := `
		SELECT ler.id::text, ler.employee_id::text, e.employee_id as employee_code,
		       e.first_name || ' ' || e.last_name as employee_name,
		       ler.leave_type_id::text, lt.name as leave_type_name,
		       ler.days_to_encash, ler.per_day_rate, ler.total_amount, ler.status,
		       COALESCE(ler.reason, '') as reason,
		       to_char(ler.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
		FROM leave_encashment_requests ler
		JOIN employees e ON ler.employee_id = e.id
		JOIN leave_types lt ON ler.leave_type_id = lt.id
		ORDER BY ler.created_at DESC
	`

	rows, err := s.db.Query(r.Context(), query)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	var items []LeaveEncashmentItem
	for rows.Next() {
		var item LeaveEncashmentItem
		if err := rows.Scan(
			&item.ID, &item.EmployeeID, &item.EmployeeCode, &item.EmployeeName,
			&item.LeaveTypeID, &item.LeaveTypeName, &item.DaysToEncash, &item.PerDayRate,
			&item.TotalAmount, &item.Status, &item.Reason, &item.CreatedAt,
		); err == nil {
			items = append(items, item)
		}
	}
	if items == nil {
		items = []LeaveEncashmentItem{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": items})
}

func (s *Service) HandleSubmitEncashment(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req LeaveEncashmentItem
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.LeaveTypeID == "" || req.DaysToEncash <= 0 {
		http.Error(w, "invalid encashment request payload", http.StatusBadRequest)
		return
	}

	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	// Fetch employee ID for logged in user
	var empID string
	err := s.db.QueryRow(r.Context(), `SELECT id::text FROM employees WHERE user_id::text = $1 LIMIT 1`, claims.UserID).Scan(&empID)
	if err != nil || empID == "" {
		// Fallback to first employee for admin test mode
		_ = s.db.QueryRow(r.Context(), `SELECT id::text FROM employees LIMIT 1`).Scan(&empID)
	}

	// Calculate default per day rate (e.g., base salary estimate 60,000 INR)
	perDayRate, totalAmount := CalculateEncashmentAmount(req.DaysToEncash, 60000.0)

	var id string
	err = s.db.QueryRow(r.Context(), `
		INSERT INTO leave_encashment_requests (
			employee_id, leave_type_id, days_to_encash, per_day_rate, total_amount, status, reason
		) VALUES (
			$1::uuid, $2::uuid, $3, $4, $5, 'PENDING', $6
		) RETURNING id::text
	`, empID, req.LeaveTypeID, req.DaysToEncash, perDayRate, totalAmount, req.Reason).Scan(&id)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": err.Error()})
		return
	}

	req.ID = id
	req.EmployeeID = empID
	req.PerDayRate = perDayRate
	req.TotalAmount = totalAmount
	req.Status = "PENDING"

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Leave encashment request submitted for HR approval.",
		"data":    req,
	})
}

func (s *Service) HandleReviewEncashment(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok || !authz.HasRole(claims, "SUPER_ADMIN", "HR_ADMIN") {
		authz.ForbiddenResponse(w, "FORBIDDEN_ROLE", "Only HR and Super Admins can review leave encashment requests.")
		return
	}

	var req struct {
		EncashmentID string `json:"encashment_id"`
		Action       string `json:"action"` // APPROVE, REJECT
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.EncashmentID == "" {
		http.Error(w, "invalid review payload", http.StatusBadRequest)
		return
	}

	targetStatus := "REJECTED"
	if req.Action == "APPROVE" {
		targetStatus = "APPROVED"
	}

	if s.db != nil {
		_, err := s.db.Exec(r.Context(), `
			UPDATE leave_encashment_requests
			SET status = $1, approved_by = $2::uuid, approved_at = NOW(), updated_at = NOW()
			WHERE id = $3::uuid
		`, targetStatus, claims.UserID, req.EncashmentID)

		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": err.Error()})
			return
		}

		if s.auditService != nil {
			_ = s.auditService.LogAction(r.Context(), audit.LogEntry{
				UserID:     claims.UserID,
				Action:     "LEAVE_ENCASHMENT_REVIEW",
				Module:     "LEAVE",
				EntityName: "leave_encashment_requests",
				EntityID:   req.EncashmentID,
				Reason:     fmt.Sprintf("Encashment request status updated to %s", targetStatus),
			})
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("Leave encashment request marked as %s.", targetStatus),
		"status":  targetStatus,
	})
}
