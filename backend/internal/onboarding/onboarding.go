package onboarding

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Template struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
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
}

func (s *Service) HandleGetTemplates(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Query(r.Context(), "SELECT id, name, description FROM onboarding_templates")
	if err != nil {
		http.Error(w, "failed to query templates", http.StatusInternalServerError)
		return
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

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    templates,
	})
}

func (s *Service) HandleCreateTemplate(w http.ResponseWriter, r *http.Request) {
	var req Template
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	var newID string
	// For now, assume org-1 as the default organization
	err := s.db.QueryRow(r.Context(), `
		INSERT INTO onboarding_templates (organization_id, name, description)
		VALUES ((SELECT id FROM organizations LIMIT 1), $1, $2)
		RETURNING id
	`, req.Name, req.Description).Scan(&newID)

	if err != nil {
		http.Error(w, "failed to create template", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"id":      newID,
	})
}
