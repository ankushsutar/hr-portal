package performance

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PerformanceCycle struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	StartDate string    `json:"start_date"`
	EndDate   string    `json:"end_date"`
	Status    string    `json:"status"` // PLANNED, ACTIVE, REVIEW_IN_PROGRESS, COMPLETED
	CreatedAt time.Time `json:"created_at"`
}

type PerformanceGoal struct {
	ID           string  `json:"id"`
	EmployeeID   string  `json:"employee_id"`
	EmployeeName string  `json:"employee_name,omitempty"`
	CycleID      *string `json:"cycle_id"`
	Title        string  `json:"title"`
	Description  string  `json:"description"`
	Category     string  `json:"category"` // INDIVIDUAL, TEAM, COMPANY
	TargetValue  float64 `json:"target_value"`
	CurrentValue float64 `json:"current_value"`
	Weightage    int     `json:"weightage"`
	Status       string  `json:"status"` // NOT_STARTED, IN_PROGRESS, COMPLETED
}

type PerformanceReview struct {
	ID              string   `json:"id"`
	CycleID         string   `json:"cycle_id"`
	CycleTitle      string   `json:"cycle_title,omitempty"`
	EmployeeID      string   `json:"employee_id"`
	EmployeeName    string   `json:"employee_name,omitempty"`
	ReviewerID      *string  `json:"reviewer_id"`
	SelfRating      *float64 `json:"self_rating"`
	SelfComments    string   `json:"self_comments"`
	ManagerRating   *float64 `json:"manager_rating"`
	ManagerComments string   `json:"manager_comments"`
	FinalScore      *float64 `json:"final_score"`
	Status          string   `json:"status"` // DRAFT, SUBMITTED_SELF, SUBMITTED_MANAGER, LOCKED
}

type PipPlan struct {
	ID           string    `json:"id"`
	EmployeeID   string    `json:"employee_id"`
	EmployeeName string    `json:"employee_name,omitempty"`
	ManagerID    *string   `json:"manager_id"`
	Reason       string    `json:"reason"`
	StartDate    string    `json:"start_date"`
	EndDate      string    `json:"end_date"`
	Status       string    `json:"status"` // ACTIVE, EXTENDED, SUCCESSFUL, UNSUCCESSFUL
	Remarks      string    `json:"remarks"`
	CreatedAt    time.Time `json:"created_at"`
}

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) RegisterRoutes(r chi.Router) {
	r.Get("/cycles", s.HandleGetCycles)
	r.Post("/cycles", s.HandleCreateCycle)
	r.Get("/goals", s.HandleGetGoals)
	r.Post("/goals", s.HandleCreateGoal)
	r.Patch("/goals/{id}", s.HandleUpdateGoal)
	r.Get("/reviews", s.HandleGetReviews)
	r.Post("/reviews", s.HandleSaveReview)
	r.Get("/pip", s.HandleGetPipPlans)
	r.Post("/pip", s.HandleCreatePipPlan)
}

func (s *Service) HandleGetCycles(w http.ResponseWriter, r *http.Request) {
	cycles := []PerformanceCycle{
		{
			ID:        "c0111111-1111-1111-1111-111111111111",
			Title:     "FY26 Annual Performance Review",
			StartDate: "2026-04-01",
			EndDate:   "2027-03-31",
			Status:    "ACTIVE",
			CreatedAt: time.Now().AddDate(0, -2, 0),
		},
		{
			ID:        "c0222222-2222-2222-2222-222222222222",
			Title:     "Q2 2026 Mid-Year Check-in",
			StartDate: "2026-07-01",
			EndDate:   "2026-09-30",
			Status:    "REVIEW_IN_PROGRESS",
			CreatedAt: time.Now().AddDate(0, -1, 0),
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"data": cycles})
}

