package workflow

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Status string

const (
	StatusPendingApproval Status = "PENDING_APPROVAL"
	StatusApproved        Status = "APPROVED"
	StatusRejected        Status = "REJECTED"
	StatusReturned        Status = "RETURNED"
)

type PendingTask struct {
	TaskID         string `json:"task_id"`
	InstanceID     string `json:"instance_id"`
	EntityType     string `json:"entity_type"`
	RequesterName  string `json:"requester_name"`
	RequestedDate  string `json:"requested_date"`
	Status         string `json:"status"`
	Module         string `json:"module"`
}

type ActionRequest struct {
	Action   string `json:"action"` // APPROVE, REJECT
	Comments string `json:"comments"`
}

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) RegisterRoutes(r chi.Router) {
	r.Get("/tasks/pending", s.HandleGetPendingTasks)
	r.Post("/tasks/{id}/action", s.HandleProcessAction)
	r.Get("/instances/{id}/history", s.HandleGetHistory)
}

func (s *Service) HandleGetPendingTasks(w http.ResponseWriter, r *http.Request) {
	// Mock pending tasks for the current user (e.g., manager)
	tasks := []PendingTask{
		{
			TaskID:        "task-1",
			InstanceID:    "inst-1",
			EntityType:    "Leave Request",
			RequesterName: "Jane Smith",
			RequestedDate: "2026-08-25",
			Status:        "PENDING",
			Module:        "LEAVE",
		},
		{
			TaskID:        "task-2",
			InstanceID:    "inst-2",
			EntityType:    "Offer Letter",
			RequesterName: "HR Team",
			RequestedDate: "2026-08-27",
			Status:        "PENDING",
			Module:        "RECRUITMENT",
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    tasks,
	})
}

func (s *Service) HandleProcessAction(w http.ResponseWriter, r *http.Request) {
	taskID := chi.URLParam(r, "id")
	var req ActionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	// Mock processing action for taskID
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Task " + req.Action + " successfully",
		"task_id": taskID,
	})
}

func (s *Service) HandleGetHistory(w http.ResponseWriter, r *http.Request) {
	// Mock workflow history for an instance
	history := []map[string]interface{}{
		{
			"action":     "SUBMITTED",
			"user":       "Jane Smith",
			"date":       "2026-08-25T10:00:00Z",
			"comments":   "Applying for annual leave",
		},
		{
			"action":     "APPROVED",
			"user":       "Manager Bob",
			"date":       "2026-08-26T14:30:00Z",
			"comments":   "Approved.",
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    history,
	})
}
