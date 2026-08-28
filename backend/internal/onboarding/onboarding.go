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
	rows, err := s.db.Query(r.Context(), "SELECT id, name, description FROM onboarding_templates")
	if err != nil {
		// --- DEMO BYPASS ---
		templates := []Template{
			{ID: "tpl-1", Name: "Standard Engineering Onboarding", Description: "Default tasks for software engineers.", Tasks: []TemplateTask{
				{ID: "tsk-1", TaskName: "Setup Laptop", OwnerRole: "IT_ADMIN", DueDays: 0},
				{ID: "tsk-2", TaskName: "Email Account Creation", OwnerRole: "IT_ADMIN", DueDays: 0},
				{ID: "tsk-3", TaskName: "Welcome Lunch", OwnerRole: "MANAGER", DueDays: 3},
			}},
			{ID: "tpl-2", Name: "Sales Onboarding", Description: "For sales and marketing hires."},
		}
		jsonOK(w, map[string]interface{}{"success": true, "data": templates, "demo": true})
		return
		// --- END DEMO BYPASS ---
	}
	defer rows.Close()

	var templates []Template
	for rows.Next() {
		var t Template
		if err := rows.Scan(&t.ID, &t.Name, &t.Description); err != nil {
			http.Error(w, "failed to scan template", http.StatusInternalServerError)
			return
		}
		templates = append(templates, t)
	}

	jsonOK(w, map[string]interface{}{"success": true, "data": templates})
}

func (s *Service) HandleCreateTemplate(w http.ResponseWriter, r *http.Request) {
	var req Template
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	var newID string
	err := s.db.QueryRow(r.Context(), `
		INSERT INTO onboarding_templates (organization_id, name, description)
		VALUES ((SELECT id FROM organizations LIMIT 1), $1, $2)
		RETURNING id
	`, req.Name, req.Description).Scan(&newID)

	if err != nil {
		// --- DEMO BYPASS ---
		jsonOK(w, map[string]interface{}{"success": true, "id": "tpl-new", "demo": true})
		return
		// --- END DEMO BYPASS ---
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

	// --- DEMO BYPASS ---
	jsonOK(w, map[string]interface{}{"success": true, "id": "tsk-new", "demo": true})
	// --- END DEMO BYPASS ---
}

func (s *Service) HandleGetInstances(w http.ResponseWriter, r *http.Request) {
	// --- DEMO BYPASS ---
	instances := []Instance{
		{ID: "inst-1", EmployeeID: "emp-101", EmployeeName: "John Doe", TemplateName: "Standard Engineering Onboarding", Status: "IN_PROGRESS", Progress: 33},
		{ID: "inst-2", EmployeeID: "emp-102", EmployeeName: "Sarah Smith", TemplateName: "Sales Onboarding", Status: "IN_PROGRESS", Progress: 80},
		{ID: "inst-3", EmployeeID: "emp-103", EmployeeName: "Mike Johnson", TemplateName: "Standard Engineering Onboarding", Status: "COMPLETED", Progress: 100},
	}
	jsonOK(w, map[string]interface{}{"success": true, "data": instances, "demo": true})
	// --- END DEMO BYPASS ---
}

func (s *Service) HandleGetInstanceDetail(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	// --- DEMO BYPASS ---
	instance := Instance{
		ID: id, EmployeeID: "emp-101", EmployeeName: "John Doe", TemplateName: "Standard Engineering Onboarding", Status: "IN_PROGRESS", Progress: 33,
		Tasks: []InstanceTask{
			{ID: "it-1", TaskName: "Setup Laptop", OwnerRole: "IT_ADMIN", Status: "COMPLETED", CompletedAt: "2026-08-27"},
			{ID: "it-2", TaskName: "Email Account Creation", OwnerRole: "IT_ADMIN", Status: "PENDING"},
			{ID: "it-3", TaskName: "Welcome Lunch", OwnerRole: "MANAGER", Status: "PENDING"},
			{ID: "it-4", TaskName: "Sign NDA", OwnerRole: "EMPLOYEE", Status: "PENDING"},
		},
	}
	jsonOK(w, map[string]interface{}{"success": true, "data": instance, "demo": true})
	// --- END DEMO BYPASS ---
}

func (s *Service) HandleCompleteTask(w http.ResponseWriter, r *http.Request) {
	// --- DEMO BYPASS ---
	jsonOK(w, map[string]interface{}{"success": true, "demo": true})
	// --- END DEMO BYPASS ---
}

func jsonOK(w http.ResponseWriter, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(payload)
}
