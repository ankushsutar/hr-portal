package workflow

import (
	"encoding/json"
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
	r.Get("/hr-tasks", s.HandleGetHRTasks)
	r.Get("/notifications", s.HandleGetNotifications)
	r.Post("/notifications/mark-read", s.HandleMarkNotificationsRead)
}

func (s *Service) HandleGetUniversalApprovals(w http.ResponseWriter, r *http.Request) {
	now := time.Now()
	tasks := []UniversalApprovalTask{
		{
			ID:            "task-leave-101",
			Module:        "LEAVE",
			Type:          "Casual Leave",
			EmployeeID:    "EMP-1024",
			EmployeeName:  "Alice Walker",
			Department:    "Engineering",
			RequestedDate: "2026-09-01 to 2026-09-02",
			Reason:        "Family function in home town",
			Priority:      "URGENT",
			Status:        "PENDING",
			CreatedAt:     now.Add(-2 * time.Hour),
		},
		{
			ID:            "task-att-202",
			Module:        "ATTENDANCE",
			Type:          "Work From Home",
			EmployeeID:    "EMP-1088",
			EmployeeName:  "Bob Smith",
			Department:    "Design",
			RequestedDate: "2026-08-29",
			Reason:        "Laptop hardware upgrade transit",
			Priority:      "NORMAL",
			Status:        "PENDING",
			CreatedAt:     now.Add(-5 * time.Hour),
		},
		{
			ID:            "task-adv-303",
			Module:        "ADVANCE",
			Type:          "Salary Advance",
			EmployeeID:    "EMP-1090",
			EmployeeName:  "Carol Danvers",
			Department:    "Product",
			RequestedDate: "Aug 2026",
			Reason:        "Emergency Relocation Advance ₹25,000",
			Priority:      "URGENT",
			Status:        "PENDING",
			CreatedAt:     now.Add(-12 * time.Hour),
		},
		{
			ID:            "task-exit-404",
			Module:        "OFFBOARDING",
			Type:          "Clearance Sign-off",
			EmployeeID:    "EMP-1010",
			EmployeeName:  "David Miller",
			Department:    "Sales",
			RequestedDate: "2026-08-31",
			Reason:        "IT Hardware & Finance No-Dues clearance",
			Priority:      "NORMAL",
			Status:        "PENDING",
			CreatedAt:     now.Add(-24 * time.Hour),
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    tasks,
	})
}

func (s *Service) HandleBulkAction(w http.ResponseWriter, r *http.Request) {
	var req BulkActionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request payload", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":  true,
		"message":  "Bulk action " + req.Action + " executed successfully for " + string(rune(len(req.TaskIDs))) + " tasks.",
		"task_ids": req.TaskIDs,
		"action":   req.Action,
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
