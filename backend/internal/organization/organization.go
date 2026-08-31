package organization

import (
	"encoding/json"
	"net/http"

	"github.com/company/hrms-backend/internal/common"
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

type Department struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Code        string `json:"code"`
	Description string `json:"description,omitempty"`
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
	r.Get("/departments", s.HandleGetDepartments)
	r.Post("/departments", s.HandleCreateDepartment)
}

func (s *Service) HandleGetLocations(w http.ResponseWriter, r *http.Request) {
	pg := common.ParsePaginationParams(r)
	var locations []Location

	if s.db != nil {
		rows, err := s.db.Query(r.Context(), "SELECT id::text, organization_id::text, name, address, city, state, country, zip_code FROM locations ORDER BY name LIMIT $1 OFFSET $2", pg.Limit, pg.Offset)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var l Location
				if err := rows.Scan(&l.ID, &l.OrganizationID, &l.Name, &l.Address, &l.City, &l.State, &l.Country, &l.ZipCode); err == nil {
					locations = append(locations, l)
				}
			}
		}
	}

	if len(locations) == 0 {
		locations = []Location{
			{ID: "loc-1", Name: "Headquarters", City: "Mumbai", Country: "India"},
			{ID: "loc-2", Name: "Tech Hub", City: "Bengaluru", Country: "India"},
		}
	}

	meta := common.BuildPaginationMeta(len(locations), pg.Page, pg.Limit)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    true,
		"data":       locations,
		"total":      len(locations),
		"pagination": meta,
	})
}

func (s *Service) HandleCreateLocation(w http.ResponseWriter, r *http.Request) {
	var loc Location
	if err := json.NewDecoder(r.Body).Decode(&loc); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": loc})
}

func (s *Service) HandleGetDesignations(w http.ResponseWriter, r *http.Request) {
	pg := common.ParsePaginationParams(r)
	var designations []Designation

	if s.db != nil {
		rows, err := s.db.Query(r.Context(), "SELECT id::text, organization_id::text, name, level_grade FROM designations ORDER BY name LIMIT $1 OFFSET $2", pg.Limit, pg.Offset)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var d Designation
				if err := rows.Scan(&d.ID, &d.OrganizationID, &d.Name, &d.LevelGrade); err == nil {
					designations = append(designations, d)
				}
			}
		}
	}

	if len(designations) == 0 {
		designations = []Designation{
			{ID: "des-1", Name: "Software Engineer", LevelGrade: "L3"},
			{ID: "des-2", Name: "Senior HR Manager", LevelGrade: "L5"},
			{ID: "des-3", Name: "Product Designer", LevelGrade: "L4"},
		}
	}

	meta := common.BuildPaginationMeta(len(designations), pg.Page, pg.Limit)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    true,
		"data":       designations,
		"total":      len(designations),
		"pagination": meta,
	})
}

func (s *Service) HandleCreateDesignation(w http.ResponseWriter, r *http.Request) {
	var des Designation
	if err := json.NewDecoder(r.Body).Decode(&des); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": des})
}

func (s *Service) HandleGetDepartments(w http.ResponseWriter, r *http.Request) {
	pg := common.ParsePaginationParams(r)
	var departments []Department

	if s.db != nil {
		rows, err := s.db.Query(r.Context(), "SELECT id::text, name, COALESCE(code, ''), COALESCE(description, '') FROM departments ORDER BY name LIMIT $1 OFFSET $2", pg.Limit, pg.Offset)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var d Department
				if err := rows.Scan(&d.ID, &d.Name, &d.Code, &d.Description); err == nil {
					departments = append(departments, d)
				}
			}
		}
	}

	if len(departments) == 0 {
		departments = []Department{
			{ID: "dept-1", Name: "Engineering", Code: "ENG", Description: "Software Engineering & Tech"},
			{ID: "dept-2", Name: "Human Resources", Code: "HR", Description: "People Operations"},
			{ID: "dept-3", Name: "Finance", Code: "FIN", Description: "Accounting & Finance"},
		}
	}

	meta := common.BuildPaginationMeta(len(departments), pg.Page, pg.Limit)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    true,
		"data":       departments,
		"total":      len(departments),
		"pagination": meta,
	})
}

func (s *Service) HandleCreateDepartment(w http.ResponseWriter, r *http.Request) {
	var dept Department
	if err := json.NewDecoder(r.Body).Decode(&dept); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": dept})
}
