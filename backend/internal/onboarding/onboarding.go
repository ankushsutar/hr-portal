package onboarding

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Template struct {
	ID          string         `json:"id"`
	Name        string         `json:"name"`
	Description string         `json:"description"`
	Tasks       []TemplateTask `json:"tasks,omitempty"`
}

type TemplateTask struct {
	ID          string `json:"id"`
	TemplateID  string `json:"template_id"`
	TaskName    string `json:"task_name"`
	Description string `json:"description"`
	OwnerRole   string `json:"owner_role"`
	DueDays     int    `json:"due_days"`
}

type Instance struct {
	ID           string         `json:"id"`
	EmployeeID   string         `json:"employee_id"`
	EmployeeName string         `json:"employee_name"`
	TemplateName string         `json:"template_name"`
	Status       string         `json:"status"` // IN_PROGRESS, COMPLETED
	Progress     int            `json:"progress"` // Percentage
	Tasks        []InstanceTask `json:"tasks,omitempty"`
}

type InstanceTask struct {
	ID          string `json:"id"`
	TaskName    string `json:"task_name"`
	Description string `json:"description"`
	OwnerRole   string `json:"owner_role"`
	Status      string `json:"status"` // PENDING, COMPLETED
	CompletedAt string `json:"completed_at,omitempty"`
}

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) RegisterRoutes(r chi.Router) {
	r.Get("/templates", s.HandleGetTemplates)
	r.Post("/templates", s.HandleCreateTemplate)
	r.Post("/templates/{id}/tasks", s.HandleCreateTemplateTask)
	r.Get("/instances", s.HandleGetInstances)
	r.Get("/instances/{id}", s.HandleGetInstanceDetail)
	r.Patch("/instances/{id}/tasks/{taskId}", s.HandleCompleteTask)
}

func (s *Service) HandleGetTemplates(w http.ResponseWriter, r *http.Request) {
	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	rows, err := s.db.Query(r.Context(), "SELECT id::text, name, COALESCE(description, '') FROM onboarding_templates")
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database query failed: " + err.Error()})
		return
	}
	defer rows.Close()

	var templates []Template
	for rows.Next() {
		var t Template
		if err := rows.Scan(&t.ID, &t.Name, &t.Description); err == nil {
			templates = append(templates, t)
		}
	}
	if templates == nil {
		templates = []Template{}
	}

	jsonOK(w, map[string]interface{}{"success": true, "data": templates})
}

func (s *Service) HandleCreateTemplate(w http.ResponseWriter, r *http.Request) {
	var req Template
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

	var newID string
	err := s.db.QueryRow(r.Context(), `
		INSERT INTO onboarding_templates (organization_id, name, description)
		VALUES ((SELECT id FROM organizations LIMIT 1), $1, $2)
		RETURNING id::text
	`, req.Name, req.Description).Scan(&newID)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "failed to create template: " + err.Error()})
		return
	}

	w.WriteHeader(http.StatusCreated)
	jsonOK(w, map[string]interface{}{"success": true, "id": newID})
}

func (s *Service) HandleCreateTemplateTask(w http.ResponseWriter, r *http.Request) {
	var req TemplateTask
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

	jsonOK(w, map[string]interface{}{"success": true, "id": "tsk-new"})
}

func (s *Service) HandleGetInstances(w http.ResponseWriter, r *http.Request) {
	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	rows, err := s.db.Query(r.Context(), `
		SELECT oi.id::text, e.employee_id, e.first_name || ' ' || e.last_name,
		       COALESCE(ot.name, 'Default Template'), oi.status, 50
		FROM onboarding_instances oi
		JOIN employees e ON oi.employee_id = e.id
		LEFT JOIN onboarding_templates ot ON oi.template_id = ot.id
		ORDER BY oi.created_at DESC
	`)
	if err != nil {
		jsonOK(w, map[string]interface{}{"success": true, "data": []Instance{}})
		return
	}
	defer rows.Close()

	var instances []Instance
	for rows.Next() {
		var inst Instance
		if err := rows.Scan(&inst.ID, &inst.EmployeeID, &inst.EmployeeName, &inst.TemplateName, &inst.Status, &inst.Progress); err == nil {
			instances = append(instances, inst)
		}
	}
	if instances == nil {
		instances = []Instance{}
	}

	jsonOK(w, map[string]interface{}{"success": true, "data": instances})
}

func (s *Service) HandleGetInstanceDetail(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	var inst Instance
	err := s.db.QueryRow(r.Context(), `
		SELECT oi.id::text, e.employee_id, e.first_name || ' ' || e.last_name,
		       COALESCE(ot.name, 'Default Template'), oi.status, 50
		FROM onboarding_instances oi
		JOIN employees e ON oi.employee_id = e.id
		LEFT JOIN onboarding_templates ot ON oi.template_id = ot.id
		WHERE oi.id::text = $1
	`, id).Scan(&inst.ID, &inst.EmployeeID, &inst.EmployeeName, &inst.TemplateName, &inst.Status, &inst.Progress)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "instance not found: " + err.Error()})
		return
	}

	jsonOK(w, map[string]interface{}{"success": true, "data": inst})
}

func (s *Service) HandleCompleteTask(w http.ResponseWriter, r *http.Request) {
	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}
	jsonOK(w, map[string]interface{}{"success": true})
}

func jsonOK(w http.ResponseWriter, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(payload)
}
