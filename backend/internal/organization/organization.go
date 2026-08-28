package organization

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Location struct {
	ID             string `json:"id"`
	OrganizationID string `json:"organization_id"`
	Name           string `json:"name"`
	Address        string `json:"address"`
	City           string `json:"city"`
	State          string `json:"state"`
	Country        string `json:"country"`
	ZipCode        string `json:"zip_code"`
}

type Designation struct {
	ID             string `json:"id"`
	OrganizationID string `json:"organization_id"`
	Name           string `json:"name"`
	LevelGrade     string `json:"level_grade"`
}

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) RegisterRoutes(r chi.Router) {
	r.Get("/locations", s.HandleGetLocations)
	r.Post("/locations", s.HandleCreateLocation)
	r.Get("/designations", s.HandleGetDesignations)
	r.Post("/designations", s.HandleCreateDesignation)
}

func (s *Service) HandleGetLocations(w http.ResponseWriter, r *http.Request) {
	// Simple stub for getting locations
	locations := []Location{
		{ID: "loc-1", Name: "Headquarters", City: "Mumbai", Country: "India"},
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    locations,
	})
}

func (s *Service) HandleCreateLocation(w http.ResponseWriter, r *http.Request) {
	var loc Location
	if err := json.NewDecoder(r.Body).Decode(&loc); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	// Stub for creating
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true})
}

func (s *Service) HandleGetDesignations(w http.ResponseWriter, r *http.Request) {
	designations := []Designation{
		{ID: "des-1", Name: "Software Engineer", LevelGrade: "L3"},
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    designations,
	})
}

func (s *Service) HandleCreateDesignation(w http.ResponseWriter, r *http.Request) {
	var des Designation
	if err := json.NewDecoder(r.Body).Decode(&des); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	// Stub for creating
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true})
}
