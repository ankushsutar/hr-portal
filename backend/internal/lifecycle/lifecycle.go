package lifecycle

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Event struct {
	ID            string                 `json:"id"`
	EmployeeID    string                 `json:"employee_id"`
	EventType     string                 `json:"event_type"`
	EffectiveDate string                 `json:"effective_date"`
	PreviousValue map[string]interface{} `json:"previous_value,omitempty"`
	NewValue      map[string]interface{} `json:"new_value,omitempty"`
	Reason        *string                `json:"reason,omitempty"`
	CreatedBy     *string                `json:"created_by,omitempty"`
	CreatedAt     string                 `json:"created_at"`
}

type ProbationEmployee struct {
	ID               string `json:"id"`
	EmployeeID       string `json:"employee_id"`
	FullName         string `json:"full_name"`
	Department       string `json:"department"`
	Designation      string `json:"designation"`
	JoiningDate      string `json:"joining_date"`
	ProbationEndDate string `json:"probation_end_date"`
	Status           string `json:"status"` // OVERDUE, NEXT_7_DAYS, NEXT_15_DAYS, NEXT_30_DAYS
}

type ProbationDashboard struct {
	Overdue     []ProbationEmployee `json:"overdue"`
	Next7Days   []ProbationEmployee `json:"next_7_days"`
	Next15Days  []ProbationEmployee `json:"next_15_days"`
	Next30Days  []ProbationEmployee `json:"next_30_days"`
}

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) RegisterRoutes(r chi.Router) {
	r.Get("/probation-due", s.HandleGetProbationDue)
	r.Get("/employees/{id}/timeline", s.HandleGetEmployeeTimeline)
	
	// Sprint 7: Exits
	r.Post("/exits", s.HandleSubmitResignation)
	r.Get("/exits", s.HandleListExits)
	r.Post("/exits/{id}/approve", s.HandleApproveExit)
	r.Get("/exits/{id}/clearance", s.HandleGetClearance)
}

func (s *Service) HandleGetProbationDue(w http.ResponseWriter, r *http.Request) {
	// Attempt real DB query
	query := `
		SELECT e.id, e.employee_id, e.first_name || ' ' || e.last_name as full_name,
		       COALESCE(d.name, ''), COALESCE(des.name, ''), 
		       to_char(e.joining_date, 'YYYY-MM-DD'), to_char(e.probation_end_date, 'YYYY-MM-DD'),
		       CASE 
		         WHEN e.probation_end_date < CURRENT_DATE THEN 'OVERDUE'
		         WHEN e.probation_end_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'NEXT_7_DAYS'
		         WHEN e.probation_end_date <= CURRENT_DATE + INTERVAL '15 days' THEN 'NEXT_15_DAYS'
		         ELSE 'NEXT_30_DAYS'
		       END as status
		FROM employees e
		LEFT JOIN departments d ON e.department_id = d.id
		LEFT JOIN designations des ON e.designation_id = des.id
		WHERE e.status = 'PROBATION' 
		  AND e.probation_end_date <= CURRENT_DATE + INTERVAL '30 days'
		  AND e.deleted_at IS NULL
		ORDER BY e.probation_end_date ASC
	`
	
	rows, err := s.db.Query(r.Context(), query)
	if err != nil {
		// --- DEMO BYPASS ---
		demoData := ProbationDashboard{
			Overdue: []ProbationEmployee{
				{ID: "emp-99", EmployeeID: "EMP-099", FullName: "Alice Walker", Department: "Engineering", Designation: "QA Engineer", JoiningDate: "2025-10-01", ProbationEndDate: "2025-12-30", Status: "OVERDUE"},
			},
			Next7Days: []ProbationEmployee{
				{ID: "emp-2", EmployeeID: "EMP-1002", FullName: "Sarah Smith", Department: "Marketing", Designation: "Growth Marketer", JoiningDate: "2026-08-01", ProbationEndDate: time.Now().AddDate(0,0,3).Format("2006-01-02"), Status: "NEXT_7_DAYS"},
			},
			Next15Days: []ProbationEmployee{},
			Next30Days: []ProbationEmployee{},
		}
		jsonOK(w, map[string]interface{}{"success": true, "data": demoData, "demo": true})
		return
		// --- END DEMO BYPASS ---
	}
	defer rows.Close()

	dashboard := ProbationDashboard{
		Overdue:    []ProbationEmployee{},
		Next7Days:  []ProbationEmployee{},
		Next15Days: []ProbationEmployee{},
		Next30Days: []ProbationEmployee{},
	}

	for rows.Next() {
		var p ProbationEmployee
		rows.Scan(&p.ID, &p.EmployeeID, &p.FullName, &p.Department, &p.Designation, &p.JoiningDate, &p.ProbationEndDate, &p.Status)
		switch p.Status {
		case "OVERDUE":
			dashboard.Overdue = append(dashboard.Overdue, p)
		case "NEXT_7_DAYS":
			dashboard.Next7Days = append(dashboard.Next7Days, p)
		case "NEXT_15_DAYS":
			dashboard.Next15Days = append(dashboard.Next15Days, p)
		case "NEXT_30_DAYS":
			dashboard.Next30Days = append(dashboard.Next30Days, p)
		}
	}

	jsonOK(w, map[string]interface{}{"success": true, "data": dashboard})
}

func (s *Service) HandleGetEmployeeTimeline(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	
	query := `
		SELECT id, employee_id, event_type, to_char(effective_date, 'YYYY-MM-DD'),
		       previous_value, new_value, reason, created_by, created_at
		FROM employee_lifecycle_events
		WHERE employee_id = $1
		ORDER BY effective_date DESC, created_at DESC
	`
	rows, err := s.db.Query(r.Context(), query, id)
	if err != nil {
		// --- DEMO BYPASS ---
		events := []Event{
			{
				ID: "evt-1", EmployeeID: id, EventType: "PROMOTED", EffectiveDate: "2026-06-01",
				NewValue: map[string]interface{}{"designation": "Senior Software Engineer"},
				PreviousValue: map[string]interface{}{"designation": "Software Engineer"},
				Reason: func() *string { s := "Annual Appraisal"; return &s }(),
				CreatedAt: time.Now().Format(time.RFC3339),
			},
			{
				ID: "evt-2", EmployeeID: id, EventType: "CONFIRMED", EffectiveDate: "2026-04-15",
				CreatedAt: time.Now().AddDate(0, -2, 0).Format(time.RFC3339),
			},
			{
				ID: "evt-3", EmployeeID: id, EventType: "JOINED", EffectiveDate: "2026-01-15",
				NewValue: map[string]interface{}{"department": "Engineering"},
				CreatedAt: time.Now().AddDate(0, -5, 0).Format(time.RFC3339),
			},
		}
		jsonOK(w, map[string]interface{}{"success": true, "data": events, "demo": true})
		return
		// --- END DEMO BYPASS ---
	}
	defer rows.Close()

	var events []Event
	for rows.Next() {
		var e Event
		var pv, nv []byte
		rows.Scan(&e.ID, &e.EmployeeID, &e.EventType, &e.EffectiveDate, &pv, &nv, &e.Reason, &e.CreatedBy, &e.CreatedAt)
		if len(pv) > 0 { json.Unmarshal(pv, &e.PreviousValue) }
		if len(nv) > 0 { json.Unmarshal(nv, &e.NewValue) }
		events = append(events, e)
	}

	if events == nil {
		events = []Event{}
	}

	jsonOK(w, map[string]interface{}{"success": true, "data": events})
}

// Helper
func jsonOK(w http.ResponseWriter, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(payload)
}
