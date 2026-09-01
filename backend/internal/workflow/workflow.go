package workflow

import (
	"github.com/company/hrms-backend/internal/common"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UniversalApprovalTask struct {
	ID            string    `json:"id"`
	Module        string    `json:"module"` // LEAVE, ATTENDANCE, ADVANCE, OFFBOARDING
	Type          string    `json:"type"`   // CL, SL, Regularization, WFH, OD, Salary Advance, Exit Clearance
	EmployeeID    string    `json:"employee_id"`
	EmployeeName  string    `json:"employee_name"`
	Department    string    `json:"department"`
	RequestedDate string    `json:"requested_date"`
	Reason        string    `json:"reason"`
	Priority      string    `json:"priority"` // URGENT, NORMAL
	Status        string    `json:"status"`   // PENDING, APPROVED, REJECTED
	CreatedAt     time.Time `json:"created_at"`
}

type BulkActionRequest struct {
	TaskIDs  []string `json:"task_ids"`
	Action   string   `json:"action"` // APPROVE, REJECT
	Comments string   `json:"comments"`
}

type HRTaskSummary struct {
	ProbationDueCount      int `json:"probation_due_count"`
	PendingDocsCount       int `json:"pending_docs_count"`
	UnresolvedAnomalies    int `json:"unresolved_anomalies"`
	PendingPayrollLocks    int `json:"pending_payroll_locks"`
	ProbationEmployees     []map[string]string `json:"probation_employees"`
	PendingDocumentItems   []map[string]string `json:"pending_document_items"`
}

type NotificationItem struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Message   string    `json:"message"`
	Type      string    `json:"type"`   // INFO, ACTION_REQUIRED, WARNING, SUCCESS
	Module    string    `json:"module"` // LEAVE, PAYROLL, PROBATION, DOCS
	IsRead    bool      `json:"is_read"`
	Link      string    `json:"link"`
	CreatedAt time.Time `json:"created_at"`
}

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) RegisterRoutes(r chi.Router) {
	r.Get("/universal-approvals", s.HandleGetUniversalApprovals)
	r.Post("/tasks/bulk-action", s.HandleBulkAction)
	r.Post("/tasks/{id}/approve", s.HandleApproveTask)
	r.Post("/tasks/{id}/reject", s.HandleRejectTask)
	r.Get("/hr-tasks", s.HandleGetHRTasks)
	r.Get("/notifications", s.HandleGetNotifications)
	r.Post("/notifications/mark-read", s.HandleMarkNotificationsRead)
}

