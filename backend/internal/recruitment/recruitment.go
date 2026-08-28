package recruitment

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type JobRequisition struct {
	ID         string `json:"id"`
	Title      string `json:"title"`
	Department string `json:"department"`
	Location   string `json:"location"`
	Status     string `json:"status"`
	Headcount  int    `json:"headcount"`
}

type Candidate struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	Status    string `json:"status"`
}

type OfferRequest struct {
	CandidateID   string  `json:"candidate_id"`
	SalaryOffered float64 `json:"salary_offered"`
}

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) RegisterRoutes(r chi.Router) {
	r.Get("/jobs", s.HandleGetJobs)
	r.Get("/candidates", s.HandleGetCandidates)
	r.Post("/offers", s.HandleCreateOffer)
}

func (s *Service) HandleGetJobs(w http.ResponseWriter, r *http.Request) {
	jobs := []JobRequisition{
		{ID: "job-1", Title: "Senior Frontend Engineer", Department: "Engineering", Location: "Bangalore", Status: "OPEN", Headcount: 2},
		{ID: "job-2", Title: "Product Manager", Department: "Product", Location: "Remote", Status: "OPEN", Headcount: 1},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    jobs,
	})
}

func (s *Service) HandleGetCandidates(w http.ResponseWriter, r *http.Request) {
	candidates := []Candidate{
		{ID: "cand-1", Name: "Rahul Sharma", Email: "rahul@example.com", Role: "Senior Frontend Engineer", Status: "APPLIED"},
		{ID: "cand-2", Name: "Priya Patel", Email: "priya@example.com", Role: "Senior Frontend Engineer", Status: "INTERVIEWING"},
		{ID: "cand-3", Name: "Amit Kumar", Email: "amit@example.com", Role: "Product Manager", Status: "OFFERED"},
		{ID: "cand-4", Name: "Sneha Gupta", Email: "sneha@example.com", Role: "Product Manager", Status: "HIRED"},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    candidates,
	})
}

func (s *Service) HandleCreateOffer(w http.ResponseWriter, r *http.Request) {
	var req OfferRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true, 
		"message": "Offer letter generated and workflow triggered.",
	})
}