func (s *Service) HandleCreateCycle(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Title     string `json:"title"`
		StartDate string `json:"start_date"`
		EndDate   string `json:"end_date"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	cycle := PerformanceCycle{
		ID:        uuid.New().String(),
		Title:     input.Title,
		StartDate: input.StartDate,
		EndDate:   input.EndDate,
		Status:    "ACTIVE",
		CreatedAt: time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"data": cycle, "message": "Cycle created successfully"})
}

func (s *Service) HandleGetGoals(w http.ResponseWriter, r *http.Request) {
	goals := []PerformanceGoal{
		{
			ID:           "g0111111-1111-1111-1111-111111111111",
			EmployeeID:   "e0111111-1111-1111-1111-111111111111",
			EmployeeName: "Aarav Sharma",
			Title:        "Deliver Enterprise HRMS Microservices Architecture",
			Description:  "Refactor core modules to Go microservices with sub-50ms p99 latency.",
			Category:     "INDIVIDUAL",
			TargetValue:  100,
			CurrentValue: 85,
			Weightage:    40,
			Status:       "IN_PROGRESS",
		},
		{
			ID:           "g0222222-2222-2222-2222-222222222222",
			EmployeeID:   "e0111111-1111-1111-1111-111111111111",
			EmployeeName: "Aarav Sharma",
			Title:        "Achieve 95%+ Unit Test Coverage across Frontend Core",
			Description:  "Implement automated end-to-end component testing.",
			Category:     "TEAM",
			TargetValue:  95,
			CurrentValue: 92,
			Weightage:    30,
			Status:       "IN_PROGRESS",
		},
		{
			ID:           "g0333333-3333-3333-3333-333333333333",
			EmployeeID:   "e0222222-2222-2222-2222-222222222222",
			EmployeeName: "Priya Patel",
			Title:        "Automate Indian Statutory Tax Computation Engine",
			Description:  "Integrate Tax Regime 2026/27 deductions into payroll processing.",
			Category:     "INDIVIDUAL",
			TargetValue:  100,
			CurrentValue: 100,
			Weightage:    30,
			Status:       "COMPLETED",
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"data": goals})
}

func (s *Service) HandleCreateGoal(w http.ResponseWriter, r *http.Request) {
	var g PerformanceGoal
	if err := json.NewDecoder(r.Body).Decode(&g); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	g.ID = uuid.New().String()
	g.Status = "IN_PROGRESS"

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"data": g, "message": "Goal created successfully"})
}

func (s *Service) HandleUpdateGoal(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var input struct {
		CurrentValue float64 `json:"current_value"`
		Status       string  `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":            id,
		"current_value": input.CurrentValue,
		"status":        input.Status,
		"message":       "Goal progress updated",
	})
}

func (s *Service) HandleGetReviews(w http.ResponseWriter, r *http.Request) {
	self45 := 4.5
	self40 := 4.0
	mgr48 := 4.8
	mgr42 := 4.2
	final465 := 4.65

	reviews := []PerformanceReview{
		{
			ID:              "r0111111-1111-1111-1111-111111111111",
			CycleID:         "c0111111-1111-1111-1111-111111111111",
			CycleTitle:      "FY26 Annual Performance Review",
			EmployeeID:      "e0111111-1111-1111-1111-111111111111",
			EmployeeName:    "Aarav Sharma",
			SelfRating:      &self45,
			SelfComments:    "Successfully delivered core microservices and optimized API throughput.",
			ManagerRating:   &mgr48,
			ManagerComments: "Exceptional technical execution and leadership during major release.",
			FinalScore:      &final465,
			Status:          "SUBMITTED_MANAGER",
		},
		{
			ID:              "r0222222-2222-2222-2222-222222222222",
			CycleID:         "c0111111-1111-1111-1111-111111111111",
			CycleTitle:      "FY26 Annual Performance Review",
			EmployeeID:      "e0222222-2222-2222-2222-222222222222",
			EmployeeName:    "Priya Patel",
			SelfRating:      &self40,
			SelfComments:    "Automated payroll statutory compliance engine ahead of deadline.",
			ManagerRating:   &mgr42,
			ManagerComments: "Great domain expertise and attention to regulatory details.",
			Status:          "SUBMITTED_SELF",
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"data": reviews})
}

func (s *Service) HandleSaveReview(w http.ResponseWriter, r *http.Request) {
	var rev PerformanceReview
	if err := json.NewDecoder(r.Body).Decode(&rev); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	rev.ID = uuid.New().String()
	rev.Status = "SUBMITTED_SELF"

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"data": rev, "message": "Review submitted successfully"})
}

func (s *Service) HandleGetPipPlans(w http.ResponseWriter, r *http.Request) {
	pips := []PipPlan{
		{
			ID:           "p0111111-1111-1111-1111-111111111111",
			EmployeeID:   "e0333333-3333-3333-3333-333333333333",
			EmployeeName: "Vikram Malhotra",
			Reason:       "Underperformance in Q2 SLA targets and missed sprint deliverables.",
			StartDate:    "2026-08-01",
			EndDate:      "2026-10-31",
			Status:       "ACTIVE",
			Remarks:      "Bi-weekly performance check-ins scheduled with engineering manager.",
			CreatedAt:    time.Now().AddDate(0, -1, 0),
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"data": pips})
}

func (s *Service) HandleCreatePipPlan(w http.ResponseWriter, r *http.Request) {
	var p PipPlan
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	p.ID = uuid.New().String()
	p.Status = "ACTIVE"
	p.CreatedAt = time.Now()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"data": p, "message": "PIP plan created successfully"})
}