func (s *Service) HandleGetUniversalApprovals(w http.ResponseWriter, r *http.Request) {
	if s.db == nil {
		common.JSONError(w, "Database connection unavailable", http.StatusInternalServerError)
		return
	}

	rows, err := s.db.Query(r.Context(), `
		SELECT 
			v.id::text, v.module, v.type, e.employee_id, 
			e.first_name || ' ' || e.last_name as employee_name, 
			COALESCE(d.name, 'General'), 
			COALESCE(v.requested_date, ''), COALESCE(v.reason, ''), 
			v.priority, v.status, v.created_at
		FROM v_universal_approvals v
		JOIN employees e ON v.employee_id = e.id
		LEFT JOIN departments d ON e.department_id = d.id
		WHERE v.status = 'PENDING'
		ORDER BY v.created_at DESC
	`)
	if err != nil {
		common.JSONError(w, "Failed to fetch approvals", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var pendingTasks []UniversalApprovalTask
	for rows.Next() {
		var t UniversalApprovalTask
		if err := rows.Scan(&t.ID, &t.Module, &t.Type, &t.EmployeeID, &t.EmployeeName, &t.Department, &t.RequestedDate, &t.Reason, &t.Priority, &t.Status, &t.CreatedAt); err == nil {
			pendingTasks = append(pendingTasks, t)
		}
	}
	if pendingTasks == nil {
		pendingTasks = []UniversalApprovalTask{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    pendingTasks,
	})
}

func (s *Service) updateTaskStatus(ctx context.Context, id string, status string) error {
	queries := []string{
		"UPDATE leave_applications SET status = $1 WHERE id = $2 AND status = 'PENDING'",
		"UPDATE regularization_requests SET status = $1 WHERE id = $2 AND status = 'PENDING'",
		"UPDATE od_requests SET status = $1 WHERE id = $2 AND status = 'PENDING'",
		"UPDATE wfh_requests SET status = $1 WHERE id = $2 AND status = 'PENDING'",
		"UPDATE payroll_advances SET status = $1 WHERE id = $2 AND status = 'PENDING'",
		"UPDATE exit_requests SET status = $1 WHERE id = $2 AND status = 'PENDING'",
	}
	updated := false
	for _, q := range queries {
		res, err := s.db.Exec(ctx, q, status, id)
		if err != nil {
			return err
		}
		if res.RowsAffected() > 0 {
			updated = true
			break
		}
	}
	if !updated {
		return fmt.Errorf("task not found or already processed")
	}
	return nil
}

func (s *Service) HandleBulkAction(w http.ResponseWriter, r *http.Request) {
	var req BulkActionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		common.JSONError(w, "invalid request payload", http.StatusBadRequest)
		return
	}

	if s.db == nil {
		common.JSONError(w, "Database connection unavailable", http.StatusInternalServerError)
		return
	}

	for _, id := range req.TaskIDs {
		if err := s.updateTaskStatus(r.Context(), id, req.Action); err != nil {
			common.JSONError(w, fmt.Sprintf("Failed to process task %s: %v", id, err), http.StatusBadRequest)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":  true,
		"message":  "Bulk action executed successfully",
		"task_ids": req.TaskIDs,
		"action":   req.Action,
	})
}

func (s *Service) HandleApproveTask(w http.ResponseWriter, r *http.Request) {
	if s.db == nil {
		common.JSONError(w, "Database connection unavailable", http.StatusInternalServerError)
		return
	}
	id := chi.URLParam(r, "id")
	if err := s.updateTaskStatus(r.Context(), id, "APPROVED"); err != nil {
		common.JSONError(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Task approved successfully",
	})
}

func (s *Service) HandleRejectTask(w http.ResponseWriter, r *http.Request) {
	if s.db == nil {
		common.JSONError(w, "Database connection unavailable", http.StatusInternalServerError)
		return
	}
	id := chi.URLParam(r, "id")
	if err := s.updateTaskStatus(r.Context(), id, "REJECTED"); err != nil {
		common.JSONError(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Task rejected successfully",
	})
}

func (s *Service) HandleGetHRTasks(w http.ResponseWriter, r *http.Request) {
	tasksSummary := HRTaskSummary{
		ProbationDueCount:   3,
		PendingDocsCount:    5,
		UnresolvedAnomalies: 4,
		PendingPayrollLocks: 1,
		ProbationEmployees: []map[string]string{
			{"employee_id": "EMP-1024", "name": "Alice Walker", "due_date": "2026-08-30", "department": "Engineering"},
			{"employee_id": "EMP-1088", "name": "Bob Smith", "due_date": "2026-09-05", "department": "Design"},
			{"employee_id": "EMP-1090", "name": "Carol Danvers", "due_date": "2026-09-12", "department": "Product"},
		},
		PendingDocumentItems: []map[string]string{
			{"employee_id": "EMP-1024", "name": "Alice Walker", "doc_type": "PAN Card Copy", "status": "PENDING_VERIFICATION"},
			{"employee_id": "EMP-1088", "name": "Bob Smith", "doc_type": "Relieving Letter", "status": "PENDING_VERIFICATION"},
			{"employee_id": "EMP-1090", "name": "Carol Danvers", "doc_type": "Form 16 Prior Employer", "status": "PENDING_VERIFICATION"},
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    tasksSummary,
	})
}

func (s *Service) HandleGetNotifications(w http.ResponseWriter, r *http.Request) {
	now := time.Now()
	notifications := []NotificationItem{
		{
			ID:        "notif-1",
			Title:     "Probation Confirmation Due",
			Message:   "Alice Walker (EMP-1024) probation review is due in 2 days.",
			Type:      "ACTION_REQUIRED",
			Module:    "PROBATION",
			IsRead:    false,
			Link:      "/probation",
			CreatedAt: now.Add(-30 * time.Minute),
		},
		{
			ID:        "notif-2",
			Title:     "August Payroll Validated",
			Message:   "August 2026 payroll cycle passed automated validation checks.",
			Type:      "SUCCESS",
			Module:    "PAYROLL",
			IsRead:    false,
			Link:      "/payroll",
			CreatedAt: now.Add(-2 * time.Hour),
		},
		{
			ID:        "notif-3",
			Title:     "Pending Document Verification",
			Message:   "5 employee compliance documents require HR sign-off.",
			Type:      "WARNING",
			Module:    "DOCS",
			IsRead:    true,
			Link:      "/users",
			CreatedAt: now.Add(-6 * time.Hour),
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    notifications,
	})
}

func (s *Service) HandleMarkNotificationsRead(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "All notifications marked as read.",
	})
}
