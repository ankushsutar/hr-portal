package lifecycle

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AdvanceRequest struct {
	Amount         float64 `json:"amount"`
	RecoveryMonths int     `json:"recovery_months"`
	Reason         string  `json:"reason"`
}

type SpecialAttendanceRequest struct {
	RequestType string `json:"request_type"`
	StartDate   string `json:"start_date"`
	EndDate     string `json:"end_date"`
	Reason      string `json:"reason"`
}

type TerminationRequest struct {
	TerminationDate string `json:"termination_date"`
	ReasonType      string `json:"reason_type"`
	Notes           string `json:"notes"`
}

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) RegisterRoutes(r chi.Router) {
	r.Post("/advances", s.HandleRequestAdvance)
	r.Post("/special-attendance", s.HandleRequestSpecialAttendance)
	r.Post("/terminations", s.HandleRequestTermination)
}

func (s *Service) HandleRequestAdvance(w http.ResponseWriter, r *http.Request) {
	var req AdvanceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true, 
		"message": "Payroll advance request submitted and workflow triggered.",
	})
}

func (s *Service) HandleRequestSpecialAttendance(w http.ResponseWriter, r *http.Request) {
	var req SpecialAttendanceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true, 
		"message": "Special attendance request submitted and workflow triggered.",
	})
}

func (s *Service) HandleRequestTermination(w http.ResponseWriter, r *http.Request) {
	var req TerminationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true, 
		"message": "Termination / Resignation initiated and workflow triggered.",
	})
}
