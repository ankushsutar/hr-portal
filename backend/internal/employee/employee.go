package employee

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Employee struct {
	ID            string `json:"id"`
	EmployeeID    string `json:"employee_id"`
	FirstName     string `json:"first_name"`
	LastName      string `json:"last_name"`
	DepartmentID  string `json:"department_id"`
	DesignationID string `json:"designation_id"`
	LocationID    string `json:"location_id"`
	Status        string `json:"status"`
	JoiningDate   string `json:"joining_date"`
}

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) RegisterRoutes(r chi.Router) {
	r.Get("/", s.HandleGetEmployees)
	r.Post("/", s.HandleCreateEmployee)
	r.Get("/{id}", s.HandleGetEmployeeByID)
	r.Post("/{id}/documents", s.HandleUploadDocument)
}

func (s *Service) HandleGetEmployees(w http.ResponseWriter, r *http.Request) {
	employees := []Employee{
		{
			ID:          "emp-1",
			EmployeeID:  "EMP001",
			FirstName:   "John",
			LastName:    "Doe",
			Status:      "ACTIVE",
			JoiningDate: "2026-01-15",
		},
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    employees,
	})
}

func (s *Service) HandleCreateEmployee(w http.ResponseWriter, r *http.Request) {
	var emp Employee
	if err := json.NewDecoder(r.Body).Decode(&emp); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true})
}

func (s *Service) HandleGetEmployeeByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	emp := Employee{
		ID:          id,
		EmployeeID:  "EMP001",
		FirstName:   "John",
		LastName:    "Doe",
		Status:      "ACTIVE",
		JoiningDate: "2026-01-15",
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    emp,
	})
}

func (s *Service) HandleUploadDocument(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Document uploaded successfully (mocked local storage)",
	})
}
